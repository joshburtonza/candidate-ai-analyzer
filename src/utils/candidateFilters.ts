
import { CVUpload } from '@/types/candidate';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';

export const isQualifiedCandidate = (upload: CVUpload): boolean => {
  // Filter out incomplete uploads
  if (upload.processing_status !== 'completed' || !upload.extracted_json) {
    return false;
  }

  const data = upload.extracted_json;
  
  // Must have at least candidate name and email address
  const hasMinimumRequiredFields = !!(
    data.candidate_name &&
    data.email_address
  );

  if (!hasMinimumRequiredFields) {
    return false;
  }

  // Filter out low scores (below 5/10) - but only if score exists
  if (data.score) {
    const rawScore = parseFloat(data.score || '0');
    const score = rawScore > 10 ? Math.round(rawScore / 10) : Math.round(rawScore);
    if (score < 5) {
      return false;
    }
  }

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

export const isUploadedToday = (upload: CVUpload): boolean => {
  const uploadDate = new Date(upload.uploaded_at);
  const today = new Date();
  
  // Create time range from 12:00 AM to 11:59 PM of current day
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);
  
  return isWithinInterval(uploadDate, {
    start: startOfToday,
    end: endOfToday
  });
};

export const filterValidCandidates = (uploads: CVUpload[]): CVUpload[] => {
  const seenEmails = new Set<string>();
  
  return uploads.filter(upload => {
    // Filter out uploads not from today
    if (!isUploadedToday(upload)) {
      return false;
    }

    // Filter out incomplete uploads and low scores (but more permissive now)
    if (!isQualifiedCandidate(upload)) {
      return false;
    }

    // Filter out test candidates
    if (isTestCandidate(upload)) {
      console.log('Filtering out test candidate:', upload.extracted_json?.candidate_name);
      return false;
    }

    const candidateEmail = upload.extracted_json?.email_address;

    // Filter out duplicates based on email (case-insensitive)
    if (candidateEmail) {
      const normalizedEmail = candidateEmail.toLowerCase().trim();
      if (seenEmails.has(normalizedEmail)) {
        console.log('Filtering out duplicate candidate with email:', candidateEmail);
        return false;
      }
      seenEmails.add(normalizedEmail);
    }

    return true;
  });
};
