# Vision Board PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack PWA vision board with goal cards, categories, action items, image uploads, and Supabase backend, deployable to Vercel.

**Architecture:** Pure SPA (Vite + React + TypeScript). All data in Supabase (PostgreSQL + Storage + Auth). React Router v6 for two routes: `/` (auth) and `/board` (protected). No SSR.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, vite-plugin-pwa, Supabase JS v2, React Router v6, Vitest + React Testing Library

---

## File Structure

```
VisionBoard/
├── public/
│   ├── pwa-192x192.png          # PWA icon (placeholder, replace with real asset)
│   └── pwa-512x512.png          # PWA icon large
├── src/
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client singleton
│   │   └── types.ts             # DB row types + app enums
│   ├── hooks/
│   │   ├── useAuth.ts           # Session state + login/logout/signup
│   │   ├── useCategories.ts     # Fetch, create, rename, delete categories
│   │   ├── useGoals.ts          # Fetch, create, update, delete goals
│   │   └── useActionItems.ts   # Fetch, create, toggle, edit, delete action items
│   ├── components/
│   │   ├── ProtectedRoute.tsx   # Redirect to / if no session
│   │   ├── AuthPage.tsx         # Login / signup form
│   │   ├── BoardPage.tsx        # Root board layout, seeds categories on mount
│   │   ├── Header.tsx           # Logo + timeframe toggle + logout
│   │   ├── CategoryTabs.tsx     # Scrollable tabs + add/rename/delete
│   │   ├── GoalsGrid.tsx        # Responsive card grid
│   │   ├── GoalCard.tsx         # Collapsed + expanded card state
│   │   ├── ActionItemsList.tsx  # Checklist inside expanded card
│   │   └── AddGoalFAB.tsx       # FAB + new goal form sheet
│   ├── App.tsx                  # Router setup
│   ├── main.tsx                 # Entry point
│   └── index.css                # Tailwind directives
├── supabase/
│   └── migrations/
│       └── 001_initial.sql      # Schema + RLS + storage bucket
├── vite.config.ts
├── tailwind.config.ts
├── components.json              # shadcn/ui config
├── tsconfig.json
├── index.html
├── .env.example
└── package.json
```

---

## Task 1: Scaffold project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `.env.example`, `components.json`

- [ ] **Step 1: Initialise Vite project**

```bash
cd C:\Users\nagpa\VisionBoard
npm create vite@latest . -- --template react-ts
```

- [ ] **Step 2: Install all dependencies**

```bash
npm install
npm install @supabase/supabase-js react-router-dom
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa workbox-window
npx tailwindcss init -p
```

- [ ] **Step 3: Install shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Slate
- CSS variables: Yes

Then add the components we need:

```bash
npx shadcn@latest add button input label dialog dropdown-menu tabs badge sheet
```

- [ ] **Step 4: Replace `src/index.css` with Tailwind directives**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Write `.env.example`**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 6: Copy to `.env.local` and fill in real values from your Supabase project dashboard**

```bash
cp .env.example .env.local
```

- [ ] **Step 7: Initialise git and commit**

```bash
git init
echo "node_modules\n.env.local\ndist\n.superpowers" > .gitignore
git add .
git commit -m "chore: scaffold Vite + React + TS + Tailwind + shadcn"
```

---

## Task 2: Supabase schema + RLS

**Files:**
- Create: `supabase/migrations/001_initial.sql`

- [ ] **Step 1: Write migration file**

```sql
-- supabase/migrations/001_initial.sql

-- Categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  "order" integer not null default 0
);

alter table categories enable row level security;

create policy "Users manage own categories"
  on categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Goals
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  title text not null,
  timeframe text not null check (timeframe in ('1year', '3months')),
  image_url text,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

alter table goals enable row level security;

create policy "Users manage own goals"
  on goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Action items
create table action_items (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  "order" integer not null default 0
);

alter table action_items enable row level security;

create policy "Users manage own action items"
  on action_items for all
  using (
    exists (
      select 1 from goals g
      where g.id = action_items.goal_id
        and g.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from goals g
      where g.id = action_items.goal_id
        and g.user_id = auth.uid()
    )
  );
```

- [ ] **Step 2: Run migration in Supabase SQL editor**

Open your Supabase project → SQL Editor → paste and run the contents of `supabase/migrations/001_initial.sql`.

- [ ] **Step 3: Create Storage bucket**

In Supabase dashboard → Storage → New bucket:
- Name: `goal-images`
- Public: **Yes**

Then in SQL Editor add a storage policy:

```sql
create policy "Users upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'goal-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Public read goal images"
  on storage.objects for select
  using (bucket_id = 'goal-images');

create policy "Users delete own images"
  on storage.objects for delete
  using (
    bucket_id = 'goal-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "chore: add Supabase schema, RLS, and storage policies"
```

---

## Task 3: Supabase client + shared types

**Files:**
- Create: `src/lib/supabase.ts`, `src/lib/types.ts`

- [ ] **Step 1: Write `src/lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient<Database>(url, key)
```

- [ ] **Step 2: Write `src/lib/types.ts`**

```typescript
export type Timeframe = '1year' | '3months'

export interface Category {
  id: string
  user_id: string
  name: string
  is_default: boolean
  order: number
}

export interface Goal {
  id: string
  user_id: string
  category_id: string
  title: string
  timeframe: Timeframe
  image_url: string | null
  order: number
  created_at: string
}

export interface ActionItem {
  id: string
  goal_id: string
  title: string
  completed: boolean
  order: number
}

// Minimal Database type for Supabase client generic
export interface Database {
  public: {
    Tables: {
      categories: { Row: Category; Insert: Omit<Category, 'id'>; Update: Partial<Omit<Category, 'id'>> }
      goals: { Row: Goal; Insert: Omit<Goal, 'id' | 'created_at'>; Update: Partial<Omit<Goal, 'id' | 'created_at'>> }
      action_items: { Row: ActionItem; Insert: Omit<ActionItem, 'id'>; Update: Partial<Omit<ActionItem, 'id'>> }
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/
git commit -m "feat: add Supabase client and shared types"
```

---

## Task 4: Auth hook + AuthPage

**Files:**
- Create: `src/hooks/useAuth.ts`, `src/components/AuthPage.tsx`, `src/components/ProtectedRoute.tsx`

- [ ] **Step 1: Write `src/hooks/useAuth.ts`**

```typescript
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUp = (email: string, password: string) =>
    supabase.auth.signUp({ email, password })

  const signOut = () => supabase.auth.signOut()

  return { session, signIn, signUp, signOut }
}
```

- [ ] **Step 2: Write `src/components/ProtectedRoute.tsx`**

```typescript
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  if (session === undefined) return null // loading
  if (!session) return <Navigate to="/" replace />
  return <>{children}</>
}
```

- [ ] **Step 3: Write `src/components/AuthPage.tsx`**

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AuthPage() {
  const { signIn, signUp, session } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (session) {
    navigate('/board', { replace: true })
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fn = mode === 'login' ? signIn : signUp
    const { error: err } = await fn(email, password)
    setLoading(false)
    if (err) { setError(err.message); return }
    navigate('/board', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm space-y-6 p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Vision Board</h1>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'login' ? 'Sign in to your board' : 'Create your account'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
        <p className="text-center text-sm text-slate-500">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            className="text-slate-900 font-medium underline underline-offset-2"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write `src/App.tsx`**

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthPage } from './components/AuthPage'
import { BoardPage } from './components/BoardPage'
import { ProtectedRoute } from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/board" element={
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 5: Update `src/main.tsx`**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 6: Run dev server and verify auth page renders**

```bash
npm run dev
```

Open http://localhost:5173 — should see login form with "Vision Board" heading.

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "feat: auth hook, AuthPage, ProtectedRoute, App router"
```

---

## Task 5: Categories hook

**Files:**
- Create: `src/hooks/useCategories.ts`

- [ ] **Step 1: Write `src/hooks/useCategories.ts`**

```typescript
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Category } from '../lib/types'

const DEFAULT_CATEGORIES = [
  { name: 'Health', is_default: true, order: 0 },
  { name: 'Relationships', is_default: true, order: 1 },
  { name: 'Career', is_default: true, order: 2 },
  { name: 'Money', is_default: true, order: 3 },
  { name: 'Personal Brand', is_default: true, order: 4 },
]

export function useCategories(userId: string) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAndSeed = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('order')

    if (error) { setLoading(false); return }

    if (data.length === 0) {
      const { data: seeded } = await supabase
        .from('categories')
        .insert(DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: userId })))
        .select()
      setCategories(seeded ?? [])
    } else {
      setCategories(data)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchAndSeed() }, [fetchAndSeed])

  const addCategory = async (name: string) => {
    const maxOrder = categories.reduce((m, c) => Math.max(m, c.order), -1)
    const { data } = await supabase
      .from('categories')
      .insert({ user_id: userId, name, is_default: false, order: maxOrder + 1 })
      .select()
      .single()
    if (data) setCategories(prev => [...prev, data])
  }

  const renameCategory = async (id: string, name: string) => {
    await supabase.from('categories').update({ name }).eq('id', id)
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c))
  }

  const deleteCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  const moveGoalsToCategory = async (fromId: string, toId: string) => {
    await supabase.from('goals').update({ category_id: toId }).eq('category_id', fromId)
  }

  return { categories, loading, addCategory, renameCategory, deleteCategory, moveGoalsToCategory }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useCategories.ts
git commit -m "feat: useCategories hook with seeding and CRUD"
```

---

## Task 6: Goals hook

**Files:**
- Create: `src/hooks/useGoals.ts`

- [ ] **Step 1: Write `src/hooks/useGoals.ts`**

```typescript
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Goal, Timeframe } from '../lib/types'

export function useGoals(userId: string, categoryId: string | null, timeframe: Timeframe) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!categoryId) return
    setLoading(true)
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .eq('timeframe', timeframe)
      .order('order')
    setGoals(data ?? [])
    setLoading(false)
  }, [userId, categoryId, timeframe])

  useEffect(() => { fetch() }, [fetch])

  const addGoal = async (title: string, imageUrl: string | null) => {
    if (!categoryId) return
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

  const updateGoal = async (id: string, patch: Partial<Pick<Goal, 'title' | 'image_url'>>) => {
    await supabase.from('goals').update(patch).eq('id', id)
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g))
  }

  const deleteGoal = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  return { goals, loading, addGoal, updateGoal, deleteGoal, refetch: fetch }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useGoals.ts
git commit -m "feat: useGoals hook with CRUD"
```

---

## Task 7: Action items hook

**Files:**
- Create: `src/hooks/useActionItems.ts`

- [ ] **Step 1: Write `src/hooks/useActionItems.ts`**

```typescript
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ActionItem } from '../lib/types'

export function useActionItems(goalId: string | null) {
  const [items, setItems] = useState<ActionItem[]>([])

  const fetch = useCallback(async () => {
    if (!goalId) { setItems([]); return }
    const { data } = await supabase
      .from('action_items')
      .select('*')
      .eq('goal_id', goalId)
      .order('order')
    setItems(data ?? [])
  }, [goalId])

  useEffect(() => { fetch() }, [fetch])

  const addItem = async (title: string) => {
    if (!goalId) return
    const maxOrder = items.reduce((m, i) => Math.max(m, i.order), -1)
    const { data } = await supabase
      .from('action_items')
      .insert({ goal_id: goalId, title, completed: false, order: maxOrder + 1 })
      .select()
      .single()
    if (data) setItems(prev => [...prev, data])
  }

  const toggleItem = async (id: string, completed: boolean) => {
    await supabase.from('action_items').update({ completed }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, completed } : i))
  }

  const renameItem = async (id: string, title: string) => {
    await supabase.from('action_items').update({ title }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, title } : i))
  }

  const deleteItem = async (id: string) => {
    await supabase.from('action_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return { items, addItem, toggleItem, renameItem, deleteItem }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useActionItems.ts
git commit -m "feat: useActionItems hook with CRUD"
```

---

## Task 8: Header component

**Files:**
- Create: `src/components/Header.tsx`

- [ ] **Step 1: Write `src/components/Header.tsx`**

```typescript
import { useAuth } from '../hooks/useAuth'
import { Button } from '@/components/ui/button'
import type { Timeframe } from '../lib/types'

interface HeaderProps {
  timeframe: Timeframe
  onTimeframeChange: (t: Timeframe) => void
}

export function Header({ timeframe, onTimeframeChange }: HeaderProps) {
  const { signOut } = useAuth()

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
      <span className="font-bold text-slate-900 text-lg">Vision Board</span>

      <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1">
        <button
          onClick={() => onTimeframeChange('1year')}
          className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
            timeframe === '1year'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          1 Year
        </button>
        <button
          onClick={() => onTimeframeChange('3months')}
          className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
            timeframe === '3months'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          3 Months
        </button>
      </div>

      <Button variant="ghost" size="sm" onClick={() => signOut()}>
        Sign out
      </Button>
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat: Header with timeframe toggle"
```

---

## Task 9: CategoryTabs component

**Files:**
- Create: `src/components/CategoryTabs.tsx`

- [ ] **Step 1: Write `src/components/CategoryTabs.tsx`**

```typescript
import { useRef, useState } from 'react'
import type { Category } from '../lib/types'

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
      <div className="flex gap-1 overflow-x-auto px-4 py-2 scrollbar-none border-b border-slate-100">
        {categories.map(cat => (
          <button
            key={cat.id}
            id={`cat-tab-${cat.id}`}
            onClick={() => onSelect(cat.id)}
            onContextMenu={e => openContext(e, cat.id)}
            onTouchStart={() => startLongPress(cat.id)}
            onTouchEnd={cancelLongPress}
            onTouchMove={cancelLongPress}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors select-none ${
              activeId === cat.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {renamingId === cat.id ? (
              <input
                autoFocus
                className="bg-transparent outline-none w-24 text-current"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onBlur={confirmRename}
                onKeyDown={e => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenamingId(null) }}
                onClick={e => e.stopPropagation()}
              />
            ) : cat.name}
          </button>
        ))}

        {adding ? (
          <input
            autoFocus
            className="px-3 py-1.5 rounded-full text-sm border border-slate-300 outline-none w-28"
            placeholder="Category name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onBlur={confirmAdd}
            onKeyDown={e => { if (e.key === 'Enter') confirmAdd(); if (e.key === 'Escape') { setAdding(false); setNewName('') } }}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-500 hover:bg-slate-200"
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
            className="fixed z-30 bg-white rounded-lg shadow-lg border border-slate-100 py-1 min-w-[140px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
              onClick={() => startRename(contextCat.id, contextCat.name)}
            >
              Rename
            </button>
            {!contextCat.is_default && (
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={() => handleDelete(contextCat.id)}
              >
                Delete
              </button>
            )}
          </div>
        </>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-80 space-y-4 shadow-xl">
            <h3 className="font-semibold text-slate-900">Delete category</h3>
            <p className="text-sm text-slate-500">This category has goals. What should happen to them?</p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Move goals to</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
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
              <button className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700" onClick={confirmDelete}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CategoryTabs.tsx
git commit -m "feat: CategoryTabs with add, rename, delete, and move-goals confirm"
```

---

## Task 10: ActionItemsList component

**Files:**
- Create: `src/components/ActionItemsList.tsx`

- [ ] **Step 1: Write `src/components/ActionItemsList.tsx`**

```typescript
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
            className="h-4 w-4 rounded border-slate-300 accent-slate-800 cursor-pointer"
          />
          {editingId === item.id ? (
            <input
              autoFocus
              className="flex-1 text-sm outline-none border-b border-slate-300"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={() => confirmEdit(item.id)}
              onKeyDown={e => { if (e.key === 'Enter') confirmEdit(item.id); if (e.key === 'Escape') setEditingId(null) }}
            />
          ) : (
            <span
              onClick={() => startEdit(item)}
              className={`flex-1 text-sm cursor-text select-none ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}
            >
              {item.title}
            </span>
          )}
          <button
            onClick={() => onDelete(item.id)}
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-xs transition-opacity"
          >
            ✕
          </button>
        </div>
      ))}

      <div className="flex items-center gap-2 pt-1">
        <input
          className="flex-1 text-sm outline-none border-b border-slate-200 focus:border-slate-400 bg-transparent py-0.5 placeholder:text-slate-400"
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

- [ ] **Step 2: Commit**

```bash
git add src/components/ActionItemsList.tsx
git commit -m "feat: ActionItemsList with add, toggle, rename, delete"
```

---

## Task 11: GoalCard component

**Files:**
- Create: `src/components/GoalCard.tsx`

- [ ] **Step 1: Write `src/components/GoalCard.tsx`**

```typescript
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
        <span className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
          {/* category name shown by parent */}
        </span>
        <p className="absolute bottom-3 left-3 right-3 text-white font-semibold text-sm leading-tight">
          {goal.title}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white col-span-full md:col-span-1">
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
            onKeyDown={e => { if (e.key === 'Enter') confirmTitle(); if (e.key === 'Escape') { setTitleDraft(goal.title); setEditingTitle(false) } }}
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
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50" onClick={() => { setEditingTitle(true); setMenuOpen(false) }}>Edit title</button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50" onClick={() => { fileRef.current?.click(); setMenuOpen(false) }}>Change image</button>
                <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50" onClick={() => { onDelete(); setMenuOpen(false) }}>Delete goal</button>
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

- [ ] **Step 2: Commit**

```bash
git add src/components/GoalCard.tsx
git commit -m "feat: GoalCard collapsed and expanded with image upload and action items"
```

---

## Task 12: GoalsGrid + AddGoalFAB

**Files:**
- Create: `src/components/GoalsGrid.tsx`, `src/components/AddGoalFAB.tsx`

- [ ] **Step 1: Write `src/components/GoalsGrid.tsx`**

```typescript
import { useState } from 'react'
import { GoalCard } from './GoalCard'
import type { Goal } from '../lib/types'

interface GoalsGridProps {
  goals: Goal[]
  userId: string
  categoryName: string
  onUpdate: (id: string, patch: Partial<Pick<Goal, 'title' | 'image_url'>>) => void
  onDelete: (id: string) => void
}

export function GoalsGrid({ goals, userId, categoryName, onUpdate, onDelete }: GoalsGridProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <p className="text-4xl mb-3">🎯</p>
        <p className="text-sm">No goals yet in {categoryName}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {goals.map(goal => (
        <GoalCard
          key={goal.id}
          goal={goal}
          userId={userId}
          isExpanded={expandedId === goal.id}
          onToggleExpand={() => setExpandedId(expandedId === goal.id ? null : goal.id)}
          onUpdate={patch => onUpdate(goal.id, patch)}
          onDelete={() => onDelete(goal.id)}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Write `src/components/AddGoalFAB.tsx`**

```typescript
import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Category, Timeframe } from '../lib/types'

interface AddGoalFABProps {
  userId: string
  categories: Category[]
  activeCategoryId: string | null
  activeTimeframe: Timeframe
  onAdd: (title: string, imageUrl: string | null) => Promise<void>
}

export function AddGoalFAB({ userId, categories, activeCategoryId, activeTimeframe, onAdd }: AddGoalFABProps) {
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
    if (!title.trim()) return
    setSaving(true)
    let imageUrl: string | null = null

    if (imageFile && activeCategoryId) {
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
        className="fixed bottom-6 right-6 z-10 w-14 h-14 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-700 flex items-center justify-center text-2xl transition-colors"
      >
        +
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white w-full sm:w-96 rounded-t-3xl sm:rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="font-semibold text-slate-900">New Goal</h2>

            <div>
              <label className="text-sm font-medium text-slate-700">Goal title</label>
              <input
                autoFocus
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400"
                placeholder="e.g. Run a half marathon"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Image (optional)</label>
              {imagePreview ? (
                <div className="relative mt-1 h-32 rounded-lg overflow-hidden">
                  <img src={imagePreview} className="w-full h-full object-cover" alt="preview" />
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(null) }}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >✕</button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="mt-1 w-full h-24 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-400 hover:border-slate-400 transition-colors"
                >
                  Click to upload
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pickFile} />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >Cancel</button>
              <button
                className="flex-1 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-50 hover:bg-slate-700"
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

- [ ] **Step 3: Commit**

```bash
git add src/components/GoalsGrid.tsx src/components/AddGoalFAB.tsx
git commit -m "feat: GoalsGrid and AddGoalFAB with image upload"
```

---

## Task 13: BoardPage — wire everything together

**Files:**
- Create: `src/components/BoardPage.tsx`

- [ ] **Step 1: Write `src/components/BoardPage.tsx`**

```typescript
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
  const userId = session!.user.id
  const [timeframe, setTimeframe] = useState<Timeframe>('1year')
  const {
    categories, loading: catsLoading,
    addCategory, renameCategory, deleteCategory, moveGoalsToCategory
  } = useCategories(userId)

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const resolvedCategoryId = activeCategoryId ?? categories[0]?.id ?? null

  const { goals, addGoal, updateGoal, deleteGoal } = useGoals(userId, resolvedCategoryId, timeframe)

  function hasGoals(categoryId: string) {
    return goals.some(g => g.category_id === categoryId)
  }

  const activeCategoryName = categories.find(c => c.id === resolvedCategoryId)?.name ?? ''

  if (catsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header timeframe={timeframe} onTimeframeChange={setTimeframe} />
      <CategoryTabs
        categories={categories}
        activeId={resolvedCategoryId}
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
      />
      <AddGoalFAB
        userId={userId}
        categories={categories}
        activeCategoryId={resolvedCategoryId}
        activeTimeframe={timeframe}
        onAdd={addGoal}
      />
    </div>
  )
}
```

- [ ] **Step 2: Run dev server and smoke-test the full flow**

```bash
npm run dev
```

1. Sign up with a test email
2. Verify 5 default categories appear in tabs
3. Add a goal, upload an image
4. Click the card — verify it expands
5. Add action items, toggle completion
6. Switch timeframe — grid clears and shows correct goals
7. Add a custom category, rename it

- [ ] **Step 3: Commit**

```bash
git add src/components/BoardPage.tsx
git commit -m "feat: BoardPage wires all components together"
```

---

## Task 14: PWA configuration

**Files:**
- Modify: `vite.config.ts`, `index.html`
- Create: `public/pwa-192x192.png`, `public/pwa-512x512.png`

- [ ] **Step 1: Generate placeholder PWA icons**

Create two simple placeholder PNG icons (192×192 and 512×512). You can use any online tool or the following to generate them quickly:

```bash
# On Windows with Node.js — install sharp-cli once globally
npm install -g sharp-cli
sharp -i public/pwa-512x512.png -o public/pwa-192x192.png resize 192 192
```

Or just copy any 512×512 PNG image into `public/pwa-512x512.png` and resize a copy to `public/pwa-192x192.png`. The app will work without them but install prompt may not show.

- [ ] **Step 2: Update `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Vision Board',
        short_name: 'VisionBoard',
        description: 'Your personal vision board',
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/board',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-cache', networkTimeoutSeconds: 10 },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

- [ ] **Step 3: Update `tsconfig.json` to include path alias**

Add to `compilerOptions`:
```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

- [ ] **Step 4: Build and verify PWA**

```bash
npm run build
npm run preview
```

Open http://localhost:4173 in Chrome. Open DevTools → Application → Manifest — verify manifest fields are populated. Check Service Workers tab — verify worker is registered.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts tsconfig.json public/
git commit -m "feat: configure vite-plugin-pwa with manifest and workbox"
```

---

## Task 15: GitHub + Vercel deployment

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Write `vercel.json` to handle SPA routing**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

- [ ] **Step 2: Push to GitHub**

1. Create a new repo on GitHub (e.g. `vision-board`)
2. Add remote and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/vision-board.git
git branch -M main
git push -u origin main
```

- [ ] **Step 3: Deploy to Vercel**

1. Go to https://vercel.com/new
2. Import your `vision-board` GitHub repo
3. Vercel auto-detects Vite — keep default settings (output dir `dist`, build command `npm run build`)
4. Add Environment Variables:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
5. Click Deploy

- [ ] **Step 4: Configure Supabase Auth redirect URL**

In Supabase dashboard → Authentication → URL Configuration:
- Add your Vercel URL to **Allowed Redirect URLs**: `https://your-app.vercel.app/**`

- [ ] **Step 5: Verify production deployment**

Open your Vercel URL:
1. Sign up / sign in works
2. Categories seed on first login
3. Goals and action items save and reload correctly
4. PWA install prompt appears (Chrome desktop: address bar install icon)

- [ ] **Step 6: Final commit**

```bash
git add vercel.json
git commit -m "chore: add vercel.json SPA rewrite rule"
git push
```

---

## Self-Review

**Spec coverage check:**
- ✅ Auth (email/password, login/signup toggle)
- ✅ Protected `/board` route
- ✅ Default category seeding on first login
- ✅ Timeframe toggle (1year / 3months)
- ✅ Category tabs (scrollable, add/rename/delete, default vs custom)
- ✅ Goals grid (3/2/1 col responsive)
- ✅ Goal card collapsed (image bg + title + gradient)
- ✅ Goal card expanded inline (image strip + action items)
- ✅ Action items (add, toggle, rename, delete inline)
- ✅ Image upload to Supabase Storage (goal-images bucket, user-namespaced paths)
- ✅ Loading shimmer on upload
- ✅ FAB + add goal form
- ✅ PWA manifest + service worker
- ✅ Vercel deployment with SPA rewrites
- ✅ RLS on all tables
- ✅ Category delete with move-goals confirmation
