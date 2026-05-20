import { GoalCard } from './GoalCard'
import type { Goal, Category } from '../lib/types'

interface GoalsGridProps {
  goals: Goal[]
  onOpen: (goalId: string) => void
  onAddClick: () => void
  isAllView?: boolean
  categories?: Category[]
  /** Empty state label for the current view */
  emptyLabel?: string
}

export function GoalsGrid({
  goals, onOpen, onAddClick, isAllView, categories, emptyLabel,
}: GoalsGridProps) {
  if (goals.length === 0) {
    return (
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '80px 0',
          fontFamily: 'var(--f-mono)', fontSize: 12, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: 'var(--ink-faint)',
        }}
      >
        <span style={{ fontSize: 40, marginBottom: 12, fontFamily: 'var(--f-display)', fontStyle: 'italic' }}>
          —
        </span>
        <span>{emptyLabel ?? 'No goals yet'}</span>
        <button
          style={{ marginTop: 20 }}
          className="btn-primary accent"
          onClick={onAddClick}
        >
          Pin your first goal
        </button>
      </div>
    )
  }

  return (
    <section className="collage">
      {goals.map(goal => (
        <GoalCard
          key={goal.id}
          goal={goal}
          onClick={() => onOpen(goal.id)}
          categories={categories}
          showCategoryChip={isAllView}
        />
      ))}

      {/* Add tile */}
      <button
        className="tile t-add no-print"
        onClick={onAddClick}
        aria-label="Add new goal"
        style={{
          '--cspan': 3,
          '--rspan': 3,
          '--tilt': '0deg',
        } as React.CSSProperties}
      >
        <div className="plus">+</div>
        <div className="lbl">New goal</div>
      </button>
    </section>
  )
}
