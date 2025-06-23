
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
    console.log('CandidateProfile: Candidate ID from params:', id);
    if (id) {
      fetchCandidate();
    } else {
      console.error('CandidateProfile: No ID provided in route params');
      setLoading(false);
    }
  }, [id]);

  const fetchCandidate = async () => {
    try {
      console.log('CandidateProfile: Fetching candidate with ID:', id);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cv_uploads')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      console.log('CandidateProfile: Query result:', { data, error });

      if (error) {
        console.error('CandidateProfile: Database error:', error);
        throw error;
      }
      
      if (!data) {
        console.log('CandidateProfile: No candidate found with ID:', id);
        toast({
          title: "Candidate not found",
          description: "The candidate profile you're looking for doesn't exist.",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      console.log('CandidateProfile: Found candidate data:', data);
      console.log('CandidateProfile: Processing status:', data.processing_status);
      console.log('CandidateProfile: Extracted JSON:', data.extracted_json);

      // Safely handle the JSON conversion
      let extractedData: CandidateData | null = null;
      if (data.extracted_json && typeof data.extracted_json === 'object' && !Array.isArray(data.extracted_json)) {
        extractedData = data.extracted_json as CandidateData;
      }

      // Type the upload properly
      const typedUpload: CVUpload = {
        ...data,
        extracted_json: extractedData,
        processing_status: data.processing_status as 'pending' | 'processing' | 'completed' | 'error'
      };

      console.log('CandidateProfile: Typed upload:', typedUpload);
      setUpload(typedUpload);

      // Check if the candidate data is properly extracted
      if (!typedUpload.extracted_json) {
        console.warn('CandidateProfile: No extracted JSON data found');
        toast({
          title: "Processing incomplete",
          description: "This candidate's CV is still being processed. Please try again later.",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('CandidateProfile: Error in fetchCandidate:', error);
      toast({
        title: "Error",
        description: "Failed to load candidate profile: " + (error.message || 'Unknown error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen dot-grid-bg flex items-center justify-center">
        <div className="text-white text-lg font-medium">Loading candidate profile...</div>
      </div>
    );
  }

  if (!upload) {
    return (
      <div className="min-h-screen dot-grid-bg flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-semibold mb-4">Candidate Not Found</h2>
          <p className="text-gray-400 mb-6">The candidate profile you're looking for doesn't exist or couldn't be loaded.</p>
          <Button 
            onClick={() => navigate('/dashboard')} 
            className="bg-orange-500 hover:bg-orange-600 text-black font-semibold"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!upload.extracted_json) {
    return (
      <div className="min-h-screen dot-grid-bg flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-semibold mb-4">Processing Incomplete</h2>
          <p className="text-gray-400 mb-6">This candidate's CV is still being processed. Please try again later.</p>
          <div className="space-y-4">
            <Button 
              onClick={fetchCandidate}
              className="bg-orange-500 hover:bg-orange-600 text-black font-semibold mr-4"
            >
              Refresh
            </Button>
            <Button 
              onClick={() => navigate('/dashboard')} 
              variant="outline"
              className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const data = upload.extracted_json;
  const score = parseInt(data.score || '0');
  const skills = data.skill_set ? data.skill_set.split(',').map(s => s.trim()) : [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-orange-600 to-orange-400';
    if (score >= 60) return 'from-yellow-600 to-orange-500';
    if (score >= 40) return 'from-red-600 to-yellow-600';
    return 'from-gray-600 to-red-600';
  };

  return (
    <div className="min-h-screen dot-grid-bg">
      <div className="relative z-10 container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="mb-8 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Dashboard
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Basic Info & Score */}
            <div className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-700/50 p-8">
                <div className="text-center">
                  <div className="p-6 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center border border-orange-500/30">
                    <User className="w-12 h-12 text-orange-500" />
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-4">
                    {data.candidate_name || 'Unknown Candidate'}
                  </h1>
                  
                  {/* Score Circle */}
                  <div className="mb-8">
                    <div className={`w-28 h-28 rounded-full bg-gradient-to-r ${getScoreColor(score)} flex items-center justify-center mx-auto mb-4 shadow-xl`}>
                      <span className="text-white font-bold text-3xl">{score}</span>
                    </div>
                    <p className="text-white/80">Assessment Score</p>
                    <Progress value={score} scoreValue={score} className="mt-4 h-2" />
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4 text-left">
                    {data.email_address && (
                      <div className="flex items-center gap-4 text-white/90">
                        <Mail className="w-5 h-5 text-orange-500" />
                        <span>{data.email_address}</span>
                      </div>
                    )}
                    {data.contact_number && (
                      <div className="flex items-center gap-4 text-white/90">
                        <Phone className="w-5 h-5 text-orange-500" />
                        <span>{data.contact_number}</span>
                      </div>
                    )}
                    {data.countries && (
                      <div className="flex items-center gap-4 text-white/90">
                        <MapPin className="w-5 h-5 text-orange-500" />
                        <span>{data.countries}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Skills */}
              {skills.length > 0 && (
                <Card className="bg-gray-900/50 border-gray-700/50 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Star className="w-6 h-6 text-orange-500" />
                    <h3 className="text-xl font-semibold text-white">Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {skills.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-gray-700 text-white border-gray-600 px-3 py-1"
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
              <Card className="bg-gray-900/50 border-gray-700/50 p-8">
                <h3 className="text-2xl font-semibold text-white mb-6">Professional Assessment</h3>
                <p className="text-white/90 leading-relaxed text-lg">
                  {data.justification || 'Assessment pending analysis'}
                </p>
              </Card>

              {/* Education */}
              {data.educational_qualifications && (
                <Card className="bg-gray-900/50 border-gray-700/50 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <GraduationCap className="w-6 h-6 text-orange-500" />
                    <h3 className="text-2xl font-semibold text-white">Education</h3>
                  </div>
                  <div className="text-white/90 whitespace-pre-line leading-relaxed">
                    {data.educational_qualifications}
                  </div>
                </Card>
              )}

              {/* Work Experience */}
              {data.job_history && (
                <Card className="bg-gray-900/50 border-gray-700/50 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Briefcase className="w-6 h-6 text-orange-500" />
                    <h3 className="text-2xl font-semibold text-white">Work Experience</h3>
                  </div>
                  <div className="text-white/90 whitespace-pre-line leading-relaxed">
                    {data.job_history}
                  </div>
                </Card>
              )}

              {/* File Info */}
              <Card className="bg-gray-900/50 border-gray-700/50 p-8">
                <h3 className="text-2xl font-semibold text-white mb-6">Document Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-white/60 text-sm">Original Filename:</span>
                    <p className="text-white font-medium">{upload.original_filename}</p>
                  </div>
                  <div>
                    <span className="text-white/60 text-sm">Upload Date:</span>
                    <p className="text-white font-medium">
                      {new Date(upload.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  {upload.file_size && (
                    <div>
                      <span className="text-white/60 text-sm">File Size:</span>
                      <p className="text-white font-medium">
                        {(upload.file_size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-white/60 text-sm">Processing Status:</span>
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
