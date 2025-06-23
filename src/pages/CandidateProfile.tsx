
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CVUpload, CandidateData } from '@/types/candidate';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, User, Mail, Phone, MapPin, GraduationCap, Briefcase, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const CandidateProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [upload, setUpload] = useState<CVUpload | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchCandidate();
    }
  }, [id]);

  const fetchCandidate = async () => {
    try {
      const { data, error } = await supabase
        .from('cv_uploads')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Candidate not found",
          description: "The candidate profile you're looking for doesn't exist.",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      // Properly cast the data with type assertion through unknown
      const typedUpload: CVUpload = {
        ...data,
        extracted_json: data.extracted_json as unknown as CandidateData | null,
        processing_status: data.processing_status as 'pending' | 'processing' | 'completed' | 'error'
      };

      setUpload(typedUpload);
    } catch (error: any) {
      console.error('Error fetching candidate:', error);
      toast({
        title: "Error",
        description: "Failed to load candidate profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-blue-900 flex items-center justify-center">
        <div className="text-white">Loading candidate profile...</div>
      </div>
    );
  }

  if (!upload || !upload.extracted_json) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold mb-2">Candidate not found</h2>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const data = upload.extracted_json;
  const score = parseInt(data.score || '0');
  const skills = data.skill_set ? data.skill_set.split(',').map(s => s.trim()) : [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-blue-900">
      <div className="absolute inset-0 opacity-50" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="mb-6 border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Basic Info & Score */}
            <div className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-6">
                <div className="text-center">
                  <div className="p-4 bg-violet-500/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <User className="w-10 h-10 text-violet-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {data.candidate_name || 'Unknown Candidate'}
                  </h1>
                  
                  {/* Score Circle */}
                  <div className="mb-6">
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${getScoreColor(score)} flex items-center justify-center mx-auto mb-2`}>
                      <span className="text-white font-bold text-2xl">{score}</span>
                    </div>
                    <p className="text-slate-300">Fit Score</p>
                    <Progress value={score} className="mt-2" />
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3 text-left">
                    {data.email_address && (
                      <div className="flex items-center gap-3 text-slate-300">
                        <Mail className="w-5 h-5 text-violet-400" />
                        <span>{data.email_address}</span>
                      </div>
                    )}
                    {data.contact_number && (
                      <div className="flex items-center gap-3 text-slate-300">
                        <Phone className="w-5 h-5 text-violet-400" />
                        <span>{data.contact_number}</span>
                      </div>
                    )}
                    {data.countries && (
                      <div className="flex items-center gap-3 text-slate-300">
                        <MapPin className="w-5 h-5 text-violet-400" />
                        <span>{data.countries}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Skills */}
              {skills.length > 0 && (
                <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-violet-400" />
                    <h3 className="text-lg font-semibold text-white">Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-white/10 text-white border-white/20"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Detailed Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Assessment */}
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Assessment</h3>
                <p className="text-slate-300 leading-relaxed">
                  {data.justification || 'No assessment available'}
                </p>
              </Card>

              {/* Education */}
              {data.educational_qualifications && (
                <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="w-5 h-5 text-violet-400" />
                    <h3 className="text-lg font-semibold text-white">Education</h3>
                  </div>
                  <div className="text-slate-300 whitespace-pre-line">
                    {data.educational_qualifications}
                  </div>
                </Card>
              )}

              {/* Work Experience */}
              {data.job_history && (
                <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="w-5 h-5 text-violet-400" />
                    <h3 className="text-lg font-semibold text-white">Work Experience</h3>
                  </div>
                  <div className="text-slate-300 whitespace-pre-line">
                    {data.job_history}
                  </div>
                </Card>
              )}

              {/* File Info */}
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">File Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Original Filename:</span>
                    <p className="text-white">{upload.original_filename}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Upload Date:</span>
                    <p className="text-white">
                      {new Date(upload.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  {upload.file_size && (
                    <div>
                      <span className="text-slate-400">File Size:</span>
                      <p className="text-white">
                        {(upload.file_size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400">Processing Status:</span>
                    <p className="text-white capitalize">{upload.processing_status}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CandidateProfile;
