# Vision Board PWA — Design Spec
Date: 2026-05-18

## Overview

A personal vision board PWA where a user organises goals into categories, attaches motivational images to each goal, and manages action items per goal. Goals are scoped to one of two timeframes (1 Year / 3 Months). The app functions as both a motivational display and an active planning tool.

Deployed as a PWA on Vercel via GitHub. Data lives in Supabase (auth + database + storage).

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Vite + React + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Routing | React Router v6 |
| PWA | vite-plugin-pwa |
| Backend | Supabase (Auth, PostgreSQL, Storage) |
| Deployment | GitHub → Vercel (auto-deploy on push to `main`) |

---

## Data Model

### `categories`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → auth.users | |
| name | text | |
| is_default | boolean | Default categories can be renamed but not deleted |
| order | integer | Display order in tab row |

### `goals`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → auth.users | |
| category_id | uuid FK → categories | |
| title | text | |
| timeframe | text | `'1year'` or `'3months'` |
| image_url | text | Supabase Storage URL |
| order | integer | Display order within category+timeframe |
| created_at | timestamptz | |

### `action_items`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| goal_id | uuid FK → goals | |
| title | text | |
| completed | boolean | Default false |
| order | integer | Display order within goal |

All tables have Row Level Security (RLS) policies: users can only read/write their own rows.

---

## Auth

- Supabase email + password auth
- Auth page at `/` — login/signup toggled on the same page
- On first login, 5 default categories are auto-seeded for the user: Health, Relationships, Career, Money, Personal Brand. Seeding is done client-side on first load of `/board`: if the user has 0 categories, insert the 5 defaults in a single batch insert
- Persistent session (Supabase default — survives page refresh)
- `/board` redirects to `/` if no active session

---

## Routes

| Path | Component | Access |
|---|---|---|
| `/` | AuthPage | Public (redirects to `/board` if already logged in) |
| `/board` | BoardPage | Protected |

---

## UI Structure

### Header (BoardPage)
- Left: app name / logo
- Center: timeframe toggle — `1 Year` | `3 Months` (pill toggle)
- Right: user avatar + logout button

### Category Tabs
- Horizontal scrollable tab row below the header
- Tabs: Health · Relationships · Career · Money · Personal Brand · [custom categories] · `+`
- Active tab is highlighted
- Right-click / long-press a tab → context menu: **Rename** / **Delete**
  - Default categories: Rename only (Delete is disabled)
  - Custom categories: Rename or Delete
  - Deleting a category that has goals shows a confirmation: **Delete all goals** or **Move to…** (pick another category)
- Clicking `+` inserts an inline text input at the end of the tab row — press Enter to confirm

### Goals Grid
- Responsive grid: 3 columns (desktop) · 2 columns (tablet) · 1 column (mobile)
- Shows goals for the currently selected category + timeframe
- FAB (floating action button) bottom-right: `+` to add a new goal
  - Add goal form: title input + image upload + category (pre-selected) + timeframe (pre-selected) → Save

### Goal Card — Collapsed
- Square card with uploaded image as full background
- Dark gradient overlay at bottom
- Goal title in white text over the gradient
- Category badge top-left
- Clicking anywhere on the card expands it

### Goal Card — Expanded (inline)
- Card grows taller; surrounding cards reflow
- Image shrinks to a header strip at the top of the expanded card
- Below the image strip:
  - Goal title (editable inline — click to edit)
  - Action items list: each item has checkbox + text (click text to edit inline)
  - `+ Add action item` at bottom of list
- Top-right corner: `⋯` menu → **Edit title** / **Change image** / **Delete goal**
- Clicking the image strip or an `✕` icon collapses the card

### Image Upload
- "Change image" (or on new goal creation) → file picker (JPG / PNG / WEBP)
- Uploads to Supabase Storage bucket `goal-images`
- Card shows a loading shimmer while uploading
- `image_url` updated on the goal row after successful upload

---

## PWA Configuration

- `display: standalone` — feels native when installed
- Manifest fields: `name`, `short_name`, `theme_color`, `background_color`, icons at 192×192 and 512×512
- Service worker strategy:
  - App shell (HTML / JS / CSS): cache-first
  - Supabase API calls: network-first (no offline data editing in v1)
- Browser install prompt shown after user has visited twice (default `vite-plugin-pwa` behaviour)

---

## Out of Scope (v1)

- Drag-to-reorder goals or categories
- Public board sharing
- Notifications / reminders
- Offline data editing
- Social / collaboration features

---

## Key Constraints

- All Supabase tables must have RLS enabled — no row accessible without a matching `user_id`
- Images stored in a **public** Supabase Storage bucket `goal-images`, with files namespaced by user: `{user_id}/{uuid}.ext`. No signed URL rotation needed; the path itself scopes access implicitly, and RLS on the `goals` table prevents other users from discovering URLs
- No server-side rendering needed — pure SPA is correct for this app
