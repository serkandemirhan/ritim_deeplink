import 'server-only';

import type { ConsoleId } from '../_types/domain';
import {
  activityLogs as mockActivityLogs,
  auditLogs as mockAuditLogs,
  getPlatformUsers,
  getSubscription,
  joinRequests as mockJoinRequests,
  nfcCards as mockNfcCards,
  sportsCenters as mockSportsCenters,
  staffMembers as mockStaffMembers,
} from './mockConsoleData';
import {
  listActivityLogs,
  listAuditLogs,
  listJoinRequests,
  listMembers,
  listNfcCards,
  listOrganizations,
  listOrganizationSubscriptions,
  listStaff,
} from './consoleRepository';

export type ConsoleDataSource = 'supabase' | 'mock';

export type OrganizationConsoleSummary = {
  id: string;
  name: string;
  slug: string;
  type: string;
  contactEmail: string;
  status: string;
  city: string;
  country: string;
  planCode: string;
  subscriptionStatus: string;
  subscriptionProvider: string;
  maxMembers: number | null;
  maxNfcCards: number | null;
  membersCount: number;
  nfcCardsCount: number;
  createdAt: string;
  lastActivityAt: string;
};

type PlatformDashboardData = {
  source: ConsoleDataSource;
  error?: string;
  organizations: OrganizationConsoleSummary[];
  usersCount: number;
  platformAdminsCount: number;
  staffCount: number;
  personalProUsersCount: number;
  pendingUsersCount: number;
  pendingJoinRequestsCount: number;
  scannedTodayCount: number;
  recentActivityLogsCount: number;
  auditLogsCount: number;
};

type OrganizationDashboardData = {
  source: ConsoleDataSource;
  error?: string;
  organization: OrganizationConsoleSummary;
  pendingJoinRequestsCount: number;
  assignedCardsCount: number;
  unassignedCardsCount: number;
  activityLogsCount: number;
  todayActivityLogsCount: number;
  staffCount: number;
  activeMembersCount: number;
};

function todayPrefix() {
  return new Date().toISOString().slice(0, 10);
}

function mockOrganizationSummary(center: (typeof mockSportsCenters)[number]): OrganizationConsoleSummary {
  const subscription = getSubscription(center.id);
  return {
    id: center.id,
    name: center.name,
    slug: center.slug,
    type: 'gym',
    contactEmail: center.ownerEmail,
    status: center.status,
    city: center.city,
    country: center.country,
    planCode: subscription?.planCode ?? center.planCode,
    subscriptionStatus: subscription?.status ?? center.status,
    subscriptionProvider: subscription?.provider ?? 'manual',
    maxMembers: subscription?.maxMembers ?? null,
    maxNfcCards: subscription?.maxNfcCards ?? null,
    membersCount: center.membersCount,
    nfcCardsCount: center.nfcCardsCount,
    createdAt: center.createdAt,
    lastActivityAt: center.lastActivityAt,
  };
}

export async function getPlatformDashboardData(): Promise<PlatformDashboardData> {
  const [organizationsResult, membersResult, cardsResult, requestsResult, logsResult, subscriptionsResult, auditResult, usersResult] = await Promise.all([
    listOrganizations(),
    listMembers(),
    listNfcCards(),
    listJoinRequests(),
    listActivityLogs(),
    listOrganizationSubscriptions(),
    listAuditLogs(),
    getPlatformUsers(),
  ]);

  const error = organizationsResult.error
    ?? membersResult.error
    ?? cardsResult.error
    ?? requestsResult.error
    ?? logsResult.error
    ?? subscriptionsResult.error
    ?? auditResult.error
    ?? usersResult.error;

  if (!organizationsResult.data.length) {
    const users = usersResult.users;
    return {
      source: 'mock',
      error,
      organizations: mockSportsCenters.map(mockOrganizationSummary),
      usersCount: users.length,
      platformAdminsCount: users.filter((user) => user.platformRole !== 'user').length,
      staffCount: users.filter((user) => user.sportsCenterRole && user.sportsCenterRole !== 'member').length,
      personalProUsersCount: users.filter((user) => user.personalPlan === 'personal_pro').length,
      pendingUsersCount: users.filter((user) => user.status === 'pending' || user.status === 'invited').length,
      pendingJoinRequestsCount: mockJoinRequests.filter((request) => request.status === 'pending').length,
      scannedTodayCount: mockNfcCards.filter((card) => card.lastScannedAt?.startsWith(todayPrefix())).length,
      recentActivityLogsCount: mockActivityLogs.length,
      auditLogsCount: mockAuditLogs.length,
    };
  }

  const membersByOrganization = new Map<string, number>();
  membersResult.data.forEach((member) => {
    membersByOrganization.set(member.organizationId, (membersByOrganization.get(member.organizationId) ?? 0) + 1);
  });

  const cardsByOrganization = new Map<string, number>();
  cardsResult.data.forEach((card) => {
    if (card.organizationId) cardsByOrganization.set(card.organizationId, (cardsByOrganization.get(card.organizationId) ?? 0) + 1);
  });

  const latestActivityByOrganization = new Map<string, string>();
  logsResult.data.forEach((log) => {
    if (!log.organizationId) return;
    const existing = latestActivityByOrganization.get(log.organizationId);
    if (!existing || log.createdAt > existing) latestActivityByOrganization.set(log.organizationId, log.createdAt);
  });

  const subscriptionByOrganization = new Map(subscriptionsResult.data.map((subscription) => [subscription.organizationId, subscription]));
  const users = usersResult.users;

  return {
    source: 'supabase',
    error,
    organizations: organizationsResult.data.map((organization) => {
      const subscription = subscriptionByOrganization.get(organization.id);
      return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        type: organization.type,
        contactEmail: organization.contactEmail,
        status: organization.status,
        city: organization.city,
        country: organization.country,
        planCode: subscription?.planCode ?? organization.subscriptionPlanId ?? '-',
        subscriptionStatus: subscription?.status ?? organization.status,
        subscriptionProvider: subscription?.provider ?? 'manual',
        maxMembers: subscription?.memberLimitOverride ?? organization.memberLimit ?? null,
        maxNfcCards: subscription?.nfcCardLimitOverride ?? organization.nfcCardLimit ?? null,
        membersCount: membersByOrganization.get(organization.id) ?? 0,
        nfcCardsCount: cardsByOrganization.get(organization.id) ?? 0,
        createdAt: organization.createdAt,
        lastActivityAt: latestActivityByOrganization.get(organization.id) ?? organization.updatedAt,
      };
    }),
    usersCount: users.length,
    platformAdminsCount: users.filter((user) => user.platformRole !== 'user').length,
    staffCount: users.filter((user) => user.sportsCenterRole && user.sportsCenterRole !== 'member').length,
    personalProUsersCount: users.filter((user) => user.personalPlan === 'personal_pro').length,
    pendingUsersCount: users.filter((user) => user.status === 'pending' || user.status === 'invited').length,
    pendingJoinRequestsCount: requestsResult.data.filter((request) => request.status === 'pending').length,
    scannedTodayCount: cardsResult.data.filter((card) => card.lastScannedAt?.startsWith(todayPrefix())).length,
    recentActivityLogsCount: logsResult.data.length,
    auditLogsCount: auditResult.data.length,
  };
}

export async function getOrganizationDashboardData(organizationId: ConsoleId): Promise<OrganizationDashboardData> {
  const [platformData, requestsResult, cardsResult, logsResult, staffResult, membersResult] = await Promise.all([
    getPlatformDashboardData(),
    listJoinRequests(organizationId),
    listNfcCards(organizationId),
    listActivityLogs(organizationId),
    listStaff(organizationId),
    listMembers(organizationId),
  ]);
  const organization = platformData.organizations.find((item) => item.id === organizationId)
    ?? mockOrganizationSummary(mockSportsCenters.find((center) => center.id === organizationId) ?? mockSportsCenters[0]);

  if (platformData.source === 'mock') {
    const centerRequests = mockJoinRequests.filter((request) => request.sportsCenterId === organizationId);
    const centerCards = mockNfcCards.filter((card) => card.sportsCenterId === organizationId);
    const centerLogs = mockActivityLogs.filter((log) => log.sportsCenterId === organizationId);
    return {
      source: 'mock',
      error: platformData.error,
      organization,
      pendingJoinRequestsCount: centerRequests.filter((request) => request.status === 'pending').length,
      assignedCardsCount: centerCards.filter((card) => card.status === 'assigned').length,
      unassignedCardsCount: centerCards.filter((card) => card.status === 'unassigned').length,
      activityLogsCount: centerLogs.length,
      todayActivityLogsCount: centerLogs.filter((log) => log.createdAt.startsWith(todayPrefix())).length,
      staffCount: mockStaffMembers.filter((staff) => staff.sportsCenterId === organizationId).length,
      activeMembersCount: organization.membersCount,
    };
  }

  return {
    source: 'supabase',
    error: platformData.error ?? requestsResult.error ?? cardsResult.error ?? logsResult.error ?? staffResult.error ?? membersResult.error,
    organization,
    pendingJoinRequestsCount: requestsResult.data.filter((request) => request.status === 'pending').length,
    assignedCardsCount: cardsResult.data.filter((card) => card.status === 'assigned' || card.assignedMemberId).length,
    unassignedCardsCount: cardsResult.data.filter((card) => card.status === 'unassigned').length,
    activityLogsCount: logsResult.data.length,
    todayActivityLogsCount: logsResult.data.filter((log) => log.createdAt.startsWith(todayPrefix())).length,
    staffCount: staffResult.data.length,
    activeMembersCount: membersResult.data.filter((member) => member.status === 'active').length,
  };
}
