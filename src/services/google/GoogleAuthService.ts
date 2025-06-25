
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

      // Load Google Identity Services and GAPI
      console.log('Loading Google APIs...');
      await Promise.all([
        GoogleApiLoader.loadGoogleIdentityServices(),
        GoogleApiLoader.loadGoogleAPIs()
      ]);

      // Initialize GAPI client
      console.log('Initializing GAPI client...');
      await window.gapi.client.init({
        apiKey: '', // We don't need API key for OAuth flow
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

      console.log('Starting Google sign-in process...');

      return new Promise((resolve, reject) => {
        try {
          // Create the token client
          const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: this.clientId,
            scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive.readonly',
            callback: (response: any) => {
              console.log('OAuth response received:', response);
              
              if (response.error) {
                console.error('OAuth error:', response.error);
                reject(new Error(`OAuth error: ${response.error}`));
                return;
              }
              
              if (response.access_token) {
                this.accessToken = response.access_token;
                // Set the access token for GAPI client
                window.gapi.client.setToken({ access_token: response.access_token });
                console.log('Access token set successfully');
                resolve(true);
              } else {
                console.error('No access token in response:', response);
                reject(new Error('No access token received from Google'));
              }
            },
            error_callback: (error: any) => {
              console.error('Token client error:', error);
              reject(new Error(`Token client error: ${error.message || 'Unknown error'}`));
            }
          });

          // Request access token with popup
          console.log('Requesting access token with popup...');
          tokenClient.requestAccessToken({ 
            prompt: 'consent',
            hint: '',
            hosted_domain: ''
          });
        } catch (error) {
          console.error('Error creating token client:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw new Error(`Failed to sign in to Google: ${error.message}`);
    }
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
