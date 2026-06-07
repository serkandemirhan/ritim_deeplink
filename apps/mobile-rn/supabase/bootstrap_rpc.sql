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
