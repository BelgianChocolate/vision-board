import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ActionItem } from '../lib/types'

export function useActionItems(goalId: string | null) {
  const [items, setItems] = useState<ActionItem[]>([])

  const fetch = useCallback(async () => {
    if (!goalId) { setItems([]); return }
    const { data } = await supabase
      .from('action_items')
      .select('*')
      .eq('goal_id', goalId)
      .order('order')
    setItems(data ?? [])
  }, [goalId])

  useEffect(() => { fetch() }, [fetch])

  const addItem = async (title: string) => {
    if (!goalId) return
    const maxOrder = items.reduce((m, i) => Math.max(m, i.order), -1)
    const { data } = await supabase
      .from('action_items')
      .insert({ goal_id: goalId, title, completed: false, order: maxOrder + 1 })
      .select()
      .single()
    if (data) setItems(prev => [...prev, data])
  }

  const toggleItem = async (id: string, completed: boolean) => {
    await supabase.from('action_items').update({ completed }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, completed } : i))
  }

  const renameItem = async (id: string, title: string) => {
    await supabase.from('action_items').update({ title }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, title } : i))
  }

  const deleteItem = async (id: string) => {
    await supabase.from('action_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return { items, addItem, toggleItem, renameItem, deleteItem }
}
