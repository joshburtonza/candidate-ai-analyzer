
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
  const score = parseInt(data.score || '0');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-yellow-400 to-yellow-600';
    if (score >= 60) return 'from-orange-400 to-red-400';
    return 'from-red-500 to-pink-500';
  };

  const skills = data.skill_set ? data.skill_set.split(',').map(s => s.trim()) : [];

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="glass-card elegant-border p-6 h-full hover:bg-white/5 transition-all duration-300 cursor-pointer group">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-lg border border-white/10">
                <User className="w-5 h-5 gold-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-yellow-400 transition-colors text-elegant">
                  {data.candidate_name || 'Unknown'}
                </h3>
                <p className="text-sm text-white/70">{data.email_address}</p>
              </div>
            </div>
            
            {/* Score Circle */}
            <div className="relative">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getScoreColor(score)} flex items-center justify-center shadow-lg`}>
                <span className="text-black font-bold text-sm">{score}</span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            {data.contact_number && (
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Phone className="w-4 h-4 gold-accent" />
                {data.contact_number}
              </div>
            )}
            {data.countries && (
              <div className="flex items-center gap-2 text-sm text-white/70">
                <MapPin className="w-4 h-4 gold-accent" />
                {data.countries}
              </div>
            )}
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/80 text-elegant tracking-wider">SKILLS</p>
              <div className="flex flex-wrap gap-1">
                {skills.slice(0, 3).map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-white/10 text-white border-white/20 text-xs hover:bg-white/20 transition-colors"
                  >
                    {skill}
                  </Badge>
                ))}
                {skills.length > 3 && (
                  <Badge
                    variant="secondary"
                    className="bg-white/10 text-white border-white/20 text-xs"
                  >
                    +{skills.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Justification */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-white/80 text-elegant tracking-wider">ASSESSMENT</p>
            <p className="text-sm text-white/60 line-clamp-2">
              {data.justification || 'No assessment available'}
            </p>
          </div>

          {/* Score Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/70 text-elegant tracking-wider">FIT SCORE</span>
              <span className="text-sm font-medium text-white">{score}%</span>
            </div>
            <Progress value={score} className="h-2" />
          </div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={() => navigate(`/candidate/${upload.id}`)}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold text-elegant tracking-wider"
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
