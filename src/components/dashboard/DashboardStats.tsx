import { CVUpload } from '@/types/candidate';
import { Users, TrendingUp, MapPin, Award } from 'lucide-react';

interface DashboardStatsProps {
  uploads: CVUpload[];
}

export const DashboardStats = ({ uploads }: DashboardStatsProps) => {
  const validCandidates = uploads || [];
  const totalCandidates = validCandidates.length;
  
  // Calculate average score
  const scoresWithValues = validCandidates.filter(candidate => candidate.score && candidate.score > 0);
  const averageScore = scoresWithValues.length > 0 
    ? Math.round(scoresWithValues.reduce((sum, candidate) => sum + (candidate.score || 0), 0) / scoresWithValues.length)
    : 0;
  
  // Convert average score to be out of 10 if it's over 10
  const displayAverageScore = averageScore > 10 ? Math.round(averageScore / 10) : averageScore;
  
  // Count candidates with email addresses
  const candidatesWithEmail = validCandidates.filter(candidate => candidate.email).length;
  
  // Count candidates with contact numbers
  const candidatesWithContact = validCandidates.filter(candidate => candidate.contact_number).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Candidates */}
      <div className="glass-card elegant-border p-6 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-white/60 font-medium tracking-wider">TOTAL CANDIDATES</p>
            <p className="text-3xl font-bold text-white">{totalCandidates}</p>
          </div>
        </div>
      </div>

      {/* Average Score */}
      <div className="glass-card elegant-border p-6 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-500/20 rounded-xl">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="text-sm text-white/60 font-medium tracking-wider">AVERAGE SCORE</p>
            <p className="text-3xl font-bold text-white">{displayAverageScore}/10</p>
          </div>
        </div>
      </div>

      {/* Candidates with Email */}
      <div className="glass-card elegant-border p-6 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-500/20 rounded-xl">
            <MapPin className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-sm text-white/60 font-medium tracking-wider">WITH EMAIL</p>
            <p className="text-3xl font-bold text-white">{candidatesWithEmail}</p>
          </div>
        </div>
      </div>

      {/* Candidates with Contact */}
      <div className="glass-card elegant-border p-6 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Award className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-white/60 font-medium tracking-wider">WITH CONTACT</p>
            <p className="text-3xl font-bold text-white">{candidatesWithContact}</p>
          </div>
        </div>
      </div>
    </div>
  );
};