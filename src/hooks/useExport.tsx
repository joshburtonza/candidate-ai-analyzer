
import { CVUpload, Resume } from '@/types/candidate';
import { useToast } from '@/hooks/use-toast';

export const useExport = () => {
  const { toast } = useToast();

  const exportToCSV = (uploads: Resume[], filename: string = 'candidates') => {
    try {
      // Filter for valid candidates
      const validUploads = uploads.filter(upload => 
        !upload.is_archived && 
        upload.email &&
        upload.name &&
        (upload.fit_score || 0) >= 5
      );

      if (validUploads.length === 0) {
        toast({
          title: "No Data to Export",
          description: "No qualified candidates found to export",
          variant: "destructive",
        });
        return;
      }

      const headers = [
        'Candidate Name',
        'Email',
        'Phone',
        'Countries',
        'Skills',
        'Education',
        'Experience',
        'Score',
        'Uploaded At',
        'Justification'
      ];

      const csvContent = [
        headers.join(','),
        ...validUploads.map(upload => {
          return [
            `"${upload.name || ''}"`,
            `"${upload.email || ''}"`,
            `"${upload.phone || ''}"`,
            `"${upload.nationality || upload.location || ''}"`,
            `"${upload.skills?.join(', ') || ''}"`,
            `"${upload.education_level || ''}"`,
            `"${upload.experience_years || ''}"`,
            upload.fit_score || '0',
            new Date(upload.created_at).toLocaleDateString(),
            `"${upload.justification || ''}"`
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Exported ${validUploads.length} qualified candidates to CSV`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export candidate data",
        variant: "destructive",
      });
    }
  };

  return { exportToCSV };
};
