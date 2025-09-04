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
import { AdvancedFilters } from '@/components/dashboard/AdvancedFilters';
import { AdvancedFilterState, extractSourceEmailOptions, applyDashboardFilters } from '@/utils/applyDashboardFilters';
import { fetchByLocalDay } from '@/lib/dayRange';

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
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>({});

  // Date-scoped fetch state
  const [dateUploads, setDateUploads] = useState<CVUpload[]>([]);
  const [dateLoading, setDateLoading] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

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

  // Load/save advanced filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('advancedFilters.v1');
    if (saved) {
      try {
        setAdvancedFilters(JSON.parse(saved));
      } catch (error) {
        console.warn('Failed to parse saved advanced filters:', error);
      }
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('advancedFilters.v1', JSON.stringify(advancedFilters));
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [advancedFilters]);

  // Fetch when a calendar date is selected
  useEffect(() => {
    let alive = true;
    if (!selectedCalendarDate) { 
      setDateUploads([]); 
      setDateLoading(false); 
      setDateError(null); 
      return; 
    }

    // Create proper local date string avoiding timezone issues
    const localYear = selectedCalendarDate.getFullYear();
    const localMonth = selectedCalendarDate.getMonth() + 1;
    const localDay = selectedCalendarDate.getDate();
    const dateStr = `${localYear}-${String(localMonth).padStart(2, '0')}-${String(localDay).padStart(2, '0')}`;
    
    console.log('Fetching candidates for date:', dateStr, 'from calendar date:', {
      original: selectedCalendarDate,
      localComponents: { year: localYear, month: localMonth, day: localDay }
    });
    setDateLoading(true); 
    setDateError(null);
    
    fetchByLocalDay<CVUpload>(supabase, dateStr)
      .then(list => { 
        if (alive) setDateUploads(list); 
      })
      .catch(err => { 
        if (alive) setDateError(err?.message || 'Failed to load day'); 
      })
      .finally(() => { 
        if (alive) setDateLoading(false); 
      });

    return () => { alive = false; };
  }, [selectedCalendarDate]);

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

  // Base uploads: selected day (if any) else regular uploads  
  const baseUploads = selectedCalendarDate ? dateUploads : uploads;

  // Different processing for each tab - minimal filtering for "all uploads"
  const processedUploads = useMemo(() => {
    // All uploads tab: basic validity + advanced filters only (no strict preset/vertical filtering)
    const allFiltered = applyDashboardFilters({
      items: baseUploads,
      view: 'allUploads',
      featureFlags: { 
        ...flags, 
        enableFilterPresets: false, 
        enableVerticals: false 
      },
      verticalConfig: currentVertical,
      presetConfig: currentPreset,
      strict: false,
      advanced: advancedFilters
    });
    
    // Best candidates tab: full filtering pipeline
    const bestFiltered = applyDashboardFilters({
      items: baseUploads,
      view: 'best',
      featureFlags: flags,
      verticalConfig: currentVertical,
      presetConfig: currentPreset,
      strict: strictMode,
      advanced: advancedFilters
    });
    
    console.log('Processed uploads:', {
      baseCount: baseUploads.length,
      allFilteredCount: allFiltered.length,
      bestFilteredCount: bestFiltered.length,
      selectedDate: selectedCalendarDate
    });
    
    return { all: allFiltered, best: bestFiltered };
  }, [baseUploads, flags, advancedFilters, currentVertical, currentPreset, strictMode, selectedCalendarDate]);

  // Calculate counts and current data - no more client-side date filtering needed
  const { allUploadsCount, bestCandidatesCount } = useMemo(() => {
    return {
      allUploadsCount: processedUploads.all.length,
      bestCandidatesCount: processedUploads.best.length
    };
  }, [processedUploads]);

  // Data source based on active tab - already date-scoped via baseUploads
  const currentUploads = useMemo(() => {
    return activeTab === 'all' ? processedUploads.all : processedUploads.best;
  }, [activeTab, processedUploads]);

  // Helper to normalize arrays from candidate data
  const normalizeToArray = (value: string | string[] | null | undefined): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter(item => item && item.trim()).map(item => item.trim());
    }
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    return [];
  };

  // Extract options for advanced filters
  const { sourceEmailOptions, availableCountries, availableSkills } = useMemo(() => {
    const sourceEmails = extractSourceEmailOptions(currentUploads);
    
    const countrySet = new Set<string>();
    const skillSet = new Set<string>();
    
    currentUploads.forEach(upload => {
      const countries = normalizeToArray(upload.extracted_json?.countries);
      const skills = normalizeToArray(upload.extracted_json?.current_employment);
      
      countries.forEach(country => countrySet.add(country));
      skills.forEach(skill => skillSet.add(skill));
    });
    
    return {
      sourceEmailOptions: sourceEmails,
      availableCountries: Array.from(countrySet).sort(),
      availableSkills: Array.from(skillSet).sort()
    };
  }, [currentUploads]);

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
    <div className="min-h-screen bg-background">
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

          {selectedCalendarDate && dateLoading && (
            <div className="text-sm text-muted-foreground">Loading day...</div>
          )}
          
          {dateError && (
            <div className="text-sm text-destructive">Error: {dateError}</div>
          )}

          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'best')} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <span>All Uploads</span>
                  <Badge variant="secondary">{allUploadsCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="best" className="flex items-center gap-2">
                  <span>Best Candidates</span>
                  <Badge variant="secondary">{bestCandidatesCount}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-6">
                {/* Advanced filters hidden on All Uploads tab by design */}
                <CandidateGrid 
                  uploads={currentUploads} 
                  viewMode={viewMode} 
                  selectedDate={null}
                  onCandidateDelete={handleCandidateDelete}
                  dedupe={false}
                  requireName={false}
                  dateFilterMode="client"
                  advancedFilters={undefined}
                  featureFlags={flags}
                  verticalConfig={currentVertical}
                  presetConfig={currentPreset}
                  strictMode={strictMode}
                />
              </TabsContent>

              <TabsContent value="best" className="space-y-6">
                {flags.enableAdvancedFilters && (
                  <AdvancedFilters
                    value={advancedFilters}
                    onChange={setAdvancedFilters}
                    sourceEmailOptions={sourceEmailOptions}
                    availableCountries={availableCountries}
                    availableSkills={availableSkills}
                  />
                )}
                <CandidateGrid 
                  uploads={currentUploads} 
                  viewMode={viewMode} 
                  selectedDate={null}
                  onCandidateDelete={handleCandidateDelete}
                  dedupe={false}
                  requireName={false}
                  dateFilterMode="client"
                  advancedFilters={undefined}
                  featureFlags={flags}
                  verticalConfig={currentVertical}
                  presetConfig={currentPreset}
                  strictMode={strictMode}
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