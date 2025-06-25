
import { GoogleApiLoader } from './GoogleApiLoader';

export class GoogleAuthService {
  private clientId: string = '';
  private accessToken: string = '';
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing GoogleAuthService...');
      
      // Get client ID from Supabase secrets via edge function
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('get-google-config');
      if (error) {
        console.error('Failed to get Google configuration:', error);
        throw new Error('Failed to get Google configuration: ' + error.message);
      }
      
      if (!data?.clientId) {
        throw new Error('Google Client ID not configured');
      }
      
      this.clientId = data.clientId;
      console.log('Got Google Client ID successfully');

      // Load Google APIs
      await GoogleApiLoader.loadGoogleAPIs();
      await GoogleApiLoader.loadGoogleIdentityServices();

      // Initialize GAPI client
      console.log('Initializing GAPI client...');
      await window.gapi.client.init({
        apiKey: '',
        discoveryDocs: [
          'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest',
          'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
        ]
      });

      this.isInitialized = true;
      console.log('GoogleAuthService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google API:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  async signIn(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        throw new Error('Google API not initialized. Call initialize() first.');
      }

      if (!this.clientId) {
        throw new Error('Google Client ID not available');
      }

      console.log('Starting Google sign-in with popup...');

      // Try popup first - this happens immediately on user click
      try {
        const result = await this.signInWithPopup();
        return result;
      } catch (popupError) {
        console.log('Popup failed, falling back to redirect:', popupError);
        // Automatically fall back to redirect
        return this.signInWithRedirect();
      }
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw new Error(`Failed to sign in to Google: ${error.message}`);
    }
  }

  private signInWithPopup(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive.readonly',
          callback: (response: any) => {
            console.log('OAuth popup response received:', response);
            
            if (response.error) {
              console.error('OAuth popup error:', response.error);
              reject(new Error(`OAuth error: ${response.error}`));
              return;
            }
            
            if (response.access_token) {
              this.accessToken = response.access_token;
              window.gapi.client.setToken({ access_token: response.access_token });
              console.log('Access token set successfully via popup');
              resolve(true);
            } else {
              console.error('No access token in popup response:', response);
              reject(new Error('No access token received from Google'));
            }
          },
          error_callback: (error: any) => {
            console.error('Token client popup error:', error);
            reject(new Error(`Popup authentication failed`));
          }
        });

        console.log('Requesting access token with popup...');
        // Set a timeout to catch popup failures
        const timeoutId = setTimeout(() => {
          reject(new Error('Popup timeout - likely blocked'));
        }, 3000);

        // Clear timeout if callback is called
        const originalCallback = tokenClient.callback;
        tokenClient.callback = (response: any) => {
          clearTimeout(timeoutId);
          originalCallback(response);
        };

        tokenClient.requestAccessToken({ 
          prompt: 'consent',
          include_granted_scopes: true
        });
      } catch (error) {
        console.error('Error creating token client for popup:', error);
        reject(error);
      }
    });
  }

  private signInWithRedirect(): boolean {
    const redirectUri = `${window.location.origin}/dashboard`;
    const scope = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive.readonly';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${this.clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(scope)}&` +
      `include_granted_scopes=true&` +
      `state=${Date.now()}`;
    
    console.log('Redirecting to Google OAuth (popup fallback):', authUrl);
    window.location.href = authUrl;
    return true;
  }

  handleRedirectCallback(): boolean {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      
      if (accessToken) {
        this.accessToken = accessToken;
        window.gapi.client.setToken({ access_token: accessToken });
        console.log('Access token set successfully via redirect');
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return true;
      }
    }
    return false;
  }

  getAccessToken(): string {
    return this.accessToken;
  }

  getClientId(): string {
    return this.clientId;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  signOut(): void {
    this.accessToken = '';
    if (window.gapi?.client) {
      window.gapi.client.setToken(null);
    }
    console.log('Signed out from Google services');
  }
}
