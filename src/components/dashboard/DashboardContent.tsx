
import { useMemo, useEffect } from 'react';
import { CVUpload } from '@/types/candidate';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { UploadSection } from '@/components/dashboard/UploadSection';
import { CandidateGrid } from '@/components/dashboard/CandidateGrid';
import { UploadHistory } from '@/components/dashboard/UploadHistory';
import { AdvancedSearchPanel } from '@/components/search/AdvancedSearchPanel';
import { BatchUploadDialog } from '@/components/batch/BatchUploadDialog';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Code } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isSameDay } from 'date-fns';

interface DashboardContentProps {
  uploads: CVUpload[];
  sortBy: 'date' | 'score' | 'name';
  selectedDate: Date | null;
  onUploadComplete: (upload: CVUpload) => void;
  onBatchComplete: (batchId: string) => void;
  onDateSelect: (date: Date) => void;
}

export const DashboardContent = ({
  uploads,
  sortBy,
  selectedDate,
  onUploadComplete,
  onBatchComplete,
  onDateSelect,
}: DashboardContentProps) => {
  const navigate = useNavigate();

  const {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    filteredUploads,
    savedSearches,
    saveSearch,
    loadSearch,
  } = useAdvancedSearch(uploads);

  // Extract available options for filters
  const { availableSkills, availableCountries, availableTags } = useMemo(() => {
    const skills = new Set<string>();
    const countries = new Set<string>();
    const tags = new Set<string>();

    uploads.forEach(upload => {
      if (upload.extracted_json) {
        // Skills
        if (upload.extracted_json.skill_set) {
          upload.extracted_json.skill_set.split(',').forEach(skill => {
            skills.add(skill.trim());
          });
        }
        
        // Countries
        if (upload.extracted_json.countries) {
          countries.add(upload.extracted_json.countries.trim());
        }
      }
      
      // Tags
      if (upload.tags) {
        upload.tags.forEach(tag => tags.add(tag));
      }
    });

    return {
      availableSkills: Array.from(skills).slice(0, 50),
      availableCountries: Array.from(countries).slice(0, 50),
      availableTags: Array.from(tags),
    };
  }, [uploads]);

  // Apply date filter to the already filtered uploads
  const dateFilteredUploads = selectedDate 
    ? filteredUploads.filter(upload => {
        const uploadDate = new Date(upload.uploaded_at);
        return isSameDay(uploadDate, selectedDate);
      })
    : filteredUploads;

  // Sort the final filtered uploads
  const sortedUploads = [...dateFilteredUploads].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        const scoreA = parseFloat(a.extracted_json?.score || '0');
        const scoreB = parseFloat(b.extracted_json?.score || '0');
        return scoreB - scoreA;
      case 'name':
        const nameA = a.extracted_json?.candidate_name || '';
        const nameB = b.extracted_json?.candidate_name || '';
        return nameA.localeCompare(nameB);
      default:
        return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
    }
  });

  // Debug logging for date filtering
  useEffect(() => {
    if (selectedDate) {
      console.log('Selected date:', selectedDate);
      console.log('Total uploads:', uploads.length);
      console.log('Filtered uploads (before date):', filteredUploads.length);
      console.log('Date filtered uploads:', dateFilteredUploads.length);
      
      // Check uploads for the selected date
      const uploadsForDate = uploads.filter(upload => {
        const uploadDate = new Date(upload.uploaded_at);
        return isSameDay(uploadDate, selectedDate);
      });
      console.log('Raw uploads for selected date:', uploadsForDate.length);
      
      // Check completed uploads for the selected date
      const completedUploadsForDate = uploadsForDate.filter(upload => 
        upload.processing_status === 'completed' && upload.extracted_json
      );
      console.log('Completed uploads for selected date:', completedUploadsForDate.length);
    }
  }, [selectedDate, uploads, filteredUploads, dateFilteredUploads]);

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <DashboardStats uploads={uploads} />
      </motion.div>

      {/* Upload Actions - Stacked Vertically */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="space-y-4"
      >
        <UploadSection onUploadComplete={onUploadComplete} />
        
        <div className="flex flex-col sm:flex-row gap-4">
          <BatchUploadDialog onBatchComplete={onBatchComplete} />
          <Button
            onClick={() => navigate('/api-docs')}
            variant="outline"
            className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
          >
            <Code className="w-4 h-4 mr-2" />
            API Docs
          </Button>
        </div>
      </motion.div>

      {/* Advanced Search Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <AdvancedSearchPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
          savedSearches={savedSearches}
          onSaveSearch={saveSearch}
          onLoadSearch={loadSearch}
          availableSkills={availableSkills}
          availableCountries={availableCountries}
          availableTags={availableTags}
        />
      </motion.div>

      {/* Upload History Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <UploadHistory 
          uploads={uploads} 
          onDateSelect={onDateSelect}
          selectedDate={selectedDate}
        />
      </motion.div>

      {/* Candidates Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="space-y-4"
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-white">Candidates</h2>
          {selectedDate && (
            <div className="text-sm text-gray-400">
              Showing {sortedUploads.length} candidates from {selectedDate.toLocaleDateString()}
            </div>
          )}
          {(searchQuery || Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f !== undefined)) && !selectedDate && (
            <div className="text-sm text-gray-400">
              {sortedUploads.length} results found
            </div>
          )}
        </div>
      </motion.div>

      {/* Candidates Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <CandidateGrid uploads={sortedUploads} viewMode="grid" />
      </motion.div>
    </div>
  );
};
