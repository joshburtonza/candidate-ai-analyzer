import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X, MapPin, Award, Briefcase, Mail, Calendar } from 'lucide-react';
import { AdvancedFilterState } from '@/utils/applyDashboardFilters';

interface AdvancedFiltersProps {
  value: AdvancedFilterState;
  onChange: (next: AdvancedFilterState) => void;
  sourceEmailOptions: string[];
  availableCountries: string[];
  availableSkills: string[];
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ 
  value, 
  onChange, 
  sourceEmailOptions,
  availableCountries,
  availableSkills
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = useCallback((updates: Partial<AdvancedFilterState>) => {
    onChange({ ...value, ...updates });
  }, [value, onChange]);

  const clearFilters = useCallback(() => {
    onChange({});
  }, [onChange]);

  const removeCountry = useCallback((country: string) => {
    const newCountries = (value.countries || []).filter(c => c !== country);
    updateFilter({ countries: newCountries.length > 0 ? newCountries : undefined });
  }, [value.countries, updateFilter]);

  const removeSkill = useCallback((skill: string) => {
    const newSkills = (value.skills || []).filter(s => s !== skill);
    updateFilter({ skills: newSkills.length > 0 ? newSkills : undefined });
  }, [value.skills, updateFilter]);

  const removeSourceEmail = useCallback((email: string) => {
    const newEmails = (value.sourceEmails || []).filter(e => e !== email);
    updateFilter({ sourceEmails: newEmails.length > 0 ? newEmails : undefined });
  }, [value.sourceEmails, updateFilter]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (value.search && value.search.length >= 2) count++;
    if (value.countries?.length) count++;
    if (value.skills?.length) count++;
    if (value.sourceEmails?.length) count++;
    if (value.dateFrom || value.dateTo) count++;
    if ((value.scoreMin !== undefined && value.scoreMin > 5) || (value.scoreMax !== undefined && value.scoreMax < 10)) count++;
    return count;
  }, [value]);

  return (
    <div className="glass-card elegant-border p-6 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search candidates..."
              value={value.search || ''}
              onChange={(e) => updateFilter({ search: e.target.value || undefined })}
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
          {/* Date Range Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand" />
              <label className="text-sm font-medium text-white">Date Range</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/70 mb-1 block">From</label>
                <Input
                  type="date"
                  value={value.dateFrom || ''}
                  onChange={(e) => updateFilter({ dateFrom: e.target.value || null })}
                  className="bg-white/5 border-brand/30 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-white/70 mb-1 block">To</label>
                <Input
                  type="date"
                  value={value.dateTo || ''}
                  onChange={(e) => updateFilter({ dateTo: e.target.value || null })}
                  className="bg-white/5 border-brand/30 text-white"
                />
              </div>
            </div>
          </div>

          {/* Source Email Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand" />
              <label className="text-sm font-medium text-white">Source Email</label>
            </div>
            <Select
              onValueChange={(selectedEmail) => {
                const current = value.sourceEmails || [];
                if (!current.includes(selectedEmail)) {
                  updateFilter({ sourceEmails: [...current, selectedEmail] });
                }
              }}
            >
              <SelectTrigger className="bg-white/5 border-brand/30 text-white">
                <SelectValue placeholder="Select source emails..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-brand/30 text-white max-h-48 overflow-auto">
                {sourceEmailOptions.map(email => (
                  <SelectItem key={email} value={email}>
                    {email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {value.sourceEmails && value.sourceEmails.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {value.sourceEmails.map(email => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="bg-purple-500/20 text-purple-300 border-purple-500/30"
                  >
                    {email}
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer"
                      onClick={() => removeSourceEmail(email)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Country Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand" />
              <label className="text-sm font-medium text-white">Countries</label>
            </div>
            <Select
              onValueChange={(selectedCountry) => {
                const current = value.countries || [];
                if (!current.includes(selectedCountry)) {
                  updateFilter({ countries: [...current, selectedCountry] });
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
            {value.countries && value.countries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {value.countries.map(country => (
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
              <label className="text-sm font-medium text-white">Skills (AND)</label>
            </div>
            <Select
              onValueChange={(selectedSkill) => {
                const current = value.skills || [];
                if (!current.includes(selectedSkill)) {
                  updateFilter({ skills: [...current, selectedSkill] });
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
            {value.skills && value.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {value.skills.map(skill => (
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
                value={[value.scoreMin ?? 5, value.scoreMax ?? 10]}
                onValueChange={(range) => updateFilter({ 
                  scoreMin: range[0] === 5 ? undefined : range[0], 
                  scoreMax: range[1] === 10 ? undefined : range[1] 
                })}
                min={5}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-white/70">
                <span>{value.scoreMin ?? 5}/10</span>
                <span>{value.scoreMax ?? 10}/10</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};