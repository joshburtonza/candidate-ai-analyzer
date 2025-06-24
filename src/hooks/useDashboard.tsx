
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CVUpload } from '@/types/candidate';
import { useToast } from '@/hooks/use-toast';
import { isSameDay } from 'date-fns';

export const useDashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [uploads, setUploads] = useState<CVUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log('Dashboard: Auth state - authLoading:', authLoading, 'user:', user?.id || 'null');
    
    if (!authLoading && user) {
      console.log('Dashboard: User authenticated, fetching uploads');
      fetchUploads();
    } else if (!authLoading && !user) {
      console.log('Dashboard: No user found after auth loaded');
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchUploads = async () => {
    if (!user) {
      console.log('Dashboard: No user available for fetching uploads');
      setLoading(false);
      return;
    }

    try {
      console.log('Dashboard: Fetching uploads for user:', user.id);
      setError(null);
      
      const { data, error } = await supabase
        .from('cv_uploads')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Dashboard: Error fetching uploads:', error);
        throw error;
      }
      
      console.log('Dashboard: Fetched', data?.length || 0, 'uploads');
      
      const typedUploads: CVUpload[] = (data || []).map(upload => ({
        ...upload,
        extracted_json: upload.extracted_json as any,
        processing_status: upload.processing_status as 'pending' | 'processing' | 'completed' | 'error'
      }));
      
      setUploads(typedUploads);
    } catch (error: any) {
      console.error('Dashboard: Error in fetchUploads:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to fetch uploads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (newUpload: CVUpload) => {
    console.log('Dashboard: New upload completed:', newUpload.id);
    setUploads(prev => [newUpload, ...prev]);
  };

  const handleBatchComplete = (batchId: string) => {
    console.log('Dashboard: Batch upload completed:', batchId);
    fetchUploads(); // Refresh the list
    toast({
      title: "Batch upload completed",
      description: "All files have been processed successfully",
    });
  };

  const handleDateSelect = (date: Date) => {
    if (selectedDate && isSameDay(selectedDate, date)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  };

  const retryFetch = () => {
    setError(null);
    setLoading(true);
    fetchUploads();
  };

  return {
    // Auth state
    user,
    profile,
    authLoading,
    
    // Data state
    uploads,
    loading,
    error,
    
    // UI state
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    selectedDate,
    
    // Event handlers
    handleUploadComplete,
    handleBatchComplete,
    handleDateSelect,
    retryFetch,
  };
};
