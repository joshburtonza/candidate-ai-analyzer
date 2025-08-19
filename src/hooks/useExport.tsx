
import { CVUpload } from '@/types/candidate';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Type declaration for jsPDF autoTable plugin
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

export const useExport = () => {
  const { toast } = useToast();

  const exportCandidates = (uploads: CVUpload[], options: { format: 'csv' | 'pdf'; filenameBase: string }) => {
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

      if (options.format === 'csv') {
        exportToCSVFormat(validUploads, options.filenameBase);
      } else if (options.format === 'pdf') {
        exportToPDFFormat(validUploads, options.filenameBase);
      }

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export candidate data",
        variant: "destructive",
      });
    }
  };

  const exportToCSVFormat = (validUploads: CVUpload[], filename: string) => {
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
      'Source Email',
      'File Name',
      'File Size (KB)',
      'Processing Status',
      'Justification'
    ];

    const csvContent = [
      '\uFEFF' + headers.join(','), // UTF-8 BOM for proper Excel encoding
      ...validUploads.map(upload => {
        const data = upload.extracted_json!;
        return [
          `"${(data.candidate_name || '').replace(/"/g, '""')}"`,
          `"${(data.email_address || '').replace(/"/g, '""')}"`,
          `"${(data.contact_number || '').replace(/"/g, '""')}"`,
          `"${(data.countries || '').replace(/"/g, '""')}"`,
          `"${(data.current_employment || '').replace(/"/g, '""')}"`,
          `"${(data.educational_qualifications || '').replace(/"/g, '""')}"`,
          `"${(data.job_history || '').replace(/"/g, '""')}"`,
          data.score || '0',
          (() => {
            const uploadDate = upload.received_date ? new Date(upload.received_date) : upload.extracted_json?.date_received ? new Date(upload.extracted_json.date_received) : new Date();
            return uploadDate.toLocaleDateString();
          })(),
          `"${(upload.source_email || '').replace(/"/g, '""')}"`,
          `"${(upload.original_filename || '').replace(/"/g, '""')}"`,
          Math.round((upload.file_size || 0) / 1024),
          upload.processing_status || 'unknown',
          `"${(data.justification || '').replace(/"/g, '""')}"`.replace(/\n/g, ' ')
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);

    toast({
      title: "CSV Export Successful",
      description: `Exported ${validUploads.length} qualified candidates to CSV`,
    });
  };

  const exportToPDFFormat = (validUploads: CVUpload[], filename: string) => {
    const doc = new jsPDF('landscape', 'pt', 'a4');
    
    const tableData = validUploads.map(upload => {
      const data = upload.extracted_json!;
      const uploadDate = upload.received_date ? new Date(upload.received_date) : upload.extracted_json?.date_received ? new Date(upload.extracted_json.date_received) : new Date();
      
      return [
        data.candidate_name || '',
        data.email_address || '',
        data.contact_number || '',
        data.countries || '',
        (data.current_employment || '').substring(0, 40) + (data.current_employment?.length > 40 ? '...' : ''),
        (data.educational_qualifications || '').substring(0, 40) + (data.educational_qualifications?.length > 40 ? '...' : ''),
        data.score || '0',
        uploadDate.toLocaleDateString(),
        upload.processing_status || 'unknown'
      ];
    });

    const headers = [
      'Name', 'Email', 'Phone', 'Countries', 'Employment', 'Education', 'Score', 'Date', 'Status'
    ];

    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 60,
      styles: { 
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        columnWidth: 'wrap'
      },
      headStyles: { 
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { columnWidth: 80 },  // Name
        1: { columnWidth: 100 }, // Email
        2: { columnWidth: 70 },  // Phone
        3: { columnWidth: 60 },  // Countries
        4: { columnWidth: 120 }, // Employment
        5: { columnWidth: 120 }, // Education
        6: { columnWidth: 40 },  // Score
        7: { columnWidth: 60 },  // Date
        8: { columnWidth: 60 }   // Status
      },
      margin: { top: 60, right: 20, bottom: 20, left: 20 }
    });

    // Add title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Candidate Export Report', 40, 40);
    
    // Add export info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Total: ${validUploads.length} candidates`, 40, 55);

    const pdfBlob = new Blob([doc.output('blob')], { type: 'application/pdf' });
    downloadFile(pdfBlob, `${filename}_${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "PDF Export Successful",
      description: `Exported ${validUploads.length} qualified candidates to PDF`,
    });
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Backward compatibility
  const exportToCSV = (uploads: CVUpload[], filename: string = 'candidates') => {
    exportCandidates(uploads, { format: 'csv', filenameBase: filename });
  };

  return { exportToCSV, exportCandidates };
};
