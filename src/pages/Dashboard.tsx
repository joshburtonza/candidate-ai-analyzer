
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CVUpload, Resume } from '@/types/candidate';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { CandidateGrid } from '@/components/dashboard/CandidateGrid';
import { UploadHistoryCalendar } from '@/components/dashboard/UploadHistoryCalendar';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { AdvancedFilters } from '@/components/dashboard/AdvancedFilters';
import { BulkActions } from '@/components/dashboard/BulkActions';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useExport } from '@/hooks/useExport';
import { BarChart3, Download, Users } from 'lucide-react';
import { filterValidResumes, filterValidResumesForDate, filterBestResumes, filterBestResumesForDate } from '@/utils/resumeFilters';
import { UploadSection } from '@/components/dashboard/UploadSection';

const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [uploads, setUploads] = useState<Resume[]>([]);
  const [filteredUploads, setFilteredUploads] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('candidates');
  const [candidateFilterType, setCandidateFilterType] = useState<'all' | 'best'>('all');
  const { toast } = useToast();
  const { exportToCSV } = useExport();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    console.log('Dashboard: Auth state - authLoading:', authLoading, 'user:', user?.id || 'null', 'profile email:', profile?.email);
    
    if (!authLoading && user) {
      console.log('Dashboard: User authenticated, fetching uploads with email filtering');
      fetchUploads();
      setupRealtimeSubscription();
    } else if (!authLoading && !user) {
      console.log('Dashboard: No user found after auth loaded');
      setLoading(false);
    }

    return () => {
      if (subscriptionRef.current) {
        console.log('Dashboard: Cleaning up realtime subscription');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user, authLoading]);

  const setupRealtimeSubscription = () => {
    if (subscriptionRef.current) {
      console.log('Dashboard: Removing existing subscription');
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    console.log('Dashboard: Setting up new realtime subscription with email filtering');
    
    const channel = supabase
      .channel('resumes_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'resumes'
        },
        (payload) => {
          console.log('Dashboard: New resume received via realtime:', payload);
          
          const newResume = payload.new as Resume;
          
          if (newResume && !newResume.is_archived) {
            setUploads(prev => [newResume, ...prev]);
            
            if (newResume.name) {
              toast({
                title: "New Candidate Added",
                description: `${newResume.name} has been processed and added to your dashboard`,
              });
            }
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  };

  const fetchUploads = async () => {
    if (!user) {
      console.log('Dashboard: No user available for fetching uploads');
      setLoading(false);
      return;
    }

    try {
      console.log('Dashboard: Fetching uploads for user:', user.id, 'with email:', profile?.email);
      setError(null);
      
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Dashboard: Error fetching uploads:', error);
        throw error;
      }
      
      console.log('Dashboard: Fetched', data?.length || 0, 'uploads (filtered by email)');
      
      const typedResumes: Resume[] = (data || []).map(resume => ({
        ...resume,
        skills: resume.skills || [],
        is_archived: resume.is_archived || false
      }));
      
      setUploads(typedResumes);
      setFilteredUploads(typedResumes);
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


  const handleCalendarDateSelect = (date: Date) => {
    setSelectedCalendarDate(date);
  };

  const handleFilterChange = (filtered: Resume[]) => {
    setFilteredUploads(filtered);
  };

  const handleCandidateDelete = (deletedId: string) => {
    console.log('Dashboard: Removing candidate from state:', deletedId);
    setUploads(prev => prev.filter(upload => upload.id !== deletedId));
    setFilteredUploads(prev => prev.filter(upload => upload.id !== deletedId));
  };

  const handleUploadComplete = (resume: Resume) => {
    console.log('Dashboard: New resume completed:', resume);
    setUploads(prev => [resume, ...prev]);
    setFilteredUploads(prev => [resume, ...prev]);
  };

  const handleBulkDelete = (deletedIds: string[]) => {
    console.log('Dashboard: Bulk removing candidates from state:', deletedIds);
    setUploads(prev => prev.filter(upload => !deletedIds.includes(upload.id)));
    setFilteredUploads(prev => prev.filter(upload => !deletedIds.includes(upload.id)));
  };

  const handleExportAll = () => {
    const fileName = candidateFilterType === 'best' ? 'best_candidates' : 'all_candidates';
    exportToCSV(actualDisplayedCandidates, fileName);
  };

  // Apply calendar date filter to filtered uploads - now uses the new date-specific filtering
  const displayUploads = selectedCalendarDate 
    ? uploads // Pass all uploads and let CandidateGrid handle the filtering
    : filteredUploads;

  // Sort resumes
  const sortedUploads = [...displayUploads].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        const scoreA = a.fit_score || 0;
        const scoreB = b.fit_score || 0;
        return scoreB - scoreA;
      case 'name':
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Get the actual filtered candidates that will be displayed based on the active filter
  const getFilteredCandidates = (filterType: 'all' | 'best') => {
    if (selectedCalendarDate) {
      return filterType === 'best' 
        ? filterBestResumesForDate(uploads, selectedCalendarDate)
        : filterValidResumesForDate(uploads, selectedCalendarDate);
    }
    return filterType === 'best' 
      ? filterBestResumes(uploads)
      : filterValidResumes(uploads);
  };

  const actualDisplayedCandidates = getFilteredCandidates(candidateFilterType);
  const allCandidatesCount = getFilteredCandidates('all').length;
  const bestCandidatesCount = getFilteredCandidates('best').length;

  // Show loading only if auth is loading
  if (authLoading) {
    console.log('Dashboard: Showing auth loading screen');
    return (
      <div className="min-h-screen elegant-gradient flex items-center justify-center">
        <div className="text-white text-elegant tracking-wider">LOADING AUTHENTICATION...</div>
      </div>
    );
  }

  if (loading && user) {
    console.log('Dashboard: Showing data loading screen');
    return (
      <div className="min-h-screen elegant-gradient flex items-center justify-center">
        <div className="text-white text-elegant tracking-wider">LOADING DASHBOARD...</div>
      </div>
    );
  }

  if (error) {
    console.log('Dashboard: Showing error screen:', error);
    return (
      <div className="min-h-screen elegant-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4 text-elegant tracking-wider">ERROR LOADING DASHBOARD</div>
          <div className="text-white text-sm">{error}</div>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchUploads();
            }}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black rounded-lg hover:from-yellow-500 hover:to-yellow-700 font-semibold text-elegant tracking-wider"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  console.log('Dashboard: Rendering dashboard with', uploads.length, 'uploads for email:', profile?.email);

  return (
    <div className="min-h-screen dot-grid-bg">
      <div className="relative z-10">
        <DashboardHeader
          profile={profile}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onDateRangeChange={() => {}} // Legacy prop - functionality moved to AdvancedFilters
        />

        <div className="container mx-auto px-6 py-8 space-y-8">
          {/* Email Filter Info */}
          {profile && !profile.is_admin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 rounded-xl elegant-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-brand-gradient rounded-full"></div>
                <p className="text-white/80 text-sm">
                  Showing candidates with email addresses sent to: <span className="text-brand-gradient font-medium">{profile.email}</span>
                </p>
              </div>
            </motion.div>
          )}

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/5 backdrop-blur-xl border border-slate-500/30">
              <TabsTrigger 
                value="candidates" 
                className="data-[state=active]:bg-brand-gradient data-[state=active]:text-slate-800 text-white/70"
              >
                <Users className="w-4 h-4 mr-2" />
                Candidates
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="data-[state=active]:bg-brand-gradient data-[state=active]:text-slate-800 text-white/70"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="candidates" className="space-y-8 mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <UploadSection onUploadComplete={handleUploadComplete} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <UploadHistoryCalendar 
                  uploads={uploads} 
                  onDateSelect={handleCalendarDateSelect}
                  selectedDate={selectedCalendarDate}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <DashboardStats uploads={actualDisplayedCandidates} />
              </motion.div>


              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <AdvancedFilters 
                  uploads={uploads}
                  onFilterChange={handleFilterChange}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              </motion.div>

              {/* Export and Bulk Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex justify-between items-center"
              >
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleExportAll}
                    variant="outline"
                    className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export All ({actualDisplayedCandidates.length})
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <BulkActions uploads={actualDisplayedCandidates} onBulkDelete={handleBulkDelete} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                {/* Nested Candidate Filter Tabs */}
                <Tabs value={candidateFilterType} onValueChange={(value) => setCandidateFilterType(value as 'all' | 'best')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-white/5 backdrop-blur-xl border border-slate-500/30 mb-6">
                    <TabsTrigger 
                      value="all" 
                      className="data-[state=active]:bg-brand-gradient data-[state=active]:text-slate-800 text-white/70"
                    >
                      All Candidates ({allCandidatesCount})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="best" 
                      className="data-[state=active]:bg-brand-gradient data-[state=active]:text-slate-800 text-white/70"
                    >
                      Best Candidates ({bestCandidatesCount})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all">
                    <CandidateGrid 
                      uploads={sortedUploads} 
                      viewMode={viewMode} 
                      selectedDate={selectedCalendarDate}
                      filterType="all"
                      onCandidateDelete={handleCandidateDelete}
                    />
                  </TabsContent>

                  <TabsContent value="best">
                    <CandidateGrid 
                      uploads={sortedUploads} 
                      viewMode={viewMode} 
                      selectedDate={selectedCalendarDate}
                      filterType="best"
                      onCandidateDelete={handleCandidateDelete}
                    />
                  </TabsContent>
                </Tabs>
              </motion.div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-8 mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <AnalyticsCharts uploads={uploads} />
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
