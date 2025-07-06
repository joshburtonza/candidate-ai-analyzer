
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CVUpload, CandidateData } from '@/types/candidate';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { GoogleDocUpload } from './GoogleDocUpload';

interface UploadSectionProps {
  onUploadComplete: (upload: CVUpload) => void;
}

interface UploadFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  uploadId?: string;
  error?: string;
}

export const UploadSection = ({ onUploadComplete }: UploadSectionProps) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload files",
        variant: "destructive"
      });
      return;
    }

    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadFiles(prev => [...prev, ...newFiles]);

    for (let i = 0; i < newFiles.length; i++) {
      const uploadFile = newFiles[i];
      await processFile(uploadFile);
    }
  }, [user, toast]);

  const processFile = async (uploadFile: UploadFile) => {
    if (!user) {
      console.error('No authenticated user for file upload');
      return;
    }

    try {
      console.log('Starting file upload process for:', uploadFile.file.name);
      
      // Update progress for upload start
      setUploadFiles(prev => prev.map(f => 
        f.file === uploadFile.file ? { ...f, progress: 10 } : f
      ));

      // Generate unique file path
      const fileExt = uploadFile.file.name.split('.').pop();
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileName = `${user.id}/${timestamp}_${randomId}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cv-uploads')
        .upload(fileName, uploadFile.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('File uploaded to storage:', uploadData?.path);

      // Update progress
      setUploadFiles(prev => prev.map(f => 
        f.file === uploadFile.file ? { ...f, progress: 40 } : f
      ));

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('cv-uploads')
        .getPublicUrl(fileName);

      // Create database record
      const cvUploadData = {
        user_id: user.id,
        original_filename: uploadFile.file.name,
        file_url: publicUrl,
        file_size: uploadFile.file.size,
        processing_status: 'pending' as const,
        uploaded_at: new Date().toISOString()
      };

      const { data: cvUpload, error: dbError } = await supabase
        .from('cv_uploads')
        .insert(cvUploadData)
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log('Database record created:', cvUpload.id);

      // Convert the database response to match our CVUpload interface
      const typedCvUpload: CVUpload = {
        ...cvUpload,
        extracted_json: cvUpload.extracted_json as unknown as CandidateData | null,
        processing_status: cvUpload.processing_status as 'pending' | 'processing' | 'completed' | 'error'
      };

      // Update with upload ID and processing status
      setUploadFiles(prev => prev.map(f => 
        f.file === uploadFile.file ? { 
          ...f, 
          uploadId: typedCvUpload.id, 
          progress: 70, 
          status: 'processing' 
        } : f
      ));

      // Simulate processing (in real app, this would trigger edge function)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update progress to completion
      setUploadFiles(prev => prev.map(f => 
        f.file === uploadFile.file ? { 
          ...f, 
          progress: 100, 
          status: 'completed' 
        } : f
      ));

      // Notify parent component with properly typed upload
      onUploadComplete(typedCvUpload);

      // Remove completed file after delay
      setTimeout(() => {
        setUploadFiles(prev => prev.filter(f => f.file !== uploadFile.file));
      }, 3000);

      toast({
        title: "Upload Successful",
        description: `${uploadFile.file.name} has been uploaded successfully`,
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      
      setUploadFiles(prev => prev.map(f => 
        f.file === uploadFile.file ? { 
          ...f, 
          status: 'error', 
          error: error.message 
        } : f
      ));

      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive"
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true,
    disabled: !user
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'processing':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <FileText className="w-4 h-4 text-blue-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'processing':
        return 'text-yellow-400';
      default:
        return 'text-blue-400';
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl rounded-2xl"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 via-transparent to-slate-500/5 rounded-2xl"></div>
      
      {/* Content */}
      <div className="relative z-10 p-8 border border-white/10 rounded-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-gradient rounded-xl blur-lg opacity-50"></div>
              <div className="relative p-3 bg-brand-gradient rounded-xl">
                <Upload className="w-8 h-8 text-slate-800" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-wider">UPLOAD CV FILES</h2>
          <p className="text-gray-400">Add candidate CVs for elite AI analysis and scoring</p>
          {!user && (
            <p className="text-red-400 text-sm mt-2">Please log in to upload files</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Direct Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-500/10 rounded-xl border border-slate-500/20">
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-white tracking-wider">DIRECT UPLOAD</h3>
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 hover:scale-105 ${
                isDragActive
                  ? 'border-slate-400 bg-slate-500/10'
                  : 'border-white/20 hover:border-slate-400/50 hover:bg-slate-500/5'
              } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-brand-gradient rounded-xl blur-lg opacity-30"></div>
                  <div className="relative p-4 bg-slate-500/10 rounded-xl border border-slate-500/20">
                    <Upload className="w-8 h-8 text-slate-400" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-medium text-white mb-2">
                    {isDragActive ? 'Drop CV files here' : 'Drop CV files here'}
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    Drag and drop your CV files or click to browse
                  </p>
                  <Button 
                    className="bg-brand-gradient hover:opacity-90 text-slate-800 font-semibold rounded-xl shadow-lg shadow-slate-400/25"
                    type="button"
                    disabled={!user}
                  >
                    Browse Files
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Google Integration */}
          <div className="space-y-4">
            <GoogleDocUpload onUploadComplete={onUploadComplete} />
          </div>
        </div>

        {/* Upload Progress */}
        {uploadFiles.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-500/10 rounded-xl border border-slate-500/20">
                <Users className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-white tracking-wider">PROCESSING FILES</h3>
            </div>
            
            <div className="space-y-3">
              {uploadFiles.map((uploadFile, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(uploadFile.status)}
                      <span className="text-white font-medium truncate">
                        {uploadFile.file.name}
                      </span>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(uploadFile.status)} border-current/30 rounded-xl`}
                    >
                      {uploadFile.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {uploadFile.status !== 'error' && (
                    <Progress value={uploadFile.progress} className="h-2" />
                  )}
                  
                  {uploadFile.error && (
                    <p className="text-red-400 text-sm mt-2">{uploadFile.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
