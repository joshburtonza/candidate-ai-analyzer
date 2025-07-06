
import { Candidate } from '@/types/candidate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, MapPin, Eye, Trash2, GraduationCap, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDeleteCandidate } from '@/hooks/useDeleteCandidate';
import { getTeachingSubjects, hasTeachingQualifications } from '@/utils/candidateFilters';

interface CandidateListItemProps {
  upload: Candidate;
  onDelete?: (id: string) => void;
}

// Helper function to safely handle array or string data
const normalizeToArray = (value: string | string[] | null | undefined): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(item => item && item.trim()).map(item => item.trim());
  }
  if (typeof value === 'string') {
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }
  return [];
};

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

  // Handle skills as both string and array
  const skills = normalizeToArray(data.skill_set).slice(0, 4);
  
  // Handle countries as both string and array
  const countries = normalizeToString(data.countries);

  // Get teaching-specific information
  const teachingSubjects = getTeachingSubjects(upload);
  const hasTeachingQuals = hasTeachingQualifications(upload);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('Delete button clicked for candidate:', upload.id, data.candidate_name);
    
    const success = await deleteCandidate(upload.id, data.candidate_name || 'Unknown');
    
    if (success && onDelete) {
      console.log('Calling onDelete callback');
      onDelete(upload.id);
    }
  };

  return (
    <div className="glass hover-lift p-6 relative">
      {/* Delete Button */}
      <Button
        onClick={handleDelete}
        disabled={isDeleting}
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 z-10 w-8 h-8 p-0 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all duration-200 hover:scale-110"
        title={`Delete ${data.candidate_name || 'candidate'}`}
      >
        {isDeleting ? (
          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </Button>

      <div className="flex items-center gap-6 pr-12">
        {/* Avatar & Basic Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="p-3 bg-slate-500/20 rounded-lgx w-14 h-14 flex items-center justify-center border border-slate-400/30">
            <User className="w-7 h-7 text-slate-400" />
          </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white truncate">
                  {data.candidate_name || 'Unknown'}
                </h3>
                {hasTeachingQuals && (
                  <Badge
                    variant="default"
                    className="bg-green-500/20 text-green-400 border-green-500/30 px-2 py-0 text-xs rounded-lg"
                  >
                    <GraduationCap className="w-3 h-3 mr-1" />
                    QUALIFIED
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span className="truncate">{data.email_address}</span>
                </div>
                {data.contact_number && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{data.contact_number}</span>
                  </div>
                )}
                {countries && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{countries}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Teaching Subjects */}
          <div className="hidden md:flex items-center gap-2 flex-1">
            {teachingSubjects.length > 0 ? (
              teachingSubjects.slice(0, 3).map((subject, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-green-500/10 text-green-400 border-green-500/30 text-xs capitalize"
                >
                  <BookOpen className="w-3 h-3 mr-1" />
                  {subject}
                </Badge>
              ))
            ) : (
              skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="glass text-white border-border text-xs hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  {skill}
                </Badge>
              ))
            )}
          </div>

        {/* Score */}
        <div className="text-center flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center shadow-lg">
            <span className="font-bold text-lg text-slate-800">{score}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">ASSESSMENT</div>
        </div>

        {/* Action */}
        <Button
          onClick={() => navigate(`/candidate/${upload.id}`)}
          variant="outline"
          size="sm"
          className="border-slate-400/30 text-slate-400 hover:bg-slate-400/10 backdrop-blur-sm hover-lift flex-shrink-0"
        >
          <Eye className="w-4 h-4 mr-2" />
          VIEW
        </Button>
      </div>
    </div>
  );
};
