import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CVUpload, CandidateData } from '@/types/candidate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CandidateStatusManager } from '@/components/candidate/CandidateStatusManager';
import { ArrowLeft, Download, Mail, Phone, MapPin, GraduationCap, Briefcase, Award, FileText, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { HomeButton } from '@/components/ui/home-button';

const CandidateProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const [upload, setUpload] = useState<CVUpload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user && id) {
      fetchUpload();
    }
  }, [user, id, authLoading]);

  const fetchUpload = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cv_uploads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const typedUpload: CVUpload = {
          ...data,
          extracted_json: data.extracted_json as any,
          processing_status: data.processing_status as 'pending' | 'processing' | 'completed' | 'error'
        };
        setUpload(typedUpload);
      } else {
        setError('Upload not found');
      }
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to fetch upload",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!upload) return;

    try {
      const { error } = await supabase
        .from('cv_uploads')
        .update({ candidate_status: newStatus })
        .eq('id', upload.id);

      if (error) {
        throw error;
      }

      setUpload({ ...upload, candidate_status: newStatus });
      toast({
        title: "Success",
        description: "Candidate status updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update candidate status",
        variant: "destructive",
      });
    }
  };

  const downloadFile = async () => {
    if (!upload) return;

    try {
      const { data, error } = await supabase.storage
        .from('cv-files')
        .download(upload.file_url);

      if (error) {
        throw error;
      }

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = upload.original_filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen elegant-gradient flex items-center justify-center">
        <div className="text-white text-elegant tracking-wider">LOADING CANDIDATE PROFILE...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen elegant-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4 text-elegant tracking-wider">ERROR LOADING CANDIDATE PROFILE</div>
          <div className="text-white text-sm">{error}</div>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Go Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!upload) {
    return (
      <div className="min-h-screen elegant-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="text-white mb-4 text-elegant tracking-wider">CANDIDATE PROFILE NOT FOUND</div>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Go Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const candidateData: CandidateData | null = upload.extracted_json;

  return (
    <div className="min-h-screen dot-grid-bg">
      <HomeButton />
      
      <div className="relative z-10 container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-white flex items-center gap-2">
                {candidateData?.candidate_name || 'Unknown Candidate'}
                {upload.candidate_status && (
                  <Badge variant="secondary">{upload.candidate_status}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Personal Details</h3>
                  <div className="text-white/80 space-y-2">
                    {candidateData?.email_address && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${candidateData.email_address}`}>{candidateData.email_address}</a>
                      </div>
                    )}
                    {candidateData?.contact_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{candidateData.contact_number}</span>
                      </div>
                    )}
                    {candidateData?.countries && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{candidateData.countries}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">AI Analysis</h3>
                  <div className="text-white/80 space-y-2">
                    {candidateData?.score && (
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        <span>Score: {candidateData.score}</span>
                      </div>
                    )}
                    {candidateData?.justification && (
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 mt-1" />
                        <span>Justification: {candidateData.justification}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="status">Status</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="space-y-4">
                  {candidateData?.educational_qualifications && (
                    <div>
                      <h4 className="text-white font-semibold mb-2">Education</h4>
                      <p className="text-white/80">{candidateData.educational_qualifications}</p>
                    </div>
                  )}
                  {candidateData?.job_history && (
                    <div>
                      <h4 className="text-white font-semibold mb-2">Job History</h4>
                      <p className="text-white/80">{candidateData.job_history}</p>
                    </div>
                  )}
                  {candidateData?.skill_set && (
                    <div>
                      <h4 className="text-white font-semibold mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {candidateData.skill_set.split(',').map((skill, index) => (
                          <Badge key={index} variant="outline">{skill.trim()}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="status">
                  <CandidateStatusManager
                    currentStatus={upload.candidate_status || 'new'}
                    onStatusChange={handleStatusChange}
                  />
                </TabsContent>
                <TabsContent value="notes">
                  <div>
                    <h4 className="text-white font-semibold mb-2">Notes</h4>
                    <p className="text-white/80">Coming Soon</p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-between items-center">
                <Button onClick={downloadFile}>
                  <Download className="w-4 h-4 mr-2" />
                  Download CV
                </Button>
                {/* Add any additional actions here */}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CandidateProfile;
