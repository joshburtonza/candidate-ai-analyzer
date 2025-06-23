
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CVUpload } from '@/types/candidate';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadSectionProps {
  onUploadComplete: (upload: CVUpload) => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  id: string;
  error?: string;
}

export const UploadSection = ({ onUploadComplete }: UploadSectionProps) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) return;

    const newUploads = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
      id: Math.random().toString(36).substr(2, 9),
    }));

    setUploadingFiles(prev => [...prev, ...newUploads]);

    for (const uploadFile of newUploads) {
      try {
        // Update status to uploading
        setUploadingFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, progress: 10 } : f
        ));

        // Upload file to Supabase storage
        const fileName = `${user.id}/${Date.now()}_${uploadFile.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('cv-uploads')
          .upload(fileName, uploadFile.file);

        if (uploadError) throw uploadError;

        // Get file URL
        const { data: urlData } = supabase.storage
          .from('cv-uploads')
          .getPublicUrl(fileName);

        setUploadingFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, progress: 30 } : f
        ));

        // Create database record
        const { data: dbData, error: dbError } = await supabase
          .from('cv_uploads')
          .insert({
            user_id: user.id,
            file_url: urlData.publicUrl,
            original_filename: uploadFile.file.name,
            file_size: uploadFile.file.size,
            processing_status: 'processing',
          })
          .select()
          .single();

        if (dbError) throw dbError;

        setUploadingFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, progress: 50, status: 'processing' } : f
        ));

        // Call edge function to process CV with OpenAI
        const { data: processResult, error: processError } = await supabase.functions.invoke('process-cv', {
          body: {
            fileUrl: urlData.publicUrl,
            uploadId: dbData.id
          }
        });

        if (processError) throw processError;

        // Fetch the updated record
        const { data: updatedData, error: fetchError } = await supabase
          .from('cv_uploads')
          .select('*')
          .eq('id', dbData.id)
          .single();

        if (fetchError) throw fetchError;

        setUploadingFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, progress: 100, status: 'completed' } : f
        ));

        // Cast the database response to our CVUpload type
        const typedUpload: CVUpload = {
          ...updatedData,
          extracted_json: updatedData.extracted_json as any,
          processing_status: updatedData.processing_status as 'pending' | 'processing' | 'completed' | 'error'
        };

        onUploadComplete(typedUpload);

        toast({
          title: "CV processed successfully",
          description: `${uploadFile.file.name} has been analyzed`,
        });

        // Remove from uploading list after delay
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f.id !== uploadFile.id));
        }, 2000);

      } catch (error: any) {
        console.error('Upload error:', error);
        setUploadingFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: 'error', error: error.message } : f
        ));
        
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  }, [user, onUploadComplete, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB limit
  });

  const removeUpload = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? 'border-violet-400 bg-violet-500/10'
              : 'border-white/30 hover:border-violet-400 hover:bg-white/5'
          }`}
        >
          <input {...getInputProps()} />
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: isDragActive ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-violet-500 to-blue-500 rounded-2xl mb-6"
          >
            <Upload className="w-8 h-8 text-white" />
          </motion.div>
          
          {isDragActive ? (
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Drop files here</h3>
              <p className="text-slate-300">Release to upload your CV files</p>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Upload CV Files</h3>
              <p className="text-slate-300 mb-4">
                Drag and drop your files here, or click to browse
              </p>
              <p className="text-sm text-slate-400">
                Supports PDF, DOC, and DOCX files (max 10MB each)
              </p>
            </div>
          )}
        </div>
      </Card>

      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {uploadingFiles.map((upload) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-violet-500/20 rounded-lg">
                      <FileText className="w-5 h-5 text-violet-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {upload.file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={upload.progress} className="flex-1 h-2" />
                        <span className="text-xs text-slate-300">
                          {upload.progress}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {upload.status === 'uploading' && 'Uploading to storage...'}
                        {upload.status === 'processing' && 'Analyzing with AI...'}
                        {upload.status === 'completed' && 'Analysis completed'}
                        {upload.status === 'error' && `Error: ${upload.error || 'Unknown error'}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {upload.status === 'completed' && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                      {upload.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      )}
                      {(upload.status === 'error' || upload.status === 'completed') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUpload(upload.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
