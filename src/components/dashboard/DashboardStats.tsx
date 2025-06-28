
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
        countries.forEach((country: any) => {
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
      case 'blue': return 'text-blue-400 bg-blue-500/20';
      case 'orange': return 'text-brand bg-brand-gradient/20';
      case 'red': return 'text-red-400 bg-red-500/20';
      default: return 'text-brand bg-brand-gradient/20';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="glass p-6 rounded-lgx hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/70 tracking-wider">
                {stat.title}
              </p>
              <p className="text-3xl font-bold text-white mt-2">
                {stat.value}
              </p>
            </div>
            <div className={`p-3 rounded-lgx ${getIconColor(stat.color)}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
