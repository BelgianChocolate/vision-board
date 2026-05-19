# Obsidian Ember Theme + All Categories View — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Vision Board app with the Obsidian Ember dark theme (charcoal + fire orange-red gradient, auto-flips to white on Ctrl+P print) and add an "All" virtual tab that shows every goal across every category in a flat grid with colour-coded category chips.

**Architecture:** Theme is applied by overriding the `:root` CSS custom properties in `index.css` to dark values — all shadcn components inherit automatically. Ember gradient is applied via inline `style` props on active elements (Tailwind can't express multi-stop gradients easily). The "All" view is a sentinel string value `'all'` passed through `activeCategoryId` state; `useGoals` skips the category filter when it receives `'all'`. A new `categoryColors.ts` utility maps category array index → a fixed accent colour used for per-card chips in All view.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Supabase JS v2, shadcn/ui v4

---

## File map

| File | Action | Purpose |
|---|---|---|
| `src/lib/categoryColors.ts` | Create | Fixed colour palette for category chips |
| `src/index.css` | Modify | Override `:root` to Obsidian Ember dark + `@media print` |
| `src/components/Header.tsx` | Modify | Dark header, ember gradient timeframe toggle |
| `src/hooks/useGoals.ts` | Modify | Support `'all'` sentinel, add `addGoalToCategory` |
| `src/components/CategoryTabs.tsx` | Modify | Dark styles + "All" first tab |
| `src/components/BoardPage.tsx` | Modify | `'all'` default state, wire isAllView + addGoalToCategory |
| `src/components/GoalsGrid.tsx` | Modify | Dark empty state, pass chip data per card in all-view |
| `src/components/GoalCard.tsx` | Modify | Dark expanded view, optional category chip in collapsed |
| `src/components/ActionItemsList.tsx` | Modify | Dark text, inputs, checkboxes |
| `src/components/AddGoalFAB.tsx` | Modify | Ember gradient FAB, dark modal, no-print |

---

## Task 1: Category colour utility

**Files:**
- Create: `src/lib/categoryColors.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/lib/categoryColors.ts
// Fixed accent colours cycling by category array index.
// Order matches default seeding: Health, Relationships, Career, Money, Personal Brand, …custom

export const CATEGORY_COLORS = [
  '#f97316', // orange  — Health
  '#818cf8', // indigo  — Relationships
  '#eab308', // yellow  — Career
  '#22c55e', // green   — Money
  '#ec4899', // pink    — Personal Brand
  '#06b6d4', // cyan    — custom overflow
] as const

export function categoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}
```

- [ ] **Step 2: Build-check (catches type errors)**

Run from `C:\Users\nagpa\VisionBoard`:
```
npm run build
```
Expected: build succeeds (new file has no errors).

- [ ] **Step 3: Commit**
```
git add src/lib/categoryColors.ts
git commit -m "feat: add category colour palette utility"
```

---

## Task 2: Obsidian Ember theme + print CSS

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Replace `src/index.css` with the dark theme**

The change: override `:root` with the current `.dark` values (making dark the default), add ember CSS vars, and append a `@media print` block. The `.dark` class block can be removed (it's now the default).

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@custom-variant dark (&:is(.dark *));

@theme inline {
    --font-heading: var(--font-sans);
    --font-sans: system-ui, sans-serif;
    --color-sidebar-ring: var(--sidebar-ring);
    --color-sidebar-border: var(--sidebar-border);
    --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
    --color-sidebar-accent: var(--sidebar-accent);
    --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
    --color-sidebar-primary: var(--sidebar-primary);
    --color-sidebar-foreground: var(--sidebar-foreground);
    --color-sidebar: var(--sidebar);
    --color-chart-5: var(--chart-5);
    --color-chart-4: var(--chart-4);
    --color-chart-3: var(--chart-3);
    --color-chart-2: var(--chart-2);
    --color-chart-1: var(--chart-1);
    --color-ring: var(--ring);
    --color-input: var(--input);
    --color-border: var(--border);
    --color-destructive: var(--destructive);
    --color-accent-foreground: var(--accent-foreground);
    --color-accent: var(--accent);
    --color-muted-foreground: var(--muted-foreground);
    --color-muted: var(--muted);
    --color-secondary-foreground: var(--secondary-foreground);
    --color-secondary: var(--secondary);
    --color-primary-foreground: var(--primary-foreground);
    --color-primary: var(--primary);
    --color-popover-foreground: var(--popover-foreground);
    --color-popover: var(--popover);
    --color-card-foreground: var(--card-foreground);
    --color-card: var(--card);
    --color-foreground: var(--foreground);
    --color-background: var(--background);
    --radius-sm: calc(var(--radius) * 0.6);
    --radius-md: calc(var(--radius) * 0.8);
    --radius-lg: var(--radius);
    --radius-xl: calc(var(--radius) * 1.4);
    --radius-2xl: calc(var(--radius) * 1.8);
    --radius-3xl: calc(var(--radius) * 2.2);
    --radius-4xl: calc(var(--radius) * 2.6);
}

/* ─── Obsidian Ember dark theme (default) ─── */
:root {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    --card: oklch(0.205 0 0);
    --card-foreground: oklch(0.985 0 0);
    --popover: oklch(0.205 0 0);
    --popover-foreground: oklch(0.985 0 0);
    --primary: oklch(0.985 0 0);
    --primary-foreground: oklch(0.205 0 0);
    --secondary: oklch(0.269 0 0);
    --secondary-foreground: oklch(0.985 0 0);
    --muted: oklch(0.269 0 0);
    --muted-foreground: oklch(0.708 0 0);
    --accent: oklch(0.269 0 0);
    --accent-foreground: oklch(0.985 0 0);
    --destructive: oklch(0.704 0.191 22.216);
    --border: oklch(1 0 0 / 7%);
    --input: oklch(1 0 0 / 15%);
    --ring: oklch(0.556 0 0);
    --radius: 0.625rem;
    --sidebar: oklch(0.205 0 0);
    --sidebar-foreground: oklch(0.985 0 0);
    --sidebar-primary: oklch(0.488 0.243 264.376);
    --sidebar-primary-foreground: oklch(0.985 0 0);
    --sidebar-accent: oklch(0.269 0 0);
    --sidebar-accent-foreground: oklch(0.985 0 0);
    --sidebar-border: oklch(1 0 0 / 10%);
    --sidebar-ring: oklch(0.556 0 0);
    /* Ember accent colours */
    --ember: #f97316;
    --ember-end: #ef4444;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}

/* ─── Print: flip to white so wall prints are clean ─── */
@media print {
  :root {
    --background: #ffffff;
    --foreground: #18181b;
    --card: #f4f4f5;
    --card-foreground: #18181b;
    --border: #e4e4e7;
  }

  body {
    background: #ffffff !important;
    color: #18181b !important;
  }

  /* Hide interactive chrome */
  .no-print {
    display: none !important;
  }

  /* Prevent page breaks inside cards */
  .goal-card {
    break-inside: avoid;
  }
}
```

- [ ] **Step 2: Build-check**

```
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Commit**
```
git add src/index.css
git commit -m "feat: apply Obsidian Ember dark theme and print CSS"
```

---

## Task 3: Restyle Header

**Files:**
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Replace file contents**

```typescript
// src/components/Header.tsx
import { useAuth } from '../hooks/useAuth'
import { Button } from '@/components/ui/button'
import type { Timeframe } from '../lib/types'

const EMBER_GRADIENT = 'linear-gradient(90deg, #f97316, #ef4444)'

interface HeaderProps {
  timeframe: Timeframe
  onTimeframeChange: (t: Timeframe) => void
}

export function Header({ timeframe, onTimeframeChange }: HeaderProps) {
  const { signOut } = useAuth()

  return (
    <header className="sticky top-0 z-10 bg-zinc-900 border-b border-white/[0.07] px-4 py-3 flex items-center justify-between">
      <span className="font-black text-white text-lg tracking-tight uppercase">Vision Board</span>

      <div className="flex items-center gap-1 bg-white/[0.06] rounded-full p-1">
        <button
          onClick={() => onTimeframeChange('1year')}
          className="px-4 py-1 rounded-full text-sm font-semibold transition-colors"
          style={
            timeframe === '1year'
              ? { background: EMBER_GRADIENT, color: '#fff' }
              : { color: '#a1a1aa' }
          }
        >
          1 Year
        </button>
        <button
          onClick={() => onTimeframeChange('3months')}
          className="px-4 py-1 rounded-full text-sm font-semibold transition-colors"
          style={
            timeframe === '3months'
              ? { background: EMBER_GRADIENT, color: '#fff' }
              : { color: '#a1a1aa' }
          }
        >
          3 Months
        </button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut()}
        className="no-print text-zinc-400 hover:text-white hover:bg-white/[0.06]"
      >
        Sign out
      </Button>
    </header>
  )
}
```

- [ ] **Step 2: Build-check**

```
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Commit**
```
git add src/components/Header.tsx
git commit -m "feat: restyle Header with Obsidian Ember theme"
```

---

## Task 4: Extend useGoals for 'all' view

**Files:**
- Modify: `src/hooks/useGoals.ts`

Two changes:
1. When `categoryId === 'all'`: fetch all goals without category filter; `addGoal` is a no-op.
2. Add `addGoalToCategory(catId, title, imageUrl)` so BoardPage can add goals to a specific category while the all-goals list is displayed.

- [ ] **Step 1: Replace file contents**

```typescript
// src/hooks/useGoals.ts
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Goal, Timeframe } from '../lib/types'

// categoryId can be:
//   null   → still loading, do nothing
//   'all'  → fetch all goals for user+timeframe, mutations are no-ops (use addGoalToCategory instead)
//   string → fetch goals for that specific category
export function useGoals(userId: string, categoryId: string | null, timeframe: Timeframe) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!categoryId) return
    setLoading(true)
    let query = supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('timeframe', timeframe)
    if (categoryId !== 'all') {
      query = query.eq('category_id', categoryId)
    }
    const { data } = await query.order('order')
    setGoals(data ?? [])
    setLoading(false)
  }, [userId, categoryId, timeframe])

  useEffect(() => { fetch() }, [fetch])

  // Standard add: only works for single-category mode
  const addGoal = async (title: string, imageUrl: string | null) => {
    if (!categoryId || categoryId === 'all') return
    const maxOrder = goals.reduce((m, g) => Math.max(m, g.order), -1)
    const { data } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        category_id: categoryId,
        title,
        timeframe,
        image_url: imageUrl,
        order: maxOrder + 1,
      })
      .select()
      .single()
    if (data) setGoals(prev => [...prev, data])
  }

  // All-view add: caller supplies the target category ID explicitly,
  // then the hook appends the new goal into the displayed list.
  const addGoalToCategory = async (catId: string, title: string, imageUrl: string | null) => {
    const catGoals = goals.filter(g => g.category_id === catId)
    const maxOrder = catGoals.reduce((m, g) => Math.max(m, g.order), -1)
    const { data } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        category_id: catId,
        title,
        timeframe,
        image_url: imageUrl,
        order: maxOrder + 1,
      })
      .select()
      .single()
    if (data) setGoals(prev => [...prev, data])
  }

  const updateGoal = async (id: string, patch: Partial<Pick<Goal, 'title' | 'image_url'>>) => {
    await supabase.from('goals').update(patch).eq('id', id)
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g))
  }

  const deleteGoal = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  return { goals, loading, addGoal, addGoalToCategory, updateGoal, deleteGoal, refetch: fetch }
}
```

- [ ] **Step 2: Build-check**

```
npm run build
```
Expected: build succeeds (TypeScript will flag any callers of the old signature).

- [ ] **Step 3: Commit**
```
git add src/hooks/useGoals.ts
git commit -m "feat: extend useGoals to support 'all' category view"
```

---

## Task 5: CategoryTabs — dark styles + "All" first tab

**Files:**
- Modify: `src/components/CategoryTabs.tsx`

- [ ] **Step 1: Replace file contents**

```typescript
// src/components/CategoryTabs.tsx
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
```

- [ ] **Step 2: Build-check**

```
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Commit**
```
git add src/components/CategoryTabs.tsx
git commit -m "feat: add All tab and restyle CategoryTabs with Obsidian Ember theme"
```

---

## Task 6: BoardPage — wire "All" view

**Files:**
- Modify: `src/components/BoardPage.tsx`

Key changes:
- Default `activeCategoryId` to `'all'` (string, not null)
- `resolvedCategoryId` handles `'all'` sentinel
- When `isAllView`, pass `addGoalToCategory` bound to first category to the FAB
- Pass `isAllView` + `categories` to GoalsGrid

- [ ] **Step 1: Replace file contents**

```typescript
// src/components/BoardPage.tsx
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCategories } from '../hooks/useCategories'
import { useGoals } from '../hooks/useGoals'
import { Header } from './Header'
import { CategoryTabs } from './CategoryTabs'
import { GoalsGrid } from './GoalsGrid'
import { AddGoalFAB } from './AddGoalFAB'
import type { Timeframe } from '../lib/types'

export function BoardPage() {
  const { session } = useAuth()
  const [timeframe, setTimeframe] = useState<Timeframe>('1year')
  // 'all' = virtual All tab; a category id = filtered view
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all')

  const userId = session?.user.id ?? ''

  const {
    categories,
    loading: catsLoading,
    addCategory,
    renameCategory,
    deleteCategory,
    moveGoalsToCategory,
  } = useCategories(userId)

  // 'all' → fetch every goal; real id → fetch that category; null → skip (loading)
  const resolvedCategoryId: string | null =
    activeCategoryId === 'all' ? 'all' :
    activeCategoryId ?? categories[0]?.id ?? null

  const isAllView = resolvedCategoryId === 'all'

  const { goals, addGoal, addGoalToCategory, updateGoal, deleteGoal } = useGoals(
    userId,
    resolvedCategoryId,
    timeframe,
  )

  // All early returns AFTER all hook calls
  if (!session || catsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  function hasGoals(categoryId: string) {
    return goals.some(g => g.category_id === categoryId)
  }

  const activeCategoryName = isAllView
    ? 'All'
    : categories.find(c => c.id === resolvedCategoryId)?.name ?? ''

  // FAB: in all-view, add to first category
  const firstCategoryId = categories[0]?.id ?? null
  const fabCategoryId = isAllView ? firstCategoryId : (resolvedCategoryId as string | null)
  const fabAddGoal = isAllView
    ? (title: string, imageUrl: string | null) =>
        firstCategoryId ? addGoalToCategory(firstCategoryId, title, imageUrl) : Promise.resolve()
    : addGoal

  return (
    <div className="min-h-screen bg-zinc-900">
      <Header timeframe={timeframe} onTimeframeChange={setTimeframe} />
      <CategoryTabs
        categories={categories}
        activeId={activeCategoryId}
        onSelect={setActiveCategoryId}
        onAdd={addCategory}
        onRename={renameCategory}
        onDelete={deleteCategory}
        hasGoals={hasGoals}
        onMoveGoals={moveGoalsToCategory}
      />
      <GoalsGrid
        goals={goals}
        userId={userId}
        categoryName={activeCategoryName}
        onUpdate={updateGoal}
        onDelete={deleteGoal}
        isAllView={isAllView}
        categories={categories}
      />
      <AddGoalFAB
        userId={userId}
        activeCategoryId={fabCategoryId}
        activeTimeframe={timeframe}
        activeCategoryName={isAllView ? (categories[0]?.name ?? '') : activeCategoryName}
        onAdd={fabAddGoal}
      />
    </div>
  )
}
```

- [ ] **Step 2: Build-check**

```
npm run build
```
Expected: TypeScript will complain about GoalsGrid missing new props (not yet added) and AddGoalFAB missing `activeCategoryName`. That's fine — fix those in their respective tasks. For now confirm the BoardPage logic compiles up to those prop errors.

Actually, to avoid cascading errors, add the props to GoalsGrid and AddGoalFAB before running the build check. Come back to build-check after Task 10 instead, or add `// @ts-expect-error` comments temporarily. The build-check for this task can be skipped — do the full build check in Task 11.

- [ ] **Step 3: Commit**
```
git add src/components/BoardPage.tsx
git commit -m "feat: wire All-view state and addGoalToCategory in BoardPage"
```

---

## Task 7: GoalsGrid — dark styles + all-view chip data

**Files:**
- Modify: `src/components/GoalsGrid.tsx`

- [ ] **Step 1: Replace file contents**

```typescript
// src/components/GoalsGrid.tsx
import { useState } from 'react'
import { GoalCard } from './GoalCard'
import { categoryColor } from '../lib/categoryColors'
import type { Goal, Category } from '../lib/types'

interface GoalsGridProps {
  goals: Goal[]
  userId: string
  categoryName: string
  onUpdate: (id: string, patch: Partial<Pick<Goal, 'title' | 'image_url'>>) => void
  onDelete: (id: string) => void
  isAllView?: boolean
  categories?: Category[]
}

export function GoalsGrid({
  goals, userId, categoryName, onUpdate, onDelete, isAllView, categories,
}: GoalsGridProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
        <p className="text-4xl mb-3">🎯</p>
        <p className="text-sm">No goals yet in {categoryName}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {goals.map(goal => {
        // In all-view, look up this goal's category colour and name for the chip
        const catIndex = isAllView && categories
          ? categories.findIndex(c => c.id === goal.category_id)
          : -1
        const chipColor = catIndex !== -1 ? categoryColor(catIndex) : undefined
        const chipLabel = catIndex !== -1 ? categories![catIndex].name : undefined

        return (
          <GoalCard
            key={goal.id}
            goal={goal}
            userId={userId}
            isExpanded={expandedId === goal.id}
            onToggleExpand={() => setExpandedId(expandedId === goal.id ? null : goal.id)}
            onUpdate={patch => onUpdate(goal.id, patch)}
            onDelete={() => onDelete(goal.id)}
            categoryChipLabel={chipLabel}
            categoryChipColor={chipColor}
          />
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Build-check**

```
npm run build
```
Expected: may error on GoalCard missing new props — fix those in Task 8.

- [ ] **Step 3: Commit**
```
git add src/components/GoalsGrid.tsx
git commit -m "feat: pass category chip data to GoalCard in all-view"
```

---

## Task 8: GoalCard — dark expanded view + category chip

**Files:**
- Modify: `src/components/GoalCard.tsx`

Key changes:
- Expanded card: `bg-white border-slate-100` → `bg-zinc-800 border-white/[0.08]`
- Title, menu text: dark → white/zinc
- Dropdown menus: dark styled
- Collapsed: when `categoryChipLabel` provided, render a small colour pill top-right
- Default card bg (no image): zinc gradient instead of purple

- [ ] **Step 1: Replace file contents**

```typescript
// src/components/GoalCard.tsx
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
```

- [ ] **Step 2: Build-check**

```
npm run build
```
Expected: succeeds or only errors on AddGoalFAB's new prop (Task 10).

- [ ] **Step 3: Commit**
```
git add src/components/GoalCard.tsx
git commit -m "feat: restyle GoalCard dark theme and add category chip for all-view"
```

---

## Task 9: Restyle ActionItemsList

**Files:**
- Modify: `src/components/ActionItemsList.tsx`

- [ ] **Step 1: Replace file contents**

```typescript
// src/components/ActionItemsList.tsx
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
```

- [ ] **Step 2: Build-check**

```
npm run build
```
Expected: succeeds or only errors on AddGoalFAB's new prop.

- [ ] **Step 3: Commit**
```
git add src/components/ActionItemsList.tsx
git commit -m "feat: restyle ActionItemsList for dark theme"
```

---

## Task 10: Restyle AddGoalFAB

**Files:**
- Modify: `src/components/AddGoalFAB.tsx`

Changes:
- FAB button: ember gradient background
- Modal: dark bg `bg-zinc-800`, dark inputs, dark borders
- Add `activeCategoryName` prop to display in the "Adding to:" line
- `no-print` class on FAB

- [ ] **Step 1: Replace file contents**

```typescript
// src/components/AddGoalFAB.tsx
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
```

- [ ] **Step 2: Full build-check — all tasks now complete**

```
npm run build
```
Expected: **Build succeeds with zero errors.** If there are TypeScript errors, fix them before proceeding.

- [ ] **Step 3: Commit**
```
git add src/components/AddGoalFAB.tsx
git commit -m "feat: restyle AddGoalFAB with ember gradient and dark modal"
```

---

## Task 11: Final build, verify, push

- [ ] **Step 1: Clean build from scratch**

```
npm run build
```
Expected: `dist/` created, zero errors, zero warnings about missing modules.

- [ ] **Step 2: Quick smoke test (dev server)**

```
npm run dev
```
Open http://localhost:5173 and verify:
- Page background is dark (`#18181b` zinc-900)
- Header shows ember gradient on the active timeframe pill
- "All" appears as the first category tab with ember gradient when active
- Clicking a specific category tab highlights it with ember gradient
- Goal cards have dark background when no image, dark expanded view
- FAB is orange-red gradient
- Ctrl+P browser print preview shows white background

- [ ] **Step 3: Push to trigger Vercel deploy**

```
git push
```

- [ ] **Step 4: Verify Vercel deployment**

Check https://vision-board-lake.vercel.app — the dark theme should be live within ~2 minutes of the push.
