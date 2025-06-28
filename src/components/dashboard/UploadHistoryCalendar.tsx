
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { CVUpload } from '@/types/candidate';
import { format, isSameDay, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, addDays } from 'date-fns';

interface UploadHistoryCalendarProps {
  uploads: CVUpload[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export const UploadHistoryCalendar = ({ uploads, onDateSelect, selectedDate }: UploadHistoryCalendarProps) => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 0 })); // 0 = Sunday

  // Get upload count for a specific date
  const getUploadCountForDate = (date: Date) => {
    return uploads.filter(upload => {
      const uploadDate = new Date(upload.uploaded_at);
      return isSameDay(uploadDate, date);
    }).length;
  };

  // Get all days in the current week
  const getWeekDays = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: weekStart, end: weekEnd }).map(date => ({
      date,
      count: getUploadCountForDate(date)
    }));
  };

  // Get total uploads for the current week
  const getTotalUploadsThisWeek = () => {
    const weekDays = getWeekDays();
    return weekDays.reduce((sum, day) => sum + day.count, 0);
  };

  const weekDays = getWeekDays();
  const totalUploadsThisWeek = getTotalUploadsThisWeek();

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
  };

  const navigateToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const navigateToPrevWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const isDaySelected = (date: Date) => {
    if (!selectedDate) return false;
    return isSameDay(date, selectedDate);
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });

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
            <div className="text-2xl font-bold text-brand-gradient">{totalUploadsThisWeek}</div>
            <div className="text-xs text-white/70">THIS WEEK</div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateToPrevWeek}
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-white font-medium px-4">
              {format(currentWeek, 'MMMM yyyy').toUpperCase()}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateToNextWeek}
              className="text-white hover:bg-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Week range display */}
      <div className="mb-4 text-center">
        <div className="text-white font-medium">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
        </div>
      </div>

      {/* Individual day tiles */}
      <div className="flex gap-3 justify-center">
        {weekDays.map(({ date, count }) => {
          const isSelected = isDaySelected(date);
          const dayName = format(date, 'EEE'); // Sun, Mon, Tue, etc.
          const dayNumber = format(date, 'd'); // 1, 2, 3, etc.
          
          return (
            <Button
              key={date.toISOString()}
              variant="ghost"
              onClick={() => handleDateSelect(date)}
              className={`flex flex-col items-center gap-2 p-4 rounded-lgx border transition-all min-w-[80px] ${
                isSelected 
                  ? 'bg-brand-gradient text-white border-brand shadow-lg' 
                  : 'glass border-brand/30 text-white hover:bg-brand/20'
              }`}
            >
              <div className="text-xs font-medium text-white/70 uppercase">
                {dayName}
              </div>
              <div className="text-lg font-bold">
                {dayNumber}
              </div>
              {count > 0 && (
                <Badge 
                  variant="secondary" 
                  className="text-xs px-2 py-1 bg-brand-gradient text-white border-0"
                >
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
