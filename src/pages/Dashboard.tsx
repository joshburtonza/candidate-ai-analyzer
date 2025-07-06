import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Candidate } from '@/types/candidate';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { UploadSection } from '@/components/dashboard/UploadSection';
import { CandidateGrid } from '@/components/dashboard/CandidateGrid';
import { UploadHistoryCalendar } from '@/components/dashboard/UploadHistoryCalendar';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { BulkActions } from '@/components/dashboard/BulkActions';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useExport } from '@/hooks/useExport';
import { BarChart3, Download, Users } from 'lucide-react';

const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [candidateView, setCandidateView] = useState<'all' | 'qualified'>('all');
  const [activeTab, setActiveTab] = useState('candidates');
  const { toast } = useToast();
  const { exportToCSV } = useExport();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    console.log('Dashboard: Auth state - authLoading:', authLoading, 'user:', user?.id || 'null', 'profile email:', profile?.email);
    
    if (!authLoading && user) {
      console.log('Dashboard: User authenticated, fetching candidates');
      fetchCandidates();
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

    console.log('Dashboard: Setting up new realtime subscription for candidates');
    
    const channel = supabase
      .channel('candidates_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'candidates'
        },
        (payload) => {
          console.log('Dashboard: New candidate received via realtime:', payload);
          
          const newCandidate = payload.new as Candidate;
          
          setCandidates(prev => [newCandidate, ...prev]);
          
          if (newCandidate.full_name) {
            toast({
              title: "New Candidate Added",
              description: `${newCandidate.full_name} has been processed and added to your dashboard`,
            });
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  };

  const fetchCandidates = async () => {
    if (!user) {
      console.log('Dashboard: No user available for fetching candidates');
      setLoading(false);
      return;
    }

    try {
      console.log('Dashboard: Fetching candidates for user:', user.id);
      setError(null);
      
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Dashboard: Error fetching candidates:', error);
        throw error;
      }
      
      console.log('Dashboard: Fetched', data?.length || 0, 'candidates');
      
      setCandidates((data as Candidate[]) || []);
    } catch (error: any) {
      console.error('Dashboard: Error in fetchCandidates:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to fetch candidates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (candidate: any) => {
    console.log('Dashboard: New candidate completed:', candidate);
    // Refetch candidates to get the latest data
    fetchCandidates();
  };

  const handleCandidateDelete = (deletedId: string) => {
    console.log('Dashboard: Removing candidate:', deletedId);
    setCandidates(prev => prev.filter(candidate => candidate.id !== deletedId));
  };

  const handleCalendarDateSelect = (date: Date) => {
    setSelectedCalendarDate(date);
  };

  const handleBulkDelete = (deletedIds: string[]) => {
    setCandidates(prev => prev.filter(candidate => !deletedIds.includes(candidate.id)));
  };

  const handleExportAll = () => {
    // For now, create a simple CSV export without using the useExport hook
    const csvData = displayedCandidates.map(candidate => ({
      name: candidate.full_name,
      email: candidate.email,
      contact: candidate.contact_number,
      score: candidate.score,
      justification: candidate.justification,
      assessment: candidate.professional_assessment
    }));
    
    console.log('Exporting all candidates:', csvData);
  };

  // Apply calendar date filter to candidates
  const displayedCandidates = useMemo(() => {
    let filtered = [...candidates];
    
    // Apply date filter if selected
    if (selectedCalendarDate) {
      const selectedDateStr = selectedCalendarDate.toISOString().split('T')[0];
      filtered = filtered.filter(candidate => {
        const candidateDate = new Date(candidate.created_at).toISOString().split('T')[0];
        return candidateDate === selectedDateStr;
      });
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(candidate => 
        candidate.full_name?.toLowerCase().includes(query) ||
        candidate.email?.toLowerCase().includes(query) ||
        candidate.contact_number?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [candidates, selectedCalendarDate, searchQuery]);

  // Sort candidates
  const sortedCandidates = useMemo(() => {
    return [...displayedCandidates].sort((a, b) => {
      switch (sortBy) {
        case 'score':
          const scoreA = a.score || 0;
          const scoreB = b.score || 0;
          return scoreB - scoreA;
        case 'name':
          const nameA = a.full_name || '';
          const nameB = b.full_name || '';
          return nameA.localeCompare(nameB);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [displayedCandidates, sortBy]);

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
            fetchCandidates();
            }}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black rounded-lg hover:from-yellow-500 hover:to-yellow-700 font-semibold text-elegant tracking-wider"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  console.log('Dashboard: Rendering dashboard with', candidates.length, 'candidates for user:', user?.id);

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
          candidateView={candidateView}
          onCandidateViewChange={setCandidateView}
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
                  Showing qualified teaching candidates sent to: <span className="text-brand-gradient font-medium">{profile.email}</span>
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
                Teaching Candidates
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
                <DashboardStats uploads={displayedCandidates} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <UploadSection onUploadComplete={handleUploadComplete} />
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
                    Export Teaching Candidates ({displayedCandidates.length})
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <BulkActions uploads={displayedCandidates} onBulkDelete={handleBulkDelete} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <CandidateGrid 
                  uploads={sortedCandidates} 
                  viewMode={viewMode} 
                  selectedDate={selectedCalendarDate}
                  candidateView={candidateView}
                  onCandidateDelete={handleCandidateDelete}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-8 mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Temporarily disable analytics until we update it for new structure */}
                {/* <AnalyticsCharts uploads={candidates} /> */}
                <div className="glass-card elegant-border p-8 rounded-xl text-center">
                  <h3 className="text-2xl font-semibold text-white mb-4">Analytics Coming Soon</h3>
                  <p className="text-white/70">Analytics will be updated to work with the new simplified candidate structure.</p>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;