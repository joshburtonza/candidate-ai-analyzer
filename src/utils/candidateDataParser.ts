
// Helper functions to parse employment and education data from candidate JSON

export interface ParsedEmployment {
  jobTitle: string;
  company: string;
  duration: string;
  isEmpty: boolean;
}

export interface ParsedEducation {
  degree: string;
  institution: string;
  year: string;
  isEmpty: boolean;
}

export const parseCurrentEmployment = (
  currentEmployment: string | { _type?: string; value?: string } | any,
  jobHistory?: string
): ParsedEmployment => {
  // First try to extract from current_employment field
  let employmentText = '';
  
  if (typeof currentEmployment === 'string') {
    employmentText = currentEmployment.trim();
  } else if (typeof currentEmployment === 'object' && currentEmployment !== null) {
    if (currentEmployment.value && typeof currentEmployment.value === 'string') {
      employmentText = currentEmployment.value.trim();
    } else if (currentEmployment.text && typeof currentEmployment.text === 'string') {
      employmentText = currentEmployment.text.trim();
    }
  }
  
  // If no current employment found, try to extract from job history
  if (!employmentText && jobHistory) {
    const historyLines = jobHistory.split('\n').filter(line => line.trim());
    if (historyLines.length > 0) {
      employmentText = historyLines[0]; // Take the first (most recent) entry
    }
  }
  
  if (!employmentText) {
    return {
      jobTitle: 'Not currently employed',
      company: '',
      duration: '',
      isEmpty: true
    };
  }
  
  // Parse employment text to extract job title, company, and duration
  const result = parseEmploymentText(employmentText);
  
  return {
    ...result,
    isEmpty: false
  };
};

const parseEmploymentText = (text: string): { jobTitle: string; company: string; duration: string } => {
  // Common patterns for employment text
  const patterns = [
    // "Software Engineer at Google (2020-Present)"
    /^(.+?)\s+at\s+(.+?)\s*\(([^)]+)\)$/i,
    // "Software Engineer, Google, 2020-Present"
    /^(.+?),\s*(.+?),\s*(.+)$/,
    // "Software Engineer - Google - 2020-Present"
    /^(.+?)\s*-\s*(.+?)\s*-\s*(.+)$/,
    // "Google: Software Engineer (2020-Present)"
    /^(.+?):\s*(.+?)\s*\(([^)]+)\)$/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        jobTitle: match[1].trim(),
        company: match[2].trim(),
        duration: match[3].trim()
      };
    }
  }
  
  // If no pattern matches, try to extract what we can
  const words = text.split(/\s+/);
  if (words.length >= 3) {
    // Look for year patterns to identify duration
    const yearPattern = /\d{4}/;
    const durationIndex = words.findIndex(word => yearPattern.test(word));
    
    if (durationIndex > 0) {
      return {
        jobTitle: words.slice(0, durationIndex - 1).join(' '),
        company: words[durationIndex - 1],
        duration: words.slice(durationIndex).join(' ')
      };
    }
  }
  
  // Fallback: just show the text as job title
  return {
    jobTitle: text,
    company: '',
    duration: ''
  };
};

export const parseEducation = (educationalQualifications: string): ParsedEducation => {
  if (!educationalQualifications || !educationalQualifications.trim()) {
    return {
      degree: 'Not specified',
      institution: '',
      year: '',
      isEmpty: true
    };
  }
  
  const text = educationalQualifications.trim();
  
  // Parse education text to extract degree, institution, and year
  const result = parseEducationText(text);
  
  return {
    ...result,
    isEmpty: false
  };
};

const parseEducationText = (text: string): { degree: string; institution: string; year: string } => {
  const lines = text.split('\n').filter(line => line.trim());
  
  // Take the first (most recent/relevant) education entry
  const firstEntry = lines[0] || text;
  
  // Common patterns for education text
  const patterns = [
    // "Bachelor of Education, University of Cape Town, 2020"
    /^(.+?),\s*(.+?),\s*(\d{4})$/,
    // "Bachelor of Education - University of Cape Town - 2020"
    /^(.+?)\s*-\s*(.+?)\s*-\s*(\d{4})$/,
    // "University of Cape Town: Bachelor of Education (2020)"
    /^(.+?):\s*(.+?)\s*\((\d{4})\)$/,
    // "Bachelor of Education from University of Cape Town (2020)"
    /^(.+?)\s+from\s+(.+?)\s*\((\d{4})\)$/i,
    // "Bachelor of Education, University of Cape Town"
    /^(.+?),\s*(.+?)$/,
  ];
  
  for (const pattern of patterns) {
    const match = firstEntry.match(pattern);
    if (match) {
      return {
        degree: match[1].trim(),
        institution: match[2].trim(),
        year: match[3] ? match[3].trim() : ''
      };
    }
  }
  
  // Look for degree keywords to identify the degree
  const degreeKeywords = ['bachelor', 'master', 'diploma', 'certificate', 'degree', 'b.ed', 'm.ed', 'ba', 'bsc', 'ma', 'msc'];
  const words = firstEntry.toLowerCase().split(/\s+/);
  
  const degreeIndex = words.findIndex(word => 
    degreeKeywords.some(keyword => word.includes(keyword))
  );
  
  if (degreeIndex !== -1) {
    // Try to extract year
    const yearMatch = firstEntry.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : '';
    
    // Try to extract institution (look for university, college, school keywords)
    const institutionKeywords = ['university', 'college', 'school', 'institute', 'academy'];
    const institutionIndex = words.findIndex(word => 
      institutionKeywords.some(keyword => word.includes(keyword))
    );
    
    if (institutionIndex !== -1) {
      const institutionWords = words.slice(institutionIndex);
      const institution = institutionWords.join(' ');
      
      return {
        degree: firstEntry.replace(new RegExp(institution, 'i'), '').replace(/\d{4}/, '').trim(),
        institution: institution.charAt(0).toUpperCase() + institution.slice(1),
        year
      };
    }
  }
  
  // Fallback: just show the text as degree
  return {
    degree: firstEntry,
    institution: '',
    year: ''
  };
};
