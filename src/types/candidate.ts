
// Main interface for candidates
export interface Candidate {
  id: string;
  full_name: string;
  email: string | null;
  contact_number: string | null;
  score: number | null;
  justification: string | null;
  professional_assessment: string | null;
  created_at: string;
  updated_at: string;
}

// Legacy interface for backward compatibility (will be removed after migration)
export interface Resume {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  nationality: string | null;
  role_title: string | null;
  current_company: string | null;
  experience_years: number | null;
  total_experience_months: number | null;
  education_level: string | null;
  education_details: any;
  skills: string[] | null;
  languages: any;
  certifications: any;
  fit_score: number | null;
  justification: string | null;
  ai_insights: any;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  file_url: string | null;
  file_path: string | null;
  original_text: string | null;
  parsing_method: string | null;
  parsing_confidence: number | null;
  processing_time_ms: number | null;
  status: 'pending' | 'processed' | 'failed' | 'archived' | null;
  source: 'manual_upload' | 'email' | 'api' | 'webhook' | null;
  tags: string[] | null;
  notes: string | null;
  is_archived: boolean | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  error_details: any;
  parsed_data: any;
  score_components: any;
}

// Legacy interface for backward compatibility (will be removed after migration)
export interface CandidateData {
  candidate_name: string;
  email_address: string;
  contact_number: string;
  educational_qualifications: string;
  job_history: string;
  skill_set: string;
  score: string;
  justification: string;
  countries: string;
}

// Legacy interface for backward compatibility (will be removed after migration)
export interface CVUpload {
  id: string;
  user_id: string;
  file_url: string;
  extracted_json: CandidateData | null;
  original_filename: string;
  uploaded_at: string;
  source_email?: string;
  file_size?: number;
  processing_status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
}
