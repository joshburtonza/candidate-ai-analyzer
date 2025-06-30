
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Upload, Calendar, TrendingUp, Clock, CheckCircle } from 'lucide-react';

// Using the existing resumes table structure from your schema
interface ResumeData {
  id: string;
  name: string;
  email?: string;
  created_at: string;
  status: string;
  fit_score?: number;
  file_name: string;
}

export const UsageStats = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserResumes();
    }
  }, [user]);

  const fetchUserResumes = async () => {
    try {
      // Using the existing resumes table instead of cv_uploads
      const { data, error } = await supabase
        .from('resumes')
        .select('id, name, email, created_at, status, fit_score, file_name')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setResumes(data || []);
    } catch (error) {
      console.error('Error fetching resumes:', error);
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

  const totalResumes = resumes.length;
  const completedResumes = resumes.filter(r => r.status === 'processed').length;
  const pendingResumes = resumes.filter(r => r.status === 'pending').length;
  const failedResumes = resumes.filter(r => r.status === 'failed').length;

  const thisMonthResumes = resumes.filter(r => {
    const resumeDate = new Date(r.created_at);
    const now = new Date();
    return resumeDate.getMonth() === now.getMonth() && resumeDate.getFullYear() === now.getFullYear();
  }).length;

  const thisWeekResumes = resumes.filter(r => {
    const resumeDate = new Date(r.created_at);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return resumeDate >= weekAgo;
  }).length;

  const stats = [
    {
      title: 'Total Resumes',
      value: totalResumes,
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Processed',
      value: completedResumes,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'This Month',
      value: thisMonthResumes,
      icon: Calendar,
      color: 'from-violet-500 to-purple-500',
    },
    {
      title: 'This Week',
      value: thisWeekResumes,
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
            Overview of your resume processing status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-300">Processed</span>
                <span className="text-sm text-white">{completedResumes}/{totalResumes}</span>
              </div>
              <Progress 
                value={totalResumes > 0 ? (completedResumes / totalResumes) * 100 : 0} 
                className="h-2"
              />
            </div>
            
            {pendingResumes > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-300">Pending</span>
                  <span className="text-sm text-white">{pendingResumes}/{totalResumes}</span>
                </div>
                <Progress 
                  value={totalResumes > 0 ? (pendingResumes / totalResumes) * 100 : 0} 
                  className="h-2"
                />
              </div>
            )}

            {failedResumes > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-300">Failed</span>
                  <span className="text-sm text-white">{failedResumes}/{totalResumes}</span>
                </div>
                <Progress 
                  value={totalResumes > 0 ? (failedResumes / totalResumes) * 100 : 0} 
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
            Your latest resumes and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resumes.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-300">No resumes yet</p>
              <p className="text-sm text-slate-400">Start by uploading your first resume</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.slice(0, 5).map((resume) => (
                <div key={resume.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                  <FileText className="w-5 h-5 text-violet-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{resume.file_name}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(resume.created_at).toLocaleDateString()} at{' '}
                      {new Date(resume.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    resume.status === 'processed' 
                      ? 'bg-green-500/20 text-green-400'
                      : resume.status === 'failed'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {resume.status}
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
