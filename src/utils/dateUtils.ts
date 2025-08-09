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

/**
 * Returns the effective upload date as YYYY-MM-DD string.
 * Priority: received_date (DB) -> extracted_json.date_received -> today
 */
export const getEffectiveDateString = (upload: CVUpload): string => {
  const prefer = (value?: string | null): string | null => {
    if (!value) return null;
    const v = value.trim();
    if (!v) return null;
    // If already in YYYY-MM-DD, return as is to avoid TZ shifts
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const d = new Date(v);
    if (!isNaN(d.getTime())) return formatDateForDB(d);
    return null;
  };

  const fromDb = prefer(upload.received_date as unknown as string);
  if (fromDb) return fromDb;

  const fromJson = prefer(upload.extracted_json?.date_received as unknown as string);
  if (fromJson) return fromJson;

  return formatDateForDB(new Date());
};