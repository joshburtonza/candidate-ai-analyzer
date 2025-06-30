
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const AuthGuard = ({ children, requireAdmin = false }: AuthGuardProps) => {
  const { user, profile, loading } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!loading) {
      setAuthChecked(true);
    }
  }, [loading]);

  // Show loading while auth is being checked
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
          <p className="text-white text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check admin requirement
  if (requireAdmin && !profile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access this area.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
