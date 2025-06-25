
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

  async searchGmailAttachments(): Promise<File[]> {
    const accessToken = this.authService.getAccessToken();
    const gmailService = new GmailService(accessToken);
    return await gmailService.searchAttachments();
  }

  async openDrivePicker(): Promise<File[]> {
    const accessToken = this.authService.getAccessToken();
    const clientId = this.authService.getClientId();
    const driveService = new DriveService(clientId, accessToken);
    return await driveService.openPicker();
  }
}
