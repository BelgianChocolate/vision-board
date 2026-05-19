import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useActionItems } from '../hooks/useActionItems'
import { ActionItemsList } from './ActionItemsList'
import type { Goal } from '../lib/types'

interface GoalCardProps {
  goal: Goal
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdate: (patch: Partial<Pick<Goal, 'title' | 'image_url'>>) => void
  onDelete: () => void
  userId: string
  categoryChipLabel?: string
  categoryChipColor?: string
}

export function GoalCard({
  goal, isExpanded, onToggleExpand, onUpdate, onDelete, userId,
  categoryChipLabel, categoryChipColor,
}: GoalCardProps) {
  const { items, addItem, toggleItem, renameItem, deleteItem } = useActionItems(isExpanded ? goal.id : null)
  const [uploading, setUploading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(goal.title)
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadImage(file: File) {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/${goal.id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('goal-images').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('goal-images').getPublicUrl(path)
      onUpdate({ image_url: data.publicUrl })
    }
    setUploading(false)
  }

  function confirmTitle() {
    const t = titleDraft.trim()
    if (t && t !== goal.title) onUpdate({ title: t })
    setEditingTitle(false)
  }

  const hasImage = Boolean(goal.image_url)

  // ── Collapsed card ──
  if (!isExpanded) {
    if (hasImage) {
      // Photo card — full-bleed image
      return (
        <div
          onClick={onToggleExpand}
          className="goal-card relative aspect-square rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
          style={{ backgroundImage: `url(${goal.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {categoryChipLabel && categoryChipColor && (
            <span
              className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-black leading-none"
              style={{ background: categoryChipColor + 'cc', color: '#fff', backdropFilter: 'blur(4px)' }}
            >
              {categoryChipLabel}
            </span>
          )}

          <p className="absolute bottom-3 left-3 right-3 text-white font-semibold text-sm leading-tight">
            {goal.title}
          </p>
        </div>
      )
    }

    // Text-only card — clean flat look, camera hint on hover
    return (
      <div
        onClick={onToggleExpand}
        className="goal-card relative aspect-square rounded-2xl overflow-hidden cursor-pointer
                   bg-zinc-800 border border-white/[0.08]
                   hover:border-orange-500/40 hover:bg-zinc-700/80
                   transition-all duration-200 group flex flex-col justify-between p-4"
      >
        {/* Camera hint — visible on hover */}
        <div className="flex items-center justify-center flex-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex flex-col items-center gap-1.5 text-zinc-500 group-hover:text-orange-400 transition-colors">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span className="text-[10px] font-semibold">Add photo</span>
          </div>
        </div>

        {/* Category chip */}
        {categoryChipLabel && categoryChipColor && (
          <span
            className="absolute top-3 right-3 px-1.5 py-0.5 rounded-md text-[9px] font-black leading-none"
            style={{ background: categoryChipColor + 'cc', color: '#fff' }}
          >
            {categoryChipLabel}
          </span>
        )}

        {/* Title — always at bottom */}
        <p className="text-white font-semibold text-sm leading-snug mt-auto">
          {goal.title}
        </p>
      </div>
    )
  }

  // ── Expanded card ──
  return (
    <div className="goal-card rounded-2xl overflow-hidden border border-white/[0.08] shadow-xl bg-zinc-800 col-span-full">

      {/* Image zone — upload area when no image, photo strip when has image */}
      {hasImage ? (
        // Existing image — show strip, camera overlay on hover to change
        <div
          className="relative h-40 cursor-pointer group"
          style={{ backgroundImage: `url(${goal.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          onClick={onToggleExpand}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Change photo overlay — appears on hover */}
          <button
            onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5
                       bg-black/0 hover:bg-black/40 transition-colors
                       text-transparent hover:text-white"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span className="text-xs font-semibold">Change photo</span>
          </button>

          {/* Close button */}
          <button
            onClick={e => { e.stopPropagation(); onToggleExpand() }}
            className="absolute top-2 right-2 z-10 bg-white/20 backdrop-blur-sm text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-white/40"
          >
            ✕
          </button>

          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      ) : (
        // No image — big dashed upload area
        <div className="relative">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-36 flex flex-col items-center justify-center gap-2
                       border-b border-dashed border-white/[0.12]
                       text-zinc-600 hover:text-orange-400
                       hover:bg-orange-500/[0.04]
                       transition-colors group/upload"
            disabled={uploading}
          >
            {uploading ? (
              <div className="w-8 h-8 border-2 border-zinc-600 border-t-orange-500 rounded-full animate-spin" />
            ) : (
              <>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span className="text-sm font-medium">Add a photo</span>
                <span className="text-xs text-zinc-700 group-hover/upload:text-zinc-500">JPG, PNG or WebP</span>
              </>
            )}
          </button>

          {/* Close button */}
          <button
            onClick={onToggleExpand}
            className="absolute top-2 right-2 bg-white/[0.06] text-zinc-400 rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-white/[0.12] hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Title + menu */}
      <div className="flex items-start justify-between px-4 pt-3 pb-1">
        {editingTitle ? (
          <input
            autoFocus
            className="flex-1 font-semibold text-white outline-none border-b border-white/20 bg-transparent mr-2"
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onBlur={confirmTitle}
            onKeyDown={e => {
              if (e.key === 'Enter') confirmTitle()
              if (e.key === 'Escape') { setTitleDraft(goal.title); setEditingTitle(false) }
            }}
          />
        ) : (
          <h3
            className="flex-1 font-semibold text-white cursor-text mr-2"
            onClick={() => setEditingTitle(true)}
          >
            {goal.title}
          </h3>
        )}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="text-zinc-500 hover:text-white text-lg leading-none px-1 transition-colors"
          >
            ⋯
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-6 z-20 bg-zinc-800 rounded-lg shadow-xl border border-white/[0.08] py-1 min-w-[140px]">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
                  onClick={() => { setEditingTitle(true); setMenuOpen(false) }}
                >
                  Edit title
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
                  onClick={() => { fileRef.current?.click(); setMenuOpen(false) }}
                >
                  {hasImage ? 'Change photo' : 'Add photo'}
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30"
                  onClick={() => { onDelete(); setMenuOpen(false) }}
                >
                  Delete goal
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ActionItemsList
        items={items}
        onAdd={addItem}
        onToggle={toggleItem}
        onRename={renameItem}
        onDelete={deleteItem}
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f) }}
      />
    </div>
  )
}
