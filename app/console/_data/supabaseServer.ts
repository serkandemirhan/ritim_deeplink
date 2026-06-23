import 'server-only';

export type RuntimeEnvironment = 'development' | 'staging' | 'production';

export type SupabaseServerConfig = {
  environment: RuntimeEnvironment;
  url?: string;
  restKey?: string;
  serviceRoleKey?: string;
};

export type SupabaseMutationResult<T> = {
  data: T | null;
  error?: string;
};

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

export function getSupabaseServerConfig(): SupabaseServerConfig {
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
  )?.replace(/\/$/, '');
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

  return { environment, url, restKey, serviceRoleKey };
}

function requireRestConfig(config = getSupabaseServerConfig()) {
  if (!config.url || !config.restKey) {
    throw new Error(`${config.environment} Supabase env is missing or placeholder.`);
  }
  return { url: config.url, key: config.restKey };
}

function requireServiceRoleConfig(config = getSupabaseServerConfig()) {
  if (!config.url || !config.serviceRoleKey) {
    throw new Error(`${config.environment} Supabase service role env is missing or placeholder.`);
  }
  return { url: config.url, key: config.serviceRoleKey };
}

export async function fetchSupabaseRows<T>(path: string, config = getSupabaseServerConfig()): Promise<T[]> {
  const { url, key } = requireRestConfig(config);
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

export async function fetchSupabaseAuthUsers<T>(config = getSupabaseServerConfig()): Promise<T[]> {
  const { url, key } = requireServiceRoleConfig(config);
  const response = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1000`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Supabase Auth users failed with ${response.status}${text ? `: ${text}` : ''}`);
  }

  const payload = await response.json() as { users?: T[] } | T[];
  return Array.isArray(payload) ? payload : payload.users ?? [];
}

export async function insertSupabaseRow<T>(table: string, payload: Record<string, unknown>, config = getSupabaseServerConfig()): Promise<SupabaseMutationResult<T>> {
  try {
    const { url, key } = requireServiceRoleConfig(config);
    const response = await fetch(`${url}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`${table} insert failed with ${response.status}${text ? `: ${text}` : ''}`);
    }
    const rows = await response.json() as T[];
    return { data: rows[0] ?? null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : `${table} insert failed.` };
  }
}

export async function patchSupabaseRows<T>(table: string, query: string, payload: Record<string, unknown>, config = getSupabaseServerConfig()): Promise<SupabaseMutationResult<T[]>> {
  try {
    const { url, key } = requireServiceRoleConfig(config);
    const response = await fetch(`${url}/rest/v1/${table}?${query}`, {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`${table} update failed with ${response.status}${text ? `: ${text}` : ''}`);
    }
    return { data: await response.json() as T[] };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : `${table} update failed.` };
  }
}

