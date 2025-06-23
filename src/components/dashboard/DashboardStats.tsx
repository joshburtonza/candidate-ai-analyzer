
import { Users, FileText, TrendingUp, MapPin, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CVUpload } from '@/types/candidate';
import { motion } from 'framer-motion';

interface DashboardStatsProps {
  uploads: CVUpload[];
}

export const DashboardStats = ({ uploads }: DashboardStatsProps) => {
  const completedUploads = uploads.filter(u => u.processing_status === 'completed' && u.extracted_json);
  
  const stats = {
    totalCandidates: completedUploads.length,
    todayUploads: uploads.filter(u => {
      const today = new Date().toDateString();
      return new Date(u.uploaded_at).toDateString() === today;
    }).length,
    averageScore: completedUploads.length > 0 
      ? Math.round(completedUploads.reduce((sum, upload) => {
          return sum + parseInt(upload.extracted_json?.score || '0');
        }, 0) / completedUploads.length)
      : 0,
    uniqueCountries: new Set(
      completedUploads
        .map(u => u.extracted_json?.countries)
        .filter(Boolean)
        .join(',')
        .split(',')
        .map(c => c.trim())
        .filter(Boolean)
    ).size,
  };

  const statCards = [
    {
      title: 'Total Candidates',
      value: stats.totalCandidates,
      icon: Users,
      color: 'from-blue-400 to-cyan-400',
      bgColor: 'from-blue-400/20 to-cyan-400/20',
    },
    {
      title: "Today's Uploads",
      value: stats.todayUploads,
      icon: Calendar,
      color: 'from-green-400 to-emerald-400',
      bgColor: 'from-green-400/20 to-emerald-400/20',
    },
    {
      title: 'Average Fit Score',
      value: `${stats.averageScore}%`,
      icon: TrendingUp,
      color: 'from-yellow-400 to-yellow-600',
      bgColor: 'from-yellow-400/20 to-yellow-600/20',
    },
    {
      title: 'Unique Countries',
      value: stats.uniqueCountries,
      icon: MapPin,
      color: 'from-orange-400 to-red-400',
      bgColor: 'from-orange-400/20 to-red-400/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="glass-card elegant-border p-6 hover:bg-white/5 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm font-medium text-elegant tracking-wider">{stat.title.toUpperCase()}</p>
                <p className="text-3xl font-bold text-white mt-1 text-elegant">{stat.value}</p>
              </div>
              <div className={`p-4 rounded-xl bg-gradient-to-r ${stat.bgColor} group-hover:scale-110 transition-transform duration-300 border border-white/10`}>
                <stat.icon className={`w-6 h-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
