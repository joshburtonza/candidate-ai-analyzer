
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Save, BookOpen, X, Filter } from 'lucide-react';
import { AdvancedFilters } from '@/types/batch';
import { useToast } from '@/hooks/use-toast';

interface AdvancedSearchPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  savedSearches: any[];
  onSaveSearch: (name: string) => Promise<void>;
  onLoadSearch: (criteria: any) => void;
  availableSkills: string[];
  availableCountries: string[];
  availableTags: string[];
}

const CANDIDATE_STATUSES = ['new', 'reviewing', 'shortlisted', 'interviewed', 'hired', 'rejected'];

export const AdvancedSearchPanel = ({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  savedSearches,
  onSaveSearch,
  onLoadSearch,
  availableSkills,
  availableCountries,
  availableTags,
}: AdvancedSearchPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const { toast } = useToast();

  const addSkill = (skill: string) => {
    if (skill && !filters.skills.includes(skill)) {
      onFiltersChange({
        ...filters,
        skills: [...filters.skills, skill]
      });
    }
  };

  const removeSkill = (skill: string) => {
    onFiltersChange({
      ...filters,
      skills: filters.skills.filter(s => s !== skill)
    });
  };

  const addCountry = (country: string) => {
    if (country && !filters.countries.includes(country)) {
      onFiltersChange({
        ...filters,
        countries: [...filters.countries, country]
      });
    }
  };

  const removeCountry = (country: string) => {
    onFiltersChange({
      ...filters,
      countries: filters.countries.filter(c => c !== country)
    });
  };

  const addTag = (tag: string) => {
    if (tag && !filters.tags.includes(tag)) {
      onFiltersChange({
        ...filters,
        tags: [...filters.tags, tag]
      });
    }
  };

  const removeTag = (tag: string) => {
    onFiltersChange({
      ...filters,
      tags: filters.tags.filter(t => t !== tag)
    });
  };

  const addCandidateStatus = (status: string) => {
    if (status && !filters.candidateStatus.includes(status)) {
      onFiltersChange({
        ...filters,
        candidateStatus: [...filters.candidateStatus, status]
      });
    }
  };

  const removeCandidateStatus = (status: string) => {
    onFiltersChange({
      ...filters,
      candidateStatus: filters.candidateStatus.filter(s => s !== status)
    });
  };

  const clearAllFilters = () => {
    onSearchChange('');
    onFiltersChange({
      scoreRange: [0, 10],
      skills: [],
      countries: [],
      candidateStatus: [],
      tags: [],
    });
  };

  const handleSaveSearch = async () => {
    if (!saveSearchName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the search",
        variant: "destructive",
      });
      return;
    }

    try {
      await onSaveSearch(saveSearchName);
      setSaveSearchName('');
      toast({
        title: "Success",
        description: "Search saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save search",
        variant: "destructive",
      });
    }
  };

  const activeFiltersCount = [
    ...filters.skills,
    ...filters.countries,
    ...filters.candidateStatus,
    ...filters.tags,
    ...(filters.scoreRange[0] > 0 || filters.scoreRange[1] < 10 ? ['score'] : []),
    ...(filters.dateRange ? ['date'] : []),
  ].length;

  return (
    <Card className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search candidates by name, skills, email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-600 text-white"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
              <BookOpen className="w-4 h-4 mr-2" />
              Saved
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Saved Searches</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search name..."
                  value={saveSearchName}
                  onChange={(e) => setSaveSearchName(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                />
                <Button onClick={handleSaveSearch} className="bg-orange-500 hover:bg-orange-600">
                  <Save className="w-4 h-4 mr-2" />
                  Save Current
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {savedSearches.map((search) => (
                  <div key={search.id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <span className="text-white">{search.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onLoadSearch(search.search_criteria)}
                      className="text-orange-400 hover:bg-orange-500/10"
                    >
                      Load
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isExpanded && (
        <div className="space-y-6 pt-4 border-t border-gray-700">
          {/* Score Range */}
          <div>
            <Label className="text-white mb-2 block">Score Range: {filters.scoreRange[0]} - {filters.scoreRange[1]}</Label>
            <Slider
              value={filters.scoreRange}
              onValueChange={(value) => onFiltersChange({ ...filters, scoreRange: value as [number, number] })}
              max={10}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Skills Filter */}
          <div>
            <Label className="text-white mb-2 block">Skills</Label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {filters.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="bg-orange-500/20 text-orange-400">
                  {skill}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer"
                    onClick={() => removeSkill(skill)}
                  />
                </Badge>
              ))}
            </div>
            <Select onValueChange={addSkill}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Add skill filter..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {availableSkills.map((skill) => (
                  <SelectItem key={skill} value={skill} className="text-white">
                    {skill}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Countries Filter */}
          <div>
            <Label className="text-white mb-2 block">Countries</Label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {filters.countries.map((country) => (
                <Badge key={country} variant="secondary" className="bg-orange-500/20 text-orange-400">
                  {country}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer"
                    onClick={() => removeCountry(country)}
                  />
                </Badge>
              ))}
            </div>
            <Select onValueChange={addCountry}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Add country filter..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {availableCountries.map((country) => (
                  <SelectItem key={country} value={country} className="text-white">
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Candidate Status Filter */}
          <div>
            <Label className="text-white mb-2 block">Candidate Status</Label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {filters.candidateStatus.map((status) => (
                <Badge key={status} variant="secondary" className="bg-orange-500/20 text-orange-400">
                  {status}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer"
                    onClick={() => removeCandidateStatus(status)}
                  />
                </Badge>
              ))}
            </div>
            <Select onValueChange={addCandidateStatus}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Add status filter..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {CANDIDATE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status} className="text-white">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags Filter */}
          <div>
            <Label className="text-white mb-2 block">Tags</Label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {filters.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-orange-500/20 text-orange-400">
                  {tag}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <Select onValueChange={addTag}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Add tag filter..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {availableTags.map((tag) => (
                  <SelectItem key={tag} value={tag} className="text-white">
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="border-gray-600 text-gray-400 hover:bg-gray-800"
            >
              Clear All Filters
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
