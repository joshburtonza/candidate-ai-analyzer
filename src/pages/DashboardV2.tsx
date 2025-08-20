// Dashboard V2 - New design implementation

import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from "framer-motion";
import { 
  Search, 
  Bell, 
  User2, 
  Plus, 
  Upload, 
  Download, 
  Calendar, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  Send,
  Eye
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { CVUpload } from '@/types/candidate';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { useVertical } from '@/context/VerticalContext';
import { adaptCVUploadsToDashboardCandidates } from '@/utils/dashboardV2Adapter';
import { filterValidCandidates, filterAllQualifiedCandidates } from '@/utils/candidateFilters';
import { filterVerticalCandidates, isPresetCandidate } from '@/utils/verticalFilters';
import { DashboardCandidate, DashboardKPI } from '@/types/dashboardV2';
import { 
  Container, 
  DashCard, 
  Widget, 
  DashButton, 
  DashBadge, 
  Progress 
} from '@/components/dashboardV2/DashboardV2Atoms';
import { Dots, Bars, RowStat } from '@/components/dashboardV2/DashboardV2Charts';
import { CandidateCardV2 } from '@/components/dashboardV2/CandidateCardV2';
import { ChatBubble } from '@/components/dashboardV2/ChatBubble';
import { toast } from 'sonner';

export default function DashboardV2() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { flags } = useFeatureFlags();
  const { currentVertical, currentPreset, strictMode } = useVertical();
  
  // Local state
  const [role, setRole] = useState('All roles');
  const [location, setLocation] = useState('All locations');
  const [query, setQuery] = useState('');
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [aiQuery, setAiQuery] = useState('');

  // Fetch uploads with real-time updates
  const { data: uploads = [], refetch, isLoading, error } = useQuery({
    queryKey: ['cv-uploads-v2'],
    queryFn: async () => {
      console.log('DashboardV2: Fetching CV uploads...');
      
      const { data, error } = await supabase
        .from('cv_uploads')
        .select('*')
        .order('received_date', { ascending: false })
        .limit(500);

      if (error) {
        console.error('DashboardV2: Error fetching uploads:', error);
        throw error;
      }

      console.log('DashboardV2: Uploads found:', data?.length || 0);
      return (data || []).map(upload => ({
        ...upload,
        extracted_json: upload.extracted_json as any
      })) as CVUpload[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  // Real-time subscription (same as original dashboard)
  React.useEffect(() => {
    console.log('DashboardV2: Setting up real-time subscription...');
    
    const channel = supabase
      .channel('cv_uploads_changes_v2')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cv_uploads'
        },
        (payload) => {
          console.log('DashboardV2: Real-time INSERT:', payload);
          queryClient.invalidateQueries({ queryKey: ['cv-uploads-v2'] });
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
          console.log('DashboardV2: Real-time UPDATE:', payload);
          queryClient.invalidateQueries({ queryKey: ['cv-uploads-v2'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Filter best candidates (reuse existing logic)
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

  // Apply local filters
  const filteredCandidates = useMemo(() => {
    return bestCandidates.filter(c =>
      (role === 'All roles' || c.title.toLowerCase().includes(role.toLowerCase())) &&
      (location === 'All locations' || c.location.toLowerCase().includes(location.toLowerCase())) &&
      (!query || (c.name + c.title + c.skills.join(' ')).toLowerCase().includes(query.toLowerCase()))
    );
  }, [bestCandidates, role, location, query]);

  // KPI data
  const kpis: DashboardKPI[] = [
    { label: "New Applications", value: uploads.length, delta: 12 },
    { label: "Qualified", value: bestCandidates.length, delta: 4 },
    { label: "Interviews", value: Math.floor(bestCandidates.length * 0.3), delta: 2 },
    { label: "Offers", value: Math.floor(bestCandidates.length * 0.1), delta: -1 },
  ];

  const handleShortlist = (id: string) => {
    setShortlist(prev => prev.includes(id) ? prev : [...prev, id]);
    toast.success('Candidate added to shortlist');
  };

  const handleAISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    
    // TODO: Implement AI assistant functionality
    toast.info('AI Assistant feature coming soon!');
    setAiQuery('');
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Dashboard refreshed');
  };

  const handleExport = () => {
    // TODO: Implement export functionality 
    toast.info('Export feature coming soon!');
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
          <DashButton onClick={handleRefresh}>Try Again</DashButton>
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
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-foreground text-background font-bold">
              CV
            </div>
            <div className="text-sm font-semibold">CV Dashboard</div>
            <DashBadge>Recruiting</DashBadge>
          </div>
          
          <div className="hidden items-center gap-3 rounded-full px-3 py-1.5 text-sm md:flex border border-border bg-secondary">
            <Search className="mr-2 h-4 w-4" /> 
            <input 
              placeholder="Search people, skills, tags…" 
              className="w-40 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button className="grid h-9 w-9 place-items-center rounded-full border border-border bg-secondary hover:bg-accent transition-colors">
              <Bell className="h-4 w-4" />
            </button>
            <button className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-border bg-secondary hover:bg-accent transition-colors">
              <User2 className="h-4 w-4" />
            </button>
          </div>
        </Container>
      </header>

      {/* Hero / actions */}
      <section className="border-b border-border">
        <Container className="py-6">
          <div className="grid gap-4 sm:grid-cols-[1fr,auto]">
            <div className="flex flex-wrap items-center gap-3">
              <DashButton variant="primary" onClick={() => toast.info('Feature coming soon!')}>
                <Plus className="h-4 w-4" /> New Requisition
              </DashButton>
              <DashButton onClick={() => toast.info('Import feature coming soon!')}>
                <Upload className="h-4 w-4" /> Import
              </DashButton>
              <DashButton onClick={handleExport}>
                <Download className="h-4 w-4" /> Export
              </DashButton>
            </div>
            <div className="flex items-center justify-end gap-2">
              <DashButton onClick={handleRefresh}>Refresh</DashButton>
              <DashButton variant="soft" onClick={() => toast.info('Widgets feature coming soon!')}>
                Widgets
              </DashButton>
            </div>
          </div>
        </Container>
      </section>

      {/* Main board */}
      <section>
        <Container className="py-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column — stats & widgets */}
            <div className="space-y-6 lg:col-span-2">
              <div className="grid gap-6 md:grid-cols-3">
                <Widget tone="accent" className="md:col-span-2">
                  <div className="mb-2 text-sm opacity-70">CV Applications</div>
                  <div className="text-4xl font-bold text-white">
                    +{Math.round((uploads.length / 100) * 100)}%
                  </div>
                  <Dots series={[2,3,2,4,6,5,2,3,6,7,5,3]} />
                </Widget>
                
                <DashCard className="md:col-span-1">
                  <div className="mb-2 text-sm text-muted-foreground">This month</div>
                  <div className="text-3xl font-semibold">+{Math.round((bestCandidates.length / uploads.length) * 100)}%</div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg p-4 text-center bg-secondary">All</div>
                    <div className="rounded-lg p-4 text-center bg-accent">Best</div>
                  </div>
                </DashCard>

                <DashCard className="md:col-span-1">
                  <div className="mb-3 text-sm text-muted-foreground">Top locations</div>
                  <div className="space-y-3 text-sm">
                    <RowStat label="South Africa" value={`${Math.floor(uploads.length * 0.4)}`} />
                    <RowStat label="Remote" value={`${Math.floor(uploads.length * 0.3)}`} />
                    <RowStat label="Other" value={`${Math.floor(uploads.length * 0.3)}`} />
                  </div>
                </DashCard>

                <Widget tone="dark" className="md:col-span-1">
                  <div className="mb-2 text-sm opacity-70">Applications</div>
                  <div className="text-4xl font-bold text-white">
                    {uploads.length}
                  </div>
                  <Bars series={[uploads.length > 50 ? 6 : 2, uploads.length > 30 ? 5 : 3, uploads.length > 20 ? 9 : 4, uploads.length > 10 ? 7 : 2, 4, 2]} />
                </Widget>

                <DashCard className="md:col-span-1">
                  <div className="mb-2 text-sm text-muted-foreground">Conversion rate</div>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-semibold">{bestCandidates.length}</div>
                    <ArrowUpRight className="h-5 w-5 text-green-500" />
                  </div>
                </DashCard>
              </div>

              <DashCard>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-lg font-semibold">Talent pipeline</div>
                  <div className="flex items-center gap-2 text-sm">
                    <Filter className="h-4 w-4" />
                    <div className="flex items-center gap-2 rounded-full px-3 py-1.5 border border-border bg-secondary">
                      <Search className="h-4 w-4" />
                      <input 
                        value={query} 
                        onChange={(e) => setQuery(e.target.value)} 
                        placeholder="Search skills, names…" 
                        className="w-40 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <select 
                      value={role} 
                      onChange={(e) => setRole(e.target.value)} 
                      className="rounded-xl px-3 py-1.5 text-sm outline-none border border-border bg-secondary"
                    >
                      <option>All roles</option>
                      <option>Designer</option>
                      <option>Engineer</option>
                      <option>Manager</option>
                    </select>
                    <select 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)} 
                      className="rounded-xl px-3 py-1.5 text-sm outline-none border border-border bg-secondary"
                    >
                      <option>All locations</option>
                      <option>South Africa</option>
                      <option>Remote</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid gap-3 md:grid-cols-4">
                  {[
                    { label: 'Applied', v: uploads.length },
                    { label: 'Screened', v: Math.floor(uploads.length * 0.6) },
                    { label: 'Interviewing', v: Math.floor(bestCandidates.length * 0.5) },
                    { label: 'Offer', v: Math.floor(bestCandidates.length * 0.2) },
                  ].map(x => (
                    <div key={x.label} className="rounded-2xl p-4 border border-border bg-secondary/50">
                      <div className="text-sm text-muted-foreground">{x.label}</div>
                      <div className="mt-1 text-2xl font-semibold">{x.v}</div>
                      <Progress value={Math.min(100, x.v * 2)} />
                    </div>
                  ))}
                </div>
              </DashCard>

              <div className="grid gap-4 md:grid-cols-2">
                {filteredCandidates.map(c => (
                  <CandidateCardV2
                    key={c.id}
                    candidate={c}
                    onShortlist={handleShortlist}
                    open={!!expanded[c.id]}
                    onToggle={() => setExpanded(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                  />
                ))}
              </div>
            </div>

            {/* Right column — Assistant */}
            <div className="space-y-6">
              <DashCard>
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-lg font-semibold">Statistics</div>
                  <DashBadge>Today</DashBadge>
                </div>
                <div className="grid gap-4">
                  {kpis.map((k, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl p-3 text-sm border border-border bg-secondary/50">
                      <span>{k.label}</span>
                      <span className="font-semibold">{k.value}</span>
                      <span className={`inline-flex items-center gap-1 ${k.delta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {k.delta >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        {Math.abs(k.delta)}
                      </span>
                    </div>
                  ))}
                </div>
              </DashCard>

              <DashCard className="grid grid-rows-[auto,1fr,auto] p-0 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div>AI Assistant</div>
                  <DashBadge>Beta</DashBadge>
                </div>
                <div className="h-[320px] space-y-3 overflow-auto p-4">
                  <ChatBubble message={{ text: "How can I help you analyze your candidate pipeline today?", when: "11:32 AM", who: "ai" }} />
                  <ChatBubble message={{ text: "Show me the best candidates from this week", when: "11:38 AM", who: "me" }} />
                  <ChatBubble message={{ text: `I found ${bestCandidates.length} qualified candidates. The top ones have strong technical skills and relevant experience.`, when: "11:39 AM", who: "ai" }} />
                </div>
                <form onSubmit={handleAISubmit} className="p-3 border-t border-border">
                  <div className="flex items-center gap-2 rounded-xl p-2 border border-border bg-secondary">
                    <input 
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      placeholder="Ask about your candidates..." 
                      className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
                    />
                    <DashButton variant="primary" type="submit" className="!px-3">
                      <Send className="h-4 w-4" />
                    </DashButton>
                  </div>
                </form>
              </DashCard>
            </div>
          </div>
        </Container>
      </section>

      <footer className="py-8 border-t border-border">
        <Container className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-background">CV</div> 
            <span>CV Dashboard © 2025</span>
          </div>
          <div className="flex items-center gap-4">
            <a className="hover:text-foreground transition-colors" href="#">Privacy</a>
            <a className="hover:text-foreground transition-colors" href="#">Terms</a>
            <a className="hover:text-foreground transition-colors" href="#">Status</a>
          </div>
        </Container>
      </footer>
    </div>
  );
}