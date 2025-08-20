
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
    <div className="bg-black border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {role && (
            <div className="px-3 py-1.5 bg-pastel-purple/20 border border-pastel-purple/30 rounded-full">
              <span className="text-sm font-medium text-pastel-purple capitalize tracking-wide">
                {role}
              </span>
            </div>
          )}
          
          {/* View Mode Toggle */}
          {setViewMode && (
            <div className="flex items-center gap-1 bg-gray-900 border border-gray-700 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-pastel-cyan text-black' : 'text-gray-300 hover:text-white hover:bg-gray-800'}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-pastel-cyan text-black' : 'text-gray-300 hover:text-white hover:bg-gray-800'}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Stats Toggle */}
          {setShowStats && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className={showStats 
                ? 'bg-pastel-pink text-black hover:bg-pastel-pink/80' 
                : 'text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700'
              }
            >
              <BarChart className="h-4 w-4 mr-2" />
              Stats
            </Button>
          )}
          
          {/* Export Buttons */}
          {onExportCSV && onExportPDF && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onExportCSV}
                disabled={isExporting}
                className="text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onExportPDF}
                disabled={isExporting}
                className="text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          )}
          
          {/* Role-based navigation button */}
          {isManager ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard-v2')}
              className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700"
            >
              <BarChart3 className="h-4 w-4" />
              Manager View
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700"
            >
              <Users className="h-4 w-4" />
              Recruiter View
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/account')}
            className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700"
          >
            <Settings className="h-4 w-4" />
            Account
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700"
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
