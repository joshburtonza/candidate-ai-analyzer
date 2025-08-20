
import { useEffect, useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('manager' | 'recruiter')[];
  fallbackPath?: string;
}

export const RoleGuard = ({ children, allowedRoles, fallbackPath }: RoleGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, hasRole, loading: roleLoading } = useUserRole();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        setShouldRedirect(true);
        return;
      }

      if (!hasRole) {
        // User needs to set their role
        setShouldRedirect(true);
        return;
      }

      if (role && !allowedRoles.includes(role)) {
        // User doesn't have permission for this route
        setShouldRedirect(true);
        return;
      }

      setShouldRedirect(false);
    }
  }, [user, role, hasRole, authLoading, roleLoading, allowedRoles]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
          <p className="text-white text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasRole) {
    return <Navigate to="/auth?step=role" replace />;
  }

  if (shouldRedirect) {
    if (fallbackPath) {
      return <Navigate to={fallbackPath} replace />;
    }
    
    // Default redirects based on role
    if (role === 'manager') {
      return <Navigate to="/dashboard-v2" replace />;
    } else if (role === 'recruiter') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
