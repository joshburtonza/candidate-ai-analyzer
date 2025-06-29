
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
  
  // Convert score to be out of 10 instead of 100, handle missing scores
  const rawScore = parseFloat(data.score || '0');
  const score = rawScore > 10 ? Math.round(rawScore / 10) : Math.round(rawScore);
  const scorePercentage = (score / 10) * 100; // For progress bar

  const skills = data.skill_set ? data.skill_set.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await deleteCandidate(upload.id, data.candidate_name || 'Unknown');
    if (success && onDelete) {
      onDelete(upload.id);
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
          {/* Clear Button */}
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-10 w-8 h-8 p-0 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 rounded-xl"
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="space-y-6 flex-1 flex flex-col">
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
              {data.countries && (
                <div className="flex items-center gap-3 text-gray-300">
                  <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{data.countries}</span>
                </div>
              )}
            </div>

            {/* Expertise Section - only show if skills exist */}
            {skills.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-slate-400 rounded"></div>
                  <h4 className="text-sm font-bold text-gray-300 tracking-wider">EXPERTISE</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.slice(0, 6).map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-white/5 text-white border-white/10 px-3 py-1 text-xs rounded-xl"
                    >
                      {skill}
                    </Badge>
                  ))}
                  {skills.length > 6 && (
                    <Badge
                      variant="secondary"
                      className="bg-white/5 text-white border-white/10 px-3 py-1 text-xs rounded-xl"
                    >
                      +{skills.length - 6}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Professional Assessment - only show if justification exists */}
            {data.justification && (
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-slate-400 rounded"></div>
                  <h4 className="text-sm font-bold text-gray-300 tracking-wider">ASSESSMENT</h4>
                </div>
                <p className="text-sm text-gray-400 line-clamp-4 leading-relaxed">
                  {data.justification}
                </p>
              </div>
            )}

            {/* Score Progress - only show if score exists */}
            {data.score && (
              <div className="space-y-2">
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
