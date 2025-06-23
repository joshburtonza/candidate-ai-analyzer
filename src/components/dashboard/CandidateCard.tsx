
import { useState } from 'react';
import { CVUpload } from '@/types/candidate';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { User, Mail, Phone, MapPin, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface CandidateCardProps {
  upload: CVUpload;
}

export const CandidateCard = ({ upload }: CandidateCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const data = upload.extracted_json!;
  const score = parseFloat(data.score || '0');

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-gradient-to-r from-orange-600 to-orange-400';
    if (score >= 6) return 'bg-gradient-to-r from-yellow-600 to-orange-500';
    if (score >= 4) return 'bg-gradient-to-r from-red-600 to-yellow-600';
    return 'bg-gradient-to-r from-gray-600 to-red-600';
  };

  const skills = data.skill_set ? data.skill_set.split(',').map(s => s.trim()) : [];

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="candidate-card p-6 h-full min-h-[400px] hover:bg-gray-600/20 transition-all duration-300 cursor-pointer group flex flex-col">
        <div className="space-y-4 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-3 bg-orange-500/20 rounded-lg border border-orange-500/30 flex-shrink-0">
                <User className="w-5 h-5 text-orange-500" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors truncate">
                  {data.candidate_name || 'Unknown'}
                </h3>
                <p className="text-sm text-gray-400 truncate">{data.email_address}</p>
              </div>
            </div>
            
            {/* Score Circle */}
            <div className="relative flex-shrink-0">
              <div className={`w-12 h-12 rounded-full ${getScoreColor(score)} flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">{score.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 flex-shrink-0">
            {data.contact_number && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span className="truncate">{data.contact_number}</span>
              </div>
            )}
            {data.countries && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span className="truncate">{data.countries}</span>
              </div>
            )}
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="space-y-2 flex-shrink-0">
              <p className="text-sm font-medium text-white/80">SKILLS</p>
              <div className="flex flex-wrap gap-1">
                {skills.slice(0, 3).map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-gray-700 text-white border-gray-600 text-xs hover:bg-gray-600 transition-colors"
                  >
                    {skill}
                  </Badge>
                ))}
                {skills.length > 3 && (
                  <Badge
                    variant="secondary"
                    className="bg-gray-700 text-white border-gray-600 text-xs"
                  >
                    +{skills.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Assessment */}
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-white/80">ASSESSMENT</p>
            <p className="text-sm text-gray-400 line-clamp-3 overflow-hidden">
              {data.justification || 'No assessment available'}
            </p>
          </div>

          {/* Score Progress */}
          <div className="space-y-2 flex-shrink-0">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">FIT SCORE</span>
              <span className="text-sm font-medium text-white">{score.toFixed(1)}/10</span>
            </div>
            <Progress value={score * 10} scoreValue={score} className="h-2" />
          </div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
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
