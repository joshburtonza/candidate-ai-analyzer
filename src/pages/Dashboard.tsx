import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CVUpload } from '@/types/candidate';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { UploadSection } from '@/components/dashboard/UploadSection';
import { CandidateGrid } from '@/components/dashboard/CandidateGrid';
import { UploadHistoryCalendar } from '@/components/dashboard/UploadHistoryCalendar';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { isSameDay } from 'date-fns';

const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [uploads, setUploads] = useState<CVUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const { toast } = useToast();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    console.log('Dashboard: Auth state - authLoading:', authLoading, 'user:', user?.id || 'null', 'profile email:', profile?.email);
    
    // Only fetch uploads when we have a user and auth is not loading
    if (!authLoading && user) {
      console.log('Dashboard: User authenticated, fetching uploads with email filtering');
      fetchUploads();
      setupRealtimeSubscription();
    } else if (!authLoading && !user) {
      console.log('Dashboard: No user found after auth loaded');
      setLoading(false);
    }

    // Cleanup subscription on unmount or when user changes
    return () => {
      if (subscriptionRef.current) {
        console.log('Dashboard: Cleaning up realtime subscription');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user, authLoading]);

  const setupRealtimeSubscription = () => {
    // Clean up existing subscription first
    if (subscriptionRef.current) {
      console.log('Dashboard: Removing existing subscription');
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    console.log('Dashboard: Setting up new realtime subscription with email filtering');
    
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
          console.log('Dashboard: New upload received via realtime:', payload);
          
          const newUpload = payload.new as CVUpload;
          
          // Check if this upload should be visible to current user
          const shouldShow = !newUpload.source_email || 
                           newUpload.source_email === '' || 
                           newUpload.source_email === profile?.email ||
                           profile?.is_admin;
          
          if (shouldShow) {
            // Add to uploads list
            setUploads(prev => [newUpload, ...prev]);
            
            // Show toast notification
            if (newUpload.extracted_json?.candidate_name) {
              toast({
                title: "New Candidate Added",
                description: `${newUpload.extracted_json.candidate_name} has been processed and added to your dashboard`,
              });
            }
          } else {
            console.log('Dashboard: Upload filtered out due to email mismatch', {
              sourceEmail: newUpload.source_email,
              userEmail: profile?.email
            });
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
      
      // The RLS policies will handle the email filtering automatically
      const { data, error } = await supabase
        .from('cv_uploads')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Dashboard: Error fetching uploads:', error);
        throw error;
      }
      
      console.log('Dashboard: Fetched', data?.length || 0, 'uploads (filtered by email)');
      
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

  const handleDateRangeChange = (startDate: Date | null, endDate: Date | null) => {
    setDateRange({ start: startDate, end: endDate });
    // Clear calendar date selection when using date range
    setSelectedCalendarDate(null);
  };

  const handleCalendarDateSelect = (date: Date) => {
    setSelectedCalendarDate(date);
    // Clear date range when using calendar selection
    setDateRange({ start: null, end: null });
  };

  // Show loading only if auth is loading
  if (authLoading) {
    console.log('Dashboard: Showing auth loading screen');
    return (
      <div className="min-h-screen elegant-gradient flex items-center justify-center">
        <div className="text-white text-elegant tracking-wider">LOADING AUTHENTICATION...</div>
      </div>
    );
  }

  // Show loading screen only for data loading (not auth loading)
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

  // Filter uploads by date range or calendar selection
  const dateFilteredUploads = uploads.filter(upload => {
    // Calendar date selection takes priority
    if (selectedCalendarDate) {
      return isSameDay(new Date(upload.uploaded_at), selectedCalendarDate);
    }
    
    // Otherwise use date range
    if (!dateRange.start && !dateRange.end) return true;
    
    const uploadDate = new Date(upload.uploaded_at);
    
    if (dateRange.start && uploadDate < dateRange.start) return false;
    if (dateRange.end) {
      // Set end date to end of day for inclusive filtering
      const endOfDay = new Date(dateRange.end);
      endOfDay.setHours(23, 59, 59, 999);
      if (uploadDate > endOfDay) return false;
    }
    
    return true;
  });

  // Filter and sort uploads
  const filteredUploads = dateFilteredUploads.filter(upload => {
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
          onDateRangeChange={handleDateRangeChange}
        />

        <div className="container mx-auto px-6 py-8 space-y-8">
          {/* Email Filter Info - Only show for non-admin users */}
          {profile && !profile.is_admin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 rounded-xl elegant-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <p className="text-white/80 text-sm">
                  Showing complete profiles with scores ≥ 5/10 sent to: <span className="text-orange-400 font-medium">{profile.email}</span>
                </p>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
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
            <DashboardStats uploads={sortedUploads} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <UploadSection onUploadComplete={handleUploadComplete} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <CandidateGrid uploads={sortedUploads} viewMode={viewMode} />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
