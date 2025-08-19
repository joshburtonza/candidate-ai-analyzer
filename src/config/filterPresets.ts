export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  verticalId: string;
  isStrict: boolean;
  customRules?: {
    minScore?: number;
    allowedCountries?: string[];
    includeKeywords?: string[];
    excludeKeywords?: string[];
    requiredQualifications?: string[];
    minYearsExperience?: number;
    requireCurrentRole?: boolean;
    currentRoleKeywords?: string[];
  };
}

export const BUILT_IN_PRESETS: Record<string, FilterPreset> = {
  'education-legacy': {
    id: 'education-legacy',
    name: 'Education (Legacy)',
    description: 'Original strict teaching requirements - the current system',
    verticalId: 'education',
    isStrict: true,
  },
  
  'education-strict': {
    id: 'education-strict',
    name: 'Education Strict',
    description: 'Strict teaching requirements with B.Ed/PGCE, current role, 2+ years experience',
    verticalId: 'education',
    isStrict: true,
  },
  
  'education-flexible': {
    id: 'education-flexible',
    name: 'Education Flexible',
    description: 'Relaxed teaching requirements - degree with teaching experience',
    verticalId: 'education',
    isStrict: false,
    customRules: {
      minYearsExperience: 1,
      requireCurrentRole: false,
    }
  },
  
  'tech-senior': {
    id: 'tech-senior',
    name: 'Senior Technology',
    description: 'Senior tech roles - 3+ years experience in software development',
    verticalId: 'tech',
    isStrict: true,
    customRules: {
      minYearsExperience: 3,
      minScore: 7,
    }
  },
  
  'tech-junior': {
    id: 'tech-junior',
    name: 'Junior Technology',
    description: 'Junior tech roles - basic requirements for entry-level positions',
    verticalId: 'tech',
    isStrict: false,
    customRules: {
      minYearsExperience: 0,
      minScore: 5,
    }
  },
  
  'generic-all': {
    id: 'generic-all',
    name: 'All Candidates',
    description: 'Minimal filtering - shows all candidates with basic qualifications',
    verticalId: 'generic',
    isStrict: false,
  }
};

export const DEFAULT_PRESET = 'education-legacy';