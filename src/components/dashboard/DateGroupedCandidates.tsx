import { useMemo } from 'react';
import { CVUpload } from '@/types/candidate';
import { CandidateCard } from './CandidateCard';
import { CandidateListItem } from './CandidateListItem';
import { motion } from 'framer-motion';
import { Calendar, Users } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';

interface DateGroupedCandidatesProps {
  uploads: CVUpload[];
  viewMode: 'grid' | 'list';
  sortBy: 'date' | 'score' | 'name';
  onCandidateDelete: (deletedId: string) => void;
}

export const DateGroupedCandidates = ({ 
  uploads, 
  viewMode, 
  sortBy, 
  onCandidateDelete 
}: DateGroupedCandidatesProps) => {
  // Group candidates by date when sorting by date
  const groupedCandidates = useMemo(() => {
    if (sortBy !== 'date') {
      return null; // Return null for non-date sorting
    }

    const groups: { [key: string]: CVUpload[] } = {};
    
    uploads.forEach(upload => {
      const uploadDate = new Date(upload.uploaded_at);
      const dateKey = format(uploadDate, 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(upload);
    });

    // Sort groups by date (newest first) and sort candidates within each group
    const sortedGroups = Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([dateKey, candidates]) => ({
        date: new Date(dateKey),
        candidates: candidates.sort((a, b) => 
          new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
        )
      }));

    return sortedGroups;
  }, [uploads, sortBy]);

  // If not sorting by date, return regular candidate list
  if (sortBy !== 'date' || !groupedCandidates) {
    if (viewMode === 'list') {
      return (
        <div className="space-y-4">
          {uploads.map((upload, index) => (
            <motion.div
              key={upload.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <CandidateListItem upload={upload} onDelete={onCandidateDelete} />
            </motion.div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {uploads.map((upload, index) => (
          <motion.div
            key={upload.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <CandidateCard upload={upload} onDelete={onCandidateDelete} />
          </motion.div>
        ))}
      </div>
    );
  }

  // Render date-grouped candidates
  return (
    <div className="space-y-8">
      {groupedCandidates.map((group, groupIndex) => {
        const isToday = isSameDay(group.date, new Date());
        const dateLabel = isToday 
          ? 'Today'
          : format(group.date, 'EEEE, MMMM d, yyyy');

        return (
          <motion.div
            key={group.date.toISOString()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: groupIndex * 0.1 }}
            className="space-y-4"
          >
            {/* Date Header */}
            <div className="flex items-center gap-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 glass-card rounded-lg elegant-border">
                  <Calendar className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white text-elegant tracking-wider">
                    {dateLabel.toUpperCase()}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Users className="w-3 h-3" />
                    <span>{group.candidates.length} candidate{group.candidates.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              
              {/* Today indicator */}
              {isToday && (
                <div className="flex items-center gap-2 px-3 py-1 bg-brand/20 rounded-full border border-brand/30">
                  <div className="w-2 h-2 bg-brand rounded-full animate-pulse"></div>
                  <span className="text-xs text-brand font-medium">LATEST</span>
                </div>
              )}
            </div>

            {/* Candidates for this date */}
            {viewMode === 'list' ? (
              <div className="space-y-4">
                {group.candidates.map((upload, index) => (
                  <motion.div
                    key={upload.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <CandidateListItem upload={upload} onDelete={onCandidateDelete} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.candidates.map((upload, index) => (
                  <motion.div
                    key={upload.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <CandidateCard upload={upload} onDelete={onCandidateDelete} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};