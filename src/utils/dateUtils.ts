import { CVUpload } from '@/types/candidate';

/**
 * Gets the upload date for a CV upload, prioritizing received_date from database
 * Falls back to date_received from extracted JSON only if database date is missing
 */
export const getUploadDate = (upload: CVUpload): Date => {
  // Priority 1: Database received_date (authoritative source)
  if (upload.received_date) {
    return new Date(upload.received_date);
  }
  
  // Priority 2: JSON date_received (fallback only)
  if (upload.extracted_json?.date_received) {
    return new Date(upload.extracted_json.date_received);
  }
  
  // Priority 3: Current date (last resort)
  return new Date();
};

/**
 * Formats a date as YYYY-MM-DD for database storage
 */
export const formatDateForDB = (date: Date): string => {
  return date.toISOString().split('T')[0];
};