
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
      const { error } = await supabase
        .from('cv_uploads')
        .delete()
        .eq('id', candidateId);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      console.log('Successfully deleted candidate:', candidateId);
      
      toast({
        title: "Candidate Deleted",
        description: `${candidateName} has been permanently removed from the database`,
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
