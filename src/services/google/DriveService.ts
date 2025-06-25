
export class DriveService {
  constructor(private clientId: string, private accessToken: string) {}

  async openPicker(): Promise<File[]> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.accessToken) {
          reject(new Error('Not authenticated with Google'));
          return;
        }

        console.log('Loading Google Picker API...');
        
        // Load Google Picker API
        window.gapi.load('picker', () => {
          console.log('Google Picker API loaded, creating picker...');
          
          const picker = new window.google.picker.PickerBuilder()
            .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
            .setOAuthToken(this.accessToken)
            .addView(new window.google.picker.DocsView()
              .setIncludeFolders(true)
              .setSelectFolderEnabled(false)
              .setMimeTypes('application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain'))
            .addView(new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
              .setQuery('cv OR resume OR curriculum'))
            .setCallback(async (data: any) => {
              console.log('Picker callback data:', data);
              
              if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
                const documents = data[window.google.picker.Response.DOCUMENTS];
                console.log(`User selected ${documents.length} files`);
                
                try {
                  const files = await this.downloadFiles(documents);
                  resolve(files);
                } catch (error) {
                  console.error('Error downloading files:', error);
                  reject(error);
                }
              } else if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.CANCEL) {
                console.log('User cancelled file selection');
                resolve([]);
              }
            })
            .setTitle('Select CV/Resume Files')
            .setSize(1051, 650)
            .build();
          
          console.log('Opening Google Drive picker...');
          picker.setVisible(true);
        });
      } catch (error) {
        console.error('Error opening Google Drive picker:', error);
        reject(error);
      }
    });
  }

  private async downloadFiles(documents: any[]): Promise<File[]> {
    const files: File[] = [];
    console.log(`Starting download of ${documents.length} files...`);

    for (const doc of documents) {
      try {
        console.log(`Downloading: ${doc.name}`);
        
        // Get file metadata first
        const metadataResponse = await window.gapi.client.drive.files.get({
          fileId: doc.id,
          fields: 'name,mimeType,size'
        });

        const metadata = metadataResponse.result;
        console.log(`File metadata:`, metadata);

        // Download file content
        const response = await window.gapi.client.request({
          path: `https://www.googleapis.com/drive/v3/files/${doc.id}`,
          params: { alt: 'media' }
        });

        if (response.status === 200) {
          // Convert response body to blob
          let blob: Blob;
          
          if (typeof response.body === 'string') {
            // Handle text response
            blob = new Blob([response.body], { type: metadata.mimeType || 'application/octet-stream' });
          } else {
            // Handle binary response
            blob = new Blob([response.body], { type: metadata.mimeType || 'application/octet-stream' });
          }

          const file = new File([blob], metadata.name || doc.name, { 
            type: metadata.mimeType || 'application/octet-stream' 
          });
          
          files.push(file);
          console.log(`Successfully downloaded: ${metadata.name}`);
        } else {
          console.error(`Failed to download file ${doc.name}:`, response);
        }
      } catch (error) {
        console.error(`Failed to download Drive file ${doc.name}:`, error);
        // Continue with other files
      }
    }

    console.log(`Drive download completed. Successfully downloaded ${files.length} files`);
    return files;
  }
}
