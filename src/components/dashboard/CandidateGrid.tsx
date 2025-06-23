
import { CVUpload } from '@/types/candidate';
import { CandidateCard } from './CandidateCard';
import { CandidateListItem } from './CandidateListItem';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

interface CandidateGridProps {
  uploads: CVUpload[];
  viewMode: 'grid' | 'list';
}

export const CandidateGrid = ({ uploads, viewMode }: CandidateGridProps) => {
  const completedUploads = uploads.filter(
    upload => upload.processing_status === 'completed' && upload.extracted_json
  );

  if (completedUploads.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No candidates yet</h3>
        <p className="text-slate-300">Upload some CV files to get started with AI analysis</p>
      </motion.div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {completedUploads.map((upload, index) => (
          <motion.div
            key={upload.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <CandidateListItem upload={upload} />
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {completedUploads.map((upload, index) => (
        <motion.div
          key={upload.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
        >
          <CandidateCard upload={upload} />
        </motion.div>
      ))}
    </div>
  );
};
