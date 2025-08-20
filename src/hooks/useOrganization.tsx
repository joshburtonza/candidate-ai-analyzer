import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'manager' | 'recruiter';
  created_at: string;
  updated_at: string;
}

export const useOrganization = () => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [membershipInfo, setMembershipInfo] = useState<OrganizationMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasOrganization, setHasOrganization] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrganization();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      
      // First get the user's organization membership
      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_members')
        .select(`
          id,
          organization_id,
          user_id,
          role,
          created_at,
          updated_at,
          organizations (
            id,
            name,
            slug,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user!.id)
        .single();

      if (membershipError) {
        console.error('Error fetching organization membership:', membershipError);
        setHasOrganization(false);
        return;
      }

      if (membershipData && membershipData.organizations) {
        setMembershipInfo({
          id: membershipData.id,
          organization_id: membershipData.organization_id,
          user_id: membershipData.user_id,
          role: membershipData.role,
          created_at: membershipData.created_at,
          updated_at: membershipData.updated_at,
        });
        
        setOrganization(membershipData.organizations as Organization);
        setHasOrganization(true);
      } else {
        setHasOrganization(false);
      }
    } catch (error) {
      console.error('Error in fetchOrganization:', error);
      setHasOrganization(false);
    } finally {
      setLoading(false);
    }
  };

  const createOrganization = async (name: string, slug: string, userRole: 'manager' | 'recruiter') => {
    try {
      // Create the organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: name,
          slug: slug
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add the user as a member
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: orgData.id,
          user_id: user!.id,
          role: userRole
        });

      if (memberError) throw memberError;

      // Refresh the organization data
      await fetchOrganization();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error creating organization:', error);
      return { success: false, error: error.message || 'Failed to create organization' };
    }
  };

  const joinOrganization = async (slug: string, userRole: 'manager' | 'recruiter') => {
    try {
      // Find the organization by slug
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('slug', slug)
        .single();

      if (orgError || !orgData) {
        return { success: false, error: 'Organization not found' };
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', orgData.id)
        .eq('user_id', user!.id)
        .single();

      if (existingMember) {
        return { success: false, error: 'You are already a member of this organization' };
      }

      // Add the user as a member
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: orgData.id,
          user_id: user!.id,
          role: userRole
        });

      if (memberError) throw memberError;

      // Refresh the organization data
      await fetchOrganization();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error joining organization:', error);
      return { success: false, error: error.message || 'Failed to join organization' };
    }
  };

  const isManager = membershipInfo?.role === 'manager';
  const isRecruiter = membershipInfo?.role === 'recruiter';

  return {
    organization,
    membershipInfo,
    loading,
    hasOrganization,
    isManager,
    isRecruiter,
    createOrganization,
    joinOrganization,
    refetch: fetchOrganization
  };
};