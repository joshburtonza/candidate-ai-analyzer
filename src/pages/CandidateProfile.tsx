
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ArrowLeft, User, Mail, Phone, MapPin, GraduationCap, Briefcase, Star, Clipboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

type Resume = Tables<'resumes'>;

const CandidateProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState<Resume | null>(null);
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
        .from('resumes')
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

      setResume(data);
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

  if (!resume) {
    return (
      <div className="min-h-screen elegant-gradient flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-semibold mb-4 text-elegant tracking-wider">CANDIDATE NOT FOUND</h2>
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="outline"
            className="border-brand/30 text-brand hover:bg-brand/10 elegant-border text-elegant tracking-wider"
          >
            RETURN TO DASHBOARD
          </Button>
        </div>
      </div>
    );
  };

  const data = resume;
  
  // Convert score to be out of 10 instead of 100
  const rawScore = parseFloat(data.fit_score?.toString() || '0');
  const score = rawScore > 10 ? Math.round(rawScore / 10) : Math.round(rawScore);
  const skills = data.skills ? data.skills : [];

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'from-slate-400 to-slate-600';
    if (score >= 6) return 'from-slate-500 to-slate-700';
    return 'from-slate-600 to-slate-800';
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
          <div className="flex items-center justify-between mb-8">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="border-brand/30 text-brand hover:bg-brand/10 elegant-border text-elegant tracking-wider"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              RETURN TO DASHBOARD
            </Button>

            {/* Email Button */}
            {data.email && (
              <Button
                onClick={() => window.open(`mailto:${data.email}`, '_blank')}
                className="bg-gradient-to-r from-slate-400 to-slate-600 hover:from-slate-500 hover:to-slate-700 text-white font-semibold text-elegant tracking-wider"
              >
                <Mail className="w-4 h-4 mr-2" />
                EMAIL CANDIDATE
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Basic Info & Score */}
            <div className="space-y-6">
              <Card className="glass-card elegant-border p-8">
                <div className="text-center">
                  <div className="p-6 bg-gradient-to-br from-slate-400/20 to-slate-600/30 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <User className="w-12 h-12 text-slate-400" />
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-4 text-elegant tracking-wider break-words">
                    {data.name || 'UNKNOWN CANDIDATE'}
                  </h1>
                  
                  {/* Score Circle */}
                  <div className="mb-8">
                    <div className={`w-28 h-28 rounded-full bg-gradient-to-r ${getScoreColor(score)} flex items-center justify-center mx-auto mb-4 shadow-xl`}>
                      <span className="text-white font-bold text-3xl">{score}</span>
                    </div>
                    <p className="text-white/80 text-elegant tracking-wider">ASSESSMENT SCORE</p>
                    <Progress value={(score / 10) * 100} className="mt-4 h-2" />
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4 text-left">
                    {data.email && (
                      <div className="flex items-center gap-4 text-white/90">
                        <Mail className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <span className="break-all min-w-0">{data.email}</span>
                      </div>
                    )}
                    {data.phone && (
                      <div className="flex items-center gap-4 text-white/90">
                        <Phone className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <span className="break-words min-w-0">{data.phone}</span>
                      </div>
                    )}
                    {data.location && (
                      <div className="flex items-center gap-4 text-white/90">
                        <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <span className="break-words min-w-0">{data.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Justification */}
              {data.justification && (
                <Card className="glass-card elegant-border p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Clipboard className="w-6 h-6 text-slate-400" />
                    <h3 className="text-xl font-semibold text-white text-elegant tracking-wider">JUSTIFICATION</h3>
                  </div>
                  <div className="text-white/90 leading-relaxed">
                    <p className="whitespace-pre-wrap break-words">
                      {data.justification}
                    </p>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Detailed Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Education */}
              {data.education_details && (
                <Card className="glass-card elegant-border p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <GraduationCap className="w-6 h-6 text-slate-400" />
                    <h3 className="text-2xl font-semibold text-white text-elegant tracking-wider">ACADEMIC CREDENTIALS</h3>
                  </div>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div className="text-white/90 leading-relaxed cursor-pointer">
                        <p className="whitespace-pre-wrap break-words">
                          {JSON.stringify(data.education_details, null, 2)}
                        </p>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-96 max-w-[90vw] p-4 bg-slate-800/95 border-slate-600/50 text-white">
                      <div className="text-sm leading-relaxed">
                        <p className="whitespace-pre-wrap break-words">
                          {JSON.stringify(data.education_details, null, 2)}
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </Card>
              )}

              {/* Work Experience */}
              {data.current_company && (
                <Card className="glass-card elegant-border p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Briefcase className="w-6 h-6 text-slate-400" />
                    <h3 className="text-2xl font-semibold text-white text-elegant tracking-wider">PROFESSIONAL EXPERIENCE</h3>
                  </div>
                  <div className="text-white/90 leading-relaxed">
                    <div className="mb-4">
                      <span className="text-white/60 text-sm tracking-wider">CURRENT COMPANY:</span>
                      <p className="text-white font-medium">{data.current_company}</p>
                    </div>
                    {data.role_title && (
                      <div className="mb-4">
                        <span className="text-white/60 text-sm tracking-wider">ROLE:</span>
                        <p className="text-white font-medium">{data.role_title}</p>
                      </div>
                    )}
                    {data.experience_years && (
                      <div className="mb-4">
                        <span className="text-white/60 text-sm tracking-wider">EXPERIENCE:</span>
                        <p className="text-white font-medium">{data.experience_years} years</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* File Info */}
              <Card className="glass-card elegant-border p-8">
                <h3 className="text-2xl font-semibold text-white mb-6 text-elegant tracking-wider">DOCUMENT DETAILS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-white/60 text-sm tracking-wider">FILENAME:</span>
                    <p className="text-white font-medium break-all">{data.file_name}</p>
                  </div>
                  <div>
                    <span className="text-white/60 text-sm tracking-wider">CREATED DATE:</span>
                    <p className="text-white font-medium break-words">
                      {new Date(data.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {data.file_size && (
                    <div>
                      <span className="text-white/60 text-sm tracking-wider">FILE SIZE:</span>
                      <p className="text-white font-medium break-words">
                        {(data.file_size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-white/60 text-sm tracking-wider">STATUS:</span>
                    <p className="text-white font-medium capitalize break-words">{data.status}</p>
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
