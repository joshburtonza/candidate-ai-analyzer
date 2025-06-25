
import { GoogleApiLoader } from './GoogleApiLoader';

export class GoogleAuthService {
  private clientId: string = '';
  private accessToken: string = '';
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Get client ID from Supabase secrets via edge function
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('get-google-config');
      if (error) throw new Error('Failed to get Google configuration');
      
      this.clientId = data.clientId;

      // Load Google Identity Services and GAPI
      await Promise.all([
        GoogleApiLoader.loadGoogleIdentityServices(),
        GoogleApiLoader.loadGoogleAPIs()
      ]);

      // Initialize GAPI client
      await window.gapi.client.init({
        apiKey: '', // We don't need API key for OAuth flow
        discoveryDocs: [
          'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest',
          'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
        ]
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Google API:', error);
      throw error;
    }
  }

  async signIn(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        throw new Error('Google API not initialized');
      }

      return new Promise((resolve, reject) => {
        // Create the token client
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive.readonly',
          callback: (response: any) => {
            console.log('OAuth response:', response);
            
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
              reject(new Error('No access token received from Google'));
            }
          },
        });

        // Request access token with popup
        console.log('Requesting access token...');
        tokenClient.requestAccessToken({ 
          prompt: 'consent',
          hint: '',
          hosted_domain: ''
        });
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
  }
}
