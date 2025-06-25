
import { supabase } from '@/integrations/supabase/client';

// TypeScript declarations for Google APIs
declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

interface GmailAttachment {
  filename: string;
  mimeType: string;
  data: string;
  size: number;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
}

export class GoogleApiService {
  private isInitialized = false;
  private clientId: string = '';

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Get client ID from Supabase secrets via edge function
      const { data, error } = await supabase.functions.invoke('get-google-config');
      if (error) throw new Error('Failed to get Google configuration');
      
      this.clientId = data.clientId;

      // Load Google API scripts
      await this.loadGoogleAPIs();
      
      // Initialize Google Auth
      await new Promise((resolve, reject) => {
        window.gapi.load('auth2', () => {
          window.gapi.auth2.init({
            client_id: this.clientId,
            scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive.readonly'
          }).then(resolve).catch(reject);
        });
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Google API:', error);
      throw error;
    }
  }

  private async loadGoogleAPIs(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', resolve);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<boolean> {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      return user.isSignedIn();
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw new Error('Failed to sign in to Google');
    }
  }

  async searchGmailAttachments(): Promise<File[]> {
    try {
      await window.gapi.client.load('gmail', 'v1');
      
      // Search for emails with PDF/DOC attachments
      const query = 'has:attachment (filename:pdf OR filename:doc OR filename:docx) (cv OR resume OR curriculum)';
      
      const response = await window.gapi.client.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 10
      });

      const messages = response.result.messages || [];
      const files: File[] = [];

      for (const message of messages) {
        try {
          const messageDetails = await window.gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: message.id
          });

          const parts = this.extractMessageParts(messageDetails.result);
          
          for (const part of parts) {
            if (part.filename && this.isCVFile(part.filename) && part.body?.data) {
              const attachment = await this.downloadGmailAttachment(message.id, part.body.attachmentId);
              if (attachment) {
                const file = this.createFileFromAttachment(attachment);
                files.push(file);
              }
            }
          }
        } catch (error) {
          console.error('Error processing message:', error);
          // Continue with other messages
        }
      }

      return files;
    } catch (error) {
      console.error('Gmail search failed:', error);
      throw new Error('Failed to search Gmail attachments');
    }
  }

  async openDrivePicker(): Promise<File[]> {
    return new Promise((resolve, reject) => {
      try {
        // Load Google Picker API
        window.gapi.load('picker', () => {
          const picker = new window.google.picker.PickerBuilder()
            .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
            .setDeveloperKey(this.clientId)
            .setOAuthToken(window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token)
            .addView(new window.google.picker.DocsView()
              .setIncludeFolders(true)
              .setMimeTypes('application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'))
            .setCallback(async (data: any) => {
              if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
                try {
                  const files = await this.downloadDriveFiles(data[window.google.picker.Response.DOCUMENTS]);
                  resolve(files);
                } catch (error) {
                  reject(error);
                }
              } else if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.CANCEL) {
                resolve([]);
              }
            })
            .build();
          
          picker.setVisible(true);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private extractMessageParts(message: any): any[] {
    const parts: any[] = [];
    
    if (message.payload?.parts) {
      for (const part of message.payload.parts) {
        if (part.parts) {
          parts.push(...this.extractMessageParts({ payload: part }));
        } else if (part.filename) {
          parts.push(part);
        }
      }
    } else if (message.payload?.filename) {
      parts.push(message.payload);
    }
    
    return parts;
  }

  private isCVFile(filename: string): boolean {
    const lowerName = filename.toLowerCase();
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const cvKeywords = ['cv', 'resume', 'curriculum'];
    
    return validExtensions.some(ext => lowerName.endsWith(ext)) &&
           (cvKeywords.some(keyword => lowerName.includes(keyword)) || lowerName.length < 50);
  }

  private async downloadGmailAttachment(messageId: string, attachmentId: string): Promise<GmailAttachment | null> {
    try {
      const response = await window.gapi.client.gmail.users.messages.attachments.get({
        userId: 'me',
        messageId: messageId,
        id: attachmentId
      });

      return {
        filename: 'gmail-attachment.pdf',
        mimeType: 'application/pdf',
        data: response.result.data,
        size: response.result.size
      };
    } catch (error) {
      console.error('Failed to download Gmail attachment:', error);
      return null;
    }
  }

  private async downloadDriveFiles(documents: any[]): Promise<File[]> {
    const files: File[] = [];

    for (const doc of documents) {
      try {
        const response = await window.gapi.client.request({
          path: `https://www.googleapis.com/drive/v3/files/${doc.id}`,
          params: { alt: 'media' }
        });

        const blob = new Blob([response.body], { type: doc.mimeType });
        const file = new File([blob], doc.name, { type: doc.mimeType });
        files.push(file);
      } catch (error) {
        console.error('Failed to download Drive file:', error);
        // Continue with other files
      }
    }

    return files;
  }

  private createFileFromAttachment(attachment: GmailAttachment): File {
    // Decode base64 data
    const binaryString = atob(attachment.data.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: attachment.mimeType });
    return new File([blob], attachment.filename, { type: attachment.mimeType });
  }
}
