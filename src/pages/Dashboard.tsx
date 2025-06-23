
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CVUpload } from '@/types/candidate';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { UploadSection } from '@/components/dashboard/UploadSection';
import { CandidateGrid } from '@/components/dashboard/CandidateGrid';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [uploads, setUploads] = useState<CVUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date');
  const { toast } = useToast();

  useEffect(() => {
    console.log('Dashboard: Auth state changed - authLoading:', authLoading, 'user:', user?.id || 'null');
    
    if (!authLoading && user) {
      fetchUploads();
    } else if (!authLoading && !user) {
      console.log('Dashboard: No user found after auth loaded');
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchUploads = async () => {
    try {
      console.log('Dashboard: Fetching uploads for user:', user?.id);
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
      
      // Cast the database response to our CVUpload type
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

  // Show loading only if auth is loading or we're fetching data
  if (authLoading) {
    console.log('Dashboard: Showing auth loading screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-blue-900 flex items-center justify-center">
        <div className="text-white">Loading authentication...</div>
      </div>
    );
  }

  if (loading) {
    console.log('Dashboard: Showing data loading screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-blue-900 flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    console.log('Dashboard: Showing error screen:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Error loading dashboard</div>
          <div className="text-white text-sm">{error}</div>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchUploads();
            }}
            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Filter and sort uploads
  const filteredUploads = uploads.filter(upload => {
    if (!searchQuery) return true;
    const data = upload.extracted_json;
    if (!data) return false;
    
    const searchFields = [
      data.candidate_name,
      data.email_address,
      data.skill_set,
      data.countries
    ].join(' ').toLowerCase();
    
    return searchFields.includes(searchQuery.toLowerCase());
  });

  const sortedUploads = [...filteredUploads].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        const scoreA = parseInt(a.extracted_json?.score || '0');
        const scoreB = parseInt(b.extracted_json?.score || '0');
        return scoreB - scoreA;
      case 'name':
        const nameA = a.extracted_json?.candidate_name || '';
        const nameB = b.extracted_json?.candidate_name || '';
        return nameA.localeCompare(nameB);
      default:
        return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
    }
  });

  console.log('Dashboard: Rendering dashboard with', uploads.length, 'uploads');

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-blue-900">
      <div className="absolute inset-0 opacity-50" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
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

        <div className="container mx-auto px-4 py-8 space-y-8">
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
          >
            <UploadSection onUploadComplete={handleUploadComplete} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <CandidateGrid uploads={sortedUploads} viewMode={viewMode} />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
