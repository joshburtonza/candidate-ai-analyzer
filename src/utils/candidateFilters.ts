
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
  
  // Check for teaching qualifications
  const validQualifications = [
    'b.ed', 'bachelor of education', 'bed',
    'pgce', 'postgraduate certificate in education',
    'education degree', 'teaching degree', 'education diploma',
    'master of education', 'm.ed', 'med',
    'honours in education', 'bachelor of teaching'
  ];
  
  return validQualifications.some(qual => education.includes(qual));
};

export const hasValidExperience = (upload: CVUpload): boolean => {
  if (!upload.extracted_json?.job_history) return false;
  
  const jobHistory = upload.extracted_json.job_history.toLowerCase();
  
  // Extract years of teaching experience
  const yearPatterns = [
    /(\d+)\s*years?\s*(?:of\s*)?(?:teaching|education|experience)/gi,
    /teaching\s*(?:experience|for)\s*(\d+)\s*years?/gi,
    /(\d+)\s*years?\s*in\s*(?:teaching|education)/gi
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
  
  return maxYears >= 2;
};

export const hasValidSubject = (upload: CVUpload): boolean => {
  if (!upload.extracted_json?.job_history && !upload.extracted_json?.skill_set) return false;
  
  const text = `${upload.extracted_json.job_history || ''} ${upload.extracted_json.skill_set || ''}`.toLowerCase();
  
  // Exclude non-teaching or admin roles
  const excludedSubjects = [
    'xhosa', 'administration', 'pastoral', 'admin', 'secretary',
    'receptionist', 'clerk', 'office', 'data entry', 'filing',
    'human resources', 'hr', 'finance', 'accounting', 'marketing'
  ];
  
  // Check if candidate has excluded subjects/roles
  const hasExcludedRole = excludedSubjects.some(subject => text.includes(subject));
  
  // Check for teaching-related keywords
  const teachingKeywords = [
    'teach', 'teacher', 'education', 'classroom', 'lesson',
    'curriculum', 'student', 'pupil', 'subject', 'grade',
    'mathematics', 'english', 'science', 'history', 'geography',
    'physics', 'chemistry', 'biology', 'literature', 'art'
  ];
  
  const hasTeachingRole = teachingKeywords.some(keyword => text.includes(keyword));
  
  return !hasExcludedRole && hasTeachingRole;
};

export const isFromApprovedCountry = (upload: CVUpload): boolean => {
  if (!upload.extracted_json?.countries) return false;
  
  const countries = upload.extracted_json.countries.toLowerCase();
  
  const approvedCountries = [
    'united kingdom', 'uk', 'britain', 'england', 'scotland', 'wales',
    'united states', 'usa', 'america', 'us',
    'australia', 'australia',
    'new zealand', 'nz',
    'canada', 'canadian',
    'ireland', 'irish',
    'south africa', 'south african', 'sa',
    'dubai', 'uae', 'emirates', 'united arab emirates'
  ];
  
  return approvedCountries.some(country => countries.includes(country));
};

export const isBestCandidate = (upload: CVUpload): boolean => {
  if (!isQualifiedCandidate(upload)) return false;
  if (isTestCandidate(upload)) return false;
  
  return hasValidEducation(upload) &&
         hasValidExperience(upload) &&
         hasValidSubject(upload) &&
         isFromApprovedCountry(upload);
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
