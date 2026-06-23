import 'server-only';

import type {
  ActivityLibraryItem,
  ActivityLog,
  AuditLog,
  ConsoleId,
  ConsoleUser,
  JoinRequest,
  NfcCard,
  Organization,
  OrganizationMember,
  OrganizationSubscription,
  Rhythm,
  SubscriptionPlan,
  SystemSettings,
} from '../_types/domain';
import type { JoinStatus, PlatformRole, PlatformUser, PlanCode, StaffRole } from './mockConsoleData';
import { fetchSupabaseAuthUsers, fetchSupabaseRows, insertSupabaseRow, patchSupabaseRows } from './supabaseServer';

export type DataSource = 'supabase';

export type DataResult<T> = {
  data: T;
  source: DataSource;
  error?: string;
};

type SupabaseProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type SupabaseTenant = {
  id: string;
  name: string;
  slug?: string | null;
  type?: string | null;
  logo_url?: string | null;
  contact_email?: string | null;
  phone_number?: string | null;
  address?: string | null;
  country?: string | null;
  city?: string | null;
  timezone?: string | null;
  status?: string | null;
  subscription_plan_id?: string | null;
  member_limit?: number | null;
  nfc_card_limit?: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type SupabaseTenantMember = {
  id?: string;
  tenant_id: string;
  user_id: string;
  role: 'tenant_owner' | 'tenant_admin' | 'trainer' | 'member';
  status?: string | null;
  joined_at?: string | null;
  join_request_id?: string | null;
  created_by?: string | null;
  created_at: string | null;
  updated_at?: string | null;
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

type SupabaseJoinRequest = {
  id: string;
  user_id: string;
  tenant_id: string;
  source: string;
  nfc_card_id?: string | null;
  status: string;
  requested_at: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type SupabaseNfcCard = {
  id: string;
  tenant_id: string;
  tag_id?: string | null;
  uid_hash: string;
  card_name: string;
  label?: string | null;
  owner_user_id?: string | null;
  assigned_member_id?: string | null;
  public_code?: string | null;
  category: string;
  status: string;
  deleted_at?: string | null;
  last_scanned_at?: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type SupabaseCardAssignment = {
  id: string;
  tenant_id: string;
  tenant_card_id: string;
  activity_type_id: string;
  increment_value: number;
  unit: string;
  daily_goal?: number | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type SupabaseActivityType = {
  id: string;
  tenant_id?: string | null;
  category: string;
  name: string;
  display_name_tr?: string | null;
  display_name_en?: string | null;
  unit: string;
  default_increment: number;
  icon?: string | null;
  color?: string | null;
  description?: string | null;
  is_global?: boolean | null;
  is_active?: boolean | null;
  is_custom?: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type SupabaseActivityLog = {
  id: string;
  tenant_id: string;
  user_id: string;
  tenant_card_id?: string | null;
  activity_type_id: string;
  category: string;
  value: number;
  unit: string;
  source: string;
  logged_at: string | null;
  created_at: string | null;
  created_by?: string | null;
  note?: string | null;
};

type SupabaseRoutine = {
  id: string;
  tenant_id?: string | null;
  activity_type_id?: string | null;
  created_by?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  unit?: string | null;
  goal_type?: string | null;
  default_target?: number | null;
  frequency?: string | null;
  default_scan_amount?: number | null;
  is_template?: boolean | null;
  is_active?: boolean | null;
  status?: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type SupabaseSubscriptionPlan = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  member_limit?: number | null;
  nfc_card_limit: number;
  wellness_admin_limit?: number | null;
  report_level?: string | null;
  support_level?: string | null;
  status?: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type SupabaseOrganizationSubscription = {
  id: string;
  tenant_id: string;
  plan_id: string;
  plan_code: string;
  status: string;
  provider: string;
  provider_customer_id?: string | null;
  provider_subscription_id?: string | null;
  member_limit_override?: number | null;
  nfc_card_limit_override?: number | null;
  current_period_end?: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type SupabaseAuditLog = {
  id: string;
  actor_user_id: string;
  actor_role: string;
  tenant_id?: string | null;
  action_type: string;
  target_entity_type: string;
  target_entity_id: string;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  status: string;
  created_at: string | null;
};

type SupabaseSystemSettings = {
  id: string;
  app_name: string;
  support_email: string;
  default_language: string;
  available_languages?: string[] | null;
  default_subscription_plan_id?: string | null;
  maintenance_mode: boolean;
  feature_flags?: Record<string, boolean> | null;
  global_activity_categories?: string[] | null;
  global_nfc_card_settings?: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
};

const source = 'supabase' as const;

function emptyResult<T>(data: T, error?: string): DataResult<T> {
  return { data, source, error };
}

function getText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function fallbackDate(value?: string | null) {
  return value ?? new Date(0).toISOString();
}

function uuidOrNull(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

function mapTenantType(value?: string | null): Organization['type'] {
  if (value === 'gym') return 'gym';
  if (value === 'company') return 'company';
  if (value === 'wellness_studio') return 'wellness_center';
  return 'wellness_center';
}

function mapOrganizationStatus(value?: string | null): Organization['status'] {
  if (value === 'inactive' || value === 'suspended' || value === 'archived') return value;
  return 'active';
}

function mapUserStatus(value?: string | null): ConsoleUser['status'] {
  if (value === 'inactive' || value === 'pending' || value === 'invited' || value === 'blocked' || value === 'archived') return value;
  return 'active';
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
  if (metadataRole === 'platform_super_admin' || metadataRole === 'super_admin') return 'platform_super_admin';
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

function mapOrganization(row: SupabaseTenant): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? row.name.toLowerCase().replace(/\s+/g, '-'),
    type: mapTenantType(row.type),
    logoUrl: row.logo_url ?? null,
    contactEmail: row.contact_email ?? '',
    phoneNumber: row.phone_number ?? null,
    address: row.address ?? null,
    country: row.country ?? '',
    city: row.city ?? '',
    timezone: row.timezone ?? 'Europe/Istanbul',
    status: mapOrganizationStatus(row.status),
    subscriptionPlanId: row.subscription_plan_id ?? null,
    memberLimit: row.member_limit ?? null,
    nfcCardLimit: row.nfc_card_limit ?? null,
    createdAt: fallbackDate(row.created_at),
    updatedAt: fallbackDate(row.updated_at ?? row.created_at),
  };
}

function mapOrganizationMember(row: SupabaseTenantMember): OrganizationMember {
  return {
    id: row.id ?? `${row.tenant_id}-${row.user_id}`,
    organizationId: row.tenant_id,
    userId: row.user_id,
    status: mapUserStatus(row.status),
    joinedAt: row.joined_at ?? row.created_at ?? null,
    joinRequestId: row.join_request_id ?? null,
    createdBy: row.created_by ?? null,
    createdAt: fallbackDate(row.created_at),
    updatedAt: fallbackDate(row.updated_at ?? row.created_at),
  };
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
    status: mapUserStatus(membership?.status) as JoinStatus,
    personalPlan: mapPersonalPlan(authUser),
    joinSource: membership ? 'manual_admin' : null,
    lastSeenAt: authUser?.last_sign_in_at ?? profile?.updated_at ?? authUser?.updated_at ?? profile?.created_at ?? '-',
    createdAt: membership?.created_at ?? profile?.created_at ?? authUser?.created_at ?? '-',
  };
}

function mapJoinRequest(row: SupabaseJoinRequest): JoinRequest {
  return {
    id: row.id,
    organizationId: row.tenant_id,
    userId: row.user_id,
    source: row.source === 'nfc_card' ? 'nfc' : row.source === 'qr_code' ? 'qr' : row.source as JoinRequest['source'],
    nfcCardId: row.nfc_card_id ?? null,
    status: row.status === 'approved' || row.status === 'rejected' ? row.status : 'pending',
    requestedAt: fallbackDate(row.requested_at ?? row.created_at),
    reviewedBy: row.reviewed_by ?? null,
    reviewedAt: row.reviewed_at ?? null,
    createdAt: fallbackDate(row.created_at),
    updatedAt: fallbackDate(row.updated_at ?? row.created_at),
  };
}

function mapNfcCard(row: SupabaseNfcCard, assignment?: SupabaseCardAssignment): NfcCard {
  return {
    id: row.id,
    ownerType: 'organization',
    organizationId: row.tenant_id,
    ownerUserId: null,
    assignedMemberId: row.assigned_member_id ?? null,
    uidHash: row.uid_hash,
    publicCode: row.public_code ?? row.uid_hash,
    label: row.label ?? row.card_name,
    activityTypeId: assignment?.activity_type_id ?? null,
    defaultAmount: assignment?.increment_value ?? null,
    unit: assignment?.unit ?? null,
    status: row.status === 'disabled' ? 'inactive' : row.status === 'active' ? 'active' : row.status as NfcCard['status'],
    lastScannedAt: row.last_scanned_at ?? null,
    createdAt: fallbackDate(row.created_at),
    updatedAt: fallbackDate(row.updated_at ?? row.created_at),
  };
}

function mapActivityLibraryItem(row: SupabaseActivityType): ActivityLibraryItem {
  return {
    id: row.id,
    organizationId: row.tenant_id ?? null,
    name: row.display_name_en ?? row.display_name_tr ?? row.name,
    category: row.category === 'fitness' ? 'exercise' : row.category === 'wellness' ? 'wellness' : 'custom',
    unit: row.unit,
    icon: row.icon ?? null,
    defaultAmount: Number(row.default_increment) || 1,
    description: row.description ?? null,
    isGlobal: Boolean(row.is_global),
    status: row.is_active === false ? 'inactive' : 'active',
    createdAt: fallbackDate(row.created_at),
    updatedAt: fallbackDate(row.updated_at ?? row.created_at),
  };
}

function mapActivityLog(row: SupabaseActivityLog): ActivityLog {
  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.tenant_id,
    rhythmId: row.activity_type_id,
    nfcCardId: row.tenant_card_id ?? null,
    activityType: row.category,
    amount: Number(row.value) || 0,
    unit: row.unit,
    source: row.source === 'mock_nfc' ? 'nfc' : row.source === 'admin' || row.source === 'import' || row.source === 'manual' ? row.source : 'nfc',
    createdAt: fallbackDate(row.logged_at ?? row.created_at),
    createdBy: row.created_by ?? row.user_id,
    note: row.note ?? null,
  };
}

function mapRhythm(row: SupabaseRoutine): Rhythm {
  return {
    id: row.id,
    organizationId: row.tenant_id ?? null,
    createdBy: row.created_by ?? 'system',
    name: row.name,
    description: row.description ?? null,
    category: row.category === 'wellness' ? 'wellness' : 'exercise',
    unit: row.unit ?? 'custom',
    goalType: row.goal_type === 'decrease' || row.goal_type === 'maintain' || row.goal_type === 'complete' ? row.goal_type : 'increase',
    defaultTarget: Number(row.default_target) || 1,
    frequency: row.frequency === 'weekly' || row.frequency === 'monthly' ? row.frequency : 'daily',
    defaultScanAmount: Number(row.default_scan_amount) || 1,
    isTemplate: Boolean(row.is_template),
    status: row.status === 'archived' ? 'archived' : row.is_active === false ? 'inactive' : 'active',
    activityLibraryItemId: row.activity_type_id ?? null,
    createdAt: fallbackDate(row.created_at),
    updatedAt: fallbackDate(row.updated_at ?? row.created_at),
  };
}

function mapSubscriptionPlan(row: SupabaseSubscriptionPlan): SubscriptionPlan {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? null,
    memberLimit: row.member_limit ?? null,
    nfcCardLimit: row.nfc_card_limit,
    wellnessAdminLimit: row.wellness_admin_limit ?? null,
    reportLevel: row.report_level === 'advanced' ? 'advanced' : 'basic',
    supportLevel: row.support_level === 'priority' ? 'priority' : 'standard',
    status: row.status === 'inactive' || row.status === 'archived' ? row.status : 'active',
    createdAt: fallbackDate(row.created_at),
    updatedAt: fallbackDate(row.updated_at ?? row.created_at),
  };
}

function mapOrganizationSubscription(row: SupabaseOrganizationSubscription): OrganizationSubscription {
  return {
    id: row.id,
    organizationId: row.tenant_id,
    planId: row.plan_id,
    planCode: row.plan_code,
    status: row.status === 'paused' || row.status === 'cancelled' || row.status === 'expired' || row.status === 'trialing' ? row.status : 'active',
    provider: row.provider === 'stripe' || row.provider === 'apple_iap' || row.provider === 'google_play' ? row.provider : 'manual',
    providerCustomerId: row.provider_customer_id ?? null,
    providerSubscriptionId: row.provider_subscription_id ?? null,
    memberLimitOverride: row.member_limit_override ?? null,
    nfcCardLimitOverride: row.nfc_card_limit_override ?? null,
    currentPeriodEnd: row.current_period_end ?? null,
    createdAt: fallbackDate(row.created_at),
    updatedAt: fallbackDate(row.updated_at ?? row.created_at),
  };
}

function mapAuditLog(row: SupabaseAuditLog): AuditLog {
  return {
    id: row.id,
    actorUserId: row.actor_user_id,
    actorRole: row.actor_role as AuditLog['actorRole'],
    organizationId: row.tenant_id ?? null,
    actionType: row.action_type,
    targetEntityType: row.target_entity_type,
    targetEntityId: row.target_entity_id,
    oldValue: row.old_value ?? null,
    newValue: row.new_value ?? null,
    ipAddress: row.ip_address ?? null,
    userAgent: row.user_agent ?? null,
    status: row.status === 'failed' ? 'failed' : 'success',
    createdAt: fallbackDate(row.created_at),
  };
}

function mapSystemSettings(row: SupabaseSystemSettings): SystemSettings {
  return {
    id: row.id,
    appName: row.app_name,
    supportEmail: row.support_email,
    defaultLanguage: row.default_language === 'en' || row.default_language === 'fr' ? row.default_language : 'tr',
    availableLanguages: (row.available_languages ?? ['tr', 'en', 'fr']).filter((language): language is SystemSettings['availableLanguages'][number] => (
      language === 'tr' || language === 'en' || language === 'fr'
    )),
    defaultSubscriptionPlanId: row.default_subscription_plan_id ?? null,
    maintenanceMode: row.maintenance_mode,
    featureFlags: row.feature_flags ?? {},
    globalActivityCategories: (row.global_activity_categories ?? []).filter((category): category is SystemSettings['globalActivityCategories'][number] => (
      category === 'exercise'
      || category === 'wellness'
      || category === 'reading'
      || category === 'nutrition'
      || category === 'learning'
      || category === 'custom'
    )),
    globalNfcCardSettings: row.global_nfc_card_settings ?? {},
    createdAt: fallbackDate(row.created_at),
    updatedAt: fallbackDate(row.updated_at ?? row.created_at),
  };
}

async function safeRows<T>(path: string) {
  try {
    return { rows: await fetchSupabaseRows<T>(path) };
  } catch (error) {
    return { rows: [] as T[], error: error instanceof Error ? error.message : `${path} could not be loaded.` };
  }
}

export async function listOrganizations(): Promise<DataResult<Organization[]>> {
  const result = await safeRows<SupabaseTenant>('tenants?select=*&order=created_at.desc');
  return emptyResult(result.rows.map(mapOrganization), result.error);
}

export async function getOrganizationById(organizationId: ConsoleId): Promise<DataResult<Organization | null>> {
  const result = await safeRows<SupabaseTenant>(`tenants?select=*&id=eq.${encodeURIComponent(organizationId)}&limit=1`);
  return emptyResult(result.rows[0] ? mapOrganization(result.rows[0]) : null, result.error);
}

export async function listConsoleUsers(): Promise<DataResult<PlatformUser[]>> {
  try {
    const [profiles, memberships, tenants, authUsers] = await Promise.all([
      fetchSupabaseRows<SupabaseProfile>('profiles?select=id,full_name,email,created_at,updated_at&order=created_at.desc'),
      fetchSupabaseRows<SupabaseTenantMember>('tenant_members?select=*'),
      fetchSupabaseRows<SupabaseTenant>('tenants?select=id,name,type'),
      fetchSupabaseAuthUsers<SupabaseAuthUser>(),
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
    return emptyResult(users);
  } catch (error) {
    return emptyResult([], error instanceof Error ? error.message : 'Supabase users could not be loaded.');
  }
}

export async function listMembers(organizationId?: ConsoleId): Promise<DataResult<OrganizationMember[]>> {
  const query = organizationId ? `tenant_members?select=*&tenant_id=eq.${encodeURIComponent(organizationId)}` : 'tenant_members?select=*';
  const result = await safeRows<SupabaseTenantMember>(query);
  return emptyResult(result.rows.map(mapOrganizationMember), result.error);
}

export async function listStaff(organizationId?: ConsoleId): Promise<DataResult<OrganizationMember[]>> {
  const query = organizationId ? `tenant_members?select=*&tenant_id=eq.${encodeURIComponent(organizationId)}` : 'tenant_members?select=*';
  const result = await safeRows<SupabaseTenantMember>(query);
  return emptyResult(
    result.rows.filter((member) => member.role !== 'member').map(mapOrganizationMember),
    result.error
  );
}

export async function listJoinRequests(organizationId?: ConsoleId): Promise<DataResult<JoinRequest[]>> {
  const filter = organizationId ? `&tenant_id=eq.${encodeURIComponent(organizationId)}` : '';
  const result = await safeRows<SupabaseJoinRequest>(`join_requests?select=*&order=requested_at.desc${filter}`);
  return emptyResult(result.rows.map(mapJoinRequest), result.error);
}

export async function listNfcCards(organizationId?: ConsoleId): Promise<DataResult<NfcCard[]>> {
  const filter = organizationId ? `&tenant_id=eq.${encodeURIComponent(organizationId)}` : '';
  const [cardsResult, assignmentsResult] = await Promise.all([
    safeRows<SupabaseNfcCard>(`tenant_nfc_cards?select=*&deleted_at=is.null${filter}`),
    safeRows<SupabaseCardAssignment>(`card_assignments?select=*&is_active=eq.true${filter}`),
  ]);
  const assignmentsByCardId = new Map(assignmentsResult.rows.map((assignment) => [assignment.tenant_card_id, assignment]));
  return emptyResult(
    cardsResult.rows.map((card) => mapNfcCard(card, assignmentsByCardId.get(card.id))),
    cardsResult.error ?? assignmentsResult.error
  );
}

export async function listRhythms(organizationId?: ConsoleId): Promise<DataResult<Rhythm[]>> {
  const filter = organizationId ? `&tenant_id=eq.${encodeURIComponent(organizationId)}` : '';
  const result = await safeRows<SupabaseRoutine>(`routines?select=*&order=created_at.desc${filter}`);
  return emptyResult(result.rows.map(mapRhythm), result.error);
}

export async function listActivityLibraryItems(organizationId?: ConsoleId): Promise<DataResult<ActivityLibraryItem[]>> {
  const filter = organizationId ? `&tenant_id=eq.${encodeURIComponent(organizationId)}` : '';
  const result = await safeRows<SupabaseActivityType>(`activity_types?select=*&order=category.asc,name.asc${filter}`);
  return emptyResult(result.rows.map(mapActivityLibraryItem), result.error);
}

export async function listActivityLogs(organizationId?: ConsoleId): Promise<DataResult<ActivityLog[]>> {
  const filter = organizationId ? `&tenant_id=eq.${encodeURIComponent(organizationId)}` : '';
  const result = await safeRows<SupabaseActivityLog>(`activity_logs?select=*&order=logged_at.desc${filter}`);
  return emptyResult(result.rows.map(mapActivityLog), result.error);
}

export async function listSubscriptionPlans(): Promise<DataResult<SubscriptionPlan[]>> {
  const result = await safeRows<SupabaseSubscriptionPlan>('subscription_plans?select=*&order=created_at.desc');
  return emptyResult(result.rows.map(mapSubscriptionPlan), result.error);
}

export async function listOrganizationSubscriptions(organizationId?: ConsoleId): Promise<DataResult<OrganizationSubscription[]>> {
  const filter = organizationId ? `&tenant_id=eq.${encodeURIComponent(organizationId)}` : '';
  const result = await safeRows<SupabaseOrganizationSubscription>(`organization_subscriptions?select=*&order=created_at.desc${filter}`);
  return emptyResult(result.rows.map(mapOrganizationSubscription), result.error);
}

export async function listAuditLogs(organizationId?: ConsoleId): Promise<DataResult<AuditLog[]>> {
  const filter = organizationId ? `&tenant_id=eq.${encodeURIComponent(organizationId)}` : '';
  const result = await safeRows<SupabaseAuditLog>(`audit_logs?select=*&order=created_at.desc${filter}`);
  return emptyResult(result.rows.map(mapAuditLog), result.error);
}

export async function getSystemSettings(): Promise<DataResult<SystemSettings | null>> {
  const result = await safeRows<SupabaseSystemSettings>('system_settings?select=*&id=eq.global&limit=1');
  return emptyResult(result.rows[0] ? mapSystemSettings(result.rows[0]) : null, result.error);
}

export async function upsertSystemSettings(payload: {
  appName: string;
  supportEmail: string;
  defaultLanguage: SystemSettings['defaultLanguage'];
  maintenanceMode: boolean;
  actorUserId: ConsoleId;
  actorRole: string;
}) {
  const existing = await getSystemSettings();
  const rowPayload = {
    app_name: payload.appName,
    support_email: payload.supportEmail,
    default_language: payload.defaultLanguage,
    maintenance_mode: payload.maintenanceMode,
    updated_at: new Date().toISOString(),
  };
  const result = existing.data
    ? await patchSupabaseRows<SupabaseSystemSettings>('system_settings', 'id=eq.global', rowPayload)
    : await insertSupabaseRow<SupabaseSystemSettings>('system_settings', {
      id: 'global',
      ...rowPayload,
    });

  const settingsRow = Array.isArray(result.data) ? result.data[0] : result.data;
  if (settingsRow && !result.error) {
    await writeAuditLog({
      actorUserId: payload.actorUserId,
      actorRole: payload.actorRole,
      actionType: 'system_settings.updated',
      targetEntityType: 'system_settings',
      targetEntityId: 'global',
      oldValue: existing.data as unknown as Record<string, unknown> | null,
      newValue: settingsRow as unknown as Record<string, unknown>,
    });
  }
  return result;
}

export async function createOrganization(payload: {
  name: string;
  slug: string;
  type: Organization['type'];
  contactEmail: string;
  city: string;
  country: string;
  status: Organization['status'];
  memberLimit?: number | null;
  nfcCardLimit?: number | null;
  actorUserId: ConsoleId;
  actorRole: string;
}) {
  const result = await insertSupabaseRow<SupabaseTenant>('tenants', {
    id: `org-${crypto.randomUUID()}`,
    name: payload.name,
    slug: payload.slug,
    type: payload.type === 'wellness_center' ? 'wellness_studio' : payload.type,
    contact_email: payload.contactEmail,
    city: payload.city,
    country: payload.country,
    status: payload.status,
    member_limit: payload.memberLimit ?? null,
    nfc_card_limit: payload.nfcCardLimit ?? null,
  });
  if (result.data && !result.error) {
    await writeAuditLog({
      actorUserId: payload.actorUserId,
      actorRole: payload.actorRole,
      organizationId: result.data.id,
      actionType: 'organization.created',
      targetEntityType: 'tenant',
      targetEntityId: result.data.id,
      newValue: result.data as unknown as Record<string, unknown>,
    });
  }
  return result;
}

export async function updateOrganization(payload: {
  organizationId: ConsoleId;
  name: string;
  slug: string;
  type: Organization['type'];
  contactEmail: string;
  city: string;
  country: string;
  status: Organization['status'];
  memberLimit?: number | null;
  nfcCardLimit?: number | null;
  actorUserId: ConsoleId;
  actorRole: string;
}) {
  const result = await patchSupabaseRows<SupabaseTenant>('tenants', `id=eq.${encodeURIComponent(payload.organizationId)}`, {
    name: payload.name,
    slug: payload.slug,
    type: payload.type === 'wellness_center' ? 'wellness_studio' : payload.type,
    contact_email: payload.contactEmail,
    city: payload.city,
    country: payload.country,
    status: payload.status,
    member_limit: payload.memberLimit ?? null,
    nfc_card_limit: payload.nfcCardLimit ?? null,
    updated_at: new Date().toISOString(),
  });
  if (result.data?.[0] && !result.error) {
    await writeAuditLog({
      actorUserId: payload.actorUserId,
      actorRole: payload.actorRole,
      organizationId: payload.organizationId,
      actionType: 'organization.updated',
      targetEntityType: 'tenant',
      targetEntityId: payload.organizationId,
      newValue: result.data[0] as unknown as Record<string, unknown>,
    });
  }
  return result;
}

export async function createJoinRequest(payload: {
  userId: ConsoleId;
  organizationId: ConsoleId;
  source: JoinRequest['source'];
  nfcCardId?: ConsoleId | null;
  actorUserId?: ConsoleId;
  actorRole?: string;
}) {
  const result = await insertSupabaseRow<SupabaseJoinRequest>('join_requests', {
    user_id: payload.userId,
    tenant_id: payload.organizationId,
    source: payload.source,
    nfc_card_id: payload.nfcCardId ?? null,
    status: 'pending',
  });
  if (result.data && !result.error) {
    await writeAuditLog({
      actorUserId: payload.actorUserId ?? payload.userId,
      actorRole: payload.actorRole ?? 'member',
      organizationId: payload.organizationId,
      actionType: 'join_request.created',
      targetEntityType: 'join_request',
      targetEntityId: result.data.id,
      newValue: result.data as unknown as Record<string, unknown>,
    });
  }
  return result;
}

export async function reviewJoinRequest(payload: {
  requestId: ConsoleId;
  status: 'approved' | 'rejected';
  reviewedBy: ConsoleId;
  actorRole?: string;
}) {
  const existingRequestResult = await safeRows<SupabaseJoinRequest>(`join_requests?select=*&id=eq.${encodeURIComponent(payload.requestId)}&limit=1`);
  const existingRequest = existingRequestResult.rows[0];
  if (payload.status === 'approved' && existingRequest) {
    const [organizationResult, membersResult] = await Promise.all([
      getOrganizationById(existingRequest.tenant_id),
      listMembers(existingRequest.tenant_id),
    ]);
    const memberLimit = organizationResult.data?.memberLimit ?? null;
    if (memberLimit !== null && membersResult.data.length >= memberLimit) {
      return { data: null, error: `Member limit reached for ${existingRequest.tenant_id}.` };
    }
  }

  const result = await patchSupabaseRows<SupabaseJoinRequest>('join_requests', `id=eq.${encodeURIComponent(payload.requestId)}`, {
    status: payload.status,
    reviewed_by: payload.reviewedBy,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (result.data?.[0] && !result.error) {
    await writeAuditLog({
      actorUserId: payload.reviewedBy,
      actorRole: payload.actorRole ?? 'wellness_admin',
      organizationId: result.data[0].tenant_id,
      actionType: `join_request.${payload.status}`,
      targetEntityType: 'join_request',
      targetEntityId: payload.requestId,
      newValue: result.data[0] as unknown as Record<string, unknown>,
    });
    if (payload.status === 'approved') {
      await createOrganizationMember({
        organizationId: result.data[0].tenant_id,
        userId: result.data[0].user_id,
        joinRequestId: payload.requestId,
        actorUserId: payload.reviewedBy,
        actorRole: payload.actorRole ?? 'wellness_admin',
      });
    }
  }
  return result;
}

export async function createOrganizationMember(payload: {
  organizationId: ConsoleId;
  userId: ConsoleId;
  joinRequestId?: ConsoleId | null;
  actorUserId: ConsoleId;
  actorRole: string;
}) {
  const organizationResult = await getOrganizationById(payload.organizationId);
  const membersResult = await listMembers(payload.organizationId);
  const memberLimit = organizationResult.data?.memberLimit ?? null;
  if (memberLimit !== null && membersResult.data.length >= memberLimit) {
    return { data: null, error: `Member limit reached for ${payload.organizationId}.` };
  }

  const result = await insertSupabaseRow<SupabaseTenantMember>('tenant_members', {
    tenant_id: payload.organizationId,
    user_id: payload.userId,
    role: 'member',
    status: 'active',
    joined_at: new Date().toISOString(),
    join_request_id: payload.joinRequestId ?? null,
    created_by: payload.actorUserId,
  });
  if (result.data && !result.error) {
    await writeAuditLog({
      actorUserId: payload.actorUserId,
      actorRole: payload.actorRole,
      organizationId: payload.organizationId,
      actionType: 'organization_member.created',
      targetEntityType: 'tenant_member',
      targetEntityId: result.data.id ?? `${payload.organizationId}-${payload.userId}`,
      newValue: result.data as unknown as Record<string, unknown>,
    });
  }
  return result;
}

export async function createNfcCard(payload: {
  organizationId: ConsoleId;
  uidHash: string;
  label: string;
  publicCode?: string;
  actorUserId?: ConsoleId;
  actorRole?: string;
}) {
  const [organizationResult, cardsResult] = await Promise.all([
    getOrganizationById(payload.organizationId),
    listNfcCards(payload.organizationId),
  ]);
  const cardLimit = organizationResult.data?.nfcCardLimit ?? null;
  if (cardLimit !== null && cardsResult.data.length >= cardLimit) {
    return { data: null, error: `NFC card limit reached for ${payload.organizationId}.` };
  }

  const result = await insertSupabaseRow<SupabaseNfcCard>('tenant_nfc_cards', {
    tenant_id: payload.organizationId,
    uid_hash: payload.uidHash,
    card_name: payload.label,
    label: payload.label,
    public_code: payload.publicCode ?? payload.uidHash,
    category: 'fitness',
    status: 'unassigned',
  });
  if (result.data && !result.error) {
    await writeAuditLog({
      actorUserId: payload.actorUserId ?? 'system',
      actorRole: payload.actorRole ?? 'system',
      organizationId: payload.organizationId,
      actionType: 'nfc_card.created',
      targetEntityType: 'tenant_nfc_card',
      targetEntityId: result.data.id,
      newValue: result.data as unknown as Record<string, unknown>,
    });
  }
  return result;
}

export async function updateNfcCard(payload: {
  cardId: ConsoleId;
  organizationId: ConsoleId;
  label?: string;
  assignedMemberId?: ConsoleId | null;
  status?: NfcCard['status'];
  actorUserId: ConsoleId;
  actorRole: string;
}) {
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (payload.label !== undefined) {
    updatePayload.label = payload.label;
    updatePayload.card_name = payload.label;
  }
  if (payload.assignedMemberId !== undefined) updatePayload.assigned_member_id = payload.assignedMemberId;
  if (payload.status !== undefined) updatePayload.status = payload.status === 'inactive' ? 'disabled' : payload.status;

  const result = await patchSupabaseRows<SupabaseNfcCard>('tenant_nfc_cards', `id=eq.${encodeURIComponent(payload.cardId)}&tenant_id=eq.${encodeURIComponent(payload.organizationId)}`, updatePayload);
  if (result.data?.[0] && !result.error) {
    await writeAuditLog({
      actorUserId: payload.actorUserId,
      actorRole: payload.actorRole,
      organizationId: payload.organizationId,
      actionType: 'nfc_card.updated',
      targetEntityType: 'tenant_nfc_card',
      targetEntityId: payload.cardId,
      newValue: result.data[0] as unknown as Record<string, unknown>,
    });
  }
  return result;
}

export async function assignNfcCard(payload: {
  organizationId: ConsoleId;
  tenantCardId: ConsoleId;
  activityTypeId: ConsoleId;
  incrementValue: number;
  unit: string;
  dailyGoal?: number | null;
  actorUserId: ConsoleId;
  actorRole: string;
}) {
  const result = await insertSupabaseRow<SupabaseCardAssignment>('card_assignments', {
    tenant_id: payload.organizationId,
    tenant_card_id: payload.tenantCardId,
    activity_type_id: payload.activityTypeId,
    increment_value: payload.incrementValue,
    unit: payload.unit,
    daily_goal: payload.dailyGoal ?? null,
    is_active: true,
  });
  if (result.data && !result.error) {
    await writeAuditLog({
      actorUserId: payload.actorUserId,
      actorRole: payload.actorRole,
      organizationId: payload.organizationId,
      actionType: 'nfc_card.assigned',
      targetEntityType: 'card_assignment',
      targetEntityId: result.data.id,
      newValue: result.data as unknown as Record<string, unknown>,
    });
  }
  return result;
}

export async function createRhythm(payload: {
  organizationId: ConsoleId;
  createdBy: ConsoleId;
  name: string;
  category?: string;
  description?: string | null;
  unit?: string;
  defaultTarget?: number;
  defaultScanAmount?: number;
  isTemplate?: boolean;
  actorRole?: string;
}) {
  const result = await insertSupabaseRow<SupabaseRoutine>('routines', {
    id: `routine-${crypto.randomUUID()}`,
    tenant_id: payload.organizationId,
    created_by: payload.createdBy,
    name: payload.name,
    category: payload.category ?? 'exercise',
    description: payload.description ?? null,
    unit: payload.unit ?? 'custom',
    default_target: payload.defaultTarget ?? 1,
    default_scan_amount: payload.defaultScanAmount ?? 1,
    is_template: payload.isTemplate ?? false,
    is_active: true,
  });
  if (result.data && !result.error) {
    await writeAuditLog({
      actorUserId: payload.createdBy,
      actorRole: payload.actorRole ?? 'wellness_admin',
      organizationId: payload.organizationId,
      actionType: 'rhythm.created',
      targetEntityType: 'routine',
      targetEntityId: result.data.id,
      newValue: result.data as unknown as Record<string, unknown>,
    });
  }
  return result;
}

export async function updateRhythm(payload: {
  rhythmId: ConsoleId;
  organizationId: ConsoleId;
  name?: string;
  description?: string | null;
  status?: Rhythm['status'];
  defaultTarget?: number;
  defaultScanAmount?: number;
  actorUserId: ConsoleId;
  actorRole: string;
}) {
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (payload.name !== undefined) updatePayload.name = payload.name;
  if (payload.description !== undefined) updatePayload.description = payload.description;
  if (payload.status !== undefined) {
    updatePayload.status = payload.status;
    updatePayload.is_active = payload.status === 'active';
  }
  if (payload.defaultTarget !== undefined) updatePayload.default_target = payload.defaultTarget;
  if (payload.defaultScanAmount !== undefined) updatePayload.default_scan_amount = payload.defaultScanAmount;

  const result = await patchSupabaseRows<SupabaseRoutine>('routines', `id=eq.${encodeURIComponent(payload.rhythmId)}&tenant_id=eq.${encodeURIComponent(payload.organizationId)}`, updatePayload);
  if (result.data?.[0] && !result.error) {
    await writeAuditLog({
      actorUserId: payload.actorUserId,
      actorRole: payload.actorRole,
      organizationId: payload.organizationId,
      actionType: 'rhythm.updated',
      targetEntityType: 'routine',
      targetEntityId: payload.rhythmId,
      newValue: result.data[0] as unknown as Record<string, unknown>,
    });
  }
  return result;
}

export async function archiveRhythm(payload: {
  rhythmId: ConsoleId;
  organizationId: ConsoleId;
  actorUserId: ConsoleId;
  actorRole: string;
}) {
  return updateRhythm({
    rhythmId: payload.rhythmId,
    organizationId: payload.organizationId,
    status: 'archived',
    actorUserId: payload.actorUserId,
    actorRole: payload.actorRole,
  });
}

export async function recordOperationalAssignment(payload: {
  organizationId: ConsoleId;
  actorUserId: ConsoleId;
  actorRole: string;
  actionType: 'member_rhythm.assigned' | 'member_rhythm.updated' | 'settings.updated' | 'system_settings.updated';
  targetEntityType: string;
  targetEntityId: ConsoleId;
  value: Record<string, unknown>;
}) {
  return writeAuditLog({
    actorUserId: payload.actorUserId,
    actorRole: payload.actorRole,
    organizationId: payload.organizationId,
    actionType: payload.actionType,
    targetEntityType: payload.targetEntityType,
    targetEntityId: payload.targetEntityId,
    newValue: payload.value,
  });
}

export async function upsertActivityLibraryItem(payload: {
  organizationId: ConsoleId;
  name: string;
  category: string;
  unit: string;
  defaultAmount: number;
  actorUserId?: ConsoleId;
  actorRole?: string;
}) {
  const result = await insertSupabaseRow<SupabaseActivityType>('activity_types', {
    id: `${payload.organizationId}-act-${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    tenant_id: payload.organizationId,
    category: payload.category,
    name: payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    display_name_tr: payload.name,
    display_name_en: payload.name,
    unit: payload.unit,
    default_increment: payload.defaultAmount,
    is_active: true,
    is_custom: true,
  });
  if (result.data && !result.error) {
    await writeAuditLog({
      actorUserId: payload.actorUserId ?? 'system',
      actorRole: payload.actorRole ?? 'system',
      organizationId: payload.organizationId,
      actionType: 'activity_library_item.upserted',
      targetEntityType: 'activity_type',
      targetEntityId: result.data.id,
      newValue: result.data as unknown as Record<string, unknown>,
    });
  }
  return result;
}

export async function createSubscriptionPlan(payload: {
  code: string;
  name: string;
  description?: string | null;
  memberLimit?: number | null;
  nfcCardLimit: number;
  wellnessAdminLimit?: number | null;
  reportLevel: 'basic' | 'advanced';
  supportLevel: 'standard' | 'priority';
  status: 'active' | 'inactive';
  actorUserId: ConsoleId;
  actorRole: string;
}) {
  const result = await insertSupabaseRow<SupabaseSubscriptionPlan>('subscription_plans', {
    id: `plan-${payload.code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    code: payload.code,
    name: payload.name,
    description: payload.description ?? null,
    member_limit: payload.memberLimit ?? null,
    nfc_card_limit: payload.nfcCardLimit,
    wellness_admin_limit: payload.wellnessAdminLimit ?? null,
    report_level: payload.reportLevel,
    support_level: payload.supportLevel,
    status: payload.status,
  });
  if (result.data && !result.error) {
    await writeAuditLog({
      actorUserId: payload.actorUserId,
      actorRole: payload.actorRole,
      actionType: 'subscription_plan.created',
      targetEntityType: 'subscription_plan',
      targetEntityId: result.data.id,
      newValue: result.data as unknown as Record<string, unknown>,
    });
  }
  return result;
}

export async function updateSubscriptionPlan(payload: {
  planId: ConsoleId;
  name?: string;
  description?: string | null;
  memberLimit?: number | null;
  nfcCardLimit?: number;
  wellnessAdminLimit?: number | null;
  reportLevel?: 'basic' | 'advanced';
  supportLevel?: 'standard' | 'priority';
  status?: 'active' | 'inactive' | 'archived';
  actorUserId: ConsoleId;
  actorRole: string;
}) {
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.name !== undefined) updatePayload.name = payload.name;
  if (payload.description !== undefined) updatePayload.description = payload.description;
  if (payload.memberLimit !== undefined) updatePayload.member_limit = payload.memberLimit;
  if (payload.nfcCardLimit !== undefined) updatePayload.nfc_card_limit = payload.nfcCardLimit;
  if (payload.wellnessAdminLimit !== undefined) updatePayload.wellness_admin_limit = payload.wellnessAdminLimit;
  if (payload.reportLevel !== undefined) updatePayload.report_level = payload.reportLevel;
  if (payload.supportLevel !== undefined) updatePayload.support_level = payload.supportLevel;
  if (payload.status !== undefined) updatePayload.status = payload.status;

  const result = await patchSupabaseRows<SupabaseSubscriptionPlan>('subscription_plans', `id=eq.${encodeURIComponent(payload.planId)}`, updatePayload);
  if (result.data?.[0] && !result.error) {
    await writeAuditLog({
      actorUserId: payload.actorUserId,
      actorRole: payload.actorRole,
      actionType: 'subscription_plan.updated',
      targetEntityType: 'subscription_plan',
      targetEntityId: payload.planId,
      newValue: result.data[0] as unknown as Record<string, unknown>,
    });
  }
  return result;
}

export async function assignOrganizationSubscription(payload: {
  organizationId: ConsoleId;
  planId: ConsoleId;
  planCode: string;
  status: OrganizationSubscription['status'];
  provider: OrganizationSubscription['provider'];
  memberLimitOverride?: number | null;
  nfcCardLimitOverride?: number | null;
  currentPeriodEnd?: string | null;
  actorUserId: ConsoleId;
  actorRole: string;
}) {
  const result = await insertSupabaseRow<SupabaseOrganizationSubscription>('organization_subscriptions', {
    id: `org-sub-${crypto.randomUUID()}`,
    tenant_id: payload.organizationId,
    plan_id: payload.planId,
    plan_code: payload.planCode,
    status: payload.status,
    provider: payload.provider,
    member_limit_override: payload.memberLimitOverride ?? null,
    nfc_card_limit_override: payload.nfcCardLimitOverride ?? null,
    current_period_end: payload.currentPeriodEnd ?? null,
  });
  if (result.data && !result.error) {
    await writeAuditLog({
      actorUserId: payload.actorUserId,
      actorRole: payload.actorRole,
      organizationId: payload.organizationId,
      actionType: 'organization_subscription.assigned',
      targetEntityType: 'organization_subscription',
      targetEntityId: result.data.id,
      newValue: result.data as unknown as Record<string, unknown>,
    });
  }
  return result;
}

export async function writeAuditLog(payload: {
  actorUserId: ConsoleId;
  actorRole: string;
  organizationId?: ConsoleId | null;
  actionType: string;
  targetEntityType: string;
  targetEntityId: ConsoleId;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
}) {
  return insertSupabaseRow<SupabaseAuditLog>('audit_logs', {
    actor_user_id: uuidOrNull(payload.actorUserId),
    actor_role: payload.actorRole,
    tenant_id: payload.organizationId ?? null,
    action_type: payload.actionType,
    target_entity_type: payload.targetEntityType,
    target_entity_id: payload.targetEntityId,
    old_value: payload.oldValue ?? null,
    new_value: payload.newValue ?? null,
    status: 'success',
  });
}
