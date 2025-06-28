
import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { CVUpload } from '@/types/candidate';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface UploadHistoryCalendarProps {
  uploads: CVUpload[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export const UploadHistoryCalendar = ({ uploads, onDateSelect, selectedDate }: UploadHistoryCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get upload counts for each day of the current month
  const getUploadCountForDate = (date: Date) => {
    return uploads.filter(upload => 
      isSameDay(new Date(upload.uploaded_at), date)
    ).length;
  };

  // Get days with uploads for the current month
  const getDaysWithUploads = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => ({
      date: day,
      count: getUploadCountForDate(day)
    })).filter(day => day.count > 0);
  };

  const daysWithUploads = getDaysWithUploads();
  const totalUploadsThisMonth = daysWithUploads.reduce((sum, day) => sum + day.count, 0);

  return (
    <div className="glass p-6 rounded-lgx">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-gradient rounded-lg">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">QUALIFIED CANDIDATES</h2>
            <p className="text-sm text-white/70">Click on a day to filter candidates by upload date • Shows qualified candidates only</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-brand-gradient">{totalUploadsThisMonth}</div>
            <div className="text-xs text-white/70">THIS MONTH</div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-white font-medium px-4">
              {format(currentDate, 'MMMM yyyy').toUpperCase()}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="text-white hover:bg-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
          <div key={day} className="text-center p-2">
            <div className="text-xs font-medium text-white/60">{day}</div>
          </div>
        ))}
        
        {/* Calendar days */}
        {eachDayOfInterval({ 
          start: startOfMonth(currentDate), 
          end: endOfMonth(currentDate) 
        }).map(day => {
          const uploadCount = getUploadCountForDate(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const hasUploads = uploadCount > 0;
          
          return (
            <div key={day.toISOString()} className="aspect-square">
              <Button
                variant="ghost"
                onClick={() => onDateSelect(day)}
                className={`w-full h-full p-1 rounded-lgx border transition-all ${
                  isSelected 
                    ? 'bg-brand-gradient text-white border-brand shadow-lg' 
                    : hasUploads
                    ? 'glass border-brand/30 text-white hover:bg-brand/20'
                    : 'border-white/10 text-white/40 hover:bg-white/5'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-lg font-medium">
                    {format(day, 'd')}
                  </span>
                  {hasUploads && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs px-1 py-0 bg-brand-gradient text-white border-0"
                    >
                      {uploadCount}
                    </Badge>
                  )}
                </div>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
