import React, { useMemo } from 'react';
import { CVUpload } from '@/types/candidate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { isSameDay } from 'date-fns';

interface DashboardStatsProps {
  uploads: CVUpload[];
  selectedDate?: Date | null;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ uploads, selectedDate }) => {
  const todayUploads = uploads.filter(upload => {
    const today = new Date();
    const uploadDate = new Date(upload.uploaded_at);
    return isSameDay(uploadDate, today);
  });

  const stats = useMemo(() => {
    const baseUploads = selectedDate 
      ? uploads.filter(upload => {
          const uploadDate = new Date(upload.uploaded_at);
          return isSameDay(uploadDate, selectedDate);
        })
      : todayUploads;
    
    const processedUploads = baseUploads.filter(upload => 
      upload.processing_status === 'completed' && upload.extracted_json
    );
    
    const totalScore = processedUploads.reduce((sum, upload) => {
      const score = upload.extracted_json?.score;
      return sum + (score ? parseFloat(score) : 0);
    }, 0);
    
    const avgScore = processedUploads.length > 0 
      ? Math.round(totalScore / processedUploads.length) 
      : 0;
    
    return {
      total: baseUploads.length,
      processed: processedUploads.length,
      pending: baseUploads.filter(upload => upload.processing_status === 'pending').length,
      avgScore
    };
  }, [uploads, todayUploads, selectedDate]);

  const statCards = [
    {
      title: 'Total Uploads',
      value: stats.total,
      icon: Upload,
      description: selectedDate ? 'Selected date' : 'Today'
    },
    {
      title: 'Processed',
      value: stats.processed,
      icon: CheckCircle,
      description: 'CVs analyzed'
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      description: 'Awaiting processing'
    },
    {
      title: 'Avg Score',
      value: stats.avgScore,
      icon: TrendingUp,
      description: 'Out of 100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;