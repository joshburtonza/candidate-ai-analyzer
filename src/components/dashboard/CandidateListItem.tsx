
import { CVUpload } from '@/types/candidate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, MapPin, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDeleteCandidate } from '@/hooks/useDeleteCandidate';

interface CandidateListItemProps {
  upload: CVUpload;
  onDelete?: (id: string) => void;
}

export const CandidateListItem = ({ upload, onDelete }: CandidateListItemProps) => {
  const navigate = useNavigate();
  const { deleteCandidate, isDeleting } = useDeleteCandidate();
  const data = upload.extracted_json!;
  
  // Convert score to be out of 10 instead of 100
  const rawScore = parseFloat(data.score || '0');
  const score = rawScore > 10 ? Math.round(rawScore / 10) : Math.round(rawScore);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-brand bg-brand';
    if (score >= 6) return 'text-yellow-400 bg-yellow-500';
    return 'text-red-400 bg-red-500';
  };

  const skills = data.skill_set ? data.skill_set.split(',').map(s => s.trim()).slice(0, 4) : [];

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await deleteCandidate(upload.id, data.candidate_name || 'Unknown');
    if (success && onDelete) {
      onDelete(upload.id);
    }
  };

  return (
    <div className="glass hover-lift p-6 relative">
      {/* Clear Button */}
      <Button
        onClick={handleDelete}
        disabled={isDeleting}
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 z-10 w-8 h-8 p-0 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300"
      >
        <X className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-6">
        {/* Avatar & Basic Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="p-3 bg-gradient-to-br from-brand/20 to-brand/40 rounded-lgx w-14 h-14 flex items-center justify-center">
            <User className="w-7 h-7 text-brand" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white truncate">
              {data.candidate_name || 'Unknown'}
            </h3>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-brand" />
                <span className="truncate">{data.email_address}</span>
              </div>
              {data.contact_number && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-brand" />
                  <span>{data.contact_number}</span>
                </div>
              )}
              {data.countries && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-brand" />
                  <span>{data.countries}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="hidden md:flex items-center gap-2 flex-1">
          {skills.map((skill, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="glass text-white border-border text-xs hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              {skill}
            </Badge>
          ))}
        </div>

        {/* Score */}
        <div className="text-center">
          <div className={`w-12 h-12 rounded-full ${getScoreColor(score).split(' ')[1]} flex items-center justify-center`}>
            <span className="text-black font-bold text-lg">{score}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">ASSESSMENT</div>
        </div>

        {/* Action */}
        <Button
          onClick={() => navigate(`/candidate/${upload.id}`)}
          variant="outline"
          size="sm"
          className="border-brand/30 text-brand hover:bg-brand/10 backdrop-blur-sm hover-lift"
        >
          <Eye className="w-4 h-4 mr-2" />
          VIEW
        </Button>
      </div>
    </div>
  );
};
