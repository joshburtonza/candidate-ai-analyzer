
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Drive, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface GoogleDocUploadProps {
  onUploadComplete: (files: File[]) => void;
}

export const GoogleDocUpload = ({ onUploadComplete }: GoogleDocUploadProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const handleGoogleAuth = async () => {
    setIsConnecting(true);
    try {
      // Initialize Google Auth for document access
      const response = await new Promise((resolve, reject) => {
        if (typeof window.google === 'undefined') {
          // Load Google API if not already loaded
          const script = document.createElement('script');
          script.src = 'https://apis.google.com/js/api.js';
          script.onload = () => {
            window.gapi.load('auth2', () => {
              window.gapi.auth2.init({
                client_id: 'YOUR_GOOGLE_CLIENT_ID', // This would need to be configured
                scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive.readonly'
              }).then(resolve).catch(reject);
            });
          };
          document.head.appendChild(script);
        } else {
          resolve(window.gapi.auth2.getAuthInstance());
        }
      });

      setIsConnected(true);
      toast({
        title: "Connected to Google",
        description: "You can now import documents from Gmail and Google Drive",
      });
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast({
        title: "Connection failed",
        description: "Failed to connect to Google services",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGmailImport = async () => {
    if (!isConnected) return;
    
    try {
      // This would implement Gmail API to fetch attachments
      toast({
        title: "Gmail import",
        description: "Searching for CV attachments in your Gmail...",
      });
      
      // Placeholder for Gmail API integration
      // In a real implementation, this would:
      // 1. Search for emails with PDF/DOC attachments
      // 2. Filter for CV-like attachments
      // 3. Download and convert to File objects
      // 4. Call onUploadComplete with the files
      
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDriveImport = async () => {
    if (!isConnected) return;
    
    try {
      toast({
        title: "Google Drive import",
        description: "Accessing your Google Drive files...",
      });
      
      // Placeholder for Google Drive API integration
      // In a real implementation, this would:
      // 1. Open Drive picker
      // 2. Allow user to select CV files
      // 3. Download selected files
      // 4. Call onUploadComplete with the files
      
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="chrome-glass p-6 rounded-xl">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Import from Google</h3>
          <p className="text-gray-300 text-sm">Connect your Google account to import CVs from Gmail or Drive</p>
        </div>

        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Button
              onClick={handleGoogleAuth}
              disabled={isConnecting}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isConnecting ? 'Connecting...' : 'Connect Google Account'}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Button
              onClick={handleGmailImport}
              variant="outline"
              className="bg-white/5 backdrop-blur-xl border border-orange-500/30 text-white hover:bg-white/10 font-medium py-6 flex flex-col items-center gap-2"
            >
              <Mail className="w-6 h-6 text-orange-500" />
              <div>
                <div className="font-semibold">Gmail</div>
                <div className="text-xs text-gray-400">Import CV attachments</div>
              </div>
            </Button>

            <Button
              onClick={handleDriveImport}
              variant="outline"
              className="bg-white/5 backdrop-blur-xl border border-orange-500/30 text-white hover:bg-white/10 font-medium py-6 flex flex-col items-center gap-2"
            >
              <Drive className="w-6 h-6 text-orange-500" />
              <div>
                <div className="font-semibold">Google Drive</div>
                <div className="text-xs text-gray-400">Select CV files</div>
              </div>
            </Button>
          </motion.div>
        )}
      </div>
    </Card>
  );
};
