
import { CVUpload } from '@/types/candidate';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

interface UploadHistoryProps {
  uploads: CVUpload[];
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
}

export const UploadHistory = ({ uploads, onDateSelect, selectedDate }: UploadHistoryProps) => {
  // Get the current week starting from Monday
  const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));

  // Count uploads for each day
  const getUploadsForDate = (date: Date) => {
    return uploads.filter(upload => 
      isSameDay(new Date(upload.uploaded_at), date)
    ).length;
  };

  const getDayName = (date: Date) => format(date, 'EEE');
  const getDayNumber = (date: Date) => format(date, 'd');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
    >
      <Card className="glass-card p-6 elegant-border">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5 gold-accent" />
          <h3 className="text-lg font-semibold text-white text-elegant tracking-wider">
            UPLOAD HISTORY
          </h3>
        </div>
        
        <div className="grid grid-cols-7 gap-3">
          {weekDays.map((date, index) => {
            const uploadCount = getUploadsForDate(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`
                  relative p-4 rounded-lg border cursor-pointer transition-all duration-300
                  ${isSelected 
                    ? 'bg-orange-500/20 border-orange-500/50 shadow-lg' 
                    : 'bg-gray-800/50 border-gray-600/50 hover:bg-gray-700/50'
                  }
                  ${isToday ? 'ring-2 ring-orange-500/30' : ''}
                `}
                onClick={() => onDateSelect?.(date)}
              >
                <div className="text-center">
                  <div className="text-xs text-gray-400 font-medium mb-1">
                    {getDayName(date)}
                  </div>
                  <div className="text-2xl font-bold text-white mb-2">
                    {getDayNumber(date)}
                  </div>
                  {uploadCount > 0 && (
                    <div className="inline-flex items-center justify-center w-6 h-6 bg-orange-500 text-black text-xs font-bold rounded-full">
                      {uploadCount}
                    </div>
                  )}
                  {uploadCount === 0 && (
                    <div className="w-6 h-6" />
                  )}
                </div>
                
                {isToday && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                )}
              </motion.div>
            );
          })}
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-400">
          Click on a day to filter candidates by upload date
        </div>
      </Card>
    </motion.div>
  );
};
