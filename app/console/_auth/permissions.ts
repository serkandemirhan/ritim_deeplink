import 'server-only';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { environmentFromHost } from '../../_lib/environmentCore';
import type { ConsoleId, OrganizationRole, PlatformRole } from '../_types/domain';

export type ConsoleSessionRole = PlatformRole | OrganizationRole;

export type ConsoleSession = {
  userId: ConsoleId;
  email: string;
  role: ConsoleSessionRole;
  organizationId: ConsoleId | null;
  source: 'development_fallback' | 'basic_auth' | 'header_override';
};

const PLATFORM_ROLES: ConsoleSessionRole[] = ['super_admin', 'platform_admin', 'support'];
const ORGANIZATION_ROLES: ConsoleSessionRole[] = ['wellness_admin', 'staff', 'trainer', 'member'];

function normalizeRole(value?: string | null): ConsoleSessionRole {
  if (value === 'platform_super_admin') return 'super_admin';
  if (value && [...PLATFORM_ROLES, ...ORGANIZATION_ROLES].includes(value as ConsoleSessionRole)) {
    return value as ConsoleSessionRole;
  }
  return 'super_admin';
}

function canUseHeaderOverride(host?: string | null) {
  return environmentFromHost(host) !== 'production';
}

export function isPlatformRole(role: ConsoleSessionRole) {
  return PLATFORM_ROLES.includes(role);
}

export function isSuperAdminRole(role: ConsoleSessionRole) {
  return role === 'super_admin';
}

export function isWellnessAdminRole(role: ConsoleSessionRole) {
  return role === 'wellness_admin';
}

export function canAccessPlatformConsole(session: ConsoleSession) {
  return session.role === 'super_admin' || session.role === 'platform_admin' || session.role === 'support';
}

export function canAccessSportsCenterConsole(session: ConsoleSession) {
  return canAccessPlatformConsole(session) || session.role === 'wellness_admin' || session.role === 'staff' || session.role === 'trainer';
}

export function canManageOrganization(session: ConsoleSession, organizationId: ConsoleId) {
  if (canAccessPlatformConsole(session)) return true;
  return Boolean(session.organizationId && session.organizationId === organizationId && session.role === 'wellness_admin');
}

export async function getConsoleSession(): Promise<ConsoleSession> {
  const headerList = await headers();
  const host = headerList.get('host');
  const environment = environmentFromHost(host);
  const headerRole = canUseHeaderOverride(host) ? headerList.get('x-ritim-console-role') : null;
  const role = normalizeRole(headerRole ?? process.env.CONSOLE_DEV_ROLE);
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
