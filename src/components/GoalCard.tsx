import type { Goal, Category } from '../lib/types'
import { getCategoryColor } from '../lib/categoryColors'

// ── Deterministic layout from goal ID ──────────────────────────────────────

function charHash(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

interface Layout {
  cspan: number
  rspan: number
  tilt: number
  hasTape: boolean
  tapeRot: string
}

function getLayout(goalId: string): Layout {
  const h = charHash(goalId)

  const cspanOpts = [3, 3, 3, 4, 4, 5, 3, 4]
  const rspanOpts = [4, 4, 5, 3, 4, 5, 4, 3, 4]
  const tiltOpts  = [-2.8, -1.4, 1.8, 2.6, -1.0, 1.6, -2.4, 0.6, 2.2, -1.8, 3.0, -0.8]
  const tapeRots  = ['-12deg', '8deg', '-3deg', '5deg', '-8deg', '3deg']

  const cspan = cspanOpts[h % cspanOpts.length]
  const rspan = rspanOpts[(h >> 3) % rspanOpts.length]
  const tilt  = tiltOpts[(h >> 6) % tiltOpts.length]
  const hasTape = (h >> 9) % 3 !== 0
  const tapeRot  = tapeRots[(h >> 12) % tapeRots.length]

  return { cspan, rspan, tilt, hasTape, tapeRot }
}

// ── Component ───────────────────────────────────────────────────────────────

interface GoalCardProps {
  goal: Goal
  onClick: () => void
  /** Pass `categories` so the card can look up the accent color */
  categories?: Category[]
  /** When true (all-view), show a small category chip overlay on the card */
  showCategoryChip?: boolean
}

export function GoalCard({ goal, onClick, categories, showCategoryChip }: GoalCardProps) {
  const layout = getLayout(goal.id)

  const catIndex = categories?.findIndex(c => c.id === goal.category_id) ?? -1
  const cat = catIndex >= 0 ? categories![catIndex] : null
  const catColor = cat ? getCategoryColor(cat.name, catIndex) : '#D7642C'
  const catShort = cat?.name ?? ''

  const tiltDeg = `${layout.tilt}deg`

  return (
    <article
      className="tile t-polaroid"
      style={{
        '--cspan': layout.cspan,
        '--rspan': layout.rspan,
        '--tilt':  tiltDeg,
        '--accent': catColor,
        '--cat-color': catColor,
      } as React.CSSProperties}
      onClick={onClick}
    >
      {/* Washi tape */}
      {layout.hasTape && (
        <span
          className="tape"
          style={{ '--tape-rot': layout.tapeRot } as React.CSSProperties}
        />
      )}

      {/* Photo area */}
      <div className="photo">
        {goal.image_url ? (
          <img src={goal.image_url} alt="" loading="lazy" />
        ) : (
          <div className="photo-empty">
            {catShort.charAt(0) || '?'}
          </div>
        )}

        {/* All-view category chip overlay */}
        {showCategoryChip && catShort && (
          <span
            className="cat-chip-overlay"
            style={{ background: catColor + 'cc' }}
          >
            {catShort.toUpperCase()}
          </span>
        )}
      </div>

      {/* Caption */}
      <div className="cap">
        <div className="chip">{catShort.toUpperCase()}</div>
        <h3>{goal.title}</h3>
      </div>
    </article>
  )
}
