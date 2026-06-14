export type RitimEnvironment = 'development' | 'staging' | 'production';

const DOMAIN_ENV_MAP: Record<string, RitimEnvironment> = {
  'getritim.com': 'production',
  'www.getritim.com': 'production',
  'dev.getritim.com': 'development',
  'staging.getritim.com': 'staging',
};

function normalizeHost(host?: string | null) {
  const rawHost = (host || '').toLowerCase();
  if (rawHost.startsWith('[')) return rawHost.slice(1).split(']')[0];
  return rawHost.split(':')[0];
}

function normalizeEnvironment(value?: string | null): RitimEnvironment | null {
  if (value === 'production' || value === 'staging' || value === 'development') return value;
  if (value === 'prod') return 'production';
  if (value === 'dev') return 'development';
  return null;
}

export function environmentFromHost(host?: string | null): RitimEnvironment {
  const normalized = normalizeHost(host);
  const isLocalhost = normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';

  return normalizeEnvironment(process.env.NEXT_PUBLIC_ENVIRONMENT)
    ?? DOMAIN_ENV_MAP[normalized]
    ?? (normalized.includes('staging') ? 'staging' : normalized.includes('dev') || isLocalhost || normalized.includes('vercel.app') ? 'development' : 'production');
}

export function getPublicAppUrl(environment: RitimEnvironment) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  if (environment === 'development') return 'https://dev.getritim.com';
  if (environment === 'staging') return 'https://staging.getritim.com';
  return 'https://getritim.com';
}

export function getDeeplinkDomain(environment: RitimEnvironment) {
  if (process.env.NEXT_PUBLIC_DEEPLINK_DOMAIN) return process.env.NEXT_PUBLIC_DEEPLINK_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (environment === 'development') return 'dev.getritim.com';
  if (environment === 'staging') return 'staging.getritim.com';
  return 'getritim.com';
}

export function getNfcUrl(tagCode: string, environment: RitimEnvironment) {
  return `https://${getDeeplinkDomain(environment)}/t/${encodeURIComponent(tagCode)}`;
}

export function environmentLabel(environment: RitimEnvironment) {
  if (environment === 'development') return 'DEV';
  if (environment === 'staging') return 'STAGING';
  return null;
}
