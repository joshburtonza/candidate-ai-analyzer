export interface CandidateData {
  candidate_name: string;
  email_address: string;
  contact_number: string;
  educational_qualifications: string;
  job_history: string;
  current_employment: string; // Changed from skill_set
  score: string;
  justification: string;
  countries: string;
  date_recieved: string; // Date when CV was received (legacy spelling)
  date_received?: string; // Date when CV was received (correct spelling)
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
  received_at?: string; // New column: full timestamp when CV was received
  received_date?: string; // New column: date-only when CV was received (YYYY-MM-DD)
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
}
