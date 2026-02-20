export interface Database {
  public: {
    Tables: {
      user_settings: {
        Row: {
          id: string
          user_id: string
          type: string
          key: string
          value: string
          updated_at: string
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          type: string
          key: string
          value: string
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          key?: string
          value?: string
          updated_at?: string
          created_at?: string
        }
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
  }
}
