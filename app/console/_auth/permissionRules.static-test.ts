import {
  canAccessPlatformConsole,
  canAccessSportsCenterConsole,
  canManageOrganization,
  normalizeConsoleRole,
  type ConsolePermissionSubject,
} from './permissionRules';

type PermissionCase = {
  name: string;
  subject: ConsolePermissionSubject;
  expected: {
    platform: boolean;
    sportsCenter: boolean;
    manageOwnOrganization: boolean;
    manageOtherOrganization: boolean;
  };
};

const cases: PermissionCase[] = [
  {
    name: 'super admin can access all console scopes',
    subject: { role: 'super_admin', organizationId: null },
    expected: { platform: true, sportsCenter: true, manageOwnOrganization: true, manageOtherOrganization: true },
  },
  {
    name: 'platform admin can access all organization scopes',
    subject: { role: 'platform_admin', organizationId: null },
    expected: { platform: true, sportsCenter: true, manageOwnOrganization: true, manageOtherOrganization: true },
  },
  {
    name: 'support can view platform and organization scopes',
    subject: { role: 'support', organizationId: null },
    expected: { platform: true, sportsCenter: true, manageOwnOrganization: true, manageOtherOrganization: true },
  },
  {
    name: 'wellness admin can manage own organization only',
    subject: { role: 'wellness_admin', organizationId: 'org-a' },
    expected: { platform: false, sportsCenter: true, manageOwnOrganization: true, manageOtherOrganization: false },
  },
  {
    name: 'staff can access sports center but cannot manage organization settings',
    subject: { role: 'staff', organizationId: 'org-a' },
    expected: { platform: false, sportsCenter: true, manageOwnOrganization: false, manageOtherOrganization: false },
  },
  {
    name: 'member cannot access console scopes',
    subject: { role: 'member', organizationId: 'org-a' },
    expected: { platform: false, sportsCenter: false, manageOwnOrganization: false, manageOtherOrganization: false },
  },
];

function assertEqual(actual: boolean, expected: boolean, name: string) {
  if (actual !== expected) {
    throw new Error(`Permission static test failed: ${name}. Expected ${expected}, received ${actual}.`);
  }
}

cases.forEach((testCase) => {
  assertEqual(canAccessPlatformConsole(testCase.subject), testCase.expected.platform, `${testCase.name} platform`);
  assertEqual(canAccessSportsCenterConsole(testCase.subject), testCase.expected.sportsCenter, `${testCase.name} sports center`);
  assertEqual(canManageOrganization(testCase.subject, 'org-a'), testCase.expected.manageOwnOrganization, `${testCase.name} own organization`);
  assertEqual(canManageOrganization(testCase.subject, 'org-b'), testCase.expected.manageOtherOrganization, `${testCase.name} other organization`);
});

if (normalizeConsoleRole('platform_super_admin') !== 'super_admin') {
  throw new Error('Permission static test failed: platform_super_admin normalization.');
}

export const permissionStaticTestCases = cases;
