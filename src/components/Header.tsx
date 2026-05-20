import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getCategoryColor } from '../lib/categoryColors'
import type { Category, Timeframe } from '../lib/types'

interface HeaderProps {
  timeframe: Timeframe
  onTimeframeChange: (t: Timeframe) => void
  activeCategoryId: string
  onSelectCategory: (id: string) => void
  categories: Category[]
  onAddCategory: (name: string) => void
  onRenameCategory: (id: string, name: string) => void
  onDeleteCategory: (id: string) => Promise<void>
  hasGoals: (id: string) => boolean
  onMoveGoals: (fromId: string, toId: string) => Promise<void>
}

export function Header({
  timeframe, onTimeframeChange,
  activeCategoryId, onSelectCategory,
  categories,
  onAddCategory, onRenameCategory, onDeleteCategory,
  hasGoals, onMoveGoals,
}: HeaderProps) {
  const { signOut } = useAuth()
  const year = new Date().getFullYear()

  // Category context menu (rename / delete)
  const [ctx, setCtx] = useState<{ id: string; x: number; y: number } | null>(null)
  const ctxRef = useRef<HTMLDivElement>(null)

  // Inline rename
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // Add new category
  const [adding, setAdding] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  // Delete confirm dialog
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [moveTarget, setMoveTarget] = useState('')

  // Close context menu on outside click
  useEffect(() => {
    if (!ctx) return
    const handler = (e: MouseEvent) => {
      if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) {
        setCtx(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ctx])

  function openContext(e: React.MouseEvent, id: string) {
    e.preventDefault()
    setCtx({ id, x: e.clientX, y: e.clientY })
  }

  function startRename(id: string, name: string) {
    setRenamingId(id)
    setRenameValue(name)
    setCtx(null)
  }

  function confirmRename() {
    if (renamingId && renameValue.trim()) onRenameCategory(renamingId, renameValue.trim())
    setRenamingId(null)
  }

  async function handleDeleteRequest(id: string) {
    setCtx(null)
    if (hasGoals(id)) {
      const others = categories.filter(c => c.id !== id)
      setMoveTarget(others[0]?.id ?? '')
      setDeleteConfirmId(id)
    } else {
      await onDeleteCategory(id)
    }
  }

  async function confirmDelete() {
    if (!deleteConfirmId) return
    if (moveTarget) await onMoveGoals(deleteConfirmId, moveTarget)
    await onDeleteCategory(deleteConfirmId)
    setDeleteConfirmId(null)
    if (activeCategoryId === deleteConfirmId) onSelectCategory('all')
  }

  function confirmAdd() {
    const name = newCatName.trim()
    if (name) onAddCategory(name)
    setAdding(false)
    setNewCatName('')
  }

  // Build the active / "others" list (always include virtual 'all')
  const allEntry = { id: 'all', name: 'All', color: '#1A1814' }
  const catEntries = [
    allEntry,
    ...categories.map((c, i) => ({ id: c.id, name: c.name, color: getCategoryColor(c.name, i) })),
  ]
  const active = catEntries.find(c => c.id === activeCategoryId) ?? allEntry
  const others = catEntries.filter(c => c.id !== activeCategoryId)

  const ctxCat = ctx ? categories.find(c => c.id === ctx.id) : null

  return (
    <>
      <header className="masthead">
        <div className="eyebrow">
          A vision board · est. {year}
          <button className="eyebrow-signout no-print" onClick={() => signOut()}>
            Sign out
          </button>
        </div>

        <h1 className="h-title">
          Things <em>I want</em>.
        </h1>
        <div className="h-sub">Pin it. Tick it. Become it.</div>

        <div className="controls">
          {/* Timeframe toggle */}
          <div className="timeframe" role="tablist">
            <button
              className={`tf-btn${timeframe === '3months' ? ' active' : ''}`}
              onClick={() => onTimeframeChange('3months')}
            >
              3 Months
            </button>
            <button
              className={`tf-btn${timeframe === '1year' ? ' active' : ''}`}
              onClick={() => onTimeframeChange('1year')}
            >
              1 Year
            </button>
          </div>

          {/* Category nav */}
          <div className="cat-nav">
            {/* Active category pill */}
            <div
              className="cat-nav-pill"
              style={{ '--cat-color': active.color } as React.CSSProperties}
              onClick={() => {
                // Clicking active "All" does nothing; clicking active cat opens context
              }}
              onContextMenu={e => {
                if (active.id !== 'all') openContext(e, active.id)
              }}
            >
              <span className="dot" />
              {renamingId === active.id ? (
                <input
                  autoFocus
                  style={{
                    background: 'transparent', border: 0, outline: 'none',
                    fontFamily: 'var(--f-mono)', fontSize: 12, fontWeight: 700,
                    letterSpacing: '0.18em', textTransform: 'uppercase', width: 120,
                    color: 'inherit',
                  }}
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={confirmRename}
                  onKeyDown={e => {
                    if (e.key === 'Enter') confirmRename()
                    if (e.key === 'Escape') setRenamingId(null)
                  }}
                  onClick={e => e.stopPropagation()}
                />
              ) : active.name}
            </div>

            {/* Other categories */}
            <div className="cat-nav-others">
              {others.map((c, i) => (
                <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {i > 0 && <span className="sep">·</span>}
                  {renamingId === c.id ? (
                    <input
                      autoFocus
                      className="cat-add-input"
                      style={{ width: 110 }}
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={confirmRename}
                      onKeyDown={e => {
                        if (e.key === 'Enter') confirmRename()
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <button
                      onClick={() => onSelectCategory(c.id)}
                      onContextMenu={e => {
                        if (c.id !== 'all') openContext(e, c.id)
                      }}
                    >
                      {c.name}
                    </button>
                  )}
                </span>
              ))}

              {/* Separator before add */}
              {others.length > 0 && !adding && <span className="sep">·</span>}

              {adding ? (
                <input
                  autoFocus
                  className="cat-add-input"
                  placeholder="Category name"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onBlur={confirmAdd}
                  onKeyDown={e => {
                    if (e.key === 'Enter') confirmAdd()
                    if (e.key === 'Escape') { setAdding(false); setNewCatName('') }
                  }}
                />
              ) : (
                <button
                  className="no-print"
                  onClick={() => setAdding(true)}
                  title="Add category"
                  style={{ fontWeight: 700 }}
                >
                  + add
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Context menu */}
      {ctx && ctxCat && (
        <>
          <div className="fixed inset-0 z-[199]" onClick={() => setCtx(null)} />
          <div
            ref={ctxRef}
            className="ctx-menu"
            style={{ left: ctx.x, top: ctx.y }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => startRename(ctxCat.id, ctxCat.name)}>
              Rename "{ctxCat.name}"
            </button>
            {!ctxCat.is_default && (
              <button className="danger" onClick={() => handleDeleteRequest(ctxCat.id)}>
                Delete category
              </button>
            )}
          </div>
        </>
      )}

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h3>Delete category</h3>
            <p>This category has goals. Move them to another category or delete them.</p>
            <select
              className="confirm-select"
              value={moveTarget}
              onChange={e => setMoveTarget(e.target.value)}
            >
              <option value="">— Delete all goals —</option>
              {categories
                .filter(c => c.id !== deleteConfirmId)
                .map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
            <div className="confirm-btns">
              <button
                className="btn-text"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ background: '#c2424d' }}
                onClick={confirmDelete}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
