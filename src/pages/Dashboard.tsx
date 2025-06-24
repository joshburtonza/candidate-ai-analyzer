
import { useDashboard } from '@/hooks/useDashboard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { DashboardStates } from '@/components/dashboard/DashboardStates';

const Dashboard = () => {
  const {
    user,
    profile,
    authLoading,
    uploads,
    loading,
    error,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    selectedDate,
    handleUploadComplete,
    handleBatchComplete,
    handleDateSelect,
    retryFetch,
  } = useDashboard();

  // Show loading/error states if needed
  const stateComponent = DashboardStates({ 
    authLoading, 
    loading, 
    error, 
    user, 
    onRetry: retryFetch 
  });

  if (stateComponent) {
    return stateComponent;
  }

  console.log('Dashboard: Rendering dashboard with', uploads.length, 'uploads');

  return (
    <div className="min-h-screen dot-grid-bg">
      <div className="relative z-10">
        <DashboardHeader
          profile={profile}
          searchQuery=""
          onSearchChange={() => {}}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <DashboardContent
          uploads={uploads}
          sortBy={sortBy}
          selectedDate={selectedDate}
          onUploadComplete={handleUploadComplete}
          onBatchComplete={handleBatchComplete}
          onDateSelect={handleDateSelect}
        />
      </div>
    </div>
  );
};

export default Dashboard;
