export interface VerticalConfig {
  id: string;
  name: string;
  allowedCountries: string[];
  minScore: number;
  includeKeywords: string[];
  excludeKeywords: string[];
  requiredQualifications: string[];
  minYearsExperience: number;
  requireCurrentRole: boolean;
  currentRoleKeywords: string[];
}

export const VERTICALS: Record<string, VerticalConfig> = {
  education: {
    id: 'education',
    name: 'Education',
    allowedCountries: [
      'united kingdom', 'uk', 'england', 'scotland', 'wales', 'northern ireland',
      'south africa', 'australia', 'new zealand', 'ireland', 'canada'
    ],
    minScore: 6,
    includeKeywords: ['teacher', 'teaching', 'education', 'school', 'classroom', 'curriculum'],
    excludeKeywords: ['plumber', 'mechanic', 'driver', 'cleaner'],
    requiredQualifications: ['degree', 'b.ed', 'pgce', 'education'],
    minYearsExperience: 2,
    requireCurrentRole: true,
    currentRoleKeywords: ['teacher', 'teaching', 'education', 'school']
  },
  
  generic: {
    id: 'generic',
    name: 'Generic',
    allowedCountries: [], // Empty = allow all
    minScore: 5,
    includeKeywords: [],
    excludeKeywords: [],
    requiredQualifications: [],
    minYearsExperience: 0,
    requireCurrentRole: false,
    currentRoleKeywords: []
  },
  
  tech: {
    id: 'tech',
    name: 'Technology',
    allowedCountries: [],
    minScore: 6,
    includeKeywords: ['developer', 'engineer', 'programmer', 'software', 'coding', 'javascript', 'python', 'react'],
    excludeKeywords: ['teacher', 'driver', 'cleaner'],
    requiredQualifications: ['computer science', 'engineering', 'software'],
    minYearsExperience: 1,
    requireCurrentRole: false,
    currentRoleKeywords: ['developer', 'engineer', 'programmer', 'software']
  },
  
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare',
    allowedCountries: [],
    minScore: 7,
    includeKeywords: ['nurse', 'doctor', 'medical', 'healthcare', 'clinical', 'patient'],
    excludeKeywords: ['teacher', 'driver', 'cleaner'],
    requiredQualifications: ['nursing', 'medical', 'healthcare'],
    minYearsExperience: 1,
    requireCurrentRole: false,
    currentRoleKeywords: ['nurse', 'doctor', 'medical', 'healthcare']
  },
  
  sales: {
    id: 'sales',
    name: 'Sales',
    allowedCountries: [],
    minScore: 5,
    includeKeywords: ['sales', 'business development', 'account manager', 'customer', 'revenue'],
    excludeKeywords: ['teacher', 'driver', 'cleaner'],
    requiredQualifications: [],
    minYearsExperience: 1,
    requireCurrentRole: false,
    currentRoleKeywords: ['sales', 'business development', 'account']
  }
};

export const DEFAULT_VERTICAL = 'education';