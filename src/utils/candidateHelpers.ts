import { CandidateData } from '@/types/candidate';

export const extractDegree = (data: CandidateData): string => {
  const education = data.educational_qualifications || '';
  
  // Extract degree information
  const degreePatterns = [
    /bachelor\s+of\s+education/gi,
    /b\.?\s*ed\.?/gi,
    /pgce/gi,
    /post\s+graduate\s+certificate\s+in\s+education/gi,
    /master\s+of\s+education/gi,
    /m\.?\s*ed\.?/gi,
    /diploma\s+in\s+education/gi,
    /teaching\s+qualification/gi,
    /bachelor\s+of\s+arts/gi,
    /bachelor\s+of\s+science/gi,
    /b\.?\s*a\.?/gi,
    /b\.?\s*sc\.?/gi,
    /master\s+of\s+arts/gi,
    /master\s+of\s+science/gi,
    /m\.?\s*a\.?/gi,
    /m\.?\s*sc\.?/gi
  ];

  for (const pattern of degreePatterns) {
    const match = education.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return 'No Degree';
};

export const extractYearsExperience = (data: CandidateData): string => {
  const jobHistory = data.job_history || '';
  
  // Extract years of teaching experience
  const experiencePatterns = [
    /(\d+)\s*years?\s*(?:of\s*)?(?:teaching|experience)/gi,
    /(?:teaching|experience)\s*(?:for\s*)?(\d+)\s*years?/gi,
    /(\d+)\+?\s*years?\s*teacher/gi,
    /teacher\s*(?:for\s*)?(\d+)\s*years?/gi
  ];

  let maxExperience = 0;
  
  for (const pattern of experiencePatterns) {
    const matches = [...jobHistory.matchAll(pattern)];
    for (const match of matches) {
      const years = parseInt(match[1]);
      if (!isNaN(years)) {
        maxExperience = Math.max(maxExperience, years);
      }
    }
  }

  if (maxExperience === 0) {
    return 'Newly Qualified';
  }

  return `${maxExperience} years`;
};

export const extractTeachingSubject = (data: CandidateData): string => {
  const skills = data.skill_set || '';
  const jobHistory = data.job_history || '';
  const combinedText = `${skills} ${jobHistory}`.toLowerCase();
  
  // Common teaching subjects
  const subjects = [
    'mathematics', 'math', 'maths',
    'english', 'language arts', 'literacy',
    'science', 'physics', 'chemistry', 'biology',
    'history', 'social studies',
    'geography',
    'art', 'visual arts',
    'music',
    'physical education', 'pe', 'sports',
    'drama', 'theatre',
    'computer science', 'ict', 'technology',
    'french', 'spanish', 'german', 'languages',
    'religious education', 're',
    'economics', 'business studies',
    'psychology',
    'philosophy'
  ];

  // Look for subject mentions
  for (const subject of subjects) {
    if (combinedText.includes(subject)) {
      // Capitalize first letter
      return subject.charAt(0).toUpperCase() + subject.slice(1);
    }
  }

  // Check for general teaching terms
  if (combinedText.includes('primary')) {
    return 'Primary Education';
  }
  
  if (combinedText.includes('secondary')) {
    return 'Secondary Education';
  }

  if (combinedText.includes('teacher') || combinedText.includes('teaching')) {
    return 'Teaching';
  }

  return 'Subject not specified';
};

export const extractDateOfBirth = (data: CandidateData): string | null => {
  // This would need to be extracted from the CV text if available
  // For now, return null as this information is typically not in structured data
  return null;
};

export const getProcessingStatus = (upload: any): 'pending' | 'processed' => {
  // Determine if the candidate has been fully processed
  if (upload.processing_status === 'completed' && upload.extracted_json) {
    return 'processed';
  }
  return 'pending';
};