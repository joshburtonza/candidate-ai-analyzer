
import { CVUpload } from '@/types/candidate';
import { CandidateCard } from './CandidateCard';
import { CandidateListItem } from './CandidateListItem';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

interface CandidateGridProps {
  uploads: CVUpload[];
  viewMode: 'grid' | 'list';
}

// Test names to filter out on the client side as backup
const TEST_NAMES = [
  'jane doe',
  'john doe',
  'jane smith',
  'john smith',
  'test candidate',
  'sample candidate',
  'example candidate'
];

const isTestCandidate = (name: string): boolean => {
  const normalizedName = name.toLowerCase().trim();
  return TEST_NAMES.some(testName => normalizedName.includes(testName));
};

const filterValidCandidates = (uploads: CVUpload[]): CVUpload[] => {
  const seenEmails = new Set<string>();
  
  return uploads.filter(upload => {
    // Filter out incomplete uploads
    if (upload.processing_status !== 'completed' || !upload.extracted_json) {
      return false;
    }

    const candidateName = upload.extracted_json.candidate_name;
    const candidateEmail = upload.extracted_json.email_address;

    // Filter out test candidates
    if (isTestCandidate(candidateName)) {
      console.log('Filtering out test candidate:', candidateName);
      return false;
    }

    // Filter out duplicates based on email
    if (candidateEmail && seenEmails.has(candidateEmail.toLowerCase())) {
      console.log('Filtering out duplicate candidate:', candidateEmail);
      return false;
    }

    if (candidateEmail) {
      seenEmails.add(candidateEmail.toLowerCase());
    }

    return true;
  });
};

export const CandidateGrid = ({ uploads, viewMode }: CandidateGridProps) => {
  const validUploads = filterValidCandidates(uploads);

  if (validUploads.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 glass-card rounded-2xl mb-6 elegant-border">
          <FileText className="w-10 h-10 gold-accent" />
        </div>
        <h3 className="text-2xl font-semibold text-white mb-4 text-elegant tracking-wider">NO CANDIDATES YET</h3>
        <p className="text-white/70 text-lg">Upload some CV files to begin elite AI analysis</p>
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
            <CandidateListItem upload={upload} />
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
          <CandidateCard upload={upload} />
        </motion.div>
      ))}
    </div>
  );
};
