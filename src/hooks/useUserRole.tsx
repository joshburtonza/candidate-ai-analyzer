
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'manager' | 'recruiter' | null;

interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(false);
  const [hasRole, setHasRole] = useState(false);

  useEffect(() => {
    if (!user || authLoading) return;

    const fetchUserRole = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user role:', error);
          return;
        }

        if (data) {
          setRole(data.role as UserRole);
          setHasRole(true);
        } else {
          setRole(null);
          setHasRole(false);
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user, authLoading]);

  const setUserRole = async (newRole: 'manager' | 'recruiter') => {
    if (!user) return false;

    try {
      // First, delete any existing role for this user
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);

      // Then insert the new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: newRole
        });

      if (error) {
        console.error('Error setting user role:', error);
        return false;
      }

      setRole(newRole);
      setHasRole(true);
      return true;
    } catch (error) {
      console.error('Error in setUserRole:', error);
      return false;
    }
  };

  return {
    role,
    hasRole,
    loading: loading || authLoading,
    setUserRole,
    isManager: role === 'manager',
    isRecruiter: role === 'recruiter'
  };
};
