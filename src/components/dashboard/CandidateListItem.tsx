import { Candidate } from '@/types/candidate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Eye, Trash2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDeleteCandidate } from '@/hooks/useDeleteCandidate';

interface CandidateListItemProps {
  upload: Candidate;
  onDelete?: (id: string) => void;
}

export const CandidateListItem = ({ upload, onDelete }: CandidateListItemProps) => {
  const navigate = useNavigate();
  const { deleteCandidate, isDeleting } = useDeleteCandidate();

  // Convert score to be out of 10 instead of 100
  const rawScore = upload.score || 0;
  const score = rawScore > 10 ? Math.round(rawScore / 10) : Math.round(rawScore);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('Delete button clicked for candidate:', upload.id, upload.full_name);
    
    // For now, just call the onDelete callback
    if (onDelete) {
      console.log('Calling onDelete callback');
      onDelete(upload.id);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (score >= 6) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="glass-card elegant-border rounded-xl p-6 hover:border-slate-400/40 transition-colors group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6 flex-1 min-w-0">
          {/* Avatar */}
          <div className="p-3 bg-slate-500/10 rounded-xl border border-slate-500/20 flex-shrink-0">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          
          {/* Main Info */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white group-hover:text-slate-400 transition-colors truncate">
                {upload.full_name || 'Unknown'}
              </h3>
              
              {/* Score Badge */}
              {upload.score && (
                <div className={`px-3 py-1 rounded-lg border ${getScoreColor(score)} font-bold text-sm`}>
                  {score}/10
                </div>
              )}
            </div>
            
            {/* Contact Info */}
            <div className="flex items-center gap-6 text-sm text-gray-300">
              {upload.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{upload.email}</span>
                </div>
              )}
              {upload.contact_number && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{upload.contact_number}</span>
                </div>
              )}
            </div>
            
            {/* Justification Preview */}
            {upload.justification && (
              <div className="text-sm text-gray-400 line-clamp-2">
                <span className="text-slate-300 font-medium">Justification: </span>
                {upload.justification}
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3 ml-4">
          <Button
            onClick={() => navigate(`/candidate/${upload.id}`)}
            variant="ghost"
            size="sm"
            className="bg-brand-gradient/20 hover:bg-brand-gradient/30 text-slate-300 hover:text-white border border-slate-500/30 hover:border-slate-400/50"
          >
            <Eye className="w-4 h-4 mr-2" />
            VIEW
          </Button>
          
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="ghost"
            size="sm"
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50"
            title={`Delete ${upload.full_name || 'candidate'}`}
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};