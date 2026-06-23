import type { ConsoleId, OrganizationRole, PlatformRole } from '../_types/domain';

export type ConsoleSessionRole = PlatformRole | OrganizationRole;

export type ConsolePermissionSubject = {
  role: ConsoleSessionRole;
  organizationId: ConsoleId | null;
};

export const PLATFORM_ROLES: ConsoleSessionRole[] = ['super_admin', 'platform_admin', 'support'];
export const ORGANIZATION_ROLES: ConsoleSessionRole[] = ['wellness_admin', 'staff', 'trainer', 'member'];

export function normalizeConsoleRole(value?: string | null): ConsoleSessionRole {
  if (value === 'platform_super_admin') return 'super_admin';
  if (value && [...PLATFORM_ROLES, ...ORGANIZATION_ROLES].includes(value as ConsoleSessionRole)) {
    return value as ConsoleSessionRole;
  }
  return 'super_admin';
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

export function canAccessPlatformConsole(subject: ConsolePermissionSubject) {
  return subject.role === 'super_admin' || subject.role === 'platform_admin' || subject.role === 'support';
}

export function canAccessSportsCenterConsole(subject: ConsolePermissionSubject) {
  return canAccessPlatformConsole(subject) || subject.role === 'wellness_admin' || subject.role === 'staff' || subject.role === 'trainer';
}

export function canManageOrganization(subject: ConsolePermissionSubject, organizationId: ConsoleId) {
  if (canAccessPlatformConsole(subject)) return true;
  return Boolean(subject.organizationId && subject.organizationId === organizationId && subject.role === 'wellness_admin');
}
