
import { CVUpload } from '@/types/candidate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, MapPin, Eye, Trash2, Briefcase, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDeleteCandidate } from '@/hooks/useDeleteCandidate';
import { parseCurrentEmployment, parseEducation } from '@/utils/candidateDataParser';

interface CandidateListItemProps {
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

export const CandidateListItem = ({ upload, onDelete }: CandidateListItemProps) => {
  const navigate = useNavigate();
  const { deleteCandidate, isDeleting } = useDeleteCandidate();
  const data = upload.extracted_json!;
  
  // Convert score to be out of 10 instead of 100
  const rawScore = parseFloat(data.score || '0');
  const score = rawScore > 10 ? Math.round(rawScore / 10) : Math.round(rawScore);

  // Parse employment and education data
  const employment = parseCurrentEmployment(data.current_employment, data.job_history);
  const education = parseEducation(data.educational_qualifications);
  
  // Handle countries as both string and array
  const countries = normalizeToString(data.countries);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('CandidateListItem: Delete button clicked for candidate:', upload.id, data.candidate_name);
    
    const success = await deleteCandidate(upload.id, data.candidate_name || 'Unknown');
    
    console.log('CandidateListItem: Delete operation result:', success);
    
    if (success && onDelete) {
      console.log('CandidateListItem: Calling onDelete callback');
      onDelete(upload.id);
    } else if (!success) {
      console.error('CandidateListItem: Delete operation failed');
    } else if (!onDelete) {
      console.warn('CandidateListItem: No onDelete callback provided');
    }
  };

  return (
    <div className="glass hover-lift p-4 relative">
      {/* Delete Button */}
      <Button
        onClick={handleDelete}
        disabled={isDeleting}
        variant="ghost"
        size="sm"
        className="absolute top-3 right-3 z-10 w-8 h-8 p-0 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all duration-200 hover:scale-110"
        title={`Delete ${data.candidate_name || 'candidate'}`}
      >
        {isDeleting ? (
          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </Button>

      <div className="flex gap-4 pr-10">
        {/* Avatar & Basic Info */}
        <div className="flex gap-3 flex-1 min-w-0">
          <div className="p-2.5 bg-slate-500/20 rounded-lg w-12 h-12 flex items-center justify-center border border-slate-400/30 flex-shrink-0">
            <User className="w-6 h-6 text-slate-400" />
          </div>
          
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="text-base font-bold text-white truncate">
              {data.candidate_name || 'Unknown'}
            </h3>
            
            {/* Contact Info - Vertical Stack */}
            <div className="space-y-0.5 text-xs text-gray-400">
              {data.email_address && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{data.email_address}</span>
                </div>
              )}
              {data.contact_number && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{data.contact_number}</span>
                </div>
              )}
              {countries && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{countries}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Employment & Education Info - Vertical Stack */}
        <div className="hidden sm:block flex-1 min-w-0 space-y-3">
          {/* Employment */}
          {employment.jobTitle && (
            <div className="flex items-start gap-2">
              <Briefcase className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm text-white font-medium truncate">
                  {employment.jobTitle}
                </div>
                {employment.company && (
                  <div className="text-xs text-gray-400 truncate">
                    {employment.company}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Education */}
          {education.degree && (
            <div className="flex items-start gap-2">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm text-white font-medium truncate">
                  {education.degree}
                </div>
                {education.institution && (
                  <div className="text-xs text-gray-400 truncate">
                    {education.institution}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Score & Action */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Score */}
          {data.score && (
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center shadow-lg">
                <span className="font-bold text-base text-slate-800">{score}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">SCORE</div>
            </div>
          )}

          {/* Action */}
          <Button
            onClick={() => navigate(`/candidate/${upload.id}`)}
            variant="outline"
            size="sm"
            className="border-slate-400/30 text-slate-400 hover:bg-slate-400/10 backdrop-blur-sm hover-lift px-3 py-2"
          >
            <Eye className="w-4 h-4 mr-1.5" />
            VIEW
          </Button>
        </div>
      </div>
    </div>
  );
};
