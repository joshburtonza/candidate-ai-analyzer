
import { GoogleAuthService } from './google/GoogleAuthService';
import { GmailService } from './google/GmailService';
import { DriveService } from './google/DriveService';

export class GoogleApiService {
  private authService = new GoogleAuthService();

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
    if (!this.authService.isAuthenticated()) {
      throw new Error('Not authenticated with Google');
    }
    
    try {
      // Request Gmail permissions if not already granted
      await this.authService.requestAdditionalScopes(['https://www.googleapis.com/auth/gmail.readonly']);
      
      const accessToken = this.authService.getAccessToken();
      const gmailService = new GmailService(accessToken);
      return await gmailService.searchAttachments();
    } catch (error: any) {
      console.error('Gmail access error:', error);
      throw new Error(`Gmail access denied: ${error.message}`);
    }
  }

  async openDrivePicker(): Promise<File[]> {
    if (!this.authService.isAuthenticated()) {
      throw new Error('Not authenticated with Google');
    }
    
    try {
      // Request Drive permissions if not already granted
      await this.authService.requestAdditionalScopes(['https://www.googleapis.com/auth/drive.readonly']);
      
      const accessToken = this.authService.getAccessToken();
      const clientId = this.authService.getClientId();
      const driveService = new DriveService(clientId, accessToken);
      return await driveService.openPicker();
    } catch (error: any) {
      console.error('Drive access error:', error);
      throw new Error(`Drive access denied: ${error.message}`);
    }
  }
}
