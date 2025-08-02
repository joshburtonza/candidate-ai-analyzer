
import { CVUpload } from '@/types/candidate';
import { useToast } from '@/hooks/use-toast';

export const useExport = () => {
  const { toast } = useToast();

  const exportToCSV = (uploads: CVUpload[], filename: string = 'candidates') => {
    try {
      // Filter for valid candidates
      const validUploads = uploads.filter(upload => 
        upload.processing_status === 'completed' && 
        upload.extracted_json &&
        upload.extracted_json.candidate_name &&
        upload.extracted_json.contact_number &&
        upload.extracted_json.email_address &&
        upload.extracted_json.countries &&
        upload.extracted_json.current_employment &&
        upload.extracted_json.educational_qualifications &&
        upload.extracted_json.job_history &&
        upload.extracted_json.justification &&
        parseFloat(upload.extracted_json.score || '0') >= 5
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
        'Current Employment',
        'Education',
        'Experience',
        'Score',
        'Uploaded At',
        'Justification'
      ];

      const csvContent = [
        headers.join(','),
        ...validUploads.map(upload => {
          const data = upload.extracted_json!;
          return [
            `"${data.candidate_name || ''}"`,
            `"${data.email_address || ''}"`,
            `"${data.contact_number || ''}"`,
            `"${data.countries || ''}"`,
            `"${data.current_employment || ''}"`,
            `"${data.educational_qualifications || ''}"`,
            `"${data.job_history || ''}"`,
            data.score || '0',
            (() => {
              const uploadDate = upload.received_date ? new Date(upload.received_date) : upload.extracted_json?.date_received ? new Date(upload.extracted_json.date_received) : new Date();
              return uploadDate.toLocaleDateString();
            })(),
            `"${data.justification || ''}"`
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
