import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getCategoryColor } from '../lib/categoryColors'
import type { Category, Timeframe } from '../lib/types'

interface AddGoalFABProps {
  userId: string
  defaultCategoryId: string | null
  timeframe: Timeframe
  categories: Category[]
  onAdd: (title: string, imageUrl: string | null, categoryId: string) => Promise<void>
  /** Controlled open state — parent can open the sheet programmatically */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddGoalFAB({
  userId, defaultCategoryId, timeframe, categories, onAdd, open: openProp, onOpenChange,
}: AddGoalFABProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp !== undefined ? openProp : internalOpen
  const setOpen = (v: boolean) => {
    setInternalOpen(v)
    onOpenChange?.(v)
  }
  const [title, setTitle] = useState('')
  const [selectedCatId, setSelectedCatId] = useState<string>(
    defaultCategoryId ?? categories[0]?.id ?? ''
  )
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function openSheet() {
    setSelectedCatId(defaultCategoryId ?? categories[0]?.id ?? '')
    setOpen(true)
  }

  function close() {
    setOpen(false)
    setTitle('')
    setImageFile(null)
    setImagePreview(null)
  }

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setImageFile(f)
    setImagePreview(URL.createObjectURL(f))
  }

  async function handleSave() {
    const t = title.trim()
    if (!t || !selectedCatId) return
    setSaving(true)

    let imageUrl: string | null = null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${userId}/new-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('goal-images').upload(path, imageFile)
      if (!error) {
        const { data } = supabase.storage.from('goal-images').getPublicUrl(path)
        imageUrl = data.publicUrl
      }
    }

    await onAdd(t, imageUrl, selectedCatId)
    setSaving(false)
    close()
  }

  const selCat = categories.find(c => c.id === selectedCatId)
  const selColor = selCat
    ? getCategoryColor(selCat.name, categories.findIndex(c => c.id === selectedCatId))
    : '#D7642C'

  return (
    <>
      {/* FAB button */}
      <button
        className="fab no-print"
        onClick={openSheet}
        aria-label="Add new goal"
      >
        <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </button>

      {/* Add sheet */}
      {open && (
        <div className="scrim" onClick={close}>
          <div
            className="sheet"
            onClick={e => e.stopPropagation()}
            style={{ '--cat-accent': selColor } as React.CSSProperties}
          >
            {/* Header */}
            <div className="sheet-head">
              <span className="sheet-chip">
                <span
                  style={{
                    width: 8, height: 8,
                    background: selColor, borderRadius: 999,
                    display: 'inline-block', flexShrink: 0,
                  }}
                />
                New goal
              </span>
              <button className="sheet-close" onClick={close} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 16 16">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Hero: photo + meta */}
            <div className="sheet-hero">
              {/* Photo upload */}
              <div className="sheet-photo" onClick={() => fileRef.current?.click()}>
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="" />
                    <div className="sheet-change-photo">Change photo</div>
                  </>
                ) : (
                  <div className="sheet-upload-cta">
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
                    <span>Add a photo</span>
                    <span style={{ opacity: 0.6, fontSize: 9, letterSpacing: '0.12em' }}>OPTIONAL</span>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={pickFile}
                />
              </div>

              {/* Meta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  autoFocus
                  className="sheet-title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                  placeholder="What do you want?"
                />

                {/* Category chips */}
                <div className="cat-chips-row">
                  {categories.map((c, i) => (
                    <button
                      key={c.id}
                      className={`cat-chip-btn${selectedCatId === c.id ? ' active' : ''}`}
                      style={{ '--c': getCategoryColor(c.name, i) } as React.CSSProperties}
                      onClick={() => setSelectedCatId(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>

                <p style={{
                  fontFamily: 'var(--f-mono)', fontSize: 10,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  color: 'var(--ink-faint)', margin: 0,
                }}>
                  {timeframe === '1year' ? '1-Year' : '3-Month'} goal
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="sheet-foot">
              <button className="btn-text" onClick={close}>
                Cancel
              </button>
              <button
                className="btn-primary accent"
                onClick={handleSave}
                disabled={saving || !title.trim()}
              >
                {saving ? 'Saving…' : 'Pin it to the board'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
