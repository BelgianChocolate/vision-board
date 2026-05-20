import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Goal, Timeframe } from '../lib/types'

// categoryId can be:
//   null   → still loading, do nothing
//   'all'  → fetch all goals for user+timeframe, addGoal is a no-op (use addGoalToCategory instead)
//   string → fetch goals for that specific category
export function useGoals(userId: string, categoryId: string | null, timeframe: Timeframe) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!categoryId) return
    setLoading(true)
    let query = supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('timeframe', timeframe)
    if (categoryId !== 'all') {
      query = query.eq('category_id', categoryId)
    }
    const { data } = await query.order('order')
    setGoals(data ?? [])
    setLoading(false)
  }, [userId, categoryId, timeframe])

  useEffect(() => { fetch() }, [fetch])

  // Standard add: only works for single-category mode
  const addGoal = async (title: string, imageUrl: string | null) => {
    if (!categoryId || categoryId === 'all') return
    const maxOrder = goals.reduce((m, g) => Math.max(m, g.order), -1)
    const { data } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        category_id: categoryId,
        title,
        timeframe,
        image_url: imageUrl,
        order: maxOrder + 1,
      })
      .select()
      .single()
    if (data) setGoals(prev => [...prev, data])
  }

  // All-view add: caller supplies the target category ID explicitly
  const addGoalToCategory = async (catId: string, title: string, imageUrl: string | null) => {
    const catGoals = goals.filter(g => g.category_id === catId)
    const maxOrder = catGoals.reduce((m, g) => Math.max(m, g.order), -1)
    const { data } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        category_id: catId,
        title,
        timeframe,
        image_url: imageUrl,
        order: maxOrder + 1,
      })
      .select()
      .single()
    if (data) setGoals(prev => [...prev, data])
  }

  const updateGoal = async (id: string, patch: Partial<Pick<Goal, 'title' | 'image_url' | 'category_id'>>) => {
    await supabase.from('goals').update(patch).eq('id', id)
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g))
  }

  const deleteGoal = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  return { goals, loading, addGoal, addGoalToCategory, updateGoal, deleteGoal, refetch: fetch }
}
