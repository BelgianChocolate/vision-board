import { useState } from 'react'
import type { ActionItem } from '../lib/types'

interface ActionItemsListProps {
  items: ActionItem[]
  onAdd: (title: string) => void
  onToggle: (id: string, completed: boolean) => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
}

export function ActionItemsList({ items, onAdd, onToggle, onRename, onDelete }: ActionItemsListProps) {
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  function submitNew() {
    const t = draft.trim()
    if (t) onAdd(t)
    setDraft('')
  }

  function startEdit(item: ActionItem) {
    setEditingId(item.id)
    setEditValue(item.title)
  }

  function confirmEdit(id: string) {
    const t = editValue.trim()
    if (t) onRename(id, t)
    setEditingId(null)
  }

  return (
    <div className="space-y-1 px-4 pb-3">
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-2 group">
          <input
            type="checkbox"
            checked={item.completed}
            onChange={e => onToggle(item.id, e.target.checked)}
            className="h-4 w-4 rounded border-zinc-600 accent-orange-500 cursor-pointer"
          />
          {editingId === item.id ? (
            <input
              autoFocus
              className="flex-1 text-sm outline-none border-b border-white/20 bg-transparent text-white"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={() => confirmEdit(item.id)}
              onKeyDown={e => {
                if (e.key === 'Enter') confirmEdit(item.id)
                if (e.key === 'Escape') setEditingId(null)
              }}
            />
          ) : (
            <span
              onClick={() => startEdit(item)}
              className={`flex-1 text-sm cursor-text select-none transition-colors ${
                item.completed ? 'line-through text-zinc-600' : 'text-zinc-200'
              }`}
            >
              {item.title}
            </span>
          )}
          <button
            onClick={() => onDelete(item.id)}
            className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 text-xs transition-opacity"
          >
            ✕
          </button>
        </div>
      ))}

      <div className="flex items-center gap-2 pt-1">
        <input
          className="flex-1 text-sm outline-none border-b border-white/10 focus:border-white/30 bg-transparent text-white py-0.5 placeholder:text-zinc-600 transition-colors"
          placeholder="+ Add action item"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submitNew() }}
          onBlur={submitNew}
        />
      </div>
    </div>
  )
}
