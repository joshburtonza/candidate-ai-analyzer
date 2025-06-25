
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { GoogleApiService } from '@/services/GoogleApiService';

interface GoogleConnectButtonProps {
  onFilesImported: (files: File[]) => void;
}

export const GoogleConnectButton = ({ onFilesImported }: GoogleConnectButtonProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isImporting, setIsImporting] = useState({ gmail: false, drive: false });
  const { toast } = useToast();
  const googleApi = new GoogleApiService();

  useEffect(() => {
    // Check for OAuth redirect callback on page load
    const handleRedirectCallback = async () => {
      try {
        await googleApi.initialize();
        const isAuthenticated = googleApi.handleRedirectCallback();
        if (isAuthenticated) {
          setIsConnected(true);
          toast({
            title: "Connected to Google",
            description: "You're now signed in with Google. You can import documents from Gmail and Google Drive.",
          });
        }
      } catch (error) {
        console.error('Error handling redirect callback:', error);
      }
    };

    handleRedirectCallback();
  }, []);

  const handleGoogleAuth = async () => {
    setIsConnecting(true);
    
    try {
      console.log('Starting Google authentication...');
      
      toast({
        title: "Connecting to Google",
        description: "Please sign in with your Google account in the popup window.",
      });

      await googleApi.initialize();
      console.log('Google API initialized, requesting sign in...');
      
      const isSignedIn = await googleApi.signIn();
      
      if (isSignedIn) {
        setIsConnected(true);
        toast({
          title: "Successfully connected!",
          description: "You can now import CVs from Gmail and Google Drive. Additional permissions will be requested when you use each service.",
        });
        console.log('Successfully connected to Google');
      } else {
        throw new Error('Sign in was cancelled or failed');
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      
      setIsConnected(false);
      
      let errorMessage = "Connection failed";
      let description = "Unable to connect to Google services. ";
      
      if (error.message.includes('popup') || error.message.includes('blocked')) {
        description += "This might be due to popup blocking. Please allow popups for this site and try again.";
      } else if (error.message.includes('access_denied')) {
        description += "Access was denied. Please make sure to allow the requested permissions.";
      } else {
        description += "Please try again or check your internet connection.";
      }
      
      toast({
        title: errorMessage,
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setIsConnecting(false);
    
    try {
      googleApi.signOut();
      toast({
        title: "Disconnected",
        description: "You have been disconnected from Google services",
      });
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  };

  const handleGmailImport = async () => {
    setIsImporting(prev => ({ ...prev, gmail: true }));
    try {
      toast({
        title: "Requesting Gmail access",
        description: "Please grant permission to access your Gmail in the popup window...",
      });
      
      const files = await googleApi.searchGmailAttachments();
      
      if (files.length === 0) {
        toast({
          title: "No CVs found",
          description: "No CV attachments found in your Gmail. Try searching for emails with 'CV', 'resume', or 'curriculum' in the subject or content.",
        });
      } else {
        onFilesImported(files);
        toast({
          title: "Gmail import successful",
          description: `Found and imported ${files.length} CV file(s) from your Gmail`,
        });
      }
    } catch (error: any) {
      console.error('Gmail import error:', error);
      toast({
        title: "Gmail import failed",
        description: error.message || "Failed to import from Gmail. Please try again and make sure to grant the necessary permissions.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(prev => ({ ...prev, gmail: false }));
    }
  };

  const handleDriveImport = async () => {
    setIsImporting(prev => ({ ...prev, drive: true }));
    try {
      toast({
        title: "Requesting Drive access",
        description: "Please grant permission to access your Google Drive in the popup window...",
      });
      
      const files = await googleApi.openDrivePicker();
      
      if (files.length === 0) {
        toast({
          title: "No files selected",
          description: "No files were selected from Google Drive",
        });
      } else {
        onFilesImported(files);
        toast({
          title: "Drive import successful",
          description: `Imported ${files.length} file(s) from Google Drive`,
        });
      }
    } catch (error: any) {
      console.error('Drive import error:', error);
      toast({
        title: "Drive import failed",
        description: error.message || "Failed to import from Google Drive. Please try again and make sure to grant the necessary permissions.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(prev => ({ ...prev, drive: false }));
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col gap-3">
        <Button
          onClick={handleGoogleAuth}
          disabled={isConnecting}
          className="bg-white hover:bg-gray-100 text-gray-900 font-medium"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {isConnecting ? 'Connecting...' : 'Connect to Google'}
        </Button>
        
        <div className="text-center">
          <p className="text-xs text-gray-400">
            {isConnecting 
              ? 'Please complete the sign-in process in the popup window...' 
              : 'Import CVs from Gmail and Google Drive with secure authentication'
            }
          </p>
          {isConnecting && (
            <button 
              onClick={() => {
                setIsConnecting(false);
                toast({
                  title: "Connection cancelled",
                  description: "You can try connecting again",
                });
              }}
              className="text-xs text-gray-500 hover:text-gray-300 underline mt-1"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={handleGmailImport}
        disabled={isImporting.gmail}
        variant="outline"
        className="bg-white/10 border-orange-500/30 text-white hover:bg-white/20"
      >
        {isImporting.gmail ? 'Requesting Gmail access...' : 'Import from Gmail'}
      </Button>
      <Button
        onClick={handleDriveImport}
        disabled={isImporting.drive}
        variant="outline"
        className="bg-white/10 border-orange-500/30 text-white hover:bg-white/20"
      >
        {isImporting.drive ? 'Requesting Drive access...' : 'Import from Drive'}
      </Button>
      <Button
        onClick={handleDisconnect}
        variant="ghost"
        size="sm"
        className="text-gray-400 hover:text-white"
      >
        Disconnect
      </Button>
    </div>
  );
};
