
import { useState, useEffect, useMemo } from 'react';
import { CVUpload } from '@/types/candidate';
import { SearchCriteria, AdvancedFilters } from '@/types/batch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useAdvancedSearch = (uploads: CVUpload[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<AdvancedFilters>({
    scoreRange: [0, 10],
    skills: [],
    countries: [],
    candidateStatus: [],
    tags: [],
  });
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const { user } = useAuth();

  // Load saved searches
  useEffect(() => {
    if (user) {
      loadSavedSearches();
    }
  }, [user]);

  const loadSavedSearches = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedSearches(data || []);
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  };

  const saveSearch = async (name: string) => {
    if (!user) return;
    
    try {
      const searchCriteria: SearchCriteria = {
        query: searchQuery,
        minScore: filters.scoreRange[0],
        maxScore: filters.scoreRange[1],
        skills: filters.skills,
        countries: filters.countries,
        candidateStatus: filters.candidateStatus,
        tags: filters.tags,
        dateRange: filters.dateRange ? {
          from: filters.dateRange.from.toISOString(),
          to: filters.dateRange.to.toISOString(),
        } : undefined,
      };

      const { error } = await supabase
        .from('saved_searches')
        .insert({
          user_id: user.id,  // Added user_id
          name,
          search_criteria: searchCriteria as any,  // Cast to any for Json compatibility
        });

      if (error) throw error;
      await loadSavedSearches();
    } catch (error) {
      console.error('Error saving search:', error);
      throw error;
    }
  };

  const loadSearch = (searchCriteria: SearchCriteria) => {
    setSearchQuery(searchCriteria.query || '');
    setFilters({
      scoreRange: [searchCriteria.minScore || 0, searchCriteria.maxScore || 10],
      skills: searchCriteria.skills || [],
      countries: searchCriteria.countries || [],
      candidateStatus: searchCriteria.candidateStatus || [],
      tags: searchCriteria.tags || [],
      dateRange: searchCriteria.dateRange ? {
        from: new Date(searchCriteria.dateRange.from),
        to: new Date(searchCriteria.dateRange.to),
      } : undefined,
    });
  };

  const filteredUploads = useMemo(() => {
    return uploads.filter(upload => {
      if (!upload.extracted_json) return false;

      const data = upload.extracted_json;
      const score = parseFloat(data.score || '0');

      // Text search
      if (searchQuery) {
        const searchFields = [
          data.candidate_name,
          data.email_address,
          data.skill_set,
          data.countries,
          upload.original_filename,
          upload.notes,
          ...(upload.tags || [])
        ].join(' ').toLowerCase();

        if (!searchFields.includes(searchQuery.toLowerCase())) {
          return false;
        }
      }

      // Score range filter
      if (score < filters.scoreRange[0] || score > filters.scoreRange[1]) {
        return false;
      }

      // Skills filter
      if (filters.skills.length > 0) {
        const candidateSkills = data.skill_set?.toLowerCase().split(',').map(s => s.trim()) || [];
        const hasMatchingSkill = filters.skills.some(skill => 
          candidateSkills.some(candidateSkill => 
            candidateSkill.includes(skill.toLowerCase())
          )
        );
        if (!hasMatchingSkill) return false;
      }

      // Countries filter
      if (filters.countries.length > 0) {
        const candidateCountries = data.countries?.toLowerCase() || '';
        const hasMatchingCountry = filters.countries.some(country => 
          candidateCountries.includes(country.toLowerCase())
        );
        if (!hasMatchingCountry) return false;
      }

      // Candidate status filter
      if (filters.candidateStatus.length > 0) {
        const status = upload.candidate_status || 'new';
        if (!filters.candidateStatus.includes(status)) return false;
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const uploadTags = upload.tags || [];
        const hasMatchingTag = filters.tags.some(tag => uploadTags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const uploadDate = new Date(upload.uploaded_at);
        if (uploadDate < filters.dateRange.from || uploadDate > filters.dateRange.to) {
          return false;
        }
      }

      return true;
    });
  }, [uploads, searchQuery, filters]);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    filteredUploads,
    savedSearches,
    saveSearch,
    loadSearch,
  };
};
