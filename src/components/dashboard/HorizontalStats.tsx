
import React, { useMemo } from 'react';
import { CVUpload } from '@/types/candidate';
import { isSameDay } from 'date-fns';

interface HorizontalStatsProps {
  uploads: CVUpload[];
}

const HorizontalStats: React.FC<HorizontalStatsProps> = ({ uploads }) => {
  const stats = useMemo(() => {
    const today = new Date();
    const todayUploads = uploads.filter(upload => {
      const uploadDate = new Date(upload.uploaded_at);
      return isSameDay(uploadDate, today);
    });
    
    const processedUploads = uploads.filter(upload => 
      upload.processing_status === 'completed' && upload.extracted_json
    );
    
    return {
      total: uploads.length,
      processed: processedUploads.length,
      uploadedToday: todayUploads.length
    };
  }, [uploads]);

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center justify-center gap-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">All Uploads:</span>
          <span className="font-semibold text-foreground">{stats.total}</span>
        </div>
        <div className="h-4 w-px bg-border"></div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Processed:</span>
          <span className="font-semibold text-foreground">{stats.processed}</span>
        </div>
        <div className="h-4 w-px bg-border"></div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Uploaded Today:</span>
          <span className="font-semibold text-foreground">{stats.uploadedToday}</span>
        </div>
      </div>
    </div>
  );
};

export default HorizontalStats;
