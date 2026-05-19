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

  const bgStyle = goal.image_url
    ? { backgroundImage: `url(${goal.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, #3f3f46 0%, #18181b 100%)' }

  // ── Collapsed card ──
  if (!isExpanded) {
    return (
      <div
        onClick={onToggleExpand}
        className="goal-card relative aspect-square rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
        style={bgStyle}
      >
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Category chip — only shown in All view */}
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

  // ── Expanded card ──
  return (
    <div className="goal-card rounded-2xl overflow-hidden border border-white/[0.08] shadow-xl bg-zinc-800 col-span-full">
      {/* Image strip */}
      <div
        onClick={onToggleExpand}
        className="relative h-32 cursor-pointer"
        style={bgStyle}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <button
          onClick={e => { e.stopPropagation(); onToggleExpand() }}
          className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-white/40"
        >
          ✕
        </button>
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

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
                  Change image
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
