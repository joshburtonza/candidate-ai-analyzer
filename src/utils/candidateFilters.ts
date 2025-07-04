
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

// Strict qualification check for teaching candidates
export const isQualifiedTeachingCandidate = (upload: CVUpload): boolean => {
  if (!isQualifiedCandidate(upload)) {
    return false;
  }

  const data = upload.extracted_json!;
  
  // Check for teaching degree
  if (!hasTeachingDegree(data)) {
    return false;
  }

  // Check for minimum 2 years experience
  if (!hasMinimumTeachingExperience(data)) {
    return false;
  }

  // Check for valid teaching subject
  if (!hasValidTeachingSubject(data)) {
    return false;
  }

  // Check for approved country
  if (!isFromApprovedCountry(data)) {
    return false;
  }

  return true;
};

const hasTeachingDegree = (data: any): boolean => {
  const education = (data.educational_qualifications || '').toLowerCase();
  const teachingDegreeKeywords = [
    'bachelor of education',
    'b.ed',
    'b. ed',
    'pgce',
    'post graduate certificate in education',
    'teaching qualification',
    'education degree',
    'qualified teacher status',
    'qts',
    'teaching certificate',
    'diploma in education',
    'master of education',
    'm.ed',
    'm. ed',
    'postgraduate certificate in education',
    'pgde',
    'postgraduate diploma in education'
  ];
  
  return teachingDegreeKeywords.some(keyword => education.includes(keyword));
};

const hasMinimumTeachingExperience = (data: any): boolean => {
  const jobHistory = (data.job_history || '').toLowerCase();
  
  // Extract years of experience from various formats
  const experiencePatterns = [
    /(\d+)\s*years?\s*(?:of\s*)?(?:teaching|experience)/gi,
    /(?:teaching|experience)\s*(?:for\s*)?(\d+)\s*years?/gi,
    /(\d+)\+?\s*years?\s*teacher/gi,
    /teacher\s*(?:for\s*)?(\d+)\s*years?/gi
  ];

  let totalExperience = 0;
  
  for (const pattern of experiencePatterns) {
    const matches = [...jobHistory.matchAll(pattern)];
    for (const match of matches) {
      const years = parseInt(match[1]);
      if (!isNaN(years)) {
        totalExperience = Math.max(totalExperience, years);
      }
    }
  }

  return totalExperience >= 2;
};

const hasValidTeachingSubject = (data: any): boolean => {
  const skills = (data.skill_set || '').toLowerCase();
  const jobHistory = (data.job_history || '').toLowerCase();
  const combinedText = `${skills} ${jobHistory}`;
  
  // Exclude non-teaching or inappropriate subjects
  const excludedSubjects = [
    'xhosa',
    'admin',
    'pastoral',
    'administration',
    'office management',
    'data entry',
    'reception',
    'cleaning',
    'maintenance',
    'it support',
    'technical support',
    'administrative',
    'clerical'
  ];

  // Check if candidate has excluded subjects
  const hasExcludedSubject = excludedSubjects.some(subject => 
    combinedText.includes(subject)
  );

  if (hasExcludedSubject) {
    return false;
  }

  // Look for valid teaching subjects or general teaching indicators
  const validTeachingIndicators = [
    'teacher',
    'teaching',
    'mathematics',
    'english',
    'science',
    'physics',
    'chemistry',
    'biology',
    'history',
    'geography',
    'art',
    'music',
    'physical education',
    'pe teacher',
    'primary',
    'secondary',
    'curriculum',
    'lesson planning',
    'classroom management',
    'subject specialist'
  ];

  return validTeachingIndicators.some(indicator => 
    combinedText.includes(indicator)
  );
};

const isFromApprovedCountry = (data: any): boolean => {
  const countries = (data.countries || '').toLowerCase();
  const approvedCountries = [
    'united kingdom',
    'uk',
    'usa',
    'united states',
    'australia',
    'new zealand',
    'canada',
    'ireland',
    'south africa',
    'uae',
    'dubai'
  ];

  return approvedCountries.some(country => 
    countries.includes(country)
  );
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

    // Apply strict teaching qualification filtering
    if (!isQualifiedTeachingCandidate(upload)) {
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

    // Apply strict teaching qualification filtering
    if (!isQualifiedTeachingCandidate(upload)) {
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
