import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Timeframe } from '../lib/types'

interface AddGoalFABProps {
  userId: string
  activeCategoryId: string | null
  activeTimeframe: Timeframe
  activeCategoryName: string
  onAdd: (title: string, imageUrl: string | null) => Promise<void>
}

const EMBER_GRADIENT = 'linear-gradient(135deg, #f97316, #ef4444)'

export function AddGoalFAB({
  userId, activeCategoryId, activeTimeframe, activeCategoryName, onAdd,
}: AddGoalFABProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setImageFile(f)
    setImagePreview(URL.createObjectURL(f))
  }

  async function handleSave() {
    if (!title.trim() || !activeCategoryId) return
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

    await onAdd(title.trim(), imageUrl)
    setTitle('')
    setImageFile(null)
    setImagePreview(null)
    setSaving(false)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="no-print fixed bottom-6 right-6 z-10 w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-transform hover:scale-110 active:scale-95"
        style={{ background: EMBER_GRADIENT }}
        aria-label="Add goal"
      >
        +
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60">
          <div className="bg-zinc-800 border border-white/[0.08] w-full sm:w-96 rounded-t-3xl sm:rounded-2xl p-6 space-y-4 shadow-2xl">
            <h2 className="font-semibold text-white">New Goal</h2>

            <div>
              <label className="text-sm font-medium text-zinc-400">Goal title</label>
              <input
                autoFocus
                className="mt-1 w-full border border-white/[0.1] rounded-lg px-3 py-2 text-sm outline-none bg-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500/50"
                placeholder="e.g. Run a half marathon"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-400">Image (optional)</label>
              {imagePreview ? (
                <div className="relative mt-1 h-32 rounded-lg overflow-hidden">
                  <img src={imagePreview} className="w-full h-full object-cover" alt="preview" />
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(null) }}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="mt-1 w-full h-24 border-2 border-dashed border-white/[0.1] rounded-lg text-sm text-zinc-500 hover:border-orange-500/50 hover:text-zinc-400 transition-colors"
                >
                  Click to upload
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={pickFile}
              />
            </div>

            <div className="text-xs text-zinc-500">
              Adding to:{' '}
              <span className="font-medium text-zinc-300">
                {activeTimeframe === '1year' ? '1 Year' : '3 Months'}
              </span>
              {activeCategoryName && (
                <>
                  {' '}·{' '}
                  <span className="font-medium text-zinc-300">{activeCategoryName}</span>
                </>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                className="flex-1 py-2 rounded-lg border border-white/[0.1] text-sm text-zinc-400 hover:bg-white/[0.06] transition-colors"
                onClick={() => { setOpen(false); setTitle(''); setImageFile(null); setImagePreview(null) }}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-2 rounded-lg text-white text-sm disabled:opacity-40 transition-opacity"
                style={{ background: EMBER_GRADIENT }}
                onClick={handleSave}
                disabled={saving || !title.trim()}
              >
                {saving ? 'Saving…' : 'Add Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
