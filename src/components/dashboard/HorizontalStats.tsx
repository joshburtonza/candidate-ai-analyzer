
import React, { useMemo } from 'react';
import { CVUpload } from '@/types/candidate';
import { getEffectiveDateString, formatDateForDB } from '@/utils/dateUtils';

interface HorizontalStatsProps {
  uploads: CVUpload[];
}

const HorizontalStats: React.FC<HorizontalStatsProps> = ({ uploads }) => {
  const stats = useMemo(() => {
const todayStr = formatDateForDB(new Date());
const todayUploads = uploads.filter(upload => getEffectiveDateString(upload) === todayStr);
    
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
    <div style={{ backgroundColor: '#2d3e50' }} className="border border-gray-600/30 rounded-2xl p-6">
      <div className="flex items-center justify-center gap-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">All Uploads:</span>
          <span className="font-semibold text-white">{stats.total}</span>
        </div>
        <div className="h-4 w-px bg-gray-600"></div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Processed:</span>
          <span className="font-semibold text-white">{stats.processed}</span>
        </div>
        <div className="h-4 w-px bg-gray-600"></div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Uploaded Today:</span>
          <span className="font-semibold text-white">{stats.uploadedToday}</span>
        </div>
      </div>
    </div>
  );
};

export default HorizontalStats;
