
import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Resume, CVUpload } from '@/types/candidate';
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
import { filterValidCandidates, filterValidCandidatesForDate, filterQualifiedTeachers, filterQualifiedTeachersForDate } from '@/utils/candidateFilters';

// Helper function to convert Resume to CVUpload format for compatibility
const resumeToUpload = (resume: Resume): CVUpload => ({
  id: resume.id,
  user_id: '', // Not needed for display
  file_url: resume.file_url || '',
  original_filename: resume.file_name,
  uploaded_at: resume.created_at,
  source_email: '',
  file_size: resume.file_size || undefined,
  processing_status: 'completed' as const,
  extracted_json: {
    candidate_name: resume.name,
    email_address: resume.email || '',
    contact_number: resume.phone || '',
    educational_qualifications: typeof resume.education_details === 'string' ? resume.education_details : JSON.stringify(resume.education_details || ''),
    job_history: `${resume.role_title || ''} at ${resume.current_company || ''} (${resume.experience_years || 0} years)`,
    skill_set: (resume.skills || []).join(', '),
    score: String(resume.fit_score || 0),
    justification: resume.justification || '',
    countries: resume.location || ''
  }
});

const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
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
      console.log('Dashboard: User authenticated, fetching resumes');
      fetchResumes();
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

    console.log('Dashboard: Setting up new realtime subscription for resumes');
    
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
          
          // All resumes are visible since we're not filtering by email in resumes table
          setResumes(prev => [newResume, ...prev]);
          
          if (newResume.name) {
            toast({
              title: "New Candidate Added",
              description: `${newResume.name} has been processed and added to your dashboard`,
            });
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  };

  const fetchResumes = async () => {
    if (!user) {
      console.log('Dashboard: No user available for fetching resumes');
      setLoading(false);
      return;
    }

    try {
      console.log('Dashboard: Fetching resumes for user:', user.id);
      setError(null);
      
      // Test connection first
      const { data: testData, error: testError } = await supabase
        .from('resumes')
        .select('COUNT(*)', { count: 'exact' })
        .limit(1);
      
      console.log('Dashboard: Test query result:', testData, testError);
      
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Dashboard: Error fetching resumes:', error);
        throw error;
      }
      
      console.log('Dashboard: Fetched', data?.length || 0, 'resumes');
      
      setResumes(data || []);
    } catch (error: any) {
      console.error('Dashboard: Error in fetchResumes:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to fetch resumes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (newResume: Resume) => {
    console.log('Dashboard: New resume completed:', newResume.id);
    setResumes(prev => [newResume, ...prev]);
  };

  const handleCandidateDelete = (deletedId: string) => {
    console.log('Dashboard: Removing candidate from resumes:', deletedId);
    setResumes(prev => prev.filter(resume => resume.id !== deletedId));
  };

  const handleCalendarDateSelect = (date: Date) => {
    setSelectedCalendarDate(date);
  };

  const handleBulkDelete = (deletedIds: string[]) => {
    setResumes(prev => prev.filter(resume => !deletedIds.includes(resume.id)));
  };

  const handleExportAll = () => {
    exportToCSV(actualDisplayedCandidates, 'all_candidates');
  };

  // Apply calendar date filter to filtered resumes
  const displayResumes = useMemo(() => {
    return selectedCalendarDate 
      ? resumes // Pass all resumes and let CandidateGrid handle the filtering
      : resumes; // Just use resumes directly since filtering is done in CandidateGrid
  }, [selectedCalendarDate, resumes]);

  // Sort resumes
  const sortedResumes = useMemo(() => {
    return [...displayResumes].sort((a, b) => {
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
  }, [displayResumes, sortBy]);

  // Convert resumes to uploads format for compatibility with existing components
  const uploadsFromResumes = useMemo(() => 
    resumes.map(resume => resumeToUpload(resume)), 
    [resumes]
  );

  // Get the actual filtered candidates that will be displayed based on candidate view
  const actualDisplayedCandidates = useMemo(() => {
    return selectedCalendarDate 
      ? (candidateView === 'qualified' 
          ? filterQualifiedTeachersForDate(uploadsFromResumes, selectedCalendarDate)
          : filterValidCandidatesForDate(uploadsFromResumes, selectedCalendarDate))
      : (candidateView === 'qualified' 
          ? filterQualifiedTeachers(uploadsFromResumes)
          : filterValidCandidates(uploadsFromResumes));
  }, [uploadsFromResumes, selectedCalendarDate, candidateView]);

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
              fetchResumes();
            }}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black rounded-lg hover:from-yellow-500 hover:to-yellow-700 font-semibold text-elegant tracking-wider"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  console.log('Dashboard: Rendering dashboard with', resumes.length, 'resumes for user:', user?.id);

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
                <UploadHistoryCalendar 
                  uploads={uploadsFromResumes} 
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
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <UploadSection onUploadComplete={handleUploadComplete} />
              </motion.div>

              {/* AdvancedFilters component removed to prevent infinite re-render loop */}

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
                    Export Teaching Candidates ({actualDisplayedCandidates.length})
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
                <CandidateGrid 
                  uploads={sortedResumes.map(r => resumeToUpload(r))} 
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
                <AnalyticsCharts uploads={uploadsFromResumes} />
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
