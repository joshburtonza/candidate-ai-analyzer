
import { GoogleAuthService } from './google/GoogleAuthService';
import { GmailService } from './google/GmailService';
import { DriveService } from './google/DriveService';

export class GoogleApiService {
  private static instance: GoogleApiService;
  private authService = new GoogleAuthService();

  // Singleton pattern to maintain state across components
  static getInstance(): GoogleApiService {
    if (!GoogleApiService.instance) {
      GoogleApiService.instance = new GoogleApiService();
    }
    return GoogleApiService.instance;
  }

  async initialize(): Promise<void> {
    await this.authService.initialize();
  }

  async signIn(): Promise<boolean> {
    return await this.authService.signIn();
  }

  handleRedirectCallback(): boolean {
    return this.authService.handleRedirectCallback();
  }

  signOut(): void {
    this.authService.signOut();
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  async searchGmailAttachments(): Promise<File[]> {
    console.log('Gmail import: Starting search, authenticated:', this.isAuthenticated());
    
    if (!this.isAuthenticated()) {
      console.log('Gmail import: Not authenticated, requesting Gmail access...');
      // Request Gmail permissions directly instead of throwing error
      try {
        await this.authService.requestAdditionalScopes(['https://www.googleapis.com/auth/gmail.readonly']);
      } catch (error: any) {
        console.error('Gmail permission error:', error);
        throw new Error(`Gmail access denied: ${error.message}`);
      }
    }
    
    try {
      const accessToken = this.authService.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available after authentication');
      }
      
      console.log('Gmail import: Using access token for Gmail service');
      const gmailService = new GmailService(accessToken);
      return await gmailService.searchAttachments();
    } catch (error: any) {
      console.error('Gmail access error:', error);
      throw new Error(`Gmail access denied: ${error.message}`);
    }
  }

  async openDrivePicker(): Promise<File[]> {
    console.log('Drive import: Starting picker, authenticated:', this.isAuthenticated());
    
    if (!this.isAuthenticated()) {
      console.log('Drive import: Not authenticated, requesting Drive access...');
      // Request Drive permissions directly instead of throwing error
      try {
        await this.authService.requestAdditionalScopes(['https://www.googleapis.com/auth/drive.readonly']);
      } catch (error: any) {
        console.error('Drive permission error:', error);
        throw new Error(`Drive access denied: ${error.message}`);
      }
    }
    
    try {
      const accessToken = this.authService.getAccessToken();
      const clientId = this.authService.getClientId();
      
      if (!accessToken || !clientId) {
        throw new Error('Missing access token or client ID after authentication');
      }
      
      console.log('Drive import: Using access token for Drive service');
      const driveService = new DriveService(clientId, accessToken);
      return await driveService.openPicker();
    } catch (error: any) {
      console.error('Drive access error:', error);
      throw new Error(`Drive access denied: ${error.message}`);
    }
  }
}
