export type JoinStatus = 'invited' | 'pending' | 'active' | 'rejected' | 'inactive' | 'blocked';
export type JoinSource = 'qr_code' | 'nfc_card' | 'invite_link' | 'email_invite' | 'manual_admin' | 'club_code';
export type SubscriptionStatus = 'trialing' | 'active' | 'paused' | 'cancelled' | 'expired';
export type SportsCenterStatus = SubscriptionStatus;
export type StaffRole = 'owner' | 'admin' | 'coach' | 'member';
export type PlanCode = 'free' | 'personal_pro' | 'sports_center_basic';
export type PaymentProvider = 'manual' | 'stripe' | 'apple_iap' | 'google_play';

export type SportsCenter = {
  id: string;
  name: string;
  slug: string;
  clubCode: string;
  ownerEmail: string;
  status: SportsCenterStatus;
  city: string;
  country: string;
  planCode: PlanCode;
  membersCount: number;
  nfcCardsCount: number;
  createdAt: string;
  lastActivityAt: string;
};

export type Subscription = {
  id: string;
  ownerType: 'sports_center' | 'user';
  ownerId: string;
  planCode: PlanCode;
  status: SubscriptionStatus;
  provider: PaymentProvider;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  maxMembers: number | null;
  maxNfcCards: number;
  currentPeriodEnd: string;
  createdAt: string;
  updatedAt: string;
};

export type JoinRequest = {
  id: string;
  sportsCenterId: string;
  userName: string;
  email: string;
  source: JoinSource;
  status: JoinStatus;
  requestedAt: string;
};

export type NfcCard = {
  id: string;
  cardName: string;
  sportsCenterId: string;
  assignedUser: string | null;
  linkedActivity: string | null;
  status: 'assigned' | 'unassigned' | 'lost' | 'inactive';
  lastScannedAt: string | null;
  createdAt: string;
};

export type ActivityLog = {
  id: string;
  sportsCenterId: string;
  member: string;
  activity: string;
  amount: number;
  unit: string;
  source: 'nfc' | 'manual' | 'sync' | 'admin';
  cardName: string | null;
  createdAt: string;
};

export type StaffMember = {
  id: string;
  sportsCenterId: string;
  name: string;
  email: string;
  role: StaffRole;
  status: JoinStatus;
  lastLoginAt: string;
};

export type AuditLog = {
  id: string;
  createdAt: string;
  actor: string;
  action: string;
  entity: string;
  details: string;
};

export const sportsCenters: SportsCenter[] = [
  { id: 'sc-lyon-fit', name: 'Lyon Fit Club', slug: 'lyon-fit', clubCode: 'LYN50', ownerEmail: 'owner@lyonfit.fr', status: 'active', city: 'Lyon', country: 'FR', planCode: 'sports_center_basic', membersCount: 43, nfcCardsCount: 175, createdAt: '2026-06-01', lastActivityAt: '2026-06-14 09:42' },
  { id: 'sc-marseille-core', name: 'Marseille Core', slug: 'marseille-core', clubCode: 'MCR22', ownerEmail: 'admin@marseillecore.fr', status: 'trialing', city: 'Marseille', country: 'FR', planCode: 'sports_center_basic', membersCount: 18, nfcCardsCount: 64, createdAt: '2026-06-10', lastActivityAt: '2026-06-14 08:10' },
  { id: 'sc-paris-well', name: 'Paris Wellness Lab', slug: 'paris-wellness', clubCode: 'PWL88', ownerEmail: 'ops@pariswell.fr', status: 'active', city: 'Paris', country: 'FR', planCode: 'sports_center_basic', membersCount: 49, nfcCardsCount: 192, createdAt: '2026-05-28', lastActivityAt: '2026-06-14 07:55' },
  { id: 'sc-bordeaux-lift', name: 'Bordeaux Lift House', slug: 'bordeaux-lift', clubCode: 'BLH19', ownerEmail: 'team@blh.fr', status: 'paused', city: 'Bordeaux', country: 'FR', planCode: 'sports_center_basic', membersCount: 31, nfcCardsCount: 96, createdAt: '2026-05-12', lastActivityAt: '2026-06-02 18:20' },
  { id: 'sc-lille-box', name: 'Lille Box & Move', slug: 'lille-box', clubCode: 'LBM77', ownerEmail: 'owner@lillebox.fr', status: 'active', city: 'Lille', country: 'FR', planCode: 'sports_center_basic', membersCount: 37, nfcCardsCount: 151, createdAt: '2026-05-06', lastActivityAt: '2026-06-13 21:15' },
];

export const subscriptions: Subscription[] = [
  ...sportsCenters.map((center, index) => ({
    id: `sub-${center.id}`,
    ownerType: 'sports_center' as const,
    ownerId: center.id,
    planCode: center.planCode,
    status: center.status === 'trialing' ? 'trialing' as const : center.status,
    provider: index === 0 || index === 2 ? 'stripe' as const : 'manual' as const,
    providerCustomerId: index === 0 || index === 2 ? `cus_${center.slug}` : null,
    providerSubscriptionId: index === 0 || index === 2 ? `sub_${center.slug}` : null,
    maxMembers: 50,
    maxNfcCards: 200,
    currentPeriodEnd: center.status === 'trialing' ? '2026-06-24' : '2026-07-14',
    createdAt: center.createdAt,
    updatedAt: center.lastActivityAt,
  })),
  { id: 'sub-user-free', ownerType: 'user', ownerId: 'user-free-1', planCode: 'free', status: 'active', provider: 'manual', providerCustomerId: null, providerSubscriptionId: null, maxMembers: null, maxNfcCards: 3, currentPeriodEnd: '2026-07-14', createdAt: '2026-06-01', updatedAt: '2026-06-01' },
  { id: 'sub-user-pro-ios', ownerType: 'user', ownerId: 'user-pro-ios-1', planCode: 'personal_pro', status: 'active', provider: 'apple_iap', providerCustomerId: 'apple-user-1', providerSubscriptionId: 'apple-sub-1', maxMembers: null, maxNfcCards: 50, currentPeriodEnd: '2026-07-14', createdAt: '2026-06-03', updatedAt: '2026-06-14' },
  { id: 'sub-user-pro-android', ownerType: 'user', ownerId: 'user-pro-android-1', planCode: 'personal_pro', status: 'active', provider: 'google_play', providerCustomerId: 'gplay-user-1', providerSubscriptionId: 'gplay-sub-1', maxMembers: null, maxNfcCards: 50, currentPeriodEnd: '2026-07-14', createdAt: '2026-06-04', updatedAt: '2026-06-14' },
];

export const joinRequests: JoinRequest[] = [
  { id: 'jr-1', sportsCenterId: 'sc-lyon-fit', userName: 'Aylin Martin', email: 'aylin@example.com', source: 'qr_code', status: 'pending', requestedAt: '2026-06-13 11:22' },
  { id: 'jr-2', sportsCenterId: 'sc-lyon-fit', userName: 'Hugo Bernard', email: 'hugo@example.com', source: 'nfc_card', status: 'pending', requestedAt: '2026-06-12 17:40' },
  { id: 'jr-3', sportsCenterId: 'sc-paris-well', userName: 'Lina Moreau', email: 'lina@example.com', source: 'club_code', status: 'pending', requestedAt: '2026-06-10 09:15' },
  { id: 'jr-4', sportsCenterId: 'sc-paris-well', userName: 'Mert Kaya', email: 'mert@example.com', source: 'invite_link', status: 'pending', requestedAt: '2026-06-06 15:30' },
  { id: 'jr-5', sportsCenterId: 'sc-marseille-core', userName: 'Nora Petit', email: 'nora@example.com', source: 'email_invite', status: 'active', requestedAt: '2026-06-13 08:05' },
  { id: 'jr-6', sportsCenterId: 'sc-lille-box', userName: 'Selin Arslan', email: 'selin@example.com', source: 'manual_admin', status: 'invited', requestedAt: '2026-06-11 12:10' },
];

export const nfcCards: NfcCard[] = [
  { id: 'card-1', sportsCenterId: 'sc-lyon-fit', cardName: 'Bench Zone 01', assignedUser: 'Alex Durand', linkedActivity: 'Bench Press', status: 'assigned', lastScannedAt: '2026-06-14 09:40', createdAt: '2026-06-01' },
  { id: 'card-2', sportsCenterId: 'sc-lyon-fit', cardName: 'Squat Rack 02', assignedUser: 'Aylin Martin', linkedActivity: 'Squat', status: 'assigned', lastScannedAt: '2026-06-14 09:12', createdAt: '2026-06-01' },
  { id: 'card-3', sportsCenterId: 'sc-lyon-fit', cardName: 'Spare Card 17', assignedUser: null, linkedActivity: null, status: 'unassigned', lastScannedAt: null, createdAt: '2026-06-13' },
  { id: 'card-4', sportsCenterId: 'sc-paris-well', cardName: 'Yoga Room NFC', assignedUser: 'Lina Moreau', linkedActivity: 'Yoga', status: 'assigned', lastScannedAt: '2026-06-14 07:55', createdAt: '2026-05-30' },
  { id: 'card-5', sportsCenterId: 'sc-paris-well', cardName: 'Lost Card 04', assignedUser: null, linkedActivity: null, status: 'lost', lastScannedAt: '2026-06-01 12:30', createdAt: '2026-05-30' },
  { id: 'card-6', sportsCenterId: 'sc-marseille-core', cardName: 'Trial Card A', assignedUser: null, linkedActivity: null, status: 'unassigned', lastScannedAt: null, createdAt: '2026-06-10' },
];

export const activityLogs: ActivityLog[] = [
  { id: 'log-1', sportsCenterId: 'sc-lyon-fit', member: 'Alex Durand', activity: 'Bench Press', amount: 10, unit: 'reps', source: 'nfc', cardName: 'Bench Zone 01', createdAt: '2026-06-14 09:40' },
  { id: 'log-2', sportsCenterId: 'sc-lyon-fit', member: 'Aylin Martin', activity: 'Squat', amount: 20, unit: 'reps', source: 'nfc', cardName: 'Squat Rack 02', createdAt: '2026-06-14 09:12' },
  { id: 'log-3', sportsCenterId: 'sc-lyon-fit', member: 'Marc Blanc', activity: 'Running', amount: 15, unit: 'min', source: 'manual', cardName: null, createdAt: '2026-06-14 08:35' },
  { id: 'log-4', sportsCenterId: 'sc-paris-well', member: 'Lina Moreau', activity: 'Yoga', amount: 20, unit: 'min', source: 'nfc', cardName: 'Yoga Room NFC', createdAt: '2026-06-14 07:55' },
  { id: 'log-5', sportsCenterId: 'sc-lille-box', member: 'Selin Arslan', activity: 'Boxing', amount: 30, unit: 'min', source: 'sync', cardName: null, createdAt: '2026-06-13 21:15' },
];

export const staffMembers: StaffMember[] = [
  { id: 'staff-1', sportsCenterId: 'sc-lyon-fit', name: 'Claire Dubois', email: 'owner@lyonfit.fr', role: 'owner', status: 'active', lastLoginAt: '2026-06-14 09:10' },
  { id: 'staff-2', sportsCenterId: 'sc-lyon-fit', name: 'Yanis Petit', email: 'coach@lyonfit.fr', role: 'coach', status: 'active', lastLoginAt: '2026-06-13 18:42' },
  { id: 'staff-3', sportsCenterId: 'sc-lyon-fit', name: 'Emma Roche', email: 'admin@lyonfit.fr', role: 'admin', status: 'active', lastLoginAt: '2026-06-14 08:15' },
];

export const auditLogs: AuditLog[] = [
  { id: 'audit-1', createdAt: '2026-06-14 09:44', actor: 'platform_admin@ritim.app', action: 'Member approved', entity: 'Lyon Fit Club', details: 'Approved QR join request for Aylin Martin' },
  { id: 'audit-2', createdAt: '2026-06-14 09:20', actor: 'owner@lyonfit.fr', action: 'NFC card assigned', entity: 'Bench Zone 01', details: 'Linked to Bench Press' },
  { id: 'audit-3', createdAt: '2026-06-13 17:10', actor: 'support@ritim.app', action: 'Plan changed', entity: 'Paris Wellness Lab', details: 'Sports Center Basic renewed manually' },
  { id: 'audit-4', createdAt: '2026-06-12 14:32', actor: 'platform_admin@ritim.app', action: 'Sports center paused', entity: 'Bordeaux Lift House', details: 'Manual subscription pause' },
];

export const joinSourceLabels: Record<JoinSource, string> = {
  qr_code: 'QR Code',
  nfc_card: 'NFC Card',
  invite_link: 'Invite Link',
  email_invite: 'Email Invite',
  manual_admin: 'Manual Admin',
  club_code: 'Club Code',
};

export function getSubscription(centerId: string) {
  return subscriptions.find((subscription) => subscription.ownerId === centerId);
}

export function usagePercent(current: number, max: number | null) {
  if (!max) return 0;
  return Math.round((current / max) * 100);
}

export function isNearLimit(current: number, max: number | null) {
  return usagePercent(current, max) >= 80;
}

export function formatDate(value: string | null) {
  if (!value) return '-';
  return value;
}
