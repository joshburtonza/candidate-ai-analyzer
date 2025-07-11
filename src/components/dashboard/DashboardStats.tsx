
import { Resume } from '@/types/candidate';
import { Users, TrendingUp, MapPin, Award } from 'lucide-react';
import { filterValidResumes } from '@/utils/resumeFilters';

interface DashboardStatsProps {
  uploads: Resume[];
}

export const DashboardStats = ({ uploads }: DashboardStatsProps) => {
  // Use the centralized filtering logic
  const validCandidates = filterValidResumes(uploads);
  const totalCandidates = validCandidates.length;
  
  // Calculate average score
  const averageScore = validCandidates.length > 0 
    ? validCandidates.reduce((sum, resume) => {
        const score = resume.fit_score || 0;
        return sum + score;
      }, 0) / validCandidates.length
    : 0;

  // Get unique countries with proper type checking
  const uniqueCountries = new Set<string>();
  validCandidates.forEach(resume => {
    const nationality = resume.nationality;
    const location = resume.location;
    
    if (nationality) {
      uniqueCountries.add(nationality.trim());
    }
    if (location) {
      uniqueCountries.add(location.trim());
    }
  });

  const stats = [
    {
      title: 'QUALIFIED CANDIDATES',
      value: totalCandidates,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'AVERAGE FIT SCORE',
      value: `${Math.round(averageScore)}/10`,
      icon: TrendingUp,
      color: 'brand'
    },
    {
      title: 'UNIQUE COUNTRIES',
      value: uniqueCountries.size,
      icon: MapPin,
      color: 'red'
    }
  ];

  const getIconColor = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-400 bg-blue-500/10';
      case 'brand': return 'text-slate-400 bg-slate-500/10';
      case 'red': return 'text-red-400 bg-red-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl rounded-2xl"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 via-transparent to-slate-500/5 rounded-2xl"></div>
          
          {/* Content */}
          <div className="relative z-10 p-8 border border-white/10 rounded-2xl transition-all duration-300 hover:scale-105 hover:border-slate-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 tracking-wider mb-2">
                  {stat.title}
                </p>
                <p className="text-4xl font-bold text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`p-4 rounded-xl ${getIconColor(stat.color)}`}>
                <stat.icon className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
