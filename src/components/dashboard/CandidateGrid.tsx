
import React, { useState, useEffect } from 'react';
import { CVUpload } from '@/types/candidate';
import { motion } from 'framer-motion';
import { CandidateCard } from './CandidateCard';
import { CandidateListItem } from './CandidateListItem';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { getEffectiveDateString, formatDateForDB } from '@/utils/dateUtils';
import { normalizeFirstLastName } from '@/utils/candidateFilters';
interface CandidateGridProps {
  uploads: CVUpload[];
  viewMode: 'grid' | 'list';
  selectedDate?: Date | null;
  onCandidateDelete?: (deletedId: string) => void;
  dedupe?: boolean;
  requireName?: boolean;
  dateFilterMode?: 'api' | 'client'; // 'api' for All Uploads, 'client' for Best Candidates
}

// Function to remove duplicates based on first and last name
const removeDuplicates = (uploads: CVUpload[]): CVUpload[] => {
  const seen = new Set<string>();
  const uniqueUploads: CVUpload[] = [];

  for (const upload of uploads) {
    if (!upload.extracted_json) continue;
    
    const data = upload.extracted_json;
    const candidateName = data.candidate_name?.trim() || '';
    
    if (!candidateName) continue;
    
    // Extract first and last name
    const normalizedName = normalizeFirstLastName(candidateName);
    
    // Skip if we've already seen this name combination
    if (normalizedName && seen.has(normalizedName)) {
      console.log(`Filtering out duplicate candidate: ${data.candidate_name}`);
      continue;
    }
    
    if (normalizedName) {
      seen.add(normalizedName);
    }
    uniqueUploads.push(upload);
  }

  console.log(`Filtered ${uploads.length - uniqueUploads.length} duplicates from ${uploads.length} uploads`);
  return uniqueUploads;
};

const CandidateGrid: React.FC<CandidateGridProps> = ({
  uploads,
  viewMode,
  selectedDate,
  onCandidateDelete,
  dedupe = true,
  requireName = true,
  dateFilterMode = 'api'
}) => {
  const [dateFilteredUploads, setDateFilteredUploads] = useState<CVUpload[]>([]);
  const [isLoadingDateFilter, setIsLoadingDateFilter] = useState(false);

  // Handle date filtering based on mode
  useEffect(() => {
    if (selectedDate) {
      if (dateFilterMode === 'api') {
        // Use optimized API for All Uploads tab
        const fetchDateFilteredCandidates = async () => {
          setIsLoadingDateFilter(true);
          try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            console.log(`CandidateGrid: Fetching candidates for date ${dateStr} via API`);
            const response = await fetch(
              `https://qsvadxpossrsnenvfdsv.supabase.co/functions/v1/candidates-by-date?date=${dateStr}`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`CandidateGrid: API returned ${data.candidates?.length || 0} candidates for ${dateStr}:`, data);
            setDateFilteredUploads(data.candidates || []);
          } catch (error) {
            console.error('Error fetching date-filtered candidates:', error);
            // Fallback to client-side filtering if API fails
            fallbackToClientSideFiltering();
          } finally {
            setIsLoadingDateFilter(false);
          }
        };

        fetchDateFilteredCandidates();
      } else {
        // Use client-side filtering for Best Candidates tab
        console.log(`CandidateGrid: Filtering ${uploads.length} candidates for date ${format(selectedDate, 'yyyy-MM-dd')} via client`);
        setIsLoadingDateFilter(true);
        fallbackToClientSideFiltering();
        setIsLoadingDateFilter(false);
      }
    } else {
      setDateFilteredUploads([]);
    }
  }, [selectedDate, dateFilterMode, uploads]);

  // Client-side filtering for fallback or Best Candidates tab
  const fallbackToClientSideFiltering = () => {
    if (selectedDate) {
      const targetStr = format(selectedDate, 'yyyy-MM-dd');
      console.log(`CandidateGrid: Client-side filtering for date ${targetStr}`);
      const filtered = uploads.filter(upload => {
        const uploadDateStr = getEffectiveDateString(upload);
        console.log(`CandidateGrid: Comparing ${uploadDateStr} === ${targetStr}`);
        return uploadDateStr === targetStr;
      });
      console.log(`CandidateGrid: Client-side filtering returned ${filtered.length} candidates`);
      setDateFilteredUploads(filtered);
    }
  };

  // Determine which uploads to show
  const uploadsToShow = selectedDate ? dateFilteredUploads : (() => {
    let filteredUploads = uploads;
    
    // Filter by name requirement if enabled
    if (requireName) {
      filteredUploads = filteredUploads.filter(upload => {
        if (!upload.extracted_json) return false;
        const candidateName = upload.extracted_json.candidate_name?.trim();
        return candidateName && candidateName.length > 0;
      });
    }
    
    // Apply deduplication if enabled
    if (dedupe) {
      filteredUploads = removeDuplicates(filteredUploads);
    }
    
    return filteredUploads;
  })();

// Sort by date_received string (YYYY-MM-DD), newest first
const sortedUploads = [...uploadsToShow].sort((a, b) => {
  const aStr = getEffectiveDateString(a);
  const bStr = getEffectiveDateString(b);
  return bStr.localeCompare(aStr);
});

  const handleCandidateDelete = (deletedId: string) => {
    onCandidateDelete?.(deletedId);
  };

  // Show empty state
  if (sortedUploads.length === 0) {
    const emptyMessage = selectedDate
      ? `No uploads found for ${format(selectedDate, 'MMMM do, yyyy')}`
      : 'No uploads found';

    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg">{emptyMessage}</div>
        {selectedDate && (
          <p className="text-sm text-muted-foreground mt-2">
            Try selecting a different date or upload some CVs
          </p>
        )}
      </div>
    );
  }

  // Grid view
  if (viewMode === 'grid') {
    return (
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {sortedUploads.map((upload, index) => (
          <motion.div
            key={upload.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <CandidateCard 
              upload={upload} 
              onDelete={handleCandidateDelete}
            />
          </motion.div>
        ))}
      </motion.div>
    );
  }

  // List view
  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {sortedUploads.map((upload, index) => (
        <motion.div
          key={upload.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <CandidateListItem 
            upload={upload} 
            onDelete={handleCandidateDelete}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default CandidateGrid;
