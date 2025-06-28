
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { CVUpload } from '@/types/candidate';
import { format, isSameDay, startOfWeek, endOfWeek, addWeeks, subWeeks, eachWeekOfInterval, startOfMonth, endOfMonth } from 'date-fns';

interface UploadHistoryCalendarProps {
  uploads: CVUpload[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export const UploadHistoryCalendar = ({ uploads, onDateSelect, selectedDate }: UploadHistoryCalendarProps) => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 0 })); // 0 = Sunday

  // Get upload counts for a specific week
  const getUploadCountForWeek = (weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
    return uploads.filter(upload => {
      const uploadDate = new Date(upload.uploaded_at);
      return uploadDate >= weekStart && uploadDate <= weekEnd;
    }).length;
  };

  // Get weeks with uploads for the current month
  const getWeeksWithUploads = () => {
    const monthStart = startOfMonth(currentWeek);
    const monthEnd = endOfMonth(currentWeek);
    const weeks = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 0 }
    );
    
    return weeks.map(week => ({
      weekStart: week,
      weekEnd: endOfWeek(week, { weekStartsOn: 0 }),
      count: getUploadCountForWeek(week)
    })).filter(week => week.count > 0);
  };

  const weeksWithUploads = getWeeksWithUploads();
  const totalUploadsThisMonth = weeksWithUploads.reduce((sum, week) => sum + week.count, 0);

  const handleWeekSelect = (weekStart: Date) => {
    // Select the first day of the week when clicking on a week block
    onDateSelect(weekStart);
  };

  const navigateToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const navigateToPrevWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const isWeekSelected = (weekStart: Date) => {
    if (!selectedDate) return false;
    const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return isSameDay(weekStart, selectedWeekStart);
  };

  return (
    <div className="glass p-6 rounded-lgx">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-gradient rounded-lg">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">QUALIFIED CANDIDATES</h2>
            <p className="text-sm text-white/70">Click on a week to filter candidates by upload date • Shows qualified candidates only</p>
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

      {/* Single row of weeks with uploads */}
      <div className="flex flex-wrap gap-3">
        {weeksWithUploads.length > 0 ? (
          weeksWithUploads.map(({ weekStart, weekEnd, count }) => {
            const isSelected = isWeekSelected(weekStart);
            
            return (
              <Button
                key={weekStart.toISOString()}
                variant="ghost"
                onClick={() => handleWeekSelect(weekStart)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lgx border transition-all min-w-[120px] ${
                  isSelected 
                    ? 'bg-brand-gradient text-white border-brand shadow-lg' 
                    : 'glass border-brand/30 text-white hover:bg-brand/20'
                }`}
              >
                <div className="text-sm font-medium text-center">
                  {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
                </div>
                <div className="text-xs text-white/70">
                  Week of {format(weekStart, 'MMM d')}
                </div>
                <Badge 
                  variant="secondary" 
                  className="text-xs px-2 py-1 bg-brand-gradient text-white border-0"
                >
                  {count}
                </Badge>
              </Button>
            );
          })
        ) : (
          <div className="flex items-center justify-center w-full py-8">
            <div className="text-center">
              <div className="text-white/50 text-lg mb-2">No uploads this month</div>
              <div className="text-white/30 text-sm">Upload some CVs to see them here</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
