
import React from 'react';
import { CVUpload } from '@/types/candidate';
import { motion } from 'framer-motion';
import { CandidateCard } from './CandidateCard';
import { CandidateListItem } from './CandidateListItem';
import { format, isSameDay } from 'date-fns';

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
  // Filter out candidates without names first
  const uploadsWithNames = uploads.filter(upload => {
    if (!upload.extracted_json) return false;
    const candidateName = upload.extracted_json.candidate_name?.trim();
    return candidateName && candidateName.length > 0;
  });
  
  // Remove duplicates
  const uniqueUploads = removeDuplicates(uploadsWithNames);
  
  // Filter by date if selected
  const filteredUploads = selectedDate 
    ? uniqueUploads.filter(upload => {
        const uploadDate = new Date(upload.uploaded_at);
        return isSameDay(uploadDate, selectedDate);
      })
    : uniqueUploads;

  // Sort by upload date (newest first)
  const sortedUploads = [...filteredUploads].sort((a, b) => 
    new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
  );

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
