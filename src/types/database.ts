export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          nickname: string;
          gender?: string;
          birth_year?: number;
          food_preferences?: string[];
          meal_times?: string[];
          accept_strangers?: boolean;
          avatar_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nickname: string;
          gender?: string;
          birth_year?: number;
          food_preferences?: string[];
          meal_times?: string[];
          accept_strangers?: boolean;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nickname?: string;
          gender?: string;
          birth_year?: number;
          food_preferences?: string[];
          meal_times?: string[];
          accept_strangers?: boolean;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      dinners: {
        Row: {
          id: string;
          created_by: string;
          title: string;
          description?: string;
          dinner_time: string;
          location: string;
          max_participants: number;
          food_preferences?: string[];
          friends_only?: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          title: string;
          description?: string;
          dinner_time: string;
          location: string;
          max_participants: number;
          food_preferences?: string[];
          friends_only?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_by?: string;
          title?: string;
          description?: string;
          dinner_time?: string;
          location?: string;
          max_participants?: number;
          food_preferences?: string[];
          friends_only?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      dinner_participants: {
        Row: {
          id: string;
          dinner_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          dinner_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          dinner_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Dinner = Database['public']['Tables']['dinners']['Row'];
export type DinnerParticipant = Database['public']['Tables']['dinner_participants']['Row'];