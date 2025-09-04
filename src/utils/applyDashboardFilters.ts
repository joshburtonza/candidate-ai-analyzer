import { CVUpload } from '@/types/candidate';
import { FeatureFlags } from '@/config/featureFlags';
import { VerticalConfig } from '@/config/verticals';
import { FilterPreset } from '@/config/filterPresets';
import { filterValidCandidates, filterAllQualifiedCandidates, normalizeFirstLastName, isBestCandidate } from '@/utils/candidateFilters';
import { filterVerticalCandidates, isPresetCandidate } from '@/utils/verticalFilters';
import { getEffectiveDateString } from '@/utils/dateUtils';
import { hasCompletedTeachingDegree } from '@/config/teachingQuals';

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

// Deterministic sorting: score desc → created_at desc → name asc
const stableSort = (uploads: CVUpload[]): CVUpload[] => {
  return [...uploads].sort((a, b) => {
    const scoreA = parseFloat(a.extracted_json?.score || '0');
    const scoreB = parseFloat(b.extracted_json?.score || '0');
    if (scoreA !== scoreB) return scoreB - scoreA;
    
    const dateA = getEffectiveDateString(a);
    const dateB = getEffectiveDateString(b);
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    
    const nameA = a.extracted_json?.candidate_name || '';
    const nameB = b.extracted_json?.candidate_name || '';
    return nameA.localeCompare(nameB);
  });
};

// Remove duplicates based on first and last name, keeping the best one
const dedupeByFirstLast = (uploads: CVUpload[]): CVUpload[] => {
  const map = new Map<string, CVUpload>();

  for (const upload of uploads) {
    if (!upload.extracted_json?.candidate_name) continue;
    
    const normalizedName = normalizeFirstLastName(upload.extracted_json.candidate_name);
    if (!normalizedName) continue;

    const existing = map.get(normalizedName);
    if (!existing) {
      map.set(normalizedName, upload);
      continue;
    }

    // Keep the better candidate (higher score, newer date, alphabetical name)
    const scoreA = parseFloat(upload.extracted_json?.score || '0');
    const scoreB = parseFloat(existing.extracted_json?.score || '0');
    if (scoreA !== scoreB) {
      if (scoreA > scoreB) map.set(normalizedName, upload);
      continue;
    }

    const dateA = getEffectiveDateString(upload);
    const dateB = getEffectiveDateString(existing);
    if (dateA !== dateB) {
      if (dateA > dateB) map.set(normalizedName, upload);
      continue;
    }

    const nameA = upload.extracted_json?.candidate_name || '';
    const nameB = existing.extracted_json?.candidate_name || '';
    if (nameA.localeCompare(nameB) < 0) {
      map.set(normalizedName, upload);
    }
  }

  return Array.from(map.values());
};

// Check if vertical is education/teachers
const isEducationVertical = (verticalId?: string, presetId?: string): boolean => {
  const v = (verticalId ?? '').toLowerCase();
  const p = (presetId ?? '').toLowerCase();
  return v === 'education' || v === 'teachers' || v === 'teaching' || 
         p.includes('education') || p.includes('teacher');
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

  // Step 1: Apply advanced filters ONLY for Best tab
  if (view === 'best' && featureFlags.enableAdvancedFilters && advanced) {
    filtered = applyAdvanced(filtered, advanced);
  }

  // Step 2: View-specific processing
  if (view === 'best') {
    console.log(`Best Candidates filtering started with ${filtered.length} items`);
    
    // Always require name for Best candidates
    const beforeNameFilter = filtered.length;
    filtered = filtered.filter(upload => {
      const candidateName = upload.extracted_json?.candidate_name?.trim();
      return candidateName && candidateName.length > 0;
    });
    console.log(`After name filter: ${filtered.length} (removed ${beforeNameFilter - filtered.length})`);

    // HARD GATE: Teaching degree completion for education verticals
    const vertical = verticalConfig?.id || presetConfig?.verticalId;
    if (isEducationVertical(vertical, presetConfig?.id)) {
      const beforeDegreeFilter = filtered.length;
      filtered = filtered.filter(upload => {
        if (!upload.extracted_json) return false;
        const hasTeachingDegree = hasCompletedTeachingDegree(upload.extracted_json as unknown as Record<string, unknown>);
        console.log(`Teaching degree check for ${upload.extracted_json?.candidate_name}: ${hasTeachingDegree}`);
        return hasTeachingDegree;
      });
      console.log(`After teaching degree filter: ${filtered.length} (removed ${beforeDegreeFilter - filtered.length})`);
    }

    // Apply strict rules if enabled
    if (strict) {
      const beforeStrictFilter = filtered.length;
      if (featureFlags.enableFilterPresets && presetConfig) {
        filtered = filtered.filter(upload => {
          const passes = isPresetCandidate(upload, presetConfig, verticalConfig);
          console.log(`Preset filter for ${upload.extracted_json?.candidate_name}: ${passes}`);
          return passes;
        });
      } else if (featureFlags.enableVerticals && verticalConfig) {
        filtered = filterVerticalCandidates(filtered, verticalConfig, strict);
      } else {
        // Apply original best candidate filtering for strict mode
        filtered = filtered.filter(upload => {
          const passes = isBestCandidate(upload);
          console.log(`Best candidate filter for ${upload.extracted_json?.candidate_name}: ${passes}`);
          return passes;
        });
      }
      console.log(`After strict filter: ${filtered.length} (removed ${beforeStrictFilter - filtered.length})`);
    }

    // Single deduper for Best only
    const beforeDedupeFilter = filtered.length;
    filtered = dedupeByFirstLast(filtered);
    console.log(`After deduplication: ${filtered.length} (removed ${beforeDedupeFilter - filtered.length})`);
    
    console.log(`Best Candidates filtering completed: ${filtered.length} final results`);
  } else {
    // For 'allUploads', no filters – return items as-is
    filtered = items;
    console.log(`All Uploads: returning ${filtered.length} items without filtering`);
  }

  // Step 3: Apply deterministic stable sort
  return stableSort(filtered);
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