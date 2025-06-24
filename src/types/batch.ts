
export interface BatchUpload {
  id: string;
  user_id: string;
  batch_name: string;
  total_files: number;
  processed_files: number;
  failed_files: number;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  metadata?: Record<string, any>;
}

export interface CandidateNote {
  id: string;
  upload_id: string;
  user_id: string;
  note_text: string;
  note_type: string;
  created_at: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  search_criteria: SearchCriteria;
  created_at: string;
}

export interface SearchCriteria {
  query?: string;
  minScore?: number;
  maxScore?: number;
  skills?: string[];
  countries?: string[];
  candidateStatus?: string[];
  tags?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface AdvancedFilters {
  scoreRange: [number, number];
  skills: string[];
  countries: string[];
  candidateStatus: string[];
  tags: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}
