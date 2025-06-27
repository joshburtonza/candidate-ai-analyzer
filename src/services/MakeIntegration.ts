
export class MakeIntegration {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async sendCVData(files: File[], source: 'gmail' | 'drive'): Promise<void> {
    if (!this.webhookUrl) {
      console.log('No Make.com webhook URL configured, skipping integration');
      return;
    }

    try {
      console.log(`Sending ${files.length} files to Make.com from ${source}`);
      
      const payload = {
        timestamp: new Date().toISOString(),
        source: source,
        fileCount: files.length,
        files: files.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        })),
        origin: window.location.origin
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(payload)
      });

      console.log('Successfully sent data to Make.com');
    } catch (error) {
      console.error('Failed to send data to Make.com:', error);
      // Don't throw error to avoid breaking the main import flow
    }
  }
}
