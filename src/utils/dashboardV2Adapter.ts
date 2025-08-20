// Adapter to convert CVUpload data to Dashboard V2 format

import { CVUpload } from '@/types/candidate';
import { DashboardCandidate } from '@/types/dashboardV2';

const generateAvatar = (name: string): string => {
  // Generate deterministic avatar from Unsplash based on name hash
  const nameHash = name ? Math.abs(name.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0)) : 0;
  const avatarId = 100 + (nameHash % 50); // IDs 100-149
  return `https://images.unsplash.com/photo-1${String(avatarId).padStart(3, '0')}0000000?q=80&w=200&h=200&fit=crop&crop=faces`;
};

const parseExperience = (jobHistory: string): number => {
  // Extract years of experience from job history
  const experienceMatch = jobHistory?.match(/(\d+)\s*(?:years?|yrs?)/i);
  if (experienceMatch) return parseInt(experienceMatch[1]);
  
  // Fallback: count number of jobs mentioned
  const jobCount = (jobHistory?.split(/\n|;|,/).filter(line => line.trim().length > 10) || []).length;
  return Math.min(Math.max(jobCount * 2, 1), 15); // Assume 2 years per job, max 15
};

const parseCurrentEmployment = (currentEmployment: string) => {
  if (!currentEmployment) return {
    role: 'Not specified',
    org: 'Not specified',
    dates: 'Not specified'
  };

  const lines = currentEmployment.split('\n').filter(line => line.trim());
  if (lines.length >= 2) {
    return {
      role: lines[0].trim(),
      org: lines[1].trim(),
      dates: lines[2]?.trim() || 'Current'
    };
  }

  return {
    role: lines[0] || 'Not specified',
    org: 'Not specified',
    dates: 'Current'
  };
};

const parseEducation = (education: string): string[] => {
  if (!education) return ['Education not specified'];
  
  const lines = education.split('\n').filter(line => line.trim());
  return lines.length > 0 ? lines : ['Education not specified'];
};

const extractSkills = (data: any): string[] => {
  // Try to extract skills from various fields
  const skillsText = data.skill_set || data.current_employment || data.job_history || '';
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'SQL', 'AWS',
    'Docker', 'Git', 'HTML', 'CSS', 'MongoDB', 'PostgreSQL', 'GraphQL', 'REST API',
    'UI/UX', 'Figma', 'Design Systems', 'Agile', 'Scrum', 'Leadership', 'Project Management'
  ];
  
  const foundSkills = commonSkills.filter(skill => 
    skillsText.toLowerCase().includes(skill.toLowerCase())
  );
  
  return foundSkills.length > 0 ? foundSkills.slice(0, 8) : ['General Skills'];
};

const calculateFitScore = (data: any): number => {
  let score = 5; // Base score
  
  // Boost for having score data
  if (data.score && !isNaN(parseFloat(data.score))) {
    const originalScore = parseFloat(data.score);
    score = Math.max(Math.min(Math.ceil(originalScore), 10), 1);
  } else {
    // Fallback scoring based on data completeness
    if (data.candidate_name) score += 1;
    if (data.email_address) score += 1;
    if (data.contact_number) score += 1;
    if (data.educational_qualifications) score += 1;
    if (data.current_employment) score += 1;
  }
  
  return Math.max(Math.min(score, 10), 1);
};

const formatReceived = (receivedDate?: string): string => {
  if (!receivedDate) return 'Unknown';
  
  const today = new Date();
  const received = new Date(receivedDate);
  const diffDays = Math.floor((today.getTime() - received.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return received.toLocaleDateString();
};

export const adaptCVUploadToDashboardCandidate = (upload: CVUpload): DashboardCandidate => {
  const data = upload.extracted_json;
  
  if (!data) {
    // Fallback for uploads without extracted data
    return {
      id: upload.id,
      name: 'Processing...',
      title: 'Position unknown',
      location: 'Location unknown',
      experience: 0,
      availability: 'Unknown',
      salary: 'Not specified',
      skills: ['Processing'],
      email: upload.source_email || 'Unknown',
      phone: 'Not specified',
      remote: false,
      lastCompany: 'Unknown',
      verified: false,
      current: {
        role: 'Processing...',
        org: 'Unknown',
        dates: 'Unknown'
      },
      education: ['Processing...'],
      fitScore: 1,
      scoreJustification: 'Data still being processed',
      receivedAt: formatReceived(upload.received_date),
      summary: 'CV is currently being processed. Please check back shortly.',
      avatar: generateAvatar('processing')
    };
  }

  const name = data.candidate_name || 'Unknown Candidate';
  const experience = parseExperience(data.job_history);
  const current = parseCurrentEmployment(data.current_employment);
  const education = parseEducation(data.educational_qualifications);
  const skills = extractSkills(data);
  const fitScore = calculateFitScore(data);

  return {
    id: upload.id,
    name,
    title: current.role,
    location: data.countries || 'Location not specified',
    experience,
    availability: 'Available', // Default - could be enhanced
    salary: 'Negotiable', // Default - could be enhanced  
    skills,
    email: data.email_address || upload.source_email || 'Not specified',
    phone: data.contact_number || 'Not specified',
    remote: true, // Default assumption
    lastCompany: current.org,
    verified: !!data.email_address, // Verified if we have email
    current,
    education,
    fitScore,
    scoreJustification: data.justification || undefined,
    receivedAt: formatReceived(upload.received_date),
    summary: data.justification || `${experience} years of experience in ${current.role}`,
    avatar: generateAvatar(name)
  };
};

export const adaptCVUploadsToDashboardCandidates = (uploads: CVUpload[]): DashboardCandidate[] => {
  return uploads.map(adaptCVUploadToDashboardCandidate);
};