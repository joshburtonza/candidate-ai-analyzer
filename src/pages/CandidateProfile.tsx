
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
      <div className="min-h-screen elegant-gradient flex items-center justify-center">
        <div className="text-white text-elegant tracking-wider">ANALYZING CANDIDATE PROFILE...</div>
      </div>
    );
  }

  if (!upload || !upload.extracted_json) {
    return (
      <div className="min-h-screen elegant-gradient flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-semibold mb-4 text-elegant tracking-wider">CANDIDATE NOT FOUND</h2>
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="outline"
            className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10 elegant-border text-elegant tracking-wider"
          >
            RETURN TO DASHBOARD
          </Button>
        </div>
      </div>
    );
  }

  const data = upload.extracted_json;
  const score = parseInt(data.score || '0');
  const skills = data.skill_set ? data.skill_set.split(',').map(s => s.trim()) : [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-yellow-400 to-yellow-600';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className="min-h-screen elegant-gradient">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.1'%3E%3Cpath d='M30 30l15-15v30l-15-15zm-15-15v30l15-15-15-15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10 container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="mb-8 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10 elegant-border text-elegant tracking-wider"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            RETURN TO DASHBOARD
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Basic Info & Score */}
            <div className="space-y-6">
              <Card className="glass-card elegant-border p-8">
                <div className="text-center">
                  <div className="p-6 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <User className="w-12 h-12 gold-accent" />
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-4 text-elegant tracking-wider">
                    {data.candidate_name || 'UNKNOWN CANDIDATE'}
                  </h1>
                  
                  {/* Score Circle */}
                  <div className="mb-8">
                    <div className={`w-28 h-28 rounded-full bg-gradient-to-r ${getScoreColor(score)} flex items-center justify-center mx-auto mb-4 shadow-xl`}>
                      <span className="text-black font-bold text-3xl">{score}</span>
                    </div>
                    <p className="text-white/80 text-elegant tracking-wider">ASSESSMENT SCORE</p>
                    <Progress value={score} className="mt-4 h-2" />
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4 text-left">
                    {data.email_address && (
                      <div className="flex items-center gap-4 text-white/90">
                        <Mail className="w-5 h-5 gold-accent" />
                        <span>{data.email_address}</span>
                      </div>
                    )}
                    {data.contact_number && (
                      <div className="flex items-center gap-4 text-white/90">
                        <Phone className="w-5 h-5 gold-accent" />
                        <span>{data.contact_number}</span>
                      </div>
                    )}
                    {data.countries && (
                      <div className="flex items-center gap-4 text-white/90">
                        <MapPin className="w-5 h-5 gold-accent" />
                        <span>{data.countries}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Skills */}
              {skills.length > 0 && (
                <Card className="glass-card elegant-border p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Star className="w-6 h-6 gold-accent" />
                    <h3 className="text-xl font-semibold text-white text-elegant tracking-wider">EXPERTISE</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {skills.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-white/10 text-white border-white/20 px-3 py-1"
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
              <Card className="glass-card elegant-border p-8">
                <h3 className="text-2xl font-semibold text-white mb-6 text-elegant tracking-wider">PROFESSIONAL ASSESSMENT</h3>
                <p className="text-white/90 leading-relaxed text-lg">
                  {data.justification || 'Assessment pending analysis'}
                </p>
              </Card>

              {/* Education */}
              {data.educational_qualifications && (
                <Card className="glass-card elegant-border p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <GraduationCap className="w-6 h-6 gold-accent" />
                    <h3 className="text-2xl font-semibold text-white text-elegant tracking-wider">ACADEMIC CREDENTIALS</h3>
                  </div>
                  <div className="text-white/90 whitespace-pre-line leading-relaxed">
                    {data.educational_qualifications}
                  </div>
                </Card>
              )}

              {/* Work Experience */}
              {data.job_history && (
                <Card className="glass-card elegant-border p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Briefcase className="w-6 h-6 gold-accent" />
                    <h3 className="text-2xl font-semibold text-white text-elegant tracking-wider">PROFESSIONAL EXPERIENCE</h3>
                  </div>
                  <div className="text-white/90 whitespace-pre-line leading-relaxed">
                    {data.job_history}
                  </div>
                </Card>
              )}

              {/* File Info */}
              <Card className="glass-card elegant-border p-8">
                <h3 className="text-2xl font-semibold text-white mb-6 text-elegant tracking-wider">DOCUMENT DETAILS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-white/60 text-sm tracking-wider">ORIGINAL FILENAME:</span>
                    <p className="text-white font-medium">{upload.original_filename}</p>
                  </div>
                  <div>
                    <span className="text-white/60 text-sm tracking-wider">UPLOAD DATE:</span>
                    <p className="text-white font-medium">
                      {new Date(upload.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  {upload.file_size && (
                    <div>
                      <span className="text-white/60 text-sm tracking-wider">FILE SIZE:</span>
                      <p className="text-white font-medium">
                        {(upload.file_size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-white/60 text-sm tracking-wider">PROCESSING STATUS:</span>
                    <p className="text-white font-medium capitalize">{upload.processing_status}</p>
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
