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
      achievements: {
        Row: {
          badge_color: string
          category: string
          created_at: string
          description: string
          description_en: string | null
          display_order: number
          icon: string
          id: string
          is_active: boolean
          name: string
          name_en: string | null
          points_reward: number
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          badge_color?: string
          category: string
          created_at?: string
          description: string
          description_en?: string | null
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          name_en?: string | null
          points_reward?: number
          requirement_type: string
          requirement_value: number
        }
        Update: {
          badge_color?: string
          category?: string
          created_at?: string
          description?: string
          description_en?: string | null
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string | null
          points_reward?: number
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      admin_access_logs: {
        Row: {
          access_type: string
          accessed_data_summary: string | null
          admin_user_id: string
          created_at: string
          id: string
          ip_address: string | null
          justification: string
          related_report_id: string | null
          target_resource_id: string | null
          target_resource_type: string
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_data_summary?: string | null
          admin_user_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          justification: string
          related_report_id?: string | null
          target_resource_id?: string | null
          target_resource_type: string
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_data_summary?: string | null
          admin_user_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          justification?: string
          related_report_id?: string | null
          target_resource_id?: string | null
          target_resource_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      administrative_divisions: {
        Row: {
          code: string | null
          created_at: string
          created_by: string | null
          display_order: number
          id: string
          is_active: boolean
          level: string
          name: string
          parent_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          level: string
          name: string
          parent_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          level?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "administrative_divisions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "administrative_divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_participations: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          participation_data: Json | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          participation_data?: Json | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          participation_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_participations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          campaign_type: string
          click_count: number
          created_at: string
          created_by: string
          description: string
          description_en: string | null
          display_priority: number
          end_date: string
          id: string
          image_url: string | null
          is_active: boolean
          participant_count: number
          rules: Json | null
          start_date: string
          target_audience: string
          title: string
          title_en: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          campaign_type?: string
          click_count?: number
          created_at?: string
          created_by: string
          description: string
          description_en?: string | null
          display_priority?: number
          end_date: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          participant_count?: number
          rules?: Json | null
          start_date: string
          target_audience?: string
          title: string
          title_en?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          campaign_type?: string
          click_count?: number
          created_at?: string
          created_by?: string
          description?: string
          description_en?: string | null
          display_priority?: number
          end_date?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          participant_count?: number
          rules?: Json | null
          start_date?: string
          target_audience?: string
          title?: string
          title_en?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
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
      cities: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          dining_tips: string[]
          display_order: number
          id: string
          is_active: boolean
          key: string
          name: string
          popular_areas: string[]
          popular_cuisines: string[]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          dining_tips?: string[]
          display_order?: number
          id?: string
          is_active?: boolean
          key: string
          name: string
          popular_areas?: string[]
          popular_cuisines?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          dining_tips?: string[]
          display_order?: number
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          popular_areas?: string[]
          popular_cuisines?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          created_at: string
          current_redemptions: number | null
          description: string
          description_en: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_redemptions: number | null
          min_spend: number | null
          name: string
          name_en: string | null
          points_required: number
          restaurant_id: string | null
          updated_at: string
          valid_days: number
        }
        Insert: {
          created_at?: string
          current_redemptions?: number | null
          description: string
          description_en?: string | null
          discount_type?: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_redemptions?: number | null
          min_spend?: number | null
          name: string
          name_en?: string | null
          points_required?: number
          restaurant_id?: string | null
          updated_at?: string
          valid_days?: number
        }
        Update: {
          created_at?: string
          current_redemptions?: number | null
          description?: string
          description_en?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_redemptions?: number | null
          min_spend?: number | null
          name?: string
          name_en?: string | null
          points_required?: number
          restaurant_id?: string | null
          updated_at?: string
          valid_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      cuisine_guides: {
        Row: {
          characteristics: string[]
          city_id: string
          created_at: string
          created_by: string | null
          description: string
          display_order: number
          id: string
          is_active: boolean
          must_try_dishes: string[]
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          characteristics?: string[]
          city_id: string
          created_at?: string
          created_by?: string | null
          description: string
          display_order?: number
          id?: string
          is_active?: boolean
          must_try_dishes?: string[]
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          characteristics?: string[]
          city_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          display_order?: number
          id?: string
          is_active?: boolean
          must_try_dishes?: string[]
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cuisine_guides_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
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
      dinner_photos: {
        Row: {
          created_at: string
          description: string | null
          dinner_id: string | null
          duration: number | null
          file_size: number | null
          height: number | null
          id: string
          media_type: string | null
          mime_type: string | null
          photo_url: string
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          dinner_id?: string | null
          duration?: number | null
          file_size?: number | null
          height?: number | null
          id?: string
          media_type?: string | null
          mime_type?: string | null
          photo_url: string
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          dinner_id?: string | null
          duration?: number | null
          file_size?: number | null
          height?: number | null
          id?: string
          media_type?: string | null
          mime_type?: string | null
          photo_url?: string
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dinner_photos_dinner_id_fkey"
            columns: ["dinner_id"]
            isOneToOne: false
            referencedRelation: "dinners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_dinner_photos_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
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
      invite_records: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          invite_code: string
          invitee_id: string
          invitee_rewarded: boolean
          inviter_id: string
          inviter_rewarded: boolean
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          invite_code: string
          invitee_id: string
          invitee_rewarded?: boolean
          inviter_id: string
          inviter_rewarded?: boolean
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          invite_code?: string
          invitee_id?: string
          invitee_rewarded?: boolean
          inviter_id?: string
          inviter_rewarded?: boolean
          status?: string
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
      photo_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_comment_id: string | null
          photo_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          photo_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          photo_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_photo_comments_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "photo_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "photo_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_comments_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "dinner_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_likes: {
        Row: {
          created_at: string
          id: string
          photo_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_likes_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "dinner_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      point_transactions: {
        Row: {
          created_at: string
          description: string
          id: string
          points: number
          related_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          points: number
          related_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          points?: number
          related_id?: string | null
          transaction_type?: string
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
          data_retention_days: number | null
          description: string
          evidence_urls: string[] | null
          id: string
          investigation_notes: string | null
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
          data_retention_days?: number | null
          description: string
          evidence_urls?: string[] | null
          id?: string
          investigation_notes?: string | null
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
          data_retention_days?: number | null
          description?: string
          evidence_urls?: string[] | null
          id?: string
          investigation_notes?: string | null
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
      restaurants: {
        Row: {
          area: string
          best_time: string
          city_id: string
          created_at: string
          created_by: string | null
          cuisine: string
          description: string
          display_order: number
          division_id: string | null
          group_size: string
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          price_range: string
          rating: number
          special_dishes: string[]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          area: string
          best_time: string
          city_id: string
          created_at?: string
          created_by?: string | null
          cuisine: string
          description: string
          display_order?: number
          division_id?: string | null
          group_size: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          price_range: string
          rating?: number
          special_dishes?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          area?: string
          best_time?: string
          city_id?: string
          created_at?: string
          created_by?: string | null
          cuisine?: string
          description?: string
          display_order?: number
          division_id?: string | null
          group_size?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price_range?: string
          rating?: number
          special_dishes?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurants_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "administrative_divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      restriction_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          delay_until: string | null
          id: string
          mode: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          delay_until?: string | null
          id?: string
          mode: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          delay_until?: string | null
          id?: string
          mode?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      share_records: {
        Row: {
          click_count: number
          created_at: string
          id: string
          platform: string | null
          related_id: string | null
          share_type: string
          user_id: string
          view_count: number
        }
        Insert: {
          click_count?: number
          created_at?: string
          id?: string
          platform?: string | null
          related_id?: string | null
          share_type: string
          user_id: string
          view_count?: number
        }
        Update: {
          click_count?: number
          created_at?: string
          id?: string
          platform?: string | null
          related_id?: string | null
          share_type?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          is_shared: boolean
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          is_shared?: boolean
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          is_shared?: boolean
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_coupons: {
        Row: {
          coupon_id: string
          created_at: string
          expires_at: string
          id: string
          redeemed_at: string
          status: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          expires_at: string
          id?: string
          redeemed_at?: string
          status?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          redeemed_at?: string
          status?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_coupons_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invite_codes: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          is_active: boolean
          successful_invites: number
          total_invites: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code: string
          is_active?: boolean
          successful_invites?: number
          total_invites?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          is_active?: boolean
          successful_invites?: number
          total_invites?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          achievement_points: number
          created_at: string
          dinner_points: number
          id: string
          invite_points: number
          level: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_points?: number
          created_at?: string
          dinner_points?: number
          id?: string
          invite_points?: number
          level?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_points?: number
          created_at?: string
          dinner_points?: number
          id?: string
          invite_points?: number
          level?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      admin_access_chat_messages: {
        Args: {
          justification_param?: string
          report_id_param: string
          session_id_param: string
        }
        Returns: {
          access_logged: boolean
          content: string
          created_at: string
          message_id: string
          message_type: string
          sender_id: string
          sender_nickname: string
        }[]
      }
      admin_get_reportable_chat_sessions: {
        Args: { report_id_param: string }
        Returns: {
          dinner_title: string
          last_message_at: string
          message_count: number
          participant1_nickname: string
          participant2_nickname: string
          session_created_at: string
          session_id: string
        }[]
      }
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
      cleanup_all_expired_chats: { Args: never; Returns: number }
      cleanup_resolved_report_data: { Args: never; Returns: number }
      create_user_invite_code: {
        Args: { target_user_id: string }
        Returns: string
      }
      delete_expired_chats: { Args: { user_id_param: string }; Returns: number }
      generate_invite_code: { Args: never; Returns: string }
      get_admin_cancellation_stats: {
        Args: never
        Returns: {
          cancellation_rate: number
          late_cancellations: number
          total_cancellations: number
        }[]
      }
      get_admin_dinner_stats: {
        Args: never
        Returns: {
          active_dinners: number
          cancelled_dinners: number
          completed_dinners: number
          total_dinners: number
        }[]
      }
      get_admin_user_stats: {
        Args: never
        Returns: {
          active_users: number
          new_users_this_month: number
          total_users: number
        }[]
      }
      get_city_ancestor: { Args: { _division_id: string }; Returns: string }
      get_division_descendants: {
        Args: { division_id_param: string }
        Returns: {
          code: string
          full_path: string
          id: string
          level: string
          name: string
          parent_id: string
        }[]
      }
      get_division_path: {
        Args: { division_id_param: string }
        Returns: {
          depth: number
          id: string
          level: string
          name: string
        }[]
      }
      get_invite_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          avatar_url: string
          invite_count: number
          nickname: string
          rank: number
          total_points: number
          user_id: string
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
      is_user_banned: { Args: { user_id_param: string }; Returns: boolean }
      make_user_admin: { Args: { _user_email: string }; Returns: string }
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
      process_invite_registration: {
        Args: { invitee_user_id: string; used_invite_code: string }
        Returns: Json
      }
      reactivate_chat_session: {
        Args: { session_id_param: string }
        Returns: boolean
      }
      redeem_coupon: {
        Args: { coupon_id_param: string; user_id_param: string }
        Returns: Json
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
