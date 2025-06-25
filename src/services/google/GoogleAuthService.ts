
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

      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: this.handleCredentialResponse.bind(this),
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Google API:', error);
      throw error;
    }
  }

  async signIn(): Promise<boolean> {
    try {
      // Use Google OAuth2 flow for accessing APIs
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive.readonly',
        callback: (response: any) => {
          if (response.access_token) {
            this.accessToken = response.access_token;
            // Initialize GAPI client with the access token
            window.gapi.client.setToken({ access_token: response.access_token });
          }
        },
      });

      return new Promise((resolve, reject) => {
        tokenClient.callback = (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          if (response.access_token) {
            this.accessToken = response.access_token;
            window.gapi.client.setToken({ access_token: response.access_token });
            resolve(true);
          } else {
            reject(new Error('No access token received'));
          }
        };
        
        tokenClient.requestAccessToken({ prompt: 'consent' });
      });
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw new Error('Failed to sign in to Google');
    }
  }

  getAccessToken(): string {
    return this.accessToken;
  }

  getClientId(): string {
    return this.clientId;
  }

  private handleCredentialResponse(response: any) {
    // This is for ID token flow, we'll use OAuth flow instead
    console.log('Credential response received:', response);
  }
}
