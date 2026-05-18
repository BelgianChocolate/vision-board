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
      categories: { Row: Category; Insert: Omit<Category, 'id'>; Update: Partial<Omit<Category, 'id'>> }
      goals: { Row: Goal; Insert: Omit<Goal, 'id' | 'created_at'>; Update: Partial<Omit<Goal, 'id' | 'created_at'>> }
      action_items: { Row: ActionItem; Insert: Omit<ActionItem, 'id'>; Update: Partial<Omit<ActionItem, 'id'>> }
    }
  }
}
