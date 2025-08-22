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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      cancellation_records: {
        Row: {
          cancellation_reason: string | null
          cancellation_type: string
          cancelled_at: string
          created_at: string
          dinner_id: string
          dinner_start_time: string
          hours_before_start: number
          id: string
          is_late_cancellation: boolean
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancellation_type: string
          cancelled_at?: string
          created_at?: string
          dinner_id: string
          dinner_start_time: string
          hours_before_start: number
          id?: string
          is_late_cancellation?: boolean
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          cancellation_type?: string
          cancelled_at?: string
          created_at?: string
          dinner_id?: string
          dinner_start_time?: string
          hours_before_start?: number
          id?: string
          is_late_cancellation?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_records_dinner_id_fkey"
            columns: ["dinner_id"]
            isOneToOne: false
            referencedRelation: "dinners"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          message_type: string | null
          sender_id: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          sender_id: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          sender_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_chat_messages_session_id"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          can_chat_until: string | null
          created_at: string
          dinner_id: string
          id: string
          participant1_id: string
          participant2_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          can_chat_until?: string | null
          created_at?: string
          dinner_id: string
          id?: string
          participant1_id: string
          participant2_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          can_chat_until?: string | null
          created_at?: string
          dinner_id?: string
          id?: string
          participant1_id?: string
          participant2_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_chat_sessions_dinner_id"
            columns: ["dinner_id"]
            isOneToOne: false
            referencedRelation: "dinners"
            referencedColumns: ["id"]
          },
        ]
      }
      dinner_participants: {
        Row: {
          dinner_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          dinner_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          dinner_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_dinner_participants_dinner_id"
            columns: ["dinner_id"]
            isOneToOne: false
            referencedRelation: "dinners"
            referencedColumns: ["id"]
          },
        ]
      }
      dinners: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          dietary_restrictions: string[] | null
          dinner_mode: string | null
          dinner_time: string
          food_preferences: string[] | null
          friends_only: boolean | null
          gender_preference: string | null
          id: string
          location: string
          max_participants: number
          personality_tags: string[] | null
          status: string | null
          title: string
          updated_at: string
          urgency_level: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          dietary_restrictions?: string[] | null
          dinner_mode?: string | null
          dinner_time: string
          food_preferences?: string[] | null
          friends_only?: boolean | null
          gender_preference?: string | null
          id?: string
          location: string
          max_participants: number
          personality_tags?: string[] | null
          status?: string | null
          title: string
          updated_at?: string
          urgency_level?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          dietary_restrictions?: string[] | null
          dinner_mode?: string | null
          dinner_time?: string
          food_preferences?: string[] | null
          friends_only?: boolean | null
          gender_preference?: string | null
          id?: string
          location?: string
          max_participants?: number
          personality_tags?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string
          urgency_level?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_dinner_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_dinner_id?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_dinner_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accept_strangers: boolean | null
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          banned_by: string | null
          banned_until: string | null
          birth_year: number | null
          created_at: string
          dietary_restrictions: string[] | null
          food_preferences: string[] | null
          gender: string | null
          gender_preference: string | null
          id: string
          is_banned: boolean | null
          location_latitude: number | null
          location_longitude: number | null
          meal_times: string[] | null
          nickname: string
          personality_tags: string[] | null
          preferred_radius: number | null
          qq_openid: string | null
          updated_at: string
          user_id: string
          wechat_openid: string | null
        }
        Insert: {
          accept_strangers?: boolean | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          banned_until?: string | null
          birth_year?: number | null
          created_at?: string
          dietary_restrictions?: string[] | null
          food_preferences?: string[] | null
          gender?: string | null
          gender_preference?: string | null
          id?: string
          is_banned?: boolean | null
          location_latitude?: number | null
          location_longitude?: number | null
          meal_times?: string[] | null
          nickname: string
          personality_tags?: string[] | null
          preferred_radius?: number | null
          qq_openid?: string | null
          updated_at?: string
          user_id: string
          wechat_openid?: string | null
        }
        Update: {
          accept_strangers?: boolean | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          banned_until?: string | null
          birth_year?: number | null
          created_at?: string
          dietary_restrictions?: string[] | null
          food_preferences?: string[] | null
          gender?: string | null
          gender_preference?: string | null
          id?: string
          is_banned?: boolean | null
          location_latitude?: number | null
          location_longitude?: number | null
          meal_times?: string[] | null
          nickname?: string
          personality_tags?: string[] | null
          preferred_radius?: number | null
          qq_openid?: string | null
          updated_at?: string
          user_id?: string
          wechat_openid?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          description: string
          evidence_urls: string[] | null
          id: string
          related_chat_session_id: string | null
          related_dinner_id: string | null
          report_type: string
          reported_user_id: string | null
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string
          description: string
          evidence_urls?: string[] | null
          id?: string
          related_chat_session_id?: string | null
          related_dinner_id?: string | null
          report_type: string
          reported_user_id?: string | null
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description?: string
          evidence_urls?: string[] | null
          id?: string
          related_chat_session_id?: string | null
          related_dinner_id?: string | null
          report_type?: string
          reported_user_id?: string | null
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_related_chat_session_id_fkey"
            columns: ["related_chat_session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_related_dinner_id_fkey"
            columns: ["related_dinner_id"]
            isOneToOne: false
            referencedRelation: "dinners"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_match_score: {
        Args: { dinner_id_param: string; user_id_param: string }
        Returns: number
      }
      can_view_dinner_participants: {
        Args: { target_dinner_id: string; target_user_id: string }
        Returns: boolean
      }
      cancel_dinner: {
        Args: {
          cancellation_reason_param?: string
          dinner_id_param: string
          user_id_param: string
        }
        Returns: {
          cancellation_type: string
          is_late_cancellation: boolean
          message: string
          success: boolean
        }[]
      }
      check_user_cancellation_restrictions: {
        Args: { user_id_param: string }
        Returns: {
          can_create_dinner: boolean
          late_cancellation_count: number
          restriction_end_date: string
          restriction_reason: string
        }[]
      }
      get_admin_cancellation_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          cancellation_rate: number
          late_cancellations: number
          total_cancellations: number
        }[]
      }
      get_admin_dinner_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_dinners: number
          cancelled_dinners: number
          completed_dinners: number
          total_dinners: number
        }[]
      }
      get_admin_user_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_users: number
          new_users_this_month: number
          total_users: number
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_banned: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      make_user_admin: {
        Args: { _user_email: string }
        Returns: string
      }
      manage_user_permissions: {
        Args: {
          action: string
          ban_duration_hours?: number
          reason?: string
          target_user_id: string
        }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      send_dinner_cancellation_notifications: {
        Args: {
          cancellation_type: string
          canceller_user_id: string
          dinner_id_param: string
          reason?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
