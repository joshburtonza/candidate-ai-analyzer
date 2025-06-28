
import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';

interface DateFilterProps {
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
}

export const DateFilter = ({ onDateRangeChange }: DateFilterProps) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  const handleStartDateChange = (date: Date | undefined) => {
    const newStartDate = date || null;
    setStartDate(newStartDate);
    onDateRangeChange(newStartDate, endDate);
    setIsStartOpen(false);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    const newEndDate = date || null;
    setEndDate(newEndDate);
    onDateRangeChange(startDate, newEndDate);
    setIsEndOpen(false);
  };

  const clearDateRange = () => {
    setStartDate(null);
    setEndDate(null);
    onDateRangeChange(null, null);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-white/70 text-sm font-medium">Date Range:</span>
      
      <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="bg-white/5 backdrop-blur-xl border border-slate-500/30 text-white hover:bg-white/10 text-sm"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            {startDate ? format(startDate, 'MMM dd, yyyy') : 'Start Date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-gray-800 border-slate-500/30">
          <Calendar
            mode="single"
            selected={startDate || undefined}
            onSelect={handleStartDateChange}
            disabled={(date) => endDate ? date > endDate : false}
            className="text-white"
          />
        </PopoverContent>
      </Popover>

      <span className="text-white/50">to</span>

      <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="bg-white/5 backdrop-blur-xl border border-slate-500/30 text-white hover:bg-white/10 text-sm"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            {endDate ? format(endDate, 'MMM dd, yyyy') : 'End Date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-gray-800 border-slate-500/30">
          <Calendar
            mode="single"
            selected={endDate || undefined}
            onSelect={handleEndDateChange}
            disabled={(date) => startDate ? date < startDate : false}
            className="text-white"
          />
        </PopoverContent>
      </Popover>

      {(startDate || endDate) && (
        <Button
          onClick={clearDateRange}
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10 p-1"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
