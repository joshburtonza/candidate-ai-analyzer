
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

  console.log('RoleGuard: State check', {
    user: !!user,
    authLoading,
    roleLoading,
    hasRole,
    role,
    allowedRoles
  });

  // Show loading while auth is being resolved
  if (authLoading || roleLoading) {
    console.log('RoleGuard: Loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
          <p className="text-white text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to auth
  if (!user) {
    console.log('RoleGuard: No user, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  // User exists but has no role - redirect to role selection
  if (!hasRole) {
    console.log('RoleGuard: User has no role, redirecting to /auth?step=role');
    return <Navigate to="/auth?step=role" replace />;
  }

  // User has wrong role for this route
  if (role && !allowedRoles.includes(role)) {
    console.log('RoleGuard: User role not allowed', { role, allowedRoles });
    
    if (fallbackPath) {
      console.log('RoleGuard: Using fallback path', fallbackPath);
      return <Navigate to={fallbackPath} replace />;
    }
    
    // Default redirects based on role
    const defaultPath = role === 'manager' ? '/dashboard-v2' : '/dashboard';
    console.log('RoleGuard: Using default redirect', defaultPath);
    return <Navigate to={defaultPath} replace />;
  }

  // All checks passed
  console.log('RoleGuard: All checks passed, rendering children');
  return <>{children}</>;
};
