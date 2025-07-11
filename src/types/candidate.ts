export interface CandidateData {
  candidate_name: string;
  email_address: string;
  contact_number: string;
  educational_qualifications: string;
  job_history: string;
  skill_set: string;
  score: string;
  justification: string;
  countries: string; // Keep as string for consistency in UI
  current_role?: string; // Add current role field
}

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

// Resume interface for the new data structure
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
  education_level: string | null;
  education_details: any | null;
  skills: string[] | null;
  fit_score: number | null;
  justification: string | null;
  notes: string | null;
  tags: string[] | null;
  file_name: string;
  file_url: string | null;
  file_size: number | null;
  file_type: string | null;
  status: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  is_archived: boolean | null;
  languages: any | null;
  certifications: any | null;
  ai_insights: any | null;
  score_components: any | null;
  parsed_data: any | null;
  parsing_confidence: number | null;
  processing_time_ms: number | null;
  error_details: any | null;
  parsing_method: string | null;
  original_text: string | null;
  total_experience_months: number | null;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
}
