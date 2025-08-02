
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
    const uploadDate = upload.received_date ? new Date(upload.received_date) : upload.extracted_json?.date_received ? new Date(upload.extracted_json.date_received) : new Date();
    return isSameDay(uploadDate, today);
  });

  const stats = useMemo(() => {
    const baseUploads = selectedDate 
      ? uploads.filter(upload => {
          const uploadDate = upload.received_date ? new Date(upload.received_date) : upload.extracted_json?.date_received ? new Date(upload.extracted_json.date_received) : new Date();
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
      description: selectedDate ? 'Selected date' : 'Today',
      color: 'text-blue-400'
    },
    {
      title: 'Processed',
      value: stats.processed,
      icon: CheckCircle,
      description: 'CVs analyzed',
      color: 'text-green-400'
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      description: 'Awaiting processing',
      color: 'text-yellow-400'
    },
    {
      title: 'Avg Score',
      value: stats.avgScore,
      icon: TrendingUp,
      description: 'Out of 100',
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 tracking-wider">DASHBOARD STATISTICS</h2>
        <p className="text-gray-400">Overview of your CV upload activity</p>
      </div>
      
      <div className="space-y-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="w-full">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className={`p-4 rounded-2xl bg-slate-500/10 border border-slate-500/20`}>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1 tracking-wider">
                      {stat.title.toUpperCase()}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {stat.description}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-5xl font-bold ${stat.color} mb-2`}>
                    {stat.value}
                  </div>
                  {stat.title === 'Total Uploads' && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedDate ? 'FILTERED' : 'TODAY'}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardStats;
