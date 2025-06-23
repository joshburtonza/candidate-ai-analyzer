
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CVUpload } from '@/types/candidate';
import { FileText, Upload, Calendar, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export const UsageStats = () => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<CVUpload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserUploads();
    }
  }, [user]);

  const fetchUserUploads = async () => {
    try {
      const { data, error } = await supabase
        .from('cv_uploads')
        .select('*')
        .eq('user_id', user?.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      const typedUploads: CVUpload[] = (data || []).map(upload => ({
        ...upload,
        extracted_json: upload.extracted_json as any,
        processing_status: upload.processing_status as 'pending' | 'processing' | 'completed' | 'error'
      }));
      
      setUploads(typedUploads);
    } catch (error) {
      console.error('Error fetching uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardContent className="p-6">
          <div className="text-center text-white">Loading usage statistics...</div>
        </CardContent>
      </Card>
    );
  }

  const totalUploads = uploads.length;
  const completedUploads = uploads.filter(u => u.processing_status === 'completed').length;
  const pendingUploads = uploads.filter(u => u.processing_status === 'pending' || u.processing_status === 'processing').length;
  const errorUploads = uploads.filter(u => u.processing_status === 'error').length;

  const thisMonthUploads = uploads.filter(u => {
    const uploadDate = new Date(u.uploaded_at);
    const now = new Date();
    return uploadDate.getMonth() === now.getMonth() && uploadDate.getFullYear() === now.getFullYear();
  }).length;

  const thisWeekUploads = uploads.filter(u => {
    const uploadDate = new Date(u.uploaded_at);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return uploadDate >= weekAgo;
  }).length;

  const stats = [
    {
      title: 'Total Uploads',
      value: totalUploads,
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Completed',
      value: completedUploads,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'This Month',
      value: thisMonthUploads,
      icon: Calendar,
      color: 'from-violet-500 to-purple-500',
    },
    {
      title: 'This Week',
      value: thisWeekUploads,
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Processing Status */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Processing Status</CardTitle>
          <CardDescription className="text-slate-300">
            Overview of your upload processing status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-300">Completed</span>
                <span className="text-sm text-white">{completedUploads}/{totalUploads}</span>
              </div>
              <Progress 
                value={totalUploads > 0 ? (completedUploads / totalUploads) * 100 : 0} 
                className="h-2"
              />
            </div>
            
            {pendingUploads > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-300">Processing</span>
                  <span className="text-sm text-white">{pendingUploads}/{totalUploads}</span>
                </div>
                <Progress 
                  value={totalUploads > 0 ? (pendingUploads / totalUploads) * 100 : 0} 
                  className="h-2"
                />
              </div>
            )}

            {errorUploads > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-300">Errors</span>
                  <span className="text-sm text-white">{errorUploads}/{totalUploads}</span>
                </div>
                <Progress 
                  value={totalUploads > 0 ? (errorUploads / totalUploads) * 100 : 0} 
                  className="h-2"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
          <CardDescription className="text-slate-300">
            Your latest uploads and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploads.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-300">No uploads yet</p>
              <p className="text-sm text-slate-400">Start by uploading your first CV</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploads.slice(0, 5).map((upload) => (
                <div key={upload.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                  <FileText className="w-5 h-5 text-violet-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{upload.original_filename}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(upload.uploaded_at).toLocaleDateString()} at{' '}
                      {new Date(upload.uploaded_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    upload.processing_status === 'completed' 
                      ? 'bg-green-500/20 text-green-400'
                      : upload.processing_status === 'error'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {upload.processing_status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
