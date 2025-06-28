
import { useState } from 'react';
import { CVUpload } from '@/types/candidate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { User, Mail, Phone, MapPin, Eye, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDeleteCandidate } from '@/hooks/useDeleteCandidate';

interface CandidateCardProps {
  upload: CVUpload;
  onDelete?: (id: string) => void;
}

export const CandidateCard = ({ upload, onDelete }: CandidateCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { deleteCandidate, isDeleting } = useDeleteCandidate();
  const data = upload.extracted_json!;
  
  // Convert score to be out of 10 instead of 100
  const rawScore = parseFloat(data.score || '0');
  const score = rawScore > 10 ? Math.round(rawScore / 10) : Math.round(rawScore);
  const scorePercentage = (score / 10) * 100; // For progress bar

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-brand-gradient';
    if (score >= 6) return 'bg-gradient-to-br from-yellow-400 to-yellow-600';
    return 'bg-gradient-to-br from-red-400 to-red-600';
  };

  const skills = data.skill_set ? data.skill_set.split(',').map(s => s.trim()) : [];

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await deleteCandidate(upload.id, data.candidate_name || 'Unknown');
    if (success && onDelete) {
      onDelete(upload.id);
    }
  };

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="h-full relative"
    >
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 h-full cursor-pointer group flex flex-col hover:border-orange-500/30 transition-all duration-300 backdrop-blur-sm">
        {/* Clear Button */}
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 z-10 w-8 h-8 p-0 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 rounded-xl"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="space-y-6 flex-1 flex flex-col">
          {/* Header with Avatar and Score */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-4 bg-orange-500/20 rounded-2xl w-16 h-16 flex items-center justify-center border border-orange-500/30">
                <User className="w-8 h-8 text-orange-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">
                  {data.candidate_name || 'Unknown'}
                </h3>
              </div>
            </div>
            
            {/* Score Circle */}
            <div className="relative flex-shrink-0">
              <div className={`w-16 h-16 rounded-2xl ${getScoreColor(score)} flex items-center justify-center shadow-lg border border-white/10`}>
                <span className="text-white font-bold text-xl">{score}</span>
              </div>
              <div className="text-center mt-2">
                <span className="text-xs text-gray-400 font-medium tracking-wide">SCORE</span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            {data.email_address && (
              <div className="flex items-center gap-3 text-gray-300 bg-slate-700/30 p-3 rounded-xl border border-slate-600/50">
                <Mail className="w-5 h-5 text-orange-400 flex-shrink-0" />
                <span className="truncate text-sm">{data.email_address}</span>
              </div>
            )}
            {data.contact_number && (
              <div className="flex items-center gap-3 text-gray-300 bg-slate-700/30 p-3 rounded-xl border border-slate-600/50">
                <Phone className="w-5 h-5 text-orange-400 flex-shrink-0" />
                <span className="truncate text-sm">{data.contact_number}</span>
              </div>
            )}
            {data.countries && (
              <div className="flex items-center gap-3 text-gray-300 bg-slate-700/30 p-3 rounded-xl border border-slate-600/50">
                <MapPin className="w-5 h-5 text-orange-400 flex-shrink-0" />
                <span className="truncate text-sm">{data.countries}</span>
              </div>
            )}
          </div>

          {/* Expertise Section */}
          {skills.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-orange-400 rounded-full"></div>
                <h4 className="text-sm font-bold text-gray-300 tracking-wider">EXPERTISE</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.slice(0, 6).map((skill, index) => (
                  <Badge
                    key={index}
                    className="bg-slate-700/50 text-gray-300 border border-slate-600/50 px-3 py-1 text-xs rounded-xl hover:bg-slate-600/50 transition-colors"
                  >
                    {skill}
                  </Badge>
                ))}
                {skills.length > 6 && (
                  <Badge
                    className="bg-slate-700/50 text-gray-300 border border-slate-600/50 px-3 py-1 text-xs rounded-xl"
                  >
                    +{skills.length - 6}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Professional Assessment */}
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-orange-400 rounded-full"></div>
              <h4 className="text-sm font-bold text-gray-300 tracking-wider">ASSESSMENT</h4>
            </div>
            <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/50">
              <p className="text-sm text-gray-300 line-clamp-4 leading-relaxed">
                {data.justification || 'Assessment pending analysis'}
              </p>
            </div>
          </div>

          {/* Score Progress */}
          <div className="space-y-2 bg-slate-700/30 p-4 rounded-xl border border-slate-600/50">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">FIT SCORE</span>
              <span className="text-sm font-medium text-white">{score}/10</span>
            </div>
            <Progress value={scorePercentage} className="h-2" />
          </div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="mt-auto"
          >
            <Button
              onClick={() => navigate(`/candidate/${upload.id}`)}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 border border-orange-400/50"
            >
              <Eye className="w-4 h-4 mr-2" />
              VIEW PROFILE
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
