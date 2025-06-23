
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
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: "Today's Uploads",
      value: stats.todayUploads,
      icon: Calendar,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Average Fit Score',
      value: `${stats.averageScore}%`,
      icon: TrendingUp,
      color: 'from-violet-500 to-purple-500',
    },
    {
      title: 'Unique Countries',
      value: stats.uniqueCountries,
      icon: MapPin,
      color: 'from-orange-500 to-red-500',
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
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-6 hover:bg-white/15 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
