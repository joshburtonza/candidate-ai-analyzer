import { CVUpload } from '@/types/candidate';

export const removeDuplicatesByEmail = (uploads: CVUpload[]): CVUpload[] => {
  const seenEmails = new Set<string>();
  return uploads.filter(upload => {
    if (!upload?.extracted_json?.email_address) return true;
    
    const email = upload.extracted_json.email_address.toLowerCase().trim();
    if (seenEmails.has(email)) return false;
    
    seenEmails.add(email);
    return true;
  });
};

export const filterValidCandidates = (uploads: CVUpload[]): CVUpload[] => {
  console.log('filterValidCandidates: Input uploads:', uploads.length);
  const validUploads = uploads.filter(upload => 
    upload && 
    upload.extracted_json &&
    upload.extracted_json.candidate_name &&
    upload.extracted_json.email_address
  );
  console.log('filterValidCandidates: Valid uploads before dedup:', validUploads.length);
  const result = removeDuplicatesByEmail(validUploads);
  console.log('filterValidCandidates: Final result after dedup:', result.length);
  return result;
};

export const filterValidCandidatesForDate = (uploads: CVUpload[], selectedDate: Date): CVUpload[] => {
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  const dateFiltered = uploads.filter(upload => {
    if (!upload || !upload.extracted_json || !upload.extracted_json.candidate_name || !upload.extracted_json.email_address) {
      return false;
    }
    
    const uploadDate = new Date(upload.uploaded_at);
    return uploadDate >= startOfDay && uploadDate <= endOfDay;
  });
  
  return removeDuplicatesByEmail(dateFiltered);
};

export const filterBestCandidates = (uploads: CVUpload[]): CVUpload[] => {
  const bestCandidates = uploads.filter(upload => {
    if (!upload || !upload.extracted_json || !upload.extracted_json.candidate_name || !upload.extracted_json.email_address) {
      return false;
    }

    const data = upload.extracted_json;
    
    // Check education level for teaching qualifications
    const hasTeachingQualification = data.educational_qualifications && 
      (data.educational_qualifications.toLowerCase().includes('b.ed') ||
       data.educational_qualifications.toLowerCase().includes('pgce') ||
       data.educational_qualifications.toLowerCase().includes('bachelor of education') ||
       data.educational_qualifications.toLowerCase().includes('postgraduate certificate in education'));

    // Check for academic subjects in skills
    const skills = data.skill_set?.toLowerCase() || '';
    const hasAcademicSubjects = skills.includes('math') || skills.includes('english') || 
                               skills.includes('science') || skills.includes('history') ||
                               skills.includes('teaching');

    // Check location for preferred countries
    const countries = typeof data.countries === 'string' ? data.countries.toLowerCase() : '';
    const preferredCountries = ['uk', 'usa', 'australia', 'new zealand', 'canada', 'ireland', 'south africa', 'dubai'];
    const isFromPreferredCountry = preferredCountries.some(country => 
      countries.includes(country)
    );

    // Check score (assuming good candidates have score > 6)
    const score = parseFloat(data.score || '0') || 0;
    const hasGoodScore = score >= 6;

    return hasTeachingQualification && hasAcademicSubjects && isFromPreferredCountry && hasGoodScore;
  });
  
  return removeDuplicatesByEmail(bestCandidates);
};

export const filterBestCandidatesForDate = (uploads: CVUpload[], selectedDate: Date): CVUpload[] => {
  const dateFiltered = filterValidCandidatesForDate(uploads, selectedDate);
  return filterBestCandidates(dateFiltered);
};