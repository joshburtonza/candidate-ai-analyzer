
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CVUpload, CandidateData } from '@/types/candidate';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface SimpleUploadSectionProps {
  onUploadComplete: (upload: CVUpload) => void;
}

interface UploadFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  uploadId?: string;
  error?: string;
}

export const SimpleUploadSection = ({ onUploadComplete }: SimpleUploadSectionProps) => {
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
    if (!user) return;

    try {
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

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

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

      if (dbError) throw new Error(`Database error: ${dbError.message}`);

      const typedCvUpload: CVUpload = {
        ...cvUpload,
        extracted_json: cvUpload.extracted_json as unknown as CandidateData | null,
        processing_status: cvUpload.processing_status as 'pending' | 'processing' | 'completed' | 'error'
      };

      setUploadFiles(prev => prev.map(f => 
        f.file === uploadFile.file ? { 
          ...f, 
          uploadId: typedCvUpload.id, 
          progress: 70, 
          status: 'processing' 
        } : f
      ));

      // File uploaded successfully - N8N system will handle processing
      setUploadFiles(prev => prev.map(f => 
        f.file === uploadFile.file ? { 
          ...f, 
          progress: 100, 
          status: 'completed' 
        } : f
      ));

      onUploadComplete(typedCvUpload);

      toast({
        title: "Upload Complete",
        description: `${uploadFile.file.name} has been uploaded and will be processed by your N8N workflow`,
      });

      // Remove completed file after delay
      setTimeout(() => {
        setUploadFiles(prev => prev.filter(f => f.file !== uploadFile.file));
      }, 5000);

    } catch (error: any) {
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
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <FileText className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <div>
            <p className="text-lg font-medium text-foreground mb-2">
              {isDragActive ? 'Drop CV files here' : 'Drop CV files here'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop your CV files or click to browse
            </p>
            <Button 
              type="button"
              disabled={!user}
            >
              Browse Files
            </Button>
          </div>
        </div>
      </div>

      {uploadFiles.length > 0 && (
        <div className="space-y-3">
          {uploadFiles.map((uploadFile, index) => (
            <div key={index} className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getStatusIcon(uploadFile.status)}
                  <span className="text-foreground font-medium truncate">
                    {uploadFile.file.name}
                  </span>
                </div>
                <Badge variant="secondary">
                  {uploadFile.status.toUpperCase()}
                </Badge>
              </div>
              
              {uploadFile.status !== 'error' && (
                <Progress value={uploadFile.progress} className="h-2" />
              )}
              
              {uploadFile.error && (
                <p className="text-destructive text-sm mt-2">{uploadFile.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
