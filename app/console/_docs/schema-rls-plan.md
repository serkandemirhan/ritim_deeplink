# Console Schema and RLS Plan

This plan maps `console.md` requirements onto the current Supabase schema without breaking the existing mobile sync flow.

## Current Backend Baseline

Existing SQL files live under `apps/mobile-rn/supabase/`:

- `schema.sql`
- `bootstrap_rpc.sql`
- `seed_activity_types.sql`

Current tenant model:

- `profiles`
- `tenants`
- `tenant_members`
- `activity_types`
- `nfc_tags`
- `tenant_nfc_cards`
- `card_assignments`
- `activity_logs`
- `routines`
- `routine_plans`
- `routine_progression_rules`
- `routine_daily_logs`
- `routine_log_entries`

Current RLS helper:

- `public.is_tenant_member(target_tenant_id text)`

Current RLS limitation:

- Existing policies generally allow any tenant member broad access inside a tenant.
- Console requires stricter admin/member separation.
- Super Admin access is not modeled in RLS yet.

## Naming Decision

Keep existing `tenants` tables as the physical source of truth for now.

Reason:

- Mobile app sync already depends on `tenants`, `tenant_members`, `tenant_nfc_cards`, `activity_types`, and related table names.
- Renaming to `organizations` now would create unnecessary migration risk.
- Console can expose the product language "Organization" while the data access layer maps it to `tenants`.

Implementation rule:

- TypeScript/domain uses `organizationId`.
- Supabase rows use `tenant_id`.
- Data mappers convert `tenant_id` <-> `organizationId`.

Future option:

- Add database views named `organizations`, `organization_members`, and `organization_admins` if external/reporting consumers need console terminology.

## Required Table Mapping

| Console concept | Current table | Decision |
| --- | --- | --- |
| `profiles` | `profiles` | Reuse. Add admin metadata only if needed. |
| `organizations` | `tenants` | Reuse with compatibility mapping. Add organization metadata columns to `tenants`. |
| `organization_members` | `tenant_members` | Reuse. Add status and join-request fields. |
| `organization_admins` | `tenant_members` | Reuse rows with roles `tenant_owner`, `tenant_admin`, `trainer`; expose as admins/staff in console. |
| `join_requests` | Missing | Add table. |
| `nfc_cards` | `nfc_tags` + `tenant_nfc_cards` + `card_assignments` | Reuse and extend. Personal/global physical card stays in `nfc_tags`; tenant meaning stays in `tenant_nfc_cards`; action stays in `card_assignments`. |
| `rhythms` | `routines` | Reuse and extend. |
| `rhythm_templates` | `routines` | Reuse `is_template` column to add. |
| `activity_library` | `activity_types` | Reuse and extend with global-template capability. |
| `activity_logs` | `activity_logs` | Reuse. Add admin/import source if console needs it. |
| `subscription_plans` | Missing | Add table. |
| `organization_subscriptions` | Missing | Add table. |
| `audit_logs` | Missing | Add table. |
| `system_settings` | Missing | Add table. |
| `organization_settings` | Missing | Add table. |

## Migration Plan

Create a new console migration file, for example:

```text
apps/mobile-rn/supabase/console_schema.sql
```

The migration should be additive first.

### Extend `tenants`

Add:

- `logo_url text`
- `contact_email text`
- `phone_number text`
- `address text`
- `country text`
- `city text`
- `timezone text default 'Europe/Istanbul'`
- `status text default 'active' check (...)`
- `subscription_plan_id text`
- `member_limit integer`
- `nfc_card_limit integer`

Status values:

- `active`
- `inactive`
- `suspended`
- `archived`

### Extend `tenant_members`

Add:

- `status text default 'active' check (...)`
- `joined_at timestamptz`
- `join_request_id uuid`
- `created_by uuid references auth.users(id)`
- `updated_at timestamptz default now()`

Status values:

- `active`
- `inactive`
- `pending`
- `invited`
- `blocked`
- `archived`

### Extend `tenant_nfc_cards`

Add:

- `owner_user_id uuid references auth.users(id)`
- `assigned_member_id uuid references auth.users(id)`
- `label text`
- `last_scanned_at timestamptz`
- `public_code text`

Normalize status values over time:

- Current: `active`, `unassigned`, `disabled`, `lost`
- Console target: `active`, `inactive`, `unassigned`, `assigned`, `lost`, `archived`
- Transitional policy: accept both `disabled` and `inactive` until mobile app is migrated.

### Extend `activity_types`

Add:

- `is_global boolean default false`
- `description text` already exists
- `status text default 'active'`

For global templates, allow nullable `tenant_id` only if mobile sync is updated to handle it. Until then, prefer a separate `global_activity_library` table or tenant-owned copies.

### Extend `routines`

Add:

- `created_by uuid references auth.users(id)`
- `goal_type text`
- `default_target numeric`
- `frequency text`
- `default_scan_amount numeric`
- `is_template boolean default false`
- `status text default 'active'`

### Extend `activity_logs`

Add:

- `created_by uuid references auth.users(id)`
- `note text`

Expand `source` check:

- Current: `mock_nfc`, `nfc`, `manual`
- Console target: `nfc`, `manual`, `admin`, `import`
- Transitional policy: keep `mock_nfc` for mobile/dev.

## New Tables

### `join_requests`

Required columns:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id)`
- `tenant_id text not null references public.tenants(id)`
- `source text not null check (source in ('qr', 'nfc', 'invite_link', 'email_invite', 'manual_admin', 'club_code'))`
- `nfc_card_id text references public.tenant_nfc_cards(id)`
- `status text not null default 'pending' check (status in ('pending', 'approved', 'rejected'))`
- `requested_at timestamptz not null default now()`
- `reviewed_by uuid references auth.users(id)`
- `reviewed_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `subscription_plans`

Required columns:

- `id text primary key`
- `code text not null unique`
- `name text not null`
- `description text`
- `member_limit integer`
- `nfc_card_limit integer not null`
- `wellness_admin_limit integer`
- `report_level text not null default 'basic'`
- `support_level text not null default 'standard'`
- `status text not null default 'active'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `organization_subscriptions`

Use tenant terminology physically:

- `id text primary key`
- `tenant_id text not null references public.tenants(id)`
- `plan_id text not null references public.subscription_plans(id)`
- `plan_code text not null`
- `status text not null`
- `provider text not null default 'manual'`
- `provider_customer_id text`
- `provider_subscription_id text`
- `member_limit_override integer`
- `nfc_card_limit_override integer`
- `current_period_end timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `audit_logs`

Required columns:

- `id uuid primary key default gen_random_uuid()`
- `actor_user_id uuid references auth.users(id)`
- `actor_role text not null`
- `tenant_id text references public.tenants(id)`
- `action_type text not null`
- `target_entity_type text not null`
- `target_entity_id text not null`
- `old_value jsonb`
- `new_value jsonb`
- `ip_address text`
- `user_agent text`
- `status text not null default 'success'`
- `created_at timestamptz not null default now()`

### `system_settings`

Recommended shape:

- `id text primary key default 'global'`
- `app_name text not null`
- `support_email text not null`
- `default_language text not null default 'tr'`
- `available_languages jsonb not null default '["tr","en"]'::jsonb`
- `default_subscription_plan_id text`
- `maintenance_mode boolean not null default false`
- `feature_flags jsonb not null default '{}'::jsonb`
- `global_activity_categories jsonb not null default '[]'::jsonb`
- `global_nfc_card_settings jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `organization_settings`

Use tenant terminology physically:

- `id uuid primary key default gen_random_uuid()`
- `tenant_id text not null unique references public.tenants(id)`
- `logo_url text`
- `contact_email text`
- `phone_number text`
- `address text`
- `default_language text not null default 'tr'`
- `member_approval_mode text not null default 'manual'`
- `nfc_scan_behavior text not null default 'create_join_request'`
- `default_rhythm_template_ids jsonb not null default '[]'::jsonb`
- `notification_preferences jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## RLS Draft

Add platform-role helpers first.

### Role helpers

Platform roles should be read from `auth.jwt() -> 'app_metadata'`.

```sql
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

create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
  select public.current_platform_role() in ('super_admin', 'platform_super_admin');
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
as $$
  select public.current_platform_role() in ('super_admin', 'platform_super_admin', 'platform_admin', 'support');
$$;

create or replace function public.is_tenant_admin(target_tenant_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
  or exists (
    select 1
    from public.tenant_members
    where tenant_id = target_tenant_id
      and user_id = auth.uid()
      and role in ('tenant_owner', 'tenant_admin', 'trainer')
      and coalesce(status, 'active') = 'active'
  );
$$;
```

### Policy direction

- Super Admin / Platform Admin: all tenant-scoped rows.
- Support: read-all first; mutations should be limited by app-level checks unless explicit support mutations are required.
- Wellness Admin: rows where `tenant_id` matches their active/admin organization.
- Trainer/staff: limited organization read/write depending on feature.
- Member: own rows and approved organization membership only.

### Table policy direction

- `tenants`: platform admin all; tenant admin read/update own tenant.
- `tenant_members`: platform admin all; tenant admin manage own members; member can read own membership.
- `join_requests`: platform admin all; tenant admin own tenant; requester can see own request.
- `tenant_nfc_cards`: platform admin all; tenant admin own tenant; member read only assigned/visible org cards if needed.
- `card_assignments`: platform admin all; tenant admin own tenant.
- `activity_types`: global read plus tenant-scoped admin management.
- `activity_logs`: platform admin all; tenant admin own tenant; member own logs.
- `subscription_plans`: authenticated read; platform admin write.
- `organization_subscriptions`: platform admin all; tenant admin read own subscription.
- `audit_logs`: platform admin all; tenant admin own tenant read; writes through server-side helper only.
- `system_settings`: platform admin read/write; optional authenticated read for public flags.
- `organization_settings`: platform admin all; tenant admin own tenant.

## Service Role Rule

Console server-side data access may use `SUPABASE_SERVICE_ROLE_KEY_*` only in server-only modules.

Rules:

- Never expose service role key to client components.
- Keep service-role fetches inside server components, route handlers, or server-only data modules.
- Mutations must still call explicit permission helpers and write audit logs; service role is not a permission model by itself.
- Client-side console components should call server actions or route handlers, not Supabase directly with service role.

