
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
  
  // Convert score to be out of 10 instead of 100
  const rawScore = parseFloat(data.score || '0');
  const score = rawScore > 10 ? Math.round(rawScore / 10) : Math.round(rawScore);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-orange-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const skills = data.skill_set ? data.skill_set.split(',').map(s => s.trim()).slice(0, 4) : [];

  return (
    <Card className="chrome-glass chrome-glass-hover p-6 rounded-xl">
      <div className="flex items-center gap-6">
        {/* Avatar & Basic Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="p-3 bg-orange-500/20 rounded-lg border border-orange-500/30">
            <User className="w-6 h-6 text-orange-500" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate">
              {data.candidate_name || 'Unknown'}
            </h3>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-orange-500" />
                <span className="truncate">{data.email_address}</span>
              </div>
              {data.contact_number && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-orange-500" />
                  <span>{data.contact_number}</span>
                </div>
              )}
              {data.countries && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-orange-500" />
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
              className="bg-gray-700/50 text-white border-orange-500/30 text-xs hover:bg-gray-600/50 transition-colors backdrop-blur-sm"
            >
              {skill}
            </Badge>
          ))}
        </div>

        {/* Score */}
        <div className="text-center">
          <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score}/10
          </div>
          <div className="text-xs text-gray-400">FIT SCORE</div>
        </div>

        {/* Action */}
        <Button
          onClick={() => navigate(`/candidate/${upload.id}`)}
          variant="outline"
          size="sm"
          className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 backdrop-blur-sm"
        >
          <Eye className="w-4 h-4 mr-2" />
          VIEW
        </Button>
      </div>
    </Card>
  );
};
