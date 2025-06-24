
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
  selectedDates?: Date[];
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
  selectedDates?: string[];
}

export interface BatchUpload {
  id: string;
  user_id: string;
  batch_name: string;
  total_files: number;
  processed_files: number;
  failed_files: number;
  status: 'processing' | 'completed' | 'error';
  created_at: string;
  completed_at?: string;
  metadata?: Record<string, any>;
}
