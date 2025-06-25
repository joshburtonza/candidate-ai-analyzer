
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const GmailCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing Gmail authorization...');

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const state = searchParams.get('state');

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      setMessage('Exchanging authorization code...');

      // Call edge function to exchange code for tokens
      const { data, error: exchangeError } = await supabase.functions.invoke('gmail-oauth-callback', {
        body: { code, state }
      });

      if (exchangeError) throw exchangeError;

      setMessage('Setting up Gmail monitoring...');

      // The edge function handles token storage and Gmail watch setup
      setStatus('success');
      setMessage('Gmail integration completed successfully!');

      toast({
        title: "Success!",
        description: "Gmail integration has been set up successfully",
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to complete Gmail integration');
      
      toast({
        title: "Integration Failed",
        description: error.message || 'Failed to complete Gmail integration',
        variant: "destructive",
      });
    }
  };

  const handleRetry = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-blue-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          {status === 'processing' && (
            <RefreshCw className="w-16 h-16 text-orange-500 mx-auto animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          )}
          {status === 'error' && (
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-white mb-4">
          {status === 'processing' && 'Setting up Gmail Integration'}
          {status === 'success' && 'Integration Complete!'}
          {status === 'error' && 'Integration Failed'}
        </h2>

        <p className="text-gray-300 mb-6">{message}</p>

        {status === 'success' && (
          <p className="text-sm text-gray-400 mb-4">
            Redirecting to dashboard...
          </p>
        )}

        {status === 'error' && (
          <Button onClick={handleRetry} className="bg-orange-500 hover:bg-orange-600">
            Return to Dashboard
          </Button>
        )}
      </Card>
    </div>
  );
};
