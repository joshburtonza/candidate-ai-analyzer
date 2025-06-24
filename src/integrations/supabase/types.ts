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
      batch_uploads: {
        Row: {
          batch_name: string
          completed_at: string | null
          created_at: string | null
          failed_files: number
          id: string
          metadata: Json | null
          processed_files: number
          status: string
          total_files: number
          user_id: string
        }
        Insert: {
          batch_name: string
          completed_at?: string | null
          created_at?: string | null
          failed_files?: number
          id?: string
          metadata?: Json | null
          processed_files?: number
          status?: string
          total_files?: number
          user_id: string
        }
        Update: {
          batch_name?: string
          completed_at?: string | null
          created_at?: string | null
          failed_files?: number
          id?: string
          metadata?: Json | null
          processed_files?: number
          status?: string
          total_files?: number
          user_id?: string
        }
        Relationships: []
      }
      candidate_notes: {
        Row: {
          created_at: string | null
          id: string
          note_text: string
          note_type: string | null
          upload_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          note_text: string
          note_type?: string | null
          upload_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          note_text?: string
          note_type?: string | null
          upload_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_notes_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "cv_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_uploads: {
        Row: {
          batch_id: string | null
          candidate_status: string | null
          extracted_json: Json | null
          file_size: number | null
          file_url: string
          id: string
          last_updated_by: string | null
          notes: string | null
          original_filename: string
          processing_status: string | null
          score_breakdown: Json | null
          source_email: string | null
          tags: string[] | null
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          batch_id?: string | null
          candidate_status?: string | null
          extracted_json?: Json | null
          file_size?: number | null
          file_url: string
          id?: string
          last_updated_by?: string | null
          notes?: string | null
          original_filename: string
          processing_status?: string | null
          score_breakdown?: Json | null
          source_email?: string | null
          tags?: string[] | null
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          batch_id?: string | null
          candidate_status?: string | null
          extracted_json?: Json | null
          file_size?: number | null
          file_url?: string
          id?: string
          last_updated_by?: string | null
          notes?: string | null
          original_filename?: string
          processing_status?: string | null
          score_breakdown?: Json | null
          source_email?: string | null
          tags?: string[] | null
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cv_uploads_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string | null
          id: string
          name: string
          search_criteria: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          search_criteria: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          search_criteria?: Json
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      update_batch_progress: {
        Args: { batch_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
