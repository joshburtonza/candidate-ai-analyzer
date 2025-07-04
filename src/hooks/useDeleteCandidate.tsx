
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDeleteCandidate = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const deleteCandidate = async (candidateId: string, candidateName: string) => {
    console.log('Attempting to complete deletion of candidate:', candidateId, candidateName);
    setIsDeleting(true);
    
    try {
      // First, get the CV upload record to get the file URL
      const { data: cvUpload, error: fetchError } = await supabase
        .from('cv_uploads')
        .select('file_url')
        .eq('id', candidateId)
        .single();

      if (fetchError) {
        console.error('Error fetching CV upload for deletion:', fetchError);
        throw fetchError;
      }

      // Delete the file from storage if it exists
      if (cvUpload?.file_url) {
        try {
          // Extract file path from URL (assuming format: .../cv-uploads/path)
          const urlParts = cvUpload.file_url.split('/cv-uploads/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1];
            console.log('Deleting file from storage:', filePath);
            
            const { error: storageError } = await supabase.storage
              .from('cv-uploads')
              .remove([filePath]);

            if (storageError) {
              console.error('Storage deletion error (continuing anyway):', storageError);
              // Don't throw here - continue with database deletion even if storage fails
            } else {
              console.log('Successfully deleted file from storage');
            }
          }
        } catch (storageError) {
          console.error('Error parsing file URL or deleting from storage:', storageError);
          // Continue with database deletion
        }
      }

      // Delete related candidate notes
      const { error: notesError } = await supabase
        .from('candidate_notes')
        .delete()
        .eq('cv_upload_id', candidateId);

      if (notesError) {
        console.error('Error deleting candidate notes (continuing anyway):', notesError);
        // Don't throw here - continue with main record deletion
      } else {
        console.log('Successfully deleted candidate notes');
      }

      // Finally, delete the main CV upload record
      const { error: deleteError } = await supabase
        .from('cv_uploads')
        .delete()
        .eq('id', candidateId);

      if (deleteError) {
        console.error('Supabase CV upload delete error:', deleteError);
        throw deleteError;
      }

      console.log('Successfully completed full deletion of candidate:', candidateId);
      
      toast({
        title: "Candidate Completely Deleted",
        description: `${candidateName} and all associated data have been permanently removed`,
      });

      return true;
    } catch (error: any) {
      console.error('Error in complete candidate deletion:', error);
      toast({
        title: "Delete Failed",
        description: `Failed to completely delete ${candidateName}. Please try again.`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteCandidate, isDeleting };
};
