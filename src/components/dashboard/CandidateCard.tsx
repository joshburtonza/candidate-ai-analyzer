
import { useState } from 'react';
import { CVUpload } from '@/types/candidate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { User, Mail, Phone, MapPin, Eye, Trash2, Briefcase, Clock, GraduationCap, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDeleteCandidate } from '@/hooks/useDeleteCandidate';
import { isUploadedToday } from '@/utils/candidateFilters';
import { format } from 'date-fns';
import { parseCurrentEmployment, parseEducation, parseJobHistoryList } from '@/utils/candidateDataParser';
import { getEffectiveDateString } from '@/utils/dateUtils';

interface CandidateCardProps {
  upload: CVUpload;
  onDelete?: (id: string) => void;
}

const normalizeToString = (value: string | string[] | null | undefined): string => {
  if (!value) return '';
  if (Array.isArray(value)) {
    return value.filter(item => item && item.trim()).join(', ');
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  return String(value).trim();
};

export const CandidateCard = ({ upload, onDelete }: CandidateCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { deleteCandidate, isDeleting } = useDeleteCandidate();
  const data = upload.extracted_json!;
  
  // Convert score to be out of 10 instead of 100, handle missing scores
  const rawScore = parseFloat(data.score || '0');
  const score = rawScore > 10 ? Math.round(rawScore / 10) : Math.round(rawScore);
  const scorePercentage = (score / 10) * 100; // For progress bar

  // Handle countries as both string and array
  const countries = normalizeToString(data.countries);

  // Parse employment, education, and job history data
  const employment = parseCurrentEmployment(data.current_employment, data.job_history);
  const education = parseEducation(data.educational_qualifications);
  const jobHistoryBullets = parseJobHistoryList(data.job_history);

  // Check if uploaded today and format date - use consistent date string logic
  const uploadedToday = isUploadedToday(upload);
  const effectiveDateString = getEffectiveDateString(upload);
  const uploadDate = new Date(effectiveDateString + 'T00:00:00'); // Force local timezone
  const formattedDate = format(uploadDate, 'MMM dd, yyyy');

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('CandidateCard: Delete button clicked for candidate:', upload.id, data.candidate_name);
    
    const success = await deleteCandidate(upload.id, data.candidate_name || 'Unknown');
    
    console.log('CandidateCard: Delete operation result:', success);
    
    if (success && onDelete) {
      console.log('CandidateCard: Calling onDelete callback');
      onDelete(upload.id);
    } else if (!success) {
      console.error('CandidateCard: Delete operation failed');
    } else if (!onDelete) {
      console.warn('CandidateCard: No onDelete callback provided');
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="h-full relative min-h-[500px]"
    >
      <div className="relative overflow-hidden h-full cursor-pointer group">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl rounded-2xl"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 via-transparent to-slate-500/5 rounded-2xl"></div>
        
        {/* Content */}
        <div className="relative z-10 p-6 border border-white/10 rounded-2xl h-full flex flex-col">
          {/* Upload Date Badge */}
          <div className="absolute top-4 left-4 z-20">
            <Badge
              variant="secondary"
              className={`text-xs px-3 py-1.5 rounded-lg ${
                uploadedToday 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}
            >
              <Clock className="w-3 h-3 mr-1.5" />
              {uploadedToday ? 'Today' : formattedDate}
            </Badge>
          </div>

          {/* Delete Button */}
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-20 w-9 h-9 p-0 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200 hover:scale-105"
            title={`Delete ${data.candidate_name || 'candidate'}`}
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>

          <div className="space-y-6 flex-1 flex flex-col mt-12">
            {/* Header with Avatar and Score */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-500/10 rounded-lg w-14 h-14 flex items-center justify-center border border-slate-500/20">
                  <User className="w-7 h-7 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-slate-400 transition-colors">
                    {data.candidate_name || 'Unknown'}
                  </h3>
                </div>
              </div>
              
              {/* Score Circle - only show if score exists */}
              {data.score && (
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-brand-gradient flex items-center justify-center shadow-lg">
                    <span className="font-bold text-lg text-slate-800">{score}</span>
                  </div>
                  <div className="text-center mt-1.5">
                    <span className="text-xs text-gray-400 font-medium tracking-wider">SCORE</span>
                  </div>
                </div>
              )}
            </div>

            {/* Current Employment Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-slate-400 rounded"></div>
                <h4 className="text-sm font-bold text-gray-300 tracking-wider">EMPLOYMENT</h4>
              </div>
              <div className="pl-3">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white leading-relaxed">
                      {employment.jobTitle}
                    </div>
                    {employment.company && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1.5">
                        <Building2 className="w-3 h-3" />
                        <span className="leading-relaxed">{employment.company}</span>
                      </div>
                    )}
                    {employment.duration && (
                      <div className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                        {employment.duration}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Job History Section */}
            {jobHistoryBullets.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-slate-400 rounded"></div>
                  <h4 className="text-sm font-bold text-gray-300 tracking-wider">EXPERIENCE</h4>
                </div>
                <div className="space-y-3 pl-3">
                  {jobHistoryBullets.slice(0, 4).map((bullet, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-300 leading-relaxed">{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-slate-400 rounded"></div>
                <h4 className="text-sm font-bold text-gray-300 tracking-wider">EDUCATION</h4>
              </div>
              <div className="pl-3">
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white leading-relaxed">
                      {education.degree}
                    </div>
                    {education.institution && (
                      <div className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                        {education.institution}
                      </div>
                    )}
                    {education.year && (
                      <div className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                        {education.year}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Score Progress - only show if score exists */}
            {data.score && (
              <div className="space-y-3 mt-auto pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">FIT SCORE</span>
                  <span className="text-sm font-medium text-white">{score}/10</span>
                </div>
                <Progress value={scorePercentage} className="h-2" />
              </div>
            )}

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="mt-6"
            >
              <Button
                onClick={() => navigate(`/candidate/${upload.id}`)}
                className="w-full bg-brand-gradient hover:opacity-90 text-slate-800 font-semibold shadow-lg shadow-slate-400/25 rounded-lg py-3"
              >
                <Eye className="w-4 h-4 mr-2" />
                VIEW PROFILE
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
