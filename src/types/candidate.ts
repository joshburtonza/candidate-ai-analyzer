
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
  candidate_status?: string;
  notes?: string;
  tags?: string[];
  score_breakdown?: Record<string, any>;
  batch_id?: string;
  last_updated_by?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
}
