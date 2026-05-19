# Design Spec: Obsidian Ember Theme + "All" Combined View

**Date:** 2026-05-19  
**Status:** Approved

---

## Summary

Two changes:
1. **Obsidian Ember theme** — full dark redesign (charcoal + fire orange-red gradient), plus an automatic `@media print` stylesheet that flips to warm white + ember accents for wall printing.
2. **"All" combined view** — a virtual first tab that displays every goal across every category in one flat grid, with a colour-coded category chip on each card.

---

## 1. Obsidian Ember Theme

### Colour tokens

| Role | Value | Usage |
|---|---|---|
| `--background` | `#18181b` (zinc-900) | Page background |
| `--surface` | `#27272a` (zinc-800) | Cards, dropdowns, modals |
| `--surface-raised` | `#3f3f46` (zinc-700) | Hover states, elevated surfaces |
| `--border` | `rgba(255,255,255,0.07)` | Dividers, card outlines |
| `--foreground` | `#ffffff` | Primary text |
| `--muted` | `#a1a1aa` (zinc-400) | Secondary text, placeholders |
| `--ember` | `#f97316` (orange-500) | Active tab start, pill |
| `--ember-end` | `#ef4444` (red-500) | Active tab end, gradient |
| `--ember-gradient` | `linear-gradient(90deg, #f97316, #ef4444)` | Active tabs, active pill |
| `--ember-glow` | `rgba(249,115,22, 0.15)` | Inactive pill bg, subtle highlights |

### Components to restyle

**`src/index.css`**
- Override `:root` CSS vars to use Obsidian Ember tokens above (replaces white/slate defaults).
- Add `@media print` block at the end:
  - `body { background: #fff !important; color: #18181b !important; }`
  - `.no-print { display: none !important; }` — hides FAB, sign-out button, context menus
  - Cards: white bg, ember gradient overlay at bottom retained for visual
  - Category chips retain their colour (prints fine on laser/inkjet)

**`src/components/Header.tsx`**
- `bg-white border-slate-100` → `bg-[#18181b] border-white/[0.07]`
- Title: `text-slate-900` → `text-white font-black tracking-tight`
- Timeframe toggle pill container: `bg-slate-100` → `bg-white/[0.06]`
- Active pill: `bg-white text-slate-900 shadow-sm` → `bg-ember-gradient text-white` (inline style or utility)
- Inactive pill: `text-slate-500` → `text-zinc-400 hover:text-white`
- Sign Out button: ghost variant remains but `text-zinc-400 hover:text-white`
- Add `no-print` class to Sign Out button

**`src/components/CategoryTabs.tsx`**
- Tab container: `border-slate-100` → `border-white/[0.07]`
- Active tab: `bg-slate-900 text-white` → `background: linear-gradient(90deg,#f97316,#ef4444); color: white` (inline style on active)
- Inactive tab: `bg-slate-100 text-slate-600 hover:bg-slate-200` → `bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1] hover:text-white`
- Add New input field: dark border + `bg-zinc-800 text-white placeholder:text-zinc-500`
- Context menu: `bg-white border-slate-100` → `bg-zinc-800 border-white/[0.08]`; text `text-slate-600` → `text-zinc-200`; hover `hover:bg-zinc-700`
- Delete confirm modal: same dark treatment; select element dark styled
- Add `no-print` class to the "+" add tab button

**`src/components/GoalsGrid.tsx`**
- Empty state: `text-slate-400` → `text-zinc-500`
- Grid background: inherits page bg (no change needed)

**`src/components/GoalCard.tsx`**
- Default bg gradient (no image): `linear-gradient(135deg, #667eea, #764ba2)` → `linear-gradient(135deg, #3f3f46, #27272a)` (zinc tones — the real image will cover this anyway)
- Collapsed card: no structural change; gradient overlay stays
- Expanded card container: `border-slate-100 bg-white` → `border-white/[0.08] bg-[#27272a]`
- Title: `text-slate-900` → `text-white`; title edit input: `border-slate-300` → `border-white/20 bg-transparent text-white`
- `⋯` menu button: `text-slate-400 hover:text-slate-600` → `text-zinc-500 hover:text-white`
- Dropdown menu: `bg-white border-slate-100` → `bg-zinc-800 border-white/[0.08]`; items `hover:bg-slate-50` → `hover:bg-zinc-700 text-zinc-200`; delete `text-red-600 hover:bg-red-50` → `text-red-400 hover:bg-red-900/30`
- New prop: optional `categoryName` + `categoryColor` strings (used in "All" view only — see below)
- When `categoryName` is provided: render a small pill top-right corner in collapsed state with the given colour

**`src/components/ActionItemsList.tsx`** (read before implementing — expect similar slate→zinc treatment)

**`src/components/AddGoalFAB.tsx`**
- FAB button: `bg-slate-900` → `bg-ember-gradient` (orange-to-red gradient)
- Add `no-print` class

---

## 2. "All" Combined View

### Data

**`src/hooks/useGoals.ts`** — small extension:
- Accept `categoryId: string | null | 'all'` as second argument
- When `categoryId === 'all'`: query `goals` table with `eq('user_id', userId)` and `eq('timeframe', timeframe)` — **no** category filter
- When `categoryId === null`: return empty (existing behaviour for loading state)
- When `categoryId` is a real ID: existing single-category query

### Category colour map

Define a fixed array of 6 accent colours in `src/lib/categoryColors.ts`:

```ts
export const CATEGORY_COLORS = [
  '#f97316', // orange  — Health (index 0)
  '#818cf8', // indigo  — Relationships (index 1)
  '#eab308', // yellow  — Career (index 2)
  '#22c55e', // green   — Money (index 3)
  '#ec4899', // pink    — Personal Brand (index 4)
  '#06b6d4', // cyan    — custom overflow
]

export function categoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}
```

### UI

**`src/components/CategoryTabs.tsx`**
- Accept new optional prop: `showAll?: boolean` (default true)
- Render an "All" button as the first tab before the category list
- `activeId === 'all'` → applies active ember gradient style
- `onSelect('all')` fires the same callback — caller treats `'all'` as a sentinel

**`src/components/BoardPage.tsx`**
- `activeCategoryId` state: `string | null | 'all'`
- `resolvedCategoryId`: if `activeCategoryId === 'all'` → `'all'`; else `activeCategoryId ?? categories[0]?.id ?? null`
- `useGoals(userId, resolvedCategoryId, timeframe)` — now handles `'all'`
- When in "all" mode, pass extra info to `GoalsGrid`:
  - `isAllView: boolean`
  - `categories: Category[]` (so grid can look up category name + colour index per card)

**`src/components/GoalsGrid.tsx`**
- New props: `isAllView?: boolean`, `categories?: Category[]`
- When `isAllView`, pass `categoryName` + `categoryColor` to each `GoalCard` (looked up by `goal.category_id`)

**`src/components/GoalCard.tsx`**
- New optional props: `categoryName?: string`, `categoryColor?: string`
- Collapsed state: when `categoryName` is set, render a small rounded pill top-right:
  ```
  position: absolute, top-2, right-2
  bg: categoryColor at 85% opacity
  text: white, 9px, font-black
  padding: 2px 6px, rounded-md
  ```
- This chip is hidden in the expanded view (not needed there)

### No new routes or pages
The "All" tab is purely a filter — it does not navigate anywhere. The FAB still creates a goal in the currently active category (or the first category if "All" is selected).

---

## Print behaviour

When user hits Ctrl+P (or browser print):
- Background becomes white (`#ffffff`)
- All text becomes near-black (`#18181b`)
- Cards render as white tiles with the image as background (unchanged)
- Category chips retain their colour (they print fine)
- Hidden elements (`no-print`): FAB, Sign Out, context menus, Add tab button
- The ember gradient on active tabs/pills prints as a subtle orange tint (acceptable)

---

## Files changed

| File | Change type |
|---|---|
| `src/index.css` | Theme vars + `@media print` |
| `src/components/Header.tsx` | Restyle |
| `src/components/CategoryTabs.tsx` | Restyle + "All" tab |
| `src/components/GoalsGrid.tsx` | Restyle + all-view props |
| `src/components/GoalCard.tsx` | Restyle + category chip prop |
| `src/components/ActionItemsList.tsx` | Restyle |
| `src/components/AddGoalFAB.tsx` | Restyle + no-print |
| `src/hooks/useGoals.ts` | Support `'all'` categoryId |
| `src/components/BoardPage.tsx` | All-view state + data wiring |
| `src/lib/categoryColors.ts` | New file — colour map |

---

## Out of scope

- No light/dark mode toggle (dark-only for now)
- No per-category custom colours set by user
- No changes to auth page (stays light — fine, it's rarely seen)
- No layout changes to card grid columns
