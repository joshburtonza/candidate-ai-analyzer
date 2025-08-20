// Dashboard V2 Toggle Component - for easy switching between versions

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

export const DashboardV2Toggle = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { flags, updateFlag } = useFeatureFlags();
  
  const isOnV2 = location.pathname === '/dashboard-v2';
  const isOnV1 = location.pathname === '/dashboard';
  
  if (!isOnV1 && !isOnV2) return null;

  const handleToggle = () => {
    if (isOnV2) {
      // Switch back to V1
      navigate('/dashboard');
    } else {
      // Switch to V2
      navigate('/dashboard-v2');
    }
  };

  const handleFeatureFlagToggle = () => {
    updateFlag('enableDashboardV2', !flags.enableDashboardV2);
    if (!flags.enableDashboardV2) {
      navigate('/dashboard-v2');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        className="flex items-center gap-2"
      >
        {isOnV2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        {isOnV2 ? 'Classic Dashboard' : 'New Dashboard'}
      </Button>
      
      {/* Admin-only feature flag toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleFeatureFlagToggle}
        className="text-xs opacity-70 hover:opacity-100"
      >
        V2: {flags.enableDashboardV2 ? 'ON' : 'OFF'}
      </Button>
    </div>
  );
};