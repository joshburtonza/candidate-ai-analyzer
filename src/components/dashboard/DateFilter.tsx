
import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateFilterProps {
  selectedDates: Date[];
  onDatesChange: (dates: Date[]) => void;
}

export const DateFilter = ({ selectedDates, onDatesChange }: DateFilterProps) => {
  const [open, setOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const isSelected = selectedDates.some(d => 
      d.toDateString() === date.toDateString()
    );
    
    if (isSelected) {
      // Remove date if already selected
      onDatesChange(selectedDates.filter(d => 
        d.toDateString() !== date.toDateString()
      ));
    } else {
      // Add date to selection
      onDatesChange([...selectedDates, date]);
    }
  };

  const clearAllDates = () => {
    onDatesChange([]);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal bg-gray-800 border-gray-600 text-white hover:bg-gray-700",
              selectedDates.length === 0 && "text-gray-400"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDates.length === 0 
              ? "Filter by dates..." 
              : selectedDates.length === 1
              ? format(selectedDates[0], "PPP")
              : `${selectedDates.length} dates selected`
            }
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600" align="start">
          <Calendar
            mode="multiple"
            selected={selectedDates}
            onSelect={(dates) => dates && onDatesChange(dates)}
            initialFocus
            className="pointer-events-auto"
          />
          {selectedDates.length > 0 && (
            <div className="p-3 border-t border-gray-600">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllDates}
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Clear All
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      
      {selectedDates.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllDates}
          className="text-gray-400 hover:text-white hover:bg-gray-700"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
