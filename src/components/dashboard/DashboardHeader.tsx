
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, Users, BarChart3, Grid, List, BarChart, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  viewMode?: 'grid' | 'list';
  setViewMode?: (mode: 'grid' | 'list') => void;
  showStats?: boolean;
  setShowStats?: (show: boolean) => void;
  selectedUploads?: string[];
  setSelectedUploads?: (uploads: string[]) => void;
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  isExporting?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  title = "Recruiter Dashboard",
  subtitle = "Manage candidates and track applications",
  viewMode = 'grid',
  setViewMode,
  showStats = false,
  setShowStats,
  selectedUploads = [],
  setSelectedUploads,
  onExportCSV,
  onExportPDF,
  isExporting = false
}) => {
  const { signOut, profile } = useAuth();
  const { role, isManager } = useUserRole();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {role && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Role:</span>
              <span className="text-sm font-medium text-foreground capitalize">
                {role}
              </span>
            </div>
          )}
          
          {/* View Mode Toggle */}
          {setViewMode && (
            <div className="flex items-center gap-1 border border-border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Stats Toggle */}
          {setShowStats && (
            <Button
              variant={showStats ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              <BarChart className="h-4 w-4 mr-2" />
              Stats
            </Button>
          )}
          
          {/* Export Buttons */}
          {onExportCSV && onExportPDF && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onExportCSV}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onExportPDF}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          )}
          
          {/* Role-based navigation button */}
          {isManager ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard-v2')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Manager View
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Recruiter View
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/account')}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Account
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
