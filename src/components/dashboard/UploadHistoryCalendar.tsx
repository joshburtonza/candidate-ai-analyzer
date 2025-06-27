
import { useState, useEffect } from 'react';
import { CVUpload } from '@/types/candidate';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';

interface UploadHistoryCalendarProps {
  uploads: CVUpload[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export const UploadHistoryCalendar = ({ uploads, onDateSelect, selectedDate }: UploadHistoryCalendarProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));

  // Get upload counts by date
  const getUploadCountForDate = (date: Date) => {
    return uploads.filter(upload => 
      isSameDay(new Date(upload.uploaded_at), date)
    ).length;
  };

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  return (
    <Card className="glass-card elegant-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white text-elegant tracking-wider">UPLOAD HISTORY</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousWeek}
            className="text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextWeek}
            className="text-white hover:bg-white/10"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((date, index) => {
          const uploadCount = getUploadCountForDate(date);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());

          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                onClick={() => onDateSelect(date)}
                className={`
                  h-16 w-full flex flex-col items-center justify-center p-2 rounded-lg border transition-all
                  ${isSelected 
                    ? 'bg-orange-500 text-white border-orange-400' 
                    : uploadCount > 0 
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30' 
                      : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                  }
                  ${isToday ? 'ring-2 ring-orange-400/50' : ''}
                `}
              >
                <div className="text-xs font-medium">
                  {format(date, 'EEE').toUpperCase()}
                </div>
                <div className="text-lg font-bold">
                  {format(date, 'd')}
                </div>
                {uploadCount > 0 && (
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-1"></div>
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-white/60 text-sm mt-4">
        Click on a day to filter candidates by upload date
      </p>
    </Card>
  );
};
