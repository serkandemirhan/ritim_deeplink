import 'server-only';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { environmentFromHost } from '../../_lib/environmentCore';
import type { ConsoleId } from '../_types/domain';
import {
  canAccessPlatformConsole,
  canAccessSportsCenterConsole,
  canManageOrganization,
  isPlatformRole,
  isSuperAdminRole,
  isWellnessAdminRole,
  normalizeConsoleRole,
  type ConsoleSessionRole,
} from './permissionRules';

export {
  canAccessPlatformConsole,
  canAccessSportsCenterConsole,
  canManageOrganization,
  isPlatformRole,
  isSuperAdminRole,
  isWellnessAdminRole,
};
export type { ConsoleSessionRole };

export type ConsoleSession = {
  userId: ConsoleId;
  email: string;
  role: ConsoleSessionRole;
  organizationId: ConsoleId | null;
  source: 'development_fallback' | 'basic_auth' | 'header_override';
};

function canUseHeaderOverride(host?: string | null) {
  return environmentFromHost(host) !== 'production';
}

export async function getConsoleSession(): Promise<ConsoleSession> {
  const headerList = await headers();
  const host = headerList.get('host');
  const environment = environmentFromHost(host);
  const headerRole = canUseHeaderOverride(host) ? headerList.get('x-ritim-console-role') : null;
  const role = normalizeConsoleRole(headerRole ?? process.env.CONSOLE_DEV_ROLE);
  const organizationId = process.env.CONSOLE_DEV_ORGANIZATION_ID ?? 'sc-lyon-fit';
  const basicAuthUser = process.env.CONSOLE_BASIC_AUTH_USER;

  return {
    userId: process.env.CONSOLE_DEV_USER_ID ?? 'console-dev-user',
    email: process.env.CONSOLE_DEV_USER_EMAIL ?? basicAuthUser ?? 'console@ritim.local',
    role,
    organizationId: role === 'super_admin' || role === 'platform_admin' || role === 'support' ? null : organizationId,
    source: headerRole ? 'header_override' : environment === 'production' ? 'basic_auth' : 'development_fallback',
  };
}

export async function requireSuperAdmin() {
  const session = await getConsoleSession();
  if (!canAccessPlatformConsole(session)) {
    redirect('/console/sports-center');
  }
  return session;
}

export async function requireWellnessAdmin() {
  const session = await getConsoleSession();
  if (!canAccessSportsCenterConsole(session)) {
    redirect('/console/platform');
  }
  return session;
}

export async function requireOrganizationAccess(organizationId: ConsoleId) {
  const session = await getConsoleSession();
  if (!canManageOrganization(session, organizationId)) {
    redirect(canAccessPlatformConsole(session) ? '/console/platform' : '/console/sports-center');
  }
  return session;
}
