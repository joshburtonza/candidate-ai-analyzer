
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

interface DashboardV2HeaderProps {
  title: string;
  subtitle?: string;
}

const DashboardV2Header: React.FC<DashboardV2HeaderProps> = ({ title, subtitle }) => {
  const { signOut } = useAuth();
  const { role, isManager } = useUserRole();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="bg-v2-surface border-b border-v2-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-v2-text-primary">{title}</h1>
          {subtitle && (
            <p className="text-sm text-v2-text-secondary mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {role && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-v2-text-secondary">Role:</span>
              <span className="text-sm font-medium text-v2-text-primary capitalize">
                {role}
              </span>
            </div>
          )}
          
          {/* Switch to recruiter view */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 bg-v2-surface border-v2-border text-v2-text-primary hover:bg-v2-surface-hover"
          >
            <Users className="h-4 w-4" />
            Recruiter View
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/account')}
            className="flex items-center gap-2 bg-v2-surface border-v2-border text-v2-text-primary hover:bg-v2-surface-hover"
          >
            <Settings className="h-4 w-4" />
            Account
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-v2-surface border-v2-border text-v2-text-primary hover:bg-v2-surface-hover"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardV2Header;
