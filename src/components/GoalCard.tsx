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
}

export function GoalCard({ goal, isExpanded, onToggleExpand, onUpdate, onDelete, userId }: GoalCardProps) {
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
    : { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }

  if (!isExpanded) {
    return (
      <div
        onClick={onToggleExpand}
        className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
        style={bgStyle}
      >
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <p className="absolute bottom-3 left-3 right-3 text-white font-semibold text-sm leading-tight">
          {goal.title}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white col-span-full">
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
            className="flex-1 font-semibold text-slate-900 outline-none border-b border-slate-300 mr-2"
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
            className="flex-1 font-semibold text-slate-900 cursor-text mr-2"
            onClick={() => setEditingTitle(true)}
          >
            {goal.title}
          </h3>
        )}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none px-1"
          >
            ⋯
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-6 z-20 bg-white rounded-lg shadow-lg border border-slate-100 py-1 min-w-[140px]">
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                  onClick={() => { setEditingTitle(true); setMenuOpen(false) }}
                >
                  Edit title
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                  onClick={() => { fileRef.current?.click(); setMenuOpen(false) }}
                >
                  Change image
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
