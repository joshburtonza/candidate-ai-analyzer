
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface BatchUploadDialogProps {
  onBatchComplete: (batchId: string) => void;
}

export const BatchUploadDialog = ({ onBatchComplete }: BatchUploadDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const { user } = useAuth();
  const { toast } = useToast();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true,
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
    },
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleBatchUpload = async () => {
    if (!user || !batchName.trim() || files.length === 0) {
      toast({
        title: "Error",
        description: "Please provide a batch name and select files",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setProgress(0);
    setUploadResults({ success: 0, failed: 0 });

    try {
      // Create batch record
      const { data: batch, error: batchError } = await supabase
        .from('batch_uploads')
        .insert({
          batch_name: batchName,
          total_files: files.length,
          status: 'processing',
        })
        .select()
        .single();

      if (batchError) throw batchError;

      let successCount = 0;
      let failedCount = 0;

      // Upload files one by one
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          // Upload to storage
          const fileName = `${user.id}/${Date.now()}-${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('cv-uploads')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('cv-uploads')
            .getPublicUrl(fileName);

          // Create CV upload record
          const { error: cvError } = await supabase
            .from('cv_uploads')
            .insert({
              file_url: publicUrl,
              original_filename: file.name,
              file_size: file.size,
              batch_id: batch.id,
              processing_status: 'pending',
            });

          if (cvError) throw cvError;

          successCount++;
          setUploadResults({ success: successCount, failed: failedCount });
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          failedCount++;
          setUploadResults({ success: successCount, failed: failedCount });
        }

        setProgress(((i + 1) / files.length) * 100);
      }

      // Update batch status
      await supabase
        .from('batch_uploads')
        .update({
          processed_files: successCount,
          failed_files: failedCount,
          status: failedCount === 0 ? 'completed' : 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', batch.id);

      toast({
        title: "Batch upload completed",
        description: `${successCount} files uploaded successfully, ${failedCount} failed`,
      });

      onBatchComplete(batch.id);
      
      // Reset form
      setBatchName('');
      setFiles([]);
      setIsOpen(false);
    } catch (error: any) {
      console.error('Batch upload error:', error);
      toast({
        title: "Batch upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-500 hover:bg-orange-600 text-black font-semibold">
          <Upload className="w-4 h-4 mr-2" />
          Batch Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Batch Upload CVs</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="batchName" className="text-white">Batch Name</Label>
            <Input
              id="batchName"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="e.g., Software Engineers Q1 2024"
              className="bg-gray-800 border-gray-600 text-white mt-2"
              disabled={uploading}
            />
          </div>

          <div>
            <Label className="text-white">Files</Label>
            <div
              {...getRootProps()}
              className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-white">Drop the files here...</p>
              ) : (
                <div>
                  <p className="text-white mb-2">Drag & drop CV files here, or click to select</p>
                  <p className="text-gray-400 text-sm">Supports PDF, DOC, and DOCX files</p>
                </div>
              )}
            </div>
          </div>

          {files.length > 0 && (
            <div>
              <Label className="text-white">Selected Files ({files.length})</Label>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-white text-sm font-medium">{file.name}</p>
                        <p className="text-gray-400 text-xs">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    {!uploading && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white">Upload Progress</span>
                  <span className="text-gray-400">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              <div className="flex justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-white">Success: {uploadResults.success}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-white">Failed: {uploadResults.failed}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={uploading}
              className="border-gray-600 text-gray-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBatchUpload}
              disabled={uploading || !batchName.trim() || files.length === 0}
              className="bg-orange-500 hover:bg-orange-600 text-black font-semibold"
            >
              {uploading ? 'Uploading...' : `Upload ${files.length} Files`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
