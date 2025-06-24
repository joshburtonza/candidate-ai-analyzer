
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CVUpload } from '@/types/candidate';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { UploadSection } from '@/components/dashboard/UploadSection';
import { CandidateGrid } from '@/components/dashboard/CandidateGrid';
import { UploadHistory } from '@/components/dashboard/UploadHistory';
import { AdvancedSearchPanel } from '@/components/search/AdvancedSearchPanel';
import { BatchUploadDialog } from '@/components/batch/BatchUploadDialog';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Code } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [uploads, setUploads] = useState<CVUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    filteredUploads,
    savedSearches,
    saveSearch,
    loadSearch,
  } = useAdvancedSearch(uploads);

  // Extract available options for filters
  const { availableSkills, availableCountries, availableTags } = useMemo(() => {
    const skills = new Set<string>();
    const countries = new Set<string>();
    const tags = new Set<string>();

    uploads.forEach(upload => {
      if (upload.extracted_json) {
        // Skills
        if (upload.extracted_json.skill_set) {
          upload.extracted_json.skill_set.split(',').forEach(skill => {
            skills.add(skill.trim());
          });
        }
        
        // Countries
        if (upload.extracted_json.countries) {
          countries.add(upload.extracted_json.countries.trim());
        }
      }
      
      // Tags
      if (upload.tags) {
        upload.tags.forEach(tag => tags.add(tag));
      }
    });

    return {
      availableSkills: Array.from(skills).slice(0, 50),
      availableCountries: Array.from(countries).slice(0, 50),
      availableTags: Array.from(tags),
    };
  }, [uploads]);

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

  // Apply date filter to the already filtered uploads
  const dateFilteredUploads = selectedDate 
    ? filteredUploads.filter(upload => 
        isSameDay(new Date(upload.uploaded_at), selectedDate)
      )
    : filteredUploads;

  // Sort the final filtered uploads
  const sortedUploads = [...dateFilteredUploads].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        const scoreA = parseFloat(a.extracted_json?.score || '0');
        const scoreB = parseFloat(b.extracted_json?.score || '0');
        return scoreB - scoreA;
      case 'name':
        const nameA = a.extracted_json?.candidate_name || '';
        const nameB = b.extracted_json?.candidate_name || '';
        return nameA.localeCompare(nameB);
      default:
        return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
    }
  });

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

  console.log('Dashboard: Rendering dashboard with', uploads.length, 'uploads');

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
        />

        <div className="container mx-auto px-6 py-8 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <DashboardStats uploads={uploads} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex justify-between items-center"
          >
            <div className="flex gap-4">
              <UploadSection onUploadComplete={handleUploadComplete} />
              <BatchUploadDialog onBatchComplete={handleBatchComplete} />
              <Button
                onClick={() => navigate('/api-docs')}
                variant="outline"
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
              >
                <Code className="w-4 h-4 mr-2" />
                API Docs
              </Button>
            </div>
          </motion.div>

          {/* Advanced Search Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <AdvancedSearchPanel
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filters={filters}
              onFiltersChange={setFilters}
              savedSearches={savedSearches}
              onSaveSearch={saveSearch}
              onLoadSearch={loadSearch}
              availableSkills={availableSkills}
              availableCountries={availableCountries}
              availableTags={availableTags}
            />
          </motion.div>

          {/* Upload History Section */}
          <UploadHistory 
            uploads={uploads} 
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
          />

          {/* Candidates Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold text-white">Candidates</h2>
              {selectedDate && (
                <div className="text-sm text-gray-400">
                  Showing {sortedUploads.length} candidates from {selectedDate.toLocaleDateString()}
                </div>
              )}
              {(searchQuery || Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f !== undefined)) && !selectedDate && (
                <div className="text-sm text-gray-400">
                  {sortedUploads.length} results found
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <CandidateGrid uploads={sortedUploads} viewMode={viewMode} />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
