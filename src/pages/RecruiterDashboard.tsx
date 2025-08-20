// Recruiter Dashboard - Core candidate functionality with V2 design

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CVUpload } from '@/types/candidate';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { useVertical } from '@/context/VerticalContext';
import { useExport } from '@/hooks/useExport';
import { adaptCVUploadsToDashboardCandidates } from '@/utils/dashboardV2Adapter';
import { filterValidCandidates, filterAllQualifiedCandidates } from '@/utils/candidateFilters';
import { filterVerticalCandidates, isPresetCandidate } from '@/utils/verticalFilters';
import { DashboardCandidate } from '@/types/dashboardV2';
import { 
  Container, 
  DashCard, 
  DashButton, 
  DashBadge
} from '@/components/dashboardV2/DashboardV2Atoms';
import { CandidateCardV2 } from '@/components/dashboardV2/CandidateCardV2';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Bell, User2, Upload, Download, Filter, Calendar, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { flags } = useFeatureFlags();
  const { currentVertical, currentPreset, strictMode } = useVertical();
  const { exportCandidates } = useExport();
  
  // Local state
  const [activeTab, setActiveTab] = useState<'all' | 'best'>('best');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [query, setQuery] = useState('');
  const [selectedUploads, setSelectedUploads] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [shortlist, setShortlist] = useState<string[]>([]);

  // Fetch uploads with real-time updates (same as original dashboard)
  const { data: uploads = [], refetch, isLoading, error } = useQuery({
    queryKey: ['cv-uploads-recruiter'],
    queryFn: async () => {
      console.log('RecruiterDashboard: Fetching CV uploads...');
      
      const { data, error } = await supabase
        .from('cv_uploads')
        .select('*')
        .order('received_date', { ascending: false })
        .limit(500);

      if (error) {
        console.error('RecruiterDashboard: Error fetching uploads:', error);
        throw error;
      }

      console.log('RecruiterDashboard: Uploads found:', data?.length || 0);
      return (data || []).map(upload => ({
        ...upload,
        extracted_json: upload.extracted_json as any
      })) as CVUpload[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  // Real-time subscription
  useEffect(() => {
    console.log('RecruiterDashboard: Setting up real-time subscription...');
    
    const channel = supabase
      .channel('cv_uploads_changes_recruiter')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cv_uploads'
        },
        (payload) => {
          console.log('RecruiterDashboard: Real-time INSERT:', payload);
          queryClient.invalidateQueries({ queryKey: ['cv-uploads-recruiter'] });
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
          console.log('RecruiterDashboard: Real-time UPDATE:', payload);
          queryClient.invalidateQueries({ queryKey: ['cv-uploads-recruiter'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Best candidates - filtered, processed, and scored (same logic as original)
  const bestUploads = useMemo(() => {
    if (!flags.enableVerticals && !flags.enableFilterPresets) {
      return filterAllQualifiedCandidates(uploads);
    }

    if (flags.enableFilterPresets && currentPreset.id === 'education-legacy') {
      return filterAllQualifiedCandidates(uploads);
    }

    if (flags.enableFilterPresets) {
      const seenNames = new Set<string>();
      return uploads.filter(upload => {
        if (!isPresetCandidate(upload, currentPreset, currentVertical)) return false;
        
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
      return filterVerticalCandidates(uploads, currentVertical, strictMode);
    }

    return filterAllQualifiedCandidates(uploads);
  }, [uploads, flags, currentVertical, currentPreset, strictMode]);

  // Convert to dashboard format
  const allCandidates = useMemo(() => 
    adaptCVUploadsToDashboardCandidates(uploads), [uploads]);
  const bestCandidates = useMemo(() => 
    adaptCVUploadsToDashboardCandidates(bestUploads), [bestUploads]);

  // Apply search filter
  const currentCandidates = useMemo(() => {
    const baseCandidates = activeTab === 'all' ? allCandidates : bestCandidates;
    
    if (!query) return baseCandidates;
    
    return baseCandidates.filter(c =>
      (c.name + c.title + c.skills.join(' ')).toLowerCase().includes(query.toLowerCase())
    );
  }, [allCandidates, bestCandidates, activeTab, query]);

  const handleShortlist = (id: string) => {
    setShortlist(prev => prev.includes(id) ? prev : [...prev, id]);
    toast.success('Candidate added to shortlist');
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const filename = activeTab === 'all' ? 'all_candidates' : 'best_candidates';
      // Convert back to CVUpload format for export
      const uploadsToExport = activeTab === 'all' ? uploads : bestUploads;
      exportCandidates(uploadsToExport, { format: 'csv', filenameBase: filename });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const filename = activeTab === 'all' ? 'all_candidates' : 'best_candidates';
      const uploadsToExport = activeTab === 'all' ? uploads : bestUploads;
      exportCandidates(uploadsToExport, { format: 'pdf', filenameBase: filename });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading candidates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading candidates</p>
          <DashButton onClick={() => refetch()}>Try Again</DashButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-20 backdrop-blur-sm border-b border-border bg-background/90">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-pastel-purple text-black font-bold">
              R
            </div>
            <div className="text-sm font-semibold">Recruiter Dashboard</div>
            <DashBadge>Candidates</DashBadge>
          </div>
          
          <div className="hidden items-center gap-3 rounded-full px-3 py-1.5 text-sm md:flex border border-border bg-secondary">
            <Search className="mr-2 h-4 w-4" /> 
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search candidates, skills..." 
              className="w-40 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <DashButton variant="ghost" onClick={() => navigate('/dashboard-v2')}>
              Manager View
            </DashButton>
            <button className="grid h-9 w-9 place-items-center rounded-full border border-border bg-secondary hover:bg-accent transition-colors">
              <Bell className="h-4 w-4" />
            </button>
            <button 
              onClick={() => navigate('/account')}
              className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-border bg-secondary hover:bg-accent transition-colors"
            >
              <User2 className="h-4 w-4" />
            </button>
          </div>
        </Container>
      </header>

      {/* Actions bar */}
      <section className="border-b border-border">
        <Container className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DashButton variant="primary" onClick={() => toast.info('Upload feature coming soon!')}>
                <Upload className="h-4 w-4" /> Upload CVs
              </DashButton>
              <DashButton onClick={handleExportCSV} disabled={isExporting}>
                <Download className="h-4 w-4" /> Export CSV
              </DashButton>
              <DashButton onClick={handleExportPDF} disabled={isExporting}>
                <Download className="h-4 w-4" /> Export PDF
              </DashButton>
            </div>
            
            <div className="flex items-center gap-2">
              <DashButton onClick={() => refetch()}>Refresh</DashButton>
              <DashButton variant="ghost" onClick={() => navigate('/account')}>
                <Settings className="h-4 w-4" />
              </DashButton>
            </div>
          </div>
        </Container>
      </section>

      {/* Main content */}
      <section>
        <Container className="py-6">
          <div className="space-y-6">
            {/* Stats overview */}
            <div className="grid gap-4 md:grid-cols-4">
              <DashCard className="bg-pastel-purple/10 border-pastel-purple/20">
                <div className="text-sm text-pastel-purple">Total Applications</div>
                <div className="text-2xl font-bold text-white">{uploads.length}</div>
              </DashCard>
              <DashCard className="bg-pastel-cyan/10 border-pastel-cyan/20">
                <div className="text-sm text-pastel-cyan">Qualified</div>
                <div className="text-2xl font-bold text-white">{bestCandidates.length}</div>
              </DashCard>
              <DashCard className="bg-pastel-pink/10 border-pastel-pink/20">
                <div className="text-sm text-pastel-pink">Shortlisted</div>
                <div className="text-2xl font-bold text-white">{shortlist.length}</div>
              </DashCard>
              <DashCard className="bg-pastel-green/10 border-pastel-green/20">
                <div className="text-sm text-pastel-green">Success Rate</div>
                <div className="text-2xl font-bold text-white">{Math.round((bestCandidates.length / uploads.length) * 100)}%</div>
              </DashCard>
            </div>

            {/* Candidate tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'best')} className="space-y-6">
              <div className="flex items-center justify-between">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <span>All Candidates</span>
                    <DashBadge>{allCandidates.length}</DashBadge>
                  </TabsTrigger>
                  <TabsTrigger value="best" className="flex items-center gap-2">
                    <span>Best Matches</span>
                    <DashBadge>{bestCandidates.length}</DashBadge>
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Showing {currentCandidates.length} candidates
                  </span>
                </div>
              </div>

              <TabsContent value="all" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {currentCandidates.map(candidate => (
                    <CandidateCardV2
                      key={candidate.id}
                      candidate={candidate}
                      onShortlist={handleShortlist}
                      open={!!expanded[candidate.id]}
                      onToggle={() => setExpanded(prev => ({ ...prev, [candidate.id]: !prev[candidate.id] }))}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="best" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {currentCandidates.map(candidate => (
                    <CandidateCardV2
                      key={candidate.id}
                      candidate={candidate}
                      onShortlist={handleShortlist}
                      open={!!expanded[candidate.id]}
                      onToggle={() => setExpanded(prev => ({ ...prev, [candidate.id]: !prev[candidate.id] }))}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {currentCandidates.length === 0 && (
              <DashCard className="text-center py-12">
                <div className="text-muted-foreground mb-4">No candidates found</div>
                {query && (
                  <DashButton variant="ghost" onClick={() => setQuery('')}>
                    Clear search
                  </DashButton>
                )}
              </DashCard>
            )}
          </div>
        </Container>
      </section>
    </div>
  );
}