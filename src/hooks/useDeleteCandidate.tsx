
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDeleteCandidate = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const deleteCandidate = async (candidateId: string, candidateName: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('cv_uploads')
        .delete()
        .eq('id', candidateId);

      if (error) throw error;

      toast({
        title: "Candidate Deleted",
        description: `${candidateName} has been permanently removed from the database`,
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting candidate:', error);
      toast({
        title: "Error",
        description: "Failed to delete candidate from database",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteCandidate, isDeleting };
};
