export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          client_id: string | null
          created_at: string | null
          end_time: string
          id: string
          notes: string | null
          service_name: string | null
          service_price: number | null
          source: string | null
          start_time: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          appointment_date: string
          client_id?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          notes?: string | null
          service_name?: string | null
          service_price?: number | null
          source?: string | null
          start_time: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          appointment_date?: string
          client_id?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          service_name?: string | null
          service_price?: number | null
          source?: string | null
          start_time?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_gaps: {
        Row: {
          campaign_id: string | null
          detected_at: string | null
          duration_minutes: number | null
          gap_date: string
          gap_end_time: string
          gap_start_time: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          detected_at?: string | null
          duration_minutes?: number | null
          gap_date: string
          gap_end_time: string
          gap_start_time: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          detected_at?: string | null
          duration_minutes?: number | null
          gap_date?: string
          gap_end_time?: string
          gap_start_time?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_gaps_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "reactivation_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_gaps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_messages: {
        Row: {
          campaign_id: string
          channel: string
          clicked_at: string | null
          client_id: string
          created_at: string | null
          id: string
          message_body: string
          opened_at: string | null
          sent_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          channel: string
          clicked_at?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          message_body: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          channel?: string
          clicked_at?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          message_body?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "reactivation_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          last_service: string | null
          last_visit_date: string | null
          lifetime_value: number | null
          next_suggested_date: string | null
          notes: string | null
          phone: string | null
          referral_source: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
          visit_count: number | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          last_service?: string | null
          last_visit_date?: string | null
          lifetime_value?: number | null
          next_suggested_date?: string | null
          notes?: string | null
          phone?: string | null
          referral_source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          visit_count?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          last_service?: string | null
          last_visit_date?: string | null
          lifetime_value?: number | null
          next_suggested_date?: string | null
          notes?: string | null
          phone?: string | null
          referral_source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          visit_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar_settings: {
        Row: {
          content_pillars: string[] | null
          created_at: string | null
          id: string
          posts_per_week_goal: number | null
          preferred_filming_day: string | null
          preferred_posting_times: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_pillars?: string[] | null
          created_at?: string | null
          id?: string
          posts_per_week_goal?: number | null
          preferred_filming_day?: string | null
          preferred_posting_times?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content_pillars?: string[] | null
          created_at?: string | null
          id?: string
          posts_per_week_goal?: number | null
          preferred_filming_day?: string | null
          preferred_posting_times?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_ideas: {
        Row: {
          content_type: string | null
          created_at: string | null
          description: string | null
          filming_notes: string | null
          id: string
          is_ai_suggested: boolean | null
          performance_notes: string | null
          platform: string | null
          published_url: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          sort_order: number | null
          status: string | null
          suggested_hook: string | null
          talking_points: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          filming_notes?: string | null
          id?: string
          is_ai_suggested?: boolean | null
          performance_notes?: string | null
          platform?: string | null
          published_url?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          sort_order?: number | null
          status?: string | null
          suggested_hook?: string | null
          talking_points?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          filming_notes?: string | null
          id?: string
          is_ai_suggested?: boolean | null
          performance_notes?: string | null
          platform?: string | null
          published_url?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          sort_order?: number | null
          status?: string | null
          suggested_hook?: string | null
          talking_points?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_ideas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          booking_link: string | null
          booking_platform: string | null
          business_name: string | null
          business_type: string | null
          city: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          google_business_profile_url: string | null
          id: string
          onboarding_completed: boolean | null
          phone: string | null
          state: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          booking_link?: string | null
          booking_platform?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          google_business_profile_url?: string | null
          id: string
          onboarding_completed?: boolean | null
          phone?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          booking_link?: string | null
          booking_platform?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          google_business_profile_url?: string | null
          id?: string
          onboarding_completed?: boolean | null
          phone?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reactivation_campaigns: {
        Row: {
          booking_count: number | null
          campaign_type: string | null
          channel: string | null
          created_at: string | null
          id: string
          message_template: string
          name: string
          open_count: number | null
          send_count: number | null
          status: string | null
          target_criteria: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_count?: number | null
          campaign_type?: string | null
          channel?: string | null
          created_at?: string | null
          id?: string
          message_template: string
          name: string
          open_count?: number | null
          send_count?: number | null
          status?: string | null
          target_criteria?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_count?: number | null
          campaign_type?: string | null
          channel?: string | null
          created_at?: string | null
          id?: string
          message_template?: string
          name?: string
          open_count?: number | null
          send_count?: number | null
          status?: string | null
          target_criteria?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactivation_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_request_settings: {
        Row: {
          auto_request_enabled: boolean | null
          created_at: string | null
          delay_after_appointment_hours: number | null
          id: string
          message_template: string | null
          preferred_platform: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_request_enabled?: boolean | null
          created_at?: string | null
          delay_after_appointment_hours?: number | null
          id?: string
          message_template?: string | null
          preferred_platform?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_request_enabled?: boolean | null
          created_at?: string | null
          delay_after_appointment_hours?: number | null
          id?: string
          message_template?: string | null
          preferred_platform?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_request_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          platform: string | null
          rating: number | null
          request_sent_at: string | null
          responded_at: string | null
          response_text: string | null
          review_date: string | null
          review_request_sent: boolean | null
          review_text: string | null
          reviewer_name: string | null
          source_url: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          platform?: string | null
          rating?: number | null
          request_sent_at?: string | null
          responded_at?: string | null
          response_text?: string | null
          review_date?: string | null
          review_request_sent?: boolean | null
          review_text?: string | null
          reviewer_name?: string | null
          source_url?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          platform?: string | null
          rating?: number | null
          request_sent_at?: string | null
          responded_at?: string | null
          response_text?: string | null
          review_date?: string | null
          review_request_sent?: boolean | null
          review_text?: string | null
          reviewer_name?: string | null
          source_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
