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
  const [timeframe, setTimeframe] = useState<Timeframe>('1year')
  // 'all' = virtual All tab; a category id = filtered single-category view
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all')

  // Use empty string when session not yet resolved — hooks must always be called unconditionally
  const userId = session?.user.id ?? ''

  const {
    categories,
    loading: catsLoading,
    addCategory,
    renameCategory,
    deleteCategory,
    moveGoalsToCategory,
  } = useCategories(userId)

  // 'all' → fetch every goal; real id → fetch that category; null → skip (loading)
  const resolvedCategoryId: string | null =
    activeCategoryId === 'all' ? 'all' :
    activeCategoryId ?? categories[0]?.id ?? null

  const isAllView = resolvedCategoryId === 'all'

  const { goals, addGoal, addGoalToCategory, updateGoal, deleteGoal } = useGoals(
    userId,
    resolvedCategoryId,
    timeframe,
  )

  // ALL early returns AFTER all hook calls
  if (!session || catsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  function hasGoals(categoryId: string) {
    return goals.some(g => g.category_id === categoryId)
  }

  const activeCategoryName = isAllView
    ? 'All'
    : categories.find(c => c.id === resolvedCategoryId)?.name ?? ''

  // FAB: in all-view, add to first real category
  const firstCategoryId = categories[0]?.id ?? null
  const fabCategoryId = isAllView ? firstCategoryId : (resolvedCategoryId as string | null)
  const fabCategoryName = isAllView
    ? (categories[0]?.name ?? '')
    : activeCategoryName
  const fabAddGoal = isAllView
    ? (title: string, imageUrl: string | null) =>
        firstCategoryId ? addGoalToCategory(firstCategoryId, title, imageUrl) : Promise.resolve()
    : addGoal

  return (
    <div className="min-h-screen bg-zinc-900">
      <Header timeframe={timeframe} onTimeframeChange={setTimeframe} />
      <CategoryTabs
        categories={categories}
        activeId={activeCategoryId}
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
        isAllView={isAllView}
        categories={categories}
      />
      <AddGoalFAB
        userId={userId}
        activeCategoryId={fabCategoryId}
        activeTimeframe={timeframe}
        activeCategoryName={fabCategoryName}
        onAdd={fabAddGoal}
      />
    </div>
  )
}
