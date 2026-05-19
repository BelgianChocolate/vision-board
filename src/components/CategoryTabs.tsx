import { useRef, useState } from 'react'
import type { Category } from '../lib/types'

const EMBER_GRADIENT = 'linear-gradient(90deg, #f97316, #ef4444)'
const TAB_ACTIVE_STYLE = { background: EMBER_GRADIENT, color: '#fff' }
const TAB_INACTIVE_STYLE = { background: 'rgba(255,255,255,0.06)', color: '#a1a1aa' }

interface CategoryTabsProps {
  categories: Category[]
  activeId: string | null
  onSelect: (id: string) => void
  onAdd: (name: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => Promise<void>
  hasGoals: (id: string) => boolean
  onMoveGoals: (fromId: string, toId: string) => Promise<void>
}

export function CategoryTabs({
  categories, activeId, onSelect, onAdd, onRename, onDelete, hasGoals, onMoveGoals
}: CategoryTabsProps) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [moveTarget, setMoveTarget] = useState<string>('')
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function openContext(e: React.MouseEvent | React.TouchEvent, id: string) {
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setContextMenu({ id, x: rect.left, y: rect.bottom + 4 })
  }

  function startLongPress(id: string) {
    pressTimer.current = setTimeout(() => {
      const el = document.getElementById(`cat-tab-${id}`)
      if (el) {
        const rect = el.getBoundingClientRect()
        setContextMenu({ id, x: rect.left, y: rect.bottom + 4 })
      }
    }, 600)
  }

  function cancelLongPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current)
  }

  function confirmAdd() {
    const name = newName.trim()
    if (name) onAdd(name)
    setAdding(false)
    setNewName('')
  }

  function startRename(id: string, currentName: string) {
    setRenamingId(id)
    setRenameValue(currentName)
    setContextMenu(null)
  }

  function confirmRename() {
    if (renamingId && renameValue.trim()) onRename(renamingId, renameValue.trim())
    setRenamingId(null)
  }

  async function handleDelete(id: string) {
    if (hasGoals(id)) {
      setDeleteConfirm(id)
      setMoveTarget(categories.find(c => c.id !== id)?.id ?? '')
    } else {
      await onDelete(id)
    }
    setContextMenu(null)
  }

  async function confirmDelete() {
    if (!deleteConfirm) return
    if (moveTarget) {
      await onMoveGoals(deleteConfirm, moveTarget)
    }
    await onDelete(deleteConfirm)
    setDeleteConfirm(null)
  }

  const contextCat = contextMenu ? categories.find(c => c.id === contextMenu.id) : null

  return (
    <>
      <div className="flex gap-1 overflow-x-auto px-4 py-2 scrollbar-none border-b border-white/[0.07]">
        {/* Virtual "All" tab */}
        <button
          onClick={() => onSelect('all')}
          className="whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-semibold transition-colors select-none"
          style={activeId === 'all' ? TAB_ACTIVE_STYLE : TAB_INACTIVE_STYLE}
        >
          All
        </button>

        {categories.map(cat => (
          <button
            key={cat.id}
            id={`cat-tab-${cat.id}`}
            onClick={() => onSelect(cat.id)}
            onContextMenu={e => openContext(e, cat.id)}
            onTouchStart={() => startLongPress(cat.id)}
            onTouchEnd={cancelLongPress}
            onTouchMove={cancelLongPress}
            className="whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-semibold transition-colors select-none"
            style={activeId === cat.id ? TAB_ACTIVE_STYLE : TAB_INACTIVE_STYLE}
          >
            {renamingId === cat.id ? (
              <input
                autoFocus
                className="bg-transparent outline-none w-24 text-current"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onBlur={confirmRename}
                onKeyDown={e => {
                  if (e.key === 'Enter') confirmRename()
                  if (e.key === 'Escape') setRenamingId(null)
                }}
                onClick={e => e.stopPropagation()}
              />
            ) : cat.name}
          </button>
        ))}

        {adding ? (
          <input
            autoFocus
            className="px-3 py-1.5 rounded-full text-sm border border-white/20 outline-none w-28 bg-zinc-800 text-white placeholder:text-zinc-500"
            placeholder="Category name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onBlur={confirmAdd}
            onKeyDown={e => {
              if (e.key === 'Enter') confirmAdd()
              if (e.key === 'Escape') { setAdding(false); setNewName('') }
            }}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="no-print whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-semibold bg-white/[0.06] text-zinc-500 hover:bg-white/[0.1] hover:text-white transition-colors"
          >
            +
          </button>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && contextCat && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-30 bg-zinc-800 rounded-lg shadow-lg border border-white/[0.08] py-1 min-w-[140px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
              onClick={() => startRename(contextCat.id, contextCat.name)}
            >
              Rename
            </button>
            {!contextCat.is_default && (
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30"
                onClick={() => handleDelete(contextCat.id)}
              >
                Delete
              </button>
            )}
          </div>
        </>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-800 rounded-2xl p-6 w-80 space-y-4 shadow-xl border border-white/[0.08]">
            <h3 className="font-semibold text-white">Delete category</h3>
            <p className="text-sm text-zinc-400">This category has goals. What should happen to them?</p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Move goals to</label>
              <select
                className="w-full border border-white/[0.1] rounded-lg px-3 py-2 text-sm bg-zinc-700 text-white"
                value={moveTarget}
                onChange={e => setMoveTarget(e.target.value)}
              >
                <option value="">— Delete all goals —</option>
                {categories.filter(c => c.id !== deleteConfirm).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-700 rounded-lg"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
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
