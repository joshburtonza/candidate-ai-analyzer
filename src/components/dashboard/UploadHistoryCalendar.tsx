
import { useState, useEffect } from 'react';
import { CVUpload } from '@/types/candidate';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';

interface UploadHistoryCalendarProps {
  uploads: CVUpload[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

const isCompleteProfile = (upload: CVUpload): boolean => {
  if (!upload.extracted_json) return false;
  
  const data = upload.extracted_json;
  
  // Check all required fields for a complete profile
  return !!(
    data.candidate_name &&
    data.contact_number &&
    data.email_address &&
    data.countries &&
    data.skill_set &&
    data.educational_qualifications &&
    data.job_history &&
    data.justification
  );
};

const filterValidCandidatesForDate = (uploads: CVUpload[], targetDate: Date): CVUpload[] => {
  const seenEmails = new Set<string>();
  
  // First filter by date
  const dateFilteredUploads = uploads.filter(upload => 
    isSameDay(new Date(upload.uploaded_at), targetDate)
  );
  
  return dateFilteredUploads.filter(upload => {
    // Filter out incomplete uploads
    if (upload.processing_status !== 'completed' || !upload.extracted_json) {
      return false;
    }

    // Filter out incomplete profiles
    if (!isCompleteProfile(upload)) {
      return false;
    }

    // Filter out low scores (below 5/10)
    const rawScore = parseFloat(upload.extracted_json.score || '0');
    const score = rawScore > 10 ? Math.round(rawScore / 10) : Math.round(rawScore);
    if (score < 5) {
      return false;
    }

    const candidateEmail = upload.extracted_json.email_address;

    // Filter out duplicates based on email (case-insensitive)
    if (candidateEmail) {
      const normalizedEmail = candidateEmail.toLowerCase().trim();
      if (seenEmails.has(normalizedEmail)) {
        return false;
      }
      seenEmails.add(normalizedEmail);
    }

    return true;
  });
};

export const UploadHistoryCalendar = ({ uploads, onDateSelect, selectedDate }: UploadHistoryCalendarProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));

  // Get qualified candidate count for date (matching dashboard filtering)
  const getQualifiedCandidateCountForDate = (date: Date) => {
    return filterValidCandidatesForDate(uploads, date).length;
  };

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  // Get the month and year for display
  const currentMonth = format(currentWeekStart, 'MMMM yyyy');

  return (
    <Card className="glass-card elegant-border p-8">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-white tracking-wide">QUALIFIED CANDIDATES</h3>
        <div className="flex items-center gap-6">
          <div className="text-white/90 font-semibold text-lg tracking-wide">
            {currentMonth.toUpperCase()}
          </div>
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousWeek}
              className="text-white/70 hover:text-white hover:bg-white/10 w-10 h-10 p-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextWeek}
              className="text-white/70 hover:text-white hover:bg-white/10 w-10 h-10 p-0"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3 mb-6">
        {weekDays.map((date, index) => {
          const qualifiedCount = getQualifiedCandidateCountForDate(date);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());

          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative"
            >
              <Button
                variant="ghost"
                onClick={() => onDateSelect(date)}
                className={`
                  h-28 w-full flex flex-col items-center justify-between p-3 rounded-xl border-2 transition-all duration-200
                  ${isSelected 
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white border-orange-400 shadow-lg shadow-orange-500/25' 
                    : qualifiedCount > 0 
                      ? 'bg-orange-500/10 text-orange-300 border-orange-500/30 hover:bg-orange-500/20 hover:border-orange-500/50' 
                      : 'bg-white/3 text-white/50 border-white/10 hover:bg-white/8 hover:border-white/20'
                  }
                  ${isToday ? 'ring-2 ring-orange-400/40' : ''}
                `}
              >
                <div className="flex flex-col items-center justify-center flex-1">
                  <div className="text-xs font-medium mb-1 opacity-80">
                    {format(date, 'EEE').toUpperCase()}
                  </div>
                  <div className="text-2xl font-bold">
                    {format(date, 'd')}
                  </div>
                </div>
                
                {qualifiedCount > 0 && (
                  <div className={`
                    text-xs font-bold px-2 py-1 rounded-full min-w-[28px] h-6 flex items-center justify-center mt-1
                    ${isSelected 
                      ? 'bg-white/20 text-white' 
                      : 'bg-orange-500 text-white'
                    }
                  `}>
                    {qualifiedCount}
                  </div>
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center">
        <p className="text-white/60 text-sm font-medium">
          Click on a day to filter candidates by upload date • Shows qualified candidates only
        </p>
      </div>
    </Card>
  );
};
