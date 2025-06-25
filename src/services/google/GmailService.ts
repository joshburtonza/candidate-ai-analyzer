
import { GmailAttachment } from './types';

export class GmailService {
  constructor(private accessToken: string) {}

  async searchAttachments(): Promise<File[]> {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated with Google');
      }

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
            if (part.filename && this.isCVFile(part.filename) && part.body?.attachmentId) {
              const attachment = await this.downloadAttachment(message.id, part.body.attachmentId);
              if (attachment) {
                const file = this.createFileFromAttachment(attachment, part.filename);
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

  private async downloadAttachment(messageId: string, attachmentId: string): Promise<GmailAttachment | null> {
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

  private createFileFromAttachment(attachment: GmailAttachment, filename: string): File {
    // Decode base64 data
    const binaryString = atob(attachment.data.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: attachment.mimeType });
    return new File([blob], filename, { type: attachment.mimeType });
  }
}
