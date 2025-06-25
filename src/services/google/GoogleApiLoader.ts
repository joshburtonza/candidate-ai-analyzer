
export class GoogleApiLoader {
  static async loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts) {
        console.log('Google Identity Services already loaded');
        resolve();
        return;
      }

      console.log('Loading Google Identity Services...');
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Identity Services loaded successfully');
        resolve();
      };
      script.onerror = (error) => {
        console.error('Failed to load Google Identity Services:', error);
        reject(new Error('Failed to load Google Identity Services'));
      };
      document.head.appendChild(script);
    });
  }

  static async loadGoogleAPIs(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        console.log('Google APIs already loaded');
        resolve();
        return;
      }

      console.log('Loading Google APIs...');
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google APIs script loaded, initializing client...');
        window.gapi.load('client', () => {
          console.log('Google API client loaded successfully');
          resolve();
        });
      };
      script.onerror = (error) => {
        console.error('Failed to load Google APIs:', error);
        reject(new Error('Failed to load Google APIs'));
      };
      document.head.appendChild(script);
    });
  }
}
