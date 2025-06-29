
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
