import { CVUpload } from '@/types/candidate';
import { getEffectiveDateString, formatDateForDB } from '@/utils/dateUtils';

// Helper function to extract and normalize first and last name
export const normalizeFirstLastName = (candidateName: string | null | undefined): string => {
  if (!candidateName) return '';
  
  const normalized = candidateName.toLowerCase().trim();
  // Split by space and take first and last parts
  const parts = normalized.split(/\s+/).filter(part => part);
  
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  
  // Use first and last parts only (ignore middle names)
  return `${parts[0]}_${parts[parts.length - 1]}`;
};

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

export const hasMinimumScore = (upload: CVUpload): boolean => {
  if (!upload.extracted_json?.score) return false;
  
  const score = upload.extracted_json.score;
  
  // Extract numeric score from string (e.g., "8/10", "7", "8.5/10")
  const scoreMatch = score.match(/(\d+(?:\.\d+)?)/);
  if (!scoreMatch) return false;
  
  const numericScore = parseFloat(scoreMatch[1]);
  return numericScore >= 6;
};

export const isUploadedOnDate = (upload: CVUpload, targetDate: Date): boolean => {
  const eff = getEffectiveDateString(upload);
  const target = formatDateForDB(targetDate);
  return eff === target;
};

export const isUploadedToday = (upload: CVUpload): boolean => {
  return isUploadedOnDate(upload, new Date());
};

// NEW: Show all qualified candidates (not just today's)
export const filterAllQualifiedCandidates = (uploads: CVUpload[]): CVUpload[] => {
  const seenNames = new Set<string>();
  
  const filtered = uploads.filter(upload => {
    // Filter out incomplete uploads (only requires email now)
    if (!isQualifiedCandidate(upload)) {
      return false;
    }

    // Filter out test candidates
    if (isTestCandidate(upload)) {
      return false;
    }

    // Filter out candidates with score under 6/10
    if (!hasMinimumScore(upload)) {
      return false;
    }

    // Filter out candidates from non-approved countries
    if (!isFromApprovedCountry(upload)) {
      return false;
    }

    const candidateName = upload.extracted_json?.candidate_name;

    // Filter out duplicates based on first and last name
    if (candidateName) {
      const normalizedName = normalizeFirstLastName(candidateName);
      if (normalizedName && seenNames.has(normalizedName)) {
        return false;
      }
      if (normalizedName) {
        seenNames.add(normalizedName);
      }
    }

    return true;
  });

// Sort by date_received (YYYY-MM-DD) with today's first
return filtered.sort((a, b) => {
  const aIsToday = isUploadedToday(a);
  const bIsToday = isUploadedToday(b);
  
  if (aIsToday && !bIsToday) return -1;
  if (!aIsToday && bIsToday) return 1;
  
  const aStr = getEffectiveDateString(a);
  const bStr = getEffectiveDateString(b);
  return bStr.localeCompare(aStr);
});
};

// Optimized filtering function with better memoization
const filterCache = new Map<string, { result: CVUpload[], timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

// EXISTING: Keep this for "today only" filtering when specifically requested
export const filterValidCandidates = (uploads: CVUpload[]): CVUpload[] => {
  // Create cache key based on uploads length and today's date
  const today = new Date();
  const cacheKey = `today-${uploads.length}-${today.toDateString()}`;
  
  // Check if we have a valid cached result
  const cached = filterCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.result;
  }

  const seenNames = new Set<string>();
  
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

    // Filter out candidates with score under 6/10
    if (!hasMinimumScore(upload)) {
      return false;
    }

    // Filter out candidates from non-approved countries
    if (!isFromApprovedCountry(upload)) {
      return false;
    }

    const candidateName = upload.extracted_json?.candidate_name;

    // Filter out duplicates based on first and last name
    if (candidateName) {
      const normalizedName = normalizeFirstLastName(candidateName);
      if (normalizedName && seenNames.has(normalizedName)) {
        return false;
      }
      if (normalizedName) {
        seenNames.add(normalizedName);
      }
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
  if (!upload.extracted_json?.job_history && !upload.extracted_json?.current_employment) return false;
  
  const text = `${upload.extracted_json.job_history || ''} ${upload.extracted_json.current_employment || ''}`.toLowerCase();
  
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

// ============= STRICT FILTER FUNCTIONS FOR ENHANCED BEST CANDIDATES =============

// Strict B.Ed or Degree + PGCE requirement
export const hasStrictEducation = (upload: CVUpload): boolean => {
  if (!upload.extracted_json?.educational_qualifications) return false;
  
  const education = upload.extracted_json.educational_qualifications.toLowerCase();
  
  // B.Ed variations
  const bedPatterns = [
    'b.ed', 'bachelor of education', 'bed', 'b ed', 'b-ed',
    'bachelor\'s in education', 'education bachelor', 'teaching degree'
  ];
  
  // PGCE patterns
  const pgcePatterns = [
    'pgce', 'postgraduate certificate in education', 'post graduate certificate in education',
    'pgc education', 'postgrad cert education'
  ];
  
  // Check for B.Ed
  const hasBEd = bedPatterns.some(pattern => education.includes(pattern));
  
  // Check for Degree + PGCE combination
  const hasPGCE = pgcePatterns.some(pattern => education.includes(pattern));
  const hasDegree = ['bachelor', 'degree', 'honours', 'diploma'].some(qual => education.includes(qual));
  const hasDegreeWithPGCE = hasDegree && hasPGCE;
  
  const isValid = hasBEd || hasDegreeWithPGCE;
  console.log('Strict education check for:', upload.extracted_json?.candidate_name, 'B.Ed:', hasBEd, 'Degree+PGCE:', hasDegreeWithPGCE, 'Valid:', isValid);
  return isValid;
};

// Extended citizenship validation (South African + approved countries globally)
export const hasStrictCitizenship = (upload: CVUpload): boolean => {
  if (!upload.extracted_json?.countries) return false;
  
  const normalizedCountries = normalizeCountryData(upload.extracted_json.countries);
  if (!normalizedCountries) return false;
  
  const isValid = STRICT_APPROVED_CITIZENSHIPS.some(approvedCountry => 
    normalizedCountries.includes(approvedCountry)
  );
  
  console.log('Strict citizenship check for:', upload.extracted_json?.candidate_name, ':', normalizedCountries, 'Valid:', isValid);
  return isValid;
};

// 2+ years teaching experience post-qualification
export const hasPostQualificationTeachingExperience = (upload: CVUpload): boolean => {
  if (!upload.extracted_json?.job_history) return false;
  
  const jobHistory = upload.extracted_json.job_history.toLowerCase();
  
  // Look for specific post-qualification experience patterns
  const postQualPatterns = [
    /(?:post|after|following)\s*(?:qualification|graduation|degree)\s*.*?(\d+)\s*years?\s*(?:teaching|experience)/gi,
    /(\d+)\s*years?\s*(?:post|after|since)\s*(?:qualification|graduation|degree|qualifying)/gi,
    /qualified.*?(\d+)\s*years?\s*(?:ago|experience|teaching)/gi,
    /teaching\s*(?:for|experience)?\s*(\d+)\s*years?\s*(?:since|after|post)\s*(?:qualification|graduation)/gi
  ];
  
  let maxPostQualYears = 0;
  
  for (const pattern of postQualPatterns) {
    const matches = jobHistory.matchAll(pattern);
    for (const match of matches) {
      const years = parseInt(match[1]);
      if (!isNaN(years) && years > maxPostQualYears) {
        maxPostQualYears = years;
      }
    }
  }
  
  // If no specific post-qual experience found, fall back to general teaching experience
  if (maxPostQualYears === 0) {
    return hasValidExperience(upload); // Use existing experience check as fallback
  }
  
  const isValid = maxPostQualYears >= 2;
  console.log('Post-qualification experience check for:', upload.extracted_json?.candidate_name, ':', maxPostQualYears, 'years, Valid:', isValid);
  return isValid;
};

// Must be currently teaching
export const isCurrentlyTeaching = (upload: CVUpload): boolean => {
  if (!upload.extracted_json?.current_employment) return false;
  
  const currentJob = upload.extracted_json.current_employment.toLowerCase();
  
  // Current teaching indicators
  const currentTeachingPatterns = [
    'teacher', 'teaching', 'educator', 'lecturer', 'instructor', 'tutor',
    'currently teaching', 'presently teaching', 'working as teacher',
    'employed as teacher', 'position: teacher', 'role: teacher'
  ];
  
  // Exclude non-teaching roles more strictly
  const nonTeachingRoles = [
    'admin', 'administration', 'assistant', 'clerk', 'secretary',
    'receptionist', 'coordinator', 'manager', 'supervisor', 'principal',
    'head teacher', 'deputy head', 'pastoral care', 'counselor'
  ];
  
  const hasCurrentTeaching = currentTeachingPatterns.some(pattern => currentJob.includes(pattern));
  const hasNonTeachingRole = nonTeachingRoles.some(role => currentJob.includes(role));
  
  const isValid = hasCurrentTeaching && !hasNonTeachingRole;
  console.log('Currently teaching check for:', upload.extracted_json?.candidate_name, 'Current:', currentJob, 'Valid:', isValid);
  return isValid;
};

// Teaching experience matches degree phase
export const hasMatchingTeachingPhase = (upload: CVUpload): boolean => {
  if (!upload.extracted_json?.educational_qualifications || !upload.extracted_json?.job_history) return true; // Skip if data unavailable
  
  const education = upload.extracted_json.educational_qualifications.toLowerCase();
  const jobHistory = upload.extracted_json.job_history.toLowerCase();
  
  // Phase indicators in education
  const primaryEducation = ['primary', 'foundation', 'elementary', 'early childhood', 'kindergarten'].some(phase => education.includes(phase));
  const secondaryEducation = ['secondary', 'high school', 'senior', 'grade 8', 'grade 9', 'grade 10', 'grade 11', 'grade 12'].some(phase => education.includes(phase));
  
  // Phase indicators in job history
  const primaryExperience = ['primary', 'foundation', 'elementary', 'early childhood', 'kindergarten', 'grade r', 'grade 1', 'grade 2', 'grade 3', 'grade 4', 'grade 5', 'grade 6', 'grade 7'].some(phase => jobHistory.includes(phase));
  const secondaryExperience = ['secondary', 'high school', 'senior', 'grade 8', 'grade 9', 'grade 10', 'grade 11', 'grade 12'].some(phase => jobHistory.includes(phase));
  
  // If no specific phase mentioned, consider it valid (general teaching qualification)
  if (!primaryEducation && !secondaryEducation) return true;
  
  // Check if phases match
  const phasesMatch = (primaryEducation && primaryExperience) || (secondaryEducation && secondaryExperience);
  
  console.log('Teaching phase match for:', upload.extracted_json?.candidate_name, 'Education phase:', {primary: primaryEducation, secondary: secondaryEducation}, 'Experience phase:', {primary: primaryExperience, secondary: secondaryExperience}, 'Match:', phasesMatch);
  return phasesMatch;
};

// Filter out scanned photocopies
export const isNotScannedCV = (upload: CVUpload): boolean => {
  // Heuristics for detecting scanned CVs
  const filename = upload.original_filename?.toLowerCase() || '';
  const fileSize = upload.file_size || 0;
  
  // File name patterns that suggest scanned documents
  const scannedPatterns = [
    'scan', 'scanned', 'copy', 'photocopy', 'img', 'image',
    'jpeg', 'jpg', 'png', 'tiff', 'bmp'
  ];
  
  const hasScannedName = scannedPatterns.some(pattern => filename.includes(pattern));
  
  // Very large file sizes often indicate scanned images
  const isLargeFile = fileSize > 5000000; // 5MB threshold
  
  // Check for poor text extraction quality (low character count vs file size ratio)
  const extractedText = JSON.stringify(upload.extracted_json || {});
  const textToSizeRatio = extractedText.length / Math.max(fileSize, 1);
  const hasLowTextRatio = textToSizeRatio < 0.001 && fileSize > 1000000; // Less than 0.001 ratio for files > 1MB
  
  const isScanned = hasScannedName || isLargeFile || hasLowTextRatio;
  
  console.log('Scanned CV check for:', upload.extracted_json?.candidate_name, 'Filename:', filename, 'Size:', fileSize, 'Scanned indicators:', {hasScannedName, isLargeFile, hasLowTextRatio}, 'Is NOT scanned:', !isScanned);
  return !isScanned;
};

// Date correlation between application and database entry
export const hasValidDateCorrelation = (upload: CVUpload): boolean => {
  // Get the effective date (received_date or created_at)
  const effectiveDate = getEffectiveDateString(upload);
  const today = formatDateForDB(new Date());
  
  // Calculate days difference
  const effectiveDateObj = new Date(effectiveDate);
  const todayObj = new Date(today);
  const daysDifference = Math.abs((todayObj.getTime() - effectiveDateObj.getTime()) / (1000 * 60 * 60 * 24));
  
  // Allow 1 day tolerance for processing delays
  const isValid = daysDifference <= 1;
  
  console.log('Date correlation check for:', upload.extracted_json?.candidate_name, 'Effective date:', effectiveDate, 'Today:', today, 'Days diff:', daysDifference, 'Valid:', isValid);
  return isValid;
};

// Stricter exclusion of non-teaching current roles
export const hasStrictCurrentTeachingRole = (upload: CVUpload): boolean => {
  if (!upload.extracted_json?.current_employment) return false;
  
  const currentJob = upload.extracted_json.current_employment.toLowerCase();
  
  // Strictly exclude administrative and non-teaching roles
  const strictlyExcludedRoles = [
    'admin', 'administration', 'administrative', 'assistant', 'teaching assistant',
    'ta ', ' ta', 'clerk', 'secretary', 'receptionist', 'coordinator',
    'manager', 'supervisor', 'principal', 'head teacher', 'deputy head',
    'pastoral care', 'counselor', 'librarian', 'support staff',
    'non-teaching', 'substitute', 'supply teacher', 'relief teacher'
  ];
  
  // Must have direct teaching indicators
  const directTeachingIndicators = [
    'teacher', 'teaching', 'educator', 'lecturer', 'instructor',
    'classroom teacher', 'subject teacher', 'grade teacher'
  ];
  
  const hasExcludedRole = strictlyExcludedRoles.some(role => currentJob.includes(role));
  const hasDirectTeaching = directTeachingIndicators.some(indicator => currentJob.includes(indicator));
  
  const isValid = hasDirectTeaching && !hasExcludedRole;
  
  console.log('Strict current teaching role check for:', upload.extracted_json?.candidate_name, 'Current:', currentJob, 'Has teaching:', hasDirectTeaching, 'Has excluded:', hasExcludedRole, 'Valid:', isValid);
  return isValid;
}

// Centralized country allow-list with aliases for case-insensitive matching
const APPROVED_COUNTRIES = [
  // South Africa
  'south africa', 'south african', 'sa', 'rsa', 'republic of south africa',
  
  // UAE
  'uae', 'united arab emirates', 'emirates', 'dubai', 'abu dhabi', 'sharjah', 'ajman', 'fujairah', 'ras al khaimah', 'umm al quwain',
  
  // UK
  'uk', 'united kingdom', 'britain', 'great britain', 'england', 'scotland', 'wales', 'northern ireland', 'british',
  
  // Ireland  
  'ireland', 'irish', 'republic of ireland', 'eire',
  
  // USA
  'usa', 'united states', 'united states of america', 'america', 'us', 'american', 'states',
  
  // New Zealand
  'nz', 'new zealand', 'zealand', 'new zealander', 'kiwi',
  
  // Australia
  'aus', 'australia', 'australian', 'aussie', 'oz',
  
  // Oman
  'oman', 'omani', 'sultanate of oman', 'muscat',
  
  // Saudi Arabia
  'saudi arabia', 'saudi', 'ksa', 'kingdom of saudi arabia', 'saudis', 'riyadh', 'jeddah', 'mecca', 'medina',
  
  // Kuwait
  'kuwait', 'kuwaiti', 'state of kuwait', 'kuwait city'
];

// Extended approved citizenships for strict filtering (includes Canada)
const STRICT_APPROVED_CITIZENSHIPS = [
  ...APPROVED_COUNTRIES,
  // Canada
  'canada', 'canadian', 'ca', 'toronto', 'vancouver', 'montreal', 'ottawa', 'calgary'
];

// Helper function to normalize country data for matching
const normalizeCountryData = (countriesData: string | string[] | null | undefined): string => {
  if (!countriesData) return '';
  
  if (typeof countriesData === 'string') {
    return countriesData.toLowerCase().trim();
  } else if (Array.isArray(countriesData)) {
    return (countriesData as string[]).join(' ').toLowerCase().trim();
  }
  
  return '';
};

// Core country validation function
export const isFromApprovedCountry = (upload: CVUpload): boolean => {
  if (!upload.extracted_json?.countries) {
    // Block candidates with no country data - this is now a hard requirement
    console.log('Country check for:', upload.extracted_json?.candidate_name, ': No country data, BLOCKING');
    return false;
  }
  
  const normalizedCountries = normalizeCountryData(upload.extracted_json.countries);
  
  if (!normalizedCountries) {
    console.log('Country check for:', upload.extracted_json?.candidate_name, ': Empty country data, BLOCKING');
    return false;
  }
  
  const isValid = APPROVED_COUNTRIES.some(approvedCountry => 
    normalizedCountries.includes(approvedCountry)
  );
  
  console.log('Country check for:', upload.extracted_json?.candidate_name, ':', normalizedCountries, 'Valid:', isValid);
  return isValid;
};

// Export the country validation for use in edge functions
export const isCountryAllowed = (countriesData: string | string[] | null | undefined): boolean => {
  const normalizedCountries = normalizeCountryData(countriesData);
  
  if (!normalizedCountries) {
    return false; // Block empty/missing country data
  }
  
  return APPROVED_COUNTRIES.some(approvedCountry => 
    normalizedCountries.includes(approvedCountry)
  );
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
  
  // Apply all strict filters for Best Candidates
  const strictEducationValid = hasStrictEducation(upload);
  const strictCitizenshipValid = hasStrictCitizenship(upload);
  const postQualExperienceValid = hasPostQualificationTeachingExperience(upload);
  const currentlyTeachingValid = isCurrentlyTeaching(upload);
  const teachingPhaseValid = hasMatchingTeachingPhase(upload);
  const notScannedValid = isNotScannedCV(upload);
  const dateCorrelationValid = hasValidDateCorrelation(upload);
  const strictCurrentRoleValid = hasStrictCurrentTeachingRole(upload);
  
  const isBest = strictEducationValid && 
                 strictCitizenshipValid && 
                 postQualExperienceValid && 
                 currentlyTeachingValid && 
                 teachingPhaseValid && 
                 notScannedValid && 
                 dateCorrelationValid && 
                 strictCurrentRoleValid;
  
  console.log('Best candidate check for:', upload.extracted_json?.candidate_name, {
    strictEducation: strictEducationValid,
    strictCitizenship: strictCitizenshipValid,
    postQualExperience: postQualExperienceValid,
    currentlyTeaching: currentlyTeachingValid,
    teachingPhase: teachingPhaseValid,
    notScanned: notScannedValid,
    dateCorrelation: dateCorrelationValid,
    strictCurrentRole: strictCurrentRoleValid,
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

  const seenNames = new Set<string>();
  
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

    // Filter out candidates with score under 6/10
    if (!hasMinimumScore(upload)) {
      return false;
    }

    // Filter out candidates from non-approved countries
    if (!isFromApprovedCountry(upload)) {
      return false;
    }

    const candidateName = upload.extracted_json?.candidate_name;

    // Filter out duplicates based on first and last name
    if (candidateName) {
      const normalizedName = normalizeFirstLastName(candidateName);
      if (normalizedName && seenNames.has(normalizedName)) {
        return false;
      }
      if (normalizedName) {
        seenNames.add(normalizedName);
      }
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
  const seenNames = new Set<string>();
  
  return uploads.filter(upload => {
    // Filter out uploads not from today for the main dashboard view
    if (!isUploadedToday(upload)) {
      return false;
    }

    // Apply best candidate filters
    if (!isBestCandidate(upload)) {
      return false;
    }

    const candidateName = upload.extracted_json?.candidate_name;

    // Filter out duplicates based on first and last name
    if (candidateName) {
      const normalizedName = normalizeFirstLastName(candidateName);
      if (normalizedName && seenNames.has(normalizedName)) {
        return false;
      }
      if (normalizedName) {
        seenNames.add(normalizedName);
      }
    }

    return true;
  });
};

// NEW: Show all best candidates (not just today's)
export const filterAllBestCandidates = (uploads: CVUpload[]): CVUpload[] => {
  const seenNames = new Set<string>();
  
  const filtered = uploads.filter(upload => {
    // Apply best candidate filters without date restriction
    if (!isBestCandidate(upload)) {
      return false;
    }

    const candidateName = upload.extracted_json?.candidate_name;

    // Filter out duplicates based on first and last name
    if (candidateName) {
      const normalizedName = normalizeFirstLastName(candidateName);
      if (normalizedName && seenNames.has(normalizedName)) {
        return false;
      }
      if (normalizedName) {
        seenNames.add(normalizedName);
      }
    }

    return true;
  });

// Sort by date_received (YYYY-MM-DD) with today's first
return filtered.sort((a, b) => {
  const aIsToday = isUploadedToday(a);
  const bIsToday = isUploadedToday(b);
  
  if (aIsToday && !bIsToday) return -1;
  if (!aIsToday && bIsToday) return 1;
  
  const aStr = getEffectiveDateString(a);
  const bStr = getEffectiveDateString(b);
  return bStr.localeCompare(aStr);
});
};

export const filterBestCandidatesForDate = (uploads: CVUpload[], targetDate: Date): CVUpload[] => {
  const seenNames = new Set<string>();
  
  return uploads.filter(upload => {
    // Filter for specific date instead of just today
    if (!isUploadedOnDate(upload, targetDate)) {
      return false;
    }

    // Apply best candidate filters (includes country validation)
    if (!isBestCandidate(upload)) {
      return false;
    }

    const candidateName = upload.extracted_json?.candidate_name;

    // Filter out duplicates based on first and last name
    if (candidateName) {
      const normalizedName = normalizeFirstLastName(candidateName);
      if (normalizedName && seenNames.has(normalizedName)) {
        return false;
      }
      if (normalizedName) {
        seenNames.add(normalizedName);
      }
    }

    return true;
  });
};
