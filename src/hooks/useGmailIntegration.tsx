
import { useState, useEffect } from 'react';
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

interface ProcessedEmail {
  id: string;
  gmail_message_id: string;
  subject?: string;
  sender_email?: string;
  processed_at: string;
  cv_upload_ids: string[];
  processing_status: string;
  error_message?: string;
}

export const useGmailIntegration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<GmailIntegration[]>([]);
  const [processedEmails, setProcessedEmails] = useState<ProcessedEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchIntegrations();
      fetchProcessedEmails();
    }
  }, [user]);

  const fetchIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('gmail_integrations')
        .select('*')
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
    }
  };

  const fetchProcessedEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('processed_emails')
        .select('*')
        .eq('user_id', user?.id)
        .order('processed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setProcessedEmails(data || []);
    } catch (error: any) {
      console.error('Error fetching processed emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshIntegrations = () => {
    fetchIntegrations();
    fetchProcessedEmails();
  };

  const getActiveIntegrations = () => {
    return integrations.filter(integration => integration.is_active);
  };

  const getIntegrationStats = () => {
    const total = integrations.length;
    const active = getActiveIntegrations().length;
    const totalProcessed = processedEmails.length;
    const recentlyProcessed = processedEmails.filter(
      email => new Date(email.processed_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    return {
      total,
      active,
      totalProcessed,
      recentlyProcessed
    };
  };

  return {
    integrations,
    processedEmails,
    loading,
    fetchIntegrations,
    fetchProcessedEmails,
    refreshIntegrations,
    getActiveIntegrations,
    getIntegrationStats
  };
};
