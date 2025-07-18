
import { useState, useEffect, useMemo } from 'react';
import { CVUpload } from '@/types/candidate';
import { CandidateCard } from './CandidateCard';
import { CandidateListItem } from './CandidateListItem';
import { motion } from 'framer-motion';
import { FileText, Calendar } from 'lucide-react';
import { filterValidCandidates, filterValidCandidatesForDate, filterBestCandidates, filterBestCandidatesForDate } from '@/utils/candidateFilters';

interface CandidateGridProps {
  uploads: CVUpload[];
  viewMode: 'grid' | 'list';
  selectedDate?: Date | null;
  filterType?: 'all' | 'best';
  onCandidateDelete?: (deletedId: string) => void;
}

export const CandidateGrid = ({ uploads, viewMode, selectedDate, filterType = 'all', onCandidateDelete }: CandidateGridProps) => {
  const [localUploads, setLocalUploads] = useState(uploads);
  
  // Update local uploads when prop changes
  useEffect(() => {
    setLocalUploads(uploads);
  }, [uploads]);

  const handleCandidateDelete = (deletedId: string) => {
    console.log('CandidateGrid: Removing candidate from local state:', deletedId);
    setLocalUploads(prev => {
      const filtered = prev.filter(upload => upload.id !== deletedId);
      console.log('CandidateGrid: Candidates remaining after deletion:', filtered.length);
      return filtered;
    });
    
    // Also notify parent component
    if (onCandidateDelete) {
      console.log('CandidateGrid: Notifying parent component of deletion');
      onCandidateDelete(deletedId);
    }
  };

  // Memoize the filtering to prevent unnecessary recalculations
  const validUploads = useMemo(() => {
    if (selectedDate) {
      // When a specific date is selected, filter for that date
      if (filterType === 'best') {
        return filterBestCandidatesForDate(localUploads, selectedDate);
      } else {
        return filterValidCandidatesForDate(localUploads, selectedDate);
      }
    } else {
      // When no date is selected, show ALL qualified candidates (not just today's)
      // Apply basic qualification filters without date restriction
      const seenEmails = new Set<string>();
      
      return localUploads.filter(upload => {
        // Basic qualification check (must have email and be completed)
        if (upload.processing_status !== 'completed' || !upload.extracted_json?.email_address) {
          return false;
        }
        
        // Filter out duplicates based on email
        const candidateEmail = upload.extracted_json.email_address;
        if (candidateEmail) {
          const normalizedEmail = candidateEmail.toLowerCase().trim();
          if (seenEmails.has(normalizedEmail)) {
            return false;
          }
          seenEmails.add(normalizedEmail);
        }
        
        // Apply best candidate filters if needed
        if (filterType === 'best') {
          // You can add additional best candidate logic here if needed
          return true; // For now, just show all qualified candidates
        }
        
        return true;
      });
    }
  }, [localUploads, selectedDate, filterType]);

  if (validUploads.length === 0) {
    const dateText = selectedDate 
      ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : 'TODAY';
    
    const filterText = filterType === 'best' ? 'BEST ' : '';
    const criteriaText = filterType === 'best' 
      ? 'Candidates must have: B.Ed/PGCE qualification, 2+ years teaching experience, teach academic subjects, and be from UK/USA/Australia/NZ/Canada/Ireland/SA/Dubai'
      : 'Candidates uploaded with email addresses will appear here (use calendar to filter by date)';
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 glass-card rounded-2xl mb-6 elegant-border">
          <Calendar className="w-10 h-10 gold-accent" />
        </div>
        <h3 className="text-2xl font-semibold text-white mb-4 text-elegant tracking-wider">
          NO {filterText}CANDIDATES {selectedDate ? 'FOR ' + dateText.toUpperCase() : 'TODAY'}
        </h3>
        <p className="text-white/70 text-lg">
          {selectedDate 
            ? `No ${filterType === 'best' ? 'best ' : ''}candidates were uploaded on ${selectedDate.toLocaleDateString()}`
            : criteriaText
          }
        </p>
        <p className="text-white/50 text-sm mt-2">All duplicates are automatically merged into single profiles</p>
      </motion.div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {validUploads.map((upload, index) => (
          <motion.div
            key={upload.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <CandidateListItem upload={upload} onDelete={handleCandidateDelete} />
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {validUploads.map((upload, index) => (
        <motion.div
          key={upload.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
        >
          <CandidateCard upload={upload} onDelete={handleCandidateDelete} />
        </motion.div>
      ))}
    </div>
  );
};
