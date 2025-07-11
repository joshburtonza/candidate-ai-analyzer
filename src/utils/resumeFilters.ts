import { Resume } from '@/types/candidate';

export const filterValidResumes = (resumes: Resume[]): Resume[] => {
  return resumes.filter(resume => 
    resume && 
    !resume.is_archived &&
    resume.name &&
    resume.email
  );
};

export const filterValidResumesForDate = (resumes: Resume[], selectedDate: Date): Resume[] => {
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  return resumes.filter(resume => {
    if (!resume || resume.is_archived || !resume.name || !resume.email) {
      return false;
    }
    
    const resumeDate = new Date(resume.created_at);
    return resumeDate >= startOfDay && resumeDate <= endOfDay;
  });
};

export const filterBestResumes = (resumes: Resume[]): Resume[] => {
  return resumes.filter(resume => {
    if (!resume || resume.is_archived || !resume.name || !resume.email) {
      return false;
    }

    // Check education level for teaching qualifications
    const hasTeachingQualification = resume.education_level && 
      (resume.education_level.toLowerCase().includes('b.ed') ||
       resume.education_level.toLowerCase().includes('pgce') ||
       resume.education_level.toLowerCase().includes('bachelor of education') ||
       resume.education_level.toLowerCase().includes('postgraduate certificate in education'));

    // Check experience (2+ years)
    const hasExperience = resume.experience_years && resume.experience_years >= 2;

    // Check for academic subjects in skills or role
    const skills = resume.skills?.join(' ').toLowerCase() || '';
    const roleTitle = resume.role_title?.toLowerCase() || '';
    const hasAcademicSubjects = skills.includes('math') || skills.includes('english') || 
                               skills.includes('science') || skills.includes('history') ||
                               roleTitle.includes('teacher') || roleTitle.includes('tutor');

    // Check location/nationality for preferred countries
    const location = resume.location?.toLowerCase() || '';
    const nationality = resume.nationality?.toLowerCase() || '';
    const preferredCountries = ['uk', 'usa', 'australia', 'new zealand', 'canada', 'ireland', 'south africa', 'dubai'];
    const isFromPreferredCountry = preferredCountries.some(country => 
      location.includes(country) || nationality.includes(country)
    );

    return hasTeachingQualification && hasExperience && hasAcademicSubjects && isFromPreferredCountry;
  });
};

export const filterBestResumesForDate = (resumes: Resume[], selectedDate: Date): Resume[] => {
  const dateFiltered = filterValidResumesForDate(resumes, selectedDate);
  return filterBestResumes(dateFiltered);
};