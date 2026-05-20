import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useActionItems } from '../hooks/useActionItems'
import { getCategoryColor } from '../lib/categoryColors'
import type { Goal, Category } from '../lib/types'

interface GoalSheetProps {
  goal: Goal
  onClose: () => void
  onUpdate: (id: string, patch: Partial<Pick<Goal, 'title' | 'image_url' | 'category_id'>>) => void
  onDelete: (id: string) => void
  userId: string
  categories: Category[]
}

export function GoalSheet({ goal, onClose, onUpdate, onDelete, userId, categories }: GoalSheetProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [titleDraft, setTitleDraft] = useState(goal.title)
  const [newItem, setNewItem] = useState('')

  const { items, addItem, toggleItem, renameItem, deleteItem } = useActionItems(goal.id)

  const catIndex = categories.findIndex(c => c.id === goal.category_id)
  const cat = catIndex >= 0 ? categories[catIndex] : null
  const catColor = cat ? getCategoryColor(cat.name, catIndex) : '#D7642C'

  // Sync title draft if parent goal title changes (e.g. race condition guard)
  useEffect(() => { setTitleDraft(goal.title) }, [goal.id])

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function saveTitle() {
    const t = titleDraft.trim()
    if (t && t !== goal.title) onUpdate(goal.id, { title: t })
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/${goal.id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('goal-images')
      .upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('goal-images').getPublicUrl(path)
      onUpdate(goal.id, { image_url: data.publicUrl })
    }
    setUploading(false)
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    const text = newItem.trim()
    if (!text) return
    await addItem(text)
    setNewItem('')
  }

  function handleDelete() {
    if (confirm('Delete this goal? This cannot be undone.')) {
      onDelete(goal.id)
      onClose()
    }
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div
        className="sheet"
        onClick={e => e.stopPropagation()}
        style={{ '--cat-accent': catColor } as React.CSSProperties}
      >
        {/* ── Header ── */}
        <div className="sheet-head">
          <span className="sheet-chip">
            <span
              style={{
                width: 8, height: 8,
                background: catColor,
                borderRadius: 999,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            {(cat?.name ?? 'Goal').toUpperCase()}
          </span>
          <button className="sheet-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 16 16">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Hero: photo + meta ── */}
        <div className="sheet-hero">
          {/* Photo */}
          <div className="sheet-photo" onClick={() => !uploading && fileRef.current?.click()}>
            {goal.image_url ? (
              <>
                <img src={goal.image_url} alt="" />
                <div className="sheet-change-photo">Change photo</div>
              </>
            ) : (
              <div className="sheet-upload-cta">
                {uploading ? (
                  <div className="spinner" style={{ width: 24, height: 24 }} />
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 16V4M12 4l-4 4M12 4l4 4"
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                      />
                      <path
                        d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                      />
                    </svg>
                    <span>Upload photo</span>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={handleUpload}
            />
          </div>

          {/* Meta: title + category chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              className="sheet-title"
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === 'Enter') saveTitle() }}
              placeholder="Untitled goal"
            />

            <div className="cat-chips-row">
              {categories.map((c, i) => (
                <button
                  key={c.id}
                  className={`cat-chip-btn${goal.category_id === c.id ? ' active' : ''}`}
                  style={{ '--c': getCategoryColor(c.name, i) } as React.CSSProperties}
                  onClick={() => onUpdate(goal.id, { category_id: c.id })}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Action Items ── */}
        <div className="checklist">
          <div className="checklist-title">
            Action items · {items.filter(i => i.completed).length} / {items.length}
          </div>

          {items.map(item => (
            <div key={item.id} className="check-item">
              <input
                type="checkbox"
                className="check-box"
                checked={item.completed}
                onChange={e => toggleItem(item.id, e.target.checked)}
              />
              <input
                className={`check-text${item.completed ? ' done' : ''}`}
                value={item.title}
                onChange={e => renameItem(item.id, e.target.value)}
              />
              <button className="check-del" onClick={() => deleteItem(item.id)} aria-label="Delete item">
                <svg width="14" height="14" viewBox="0 0 16 16">
                  <path
                    d="M3 4h10M6 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M5 4l1 10h4l1-10"
                    stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"
                  />
                </svg>
              </button>
            </div>
          ))}

          <form className="add-check-row" onSubmit={handleAddItem}>
            <span className="add-check-icon">+</span>
            <input
              className="add-check-input"
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              placeholder="Add an action item…"
            />
          </form>
        </div>

        {/* ── Footer ── */}
        <div className="sheet-foot">
          <button className="btn-text" onClick={handleDelete}>
            Delete goal
          </button>
          <button className="btn-primary" onClick={() => { saveTitle(); onClose() }}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
