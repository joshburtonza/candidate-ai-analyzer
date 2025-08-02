
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
import { parseCurrentEmployment, parseEducation } from '@/utils/candidateDataParser';

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

  // Parse employment and education data
  const employment = parseCurrentEmployment(data.current_employment, data.job_history);
  const education = parseEducation(data.educational_qualifications);

  // Check if uploaded today and format date
  const uploadedToday = isUploadedToday(upload);
  const uploadDate = upload.received_date ? new Date(upload.received_date) : upload.extracted_json?.date_received ? new Date(upload.extracted_json.date_received) : new Date();
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
      className="h-full relative"
    >
      <div className="relative overflow-hidden h-full cursor-pointer group">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl rounded-2xl"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 via-transparent to-slate-500/5 rounded-2xl"></div>
        
        {/* Content */}
        <div className="relative z-10 p-8 border border-white/10 rounded-2xl h-full flex flex-col">
          {/* Upload Date Badge */}
          <div className="absolute top-4 left-4 z-20">
            <Badge
              variant="secondary"
              className={`text-xs px-2 py-1 rounded-xl ${
                uploadedToday 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}
            >
              <Clock className="w-3 h-3 mr-1" />
              {uploadedToday ? 'Today' : formattedDate}
            </Badge>
          </div>

          {/* Delete Button */}
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-20 w-8 h-8 p-0 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 rounded-xl transition-all duration-200 hover:scale-110"
            title={`Delete ${data.candidate_name || 'candidate'}`}
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>

          <div className="space-y-6 flex-1 flex flex-col mt-8">
            {/* Header with Avatar and Score */}
            <div className="flex items-center justify-between pr-12">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-slate-500/10 rounded-xl w-16 h-16 flex items-center justify-center border border-slate-500/20">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-slate-400 transition-colors">
                    {data.candidate_name || 'Unknown'}
                  </h3>
                </div>
              </div>
              
              {/* Score Circle - only show if score exists */}
              {data.score && (
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-brand-gradient flex items-center justify-center shadow-lg">
                    <span className="font-bold text-xl text-slate-800">{score}</span>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-xs text-gray-400 font-medium tracking-wider">SCORE</span>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              {data.email_address && (
                <div className="flex items-center gap-3 text-gray-300">
                  <Mail className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{data.email_address}</span>
                </div>
              )}
              {data.contact_number && (
                <div className="flex items-center gap-3 text-gray-300">
                  <Phone className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{data.contact_number}</span>
                </div>
              )}
              {countries && (
                <div className="flex items-center gap-3 text-gray-300">
                  <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{countries}</span>
                </div>
              )}
            </div>

            {/* Current Employment Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-slate-400 rounded"></div>
                <h4 className="text-sm font-bold text-gray-300 tracking-wider">CURRENT EMPLOYMENT</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">
                      {employment.jobTitle}
                    </div>
                    {employment.company && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Building2 className="w-3 h-3" />
                        <span className="truncate">{employment.company}</span>
                      </div>
                    )}
                    {employment.duration && (
                      <div className="text-xs text-gray-400 mt-1">
                        {employment.duration}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Education Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-slate-400 rounded"></div>
                <h4 className="text-sm font-bold text-gray-300 tracking-wider">EDUCATION</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <GraduationCap className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">
                      {education.degree}
                    </div>
                    {education.institution && (
                      <div className="text-xs text-gray-400 truncate">
                        {education.institution}
                      </div>
                    )}
                    {education.year && (
                      <div className="text-xs text-gray-400 mt-1">
                        {education.year}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Score Progress - only show if score exists */}
            {data.score && (
              <div className="space-y-2 mt-auto">
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
              className="mt-auto"
            >
              <Button
                onClick={() => navigate(`/candidate/${upload.id}`)}
                className="w-full bg-brand-gradient hover:opacity-90 text-slate-800 font-semibold shadow-lg shadow-slate-400/25 rounded-xl"
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
