
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

      console.log('Starting Google sign-in with basic profile scopes...');

      // Start with basic profile scopes only
      const result = await this.signInWithBasicScopes();
      return result;
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw new Error(`Failed to sign in to Google: ${error.message}`);
    }
  }

  private signInWithBasicScopes(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
          callback: (response: any) => {
            console.log('Basic OAuth response received:', response);
            
            if (response.error) {
              console.error('OAuth error:', response.error);
              reject(new Error(`OAuth error: ${response.error}`));
              return;
            }
            
            if (response.access_token) {
              this.accessToken = response.access_token;
              window.gapi.client.setToken({ access_token: response.access_token });
              console.log('Basic access token set successfully');
              resolve(true);
            } else {
              console.error('No access token in response:', response);
              reject(new Error('No access token received from Google'));
            }
          },
          error_callback: (error: any) => {
            console.error('Token client error:', error);
            reject(new Error(`Authentication failed: ${error.type || 'Unknown error'}`));
          }
        });

        console.log('Requesting basic profile access...');
        tokenClient.requestAccessToken({ 
          prompt: 'consent',
          include_granted_scopes: true
        });
      } catch (error) {
        console.error('Error creating token client:', error);
        reject(error);
      }
    });
  }

  async requestAdditionalScopes(scopes: string[]): Promise<boolean> {
    if (!this.clientId) {
      throw new Error('Google Client ID not available');
    }

    return new Promise((resolve, reject) => {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: scopes.join(' '),
          callback: (response: any) => {
            console.log('Additional scopes response:', response);
            
            if (response.error) {
              console.error('Additional scopes error:', response.error);
              reject(new Error(`Failed to get additional permissions: ${response.error}`));
              return;
            }
            
            if (response.access_token) {
              this.accessToken = response.access_token;
              window.gapi.client.setToken({ access_token: response.access_token });
              console.log('Additional scopes granted successfully');
              resolve(true);
            } else {
              reject(new Error('No access token received for additional scopes'));
            }
          },
          error_callback: (error: any) => {
            console.error('Additional scopes token client error:', error);
            reject(new Error(`Failed to get additional permissions: ${error.type || 'Unknown error'}`));
          }
        });

        console.log('Requesting additional scopes:', scopes);
        tokenClient.requestAccessToken({ 
          prompt: 'consent',
          include_granted_scopes: true
        });
      } catch (error) {
        console.error('Error requesting additional scopes:', error);
        reject(error);
      }
    });
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
