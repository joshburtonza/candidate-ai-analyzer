
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { CVUpload } from '@/types/candidate';
import { format, isSameDay, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface UploadHistoryCalendarProps {
  uploads: CVUpload[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export const UploadHistoryCalendar = ({ uploads, onDateSelect, selectedDate }: UploadHistoryCalendarProps) => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [realtimeUploads, setRealtimeUploads] = useState<CVUpload[]>(uploads);

  // Update local uploads when prop changes
  useEffect(() => {
    setRealtimeUploads(uploads);
  }, [uploads]);

  // Simple count of ALL uploads for a specific date
  const getUploadCountForDate = useCallback((date: Date) => {
    return realtimeUploads.filter(upload => {
      const uploadDate = new Date(upload.uploaded_at);
      return isSameDay(uploadDate, date);
    }).length;
  }, [realtimeUploads]);

  // Real-time subscription for calendar updates
  useEffect(() => {
    console.log('UploadHistoryCalendar: Setting up realtime subscription');
    
    const channel = supabase
      .channel(`calendar_cv_uploads_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cv_uploads'
        },
        (payload) => {
          console.log('UploadHistoryCalendar: Realtime update:', payload);
          // Update the local state immediately when uploads prop changes
          // The parent component will handle the main data refresh
        }
      )
      .subscribe();

    return () => {
      console.log('UploadHistoryCalendar: Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  // Memoized week days calculation
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: weekStart, end: weekEnd }).map(date => ({
      date,
      count: getUploadCountForDate(date)
    }));
  }, [currentWeek, getUploadCountForDate]);

  const totalUploadsThisWeek = useMemo(() => {
    return weekDays.reduce((sum, day) => sum + day.count, 0);
  }, [weekDays]);

  const handleDateSelect = useCallback((date: Date) => {
    onDateSelect(date);
  }, [onDateSelect]);

  const navigateToNextWeek = useCallback(() => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  }, [currentWeek]);

  const navigateToPrevWeek = useCallback(() => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  }, [currentWeek]);

  const isDaySelected = useCallback((date: Date) => {
    if (!selectedDate) return false;
    return isSameDay(date, selectedDate);
  }, [selectedDate]);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });

  return (
    <div className="relative overflow-hidden w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl rounded-2xl"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 via-transparent to-slate-500/5 rounded-2xl"></div>
      
      <div className="relative z-10 p-8 border border-white/10 rounded-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="p-3 glass-card rounded-xl border border-white/10 bg-slate-500/10">
              <CalendarIcon className="w-6 h-6 text-white/80" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wider">
                UPLOAD CALENDAR
              </h2>
              <p className="text-sm text-white/60 mt-1">
                Click on a day to filter uploads by date
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">
                {totalUploadsThisWeek}
              </div>
              <div className="text-xs text-white/60 font-medium tracking-wider">
                THIS WEEK
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToPrevWeek}
                className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="px-4 py-2 bg-slate-500/10 border border-white/10 rounded-xl">
                <span className="text-white font-semibold tracking-wide">
                  {format(currentWeek, 'MMMM yyyy').toUpperCase()}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToNextWeek}
                className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Week range */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-500/10 border border-white/10 rounded-full">
            <div className="w-2 h-2 bg-white/60 rounded-full"></div>
            <span className="text-white font-medium">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
            </span>
          </div>
        </div>

        {/* Day tiles - Full width grid */}
        <div className="grid grid-cols-7 gap-4 max-w-4xl mx-auto">
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
                  relative flex flex-col items-center gap-3 p-6 rounded-2xl transition-all duration-300 min-h-[120px] group
                  ${isSelected 
                    ? 'bg-blue-400/20 text-white shadow-lg shadow-blue-400/25 scale-105 border border-blue-400/30' 
                    : 'bg-slate-500/10 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 hover:scale-105'
                  }
                  ${isToday && !isSelected ? 'ring-2 ring-blue-400/50' : ''}
                `}
              >
                {/* Day name */}
                <div className={`text-xs font-semibold tracking-wider uppercase ${
                  isSelected ? 'text-white' : 'text-white/60 group-hover:text-white/80'
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
                          ? 'bg-white text-slate-800' 
                          : 'bg-blue-400 text-slate-800 shadow-lg'
                      }`}
                    >
                      {count}
                    </Badge>
                  </div>
                )}
                
                {/* Today indicator */}
                {isToday && (
                  <div className={`absolute bottom-2 w-2 h-2 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-blue-400'
                  }`}></div>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
