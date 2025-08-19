import { CVUpload } from '@/types/candidate';
import { VerticalConfig } from '@/config/verticals';
import { FilterPreset } from '@/config/filterPresets';
import { 
  isQualifiedCandidate, 
  isTestCandidate, 
  hasMinimumScore,
  isFromApprovedCountry
} from './candidateFilters';

// Helper function to normalize country data for matching
const normalizeCountryData = (countriesData: string | string[] | null | undefined): string => {
  if (!countriesData) return '';
  
  if (typeof countriesData === 'string') {
    return countriesData.toLowerCase().trim();
  } else if (Array.isArray(countriesData)) {
    return (countriesData as string[]).join(' ').toLowerCase().trim();
  }
  
  return '';
};

// Vertical-aware filtering functions
export const hasVerticalScore = (upload: CVUpload, config: VerticalConfig): boolean => {
  if (!upload.extracted_json?.score) return false;
  
  const score = upload.extracted_json.score;
  const scoreMatch = score.match(/(\d+(?:\.\d+)?)/);
  if (!scoreMatch) return false;
  
  const numericScore = parseFloat(scoreMatch[1]);
  return numericScore >= config.minScore;
};

export const hasVerticalKeywords = (upload: CVUpload, config: VerticalConfig): boolean => {
  if (!upload.extracted_json) return false;
  
  const data = upload.extracted_json;
  const searchText = [
    data.candidate_name,
    data.current_employment,
    data.job_history,
    data.educational_qualifications
  ].join(' ').toLowerCase();

  // Check exclude keywords first - if found, reject
  if (config.excludeKeywords.length > 0) {
    const hasExcludedKeyword = config.excludeKeywords.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
    if (hasExcludedKeyword) return false;
  }

  // If no include keywords specified, accept (after exclude check)
  if (config.includeKeywords.length === 0) return true;

  // Check include keywords
  return config.includeKeywords.some(keyword => 
    searchText.includes(keyword.toLowerCase())
  );
};

export const hasVerticalQualifications = (upload: CVUpload, config: VerticalConfig): boolean => {
  if (config.requiredQualifications.length === 0) return true;
  
  if (!upload.extracted_json?.educational_qualifications) return false;
  
  const qualifications = upload.extracted_json.educational_qualifications.toLowerCase();
  
  return config.requiredQualifications.some(qual => 
    qualifications.includes(qual.toLowerCase())
  );
};

export const hasVerticalExperience = (upload: CVUpload, config: VerticalConfig): boolean => {
  if (config.minYearsExperience === 0) return true;
  
  if (!upload.extracted_json?.job_history) return false;
  
  // Extract years from job history string
  const jobHistory = upload.extracted_json.job_history;
  const yearMatches = jobHistory.match(/(\d+)\s*year[s]?/gi);
  
  if (!yearMatches) return false;
  
  const totalYears = yearMatches.reduce((sum, match) => {
    const years = parseInt(match.match(/\d+/)?.[0] || '0');
    return sum + years;
  }, 0);
  
  return totalYears >= config.minYearsExperience;
};

export const hasVerticalCurrentRole = (upload: CVUpload, config: VerticalConfig): boolean => {
  if (!config.requireCurrentRole || config.currentRoleKeywords.length === 0) return true;
  
  if (!upload.extracted_json?.current_employment) return false;
  
  const currentRole = upload.extracted_json.current_employment.toLowerCase();
  
  return config.currentRoleKeywords.some(keyword => 
    currentRole.includes(keyword.toLowerCase())
  );
};

export const hasVerticalCountry = (upload: CVUpload, config: VerticalConfig): boolean => {
  // If no country restrictions, allow all
  if (config.allowedCountries.length === 0) return true;
  
  if (!upload.extracted_json?.countries) return false;
  
  const normalizedCountries = normalizeCountryData(upload.extracted_json.countries);
  
  return config.allowedCountries.some(allowedCountry =>
    normalizedCountries.includes(allowedCountry.toLowerCase())
  );
};

export const isVerticalCandidate = (upload: CVUpload, config: VerticalConfig, strict: boolean = false): boolean => {
  // Always check basic qualifications first
  if (!isQualifiedCandidate(upload)) return false;
  if (isTestCandidate(upload)) return false;
  
  // Apply vertical-specific rules
  if (!hasVerticalScore(upload, config)) return false;
  if (!hasVerticalKeywords(upload, config)) return false;
  if (!hasVerticalCountry(upload, config)) return false;
  
  // Apply strict rules if enabled
  if (strict) {
    if (!hasVerticalQualifications(upload, config)) return false;
    if (!hasVerticalExperience(upload, config)) return false;
    if (!hasVerticalCurrentRole(upload, config)) return false;
  }
  
  return true;
};

export const isPresetCandidate = (upload: CVUpload, preset: FilterPreset, config: VerticalConfig): boolean => {
  // Start with base vertical rules
  const effectiveConfig = preset.customRules ? {
    ...config,
    ...preset.customRules
  } : config;
  
  return isVerticalCandidate(upload, effectiveConfig, preset.isStrict);
};

// Backwards compatible wrappers that fall back to original logic when no config provided
export const filterVerticalCandidates = (
  uploads: CVUpload[], 
  config?: VerticalConfig, 
  strict: boolean = false
): CVUpload[] => {
  if (!config) {
    // Fallback to original filtering logic
    const { filterValidCandidates } = require('./candidateFilters');
    return filterValidCandidates(uploads);
  }
  
  const seenNames = new Set<string>();
  
  return uploads.filter(upload => {
    if (!isVerticalCandidate(upload, config, strict)) return false;
    
    // Deduplicate by normalized name
    const normalizedName = upload.extracted_json?.candidate_name 
      ? upload.extracted_json.candidate_name.toLowerCase().trim().replace(/\s+/g, '_')
      : '';
      
    if (normalizedName && seenNames.has(normalizedName)) return false;
    if (normalizedName) seenNames.add(normalizedName);
    
    return true;
  }).sort((a, b) => {
    // Sort by received_date if available, otherwise by id (newest first)
    const dateA = a.received_date || a.id;
    const dateB = b.received_date || b.id;
    return dateB.localeCompare(dateA);
  });
};