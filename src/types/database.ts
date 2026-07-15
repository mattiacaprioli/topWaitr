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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          shift_id: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          waiter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          shift_id: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          waiter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          shift_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          waiter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_waiter_id_fkey"
            columns: ["waiter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          manager_id: string
          shift_id: string | null
          waiter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          manager_id: string
          shift_id?: string | null
          waiter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          manager_id?: string
          shift_id?: string | null
          waiter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_waiter_id_fkey"
            columns: ["waiter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          related_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          related_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          related_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
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
          bio: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          onboarding_complete: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          onboarding_complete?: boolean
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarding_complete?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          receipt_ref: string | null
          reviewer_name: string | null
          shift_id: string | null
          status: string
          tags: string[]
          venue_id: string | null
          verified: boolean
          waiter_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          receipt_ref?: string | null
          reviewer_name?: string | null
          shift_id?: string | null
          status?: string
          tags?: string[]
          venue_id?: string | null
          verified?: boolean
          waiter_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          receipt_ref?: string | null
          reviewer_name?: string | null
          shift_id?: string | null
          status?: string
          tags?: string[]
          venue_id?: string | null
          verified?: boolean
          waiter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_waiter_id_fkey"
            columns: ["waiter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_assignments: {
        Row: {
          created_at: string
          id: string
          shift_id: string
          staff_member_id: string
          status: Database["public"]["Enums"]["assignment_status"]
          worked_hours: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          shift_id: string
          staff_member_id: string
          status?: Database["public"]["Enums"]["assignment_status"]
          worked_hours?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          shift_id?: string
          staff_member_id?: string
          status?: Database["public"]["Enums"]["assignment_status"]
          worked_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_role_requirements: {
        Row: {
          count: number
          created_at: string
          id: string
          role: string
          shift_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          id?: string
          role: string
          shift_id: string
        }
        Update: {
          count?: number
          created_at?: string
          id?: string
          role?: string
          shift_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_role_requirements_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string
          date: string
          description: string | null
          dress_code: string | null
          end_time: string
          hourly_rate: number | null
          id: string
          kind: Database["public"]["Enums"]["shift_kind"]
          positions_filled: number
          positions_total: number
          requirements: string[] | null
          start_time: string
          status: Database["public"]["Enums"]["shift_status"]
          title: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          dress_code?: string | null
          end_time: string
          hourly_rate?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["shift_kind"]
          positions_filled?: number
          positions_total?: number
          requirements?: string[] | null
          start_time: string
          status?: Database["public"]["Enums"]["shift_status"]
          title: string
          venue_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          dress_code?: string | null
          end_time?: string
          hourly_rate?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["shift_kind"]
          positions_filled?: number
          positions_total?: number
          requirements?: string[] | null
          start_time?: string
          status?: Database["public"]["Enums"]["shift_status"]
          title?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          created_at: string
          display_name: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          id: string
          link_status: Database["public"]["Enums"]["staff_link_status"]
          note: string | null
          phone: string | null
          role: string | null
          venue_id: string
          waiter_id: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          id?: string
          link_status?: Database["public"]["Enums"]["staff_link_status"]
          note?: string | null
          phone?: string | null
          role?: string | null
          venue_id: string
          waiter_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          id?: string
          link_status?: Database["public"]["Enums"]["staff_link_status"]
          note?: string | null
          phone?: string | null
          role?: string | null
          venue_id?: string
          waiter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_members_waiter_id_fkey"
            columns: ["waiter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          cuisine_type: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          cuisine_type?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          cuisine_type?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waiter_experiences: {
        Row: {
          company_name: string
          created_at: string
          detail: string | null
          end_year: number | null
          id: string
          role: string | null
          start_year: number | null
          waiter_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          detail?: string | null
          end_year?: number | null
          id?: string
          role?: string | null
          start_year?: number | null
          waiter_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          detail?: string | null
          end_year?: number | null
          id?: string
          role?: string | null
          start_year?: number | null
          waiter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiter_experiences_waiter_id_fkey"
            columns: ["waiter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waiter_profiles: {
        Row: {
          availability_days: string[] | null
          certifications: string[] | null
          cv_url: string | null
          documents: string[] | null
          experience: string | null
          hourly_rate_min: number | null
          id: string
          languages: string[]
          primary_role: string | null
          rating_avg: number
          rating_count: number
          skills: string[]
          specializations: string | null
          years_experience: number | null
        }
        Insert: {
          availability_days?: string[] | null
          certifications?: string[] | null
          cv_url?: string | null
          documents?: string[] | null
          experience?: string | null
          hourly_rate_min?: number | null
          id: string
          languages?: string[]
          primary_role?: string | null
          rating_avg?: number
          rating_count?: number
          skills?: string[]
          specializations?: string | null
          years_experience?: number | null
        }
        Update: {
          availability_days?: string[] | null
          certifications?: string[] | null
          cv_url?: string | null
          documents?: string[] | null
          experience?: string | null
          hourly_rate_min?: number | null
          id?: string
          languages?: string[]
          primary_role?: string | null
          rating_avg?: number
          rating_count?: number
          skills?: string[]
          specializations?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "waiter_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      waiter_public_cards: {
        Row: {
          avatar_url: string | null
          city: string | null
          full_name: string | null
          id: string | null
          primary_role: string | null
          rating_avg: number | null
          rating_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      find_waiter_by_email: {
        Args: { p_email: string }
        Returns: {
          avatar_url: string
          city: string
          full_name: string
          id: string
        }[]
      }
      get_rating_breakdown: {
        Args: { p_waiter: string }
        Returns: {
          cnt: number
          rating: number
        }[]
      }
      leave_venue: { Args: { p_staff_id: string }; Returns: undefined }
      respond_to_staff_invite: {
        Args: { p_accept: boolean; p_staff_id: string }
        Returns: undefined
      }
    }
    Enums: {
      application_status: "pending" | "accepted" | "rejected" | "cancelled"
      assignment_status: "assigned" | "confirmed" | "declined" | "no_show"
      employment_type: "fisso" | "a_chiamata"
      notification_type:
        | "application_received"
        | "application_accepted"
        | "application_rejected"
        | "new_message"
        | "shift_assigned"
        | "shift_cancelled"
        | "staff_invite"
        | "staff_response"
        | "staff_removed"
      shift_kind: "marketplace" | "internal"
      shift_status: "open" | "closed" | "cancelled"
      staff_link_status: "pending" | "active"
      user_role: "waiter" | "manager"
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
      application_status: ["pending", "accepted", "rejected", "cancelled"],
      assignment_status: ["assigned", "confirmed", "declined", "no_show"],
      employment_type: ["fisso", "a_chiamata"],
      notification_type: [
        "application_received",
        "application_accepted",
        "application_rejected",
        "new_message",
        "shift_assigned",
        "shift_cancelled",
        "staff_invite",
        "staff_response",
        "staff_removed",
      ],
      shift_kind: ["marketplace", "internal"],
      shift_status: ["open", "closed", "cancelled"],
      staff_link_status: ["pending", "active"],
      user_role: ["waiter", "manager"],
    },
  },
} as const
