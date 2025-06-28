
import { useState } from 'react';
import { CVUpload } from '@/types/candidate';
import { Card } from '@/components/ui/card';
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
    if (score >= 8) return 'bg-orange-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
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
      <Card className="chrome-glass chrome-glass-hover p-6 h-full rounded-xl cursor-pointer group flex flex-col">
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

        <div className="space-y-6 flex-1 flex flex-col">
          {/* Header with Avatar and Score */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-4 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-full w-16 h-16 flex items-center justify-center">
                <User className="w-8 h-8 gold-accent" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">
                  {data.candidate_name || 'Unknown'}
                </h3>
              </div>
            </div>
            
            {/* Score Circle */}
            <div className="relative flex-shrink-0">
              <div className={`w-16 h-16 rounded-full ${getScoreColor(score)} flex items-center justify-center`}>
                <span className="text-black font-bold text-xl">{score}</span>
              </div>
              <div className="text-center mt-2">
                <span className="text-xs text-white/80 font-medium">ASSESSMENT SCORE</span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            {data.email_address && (
              <div className="flex items-center gap-3 text-white/90">
                <Mail className="w-5 h-5 gold-accent flex-shrink-0" />
                <span className="truncate">{data.email_address}</span>
              </div>
            )}
            {data.contact_number && (
              <div className="flex items-center gap-3 text-white/90">
                <Phone className="w-5 h-5 gold-accent flex-shrink-0" />
                <span className="truncate">{data.contact_number}</span>
              </div>
            )}
            {data.countries && (
              <div className="flex items-center gap-3 text-white/90">
                <MapPin className="w-5 h-5 gold-accent flex-shrink-0" />
                <span className="truncate">{data.countries}</span>
              </div>
            )}
          </div>

          {/* Expertise Section */}
          {skills.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-gold-accent rounded"></div>
                <h4 className="text-sm font-bold text-white/90 text-elegant tracking-wider">EXPERTISE</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.slice(0, 6).map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-white/10 text-white border-white/20 px-3 py-1 text-xs"
                  >
                    {skill}
                  </Badge>
                ))}
                {skills.length > 6 && (
                  <Badge
                    variant="secondary"
                    className="bg-white/10 text-white border-white/20 px-3 py-1 text-xs"
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
              <div className="w-1 h-6 bg-gold-accent rounded"></div>
              <h4 className="text-sm font-bold text-white/90 text-elegant tracking-wider">PROFESSIONAL ASSESSMENT</h4>
            </div>
            <p className="text-sm text-white/80 line-clamp-4 leading-relaxed">
              {data.justification || 'Assessment pending analysis'}
            </p>
          </div>

          {/* Score Progress */}
          <div className="space-y-2">
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
              className="w-full bg-orange-500 hover:bg-orange-600 text-black font-semibold"
            >
              <Eye className="w-4 h-4 mr-2" />
              VIEW PROFILE
            </Button>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};
