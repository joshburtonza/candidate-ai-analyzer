
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X, MapPin, Award, Briefcase } from 'lucide-react';
import { CVUpload } from '@/types/candidate';
import { filterValidCandidates } from '@/utils/candidateFilters';

interface AdvancedFiltersProps {
  uploads: CVUpload[];
  onFilterChange: (filtered: CVUpload[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

// Helper functions to safely handle array or string data
const normalizeToArray = (value: string | string[] | null | undefined): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(item => item && item.trim()).map(item => item.trim());
  }
  if (typeof value === 'string') {
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }
  return [];
};

export const AdvancedFilters = ({ uploads, onFilterChange, searchQuery, onSearchChange }: AdvancedFiltersProps) => {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [scoreRange, setScoreRange] = useState<[number, number]>([5, 10]);
  const [showFilters, setShowFilters] = useState(false);

  // Memoize the valid uploads to prevent recalculation
  const validUploads = useMemo(() => {
    return filterValidCandidates(uploads);
  }, [uploads]);

  // Extract unique countries with proper handling of both arrays and strings - memoized
  const availableCountries = useMemo(() => {
    const countrySet = new Set<string>();
    validUploads.forEach(upload => {
      if (upload.extracted_json?.countries) {
        const countries = upload.extracted_json.countries.split(',').map(c => c.trim());
        countries.forEach(country => {
          if (country) countrySet.add(country);
        });
      }
    });
    return Array.from(countrySet).sort();
  }, [validUploads]);

  // Extract unique skills with proper handling of both arrays and strings - memoized
  const availableSkills = useMemo(() => {
    const skillSet = new Set<string>();
    validUploads.forEach(upload => {
      if (upload.extracted_json?.skill_set) {
        const skills = upload.extracted_json.skill_set.split(',').map(s => s.trim());
        skills.forEach(skill => {
          if (skill) skillSet.add(skill);
        });
      }
    });
    return Array.from(skillSet).sort();
  }, [validUploads]);

  // Debounced filter application
  const applyFilters = useCallback(() => {
    let filtered = validUploads;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(upload => {
        const data = upload.extracted_json;
        return (
          data?.candidate_name?.toLowerCase().includes(query) ||
          data?.email_address?.toLowerCase().includes(query) ||
          data?.skill_set?.toLowerCase().includes(query) ||
          data?.countries?.toLowerCase().includes(query)
        );
      });
    }

    // Country filter
    if (selectedCountries.length > 0) {
      filtered = filtered.filter(upload => {
        const countries = upload.extracted_json?.countries || '';
        return selectedCountries.some(selectedCountry =>
          countries.toLowerCase().includes(selectedCountry.toLowerCase())
        );
      });
    }

    // Skills filter
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(upload => {
        const skillSet = upload.extracted_json?.skill_set || '';
        return selectedSkills.some(selectedSkill =>
          skillSet.toLowerCase().includes(selectedSkill.toLowerCase())
        );
      });
    }

    // Score filter
    filtered = filtered.filter(upload => {
      const score = parseFloat(upload.extracted_json?.score || '0') || 0;
      return score >= scoreRange[0] && score <= scoreRange[1];
    });

    onFilterChange(filtered);
  }, [validUploads, searchQuery, selectedCountries, selectedSkills, scoreRange, onFilterChange]);

  // Apply filters with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyFilters();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [applyFilters]);

  const clearFilters = useCallback(() => {
    setSelectedCountries([]);
    setSelectedSkills([]);
    setScoreRange([5, 10]);
    onSearchChange('');
  }, [onSearchChange]);

  const removeCountry = useCallback((country: string) => {
    setSelectedCountries(prev => prev.filter(c => c !== country));
  }, []);

  const removeSkill = useCallback((skill: string) => {
    setSelectedSkills(prev => prev.filter(s => s !== skill));
  }, []);

  const activeFiltersCount = selectedCountries.length + selectedSkills.length + (scoreRange[0] > 5 || scoreRange[1] < 10 ? 1 : 0);

  return (
    <div className="glass-card elegant-border p-6 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-white/5 backdrop-blur-xl border-brand/30 text-white placeholder:text-white/50"
            />
          </div>
          
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="border-brand/30 text-brand hover:bg-brand/10"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
        </div>

        {activeFiltersCount > 0 && (
          <Button
            onClick={clearFilters}
            variant="ghost"
            size="sm"
            className="text-red-400 hover:bg-red-500/10"
          >
            Clear All
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="space-y-6 border-t border-white/10 pt-4">
          {/* Country Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand" />
              <label className="text-sm font-medium text-white">Countries</label>
            </div>
            <Select
              onValueChange={(value) => {
                if (!selectedCountries.includes(value)) {
                  setSelectedCountries([...selectedCountries, value]);
                }
              }}
            >
              <SelectTrigger className="bg-white/5 border-brand/30 text-white">
                <SelectValue placeholder="Select countries..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-brand/30 text-white">
                {availableCountries.map(country => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCountries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedCountries.map(country => (
                  <Badge
                    key={country}
                    variant="secondary"
                    className="bg-brand/20 text-brand border-brand/30"
                  >
                    {country}
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer"
                      onClick={() => removeCountry(country)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Skills Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand" />
              <label className="text-sm font-medium text-white">Skills</label>
            </div>
            <Select
              onValueChange={(value) => {
                if (!selectedSkills.includes(value)) {
                  setSelectedSkills([...selectedSkills, value]);
                }
              }}
            >
              <SelectTrigger className="bg-white/5 border-brand/30 text-white">
                <SelectValue placeholder="Select skills..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-brand/30 text-white max-h-48 overflow-auto">
                {availableSkills.map(skill => (
                  <SelectItem key={skill} value={skill}>
                    {skill}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map(skill => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="bg-blue-500/20 text-blue-300 border-blue-500/30"
                  >
                    {skill}
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer"
                      onClick={() => removeSkill(skill)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Score Range Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-brand" />
              <label className="text-sm font-medium text-white">Score Range</label>
            </div>
            <div className="space-y-2">
              <Slider
                value={scoreRange}
                onValueChange={(value) => setScoreRange(value as [number, number])}
                min={5}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-white/70">
                <span>{scoreRange[0]}/10</span>
                <span>{scoreRange[1]}/10</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
