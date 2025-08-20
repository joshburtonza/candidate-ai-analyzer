
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
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl rounded-2xl"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 via-transparent to-slate-500/5 rounded-2xl"></div>
      
      <div className="relative z-10 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-white/60">All Uploads:</span>
            <span className="font-semibold text-white">{stats.total}</span>
          </div>
          <div className="h-4 w-px bg-white/20"></div>
          <div className="flex items-center gap-2">
            <span className="text-white/60">Processed:</span>
            <span className="font-semibold text-white">{stats.processed}</span>
          </div>
          <div className="h-4 w-px bg-white/20"></div>
          <div className="flex items-center gap-2">
            <span className="text-white/60">Uploaded Today:</span>
            <span className="font-semibold text-white">{stats.uploadedToday}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HorizontalStats;
