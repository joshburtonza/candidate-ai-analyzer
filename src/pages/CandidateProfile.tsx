
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CVUpload, CandidateData } from '@/types/candidate';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ArrowLeft, User, Mail, Phone, MapPin, GraduationCap, Briefcase, Star, Calendar } from 'lucide-react';
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
            className="border-brand/30 text-brand hover:bg-brand/10 elegant-border text-elegant tracking-wider"
          >
            RETURN TO DASHBOARD
          </Button>
        </div>
      </div>
    );
  };

  const data = upload.extracted_json;
  
  // Debug logging to trace current employment data
  console.log('Full Upload Object:', upload);
  console.log('Extracted JSON Data:', data);
  console.log('Current Employment Field:', data.current_employment);
  console.log('All data keys:', Object.keys(data));
  
  // Convert score to be out of 10 instead of 100
  const rawScore = parseFloat(data.score || '0');
  const score = rawScore > 10 ? Math.round(rawScore / 10) : Math.round(rawScore);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'from-green-500 to-green-600';
    if (score >= 5) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 8) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (score >= 5) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  // Format date extracted
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  // Get candidate initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
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
            {data.email_address && (
              <Button
                onClick={() => window.open(`mailto:${data.email_address}`, '_blank')}
                className="bg-gradient-to-r from-slate-400 to-slate-600 hover:from-slate-500 hover:to-slate-700 text-white font-semibold text-elegant tracking-wider"
              >
                <Mail className="w-4 h-4 mr-2" />
                EMAIL CANDIDATE
              </Button>
            )}
          </div>

          {/* Header Section */}
          <div className="text-center mb-8">
            {/* Avatar with Initials */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-400/20 to-slate-600/30 mx-auto mb-6 flex items-center justify-center border-2 border-slate-500/30">
              <span className="text-4xl font-bold text-white">
                {data.candidate_name ? getInitials(data.candidate_name) : 'UK'}
              </span>
            </div>
            
            {/* Candidate Name */}
            <h1 className="text-4xl font-bold text-white mb-6 text-elegant tracking-wider break-words">
              {data.candidate_name || 'UNKNOWN CANDIDATE'}
            </h1>
            
            {/* Score Badge */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className={`inline-flex items-center px-6 py-3 rounded-full border ${getScoreBadgeColor(score)}`}>
                <Star className="w-5 h-5 mr-2" />
                <span className="text-2xl font-bold">{score}/10</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              
              {/* Contact Information Card */}
              <Card className="glass-card elegant-border p-6">
                <h2 className="text-xl font-semibold text-white mb-4 text-elegant tracking-wider">CONTACT INFORMATION</h2>
                <div className="space-y-4">
                  {/* Date Extracted */}
                  <div className="flex items-center gap-4 text-white/90">
                    <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="text-white/60 text-sm block">Date Extracted:</span>
                      <span className="break-words">
                        {data.date_extracted ? formatDate(data.date_extracted) : 'Not provided'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Email Address */}
                  <div className="flex items-center gap-4 text-white/90">
                    <Mail className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="text-white/60 text-sm block">Email Address:</span>
                      <span className="break-all">{data.email_address || 'Not provided'}</span>
                    </div>
                  </div>
                  
                  {/* Contact Number */}
                  <div className="flex items-center gap-4 text-white/90">
                    <Phone className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="text-white/60 text-sm block">Contact Number:</span>
                      <span className="break-words">{data.contact_number || 'Not provided'}</span>
                    </div>
                  </div>
                  
                  {/* Countries */}
                  <div className="flex items-center gap-4 text-white/90">
                    <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="text-white/60 text-sm block">Countries:</span>
                      <span className="break-words">{data.countries || 'Not provided'}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Current Employment */}
              <Card className="glass-card elegant-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Briefcase className="w-6 h-6 text-slate-400" />
                  <h2 className="text-xl font-semibold text-white text-elegant tracking-wider">CURRENT EMPLOYMENT</h2>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">CURRENT</Badge>
                </div>
                <div className="text-white/90 leading-relaxed">
                  <p className="whitespace-pre-wrap break-words">
                    {data.current_employment || 'Not provided'}
                  </p>
                </div>
              </Card>

              {/* Educational Qualifications */}
              <Card className="glass-card elegant-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <GraduationCap className="w-6 h-6 text-slate-400" />
                  <h2 className="text-xl font-semibold text-white text-elegant tracking-wider">EDUCATIONAL QUALIFICATIONS</h2>
                </div>
                <div className="text-white/90 leading-relaxed">
                  <p className="whitespace-pre-wrap break-words">
                    {data.educational_qualifications || 'Not provided'}
                  </p>
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* Job History */}
              <Card className="glass-card elegant-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Briefcase className="w-6 h-6 text-slate-400" />
                  <h2 className="text-xl font-semibold text-white text-elegant tracking-wider">JOB HISTORY</h2>
                </div>
                <div className="text-white/90 leading-relaxed">
                  <p className="whitespace-pre-wrap break-words">
                    {data.job_history || 'Not provided'}
                  </p>
                </div>
              </Card>

              {/* Score Justification */}
              <Card className="glass-card elegant-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Star className="w-6 h-6 text-slate-400" />
                  <h2 className="text-xl font-semibold text-white text-elegant tracking-wider">SCORE JUSTIFICATION</h2>
                </div>
                <div className="text-white/90 leading-relaxed">
                  <p className="whitespace-pre-wrap break-words">
                    {data.justification || 'Not provided'}
                  </p>
                </div>
              </Card>

              {/* Document Details */}
              <Card className="glass-card elegant-border p-6">
                <h2 className="text-xl font-semibold text-white mb-4 text-elegant tracking-wider">DOCUMENT DETAILS</h2>
                <div className="space-y-4">
                  <div>
                    <span className="text-white/60 text-sm block">Original Filename:</span>
                    <p className="text-white/90 break-all">{upload.original_filename}</p>
                  </div>
                  <div>
                    <span className="text-white/60 text-sm block">Upload Date:</span>
                    <p className="text-white/90">{formatDate(upload.uploaded_at)}</p>
                  </div>
                  {upload.file_size && (
                    <div>
                      <span className="text-white/60 text-sm block">File Size:</span>
                      <p className="text-white/90">{(upload.file_size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                  <div>
                    <span className="text-white/60 text-sm block">Processing Status:</span>
                    <p className="text-white/90 capitalize">{upload.processing_status}</p>
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
