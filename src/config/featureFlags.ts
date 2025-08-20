export interface FeatureFlags {
  enableVerticals: boolean;
  enableFilterPresets: boolean;
  enableDynamicIngestion: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableVerticals: false,
  enableFilterPresets: false, 
  enableDynamicIngestion: false,
};

// Environment-based feature flags (can be overridden by URL params or user settings)
export const getEnvironmentFeatureFlags = (): Partial<FeatureFlags> => {
  const flags: Partial<FeatureFlags> = {};
  
  // Check URL params for instant kill switches
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('verticals') === 'true') flags.enableVerticals = true;
    if (params.get('verticals') === 'false') flags.enableVerticals = false;
    
    if (params.get('presets') === 'true') flags.enableFilterPresets = true;
    if (params.get('presets') === 'false') flags.enableFilterPresets = false;
    
    if (params.get('dynamic') === 'true') flags.enableDynamicIngestion = true;
    if (params.get('dynamic') === 'false') flags.enableDynamicIngestion = false;
  }
  
  return flags;
};