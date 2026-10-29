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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_number: string
          account_type: Database["public"]["Enums"]["account_type"]
          balance: number
          branch: string
          created_at: string
          currency: string
          id: string
          ifsc: string
          is_primary: boolean
          nickname: string
          status: string
          user_id: string
        }
        Insert: {
          account_number: string
          account_type?: Database["public"]["Enums"]["account_type"]
          balance?: number
          branch?: string
          created_at?: string
          currency?: string
          id?: string
          ifsc?: string
          is_primary?: boolean
          nickname?: string
          status?: string
          user_id: string
        }
        Update: {
          account_number?: string
          account_type?: Database["public"]["Enums"]["account_type"]
          balance?: number
          branch?: string
          created_at?: string
          currency?: string
          id?: string
          ifsc?: string
          is_primary?: boolean
          nickname?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      beneficiaries: {
        Row: {
          account_number: string
          bank_name: string
          created_at: string
          full_name: string
          id: string
          ifsc: string
          is_verified: boolean
          nickname: string
          transfer_type: string
          user_id: string
        }
        Insert: {
          account_number: string
          bank_name?: string
          created_at?: string
          full_name: string
          id?: string
          ifsc: string
          is_verified?: boolean
          nickname: string
          transfer_type?: string
          user_id: string
        }
        Update: {
          account_number?: string
          bank_name?: string
          created_at?: string
          full_name?: string
          id?: string
          ifsc?: string
          is_verified?: boolean
          nickname?: string
          transfer_type?: string
          user_id?: string
        }
        Relationships: []
      }
      bills: {
        Row: {
          amount: number
          autopay: boolean
          biller_name: string
          category: string
          consumer_number: string
          created_at: string
          due_date: string
          id: string
          paid_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          autopay?: boolean
          biller_name: string
          category?: string
          consumer_number: string
          created_at?: string
          due_date?: string
          id?: string
          paid_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          autopay?: boolean
          biller_name?: string
          category?: string
          consumer_number?: string
          created_at?: string
          due_date?: string
          id?: string
          paid_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          account_id: string | null
          card_number_masked: string
          card_type: string
          created_at: string
          credit_limit: number
          daily_atm_limit: number
          daily_pos_limit: number
          expiry: string
          holder_name: string
          id: string
          intl_enabled: boolean
          is_frozen: boolean
          network: string
          online_enabled: boolean
          outstanding: number
          user_id: string
        }
        Insert: {
          account_id?: string | null
          card_number_masked: string
          card_type?: string
          created_at?: string
          credit_limit?: number
          daily_atm_limit?: number
          daily_pos_limit?: number
          expiry?: string
          holder_name: string
          id?: string
          intl_enabled?: boolean
          is_frozen?: boolean
          network?: string
          online_enabled?: boolean
          outstanding?: number
          user_id: string
        }
        Update: {
          account_id?: string | null
          card_number_masked?: string
          card_type?: string
          created_at?: string
          credit_limit?: number
          daily_atm_limit?: number
          daily_pos_limit?: number
          expiry?: string
          holder_name?: string
          id?: string
          intl_enabled?: boolean
          is_frozen?: boolean
          network?: string
          online_enabled?: boolean
          outstanding?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          created_at: string
          deposit_type: string
          id: string
          interest_rate: number
          maturity_amount: number
          maturity_date: string
          principal: number
          status: string
          tenure_months: number
          user_id: string
        }
        Insert: {
          created_at?: string
          deposit_type?: string
          id?: string
          interest_rate?: number
          maturity_amount?: number
          maturity_date?: string
          principal: number
          status?: string
          tenure_months?: number
          user_id: string
        }
        Update: {
          created_at?: string
          deposit_type?: string
          id?: string
          interest_rate?: number
          maturity_amount?: number
          maturity_date?: string
          principal?: number
          status?: string
          tenure_months?: number
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          customer_id: string
          daily_limit: number
          email: string | null
          full_name: string
          id: string
          kyc_status: string
          monthly_limit: number
          phone: string | null
          pin_hash: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          customer_id?: string
          daily_limit?: number
          email?: string | null
          full_name?: string
          id: string
          kyc_status?: string
          monthly_limit?: number
          phone?: string | null
          pin_hash?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          customer_id?: string
          daily_limit?: number
          email?: string | null
          full_name?: string
          id?: string
          kyc_status?: string
          monthly_limit?: number
          phone?: string | null
          pin_hash?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          balance_after: number
          category: string
          counterparty: string | null
          created_at: string
          description: string
          direction: Database["public"]["Enums"]["txn_direction"]
          id: string
          mode: string
          reference: string
          status: Database["public"]["Enums"]["txn_status"]
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          balance_after?: number
          category?: string
          counterparty?: string | null
          created_at?: string
          description?: string
          direction: Database["public"]["Enums"]["txn_direction"]
          id?: string
          mode?: string
          reference?: string
          status?: Database["public"]["Enums"]["txn_status"]
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          balance_after?: number
          category?: string
          counterparty?: string | null
          created_at?: string
          description?: string
          direction?: Database["public"]["Enums"]["txn_direction"]
          id?: string
          mode?: string
          reference?: string
          status?: Database["public"]["Enums"]["txn_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      ensure_user_setup: { Args: { _full_name?: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      open_deposit: {
        Args: {
          _from_account: string
          _principal: number
          _rate: number
          _tenure_months: number
          _type?: string
        }
        Returns: Json
      }
      pay_bill: {
        Args: { _bill_id: string; _from_account: string }
        Returns: Json
      }
      transfer_funds: {
        Args: {
          _amount: number
          _beneficiary_id?: string
          _category?: string
          _from_account: string
          _mode?: string
          _remarks?: string
          _to_account?: string
        }
        Returns: Json
      }
    }
    Enums: {
      account_type: "savings" | "current" | "salary"
      app_role: "admin" | "support" | "user"
      txn_direction: "credit" | "debit"
      txn_status: "success" | "pending" | "failed"
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
      account_type: ["savings", "current", "salary"],
      app_role: ["admin", "support", "user"],
      txn_direction: ["credit", "debit"],
      txn_status: ["success", "pending", "failed"],
    },
  },
} as const
