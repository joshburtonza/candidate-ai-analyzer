
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CVUpload } from '@/types/candidate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import CandidateGrid from '@/components/dashboard/CandidateGrid';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { UploadHistoryCalendar } from '@/components/dashboard/UploadHistoryCalendar';
import { useAuth } from '@/hooks/useAuth';
import { useExport } from '@/hooks/useExport';
import HorizontalStats from '@/components/dashboard/HorizontalStats';
import { SimpleUploadSection } from '@/components/dashboard/SimpleUploadSection';
import { SimpleApiInfo } from '@/components/dashboard/SimpleApiInfo';

const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { exportToCSV } = useExport();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showStats, setShowStats] = useState(true);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [selectedUploads, setSelectedUploads] = useState<string[]>([]);

  // Fetch all uploads
  const { data: uploads = [], refetch, isLoading, error } = useQuery({
    queryKey: ['cv-uploads'],
    queryFn: async () => {
      console.log('Fetching ALL CV uploads...');
      
      const { data, error } = await supabase
        .from('cv_uploads')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error fetching uploads:', error);
        throw error;
      }

      console.log('Total uploads found:', data?.length || 0);
      return (data || []).map(upload => ({
        ...upload,
        extracted_json: upload.extracted_json as any
      })) as CVUpload[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    console.log('Setting up real-time subscription...');
    
    const channel = supabase
      .channel('cv_uploads_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cv_uploads'
        },
        (payload) => {
          console.log('Real-time INSERT:', payload);
          queryClient.invalidateQueries({ queryKey: ['cv-uploads'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cv_uploads'
        },
        (payload) => {
          console.log('Real-time UPDATE:', payload);
          queryClient.invalidateQueries({ queryKey: ['cv-uploads'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleUploadComplete = (newUpload: CVUpload) => {
    console.log('New upload completed:', newUpload);
    queryClient.invalidateQueries({ queryKey: ['cv-uploads'] });
    toast.success(`CV "${newUpload.original_filename}" uploaded successfully!`);
  };

  const handleCandidateDelete = (deletedId: string) => {
    console.log('Candidate deleted:', deletedId);
    setSelectedUploads(prev => prev.filter(id => id !== deletedId));
    queryClient.invalidateQueries({ queryKey: ['cv-uploads'] });
  };

  const handleCalendarDateChange = (date: Date | null) => {
    console.log('Calendar date changed:', date);
    setSelectedCalendarDate(date);
  };

  const handleExport = async () => {
    exportToCSV(uploads, 'cv_uploads');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading dashboard</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-primary-foreground rounded">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="space-y-8">
          {/* Header Section */}
          <DashboardHeader 
            viewMode={viewMode}
            setViewMode={setViewMode}
            showStats={showStats}
            setShowStats={setShowStats}
            selectedUploads={selectedUploads}
            setSelectedUploads={setSelectedUploads}
            onExport={handleExport}
            isExporting={false}
          />

          {/* Statistics Bar */}
          {showStats && (
            <HorizontalStats uploads={uploads} />
          )}

          {/* Upload Section */}
          <SimpleUploadSection onUploadComplete={handleUploadComplete} />

          {/* API Integration Section */}
          <SimpleApiInfo />

          {/* Calendar Section */}
          <UploadHistoryCalendar 
            uploads={uploads}
            onDateSelect={handleCalendarDateChange}
            selectedDate={selectedCalendarDate}
          />

          {/* Uploads Display Section */}
          <div className="space-y-6">
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <span>All Uploads</span>
                  <Badge variant="secondary">{uploads.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="processed" className="flex items-center gap-2">
                  <span>Processed</span>
                  <Badge variant="secondary">
                    {uploads.filter(u => u.processing_status === 'completed').length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <CandidateGrid 
                  uploads={uploads} 
                  viewMode={viewMode} 
                  selectedDate={selectedCalendarDate}
                  onCandidateDelete={handleCandidateDelete}
                />
              </TabsContent>

              <TabsContent value="processed">
                <CandidateGrid 
                  uploads={uploads.filter(u => u.processing_status === 'completed')} 
                  viewMode={viewMode} 
                  selectedDate={selectedCalendarDate}
                  onCandidateDelete={handleCandidateDelete}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
