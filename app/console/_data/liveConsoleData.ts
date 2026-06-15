import type { JoinStatus, PlatformRole, PlatformUser, PlanCode, StaffRole } from './mockConsoleData';

type SupabaseProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type SupabaseTenantMember = {
  tenant_id: string;
  user_id: string;
  role: 'tenant_owner' | 'tenant_admin' | 'trainer' | 'member';
  created_at: string | null;
};

type SupabaseTenant = {
  id: string;
  name: string;
  type: string | null;
};

type SupabaseAuthUser = {
  id: string;
  email?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_sign_in_at?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
};

type SupabaseAuthUsersResponse = {
  users?: SupabaseAuthUser[];
};

export type LiveConsoleUsersResult = {
  users: PlatformUser[];
  source: 'supabase';
  error?: string;
};

type RuntimeEnvironment = 'development' | 'staging' | 'production';

function normalizeEnvironment(value?: string | null): RuntimeEnvironment {
  if (value === 'production' || value === 'prod') return 'production';
  if (value === 'staging') return 'staging';
  return 'development';
}

function isPlaceholder(value?: string | null) {
  const normalized = String(value ?? '').trim();
  return !normalized || /^<[^>]+>$/.test(normalized) || normalized.includes('your-project.supabase.co') || normalized.includes('your-');
}

function firstConfigured(...values: Array<string | undefined>) {
  return values.find((value) => !isPlaceholder(value))?.trim();
}

function getEnvironmentSuffixes(environment: RuntimeEnvironment) {
  if (environment === 'production') return ['PRODUCTION', 'PROD'];
  if (environment === 'staging') return ['STAGING'];
  return ['DEVELOPMENT', 'DEV'];
}

function getText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getSupabaseConfig() {
  const environment = normalizeEnvironment(process.env.NEXT_PUBLIC_ENVIRONMENT ?? process.env.VERCEL_ENV);
  const [primarySuffix, secondarySuffix] = getEnvironmentSuffixes(environment);
  const url = firstConfigured(
    process.env[`SUPABASE_URL_${primarySuffix}`],
    secondarySuffix ? process.env[`SUPABASE_URL_${secondarySuffix}`] : undefined,
    process.env[`NEXT_PUBLIC_SUPABASE_URL_${primarySuffix}`],
    secondarySuffix ? process.env[`NEXT_PUBLIC_SUPABASE_URL_${secondarySuffix}`] : undefined,
    process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_URL
  );
  const serviceRoleKey = firstConfigured(
    process.env[`SUPABASE_SERVICE_ROLE_KEY_${primarySuffix}`],
    secondarySuffix ? process.env[`SUPABASE_SERVICE_ROLE_KEY_${secondarySuffix}`] : undefined,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const restKey = firstConfigured(
    serviceRoleKey,
    process.env[`SUPABASE_ANON_KEY_${primarySuffix}`],
    secondarySuffix ? process.env[`SUPABASE_ANON_KEY_${secondarySuffix}`] : undefined,
    process.env[`NEXT_PUBLIC_SUPABASE_ANON_KEY_${primarySuffix}`],
    secondarySuffix ? process.env[`NEXT_PUBLIC_SUPABASE_ANON_KEY_${secondarySuffix}`] : undefined,
    process.env.SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  );
  return { environment, url: url?.replace(/\/$/, ''), restKey, serviceRoleKey };
}

async function fetchSupabaseTable<T>(path: string, url: string, key: string): Promise<T[]> {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Supabase table ${path} failed with ${response.status}${text ? `: ${text}` : ''}`);
  }

  return response.json() as Promise<T[]>;
}

async function fetchAuthUsers(url: string, serviceRoleKey: string): Promise<SupabaseAuthUser[]> {
  const response = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1000`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Supabase Auth users failed with ${response.status}${text ? `: ${text}` : ''}`);
  }

  const payload = await response.json() as SupabaseAuthUsersResponse | SupabaseAuthUser[];
  return Array.isArray(payload) ? payload : payload.users ?? [];
}

function mapTenantRole(role: SupabaseTenantMember['role']): StaffRole {
  if (role === 'tenant_owner') return 'owner';
  if (role === 'tenant_admin') return 'admin';
  if (role === 'trainer') return 'coach';
  return 'member';
}

function mapPlatformRole(authUser?: SupabaseAuthUser): PlatformRole {
  const metadataRole = getText(authUser?.app_metadata?.platform_role)
    ?? getText(authUser?.app_metadata?.role)
    ?? getText(authUser?.user_metadata?.platform_role);
  if (metadataRole === 'platform_super_admin') return 'platform_super_admin';
  if (metadataRole === 'platform_admin') return 'platform_admin';
  if (metadataRole === 'support') return 'support';
  return 'user';
}

function mapPersonalPlan(authUser?: SupabaseAuthUser): PlanCode {
  const plan = getText(authUser?.app_metadata?.plan_code)
    ?? getText(authUser?.user_metadata?.plan_code)
    ?? getText(authUser?.app_metadata?.personal_plan);
  if (plan === 'personal_pro') return 'personal_pro';
  if (plan === 'sports_center_basic') return 'sports_center_basic';
  return 'free';
}

function authDisplayName(authUser?: SupabaseAuthUser) {
  return getText(authUser?.user_metadata?.full_name)
    ?? getText(authUser?.user_metadata?.name)
    ?? getText(authUser?.user_metadata?.display_name)
    ?? null;
}

function buildPlatformUser({
  profile,
  authUser,
  membership,
  tenant,
}: {
  profile?: SupabaseProfile;
  authUser?: SupabaseAuthUser;
  membership?: SupabaseTenantMember;
  tenant?: SupabaseTenant;
}): PlatformUser {
  const email = profile?.email ?? authUser?.email ?? '-';
  const role = membership ? mapTenantRole(membership.role) : null;
  const platformRole = mapPlatformRole(authUser);

  return {
    id: membership ? `${profile?.id ?? authUser?.id}-${membership.tenant_id}` : profile?.id ?? authUser?.id ?? email,
    fullName: profile?.full_name ?? authDisplayName(authUser) ?? email.split('@')[0] ?? 'Unnamed user',
    email,
    platformRole,
    sportsCenterId: membership?.tenant_id ?? null,
    sportsCenterName: tenant?.name ?? null,
    sportsCenterRole: role,
    status: 'active' as JoinStatus,
    personalPlan: mapPersonalPlan(authUser),
    joinSource: membership ? 'manual_admin' : null,
    lastSeenAt: authUser?.last_sign_in_at ?? profile?.updated_at ?? authUser?.updated_at ?? profile?.created_at ?? '-',
    createdAt: membership?.created_at ?? profile?.created_at ?? authUser?.created_at ?? '-',
  };
}

export async function getLivePlatformUsers(): Promise<LiveConsoleUsersResult> {
  const { environment, url, restKey, serviceRoleKey } = getSupabaseConfig();

  if (!url || !restKey) {
    return {
      users: [],
      source: 'supabase',
      error: `${environment} Supabase env eksik veya placeholder. Vercel için gerçek NEXT_PUBLIC_SUPABASE_URL_${environment === 'production' ? 'PROD' : environment === 'staging' ? 'STAGING' : 'DEV'} ve SUPABASE_SERVICE_ROLE_KEY_${environment === 'production' ? 'PROD' : environment === 'staging' ? 'STAGING' : 'DEV'} değerlerini tanımla.`,
    };
  }

  if (!serviceRoleKey) {
    return {
      users: [],
      source: 'supabase',
      error: `${environment} ortamında tüm kullanıcıları göstermek için gerçek SUPABASE_SERVICE_ROLE_KEY gerekli. Anon key auth.users listesini okuyamaz.`,
    };
  }

  try {
    const [profiles, memberships, tenants, authUsers] = await Promise.all([
      fetchSupabaseTable<SupabaseProfile>('profiles?select=id,full_name,email,created_at,updated_at&order=created_at.desc', url, restKey),
      fetchSupabaseTable<SupabaseTenantMember>('tenant_members?select=tenant_id,user_id,role,created_at', url, restKey),
      fetchSupabaseTable<SupabaseTenant>('tenants?select=id,name,type', url, restKey),
      fetchAuthUsers(url, serviceRoleKey),
    ]);

    const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
    const tenantsById = new Map(tenants.map((tenant) => [tenant.id, tenant]));
    const authUsersById = new Map(authUsers.map((user) => [user.id, user]));
    const allUserIds = new Set<string>([
      ...profiles.map((profile) => profile.id),
      ...authUsers.map((user) => user.id),
      ...memberships.map((membership) => membership.user_id),
    ]);

    const membershipsByUserId = new Map<string, SupabaseTenantMember[]>();
    memberships.forEach((membership) => {
      const existing = membershipsByUserId.get(membership.user_id) ?? [];
      existing.push(membership);
      membershipsByUserId.set(membership.user_id, existing);
    });

    const users = Array.from(allUserIds).flatMap((userId) => {
      const profile = profilesById.get(userId);
      const authUser = authUsersById.get(userId);
      const userMemberships = membershipsByUserId.get(userId) ?? [];

      if (!userMemberships.length) {
        return [buildPlatformUser({ profile, authUser })];
      }

      return userMemberships.map((membership) => buildPlatformUser({
        profile,
        authUser,
        membership,
        tenant: tenantsById.get(membership.tenant_id),
      }));
    });

    users.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return { users, source: 'supabase' };
  } catch (error) {
    return {
      users: [],
      source: 'supabase',
      error: error instanceof Error ? error.message : 'Supabase kullanıcıları okunamadı.',
    };
  }
}

export function splitLiveUsers(users: PlatformUser[]) {
  return {
    admins: users.filter((user) => user.platformRole !== 'user' || (user.sportsCenterRole && user.sportsCenterRole !== 'member')),
    members: users.filter((user) => user.sportsCenterRole === 'member'),
    staff: users.filter((user) => user.sportsCenterRole && user.sportsCenterRole !== 'member'),
  };
}
