export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string
          role: 'subscriber' | 'admin'
          charity_id: string | null
          charity_pct: number
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan: 'monthly' | 'yearly' | null
          status: 'active' | 'cancelled' | 'lapsed' | 'trialing' | 'inactive'
          current_period_end: string | null
          amount: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
      charities: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          website_url: string | null
          is_featured: boolean
          is_active: boolean
          total_raised: number
          upcoming_event: string | null
          event_date: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['charities']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['charities']['Insert']>
      }
      scores: {
        Row: {
          id: string
          user_id: string
          points: number
          played_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['scores']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['scores']['Insert']>
      }
      draws: {
        Row: {
          id: string
          draw_month: string
          draw_date: string | null
          drawn_numbers: number[]
          mode: 'random' | 'weighted_frequent' | 'weighted_rare'
          status: 'draft' | 'simulated' | 'published'
          prize_pool_total: number
          jackpot_carry_forward: number
          five_match_pool: number
          four_match_pool: number
          three_match_pool: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['draws']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['draws']['Insert']>
      }
      draw_results: {
        Row: {
          id: string
          draw_id: string
          user_id: string
          matched_count: 3 | 4 | 5
          prize_amount: number
          payment_status: 'pending' | 'paid'
          verification_status: 'pending' | 'approved' | 'rejected'
          proof_url: string | null
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['draw_results']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['draw_results']['Insert']>
      }
      charity_contributions: {
        Row: {
          id: string
          user_id: string
          charity_id: string
          subscription_id: string | null
          amount: number
          type: 'subscription' | 'independent'
          contributed_at: string
        }
        Insert: Omit<Database['public']['Tables']['charity_contributions']['Row'], 'id' | 'contributed_at'>
        Update: Partial<Database['public']['Tables']['charity_contributions']['Insert']>
      }
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type Charity = Database['public']['Tables']['charities']['Row']
export type Score = Database['public']['Tables']['scores']['Row']
export type Draw = Database['public']['Tables']['draws']['Row']
export type DrawResult = Database['public']['Tables']['draw_results']['Row']
export type CharityContribution = Database['public']['Tables']['charity_contributions']['Row']
