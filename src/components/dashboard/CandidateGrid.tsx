
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
}

export const CandidateGrid = ({ uploads, viewMode, selectedDate, filterType = 'all' }: CandidateGridProps) => {
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
  };

  // Memoize the filtering to prevent unnecessary recalculations
  const validUploads = useMemo(() => {
    if (filterType === 'best') {
      if (selectedDate) {
        return filterBestCandidatesForDate(localUploads, selectedDate);
      }
      return filterBestCandidates(localUploads);
    } else {
      if (selectedDate) {
        return filterValidCandidatesForDate(localUploads, selectedDate);
      }
      return filterValidCandidates(localUploads);
    }
  }, [localUploads, selectedDate, filterType]);

  if (validUploads.length === 0) {
    const dateText = selectedDate 
      ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : 'TODAY';
    
    const filterText = filterType === 'best' ? 'BEST ' : '';
    const criteriaText = filterType === 'best' 
      ? 'Candidates must have: B.Ed/PGCE qualification, 2+ years teaching experience, teach academic subjects, and be from UK/USA/Australia/NZ/Canada/Ireland/SA/Dubai'
      : 'Candidates uploaded today (12 AM - 11 PM) with email addresses will appear here';
    
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
