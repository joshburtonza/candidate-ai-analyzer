import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CVUpload } from '@/types/candidate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import CandidateGrid from '@/components/dashboard/CandidateGrid';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { UploadHistoryCalendar } from '@/components/dashboard/UploadHistoryCalendar';
import { useAuth } from '@/hooks/useAuth';
import { useExport } from '@/hooks/useExport';
import HorizontalStats from '@/components/dashboard/HorizontalStats';
import { SimpleUploadSection } from '@/components/dashboard/SimpleUploadSection';
import { SimpleApiInfo } from '@/components/dashboard/SimpleApiInfo';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { useVertical } from '@/context/VerticalContext';
import { filterVerticalCandidates, isPresetCandidate } from '@/utils/verticalFilters';
import { filterValidCandidates, filterAllQualifiedCandidates } from '@/utils/candidateFilters';

const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { exportCandidates } = useExport();
  const { flags } = useFeatureFlags();
  const { currentVertical, currentPreset, strictMode } = useVertical();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showStats, setShowStats] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [selectedUploads, setSelectedUploads] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'best'>('best');
  const [isExporting, setIsExporting] = useState(false);

  // Fetch uploads with pagination for better performance
  const { data: uploads = [], refetch, isLoading, error } = useQuery({
    queryKey: ['cv-uploads'],
    queryFn: async () => {
      console.log('Fetching CV uploads...');
      
      const { data, error } = await supabase
        .from('cv_uploads')
        .select('*')
        .order('received_date', { ascending: false })
        .limit(500); // Limit to recent 500 uploads for faster loading

      if (error) {
        console.error('Error fetching uploads:', error);
        throw error;
      }

      console.log('Uploads found:', data?.length || 0);
      return (data || []).map(upload => ({
        ...upload,
        extracted_json: upload.extracted_json as any
      })) as CVUpload[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
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

  // Best candidates - filtered, processed, and scored
  const bestCandidates = useMemo(() => {
    if (!flags.enableVerticals && !flags.enableFilterPresets) {
      // Use original filtering logic when feature flags are disabled
      return filterAllQualifiedCandidates(uploads);
    }

    if (flags.enableFilterPresets && currentPreset.id === 'education-legacy') {
      // Use original strict logic for legacy preset
      return filterAllQualifiedCandidates(uploads);
    }

    if (flags.enableFilterPresets) {
      // Use preset-based filtering
      const seenNames = new Set<string>();
      return uploads.filter(upload => {
        if (!isPresetCandidate(upload, currentPreset, currentVertical)) return false;
        
        // Deduplicate by normalized name
        const normalizedName = upload.extracted_json?.candidate_name 
          ? upload.extracted_json.candidate_name.toLowerCase().trim().replace(/\s+/g, '_')
          : '';
          
        if (normalizedName && seenNames.has(normalizedName)) return false;
        if (normalizedName) seenNames.add(normalizedName);
        
        return true;
      }).sort((a, b) => {
        const dateA = a.received_date || a.id;
        const dateB = b.received_date || b.id;
        return dateB.localeCompare(dateA);
      });
    }

    if (flags.enableVerticals) {
      // Use vertical-based filtering
      return filterVerticalCandidates(uploads, currentVertical, strictMode);
    }

    return filterAllQualifiedCandidates(uploads);
  }, [uploads, flags, currentVertical, currentPreset, strictMode]);

  // Calculate counts based on selected date
  const { allUploadsCount, bestCandidatesCount } = useMemo(() => {
    if (selectedCalendarDate) {
      // Show counts for selected date
      const dateStr = format(selectedCalendarDate, 'yyyy-MM-dd');
      const allUploadsForDate = uploads.filter(upload => {
        const uploadDate = upload.received_date || upload.extracted_json?.date_received;
        return uploadDate && uploadDate.startsWith(dateStr);
      }).length;
      
      const bestCandidatesForDate = bestCandidates.filter(upload => {
        const uploadDate = upload.received_date || upload.extracted_json?.date_received;
        return uploadDate && uploadDate.startsWith(dateStr);
      }).length;
      
      return {
        allUploadsCount: allUploadsForDate,
        bestCandidatesCount: bestCandidatesForDate
      };
    } else {
      // Show overall totals
      return {
        allUploadsCount: uploads.length,
        bestCandidatesCount: bestCandidates.length
      };
    }
  }, [uploads, bestCandidates, selectedCalendarDate]);

  // Data source based on active tab and date filter
  const currentUploads = useMemo(() => {
    const baseData = activeTab === 'all' ? uploads : bestCandidates;
    
    if (selectedCalendarDate) {
      const dateStr = format(selectedCalendarDate, 'yyyy-MM-dd');
      return baseData.filter(upload => {
        const uploadDate = upload.received_date || upload.extracted_json?.date_received;
        return uploadDate && uploadDate.startsWith(dateStr);
      });
    }
    
    return baseData;
  }, [activeTab, uploads, bestCandidates, selectedCalendarDate]);

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

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const filename = selectedCalendarDate 
        ? `${activeTab}_${format(selectedCalendarDate, 'yyyy-MM-dd')}`
        : (activeTab === 'all' ? 'all_uploads' : 'best_candidates');
      
      exportCandidates(currentUploads, { format: 'csv', filenameBase: filename });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const filename = selectedCalendarDate 
        ? `${activeTab}_${format(selectedCalendarDate, 'yyyy-MM-dd')}`
        : (activeTab === 'all' ? 'all_uploads' : 'best_candidates');
      
      exportCandidates(currentUploads, { format: 'pdf', filenameBase: filename });
    } finally {
      setIsExporting(false);
    }
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
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="space-y-8">
          <DashboardHeader 
            viewMode={viewMode}
            setViewMode={setViewMode}
            showStats={showStats}
            setShowStats={setShowStats}
            selectedUploads={selectedUploads}
            setSelectedUploads={setSelectedUploads}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            isExporting={isExporting}
          />

          {showStats && (
            <HorizontalStats uploads={currentUploads} />
          )}

          <UploadHistoryCalendar 
            allUploads={uploads}
            bestUploads={bestCandidates}
            onDateSelect={handleCalendarDateChange}
            selectedDate={selectedCalendarDate}
          />

          <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'best')} className="space-y-6">
            <div className="flex justify-center">
              <div className="flex bg-gray-900 border border-gray-700 rounded-xl p-1 max-w-md">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 flex-1 ${
                    activeTab === 'all'
                      ? 'bg-pastel-cyan text-black shadow-lg font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <span>All Uploads</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeTab === 'all'
                      ? 'bg-black text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {allUploadsCount}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('best')}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 flex-1 ${
                    activeTab === 'best'
                      ? 'bg-pastel-pink text-black shadow-lg font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <span>Best Candidates</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeTab === 'best'
                      ? 'bg-black text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {bestCandidatesCount}
                  </span>
                </button>
              </div>
            </div>

              <TabsContent value="all">
                <CandidateGrid 
                  uploads={uploads} 
                  viewMode={viewMode} 
                  selectedDate={selectedCalendarDate}
                  onCandidateDelete={handleCandidateDelete}
                  dedupe={false}
                  requireName={false}
                  dateFilterMode="api"
                />
              </TabsContent>

              <TabsContent value="best">
                <CandidateGrid 
                  uploads={bestCandidates} 
                  viewMode={viewMode} 
                  selectedDate={selectedCalendarDate}
                  onCandidateDelete={handleCandidateDelete}
                  dedupe={true}
                  requireName={true}
                  dateFilterMode="client"
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