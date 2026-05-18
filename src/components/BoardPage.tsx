import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCategories } from '../hooks/useCategories'
import { useGoals } from '../hooks/useGoals'
import { Header } from './Header'
import { CategoryTabs } from './CategoryTabs'
import { GoalsGrid } from './GoalsGrid'
import { AddGoalFAB } from './AddGoalFAB'
import type { Timeframe } from '../lib/types'

export function BoardPage() {
  const { session } = useAuth()
  const userId = session!.user.id
  const [timeframe, setTimeframe] = useState<Timeframe>('1year')
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)

  const {
    categories,
    loading: catsLoading,
    addCategory,
    renameCategory,
    deleteCategory,
    moveGoalsToCategory,
  } = useCategories(userId)

  const resolvedCategoryId = activeCategoryId ?? categories[0]?.id ?? null

  const { goals, addGoal, updateGoal, deleteGoal } = useGoals(userId, resolvedCategoryId, timeframe)

  function hasGoals(categoryId: string) {
    return goals.some(g => g.category_id === categoryId)
  }

  const activeCategoryName = categories.find(c => c.id === resolvedCategoryId)?.name ?? ''

  if (catsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header timeframe={timeframe} onTimeframeChange={setTimeframe} />
      <CategoryTabs
        categories={categories}
        activeId={resolvedCategoryId}
        onSelect={setActiveCategoryId}
        onAdd={addCategory}
        onRename={renameCategory}
        onDelete={deleteCategory}
        hasGoals={hasGoals}
        onMoveGoals={moveGoalsToCategory}
      />
      <GoalsGrid
        goals={goals}
        userId={userId}
        categoryName={activeCategoryName}
        onUpdate={updateGoal}
        onDelete={deleteGoal}
      />
      <AddGoalFAB
        userId={userId}
        activeCategoryId={resolvedCategoryId}
        activeTimeframe={timeframe}
        onAdd={addGoal}
      />
    </div>
  )
}
