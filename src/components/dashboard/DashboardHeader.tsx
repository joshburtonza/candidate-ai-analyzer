import React from 'react';
import { Grid, List, BarChart3, Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { useVertical } from '@/context/VerticalContext';
import VerticalSelector from './VerticalSelector';
import PresetSelector from './PresetSelector';

interface DashboardHeaderProps {
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  showStats: boolean;
  setShowStats: (show: boolean) => void;
  selectedUploads: string[];
  setSelectedUploads: (uploads: string[]) => void;
  onExport: () => void;
  isExporting: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  viewMode,
  setViewMode,
  showStats,
  setShowStats,
  selectedUploads,
  setSelectedUploads,
  onExport,
  isExporting
}) => {
  const navigate = useNavigate();
  const { flags } = useFeatureFlags();
  const { strictMode, setStrictMode } = useVertical();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">CV Uploads Dashboard</h1>
        <p className="text-muted-foreground">Manage and review all uploaded CVs</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Feature Flag Controls */}
        {flags.enableVerticals && (
          <VerticalSelector />
        )}
        
        {flags.enableFilterPresets && (
          <PresetSelector />
        )}
        
        {(flags.enableVerticals || flags.enableFilterPresets) && (
          <div className="flex items-center gap-2">
            <Switch
              id="strict-mode"
              checked={strictMode}
              onCheckedChange={setStrictMode}
            />
            <Label htmlFor="strict-mode" className="text-sm text-muted-foreground">
              Strict
            </Label>
          </div>
        )}

        <Button
          variant={showStats ? "default" : "outline"}
          size="sm"
          onClick={() => setShowStats(!showStats)}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Stats
        </Button>

        <div className="flex bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isExporting}
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/account')}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;