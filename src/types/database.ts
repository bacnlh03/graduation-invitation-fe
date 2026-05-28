import type { DesignConfig } from '@/types/design'

export interface Database {
  public: {
    Tables: {
      guests: {
        Row: {
          id: string
          full_name: string
          status: number
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          status?: number
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          status?: number
          updated_at?: string
        }
        Relationships: []
      }
      invitation_config: {
        Row: {
          id: string
          config: DesignConfig
          updated_at: string
        }
        Insert: {
          id?: string
          config?: DesignConfig
          updated_at?: string
        }
        Update: {
          id?: string
          config?: DesignConfig
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      confirm_guest_attendance: {
        Args: { guest_id: string }
        Returns: undefined
      }
      get_guest_public: {
        Args: { guest_id: string }
        Returns: {
          id: string
          full_name: string
          status: number
          updated_at: string
        }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
