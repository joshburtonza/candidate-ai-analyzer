
import { CVUpload } from '@/types/candidate';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';

export const isQualifiedCandidate = (upload: CVUpload): boolean => {
  // Filter out incomplete uploads
  if (upload.processing_status !== 'completed' || !upload.extracted_json) {
    return false;
  }

  const data = upload.extracted_json;
  
  // Only require email address - be very permissive with other fields
  const hasEmail = !!(data.email_address && data.email_address.trim());

  if (!hasEmail) {
    return false;
  }

  // Allow all candidates with email, regardless of score or other missing info
  return true;
};

export const isTestCandidate = (upload: CVUpload): boolean => {
  if (!upload.extracted_json?.candidate_name) return false;
  
  const name = upload.extracted_json.candidate_name.toLowerCase().trim();
  
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

export const isUploadedOnDate = (upload: CVUpload, targetDate: Date): boolean => {
  const uploadDate = new Date(upload.uploaded_at);
  
  // Create time range from 12:00 AM to 11:59 PM of target day
  const startOfTargetDay = startOfDay(targetDate);
  const endOfTargetDay = endOfDay(targetDate);
  
  return isWithinInterval(uploadDate, {
    start: startOfTargetDay,
    end: endOfTargetDay
  });
};

export const isUploadedToday = (upload: CVUpload): boolean => {
  return isUploadedOnDate(upload, new Date());
};

// Optimized filtering function with better memoization
const filterCache = new Map<string, { result: CVUpload[], timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export const filterValidCandidates = (uploads: CVUpload[]): CVUpload[] => {
  // Create cache key based on uploads length and today's date
  const today = new Date();
  const cacheKey = `today-${uploads.length}-${today.toDateString()}`;
  
  // Check if we have a valid cached result
  const cached = filterCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.result;
  }

  const seenEmails = new Set<string>();
  
  const filtered = uploads.filter(upload => {
    // Filter out uploads not from today for the main dashboard view
    if (!isUploadedToday(upload)) {
      return false;
    }

    // Filter out incomplete uploads (only requires email now)
    if (!isQualifiedCandidate(upload)) {
      return false;
    }

    // Filter out test candidates
    if (isTestCandidate(upload)) {
      return false;
    }

    const candidateEmail = upload.extracted_json?.email_address;

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

// Optimized function for date-specific filtering
// Helper functions for Best Candidates filtering
export const hasValidEducation = (upload: CVUpload): boolean => {
  if (!upload.extracted_json?.educational_qualifications) return false;
  
  const education = upload.extracted_json.educational_qualifications.toLowerCase();
  
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
  
  const hasQualification = validQualifications.some(qual => education.includes(qual));
  console.log('Education check for:', upload.extracted_json?.candidate_name, ':', education, 'Valid:', hasQualification);
  return hasQualification;
};

export const hasValidExperience = (upload: CVUpload): boolean => {
  if (!upload.extracted_json?.job_history) return false;
  
  const jobHistory = upload.extracted_json.job_history.toLowerCase();
  
  // Extract years of experience - improved patterns
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
    const matches = jobHistory.matchAll(pattern);
    for (const match of matches) {
      const years = parseInt(match[1]);
      if (!isNaN(years) && years > maxYears) {
        maxYears = years;
      }
    }
  }
  
  // If no years found in job_history, also check the justification field
  if (maxYears === 0 && upload.extracted_json?.justification) {
    const justification = upload.extracted_json.justification.toLowerCase();
    for (const pattern of yearPatterns) {
      const matches = justification.matchAll(pattern);
      for (const match of matches) {
        const years = parseInt(match[1]);
        if (!isNaN(years) && years > maxYears) {
          maxYears = years;
        }
      }
    }
  }
  
  const isValid = maxYears >= 2; // Back to 2 years minimum
  console.log('Experience check for:', upload.extracted_json?.candidate_name, ':', maxYears, 'years, Valid:', isValid);
  return isValid;
};

export const hasValidSubject = (upload: CVUpload): boolean => {
  if (!upload.extracted_json?.job_history && !upload.extracted_json?.skill_set) return false;
  
  const text = `${upload.extracted_json.job_history || ''} ${upload.extracted_json.skill_set || ''}`.toLowerCase();
  
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
  
  console.log('Subject check for:', upload.extracted_json?.candidate_name, 'Valid:', isValid);
  return isValid;
};

export const isFromApprovedCountry = (upload: CVUpload): boolean => {
  if (!upload.extracted_json?.countries) {
    // If no country info, be lenient and allow it through for now
    console.log('Country check for:', upload.extracted_json?.candidate_name, ': No country data, allowing through');
    return true;
  }
  
  // Handle countries as string or array safely
  let countries = '';
  const countriesData = upload.extracted_json.countries;
  
  if (typeof countriesData === 'string') {
    countries = countriesData.toLowerCase();
  } else if (Array.isArray(countriesData)) {
    countries = (countriesData as string[]).join(' ').toLowerCase();
  } else {
    console.log('Country check: No valid countries data for:', upload.extracted_json?.candidate_name);
    return false;
  }
  
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
  
  const isValid = approvedCountries.some(country => countries.includes(country));
  console.log('Country check for:', upload.extracted_json?.candidate_name, ':', countries, 'Valid:', isValid);
  return isValid;
};

export const isBestCandidate = (upload: CVUpload): boolean => {
  if (!isQualifiedCandidate(upload)) {
    console.log('Best candidate check failed - not qualified:', upload.extracted_json?.candidate_name);
    return false;
  }
  if (isTestCandidate(upload)) {
    console.log('Best candidate check failed - test candidate:', upload.extracted_json?.candidate_name);
    return false;
  }
  
  const educationValid = hasValidEducation(upload);
  const experienceValid = hasValidExperience(upload);
  const subjectValid = hasValidSubject(upload);
  const countryValid = isFromApprovedCountry(upload);
  
  const isBest = educationValid && experienceValid && subjectValid && countryValid;
  
  console.log('Best candidate check for:', upload.extracted_json?.candidate_name, {
    education: educationValid,
    experience: experienceValid,
    subject: subjectValid,
    country: countryValid,
    isBest
  });
  
  return isBest;
};

export const filterValidCandidatesForDate = (uploads: CVUpload[], targetDate: Date): CVUpload[] => {
  const cacheKey = `date-${uploads.length}-${targetDate.toDateString()}`;
  
  // Check if we have a valid cached result
  const cached = filterCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.result;
  }

  const seenEmails = new Set<string>();
  
  const filtered = uploads.filter(upload => {
    // Filter for specific date instead of just today
    if (!isUploadedOnDate(upload, targetDate)) {
      return false;
    }

    // Filter out incomplete uploads (only requires email now)
    if (!isQualifiedCandidate(upload)) {
      return false;
    }

    // Filter out test candidates
    if (isTestCandidate(upload)) {
      return false;
    }

    const candidateEmail = upload.extracted_json?.email_address;

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
export const filterBestCandidates = (uploads: CVUpload[]): CVUpload[] => {
  const seenEmails = new Set<string>();
  
  return uploads.filter(upload => {
    // Filter out uploads not from today for the main dashboard view
    if (!isUploadedToday(upload)) {
      return false;
    }

    // Apply best candidate filters
    if (!isBestCandidate(upload)) {
      return false;
    }

    const candidateEmail = upload.extracted_json?.email_address;

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

export const filterBestCandidatesForDate = (uploads: CVUpload[], targetDate: Date): CVUpload[] => {
  const seenEmails = new Set<string>();
  
  return uploads.filter(upload => {
    // Filter for specific date instead of just today
    if (!isUploadedOnDate(upload, targetDate)) {
      return false;
    }

    // Apply best candidate filters
    if (!isBestCandidate(upload)) {
      return false;
    }

    const candidateEmail = upload.extracted_json?.email_address;

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
