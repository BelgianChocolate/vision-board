import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCategories } from '../hooks/useCategories'
import { useGoals } from '../hooks/useGoals'
import { Header } from './Header'
import { GoalsGrid } from './GoalsGrid'
import { GoalSheet } from './GoalSheet'
import { AddGoalFAB } from './AddGoalFAB'
import type { Timeframe } from '../lib/types'

export function BoardPage() {
  const { session } = useAuth()

  // ── State ──────────────────────────────────────────────────────────────────
  const [timeframe, setTimeframe] = useState<Timeframe>('1year')
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all')
  const [openGoalId, setOpenGoalId] = useState<string | null>(null)
  const [addingGoal, setAddingGoal] = useState(false)

  // Use empty string when session not yet resolved — hooks must always run unconditionally
  const userId = session?.user.id ?? ''

  const {
    categories,
    loading: catsLoading,
    addCategory,
    renameCategory,
    deleteCategory,
    moveGoalsToCategory,
  } = useCategories(userId)

  // 'all' → fetch every goal for this user+timeframe
  // real id → fetch that category only
  // null → skip (loading)
  const resolvedCategoryId: string | null =
    activeCategoryId === 'all'  ? 'all' :
    activeCategoryId            ? activeCategoryId :
                                  categories[0]?.id ?? null

  const isAllView = resolvedCategoryId === 'all'

  const { goals, addGoal, addGoalToCategory, updateGoal, deleteGoal } = useGoals(
    userId,
    resolvedCategoryId,
    timeframe,
  )

  // ── All early returns AFTER all hook calls ─────────────────────────────────
  if (!session || catsLoading) {
    return (
      <div className="spinner-page">
        <div className="spinner" />
      </div>
    )
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function hasGoals(categoryId: string) {
    return goals.some(g => g.category_id === categoryId)
  }

  const activeCategoryName = isAllView
    ? 'All'
    : categories.find(c => c.id === resolvedCategoryId)?.name ?? ''

  // FAB add: in all-view, default to first real category; otherwise use active
  const fabDefaultCategoryId = isAllView
    ? (categories[0]?.id ?? null)
    : (resolvedCategoryId as string | null)

  async function handleFabAdd(title: string, imageUrl: string | null, catId: string) {
    if (isAllView) {
      await addGoalToCategory(catId, title, imageUrl)
    } else {
      await addGoal(title, imageUrl)
    }
  }

  const openGoal = openGoalId ? goals.find(g => g.id === openGoalId) ?? null : null

  return (
    <>
      <div className="topbar" />

      <main className="app">
        <Header
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          activeCategoryId={activeCategoryId}
          onSelectCategory={setActiveCategoryId}
          categories={categories}
          onAddCategory={addCategory}
          onRenameCategory={renameCategory}
          onDeleteCategory={deleteCategory}
          hasGoals={hasGoals}
          onMoveGoals={moveGoalsToCategory}
        />

        <GoalsGrid
          goals={goals}
          onOpen={setOpenGoalId}
          onAddClick={() => setAddingGoal(true)}
          isAllView={isAllView}
          categories={categories}
          emptyLabel={`No goals yet in ${activeCategoryName}`}
        />

        <footer className="footnote no-print">
          <span>Vision Board · {timeframe === '3months' ? '3-Month' : '1-Year'} View</span>
          <em>make it happen</em>
          <span>
            {goals.length} goal{goals.length !== 1 ? 's' : ''}
          </span>
        </footer>
      </main>

      <div className="rail" />

      {/* Goal detail sheet */}
      {openGoal && (
        <GoalSheet
          goal={openGoal}
          onClose={() => setOpenGoalId(null)}
          onUpdate={updateGoal}
          onDelete={id => { deleteGoal(id); setOpenGoalId(null) }}
          userId={userId}
          categories={categories}
        />
      )}

      {/* FAB — AddGoalFAB renders the button + sheet */}
      <AddGoalFAB
        userId={userId}
        defaultCategoryId={fabDefaultCategoryId}
        timeframe={timeframe}
        categories={categories}
        onAdd={handleFabAdd}
        open={addingGoal}
        onOpenChange={setAddingGoal}
      />
    </>
  )
}
