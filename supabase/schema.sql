-- H.S. & C.H. Wedding Workbook — Supabase schema
-- Run this once in the Supabase SQL editor of a fresh project.
-- Safe to re-run: every object uses "if not exists" / "or replace" where possible.

-- ========== extensions ==========
create extension if not exists pgcrypto;

-- ========== who is allowed in ==========
-- Fill in the two real sign-in emails only the FIRST time you run this file
-- on a fresh project. On re-runs this intentionally changes nothing (even if
-- you forgot to edit the placeholders below), so re-running this whole file
-- can never clobber emails you already fixed by hand. To actually change an
-- email later, run a plain `update public.member_invites set email = '...'
-- where member_key = 'hs';` on its own instead of re-pasting this file.
create table if not exists public.member_invites (
  email text primary key,
  member_key text not null unique check (member_key in ('hs','ch')),
  name text not null,
  bg_color text not null,
  text_color text not null
);

insert into public.member_invites (email, member_key, name, bg_color, text_color) values
  ('REPLACE_WITH_HS_EMAIL@example.com', 'hs', 'H.S.', '#2B4C7E', '#FFFFFF'),
  ('REPLACE_WITH_CH_EMAIL@example.com', 'ch', 'C.H.', '#D9B98C', '#211A12')
on conflict (member_key) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  member_key text not null unique check (member_key in ('hs','ch')),
  name text not null,
  bg_color text not null,
  text_color text not null,
  created_at timestamptz not null default now()
);

-- When someone signs in with an invited email, turn them into a profile automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  inv record;
begin
  select * into inv from public.member_invites where lower(trim(email)) = lower(trim(new.email));
  if inv.member_key is not null then
    insert into public.profiles (id, member_key, name, bg_color, text_color)
    values (new.id, inv.member_key, inv.name, inv.bg_color, inv.text_color)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: anyone who signed up before their email was correctly invited
-- (or before this trigger existed) gets matched up now instead of staying stuck.
insert into public.profiles (id, member_key, name, bg_color, text_color)
select u.id, mi.member_key, mi.name, mi.bg_color, mi.text_color
from auth.users u
join public.member_invites mi on lower(trim(mi.email)) = lower(trim(u.email))
on conflict (id) do nothing;

-- Helper RLS policies key off this: null = "not an invited member", blocks everything.
-- security definer is required: without it, this query is itself subject to the
-- profiles_select policy below (which calls this same function), which recurses
-- and makes every policy that calls this silently return nothing.
create or replace function public.current_member_key()
returns text
language sql stable
security definer set search_path = public
as $$
  select member_key from public.profiles where id = auth.uid()
$$;

-- ========== core content tables ==========
create table if not exists public.events (
  id text primary key,                 -- 'sf' | 'cn' | 'us'
  name text not null,
  en text not null,
  date_label text not null default '',
  status text not null default 'planning',
  status_label text not null default '',
  progress int not null default 0,
  cover text not null default '',
  description text not null default '',
  witness_name text,
  budget_tracking boolean not null default false,
  budget_allocated numeric not null default 0,
  budget_confirmed numeric not null default 0,
  budget_estimated numeric not null default 0,
  sort_order int not null default 0
);
alter table public.events add column if not exists sort_order int not null default 0;

create table if not exists public.looks (
  id text primary key,
  name text not null,
  subtitle text not null default '',
  price numeric not null default 0,
  silhouette text not null default '',
  fabric text not null default '',
  sheen text not null default '',
  availability text not null default '',
  alteration text not null default '',
  look_shape text not null default 'aline',   -- drives the illustrated silhouette
  wearer text not null check (wearer in ('hs','ch')),
  occasions text[] not null default '{}',     -- event ids
  added_by text check (added_by in ('hs','ch')),
  notes text not null default '',
  is_private boolean not null default false,
  owner text
);
-- Added after the table could already have rows: backfill before tightening to not null.
alter table public.looks add column if not exists is_private boolean not null default false;
alter table public.looks add column if not exists owner text;
update public.looks set owner = coalesce(owner, added_by, 'hs') where owner is null;
alter table public.looks alter column owner set default 'hs';
alter table public.looks alter column owner set not null;
alter table public.looks drop constraint if exists looks_owner_check;
alter table public.looks add constraint looks_owner_check check (owner in ('hs','ch'));

create table if not exists public.accessories (
  id text primary key,
  category text not null,
  name text not null,
  price numeric not null default 0,
  wearer text not null check (wearer in ('hs','ch'))
);

create table if not exists public.saved_looks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  look_id text references public.looks (id) on delete set null,
  accessory_ids text[] not null default '{}',
  occasion text references public.events (id),
  created_at timestamptz not null default now()
);

create table if not exists public.tryon_results (
  id uuid primary key default gen_random_uuid(),
  look_name text not null,
  accessory_names text[] not null default '{}',
  image_url text,                        -- filled in once the real fal.ai call is wired up
  created_by text check (created_by in ('hs','ch')),
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_items (
  id text primary key,
  name text not null,
  status text not null default 'to_buy' check (status in ('pending','to_buy','purchased')),
  price_usd numeric not null default 0,
  occasions text[] not null default '{}',
  channel text not null default '',
  added_by text check (added_by in ('hs','ch')),
  notes text not null default '',
  look_id text references public.looks (id) on delete set null,
  updated_at timestamptz not null default now(),
  is_private boolean not null default false,
  owner text
);

-- These two only do something on a project that already had this table
-- before "pending" and look_id existed; harmless no-ops on a fresh one.
alter table public.inventory_items add column if not exists look_id text references public.looks (id) on delete set null;
-- A private look's linked inventory row mirrors its privacy so the surprise
-- doesn't leak through the 物品清单 tab. Backfill before tightening to not null.
alter table public.inventory_items add column if not exists is_private boolean not null default false;
alter table public.inventory_items add column if not exists owner text;
update public.inventory_items set owner = coalesce(owner, added_by, 'hs') where owner is null;
alter table public.inventory_items alter column owner set default 'hs';
alter table public.inventory_items alter column owner set not null;
alter table public.inventory_items drop constraint if exists inventory_items_owner_check;
alter table public.inventory_items add constraint inventory_items_owner_check check (owner in ('hs','ch'));
alter table public.inventory_items drop constraint if exists inventory_items_status_check;
alter table public.inventory_items add constraint inventory_items_status_check check (status in ('pending','to_buy','purchased'));

create table if not exists public.inventory_photos (
  id uuid primary key default gen_random_uuid(),
  item_id text not null references public.inventory_items (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_id text references public.events (id),   -- deprecated, kept for old rows; UI now uses tags
  assignee text not null check (assignee in ('hs','ch')),
  status text not null default 'todo' check (status in ('todo','doing','done')),
  is_private boolean not null default false,
  owner text not null check (owner in ('hs','ch')),
  notes text not null default '',
  deadline date,
  tags text[] not null default '{}',   -- free-form; an event's id (e.g. 'sf') is also a valid tag
  updated_at timestamptz not null default now()
);
alter table public.tasks add column if not exists deadline date;
alter table public.tasks add column if not exists tags text[] not null default '{}';

create table if not exists public.vendors (
  id text primary key,
  name text not null,
  category text not null default '',
  quote numeric not null default 0,
  is_rush boolean not null default false,
  deadline date,
  contact text not null default '',
  phone text not null default '',
  email text not null default '',
  event_id text references public.events (id),
  next_step text not null default '',
  log text not null default ''
);

create table if not exists public.run_of_show_nodes (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events (id),
  time_label text not null default '',
  title text not null,
  location text not null default '',
  responsible text not null,              -- member_key, or a plain name for a non-member (e.g. the witness)
  notes text not null default '',
  sort_order int not null default 0
);

-- Everyday life to-dos, unrelated to the wedding itself. Same privacy model as
-- tasks (owner-only when private), kept in its own table/tab on purpose.
create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  deadline date,
  status text not null default 'todo' check (status in ('todo','done')),
  is_private boolean not null default false,
  owner text not null check (owner in ('hs','ch')),
  notes text not null default '',
  tags text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.daily_tasks add column if not exists tags text[] not null default '{}';

-- A short, public activity feed ("H.S. just added look Oxford Midnight") for
-- the sidebar. Append-only: no update policy, and anyone can read it since
-- the summaries never include anything the private-task rule would hide.
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null check (actor in ('hs','ch')),
  summary text not null,
  created_at timestamptz not null default now()
);

-- A private two-person chat/memo between hs and ch — unlike the rest of the
-- site this is deliberately NOT public: anonymous visitors get no grant at
-- all, same treatment as member_invites.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender text not null check (sender in ('hs','ch')),
  body text not null,
  created_at timestamptz not null default now()
);

-- ========== baseline privileges ==========
-- RLS policies decide *which rows* a query can see; a role still needs the
-- underlying SQL privilege to query the table at all, or every query fails
-- with "permission denied for table ..." before RLS is even evaluated.
-- The site is public to read: anon gets SELECT only. Writing needs an
-- invited account, so only authenticated gets INSERT/UPDATE/DELETE.
-- member_invites is deliberately left out of both: no grant + no policy =
-- fully blocked from the API either way.
grant usage on schema public to authenticated, anon;
grant select on
  public.profiles, public.events, public.looks, public.accessories,
  public.saved_looks, public.tryon_results, public.inventory_items,
  public.inventory_photos, public.tasks, public.vendors, public.run_of_show_nodes,
  public.daily_tasks, public.activity_log
to authenticated, anon;
grant insert, update, delete on
  public.profiles, public.events, public.looks, public.accessories,
  public.saved_looks, public.tryon_results, public.inventory_items,
  public.inventory_photos, public.tasks, public.vendors, public.run_of_show_nodes,
  public.daily_tasks
to authenticated;
grant insert on public.activity_log to authenticated;
-- messages: authenticated only, no anon grant at all — this chat is private.
grant select, insert, delete on public.messages to authenticated;

-- ========== row level security ==========
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.looks enable row level security;
alter table public.accessories enable row level security;
alter table public.saved_looks enable row level security;
alter table public.tryon_results enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_photos enable row level security;
alter table public.tasks enable row level security;
alter table public.vendors enable row level security;
alter table public.run_of_show_nodes enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.activity_log enable row level security;
alter table public.messages enable row level security;
alter table public.member_invites enable row level security; -- no policies: deny-all from the API, trigger bypasses via security definer

-- activity_log: anyone can read the feed; only an invited member can post to it.
drop policy if exists "activity_log_select" on public.activity_log;
create policy "activity_log_select" on public.activity_log for select using (true);
drop policy if exists "activity_log_insert" on public.activity_log;
create policy "activity_log_insert" on public.activity_log for insert
  with check (public.current_member_key() is not null and actor = public.current_member_key());

-- messages: only the two logged-in members can read or write this chat; a
-- sender can delete their own message, never the other member's.
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages for select
  using (public.current_member_key() is not null);
drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages for insert
  with check (public.current_member_key() is not null and sender = public.current_member_key());
drop policy if exists "messages_delete" on public.messages;
create policy "messages_delete" on public.messages for delete
  using (sender = public.current_member_key());

-- profiles: anyone can see the two member profiles (name/colors for avatars);
-- you can only edit your own.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (true);
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update
  using (id = auth.uid());

-- shared content tables: anyone can read; only an invited, logged-in member
-- can create, change or delete rows. One select + 3 write policies per table,
-- generated in a loop so every table gets exactly the same rule.
do $$
declare
  t text;
begin
  foreach t in array array['events','accessories','saved_looks','tryon_results',
    'inventory_photos','vendors','run_of_show_nodes']
  loop
    execute format('drop policy if exists "%s_rw" on public.%I', t, t);
    execute format('drop policy if exists "%s_select" on public.%I', t, t);
    execute format('create policy "%s_select" on public.%I for select using (true)', t, t);
    execute format('drop policy if exists "%s_insert" on public.%I', t, t);
    execute format(
      'create policy "%s_insert" on public.%I for insert with check (public.current_member_key() is not null)',
      t, t
    );
    execute format('drop policy if exists "%s_update" on public.%I', t, t);
    execute format(
      'create policy "%s_update" on public.%I for update using (public.current_member_key() is not null) with check (public.current_member_key() is not null)',
      t, t
    );
    execute format('drop policy if exists "%s_delete" on public.%I', t, t);
    execute format(
      'create policy "%s_delete" on public.%I for delete using (public.current_member_key() is not null)',
      t, t
    );
  end loop;
end $$;

-- tasks, daily_tasks, looks and inventory_items: the privacy rule — a private
-- row is invisible and unwritable to anyone but its owner (including
-- anonymous visitors, for whom current_member_key() is null, so only
-- not_is_private rows ever match).
do $$
declare
  t text;
begin
  foreach t in array array['tasks','daily_tasks','looks','inventory_items']
  loop
    execute format('drop policy if exists "%s_select" on public.%I', t, t);
    execute format(
      'create policy "%s_select" on public.%I for select using (not is_private or owner = public.current_member_key())',
      t, t
    );
    execute format('drop policy if exists "%s_insert" on public.%I', t, t);
    execute format(
      'create policy "%s_insert" on public.%I for insert with check (public.current_member_key() is not null and (not is_private or owner = public.current_member_key()))',
      t, t
    );
    execute format('drop policy if exists "%s_update" on public.%I', t, t);
    execute format(
      'create policy "%s_update" on public.%I for update using (not is_private or owner = public.current_member_key()) with check (not is_private or owner = public.current_member_key())',
      t, t
    );
    execute format('drop policy if exists "%s_delete" on public.%I', t, t);
    execute format(
      'create policy "%s_delete" on public.%I for delete using (not is_private or owner = public.current_member_key())',
      t, t
    );
  end loop;
end $$;

-- ========== realtime: both of you see each other's edits live ==========
do $$
declare
  t text;
begin
  foreach t in array array['events','looks','accessories','saved_looks','tryon_results',
    'inventory_items','inventory_photos','tasks','vendors','run_of_show_nodes','profiles',
    'daily_tasks','activity_log','messages']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ========== storage: real photos for purchased inventory items ==========
-- Public bucket: anyone with the link can view a photo via its public URL
-- (no RLS involved on that path). Uploading/deleting still needs an account.
insert into storage.buckets (id, name, public)
values ('inventory-photos', 'inventory-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "inventory_photos_storage_rw" on storage.objects;
drop policy if exists "inventory_photos_storage_insert" on storage.objects;
create policy "inventory_photos_storage_insert" on storage.objects for insert
  with check (bucket_id = 'inventory-photos' and public.current_member_key() is not null);
drop policy if exists "inventory_photos_storage_update" on storage.objects;
create policy "inventory_photos_storage_update" on storage.objects for update
  using (bucket_id = 'inventory-photos' and public.current_member_key() is not null)
  with check (bucket_id = 'inventory-photos' and public.current_member_key() is not null);
drop policy if exists "inventory_photos_storage_delete" on storage.objects;
create policy "inventory_photos_storage_delete" on storage.objects for delete
  using (bucket_id = 'inventory-photos' and public.current_member_key() is not null);

-- ========== seed data ==========
-- Only the three fixed events are seeded. Everything else (looks, accessories,
-- inventory, tasks, vendors, run-of-show nodes, daily to-dos) starts empty on
-- purpose — add it yourself from the app. Nothing here is fabricated content.
insert into public.events (id, name, en, date_label, status, status_label, progress, cover, description, witness_name, budget_tracking, budget_allocated, budget_confirmed, budget_estimated) values
  ('sf', '旧金山市政厅领证', 'SF City Hall', '2027 年春 · 日期待定', 'planning', '策划中', 0, 'cityhall', '私密仪式，仅邀挚友出席。孙哥作为唯一证婚人（Witness）。', '孙哥', false, 0, 0, 0),
  ('cn', '正式婚礼', 'China Wedding', '日期 / 地点 / 形式待确认', 'tbd', '待确认', 0, 'china', '国内正式婚礼，日期、地点与形式均待确认。', null, true, 0, 0, 0),
  ('us', '美国朋友聚餐/旅行', 'US Friends Gathering', '场地 / 日期 / 规模待定', 'planning', '策划中', 0, 'dinner', '面向亲近朋友的小型庆祝晚宴，场地与规模待定。', null, true, 0, 0, 0)
on conflict (id) do nothing;

-- Renamed after the fact: these two keep re-applying even on an existing
-- project where the insert above was a no-op the first time.
update public.events set name = '正式婚礼' where id = 'cn';
update public.events set name = '美国朋友聚餐/旅行', en = 'US Friends Gathering' where id = 'us';

-- Give the three a stable starting order; after this, reordering from the
-- app is what moves them, not whatever order Postgres happens to return.
-- Only runs while every row is still untouched (sort_order = 0), so it can
-- never undo a reorder you've already done from the app.
do $$
begin
  if (select count(*) from public.events where sort_order <> 0) = 0 then
    update public.events set sort_order = 0 where id = 'sf';
    update public.events set sort_order = 1 where id = 'cn';
    update public.events set sort_order = 2 where id = 'us';
  end if;
end $$;

-- One-time cleanup for a project that already ran an older version of this
-- file with example content (dresses, gloves, sample tasks, ...). Targets
-- only the known seed rows by id/title, so anything you've since added
-- yourself is untouched. Safe to leave in on a fresh project — every delete
-- matches nothing there.
delete from public.looks where id in ('nova','aidan','eugenia','oxford','larkspur');
delete from public.accessories where id in ('v1','v2','o1','c1','g1','j1','j2','h1','s1','s2','t1','t2','cl1','cl2');
delete from public.inventory_items where id in ('i1','i2','i3','i4','i5','i6','i8');
delete from public.vendors where id in ('ve1','ve2','ve3','ve4','ve5');
delete from public.run_of_show_nodes where title in (
  '市政厅四楼大厅集合','领证仪式 · 孙哥证婚','合影留念','挚友午餐小聚',
  '迎亲（草稿）','婚宴敬酒（草稿）','宾客入场','鸡尾酒会','晚宴开始 + 致辞','甜点 + 跳舞'
);
delete from public.tasks where title in (
  '给孙哥发正式邀请','准备证婚人感谢礼物','安排领证后用餐地点','确定中式婚礼日期与场地',
  '敲定晚宴场地与人数','准备给 C.H. 的求婚纪念惊喜礼物','挑选并锁定主造型','预订婚礼当天跟拍摄影师'
);
delete from public.daily_tasks where title in ('续签公寓租约','体检报告去拿','还信用卡');
update public.events set progress = 0, budget_allocated = 0, budget_confirmed = 0, budget_estimated = 0;
