
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
    
    const accessToken = this.authService.getAccessToken();
    const gmailService = new GmailService(accessToken);
    return await gmailService.searchAttachments();
  }

  async openDrivePicker(): Promise<File[]> {
    if (!this.authService.isAuthenticated()) {
      throw new Error('Not authenticated with Google');
    }
    
    const accessToken = this.authService.getAccessToken();
    const clientId = this.authService.getClientId();
    const driveService = new DriveService(clientId, accessToken);
    return await driveService.openPicker();
  }
}
