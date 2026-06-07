-- Ritim Phase 1 Supabase schema.
-- Run this in Supabase SQL editor before enabling the app's online sync.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  age integer,
  gender text check (gender in ('female', 'male', 'other', 'prefer_not_to_say')),
  height_cm integer,
  weight_kg numeric,
  activity_level text check (activity_level in ('low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenants (
  id text primary key,
  name text not null,
  slug text not null,
  type text not null check (type in ('personal', 'gym', 'wellness_studio', 'trainer', 'company')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('tenant_owner', 'tenant_admin', 'trainer', 'member')),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table if not exists public.activity_types (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  category text not null check (category in ('fitness', 'wellness', 'routine')),
  name text not null,
  display_name_tr text not null,
  display_name_en text not null,
  unit text not null,
  default_increment numeric not null,
  icon text,
  color text,
  calories_per_unit numeric,
  workout_category text,
  muscle_group text,
  difficulty text,
  intensity text,
  tracking_mode text,
  description text,
  is_active boolean not null default true,
  is_custom boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, category, name)
);

create table if not exists public.nfc_tags (
  id text primary key,
  uid_hash text not null unique,
  mock_uid text,
  public_tag_code text,
  status text not null check (status in ('active', 'disabled')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.tenant_nfc_cards (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  tag_id text references public.nfc_tags(id) on delete cascade,
  uid_hash text not null,
  card_name text not null,
  category text not null check (category in ('fitness', 'wellness', 'routine')),
  status text not null check (status in ('active', 'unassigned', 'disabled', 'lost')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, uid_hash)
);

create table if not exists public.card_assignments (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  tenant_card_id text not null references public.tenant_nfc_cards(id) on delete cascade,
  activity_type_id text not null references public.activity_types(id) on delete restrict,
  increment_value numeric not null,
  unit text not null,
  daily_goal numeric,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tag_id text references public.nfc_tags(id) on delete set null,
  tenant_card_id text references public.tenant_nfc_cards(id) on delete set null,
  activity_type_id text not null references public.activity_types(id) on delete restrict,
  category text not null check (category in ('fitness', 'wellness', 'routine')),
  value numeric not null,
  unit text not null,
  calories numeric,
  source text not null check (source in ('mock_nfc', 'nfc', 'manual')),
  sync_status text not null default 'synced',
  logged_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.routines (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  activity_type_id text references public.activity_types(id) on delete set null,
  name text not null,
  category text not null default 'exercise' check (category in ('exercise', 'wellness')),
  target_type text not null default 'completion' check (target_type in ('completion', 'set_based', 'duration_based', 'count_based', 'page_based')),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.routines add column if not exists activity_type_id text references public.activity_types(id) on delete set null;

create table if not exists public.routine_plans (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  routine_id text not null references public.routines(id) on delete cascade,
  effective_from date not null,
  effective_to date,
  schedule_type text not null default 'weekly' check (schedule_type in ('daily', 'weekly', 'custom')),
  selected_days jsonb not null default '[]'::jsonb,
  target_type text not null check (target_type in ('completion', 'set_based', 'duration_based', 'count_based', 'page_based')),
  target_sets numeric,
  target_reps_per_set numeric,
  target_total_units numeric,
  blocks numeric,
  units_per_block numeric,
  unit_type text not null check (unit_type in ('repetition', 'page', 'minute', 'count')),
  minimum_success_percent numeric not null default 80,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.routine_progression_rules (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  routine_id text not null references public.routines(id) on delete cascade,
  mode text not null default 'none' check (mode in ('none', 'weekly', 'monthly', 'custom')),
  increase_frequency text,
  increase_amount numeric not null default 0,
  increase_unit text check (increase_unit in ('reps_per_set', 'sets', 'pages_per_day', 'minutes_per_day', 'count_per_day')),
  start_policy text not null default 'next_week',
  start_date date,
  max_target_sets numeric,
  max_target_reps_per_set numeric,
  max_total_units numeric,
  requires_user_approval boolean not null default true,
  custom_roadmap jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.routine_daily_logs (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  routine_id text not null references public.routines(id) on delete cascade,
  date date not null,
  plan_snapshot_json jsonb not null,
  planned_total_units numeric not null default 0,
  completed_total_units numeric not null default 0,
  completed_sets_count numeric,
  extra_units numeric not null default 0,
  success_percent numeric not null default 0,
  is_successful boolean not null default false,
  is_overachieved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (routine_id, date)
);

create table if not exists public.routine_log_entries (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  daily_log_id text not null references public.routine_daily_logs(id) on delete cascade,
  routine_id text not null references public.routines(id) on delete cascade,
  entry_index integer not null,
  entry_type text not null check (entry_type in ('set', 'block', 'manual')),
  value numeric not null,
  is_extra boolean not null default false,
  created_at timestamptz not null default now(),
  unique (daily_log_id, entry_index)
);

alter table if exists public.tenant_nfc_cards alter column tag_id drop not null;
alter table if exists public.tenant_nfc_cards drop constraint if exists tenant_nfc_cards_status_check;
alter table if exists public.tenant_nfc_cards add constraint tenant_nfc_cards_status_check check (status in ('active', 'unassigned', 'disabled', 'lost'));

create index if not exists idx_tenant_members_user on public.tenant_members(user_id);
create index if not exists idx_activity_logs_tenant_logged on public.activity_logs(tenant_id, logged_at desc);
create index if not exists idx_cards_tenant_uid on public.tenant_nfc_cards(tenant_id, uid_hash);
create index if not exists idx_routines_tenant on public.routines(tenant_id);
create index if not exists idx_routines_activity_type on public.routines(tenant_id, activity_type_id);
create index if not exists idx_routine_plans_routine_effective on public.routine_plans(routine_id, effective_from desc);
create index if not exists idx_routine_daily_logs_tenant_date on public.routine_daily_logs(tenant_id, date desc);

alter table public.profiles enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.activity_types enable row level security;
alter table public.nfc_tags enable row level security;
alter table public.tenant_nfc_cards enable row level security;
alter table public.card_assignments enable row level security;
alter table public.activity_logs enable row level security;
alter table public.routines enable row level security;
alter table public.routine_plans enable row level security;
alter table public.routine_progression_rules enable row level security;
alter table public.routine_daily_logs enable row level security;
alter table public.routine_log_entries enable row level security;

create or replace function public.is_tenant_member(target_tenant_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_members
    where tenant_id = target_tenant_id
    and user_id = auth.uid()
  );
$$;

create or replace function public.bootstrap_profile_tenant(p_profile jsonb, p_tenant jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  profile_id uuid := (p_profile->>'id')::uuid;
  tenant_id_value text := p_tenant->>'id';
  member_role text := coalesce(p_tenant->>'role', 'tenant_owner');
begin
  if current_user_id is null then
    raise exception 'not authenticated';
  end if;

  if profile_id is null or profile_id <> current_user_id then
    raise exception 'profile does not match authenticated user';
  end if;

  if tenant_id_value is null or tenant_id_value = '' then
    raise exception 'tenant id is required';
  end if;

  insert into public.profiles (
    id,
    full_name,
    email,
    age,
    gender,
    height_cm,
    weight_kg,
    activity_level,
    created_at,
    updated_at
  )
  values (
    profile_id,
    p_profile->>'full_name',
    p_profile->>'email',
    nullif(p_profile->>'age', '')::integer,
    nullif(p_profile->>'gender', ''),
    nullif(p_profile->>'height_cm', '')::integer,
    nullif(p_profile->>'weight_kg', '')::numeric,
    nullif(p_profile->>'activity_level', ''),
    coalesce((p_profile->>'created_at')::timestamptz, now()),
    coalesce((p_profile->>'updated_at')::timestamptz, now())
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    age = excluded.age,
    gender = excluded.gender,
    height_cm = excluded.height_cm,
    weight_kg = excluded.weight_kg,
    activity_level = excluded.activity_level,
    updated_at = excluded.updated_at;

  insert into public.tenants (
    id,
    name,
    slug,
    type,
    created_at,
    updated_at
  )
  values (
    tenant_id_value,
    p_tenant->>'name',
    p_tenant->>'slug',
    p_tenant->>'type',
    coalesce((p_tenant->>'created_at')::timestamptz, now()),
    coalesce((p_tenant->>'updated_at')::timestamptz, now())
  )
  on conflict (id) do update set
    name = excluded.name,
    slug = excluded.slug,
    type = excluded.type,
    updated_at = excluded.updated_at;

  insert into public.tenant_members (
    tenant_id,
    user_id,
    role
  )
  values (
    tenant_id_value,
    current_user_id,
    member_role
  )
  on conflict (tenant_id, user_id) do update set
    role = excluded.role;
end;
$$;

grant execute on function public.bootstrap_profile_tenant(jsonb, jsonb) to authenticated;

drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles for select using (id = auth.uid());
drop policy if exists "profiles own write" on public.profiles;
create policy "profiles own write" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "tenant member read tenants" on public.tenants;
create policy "tenant member read tenants" on public.tenants for select using (public.is_tenant_member(id));
drop policy if exists "authenticated create tenants" on public.tenants;
create policy "authenticated create tenants" on public.tenants for insert with check (auth.uid() is not null);
drop policy if exists "tenant member update tenants" on public.tenants;
create policy "tenant member update tenants" on public.tenants for update using (public.is_tenant_member(id)) with check (public.is_tenant_member(id));

drop policy if exists "members read own memberships" on public.tenant_members;
create policy "members read own memberships" on public.tenant_members for select using (user_id = auth.uid() or public.is_tenant_member(tenant_id));
drop policy if exists "authenticated create own membership" on public.tenant_members;
create policy "authenticated create own membership" on public.tenant_members for insert with check (user_id = auth.uid());

drop policy if exists "tenant member all activity types" on public.activity_types;
create policy "tenant member all activity types" on public.activity_types for all using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));

drop policy if exists "authenticated read nfc tags" on public.nfc_tags;
create policy "authenticated read nfc tags" on public.nfc_tags for select using (auth.uid() is not null);
drop policy if exists "authenticated create nfc tags" on public.nfc_tags;
create policy "authenticated create nfc tags" on public.nfc_tags for insert with check (auth.uid() is not null);
drop policy if exists "authenticated update nfc tags" on public.nfc_tags;
create policy "authenticated update nfc tags" on public.nfc_tags for update using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "tenant member all cards" on public.tenant_nfc_cards;
create policy "tenant member all cards" on public.tenant_nfc_cards for all using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));

drop policy if exists "tenant member all assignments" on public.card_assignments;
create policy "tenant member all assignments" on public.card_assignments for all using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));

drop policy if exists "tenant member all logs" on public.activity_logs;
create policy "tenant member all logs" on public.activity_logs for all using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id) and user_id = auth.uid());

drop policy if exists "tenant member all routines" on public.routines;
create policy "tenant member all routines" on public.routines for all using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));

drop policy if exists "tenant member all routine plans" on public.routine_plans;
create policy "tenant member all routine plans" on public.routine_plans for all using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));

drop policy if exists "tenant member all routine progression rules" on public.routine_progression_rules;
create policy "tenant member all routine progression rules" on public.routine_progression_rules for all using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));

drop policy if exists "tenant member all routine daily logs" on public.routine_daily_logs;
create policy "tenant member all routine daily logs" on public.routine_daily_logs for all using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));

drop policy if exists "tenant member all routine log entries" on public.routine_log_entries;
create policy "tenant member all routine log entries" on public.routine_log_entries for all using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
