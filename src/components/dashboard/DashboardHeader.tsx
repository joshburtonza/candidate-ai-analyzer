
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, subtitle }) => {
  const { signOut, profile } = useAuth();
  const { role, isManager } = useUserRole();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleRoleSwitch = () => {
    if (isManager) {
      navigate('/dashboard-v2');
    } else {
      navigate('/dashboard');
    }
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
