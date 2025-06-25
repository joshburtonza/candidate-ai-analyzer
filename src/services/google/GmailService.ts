
export class GmailService {
  constructor(private accessToken: string) {}

  async searchAttachments(): Promise<File[]> {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated with Google');
      }

      console.log('Starting Gmail attachment search...');
      
      // Search for emails with attachments containing CV/resume keywords
      const query = 'has:attachment (filename:pdf OR filename:doc OR filename:docx) (subject:cv OR subject:resume OR subject:curriculum OR cv OR resume OR curriculum)';
      
      const response = await window.gapi.client.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 20
      });

      const messages = response.result.messages || [];
      console.log(`Found ${messages.length} messages with potential CV attachments`);
      
      const files: File[] = [];

      for (const message of messages.slice(0, 10)) { // Limit to 10 for performance
        try {
          const messageDetails = await window.gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });

          const parts = this.extractMessageParts(messageDetails.result);
          
          for (const part of parts) {
            if (part.filename && this.isCVFile(part.filename) && part.body?.attachmentId) {
              console.log(`Processing attachment: ${part.filename}`);
              
              const attachment = await this.downloadAttachment(message.id, part.body.attachmentId);
              if (attachment) {
                const file = this.createFileFromAttachment(attachment, part.filename, part.mimeType);
                files.push(file);
                console.log(`Successfully processed: ${part.filename}`);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing message ${message.id}:`, error);
          // Continue with other messages
        }
      }

      console.log(`Gmail search completed. Found ${files.length} CV files`);
      return files;
    } catch (error) {
      console.error('Gmail search failed:', error);
      throw new Error(`Failed to search Gmail attachments: ${error.message}`);
    }
  }

  private extractMessageParts(message: any): any[] {
    const parts: any[] = [];
    
    if (message.payload?.parts) {
      for (const part of message.payload.parts) {
        if (part.parts) {
          parts.push(...this.extractMessageParts({ payload: part }));
        } else if (part.filename && part.filename.length > 0) {
          parts.push(part);
        }
      }
    } else if (message.payload?.filename && message.payload.filename.length > 0) {
      parts.push(message.payload);
    }
    
    return parts;
  }

  private isCVFile(filename: string): boolean {
    const lowerName = filename.toLowerCase();
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const cvKeywords = ['cv', 'resume', 'curriculum'];
    
    const hasValidExtension = validExtensions.some(ext => lowerName.endsWith(ext));
    const hasCVKeyword = cvKeywords.some(keyword => lowerName.includes(keyword));
    const isReasonableSize = lowerName.length < 100; // Avoid very long filenames
    
    return hasValidExtension && (hasCVKeyword || isReasonableSize);
  }

  private async downloadAttachment(messageId: string, attachmentId: string): Promise<any | null> {
    try {
      const response = await window.gapi.client.gmail.users.messages.attachments.get({
        userId: 'me',
        messageId: messageId,
        id: attachmentId
      });

      return {
        data: response.result.data,
        size: response.result.size
      };
    } catch (error) {
      console.error('Failed to download Gmail attachment:', error);
      return null;
    }
  }

  private createFileFromAttachment(attachment: any, filename: string, mimeType?: string): File {
    try {
      // Decode base64 data (URL-safe base64)
      const base64Data = attachment.data.replace(/-/g, '+').replace(/_/g, '/');
      
      // Add padding if necessary
      const padding = '='.repeat((4 - base64Data.length % 4) % 4);
      const paddedData = base64Data + padding;
      
      const binaryString = atob(paddedData);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Determine MIME type from filename if not provided
      let fileMimeType = mimeType;
      if (!fileMimeType) {
        const extension = filename.toLowerCase().split('.').pop();
        switch (extension) {
          case 'pdf':
            fileMimeType = 'application/pdf';
            break;
          case 'doc':
            fileMimeType = 'application/msword';
            break;
          case 'docx':
            fileMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
          default:
            fileMimeType = 'application/octet-stream';
        }
      }

      const blob = new Blob([bytes], { type: fileMimeType });
      return new File([blob], filename, { type: fileMimeType });
    } catch (error) {
      console.error('Error creating file from attachment:', error);
      throw new Error(`Failed to process attachment: ${filename}`);
    }
  }
}
