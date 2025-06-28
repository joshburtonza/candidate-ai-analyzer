
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown, X, Filter, RotateCcw } from 'lucide-react';
import { CVUpload } from '@/types/candidate';
import { cn } from '@/lib/utils';

interface FilterState {
  countries: string[];
  skills: string[];
  scoreRange: [number, number];
  searchQuery: string;
}

interface AdvancedFiltersProps {
  uploads: CVUpload[];
  onFilterChange: (filteredUploads: CVUpload[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const AdvancedFilters = ({ uploads, onFilterChange, searchQuery, onSearchChange }: AdvancedFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    countries: [],
    skills: [],
    scoreRange: [5, 10],
    searchQuery: searchQuery
  });

  const [showFilters, setShowFilters] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);

  // Extract unique countries and skills from all uploads
  const availableCountries = Array.from(new Set(
    uploads
      .filter(u => u.extracted_json?.countries)
      .flatMap(u => u.extracted_json!.countries.split(',').map(c => c.trim()))
      .filter(Boolean)
  )).sort();

  const availableSkills = Array.from(new Set(
    uploads
      .filter(u => u.extracted_json?.skill_set)
      .flatMap(u => u.extracted_json!.skill_set.split(',').map(s => s.trim().toLowerCase()))
      .filter(Boolean)
  )).sort();

  // Apply filters
  useEffect(() => {
    let filtered = uploads.filter(upload => {
      if (upload.processing_status !== 'completed' || !upload.extracted_json) return false;
      
      const data = upload.extracted_json;
      
      // Complete profile check
      if (!(data.candidate_name && data.contact_number && data.email_address && 
            data.countries && data.skill_set && data.educational_qualifications && 
            data.job_history && data.justification)) return false;
      
      // Score filter
      const rawScore = parseFloat(data.score || '0');
      const score = rawScore > 10 ? Math.round(rawScore / 10) : Math.round(rawScore);
      if (score < filters.scoreRange[0] || score > filters.scoreRange[1]) return false;
      
      // Country filter
      if (filters.countries.length > 0) {
        const candidateCountries = data.countries.split(',').map(c => c.trim());
        const hasMatchingCountry = filters.countries.some(filterCountry => 
          candidateCountries.some(country => country.toLowerCase().includes(filterCountry.toLowerCase()))
        );
        if (!hasMatchingCountry) return false;
      }
      
      // Skills filter
      if (filters.skills.length > 0) {
        const candidateSkills = data.skill_set.split(',').map(s => s.trim().toLowerCase());
        const hasMatchingSkill = filters.skills.some(filterSkill => 
          candidateSkills.some(skill => skill.includes(filterSkill.toLowerCase()))
        );
        if (!hasMatchingSkill) return false;
      }
      
      // Search query
      if (filters.searchQuery) {
        const searchFields = [
          data.candidate_name,
          data.email_address,
          data.skill_set,
          data.countries
        ].join(' ').toLowerCase();
        
        if (!searchFields.includes(filters.searchQuery.toLowerCase())) return false;
      }
      
      return true;
    });

    // Remove duplicates by email
    const seenEmails = new Set<string>();
    filtered = filtered.filter(upload => {
      const email = upload.extracted_json?.email_address;
      if (email) {
        const normalizedEmail = email.toLowerCase().trim();
        if (seenEmails.has(normalizedEmail)) return false;
        seenEmails.add(normalizedEmail);
      }
      return true;
    });

    onFilterChange(filtered);
  }, [filters, uploads, onFilterChange]);

  // Sync search query
  useEffect(() => {
    setFilters(prev => ({ ...prev, searchQuery }));
  }, [searchQuery]);

  const handleSearchChange = (value: string) => {
    onSearchChange(value);
    setFilters(prev => ({ ...prev, searchQuery: value }));
  };

  const clearFilters = () => {
    setFilters({
      countries: [],
      skills: [],
      scoreRange: [5, 10],
      searchQuery: ''
    });
    onSearchChange('');
  };

  const hasActiveFilters = filters.countries.length > 0 || 
                          filters.skills.length > 0 || 
                          filters.scoreRange[0] > 5 || 
                          filters.scoreRange[1] < 10 ||
                          filters.searchQuery.length > 0;

  const removeCountry = (country: string) => {
    setFilters(prev => ({
      ...prev,
      countries: prev.countries.filter(c => c !== country)
    }));
  };

  const removeSkill = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search candidates..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="bg-white/5 backdrop-blur-xl border border-orange-500/30 text-white placeholder:text-white/60 focus:border-orange-500"
          />
        </div>
        
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className={cn(
            "border-orange-500/30 text-orange-400 hover:bg-orange-500/10",
            hasActiveFilters && "bg-orange-500/20 border-orange-500"
          )}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters {hasActiveFilters && `(${[filters.countries.length, filters.skills.length].filter(x => x > 0).length + (filters.scoreRange[0] > 5 || filters.scoreRange[1] < 10 ? 1 : 0)})`}
        </Button>

        {hasActiveFilters && (
          <Button
            onClick={clearFilters}
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(filters.countries.length > 0 || filters.skills.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {filters.countries.map(country => (
            <Badge
              key={country}
              variant="secondary"
              className="bg-orange-500/20 text-orange-300 border-orange-500/30 pr-1"
            >
              {country}
              <button
                onClick={() => removeCountry(country)}
                className="ml-2 hover:bg-orange-500/30 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {filters.skills.map(skill => (
            <Badge
              key={skill}
              variant="secondary"
              className="bg-blue-500/20 text-blue-300 border-blue-500/30 pr-1"
            >
              {skill}
              <button
                onClick={() => removeSkill(skill)}
                className="ml-2 hover:bg-blue-500/30 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="glass-card elegant-border p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Country Filter */}
            <div className="space-y-2">
              <Label className="text-white font-medium">Countries</Label>
              <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={countryOpen}
                    className="w-full justify-between bg-white/5 border-orange-500/30 text-white"
                  >
                    {filters.countries.length > 0
                      ? `${filters.countries.length} selected`
                      : "Select countries..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-gray-800 border-orange-500/30">
                  <Command className="bg-gray-800">
                    <CommandInput placeholder="Search countries..." className="text-white" />
                    <CommandEmpty className="text-white/60">No countries found.</CommandEmpty>
                    <CommandGroup className="max-h-48 overflow-auto">
                      {availableCountries.map((country) => (
                        <CommandItem
                          key={country}
                          onSelect={() => {
                            setFilters(prev => ({
                              ...prev,
                              countries: prev.countries.includes(country)
                                ? prev.countries.filter(c => c !== country)
                                : [...prev.countries, country]
                            }));
                          }}
                          className="text-white hover:bg-white/10"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              filters.countries.includes(country) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {country}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Skills Filter */}
            <div className="space-y-2">
              <Label className="text-white font-medium">Skills</Label>
              <Popover open={skillOpen} onOpenChange={setSkillOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={skillOpen}
                    className="w-full justify-between bg-white/5 border-orange-500/30 text-white"
                  >
                    {filters.skills.length > 0
                      ? `${filters.skills.length} selected`
                      : "Select skills..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-gray-800 border-orange-500/30">
                  <Command className="bg-gray-800">
                    <CommandInput placeholder="Search skills..." className="text-white" />
                    <CommandEmpty className="text-white/60">No skills found.</CommandEmpty>
                    <CommandGroup className="max-h-48 overflow-auto">
                      {availableSkills.map((skill) => (
                        <CommandItem
                          key={skill}
                          onSelect={() => {
                            setFilters(prev => ({
                              ...prev,
                              skills: prev.skills.includes(skill)
                                ? prev.skills.filter(s => s !== skill)
                                : [...prev.skills, skill]
                            }));
                          }}
                          className="text-white hover:bg-white/10"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              filters.skills.includes(skill) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {skill}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Score Range Filter */}
            <div className="space-y-4">
              <Label className="text-white font-medium">
                Score Range: {filters.scoreRange[0]} - {filters.scoreRange[1]}/10
              </Label>
              <Slider
                value={filters.scoreRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, scoreRange: value as [number, number] }))}
                min={5}
                max={10}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
