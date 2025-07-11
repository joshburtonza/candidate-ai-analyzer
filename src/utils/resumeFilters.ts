import { Resume } from '@/types/candidate';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';

export const isQualifiedResume = (resume: Resume): boolean => {
  // Filter out archived resumes
  if (resume.is_archived || resume.status === 'archived') {
    return false;
  }

  // Only require email address - be very permissive with other fields
  const hasEmail = !!(resume.email && resume.email.trim());

  if (!hasEmail) {
    return false;
  }

  // Allow all candidates with email, regardless of score or other missing info
  return true;
};

export const isTestResume = (resume: Resume): boolean => {
  if (!resume.name) return false;
  
  const name = resume.name.toLowerCase().trim();
  
  // Filter out test candidates like John Doe, Jane Doe, Test User, etc.
  const testPatterns = [
    'john doe',
    'jane doe',
    'john smith',
    'jane smith',
    'test user',
    'test candidate',
    'sample user',
    'dummy user',
    'example user',
    'placeholder',
    'test test',
    'user test',
    'demo user'
  ];
  
  return testPatterns.some(pattern => name.includes(pattern));
};

export const isCreatedOnDate = (resume: Resume, targetDate: Date): boolean => {
  const createdDate = new Date(resume.created_at);
  
  // Create time range from 12:00 AM to 11:59 PM of target day
  const startOfTargetDay = startOfDay(targetDate);
  const endOfTargetDay = endOfDay(targetDate);
  
  return isWithinInterval(createdDate, {
    start: startOfTargetDay,
    end: endOfTargetDay
  });
};

export const isCreatedToday = (resume: Resume): boolean => {
  return isCreatedOnDate(resume, new Date());
};

// Optimized filtering function with better memoization
const filterCache = new Map<string, { result: Resume[], timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export const filterValidResumes = (resumes: Resume[]): Resume[] => {
  // Create cache key based on resumes length and today's date
  const today = new Date();
  const cacheKey = `today-${resumes.length}-${today.toDateString()}`;
  
  // Check if we have a valid cached result
  const cached = filterCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.result;
  }

  const seenEmails = new Set<string>();
  
  const filtered = resumes.filter(resume => {
    // Filter out incomplete resumes (only requires email now)
    if (!isQualifiedResume(resume)) {
      return false;
    }

    // Filter out test candidates
    if (isTestResume(resume)) {
      return false;
    }

    const candidateEmail = resume.email;

    // Filter out duplicates based on email (case-insensitive)
    if (candidateEmail) {
      const normalizedEmail = candidateEmail.toLowerCase().trim();
      if (seenEmails.has(normalizedEmail)) {
        return false;
      }
      seenEmails.add(normalizedEmail);
    }

    return true;
  });

  // Cache the result with timestamp
  filterCache.set(cacheKey, { result: filtered, timestamp: Date.now() });
  
  // Clear old cache entries to prevent memory leaks
  if (filterCache.size > 20) {
    const oldestKey = Array.from(filterCache.keys())[0];
    filterCache.delete(oldestKey);
  }

  return filtered;
};

// Helper functions for Best Candidates filtering
export const hasValidEducationResume = (resume: Resume): boolean => {
  if (!resume.education_details && !resume.education_level) return false;
  
  let educationText = '';
  
  // Check education_level
  if (resume.education_level) {
    educationText += resume.education_level.toLowerCase() + ' ';
  }
  
  // Check education_details if it's a string or has text
  if (resume.education_details) {
    if (typeof resume.education_details === 'string') {
      educationText += resume.education_details.toLowerCase();
    } else if (typeof resume.education_details === 'object' && resume.education_details.text) {
      educationText += resume.education_details.text.toLowerCase();
    }
  }
  
  // Check for teaching qualifications - made more flexible
  const validQualifications = [
    'b.ed', 'bachelor of education', 'bed', 'b ed',
    'pgce', 'postgraduate certificate in education',
    'education degree', 'teaching degree', 'education diploma',
    'master of education', 'm.ed', 'med', 'm ed',
    'honours in education', 'bachelor of teaching',
    'teaching qualification', 'qualified teacher',
    'bachelor', 'degree', 'diploma', 'certificate' // More lenient
  ];
  
  const hasQualification = validQualifications.some(qual => educationText.includes(qual));
  return hasQualification;
};

export const hasValidExperienceResume = (resume: Resume): boolean => {
  // Check experience_years field first
  if (resume.experience_years && resume.experience_years >= 2) {
    return true;
  }
  
  // If no direct experience years, check parsed data or AI insights
  if (resume.ai_insights || resume.parsed_data) {
    const insights = resume.ai_insights || resume.parsed_data;
    if (typeof insights === 'object' && insights.experience_years) {
      return insights.experience_years >= 2;
    }
  }
  
  // If still no experience found, check if justification mentions years
  if (resume.justification) {
    const justificationText = resume.justification.toLowerCase();
    const yearPatterns = [
      /(?:over|more than|above)\s*(\d+)\s*years?\s*(?:of\s*)?(?:teaching|education|experience|work)/gi,
      /(\d+)\+?\s*years?\s*(?:of\s*)?(?:teaching|education|experience|work)/gi,
      /(?:teaching|work|experience)\s*(?:experience|for)?\s*(?:over|more than|above)?\s*(\d+)\s*years?/gi,
      /(\d+)\s*years?\s*(?:in|of)\s*(?:teaching|education|work)/gi,
      /with\s*(?:over|more than|above)?\s*(\d+)\s*years?\s*(?:of\s*)?(?:diverse|international|teaching|experience)/gi,
      /(\d+)\s*years?\s*(?:diverse|international|teaching|experience)/gi,
      /(\d+)\+?\s*years?/gi // Any mention of years
    ];
    
    let maxYears = 0;
    
    for (const pattern of yearPatterns) {
      const matches = justificationText.matchAll(pattern);
      for (const match of matches) {
        const years = parseInt(match[1]);
        if (!isNaN(years) && years > maxYears) {
          maxYears = years;
        }
      }
    }
    
    return maxYears >= 2;
  }
  
  return false;
};

export const hasValidSubjectResume = (resume: Resume): boolean => {
  if (!resume.skills && !resume.role_title && !resume.justification) return false;
  
  const text = `${resume.skills?.join(' ') || ''} ${resume.role_title || ''} ${resume.justification || ''}`.toLowerCase();
  
  // More lenient exclusion - only exclude obvious non-teaching roles
  const excludedSubjects = [
    'xhosa', 'administration', 'pastoral care only', 'admin assistant', 'office clerk',
    'secretary', 'receptionist', 'data entry', 'filing clerk',
    'human resources', 'hr assistant', 'accountant', 'marketing assistant'
  ];
  
  // Check if candidate has strongly excluded subjects/roles
  const hasStronglyExcludedRole = excludedSubjects.some(subject => text.includes(subject));
  
  // More inclusive teaching-related keywords
  const teachingKeywords = [
    'teach', 'teacher', 'education', 'classroom', 'lesson', 'tutor', 'lecturer',
    'curriculum', 'student', 'pupil', 'subject', 'grade', 'school',
    'mathematics', 'english', 'science', 'history', 'geography',
    'physics', 'chemistry', 'biology', 'literature', 'art', 'language',
    'primary', 'secondary', 'kindergarten', 'preschool', 'college', 'university'
  ];
  
  const hasTeachingRole = teachingKeywords.some(keyword => text.includes(keyword));
  const isValid = !hasStronglyExcludedRole && hasTeachingRole;
  return isValid;
};

export const isFromApprovedCountryResume = (resume: Resume): boolean => {
  if (!resume.nationality && !resume.location) {
    // If no country info, be lenient and allow it through for now
    return true;
  }
  
  const countryText = `${resume.nationality || ''} ${resume.location || ''}`.toLowerCase();
  
  const approvedCountries = [
    'united kingdom', 'uk', 'britain', 'england', 'scotland', 'wales', 'northern ireland',
    'united states', 'usa', 'america', 'us', 'states',
    'australia', 'australian', 'aus',
    'new zealand', 'nz', 'zealand',
    'canada', 'canadian', 'can',
    'ireland', 'irish', 'republic of ireland',
    'south africa', 'south african', 'sa', 'rsa',
    'dubai', 'uae', 'emirates', 'united arab emirates', 'abu dhabi'
  ];
  
  const isValid = approvedCountries.some(country => countryText.includes(country));
  return isValid;
};

export const isBestResume = (resume: Resume): boolean => {
  if (!isQualifiedResume(resume)) {
    return false;
  }
  if (isTestResume(resume)) {
    return false;
  }
  
  const educationValid = hasValidEducationResume(resume);
  const experienceValid = hasValidExperienceResume(resume);
  const subjectValid = hasValidSubjectResume(resume);
  const countryValid = isFromApprovedCountryResume(resume);
  
  const isBest = educationValid && experienceValid && subjectValid && countryValid;
  
  return isBest;
};

export const filterValidResumesForDate = (resumes: Resume[], targetDate: Date): Resume[] => {
  const cacheKey = `date-${resumes.length}-${targetDate.toDateString()}`;
  
  // Check if we have a valid cached result
  const cached = filterCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.result;
  }

  const seenEmails = new Set<string>();
  
  const filtered = resumes.filter(resume => {
    // Filter for specific date instead of just today
    if (!isCreatedOnDate(resume, targetDate)) {
      return false;
    }

    // Filter out incomplete resumes (only requires email now)
    if (!isQualifiedResume(resume)) {
      return false;
    }

    // Filter out test candidates
    if (isTestResume(resume)) {
      return false;
    }

    const candidateEmail = resume.email;

    // Filter out duplicates based on email (case-insensitive)
    if (candidateEmail) {
      const normalizedEmail = candidateEmail.toLowerCase().trim();
      if (seenEmails.has(normalizedEmail)) {
        return false;
      }
      seenEmails.add(normalizedEmail);
    }

    return true;
  });

  // Cache the result with timestamp
  filterCache.set(cacheKey, { result: filtered, timestamp: Date.now() });
  
  // Clear old cache entries to prevent memory leaks
  if (filterCache.size > 20) {
    const oldestKey = Array.from(filterCache.keys())[0];
    filterCache.delete(oldestKey);
  }

  return filtered;
};

// Filter functions for Best Candidates
export const filterBestResumes = (resumes: Resume[]): Resume[] => {
  const seenEmails = new Set<string>();
  
  return resumes.filter(resume => {
    // Apply best candidate filters
    if (!isBestResume(resume)) {
      return false;
    }

    const candidateEmail = resume.email;

    // Filter out duplicates based on email (case-insensitive)
    if (candidateEmail) {
      const normalizedEmail = candidateEmail.toLowerCase().trim();
      if (seenEmails.has(normalizedEmail)) {
        return false;
      }
      seenEmails.add(normalizedEmail);
    }

    return true;
  });
};

export const filterBestResumesForDate = (resumes: Resume[], targetDate: Date): Resume[] => {
  const seenEmails = new Set<string>();
  
  return resumes.filter(resume => {
    // Filter for specific date instead of just today
    if (!isCreatedOnDate(resume, targetDate)) {
      return false;
    }

    // Apply best candidate filters
    if (!isBestResume(resume)) {
      return false;
    }

    const candidateEmail = resume.email;

    // Filter out duplicates based on email (case-insensitive)
    if (candidateEmail) {
      const normalizedEmail = candidateEmail.toLowerCase().trim();
      if (seenEmails.has(normalizedEmail)) {
        return false;
      }
      seenEmails.add(normalizedEmail);
    }

    return true;
  });
};