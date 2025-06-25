
export class DriveService {
  constructor(private clientId: string, private accessToken: string) {}

  async openPicker(): Promise<File[]> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.accessToken) {
          reject(new Error('Not authenticated with Google'));
          return;
        }

        // Load Google Picker API
        window.gapi.load('picker', () => {
          const picker = new window.google.picker.PickerBuilder()
            .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
            .setDeveloperKey(this.clientId)
            .setOAuthToken(this.accessToken)
            .addView(new window.google.picker.DocsView()
              .setIncludeFolders(true)
              .setMimeTypes('application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'))
            .setCallback(async (data: any) => {
              if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
                try {
                  const files = await this.downloadFiles(data[window.google.picker.Response.DOCUMENTS]);
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

  private async downloadFiles(documents: any[]): Promise<File[]> {
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
}
