
// TypeScript declarations for Google APIs
declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

export interface GmailAttachment {
  filename: string;
  mimeType: string;
  data: string;
  size: number;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
}
