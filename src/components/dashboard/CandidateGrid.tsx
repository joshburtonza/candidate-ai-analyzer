
import { CVUpload } from '@/types/candidate';
import { CandidateCard } from './CandidateCard';
import { CandidateListItem } from './CandidateListItem';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

interface CandidateGridProps {
  uploads: CVUpload[];
  viewMode: 'grid' | 'list';
}

const isCompleteProfile = (upload: CVUpload): boolean => {
  if (!upload.extracted_json) return false;
  
  const data = upload.extracted_json;
  
  // Check all required fields for a complete profile
  return !!(
    data.candidate_name &&
    data.contact_number &&
    data.email_address &&
    data.countries &&
    data.skill_set &&
    data.educational_qualifications &&
    data.job_history &&
    data.justification
  );
};

const filterValidCandidates = (uploads: CVUpload[]): CVUpload[] => {
  const seenEmails = new Set<string>();
  
  return uploads.filter(upload => {
    // Filter out incomplete uploads
    if (upload.processing_status !== 'completed' || !upload.extracted_json) {
      return false;
    }

    // Filter out incomplete profiles
    if (!isCompleteProfile(upload)) {
      console.log('Filtering out incomplete profile:', upload.extracted_json?.candidate_name);
      return false;
    }

    // Filter out low scores (below 5/10)
    const rawScore = parseFloat(upload.extracted_json.score || '0');
    const score = rawScore > 10 ? Math.round(rawScore / 10) : Math.round(rawScore);
    if (score < 5) {
      console.log('Filtering out low score candidate:', upload.extracted_json?.candidate_name, 'Score:', score);
      return false;
    }

    const candidateEmail = upload.extracted_json.email_address;

    // STRENGTHENED: Filter out duplicates based on email (case-insensitive)
    if (candidateEmail) {
      const normalizedEmail = candidateEmail.toLowerCase().trim();
      if (seenEmails.has(normalizedEmail)) {
        console.log('Frontend: Filtering out duplicate candidate with email:', candidateEmail);
        return false;
      }
      seenEmails.add(normalizedEmail);
    }

    return true;
  });
};

export const CandidateGrid = ({ uploads, viewMode }: CandidateGridProps) => {
  const [localUploads, setLocalUploads] = useState(uploads);
  
  // Update local uploads when prop changes
  useEffect(() => {
    setLocalUploads(uploads);
  }, [uploads]);

  const handleCandidateDelete = (deletedId: string) => {
    setLocalUploads(prev => prev.filter(upload => upload.id !== deletedId));
  };

  const validUploads = filterValidCandidates(localUploads);

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
        <h3 className="text-2xl font-semibold text-white mb-4 text-elegant tracking-wider">NO QUALIFIED CANDIDATES</h3>
        <p className="text-white/70 text-lg">Upload CVs with complete profiles and scores ≥ 5/10 to see candidates</p>
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
