import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Mail, Check, X, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface GmailIntegration {
  id: string;
  gmail_email: string;
  is_active: boolean;
  created_at: string;
  watch_expiration?: string;
  token_expires_at: string;
}

export const GmailIntegration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<GmailIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchIntegrations();
    }
  }, [user]);

  const fetchIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('gmail_integrations')
        .select('id, gmail_email, is_active, created_at, watch_expiration, token_expires_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error: any) {
      console.error('Error fetching Gmail integrations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Gmail integrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGmailConnect = async () => {
    setConnecting(true);
    try {
      const callbackUrl = `${window.location.origin}/gmail-callback`;
      
      console.log('Initiating OAuth with callback URL:', callbackUrl);

      // Call edge function to initiate OAuth flow
      const { data, error } = await supabase.functions.invoke('gmail-oauth-init', {
        body: { redirect_uri: callbackUrl }
      });

      if (error) throw error;

      console.log('OAuth URL generated:', data.auth_url);

      // Open OAuth in a new window to bypass iframe restrictions
      const authWindow = window.open(
        data.auth_url,
        'gmail-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!authWindow) {
        // Fallback: try direct navigation if popup was blocked
        console.log('Popup blocked, trying direct navigation');
        window.location.href = data.auth_url;
        return;
      }

      // Monitor the popup window
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          setConnecting(false);
          // Refresh integrations to see if connection was successful
          fetchIntegrations();
        }
      }, 1000);

      // Set a timeout to stop checking after 5 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        if (!authWindow.closed) {
          authWindow.close();
        }
        setConnecting(false);
      }, 300000); // 5 minutes

    } catch (error: any) {
      console.error('Error initiating Gmail OAuth:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to Gmail. Please try again.",
        variant: "destructive",
      });
      setConnecting(false);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      const { error } = await supabase
        .from('gmail_integrations')
        .update({ is_active: false })
        .eq('id', integrationId);

      if (error) throw error;

      toast({
        title: "Disconnected",
        description: "Gmail integration has been disabled",
      });

      fetchIntegrations();
    } catch (error: any) {
      console.error('Error disconnecting Gmail:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect Gmail",
        variant: "destructive",
      });
    }
  };

  const handleReconnect = async (integrationId: string) => {
    try {
      const { error } = await supabase
        .from('gmail_integrations')
        .update({ is_active: true })
        .eq('id', integrationId);

      if (error) throw error;

      toast({
        title: "Reconnected",
        description: "Gmail integration has been reactivated",
      });

      fetchIntegrations();
    } catch (error: any) {
      console.error('Error reconnecting Gmail:', error);
      toast({
        title: "Error",
        description: "Failed to reconnect Gmail",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (integration: GmailIntegration) => {
    if (!integration.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    const now = new Date();
    const tokenExpiry = new Date(integration.token_expires_at);
    const watchExpiry = integration.watch_expiration ? new Date(integration.watch_expiration) : null;

    if (tokenExpiry <= now) {
      return <Badge variant="destructive">Token Expired</Badge>;
    }

    if (watchExpiry && watchExpiry <= now) {
      return <Badge variant="outline">Watch Expired</Badge>;
    }

    return <Badge variant="default" className="bg-green-500">Active</Badge>;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
          <span className="ml-2 text-gray-600">Loading Gmail integrations...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Gmail Integration</h3>
            <p className="text-gray-400">Connect your Gmail account to automatically process CV attachments</p>
          </div>
          <Button
            onClick={handleGmailConnect}
            disabled={connecting}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {connecting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Connect Gmail
              </>
            )}
          </Button>
        </div>

        {integrations.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No Gmail accounts connected</p>
            <p className="text-sm text-gray-500 mt-2">
              Connect your Gmail account to start processing CVs automatically
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div key={integration.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Mail className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{integration.gmail_email}</p>
                    <p className="text-sm text-gray-400">
                      Connected {new Date(integration.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {getStatusBadge(integration)}
                  
                  {integration.is_active ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(integration.id)}
                      className="text-red-400 border-red-400 hover:bg-red-400/10"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReconnect(integration.id)}
                      className="text-green-400 border-green-400 hover:bg-green-400/10"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Reconnect
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 bg-blue-500/10 border-blue-500/20">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-400">How it works</h4>
            <ul className="text-sm text-blue-300 mt-2 space-y-1">
              <li>• CV attachments in your Gmail will be automatically detected</li>
              <li>• Only PDF, DOC, and DOCX files are processed</li>
              <li>• Processed CVs appear in your dashboard within minutes</li>
              <li>• You can disconnect at any time</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
