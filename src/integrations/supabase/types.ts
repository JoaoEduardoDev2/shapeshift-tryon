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
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          product_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          product_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          product_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          color_hex: string | null
          color_rgb: string | null
          color_tone: string | null
          colors: string[] | null
          created_at: string
          custom_images: Json | null
          description: string | null
          finish: string | null
          id: string
          image_url: string | null
          imported_images: Json | null
          intensity: number
          is_active: boolean | null
          makeup_type: string | null
          name: string
          original_url: string | null
          price: number | null
          share_count: number | null
          sizes: string[] | null
          skin_tone: string | null
          sku: string | null
          status: string
          sync_enabled: boolean | null
          tryon_count: number | null
          tryon_mode: string
          undertone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          color_hex?: string | null
          color_rgb?: string | null
          color_tone?: string | null
          colors?: string[] | null
          created_at?: string
          custom_images?: Json | null
          description?: string | null
          finish?: string | null
          id?: string
          image_url?: string | null
          imported_images?: Json | null
          intensity?: number
          is_active?: boolean | null
          makeup_type?: string | null
          name: string
          original_url?: string | null
          price?: number | null
          share_count?: number | null
          sizes?: string[] | null
          skin_tone?: string | null
          sku?: string | null
          status?: string
          sync_enabled?: boolean | null
          tryon_count?: number | null
          tryon_mode?: string
          undertone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          color_hex?: string | null
          color_rgb?: string | null
          color_tone?: string | null
          colors?: string[] | null
          created_at?: string
          custom_images?: Json | null
          description?: string | null
          finish?: string | null
          id?: string
          image_url?: string | null
          imported_images?: Json | null
          intensity?: number
          is_active?: boolean | null
          makeup_type?: string | null
          name?: string
          original_url?: string | null
          price?: number | null
          share_count?: number | null
          sizes?: string[] | null
          skin_tone?: string | null
          sku?: string | null
          status?: string
          sync_enabled?: boolean | null
          tryon_count?: number | null
          tryon_mode?: string
          undertone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          cnpj: string | null
          company_name: string | null
          cpf: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          profession: string | null
          segment: string | null
          store_name: string | null
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          cnpj?: string | null
          company_name?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          profession?: string | null
          segment?: string | null
          store_name?: string | null
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          cnpj?: string | null
          company_name?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          profession?: string | null
          segment?: string | null
          store_name?: string | null
        }
        Relationships: []
      }
      saved_looks: {
        Row: {
          created_at: string
          garment_description: string | null
          garment_name: string
          id: string
          image_base64: string
          mode: string
          user_id: string
        }
        Insert: {
          created_at?: string
          garment_description?: string | null
          garment_name: string
          id?: string
          image_base64: string
          mode?: string
          user_id: string
        }
        Update: {
          created_at?: string
          garment_description?: string | null
          garment_name?: string
          id?: string
          image_base64?: string
          mode?: string
          user_id?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          logo_url: string | null
          platform: string | null
          platform_url: string | null
          primary_color: string | null
          store_name: string | null
          tracking_pixel: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          platform?: string | null
          platform_url?: string | null
          primary_color?: string | null
          store_name?: string | null
          tracking_pixel?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          platform?: string | null
          platform_url?: string | null
          primary_color?: string | null
          store_name?: string | null
          tracking_pixel?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          payment_provider: string | null
          plan: string
          subscription_status: string
          trial_end: string
          trial_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_provider?: string | null
          plan?: string
          subscription_status?: string
          trial_end?: string
          trial_start?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_provider?: string | null
          plan?: string
          subscription_status?: string
          trial_end?: string
          trial_start?: string
          updated_at?: string
          user_id?: string
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
