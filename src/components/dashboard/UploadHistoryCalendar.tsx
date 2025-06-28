
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { CVUpload } from '@/types/candidate';
import { format, isSameDay, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval } from 'date-fns';

interface UploadHistoryCalendarProps {
  uploads: CVUpload[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export const UploadHistoryCalendar = ({ uploads, onDateSelect, selectedDate }: UploadHistoryCalendarProps) => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));

  const getUploadCountForDate = (date: Date) => {
    return uploads.filter(upload => {
      const uploadDate = new Date(upload.uploaded_at);
      return isSameDay(uploadDate, date);
    }).length;
  };

  const getWeekDays = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: weekStart, end: weekEnd }).map(date => ({
      date,
      count: getUploadCountForDate(date)
    }));
  };

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
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl rounded-2xl"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/10 rounded-2xl"></div>
      
      {/* Content */}
      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl blur-lg opacity-50"></div>
              <div className="relative p-3 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                QUALIFIED CANDIDATES
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Click on a day to filter candidates • Shows qualified candidates only
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                {totalUploadsThisWeek}
              </div>
              <div className="text-xs text-gray-400 font-medium tracking-wider">
                THIS WEEK
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToPrevWeek}
                className="text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                <span className="text-white font-semibold tracking-wide">
                  {format(currentWeek, 'MMMM yyyy').toUpperCase()}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToNextWeek}
                className="text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Week range */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <span className="text-white font-medium">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
            </span>
          </div>
        </div>

        {/* Day tiles */}
        <div className="grid grid-cols-7 gap-3">
          {weekDays.map(({ date, count }) => {
            const isSelected = isDaySelected(date);
            const dayName = format(date, 'EEE');
            const dayNumber = format(date, 'd');
            const isToday = isSameDay(date, new Date());
            
            return (
              <Button
                key={date.toISOString()}
                variant="ghost"
                onClick={() => handleDateSelect(date)}
                className={`
                  relative flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all duration-300 min-h-[120px] group
                  ${isSelected 
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white border-orange-400 shadow-lg shadow-orange-500/25 scale-105' 
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 hover:scale-105'
                  }
                  ${isToday && !isSelected ? 'ring-2 ring-orange-400/50' : ''}
                `}
              >
                {/* Day name */}
                <div className={`text-xs font-semibold tracking-wider uppercase ${
                  isSelected ? 'text-white/90' : 'text-gray-400 group-hover:text-gray-300'
                }`}>
                  {dayName}
                </div>
                
                {/* Day number */}
                <div className={`text-2xl font-bold ${
                  isSelected ? 'text-white' : 'text-white group-hover:text-white'
                }`}>
                  {dayNumber}
                </div>
                
                {/* Upload count badge */}
                {count > 0 && (
                  <div className="absolute -top-2 -right-2">
                    <Badge 
                      className={`text-xs px-2 py-1 font-semibold border-0 ${
                        isSelected 
                          ? 'bg-white text-orange-600' 
                          : 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-lg'
                      }`}
                    >
                      {count}
                    </Badge>
                  </div>
                )}
                
                {/* Today indicator */}
                {isToday && (
                  <div className="absolute bottom-2 w-2 h-2 bg-orange-400 rounded-full"></div>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
