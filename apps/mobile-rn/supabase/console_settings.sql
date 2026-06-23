-- Ritim Console settings migration.
-- Run after apps/mobile-rn/supabase/schema.sql in the Supabase SQL editor.

create extension if not exists "pgcrypto";

create or replace function public.current_platform_role()
returns text
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'platform_role',
    auth.jwt() -> 'app_metadata' ->> 'role',
    'user'
  );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
as $$
  select public.current_platform_role() in ('super_admin', 'platform_super_admin', 'platform_admin', 'support');
$$;

create table if not exists public.subscription_plans (
  id text primary key,
  code text not null unique,
  name text not null,
  description text,
  member_limit integer,
  nfc_card_limit integer not null default 0,
  wellness_admin_limit integer,
  report_level text not null default 'basic' check (report_level in ('basic', 'advanced')),
  support_level text not null default 'standard' check (support_level in ('standard', 'priority')),
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.subscription_plans (
  id,
  code,
  name,
  description,
  member_limit,
  nfc_card_limit,
  wellness_admin_limit,
  report_level,
  support_level,
  status
)
values (
  'plan-sports-center-basic',
  'sports_center_basic',
  'Sports Center Basic',
  'Default organization plan for Phase 1 pilots.',
  50,
  200,
  3,
  'basic',
  'standard',
  'active'
)
on conflict (id) do nothing;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  actor_role text not null,
  tenant_id text references public.tenants(id),
  action_type text not null,
  target_entity_type text not null,
  target_entity_id text not null,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  status text not null default 'success' check (status in ('success', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.system_settings (
  id text primary key default 'global' check (id = 'global'),
  app_name text not null default 'Ritim',
  support_email text not null default 'support@getritim.com',
  default_language text not null default 'tr' check (default_language in ('tr', 'en', 'fr')),
  available_languages jsonb not null default '["tr","en","fr"]'::jsonb,
  default_subscription_plan_id text references public.subscription_plans(id) on delete set null,
  maintenance_mode boolean not null default false,
  feature_flags jsonb not null default '{}'::jsonb,
  global_activity_categories jsonb not null default '["exercise","wellness","nutrition"]'::jsonb,
  global_nfc_card_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.system_settings (id, app_name, support_email, default_language)
values ('global', 'Ritim', 'support@getritim.com', 'tr')
on conflict (id) do nothing;

alter table public.system_settings enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "subscription plans authenticated read" on public.subscription_plans;
create policy "subscription plans authenticated read"
on public.subscription_plans
for select
to authenticated
using (true);

drop policy if exists "subscription plans platform write" on public.subscription_plans;
create policy "subscription plans platform write"
on public.subscription_plans
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "audit logs platform read" on public.audit_logs;
create policy "audit logs platform read"
on public.audit_logs
for select
to authenticated
using (public.is_platform_admin());

drop policy if exists "audit logs platform insert" on public.audit_logs;
create policy "audit logs platform insert"
on public.audit_logs
for insert
to authenticated
with check (public.is_platform_admin());

drop policy if exists "system settings platform read" on public.system_settings;
create policy "system settings platform read"
on public.system_settings
for select
to authenticated
using (public.is_platform_admin());

drop policy if exists "system settings platform write" on public.system_settings;
create policy "system settings platform write"
on public.system_settings
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());
