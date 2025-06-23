
import { CVUpload } from '@/types/candidate';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, MapPin, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CandidateListItemProps {
  upload: CVUpload;
}

export const CandidateListItem = ({ upload }: CandidateListItemProps) => {
  const navigate = useNavigate();
  const data = upload.extracted_json!;
  const score = parseInt(data.score || '0');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const skills = data.skill_set ? data.skill_set.split(',').map(s => s.trim()).slice(0, 4) : [];

  return (
    <Card className="glass-card elegant-border p-6 hover:bg-white/5 transition-all duration-300">
      <div className="flex items-center gap-6">
        {/* Avatar & Basic Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="p-3 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-lg border border-white/10">
            <User className="w-6 h-6 gold-accent" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate text-elegant">
              {data.candidate_name || 'Unknown'}
            </h3>
            <div className="flex items-center gap-4 mt-1 text-sm text-white/70">
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3 gold-accent" />
                <span className="truncate">{data.email_address}</span>
              </div>
              {data.contact_number && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3 gold-accent" />
                  <span>{data.contact_number}</span>
                </div>
              )}
              {data.countries && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 gold-accent" />
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
              className="bg-white/10 text-white border-white/20 text-xs hover:bg-white/20 transition-colors"
            >
              {skill}
            </Badge>
          ))}
        </div>

        {/* Score */}
        <div className="text-center">
          <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score}%
          </div>
          <div className="text-xs text-white/60 text-elegant tracking-wider">FIT SCORE</div>
        </div>

        {/* Action */}
        <Button
          onClick={() => navigate(`/candidate/${upload.id}`)}
          variant="outline"
          size="sm"
          className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10 elegant-border text-elegant tracking-wider"
        >
          <Eye className="w-4 h-4 mr-2" />
          VIEW
        </Button>
      </div>
    </Card>
  );
};
