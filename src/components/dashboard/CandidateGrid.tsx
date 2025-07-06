
import { useState, useEffect, useMemo } from 'react';
import { Candidate } from '@/types/candidate';
import { CandidateCard } from './CandidateCard';
import { CandidateListItem } from './CandidateListItem';
import { motion } from 'framer-motion';
import { FileText, Calendar } from 'lucide-react';
import { filterValidCandidates, filterValidCandidatesForDate, filterQualifiedTeachers, filterQualifiedTeachersForDate } from '@/utils/candidateFilters';

interface CandidateGridProps {
  uploads: Candidate[];
  viewMode: 'grid' | 'list';
  selectedDate?: Date | null;
  candidateView?: 'all' | 'qualified';
  onCandidateDelete?: (id: string) => void;
}

export const CandidateGrid = ({ uploads, viewMode, selectedDate, candidateView = 'all', onCandidateDelete }: CandidateGridProps) => {
  const [localUploads, setLocalUploads] = useState(uploads);
  
  // Update local uploads when prop changes
  useEffect(() => {
    setLocalUploads(uploads);
  }, [uploads]);

  const handleCandidateDelete = (deletedId: string) => {
    console.log('CandidateGrid: Handling candidate delete:', deletedId);
    setLocalUploads(prev => prev.filter(upload => upload.id !== deletedId));
    // Also notify parent component to update its state
    if (onCandidateDelete) {
      onCandidateDelete(deletedId);
    }
  };

  // For now, just display all candidates without complex filtering
  // since we're using the simplified structure
  const validUploads = useMemo(() => {
    let filtered = [...localUploads];
    
    // Apply date filter if selected
    if (selectedDate) {
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      filtered = filtered.filter(candidate => {
        const candidateDate = new Date(candidate.created_at).toISOString().split('T')[0];
        return candidateDate === selectedDateStr;
      });
    }
    
    return filtered;
  }, [localUploads, selectedDate]);

  if (validUploads.length === 0) {
    const dateText = selectedDate 
      ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : 'TODAY';
    
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
          NO {candidateView === 'qualified' ? 'QUALIFIED TEACHING' : ''} CANDIDATES {selectedDate ? 'FOR ' + dateText.toUpperCase() : 'TODAY'}
        </h3>
        <p className="text-white/70 text-lg">
          {selectedDate 
            ? `No ${candidateView === 'qualified' ? 'qualified teaching ' : ''}candidates were uploaded on ${selectedDate.toLocaleDateString()}`
            : `${candidateView === 'qualified' ? 'Qualified teaching ' : 'All '}candidates uploaded today will appear here`
          }
        </p>
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
