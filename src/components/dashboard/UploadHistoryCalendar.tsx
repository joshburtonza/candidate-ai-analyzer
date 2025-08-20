
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
    <div className="bg-black w-full border border-gray-800 rounded-2xl p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="p-3 bg-pastel-purple/20 rounded-xl border border-pastel-purple/30">
            <CalendarIcon className="w-6 h-6 text-pastel-purple" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-wider">
              UPLOAD CALENDAR
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Click on a day to filter uploads by date
            </p>
          </div>
        </div>
          
        <div className="flex items-center justify-center gap-8 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-pastel-cyan">
              {totalUploadsThisWeek}
            </div>
            <div className="text-xs text-gray-400 font-medium tracking-wider">
              TOTAL THIS WEEK
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-pastel-green">
              {bestUploadsThisWeek}
            </div>
            <div className="text-xs text-gray-400 font-medium tracking-wider">
              BEST THIS WEEK
            </div>
          </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToPrevWeek}
                className="text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-all duration-200"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl">
                <span className="text-white font-semibold tracking-wide">
                  {format(currentWeek, 'MMMM yyyy').toUpperCase()}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToNextWeek}
                className="text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-all duration-200"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Week range and legend */}
        <div className="text-center mb-6 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-700 rounded-full">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-white font-medium">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
            </span>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-pastel-cyan rounded-full"></div>
              <span className="text-gray-400">Total Uploads</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-pastel-green rounded-full"></div>
              <span className="text-gray-400">Best Candidates</span>
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
                relative flex flex-col items-center gap-3 p-6 rounded-xl transition-all duration-300 min-h-[120px] group
                ${isSelected 
                  ? 'bg-pastel-purple/20 text-white shadow-lg border border-pastel-purple/50' 
                  : 'bg-gray-900 border border-gray-700 text-white hover:bg-gray-800 hover:border-gray-600'
                }
                ${isToday && !isSelected ? 'ring-2 ring-pastel-cyan/50' : ''}
              `}
            >
              {/* Day name */}
              <div className={`text-xs font-semibold tracking-wider uppercase ${
                isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
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
                        ? 'bg-white text-gray-800' 
                        : 'bg-pastel-cyan text-black shadow-lg'
                    }`}
                  >
                    {totalCount}
                  </Badge>
                )}
                {bestCount > 0 && (
                  <Badge 
                    className={`text-xs px-2 py-1 font-semibold border-0 ${
                      isSelected 
                        ? 'bg-white text-gray-800' 
                        : 'bg-pastel-green text-black shadow-lg'
                    }`}
                  >
                    {bestCount}
                  </Badge>
                )}
              </div>
              
              {/* Today indicator */}
              {isToday && (
                <div className={`absolute bottom-2 w-2 h-2 rounded-full ${
                  isSelected ? 'bg-white' : 'bg-pastel-cyan'
                }`}></div>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
