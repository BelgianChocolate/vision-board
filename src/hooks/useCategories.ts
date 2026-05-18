import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Category } from '../lib/types'

const DEFAULT_CATEGORIES = [
  { name: 'Health', is_default: true, order: 0 },
  { name: 'Relationships', is_default: true, order: 1 },
  { name: 'Career', is_default: true, order: 2 },
  { name: 'Money', is_default: true, order: 3 },
  { name: 'Personal Brand', is_default: true, order: 4 },
]

export function useCategories(userId: string) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAndSeed = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('order')

    if (error) { setLoading(false); return }

    if (data.length === 0) {
      const { data: seeded } = await supabase
        .from('categories')
        .insert(DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: userId })))
        .select()
      setCategories(seeded ?? [])
    } else {
      setCategories(data)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchAndSeed() }, [fetchAndSeed])

  const addCategory = async (name: string) => {
    const maxOrder = categories.reduce((m, c) => Math.max(m, c.order), -1)
    const { data } = await supabase
      .from('categories')
      .insert({ user_id: userId, name, is_default: false, order: maxOrder + 1 })
      .select()
      .single()
    if (data) setCategories(prev => [...prev, data])
  }

  const renameCategory = async (id: string, name: string) => {
    await supabase.from('categories').update({ name }).eq('id', id)
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c))
  }

  const deleteCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  const moveGoalsToCategory = async (fromId: string, toId: string) => {
    await supabase.from('goals').update({ category_id: toId }).eq('category_id', fromId)
  }

  return { categories, loading, addCategory, renameCategory, deleteCategory, moveGoalsToCategory }
}
