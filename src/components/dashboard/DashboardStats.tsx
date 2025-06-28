
import { CVUpload } from '@/types/candidate';
import { Users, TrendingUp, MapPin, Award } from 'lucide-react';

interface DashboardStatsProps {
  uploads: CVUpload[];
}

export const DashboardStats = ({ uploads }: DashboardStatsProps) => {
  // Filter for valid candidates with complete data and score >= 5
  const validCandidates = uploads.filter(upload => {
    if (upload.processing_status !== 'completed' || !upload.extracted_json) return false;
    
    const data = upload.extracted_json;
    const hasRequiredFields = data.candidate_name && data.contact_number && 
                             data.email_address && data.countries && data.skill_set && 
                             data.educational_qualifications && data.job_history && data.justification;
    
    if (!hasRequiredFields) return false;
    
    const rawScore = parseFloat(data.score || '0');
    const score = rawScore > 10 ? Math.round(rawScore / 10) : Math.round(rawScore);
    return score >= 5;
  });

  const totalCandidates = validCandidates.length;
  
  // Calculate average score
  const averageScore = validCandidates.length > 0 
    ? validCandidates.reduce((sum, upload) => {
        const rawScore = parseFloat(upload.extracted_json?.score || '0');
        const score = rawScore > 10 ? Math.round(rawScore / 10) : Math.round(rawScore);
        return sum + score;
      }, 0) / validCandidates.length
    : 0;

  // Get unique countries with proper type checking
  const uniqueCountries = new Set<string>();
  validCandidates.forEach(upload => {
    const countries = upload.extracted_json?.countries;
    if (countries) {
      // Handle different data types for countries
      if (typeof countries === 'string') {
        countries.split(',').forEach(country => {
          uniqueCountries.add(country.trim());
        });
      } else if (Array.isArray(countries)) {
        // Type assert the array as string array and filter for strings
        const countryArray = countries as unknown[];
        countryArray.forEach((country) => {
          if (typeof country === 'string') {
            uniqueCountries.add(country.trim());
          }
        });
      }
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
      color: 'orange'
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
      case 'orange': return 'text-orange-400 bg-orange-500/10';
      case 'red': return 'text-red-400 bg-red-500/10';
      default: return 'text-orange-400 bg-orange-500/10';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl rounded-2xl"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-orange-500/5 rounded-2xl"></div>
          
          {/* Content */}
          <div className="relative z-10 p-8 border border-white/10 rounded-2xl transition-all duration-300 hover:scale-105 hover:border-orange-500/30">
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
