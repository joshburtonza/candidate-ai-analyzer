
import React, { useState, useEffect } from 'react';
import { CVUpload } from '@/types/candidate';
import { motion } from 'framer-motion';
import { CandidateCard } from './CandidateCard';
import { CandidateListItem } from './CandidateListItem';
import { format, isSameDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface CandidateGridProps {
  uploads: CVUpload[];
  viewMode: 'grid' | 'list';
  selectedDate?: Date | null;
  onCandidateDelete?: (deletedId: string) => void;
}

// Function to remove duplicates based on email and candidate name
const removeDuplicates = (uploads: CVUpload[]): CVUpload[] => {
  const seen = new Set<string>();
  const uniqueUploads: CVUpload[] = [];

  for (const upload of uploads) {
    if (!upload.extracted_json) continue;
    
    const data = upload.extracted_json;
    const email = data.email_address?.toLowerCase().trim() || '';
    const name = data.candidate_name?.toLowerCase().trim() || '';
    
    // Create a unique key based on email and name
    const uniqueKey = `${email}|${name}`;
    
    // Skip if we've already seen this combination
    if (seen.has(uniqueKey)) {
      console.log(`Filtering out duplicate candidate: ${data.candidate_name} (${data.email_address})`);
      continue;
    }
    
    seen.add(uniqueKey);
    uniqueUploads.push(upload);
  }

  console.log(`Filtered ${uploads.length - uniqueUploads.length} duplicates from ${uploads.length} uploads`);
  return uniqueUploads;
};

const CandidateGrid: React.FC<CandidateGridProps> = ({
  uploads,
  viewMode,
  selectedDate,
  onCandidateDelete
}) => {
  const [dateFilteredUploads, setDateFilteredUploads] = useState<CVUpload[]>([]);
  const [isLoadingDateFilter, setIsLoadingDateFilter] = useState(false);

  // Fetch date-filtered candidates using the optimized API when a date is selected
  useEffect(() => {
    if (selectedDate) {
      const fetchDateFilteredCandidates = async () => {
        setIsLoadingDateFilter(true);
        try {
          const dateStr = format(selectedDate, 'yyyy-MM-dd');
          console.log(`CandidateGrid: Fetching candidates for date ${dateStr}`);
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
          // Fallback to legacy filtering if API fails
          fallbackToLegacyFiltering();
        } finally {
          setIsLoadingDateFilter(false);
        }
      };

      fetchDateFilteredCandidates();
    } else {
      setDateFilteredUploads([]);
    }
  }, [selectedDate]);

  // Fallback to legacy filtering if optimized API fails
  const fallbackToLegacyFiltering = () => {
    if (selectedDate) {
      const uploadsWithNames = uploads.filter(upload => {
        if (!upload.extracted_json) return false;
        const candidateName = upload.extracted_json.candidate_name?.trim();
        return candidateName && candidateName.length > 0;
      });
      
      const uniqueUploads = removeDuplicates(uploadsWithNames);
      
      const filtered = uniqueUploads.filter(upload => {
        // Check both received_date column and extracted_json.date_received
        const receivedDateFromColumn = upload.received_date;
        const receivedDateFromJson = upload.extracted_json?.date_received;
        
        if (receivedDateFromColumn) {
          const receivedDate = new Date(receivedDateFromColumn);
          return isSameDay(receivedDate, selectedDate);
        } else if (receivedDateFromJson) {
          const receivedDate = new Date(receivedDateFromJson);
          return isSameDay(receivedDate, selectedDate);
        }
        
        return false;
      });
      
      setDateFilteredUploads(filtered);
    }
  };

  // Determine which uploads to show
  const uploadsToShow = selectedDate ? dateFilteredUploads : (() => {
    // For non-date-filtered view, use legacy logic with deduplication
    const uploadsWithNames = uploads.filter(upload => {
      if (!upload.extracted_json) return false;
      const candidateName = upload.extracted_json.candidate_name?.trim();
      return candidateName && candidateName.length > 0;
    });
    
    return removeDuplicates(uploadsWithNames);
  })();

  // Sort by received date (newest first)
  const sortedUploads = [...uploadsToShow].sort((a, b) => {
    const aDate = a.received_date ? new Date(a.received_date) : a.extracted_json?.date_received ? new Date(a.extracted_json.date_received) : new Date();
    const bDate = b.received_date ? new Date(b.received_date) : b.extracted_json?.date_received ? new Date(b.extracted_json.date_received) : new Date();
    return bDate.getTime() - aDate.getTime();
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
