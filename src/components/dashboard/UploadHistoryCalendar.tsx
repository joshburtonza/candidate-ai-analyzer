
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { CVUpload } from '@/types/candidate';
import { format, isSameDay, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { getEffectiveDateString } from '@/utils/dateUtils';

interface UploadHistoryCalendarProps {
  allUploads: CVUpload[];
  bestUploads: CVUpload[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export const UploadHistoryCalendar = ({ allUploads, bestUploads, onDateSelect, selectedDate }: UploadHistoryCalendarProps) => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [realtimeAllUploads, setRealtimeAllUploads] = useState<CVUpload[]>(allUploads);
  const [realtimeBestUploads, setRealtimeBestUploads] = useState<CVUpload[]>(bestUploads);
  
  // State for calendar counts from the optimized API
  const [calendarCounts, setCalendarCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(false);

  // Update local uploads when props change
  useEffect(() => {
    setRealtimeAllUploads(allUploads);
  }, [allUploads]);

  useEffect(() => {
    setRealtimeBestUploads(bestUploads);
  }, [bestUploads]);

  // Fetch counts for the current week using the new optimized API
  useEffect(() => {
    const fetchWeekCounts = async () => {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
      
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(weekEnd, 'yyyy-MM-dd');
      
      setCountsLoading(true);
      try {
        const response = await fetch(
          `https://qsvadxpossrsnenvfdsv.supabase.co/functions/v1/candidate-counts?start=${startDate}&end=${endDate}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setCalendarCounts(data || {});
      } catch (error) {
        console.error('Error fetching calendar counts:', error);
        // Fallback to legacy counting if API fails
        setCalendarCounts({});
      } finally {
        setCountsLoading(false);
      }
    };

    fetchWeekCounts();
  }, [currentWeek]);

  // Get counts for both all uploads and best uploads
  const getCountsForDate = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // For total uploads, use optimized counts if available
    let totalCount = 0;
    if (Object.keys(calendarCounts).length > 0) {
      totalCount = calendarCounts[dateStr] || 0;
    } else {
      // Fallback to legacy counting for all uploads
      totalCount = realtimeAllUploads.filter(upload => getEffectiveDateString(upload) === dateStr).length;
    }
    
    // For best uploads, always use client-side filtering
    const bestCount = realtimeBestUploads.filter(upload => getEffectiveDateString(upload) === dateStr).length;
    
    return { total: totalCount, best: bestCount };
  }, [calendarCounts, realtimeAllUploads, realtimeBestUploads]);

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
    
    return eachDayOfInterval({ start: weekStart, end: weekEnd }).map(date => {
      const counts = getCountsForDate(date);
      return {
        date,
        totalCount: counts.total,
        bestCount: counts.best
      };
    });
  }, [currentWeek, getCountsForDate]);

  const totalUploadsThisWeek = useMemo(() => {
    return weekDays.reduce((sum, day) => sum + day.totalCount, 0);
  }, [weekDays]);

  const bestUploadsThisWeek = useMemo(() => {
    return weekDays.reduce((sum, day) => sum + day.bestCount, 0);
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
          
            <div className="flex items-center justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {totalUploadsThisWeek}
              </div>
              <div className="text-xs text-white/60 font-medium tracking-wider">
                TOTAL THIS WEEK
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {bestUploadsThisWeek}
              </div>
              <div className="text-xs text-white/60 font-medium tracking-wider">
                BEST THIS WEEK
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

        {/* Week range and legend */}
        <div className="text-center mb-6 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-500/10 border border-white/10 rounded-full">
            <div className="w-2 h-2 bg-white/60 rounded-full"></div>
            <span className="text-white font-medium">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
            </span>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-white/70">Total Uploads</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-white/70">Best Candidates</span>
            </div>
          </div>
        </div>

        {/* Day tiles - Full width grid */}
        <div className="grid grid-cols-7 gap-4 max-w-4xl mx-auto">
          {weekDays.map(({ date, totalCount, bestCount }) => {
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
                
                {/* Upload count badges */}
                <div className="absolute -top-2 -right-2 flex flex-col gap-1">
                  {totalCount > 0 && (
                    <Badge 
                      className={`text-xs px-2 py-1 font-semibold border-0 ${
                        isSelected 
                          ? 'bg-white text-slate-800' 
                          : 'bg-blue-400 text-slate-800 shadow-lg'
                      }`}
                    >
                      {totalCount}
                    </Badge>
                  )}
                  {bestCount > 0 && (
                    <Badge 
                      className={`text-xs px-2 py-1 font-semibold border-0 ${
                        isSelected 
                          ? 'bg-white text-slate-800' 
                          : 'bg-green-400 text-slate-800 shadow-lg'
                      }`}
                    >
                      {bestCount}
                    </Badge>
                  )}
                </div>
                
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
