
import { Users, FileText, TrendingUp, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CVUpload } from '@/types/candidate';
import { motion } from 'framer-motion';

interface DashboardStatsProps {
  uploads: CVUpload[];
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
      return false;
    }

    // Filter out low scores (below 5/10)
    const rawScore = parseFloat(upload.extracted_json.score || '0');
    const score = rawScore > 10 ? Math.round(rawScore / 10) : Math.round(rawScore);
    if (score < 5) {
      return false;
    }

    const candidateEmail = upload.extracted_json.email_address;

    // Filter out duplicates based on email (case-insensitive)
    if (candidateEmail) {
      const normalizedEmail = candidateEmail.toLowerCase().trim();
      if (seenEmails.has(normalizedEmail)) {
        return false;
      }
      seenEmails.add(normalizedEmail);
    }

    return true;
  });
};

export const DashboardStats = ({ uploads }: DashboardStatsProps) => {
  const qualifiedCandidates = filterValidCandidates(uploads);
  
  const stats = {
    totalCandidates: qualifiedCandidates.length,
    averageScore: qualifiedCandidates.length > 0 
      ? Math.round(qualifiedCandidates.reduce((sum, upload) => {
          const rawScore = parseFloat(upload.extracted_json?.score || '0');
          const normalizedScore = rawScore > 10 ? Math.round(rawScore / 10) : Math.round(rawScore);
          return sum + normalizedScore;
        }, 0) / qualifiedCandidates.length)
      : 0,
    uniqueCountries: new Set(
      qualifiedCandidates
        .map(u => u.extracted_json?.countries)
        .filter(Boolean)
        .join(',')
        .split(',')
        .map(c => c.trim())
        .filter(Boolean)
    ).size,
  };

  const statCards = [
    {
      title: 'QUALIFIED CANDIDATES',
      value: stats.totalCandidates,
      icon: Users,
      color: 'bg-blue-600',
    },
    {
      title: 'AVERAGE FIT SCORE',
      value: `${stats.averageScore}/10`,
      icon: TrendingUp,
      color: 'bg-yellow-600',
    },
    {
      title: 'UNIQUE COUNTRIES',
      value: stats.uniqueCountries,
      icon: MapPin,
      color: 'bg-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="chrome-glass chrome-glass-hover p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
