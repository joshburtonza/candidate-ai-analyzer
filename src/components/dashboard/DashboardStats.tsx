
import { Card } from '@/components/ui/card';
import { Upload, Users, TrendingUp, Calendar } from 'lucide-react';
import { CVUpload } from '@/types/candidate';
import { GmailIntegrationCard } from './GmailIntegrationCard';

interface DashboardStatsProps {
  uploads: CVUpload[];
}

export const DashboardStats = ({ uploads }: DashboardStatsProps) => {
  const totalUploads = uploads.length;
  const completedUploads = uploads.filter(upload => upload.processing_status === 'completed').length;
  const pendingUploads = uploads.filter(upload => upload.processing_status === 'pending' || upload.processing_status === 'processing').length;
  const todayUploads = uploads.filter(upload => {
    const today = new Date();
    const uploadDate = new Date(upload.uploaded_at || '');
    return uploadDate.toDateString() === today.toDateString();
  }).length;

  const stats = [
    {
      title: 'Total CVs',
      value: totalUploads,
      icon: Upload,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      title: 'Processed',
      value: completedUploads,
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      title: 'Processing',
      value: pendingUploads,
      icon: TrendingUp,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20'
    },
    {
      title: 'Today',
      value: todayUploads,
      icon: Calendar,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="dark-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">{stat.title}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
      
      <GmailIntegrationCard />
    </div>
  );
};
