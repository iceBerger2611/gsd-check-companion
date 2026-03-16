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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      care_links: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          last_synced_at: string | null
          patient_id: string
          status: string
          supervisor_id: string
          sync_error: string | null
          sync_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_synced_at?: string | null
          patient_id: string
          status?: string
          supervisor_id: string
          sync_error?: string | null
          sync_status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_synced_at?: string | null
          patient_id?: string
          status?: string
          supervisor_id?: string
          sync_error?: string | null
          sync_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_links_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_links_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tokens: {
        Row: {
          device_label: string | null
          expo_push_token: string
          id: string
          platform: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          device_label?: string | null
          expo_push_token: string
          id?: string
          platform?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          device_label?: string | null
          expo_push_token?: string
          id?: string
          platform?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      followups: {
        Row: {
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          due_at: string
          id: string
          last_synced_at: string | null
          patient_id: string
          photo_path: string | null
          photo_url: string | null
          reading_id: string
          scheduled_notification_ids: string[]
          status: string
          sync_error: string | null
          sync_status: string
          type: Database["public"]["Enums"]["followup_type"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          due_at: string
          id?: string
          last_synced_at?: string | null
          patient_id: string
          photo_path?: string | null
          photo_url?: string | null
          reading_id: string
          scheduled_notification_ids?: string[]
          status?: string
          sync_error?: string | null
          sync_status?: string
          type: Database["public"]["Enums"]["followup_type"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          due_at?: string
          id?: string
          last_synced_at?: string | null
          patient_id?: string
          photo_path?: string | null
          photo_url?: string | null
          reading_id?: string
          scheduled_notification_ids?: string[]
          status?: string
          sync_error?: string | null
          sync_status?: string
          type?: Database["public"]["Enums"]["followup_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "followups_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followups_reading_id_fkey"
            columns: ["reading_id"]
            isOneToOne: false
            referencedRelation: "readings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          deleted_at: string | null
          display_name: string | null
          id: string
          last_synced_at: string | null
          role: string | null
          sync_error: string | null
          sync_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          id: string
          last_synced_at?: string | null
          role?: string | null
          sync_error?: string | null
          sync_status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          id?: string
          last_synced_at?: string | null
          role?: string | null
          sync_error?: string | null
          sync_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      readings: {
        Row: {
          cornstarch_photo_url: string | null
          created_at: string
          deleted_at: string | null
          evaluated_decision: Json | null
          final_decision: Json | null
          glucose_value: number
          id: string
          last_synced_at: string | null
          meter_photo_url: string | null
          note: string | null
          outcome: string
          patient_id: string
          recorded_at: string
          sync_error: string | null
          sync_status: string
          unit: string
          updated_at: string
          was_overridden: boolean | null
        }
        Insert: {
          cornstarch_photo_url?: string | null
          created_at?: string
          deleted_at?: string | null
          evaluated_decision?: Json | null
          final_decision?: Json | null
          glucose_value: number
          id?: string
          last_synced_at?: string | null
          meter_photo_url?: string | null
          note?: string | null
          outcome: string
          patient_id: string
          recorded_at: string
          sync_error?: string | null
          sync_status?: string
          unit: string
          updated_at?: string
          was_overridden?: boolean | null
        }
        Update: {
          cornstarch_photo_url?: string | null
          created_at?: string
          deleted_at?: string | null
          evaluated_decision?: Json | null
          final_decision?: Json | null
          glucose_value?: number
          id?: string
          last_synced_at?: string | null
          meter_photo_url?: string | null
          note?: string | null
          outcome?: string
          patient_id?: string
          recorded_at?: string
          sync_error?: string | null
          sync_status?: string
          unit?: string
          updated_at?: string
          was_overridden?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "readings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_state: {
        Row: {
          last_notified_at: string | null
          last_outcome: string | null
          last_reading_at: string | null
          last_value: number | null
          next_due_at: string
          overdue_since: string | null
          patient_id: string
          updated_at: string
        }
        Insert: {
          last_notified_at?: string | null
          last_outcome?: string | null
          last_reading_at?: string | null
          last_value?: number | null
          next_due_at: string
          overdue_since?: string | null
          patient_id: string
          updated_at?: string
        }
        Update: {
          last_notified_at?: string | null
          last_outcome?: string | null
          last_reading_at?: string | null
          last_value?: number | null
          next_due_at?: string
          overdue_since?: string | null
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_state_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      threshold_rules: {
        Row: {
          actions: Json
          classification: Database["public"]["Enums"]["threshold_rule_classification"]
          created_at: string
          deleted_at: string | null
          id: string
          label: string
          last_synced_at: string | null
          max_value: number | null
          min_value: number | null
          patient_id: string
          sync_error: string | null
          sync_status: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          classification: Database["public"]["Enums"]["threshold_rule_classification"]
          created_at?: string
          deleted_at?: string | null
          id?: string
          label: string
          last_synced_at?: string | null
          max_value?: number | null
          min_value?: number | null
          patient_id: string
          sync_error?: string | null
          sync_status?: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          classification?: Database["public"]["Enums"]["threshold_rule_classification"]
          created_at?: string
          deleted_at?: string | null
          id?: string
          label?: string
          last_synced_at?: string | null
          max_value?: number | null
          min_value?: number | null
          patient_id?: string
          sync_error?: string | null
          sync_status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      decision_type: "recheck" | "drink_cornstarch" | "none"
      followup_type: "recheck" | "drink_cornstarch"
      threshold_rule_classification: "high" | "normal" | "low" | "critical"
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
      decision_type: ["recheck", "drink_cornstarch", "none"],
      followup_type: ["recheck", "drink_cornstarch"],
      threshold_rule_classification: ["high", "normal", "low", "critical"],
    },
  },
} as const
