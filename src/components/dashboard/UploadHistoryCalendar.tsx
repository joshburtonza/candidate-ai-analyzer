
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { CVUpload } from '@/types/candidate';
import { format, isSameDay, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { filterValidCandidatesForDate } from '@/utils/candidateFilters';

interface UploadHistoryCalendarProps {
  uploads: CVUpload[];
  onDateSelect: (date: Date | null) => void;
  selectedDate: Date | null;
}

export const UploadHistoryCalendar = ({ uploads, onDateSelect, selectedDate }: UploadHistoryCalendarProps) => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [realtimeUploads, setRealtimeUploads] = useState<CVUpload[]>(uploads);

  // Update local uploads when prop changes
  useEffect(() => {
    setRealtimeUploads(uploads);
  }, [uploads]);

  // Memoized function to get qualified count for a specific date
  const getQualifiedCountForDate = useCallback((date: Date) => {
    const validCandidates = filterValidCandidatesForDate(realtimeUploads, date);
    return validCandidates.length;
  }, [realtimeUploads]);

  // Debounced realtime subscription setup
  useEffect(() => {
    let mounted = true;
    
    const setupSubscription = () => {
      if (!mounted) return;
      
      console.log('UploadHistoryCalendar: Setting up realtime subscription');
      
        const channel = supabase
        .channel(`calendar_uploads_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'cv_uploads'
          },
          (payload) => {
            if (!mounted) return;
            console.log('UploadHistoryCalendar: New upload received via realtime:', payload);
            const newUpload = payload.new as CVUpload;
            
            setRealtimeUploads(prev => {
              // Prevent duplicates
              const exists = prev.some(upload => upload.id === newUpload.id);
              if (exists) return prev;
              return [newUpload, ...prev];
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'cv_uploads'
          },
          (payload) => {
            if (!mounted) return;
            console.log('UploadHistoryCalendar: Upload updated via realtime:', payload);
            const updatedUpload = payload.new as CVUpload;
            
            setRealtimeUploads(prev => 
              prev.map(upload => 
                upload.id === updatedUpload.id ? updatedUpload : upload
              )
            );
          }
        )
        .subscribe();

      return channel;
    };

    const channel = setupSubscription();

    return () => {
      mounted = false;
      if (channel) {
        console.log('UploadHistoryCalendar: Cleaning up realtime subscription');
        supabase.removeChannel(channel);
      }
    };
  }, []); // Empty dependency array to prevent re-subscription

  // Memoized week days calculation
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: weekStart, end: weekEnd }).map(date => ({
      date,
      count: getQualifiedCountForDate(date)
    }));
  }, [currentWeek, getQualifiedCountForDate]);

  const totalQualifiedThisWeek = useMemo(() => {
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
    <div className="glass-card p-8 rounded-2xl elegant-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 glass-card rounded-xl elegant-border">
            <CalendarIcon className="w-6 h-6 text-white/80" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white text-elegant tracking-wider">
              UPLOAD CALENDAR
            </h2>
            <p className="text-sm text-white/60 mt-1">
              Click on a day to filter candidates • Sort by date to see chronological organization
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-3xl font-bold text-brand-gradient">
              {totalQualifiedThisWeek}
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
            
            <div className="px-4 py-2 glass-card rounded-xl elegant-border">
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
          
          {/* Clear date filter button */}
          {selectedDate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateSelect(null as any)}
              className="text-white/70 hover:text-white hover:bg-white/10 border-white/20 rounded-xl transition-all duration-200"
            >
              Clear Date Filter
            </Button>
          )}
        </div>
      </div>

      {/* Week range */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full elegant-border">
          <div className="w-2 h-2 bg-white/60 rounded-full"></div>
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
                relative flex flex-col items-center gap-3 p-6 rounded-2xl transition-all duration-300 min-h-[120px] group
                ${isSelected 
                  ? 'bg-brand-gradient text-slate-800 shadow-lg shadow-brand/25 scale-105 border border-brand/30' 
                  : 'glass-card elegant-border text-white hover:bg-white/10 hover:border-white/20 hover:scale-105'
                }
                ${isToday && !isSelected ? 'ring-2 ring-brand/50' : ''}
              `}
            >
              {/* Day name */}
              <div className={`text-xs font-semibold tracking-wider uppercase ${
                isSelected ? 'text-slate-700' : 'text-white/60 group-hover:text-white/80'
              }`}>
                {dayName}
              </div>
              
              {/* Day number */}
              <div className={`text-2xl font-bold ${
                isSelected ? 'text-slate-800' : 'text-white group-hover:text-white'
              }`}>
                {dayNumber}
              </div>
              
              {/* Qualified candidate count badge */}
              {count > 0 && (
                <div className="absolute -top-2 -right-2">
                  <Badge 
                    className={`text-xs px-2 py-1 font-semibold border-0 ${
                      isSelected 
                        ? 'bg-white text-slate-800' 
                        : 'bg-brand-gradient text-slate-800 shadow-lg'
                    }`}
                  >
                    {count}
                  </Badge>
                </div>
              )}
              
              {/* Today indicator */}
              {isToday && (
                <div className={`absolute bottom-2 w-2 h-2 rounded-full ${
                  isSelected ? 'bg-slate-700' : 'bg-brand'
                }`}></div>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
