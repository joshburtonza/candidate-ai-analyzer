
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

      // Delete file from storage if it exists
      if (candidate?.file_url) {
        try {
          // Extract file path from URL - remove the base URL part
          const url = new URL(candidate.file_url);
          const pathParts = url.pathname.split('/');
          const bucketName = pathParts[pathParts.length - 2]; // e.g., 'cv-uploads' or 'resumes'
          const fileName = pathParts[pathParts.length - 1];
          
          console.log('Deleting file from storage:', bucketName, fileName);
          
          const { error: storageError } = await supabase.storage
            .from(bucketName)
            .remove([fileName]);

          if (storageError) {
            console.error('Storage deletion error:', storageError);
            // Continue with database deletion even if storage fails
          } else {
            console.log('Successfully deleted file from storage');
          }
        } catch (storageErr) {
          console.error('Error parsing file URL or deleting from storage:', storageErr);
          // Continue with database deletion
        }
      }

      // Delete database record
      const { error: dbError } = await supabase
        .from('cv_uploads')
        .delete()
        .eq('id', candidateId);

      if (dbError) {
        console.error('Database delete error:', dbError);
        throw dbError;
      }

      console.log('Successfully deleted candidate:', candidateId);
      
      toast({
        title: "Candidate Deleted",
        description: `${candidateName} has been permanently removed from the database and storage`,
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting candidate:', error);
      toast({
        title: "Delete Failed",
        description: `Failed to delete ${candidateName}. Please try again.`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteCandidate, isDeleting };
};
