-- H.S. & C.H. Wedding Workbook — Supabase schema
-- Run this once in the Supabase SQL editor of a fresh project.
-- Safe to re-run: every object uses "if not exists" / "or replace" where possible.

-- ========== extensions ==========
create extension if not exists pgcrypto;

-- ========== who is allowed in ==========
-- Fill in the two real sign-in emails before running this file.
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
on conflict (member_key) do update set
  email = excluded.email,
  name = excluded.name,
  bg_color = excluded.bg_color,
  text_color = excluded.text_color;

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
  budget_estimated numeric not null default 0
);

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
  notes text not null default ''
);

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
  status text not null default 'to_buy' check (status in ('to_buy','purchased')),
  price_usd numeric not null default 0,
  occasions text[] not null default '{}',
  channel text not null default '',
  added_by text check (added_by in ('hs','ch')),
  notes text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_photos (
  id uuid primary key default gen_random_uuid(),
  item_id text not null references public.inventory_items (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_id text references public.events (id),   -- null/'global' = applies to everything
  assignee text not null check (assignee in ('hs','ch')),
  status text not null default 'todo' check (status in ('todo','doing','done')),
  is_private boolean not null default false,
  owner text not null check (owner in ('hs','ch')),
  notes text not null default '',
  updated_at timestamptz not null default now()
);

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

-- ========== baseline privileges ==========
-- RLS policies decide *which rows* a query can see; the authenticated role still
-- needs the underlying SQL privilege to query the table at all, or every query
-- fails with "permission denied for table ..." before RLS is even evaluated.
-- member_invites is deliberately left out: no grant + no policy = fully blocked.
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.profiles, public.events, public.looks, public.accessories,
  public.saved_looks, public.tryon_results, public.inventory_items,
  public.inventory_photos, public.tasks, public.vendors, public.run_of_show_nodes
to authenticated;

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
alter table public.member_invites enable row level security; -- no policies: deny-all from the API, trigger bypasses via security definer

-- profiles: any invited member can see both profiles; you can only edit your own
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (public.current_member_key() is not null);
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update
  using (id = auth.uid());

-- shared content tables: full read/write for either of the two invited members
drop policy if exists "events_rw" on public.events;
create policy "events_rw" on public.events for all
  using (public.current_member_key() is not null)
  with check (public.current_member_key() is not null);

drop policy if exists "looks_rw" on public.looks;
create policy "looks_rw" on public.looks for all
  using (public.current_member_key() is not null)
  with check (public.current_member_key() is not null);

drop policy if exists "accessories_rw" on public.accessories;
create policy "accessories_rw" on public.accessories for all
  using (public.current_member_key() is not null)
  with check (public.current_member_key() is not null);

drop policy if exists "saved_looks_rw" on public.saved_looks;
create policy "saved_looks_rw" on public.saved_looks for all
  using (public.current_member_key() is not null)
  with check (public.current_member_key() is not null);

drop policy if exists "tryon_results_rw" on public.tryon_results;
create policy "tryon_results_rw" on public.tryon_results for all
  using (public.current_member_key() is not null)
  with check (public.current_member_key() is not null);

drop policy if exists "inventory_items_rw" on public.inventory_items;
create policy "inventory_items_rw" on public.inventory_items for all
  using (public.current_member_key() is not null)
  with check (public.current_member_key() is not null);

drop policy if exists "inventory_photos_rw" on public.inventory_photos;
create policy "inventory_photos_rw" on public.inventory_photos for all
  using (public.current_member_key() is not null)
  with check (public.current_member_key() is not null);

drop policy if exists "vendors_rw" on public.vendors;
create policy "vendors_rw" on public.vendors for all
  using (public.current_member_key() is not null)
  with check (public.current_member_key() is not null);

drop policy if exists "run_of_show_nodes_rw" on public.run_of_show_nodes;
create policy "run_of_show_nodes_rw" on public.run_of_show_nodes for all
  using (public.current_member_key() is not null)
  with check (public.current_member_key() is not null);

-- tasks: the privacy rule — a private task is invisible and unwritable to anyone but its owner
drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select" on public.tasks for select
  using (not is_private or owner = public.current_member_key());
drop policy if exists "tasks_insert" on public.tasks;
create policy "tasks_insert" on public.tasks for insert
  with check (
    public.current_member_key() is not null
    and (not is_private or owner = public.current_member_key())
  );
drop policy if exists "tasks_update" on public.tasks;
create policy "tasks_update" on public.tasks for update
  using (not is_private or owner = public.current_member_key())
  with check (not is_private or owner = public.current_member_key());
drop policy if exists "tasks_delete" on public.tasks;
create policy "tasks_delete" on public.tasks for delete
  using (not is_private or owner = public.current_member_key());

-- ========== realtime: both of you see each other's edits live ==========
do $$
declare
  t text;
begin
  foreach t in array array['events','looks','accessories','saved_looks','tryon_results',
    'inventory_items','inventory_photos','tasks','vendors','run_of_show_nodes','profiles']
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
insert into storage.buckets (id, name, public)
values ('inventory-photos', 'inventory-photos', false)
on conflict (id) do nothing;

drop policy if exists "inventory_photos_storage_rw" on storage.objects;
create policy "inventory_photos_storage_rw" on storage.objects for all
  using (bucket_id = 'inventory-photos' and public.current_member_key() is not null)
  with check (bucket_id = 'inventory-photos' and public.current_member_key() is not null);

-- ========== seed data: mirrors the approved prototype ==========
insert into public.events (id, name, en, date_label, status, status_label, progress, cover, description, witness_name, budget_tracking, budget_allocated, budget_confirmed, budget_estimated) values
  ('sf', '旧金山市政厅领证', 'SF City Hall', '2027 年春 · 日期待定', 'planning', '策划中', 35, 'cityhall', '私密仪式，仅邀挚友出席。孙哥作为唯一证婚人（Witness）。', '孙哥', false, 15000, 4100, 9200),
  ('cn', '中国正式婚礼', 'China Wedding', '日期 / 地点 / 形式待确认', 'tbd', '待确认', 10, 'china', '国内正式婚礼，日期、地点与形式均待确认。', null, true, 20000, 800, 6000),
  ('us', '美国小型庆祝晚餐', 'US Celebration Dinner', '场地 / 日期 / 规模待定', 'planning', '策划中', 20, 'dinner', '面向亲近朋友的小型庆祝晚宴，场地与规模待定。', null, true, 12000, 2300, 7800)
on conflict (id) do nothing;

insert into public.looks (id, name, subtitle, price, silhouette, fabric, sheen, availability, alteration, look_shape, wearer, occasions, added_by, notes) values
  ('nova', 'Nova Cocotte', 'Heavy Silk Satin', 2800, '美人鱼型 Mermaid', '重磅真丝缎 Heavy Silk Satin', '低光泽哑光', '现货 In Stock', '2–3 周', 'mermaid', 'ch', array['sf','us'], 'ch', '主婚纱首选，拟同时用于领证仪式与晚宴，通过更换配饰切换造型。'),
  ('aidan', 'Aidan', 'Crepe A-line', 1950, 'A 字型 A-line', '绉缎 Crepe', '哑光', 'Rush 加急 · 约 4 周', '3 周', 'aline', 'ch', array['us'], 'hs', '备选款，版型更利落，适合晚宴站立敬酒环节。'),
  ('eugenia', 'Eugenia', 'Tulle Ballgown', 2400, '公主蓬蓬裙 Ballgown', '网纱裙 + 真丝缎上身', '柔光', '现货', '4 周', 'ball', 'ch', array['cn'], 'ch', '拟用于国内正式婚礼敬酒环节，裙型饱满适合舞台效果。'),
  ('oxford', 'Oxford Midnight', 'Wool Three-Piece Suit', 1400, '合身剪裁 Slim Fit', '丝光羊毛三件套', '哑光哔叽', '定制 · 约 5 周', '2 周', 'suit', 'hs', array['us','cn'], 'hs', '晚宴与国内婚礼主造型，深蓝三件套，适合正式敬酒环节。'),
  ('larkspur', 'Larkspur', 'Flannel Two-Piece', 950, '经典剪裁 Classic Fit', '浅灰法兰绒', '哑光', '现货', '1 周', 'suit', 'hs', array['sf'], 'hs', '领证仪式用，轻量两件套，不配马甲，适合白天场合。')
on conflict (id) do nothing;

insert into public.accessories (id, category, name, price, wearer) values
  ('v1', 'veil', '教堂长头纱', 320, 'ch'),
  ('v2', 'veil', '鸟笼头纱', 180, 'ch'),
  ('o1', 'overskirt', '可拆卸网纱裙摆', 450, 'ch'),
  ('c1', 'cape', '真丝披肩', 280, 'ch'),
  ('g1', 'gloves', '过肘长手套', 90, 'ch'),
  ('j1', 'jewelry', '珍珠水滴耳环', 150, 'ch'),
  ('j2', 'jewelry', '锆石项链', 220, 'ch'),
  ('h1', 'headpiece', '珍珠发夹', 85, 'ch'),
  ('s1', 'shoes', '象牙白缎面高跟鞋', 140, 'ch'),
  ('s2', 'shoes', '黑色牛津皮鞋', 180, 'hs'),
  ('t1', 'tie', '丝绒领结', 65, 'hs'),
  ('t2', 'tie', '真丝领带', 70, 'hs'),
  ('cl1', 'cufflink', '银质袖扣', 120, 'hs'),
  ('cl2', 'cufflink', '口袋巾', 40, 'hs')
on conflict (id) do nothing;

insert into public.inventory_items (id, name, status, price_usd, occasions, channel, added_by, notes) values
  ('i1', '主婚纱 Nova Cocotte', 'to_buy', 2800, array['sf','us'], 'BHLDN 官网定制', 'ch', '已付订金，款式与到货日期待最终确认。'),
  ('i2', '对戒', 'purchased', 1600, array['global'], 'Tiffany & Co. 旧金山店', 'hs', '已购买，取货时核对刻字。'),
  ('i3', '教堂长头纱', 'purchased', 320, array['sf'], 'BHLDN 官网', 'ch', ''),
  ('i4', '过肘长手套', 'to_buy', 90, array['sf'], '待下单', 'ch', '需与婚纱同色号。'),
  ('i5', '珍珠水滴耳环', 'purchased', 150, array['sf','us'], 'Mejuri 官网', 'ch', ''),
  ('i6', '象牙白缎面高跟鞋', 'purchased', 140, array['us'], '门店改码后取货', 'ch', '周五可取货。'),
  ('i8', '中式婚礼敬酒服', 'to_buy', 1200, array['cn'], '国内定制中', 'hs', '款式待确认，未付款。')
on conflict (id) do nothing;

insert into public.tasks (title, event_id, assignee, status, is_private, owner, notes)
select * from (values
  ('给孙哥发正式邀请', 'sf', 'hs', 'todo', false, 'hs', '确认地址后邮寄纸质邀请函。'),
  ('准备证婚人感谢礼物', 'sf', 'hs', 'doing', true, 'hs', '打算送孙哥一块腕表，先别让他知道。'),
  ('安排领证后用餐地点', 'sf', 'ch', 'todo', false, 'ch', '市政厅附近，预订 6 人桌。'),
  ('确定中式婚礼日期与场地', 'cn', 'hs', 'todo', false, 'hs', '与双方父母对一下可选月份。'),
  ('敲定晚宴场地与人数', 'us', 'ch', 'doing', false, 'ch', '目前意向 The Pearl Room，约 40 人。'),
  ('准备给 C.H. 的求婚纪念惊喜礼物', null, 'hs', 'todo', true, 'hs', '刻字项链，预计下周到货。'),
  ('挑选并锁定主造型', null, 'ch', 'doing', false, 'ch', '倾向 Nova Cocotte，待最终确认下单。'),
  ('预订婚礼当天跟拍摄影师', 'us', 'hs', 'todo', false, 'hs', '对比 Rose & Light Studio 报价。')
) as seed(title, event_id, assignee, status, is_private, owner, notes)
where not exists (select 1 from public.tasks);

insert into public.vendors (id, name, category, quote, is_rush, deadline, contact, phone, email, event_id, next_step, log) values
  ('ve1', 'Rose & Light Studio', '摄影跟拍', 3200, false, '2026-12-10', 'Mia Chen', '+1 415-555-0148', 'mia@roselight.studio', 'us', '对比第二份报价后回复确认。', '11/10 发送需求说明；11/12 收到初版报价。'),
  ('ve2', 'The Pearl Room SF', '晚宴场地', 5400, true, '2026-11-25', 'James Lin', '+1 415-555-0199', 'james@pearlroomsf.com', 'us', '需在 11/25 前确认档期，否则释放给其他客户。', '11/14 现场看场；档期紧张需尽快决定。'),
  ('ve3', 'Bloom & Blush', '花艺布置', 980, false, '2026-12-20', 'Lucy Tan', '+1 415-555-0122', 'lucy@bloomblush.com', 'us', '确定主色调（雾粉 + 香槟金）后下单。', '11/08 发送 moodboard 参考图。'),
  ('ve4', 'BHLDN Bridal', '婚纱定制', 2800, true, '2026-11-30', 'Sarah Kim', '+1 310-555-0177', 'sarah@bhldn.com', null, '11/30 前确认尺码与加急费用。', '11/05 下定金；等待最终款式确认。'),
  ('ve5', '锦囍文化', '中式婚礼策划', 0, false, null, '王老师', '+86 138-0000-0000', 'wang@jinxi.cn', 'cn', '等待日期确定后再启动报价。', '11/01 初步沟通意向风格。')
on conflict (id) do nothing;

insert into public.run_of_show_nodes (event_id, time_label, title, location, responsible, notes, sort_order)
select * from (values
  ('sf', '10:00', '市政厅四楼大厅集合', 'San Francisco City Hall · 4F Rotunda', 'hs', '提前 30 分钟到场安检。', 1),
  ('sf', '10:30', '领证仪式 · 孙哥证婚', '4F Rotunda', '孙哥', '仪式约 15 分钟，提前与孙哥核对誓词。', 2),
  ('sf', '11:15', '合影留念', '市政厅台阶 & 圆顶大厅', 'ch', '预留 45 分钟拍摄。', 3),
  ('sf', '12:30', '挚友午餐小聚', '市政厅附近餐厅', 'hs', '6-8 人，需提前预订。', 4),
  ('cn', '待定', '迎亲（草稿）', '待定', 'hs', '具体流程待双方家庭沟通后确定。', 1),
  ('cn', '待定', '婚宴敬酒（草稿）', '待定', 'ch', '场地与桌数待确认后再细化时间轴。', 2),
  ('us', '18:00', '宾客入场', 'The Pearl Room SF（意向场地）', 'hs', '设置签到台与欢迎饮品。', 1),
  ('us', '18:30', '鸡尾酒会', '庭院区域', 'ch', '配轻食与live乐手。', 2),
  ('us', '19:30', '晚宴开始 + 致辞', '主宴会厅', 'hs', '致辞顺序：双方父母 → 新人。', 3),
  ('us', '21:00', '甜点 + 跳舞', '主宴会厅', 'ch', '甜品台 + DJ 收尾。', 4)
) as seed(event_id, time_label, title, location, responsible, notes, sort_order)
where not exists (select 1 from public.run_of_show_nodes);
