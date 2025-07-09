
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDeleteCandidate = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const deleteCandidate = async (candidateId: string, candidateName: string) => {
    console.log('Attempting to delete candidate:', candidateId, candidateName);
    setIsDeleting(true);
    
    try {
      // First get the candidate record to extract file URL
      const { data: candidate, error: fetchError } = await supabase
        .from('cv_uploads')
        .select('file_url')
        .eq('id', candidateId)
        .single();

      if (fetchError) {
        console.error('Error fetching candidate for deletion:', fetchError);
        throw fetchError;
      }

      console.log('Candidate data fetched:', candidate);

      // Delete file from storage if it exists
      if (candidate?.file_url) {
        try {
          console.log('Original file URL:', candidate.file_url);
          
          // Multiple methods to extract the file path
          let bucketName = '';
          let fileName = '';
          
          // Method 1: Try to parse as Supabase storage URL
          if (candidate.file_url.includes('/storage/v1/object/public/')) {
            const parts = candidate.file_url.split('/storage/v1/object/public/')[1];
            const pathParts = parts.split('/');
            bucketName = pathParts[0];
            fileName = pathParts.slice(1).join('/');
          }
          // Method 2: Try to parse as signed URL
          else if (candidate.file_url.includes('/storage/v1/object/sign/')) {
            const parts = candidate.file_url.split('/storage/v1/object/sign/')[1];
            const pathParts = parts.split('/');
            bucketName = pathParts[0];
            fileName = pathParts.slice(1).join('/').split('?')[0]; // Remove query params
          }
          // Method 3: Generic URL parsing
          else {
            const url = new URL(candidate.file_url);
            const pathParts = url.pathname.split('/').filter(part => part);
            if (pathParts.length >= 2) {
              bucketName = pathParts[pathParts.length - 2];
              fileName = pathParts[pathParts.length - 1];
            }
          }
          
          console.log('Parsed storage info:', { bucketName, fileName });
          
          if (bucketName && fileName) {
            // Try both possible bucket names
            const possibleBuckets = [bucketName, 'cv-uploads', 'resumes'];
            let deletionSuccessful = false;
            
            for (const bucket of possibleBuckets) {
              console.log(`Attempting to delete from bucket: ${bucket}, file: ${fileName}`);
              
              const { error: storageError } = await supabase.storage
                .from(bucket)
                .remove([fileName]);

              if (!storageError) {
                console.log(`Successfully deleted file from bucket: ${bucket}`);
                deletionSuccessful = true;
                break;
              } else {
                console.log(`Failed to delete from bucket ${bucket}:`, storageError);
              }
            }
            
            if (!deletionSuccessful) {
              console.warn('Failed to delete file from any bucket, continuing with database deletion');
            }
          } else {
            console.warn('Could not parse bucket and file name from URL:', candidate.file_url);
          }
        } catch (storageErr) {
          console.error('Error parsing file URL or deleting from storage:', storageErr);
          // Continue with database deletion even if storage fails
        }
      }

      // Delete database record
      console.log('Deleting database record for candidate:', candidateId);
      const { error: dbError } = await supabase
        .from('cv_uploads')
        .delete()
        .eq('id', candidateId);

      if (dbError) {
        console.error('Database delete error:', dbError);
        throw dbError;
      }

      console.log('Successfully deleted candidate from database:', candidateId);
      
      toast({
        title: "Candidate Deleted",
        description: `${candidateName} has been permanently removed from the database and storage`,
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting candidate:', error);
      toast({
        title: "Delete Failed",
        description: `Failed to delete ${candidateName}. Error: ${error.message}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteCandidate, isDeleting };
};
