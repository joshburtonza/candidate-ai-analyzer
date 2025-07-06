export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      batch_resumes: {
        Row: {
          batch_id: string
          resume_id: string
        }
        Insert: {
          batch_id: string
          resume_id: string
        }
        Update: {
          batch_id?: string
          resume_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_resumes_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "upload_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_resumes_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "recent_resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_resumes_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_uploads: {
        Row: {
          completed_at: string | null
          created_at: string | null
          failed_files: number | null
          id: string
          processed_files: number | null
          source_email: string | null
          status: string | null
          total_files: number | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          failed_files?: number | null
          id?: string
          processed_files?: number | null
          source_email?: string | null
          status?: string | null
          total_files?: number | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          failed_files?: number | null
          id?: string
          processed_files?: number | null
          source_email?: string | null
          status?: string | null
          total_files?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      candidate_notes: {
        Row: {
          created_at: string | null
          id: string
          note: string
          resume_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          note: string
          resume_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          note?: string
          resume_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_notes_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "recent_resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_notes_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_uploads: {
        Row: {
          extracted_json: Json | null
          file_size: number | null
          file_url: string
          id: string
          original_filename: string
          processing_status: string | null
          source_email: string | null
          uploaded_at: string
          user_id: string | null
        }
        Insert: {
          extracted_json?: Json | null
          file_size?: number | null
          file_url: string
          id?: string
          original_filename: string
          processing_status?: string | null
          source_email?: string | null
          uploaded_at?: string
          user_id?: string | null
        }
        Update: {
          extracted_json?: Json | null
          file_size?: number | null
          file_url?: string
          id?: string
          original_filename?: string
          processing_status?: string | null
          source_email?: string | null
          uploaded_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      processed_emails: {
        Row: {
          email_id: string
          files_extracted: number | null
          id: string
          processed_at: string | null
          source_email: string
        }
        Insert: {
          email_id: string
          files_extracted?: number | null
          id?: string
          processed_at?: string | null
          source_email: string
        }
        Update: {
          email_id?: string
          files_extracted?: number | null
          id?: string
          processed_at?: string | null
          source_email?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      resume_audit_log: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          id: string
          ip_address: unknown | null
          performed_by: string | null
          resume_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          performed_by?: string | null
          resume_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          performed_by?: string | null
          resume_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_audit_log_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "recent_resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_audit_log_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          ai_insights: Json | null
          certifications: Json | null
          created_at: string
          current_company: string | null
          education_details: Json | null
          education_level: Database["public"]["Enums"]["education_level"] | null
          email: string | null
          error_details: Json | null
          experience_years: number | null
          file_name: string
          file_path: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          fit_score: number | null
          id: string
          is_archived: boolean | null
          justification: string | null
          languages: Json | null
          location: string | null
          name: string
          nationality: string | null
          notes: string | null
          original_text: string | null
          parsed_data: Json | null
          parsing_confidence: number | null
          parsing_method: string | null
          phone: string | null
          processed_at: string | null
          processing_time_ms: number | null
          role_title: string | null
          score_components: Json | null
          skills: string[] | null
          source: Database["public"]["Enums"]["file_source"] | null
          status: Database["public"]["Enums"]["resume_status"] | null
          tags: string[] | null
          total_experience_months: number | null
          updated_at: string
        }
        Insert: {
          ai_insights?: Json | null
          certifications?: Json | null
          created_at?: string
          current_company?: string | null
          education_details?: Json | null
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          email?: string | null
          error_details?: Json | null
          experience_years?: number | null
          file_name: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          fit_score?: number | null
          id?: string
          is_archived?: boolean | null
          justification?: string | null
          languages?: Json | null
          location?: string | null
          name: string
          nationality?: string | null
          notes?: string | null
          original_text?: string | null
          parsed_data?: Json | null
          parsing_confidence?: number | null
          parsing_method?: string | null
          phone?: string | null
          processed_at?: string | null
          processing_time_ms?: number | null
          role_title?: string | null
          score_components?: Json | null
          skills?: string[] | null
          source?: Database["public"]["Enums"]["file_source"] | null
          status?: Database["public"]["Enums"]["resume_status"] | null
          tags?: string[] | null
          total_experience_months?: number | null
          updated_at?: string
        }
        Update: {
          ai_insights?: Json | null
          certifications?: Json | null
          created_at?: string
          current_company?: string | null
          education_details?: Json | null
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          email?: string | null
          error_details?: Json | null
          experience_years?: number | null
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          fit_score?: number | null
          id?: string
          is_archived?: boolean | null
          justification?: string | null
          languages?: Json | null
          location?: string | null
          name?: string
          nationality?: string | null
          notes?: string | null
          original_text?: string | null
          parsed_data?: Json | null
          parsing_confidence?: number | null
          parsing_method?: string | null
          phone?: string | null
          processed_at?: string | null
          processing_time_ms?: number | null
          role_title?: string | null
          score_components?: Json | null
          skills?: string[] | null
          source?: Database["public"]["Enums"]["file_source"] | null
          status?: Database["public"]["Enums"]["resume_status"] | null
          tags?: string[] | null
          total_experience_months?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string | null
          id: string
          search_criteria: Json
          search_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          search_criteria: Json
          search_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          search_criteria?: Json
          search_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      scoring_configs: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          preferred_locations: string[] | null
          required_skills: string[] | null
          weights: Json
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          preferred_locations?: string[] | null
          required_skills?: string[] | null
          weights?: Json
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          preferred_locations?: string[] | null
          required_skills?: string[] | null
          weights?: Json
        }
        Relationships: []
      }
      upload_batches: {
        Row: {
          completed_at: string | null
          created_at: string
          failed_files: number | null
          id: string
          processed_files: number | null
          source_email: string | null
          status: string | null
          total_files: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          failed_files?: number | null
          id?: string
          processed_files?: number | null
          source_email?: string | null
          status?: string | null
          total_files?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          failed_files?: number | null
          id?: string
          processed_files?: number | null
          source_email?: string | null
          status?: string | null
          total_files?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      recent_resumes: {
        Row: {
          created_at: string | null
          email: string | null
          experience_years: number | null
          fit_score: number | null
          id: string | null
          location: string | null
          name: string | null
          skills: string[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_resume_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_count: number
          avg_score: number
          avg_experience: number
          total_today: number
          status_breakdown: Json
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_joshua_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      update_profile: {
        Args: { user_full_name: string }
        Returns: undefined
      }
    }
    Enums: {
      education_level:
        | "high_school"
        | "diploma"
        | "bachelors"
        | "masters"
        | "phd"
        | "other"
      file_source: "manual_upload" | "email" | "api" | "webhook"
      resume_status: "pending" | "processed" | "failed" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      education_level: [
        "high_school",
        "diploma",
        "bachelors",
        "masters",
        "phd",
        "other",
      ],
      file_source: ["manual_upload", "email", "api", "webhook"],
      resume_status: ["pending", "processed", "failed", "archived"],
    },
  },
} as const
