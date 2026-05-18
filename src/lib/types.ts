export type Timeframe = '1year' | '3months'

export interface Category {
  id: string
  user_id: string
  name: string
  is_default: boolean
  order: number
}

export interface Goal {
  id: string
  user_id: string
  category_id: string
  title: string
  timeframe: Timeframe
  image_url: string | null
  order: number
  created_at: string
}

export interface ActionItem {
  id: string
  goal_id: string
  title: string
  completed: boolean
  order: number
}

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category
        Insert: { user_id: string; name: string; is_default: boolean; order: number }
        Update: { user_id?: string; name?: string; is_default?: boolean; order?: number }
        Relationships: []
      }
      goals: {
        Row: Goal
        Insert: { user_id: string; category_id: string; title: string; timeframe: Timeframe; image_url?: string | null; order?: number }
        Update: { user_id?: string; category_id?: string; title?: string; timeframe?: Timeframe; image_url?: string | null; order?: number }
        Relationships: []
      }
      action_items: {
        Row: ActionItem
        Insert: { goal_id: string; title: string; completed?: boolean; order?: number }
        Update: { goal_id?: string; title?: string; completed?: boolean; order?: number }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
