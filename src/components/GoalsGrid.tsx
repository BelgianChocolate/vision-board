import { useState } from 'react'
import { GoalCard } from './GoalCard'
import type { Goal } from '../lib/types'

interface GoalsGridProps {
  goals: Goal[]
  userId: string
  categoryName: string
  onUpdate: (id: string, patch: Partial<Pick<Goal, 'title' | 'image_url'>>) => void
  onDelete: (id: string) => void
}

export function GoalsGrid({ goals, userId, categoryName, onUpdate, onDelete }: GoalsGridProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <p className="text-4xl mb-3">🎯</p>
        <p className="text-sm">No goals yet in {categoryName}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {goals.map(goal => (
        <GoalCard
          key={goal.id}
          goal={goal}
          userId={userId}
          isExpanded={expandedId === goal.id}
          onToggleExpand={() => setExpandedId(expandedId === goal.id ? null : goal.id)}
          onUpdate={patch => onUpdate(goal.id, patch)}
          onDelete={() => onDelete(goal.id)}
        />
      ))}
    </div>
  )
}
