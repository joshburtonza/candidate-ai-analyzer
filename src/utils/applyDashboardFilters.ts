import { CVUpload } from '@/types/candidate';
import { FeatureFlags } from '@/config/featureFlags';
import { VerticalConfig } from '@/config/verticals';
import { FilterPreset } from '@/config/filterPresets';
import { filterValidCandidates, filterAllQualifiedCandidates, normalizeFirstLastName } from '@/utils/candidateFilters';
import { filterVerticalCandidates, isPresetCandidate } from '@/utils/verticalFilters';
import { getEffectiveDateString } from '@/utils/dateUtils';

export type AdvancedFilterState = {
  search?: string;
  countries?: string[];
  skills?: string[];
  scoreMin?: number;
  scoreMax?: number;
  sourceEmails?: string[];
  dateFrom?: string | null;
  dateTo?: string | null;
};

// Helper to safely normalize arrays from candidate data
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

// Robust score parser that handles different formats
const parseScore = (scoreStr?: string): number => {
  if (!scoreStr) return 0;
  
  const str = String(scoreStr).trim();
  
  // Handle "8/10" format
  if (str.includes('/')) {
    const [num, denom] = str.split('/');
    const score = parseFloat(num) / parseFloat(denom) * 10;
    return Math.round(score);
  }
  
  // Handle regular numbers
  const score = parseFloat(str);
  if (isNaN(score)) return 0;
  
  // If score is > 10, assume it's out of 100 and convert
  return score > 10 ? Math.round(score / 10) : Math.round(score);
};

// Normalize source email for case-insensitive comparison
const normalizeEmail = (email?: string): string => {
  return (email || '').toLowerCase().trim();
};

// Check if date falls within range (inclusive)
const isDateInRange = (upload: CVUpload, dateFrom?: string | null, dateTo?: string | null): boolean => {
  if (!dateFrom && !dateTo) return true;
  
  const uploadDateStr = getEffectiveDateString(upload);
  if (!uploadDateStr) return true;
  
  if (dateFrom && uploadDateStr < dateFrom) return false;
  if (dateTo && uploadDateStr > dateTo) return false;
  
  return true;
};

// Remove duplicates based on first and last name
const dedupeByFirstLast = (uploads: CVUpload[]): CVUpload[] => {
  const seen = new Set<string>();
  const uniqueUploads: CVUpload[] = [];

  for (const upload of uploads) {
    if (!upload.extracted_json?.candidate_name) continue;
    
    const normalizedName = normalizeFirstLastName(upload.extracted_json.candidate_name);
    
    if (normalizedName && seen.has(normalizedName)) {
      continue;
    }
    
    if (normalizedName) {
      seen.add(normalizedName);
    }
    uniqueUploads.push(upload);
  }

  return uniqueUploads;
};

// Apply advanced filters
export const applyAdvanced = (uploads: CVUpload[], advanced: AdvancedFilterState): CVUpload[] => {
  let filtered = uploads;

  // Search filter (requires 2+ chars)
  if (advanced.search && advanced.search.trim().length >= 2) {
    const query = advanced.search.toLowerCase();
    filtered = filtered.filter(upload => {
      const data = upload.extracted_json;
      if (!data) return false;
      
      return (
        data.candidate_name?.toLowerCase().includes(query) ||
        data.email_address?.toLowerCase().includes(query) ||
        normalizeToArray(data.current_employment).some(skill => skill.toLowerCase().includes(query)) ||
        normalizeToArray(data.countries).some(country => country.toLowerCase().includes(query))
      );
    });
  }

  // Countries filter (OR logic)
  if (advanced.countries && advanced.countries.length > 0) {
    filtered = filtered.filter(upload => {
      const countries = normalizeToArray(upload.extracted_json?.countries);
      return advanced.countries!.some(selectedCountry =>
        countries.some(country => country.toLowerCase().includes(selectedCountry.toLowerCase()))
      );
    });
  }

  // Skills filter (AND logic)
  if (advanced.skills && advanced.skills.length > 0) {
    filtered = filtered.filter(upload => {
      const skills = normalizeToArray(upload.extracted_json?.current_employment);
      return advanced.skills!.every(selectedSkill =>
        skills.some(skill => skill.toLowerCase().includes(selectedSkill.toLowerCase()))
      );
    });
  }

  // Score range filter
  if (advanced.scoreMin !== undefined || advanced.scoreMax !== undefined) {
    const min = advanced.scoreMin ?? 5;
    const max = advanced.scoreMax ?? 10;
    
    filtered = filtered.filter(upload => {
      const score = parseScore(upload.extracted_json?.score);
      return score >= min && score <= max;
    });
  }

  // Source email filter (case-insensitive exact match)
  if (advanced.sourceEmails && advanced.sourceEmails.length > 0) {
    const normalizedSelected = advanced.sourceEmails.map(normalizeEmail);
    
    filtered = filtered.filter(upload => {
      const sourceEmail = normalizeEmail(upload.source_email) || 
                         normalizeEmail(upload.extracted_json?.email_address);
      return normalizedSelected.includes(sourceEmail);
    });
  }

  // Date range filter
  if (advanced.dateFrom || advanced.dateTo) {
    filtered = filtered.filter(upload => isDateInRange(upload, advanced.dateFrom, advanced.dateTo));
  }

  return filtered;
};

// Main dashboard filtering function
export const applyDashboardFilters = ({
  items,
  view,
  featureFlags,
  verticalConfig,
  presetConfig,
  strict = false,
  advanced,
}: {
  items: CVUpload[];
  view: 'best' | 'allUploads';
  featureFlags: FeatureFlags;
  verticalConfig?: VerticalConfig;
  presetConfig?: FilterPreset;
  strict?: boolean;
  advanced?: AdvancedFilterState;
}): CVUpload[] => {
  let filtered = items;

  // Step 1: Base valid filter
  if (view === 'best') {
    if (!featureFlags.enableVerticals && !featureFlags.enableFilterPresets) {
      filtered = filterAllQualifiedCandidates(filtered);
    } else if (featureFlags.enableFilterPresets && presetConfig?.id === 'education-legacy') {
      filtered = filterAllQualifiedCandidates(filtered);
    } else if (featureFlags.enableFilterPresets && presetConfig) {
      // Preset filtering will be applied in next step
      filtered = filterValidCandidates(filtered);
    } else if (featureFlags.enableVerticals && verticalConfig) {
      // Vertical filtering will be applied in next step
      filtered = filterValidCandidates(filtered);
    } else {
      filtered = filterAllQualifiedCandidates(filtered);
    }
  } else {
    // For 'allUploads', apply minimal base filtering
    filtered = filterValidCandidates(filtered);
  }

  // Step 2: Vertical OR Preset rules
  if (view === 'best' && featureFlags.enableFilterPresets && presetConfig) {
    filtered = filtered.filter(upload => 
      isPresetCandidate(upload, presetConfig, verticalConfig)
    );
  } else if (view === 'best' && featureFlags.enableVerticals && verticalConfig) {
    filtered = filterVerticalCandidates(filtered, verticalConfig, strict);
  }

  // Step 3: Advanced filters (if enabled)
  if (featureFlags.enableAdvancedFilters && advanced) {
    filtered = applyAdvanced(filtered, advanced);
  }

  // Step 4: View-specific constraints
  if (view === 'best') {
    // Require non-empty normalized name
    filtered = filtered.filter(upload => {
      const candidateName = upload.extracted_json?.candidate_name?.trim();
      return candidateName && candidateName.length > 0;
    });
    
    // Dedupe by first_last
    filtered = dedupeByFirstLast(filtered);
  }
  // 'allUploads' has no dedupe and no name requirement

  return filtered;
};

// Extract unique source emails from dataset for filter options
export const extractSourceEmailOptions = (uploads: CVUpload[]): string[] => {
  const emailSet = new Set<string>();
  
  uploads.forEach(upload => {
    const sourceEmail = upload.source_email || upload.extracted_json?.email_address;
    if (sourceEmail) {
      emailSet.add(normalizeEmail(sourceEmail));
    }
  });
  
  return Array.from(emailSet).filter(Boolean).sort();
};