import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CVUpload } from '@/types/candidate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Grid, List, Calendar, Upload, BarChart3, Download, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { UploadSection } from '@/components/dashboard/UploadSection';
import CandidateGrid from '@/components/dashboard/CandidateGrid';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { UploadHistoryCalendar } from '@/components/dashboard/UploadHistoryCalendar';
import { GoogleConnectButton } from '@/components/dashboard/GoogleConnectButton';
import { GoogleDocUpload } from '@/components/dashboard/GoogleDocUpload';
import { N8nApiInfo } from '@/components/dashboard/N8nApiInfo';
import { useAuth } from '@/hooks/useAuth';
import { useExport } from '@/hooks/useExport';

const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { exportToCSV } = useExport();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showStats, setShowStats] = useState(true);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [selectedUploads, setSelectedUploads] = useState<string[]>([]);

  // Simple fetch of ALL uploads - no filtering
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

  // Real-time subscription for immediate updates
  useEffect(() => {
    console.log('Setting up real-time subscription...');
    
    const channel = supabase
      .channel('cv_uploads_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cv_uploads'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const handleUploadComplete = (newUpload: CVUpload) => {
    console.log('New upload completed:', newUpload);
    refetch();
    toast.success(`CV "${newUpload.original_filename}" uploaded successfully!`);
  };

  const handleCandidateDelete = (deletedId: string) => {
    console.log('Candidate deleted:', deletedId);
    setSelectedUploads(prev => prev.filter(id => id !== deletedId));
    refetch();
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
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header */}
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

            {/* Statistics */}
            {showStats && (
              <DashboardStats 
                uploads={uploads}
                selectedDate={selectedCalendarDate}
              />
            )}

            {/* Upload Section */}
            <UploadSection onUploadComplete={handleUploadComplete} />

            {/* N8n API Information */}
            <N8nApiInfo />

            {/* Simple Tabs - Show ALL uploads */}
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
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

          {/* Sidebar */}
          <div className="space-y-6">
            <UploadHistoryCalendar 
              uploads={uploads}
              onDateSelect={handleCalendarDateChange}
              selectedDate={selectedCalendarDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;