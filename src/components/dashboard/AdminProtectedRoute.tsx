
import { useAuth } from '@/hooks/useAuth';
import { ReactNode } from 'react';

interface AdminProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const AdminProtectedRoute = ({ children, fallback }: AdminProtectedRouteProps) => {
  const { profile } = useAuth();
  
  // Only Joshua with admin privileges can access
  const isJoshuaAdmin = profile?.email === 'joshuaburton096@gmail.com' && profile?.is_admin;
  
  if (!isJoshuaAdmin) {
    return fallback ? <>{fallback}</> : null;
  }
  
  return <>{children}</>;
};
