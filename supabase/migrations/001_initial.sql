-- =============================================================
-- Vision Board — Initial Schema
-- Run this in the Supabase SQL Editor.
-- =============================================================

-- -----------------------------------------------------------
-- Table: categories
-- -----------------------------------------------------------
create table categories (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  name        text        not null,
  is_default  boolean     not null default false,
  "order"     integer     not null default 0
);

alter table categories enable row level security;

create policy "Users manage own categories"
  on categories
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------
-- Table: goals
-- -----------------------------------------------------------
create table goals (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  category_id  uuid        not null references categories(id) on delete cascade,
  title        text        not null,
  timeframe    text        not null check (timeframe in ('1year', '3months')),
  image_url    text,
  "order"      integer     not null default 0,
  created_at   timestamptz not null default now()
);

alter table goals enable row level security;

create policy "Users manage own goals"
  on goals
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------
-- Table: action_items
-- -----------------------------------------------------------
create table action_items (
  id         uuid     primary key default gen_random_uuid(),
  goal_id    uuid     not null references goals(id) on delete cascade,
  title      text     not null,
  completed  boolean  not null default false,
  "order"    integer  not null default 0
);

alter table action_items enable row level security;

create policy "Users manage own action items"
  on action_items
  for all
  using (
    auth.uid() = (
      select user_id from goals where goals.id = action_items.goal_id
    )
  )
  with check (
    auth.uid() = (
      select user_id from goals where goals.id = action_items.goal_id
    )
  );


-- =============================================================
-- STORAGE POLICIES
-- =============================================================
-- The policies below CANNOT be run until you have created the
-- "goal-images" storage bucket in the Supabase dashboard.
--
-- Steps:
--   1. Dashboard → Storage → New bucket
--      Name: goal-images   |   Public: YES
--   2. Then run the three statements below in the SQL Editor.
-- =============================================================

/*

-- Policy 1: Users can upload to their own folder
create policy "Users can upload to own folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'goal-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy 2: Public read access
create policy "Public read goal images"
  on storage.objects
  for select
  to public
  using (
    bucket_id = 'goal-images'
  );

-- Policy 3: Users can delete their own images
create policy "Users can delete own images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'goal-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

*/
