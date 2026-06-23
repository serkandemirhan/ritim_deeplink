export type ConsoleId = string;
export type IsoDateTime = string;

export type PlatformRole = 'super_admin' | 'platform_admin' | 'support';
export type OrganizationRole = 'wellness_admin' | 'staff' | 'trainer' | 'member';
export type ConsoleRole = PlatformRole | OrganizationRole;

export type OrganizationType = 'wellness_center' | 'gym' | 'company' | 'club' | 'institution';
export type OrganizationStatus = 'active' | 'inactive' | 'suspended' | 'archived';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'invited' | 'blocked' | 'archived';
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';
export type NfcCardStatus = 'active' | 'inactive' | 'unassigned' | 'assigned' | 'lost' | 'archived';
export type RhythmStatus = 'active' | 'inactive' | 'archived';
export type SubscriptionStatus = 'trialing' | 'active' | 'paused' | 'cancelled' | 'expired';
export type AuditActionStatus = 'success' | 'failed';
export type EntityLifecycleStatus = 'active' | 'inactive' | 'archived';

export type JoinRequestSource = 'qr' | 'nfc' | 'invite_link' | 'email_invite' | 'manual_admin' | 'club_code';
export type NfcCardOwnerType = 'personal_user' | 'organization';
export type ActivityCategory = 'exercise' | 'wellness' | 'reading' | 'nutrition' | 'learning' | 'custom';
export type ActivityUnit = 'reps' | 'sets' | 'pages' | 'minutes' | 'steps' | 'kg' | 'kcal' | 'custom';
export type ActivityLogSource = 'nfc' | 'manual' | 'admin' | 'import';
export type RhythmGoalType = 'increase' | 'decrease' | 'maintain' | 'complete';
export type RhythmFrequency = 'daily' | 'weekly' | 'monthly';
export type PaymentProvider = 'manual' | 'stripe' | 'apple_iap' | 'google_play';
export type SubscriptionOwnerType = 'organization' | 'user';
export type SupportedLanguage = 'tr' | 'en' | 'fr';

export type Timestamped = {
  id: ConsoleId;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type TenantScoped = {
  organizationId: ConsoleId;
};

export type Organization = Timestamped & {
  name: string;
  slug: string;
  type: OrganizationType;
  logoUrl?: string | null;
  contactEmail: string;
  phoneNumber?: string | null;
  address?: string | null;
  country: string;
  city: string;
  timezone: string;
  status: OrganizationStatus;
  subscriptionPlanId?: ConsoleId | null;
  memberLimit?: number | null;
  nfcCardLimit?: number | null;
};

export type ConsoleUser = Timestamped & {
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  status: UserStatus;
  platformRole?: PlatformRole | null;
  lastLoginAt?: IsoDateTime | null;
};

export type OrganizationAdmin = Timestamped & TenantScoped & {
  userId: ConsoleId;
  role: Extract<OrganizationRole, 'wellness_admin' | 'staff' | 'trainer'>;
  status: UserStatus;
  createdBy?: ConsoleId | null;
  lastLoginAt?: IsoDateTime | null;
};

export type OrganizationMember = Timestamped & TenantScoped & {
  userId: ConsoleId;
  status: UserStatus;
  joinedAt?: IsoDateTime | null;
  joinRequestId?: ConsoleId | null;
  createdBy?: ConsoleId | null;
};

export type JoinRequest = Timestamped & TenantScoped & {
  userId: ConsoleId;
  source: JoinRequestSource;
  nfcCardId?: ConsoleId | null;
  status: JoinRequestStatus;
  requestedAt: IsoDateTime;
  reviewedBy?: ConsoleId | null;
  reviewedAt?: IsoDateTime | null;
};

type NfcCardBase = Timestamped & {
  uidHash: string;
  publicCode: string;
  label: string;
  activityTypeId?: ConsoleId | null;
  defaultAmount?: number | null;
  unit?: ActivityUnit | string | null;
  status: NfcCardStatus;
  lastScannedAt?: IsoDateTime | null;
};

export type PersonalNfcCard = NfcCardBase & {
  ownerType: 'personal_user';
  organizationId?: null;
  ownerUserId: ConsoleId;
  assignedMemberId?: null;
};

export type OrganizationNfcCard = NfcCardBase & TenantScoped & {
  ownerType: 'organization';
  ownerUserId?: null;
  assignedMemberId?: ConsoleId | null;
};

export type NfcCard = PersonalNfcCard | OrganizationNfcCard;

export type ActivityLibraryItem = Timestamped & {
  organizationId?: ConsoleId | null;
  name: string;
  category: ActivityCategory;
  unit: ActivityUnit | string;
  icon?: string | null;
  defaultAmount: number;
  description?: string | null;
  isGlobal: boolean;
  status: EntityLifecycleStatus;
};

export type Rhythm = Timestamped & {
  organizationId?: ConsoleId | null;
  createdBy: ConsoleId;
  name: string;
  description?: string | null;
  category: ActivityCategory;
  unit: ActivityUnit | string;
  goalType: RhythmGoalType;
  defaultTarget: number;
  frequency: RhythmFrequency;
  defaultScanAmount: number;
  isTemplate: boolean;
  status: RhythmStatus;
  activityLibraryItemId?: ConsoleId | null;
};

export type ActivityLog = {
  id: ConsoleId;
  userId: ConsoleId;
  organizationId?: ConsoleId | null;
  rhythmId: ConsoleId;
  nfcCardId?: ConsoleId | null;
  activityType: string;
  amount: number;
  unit: ActivityUnit | string;
  source: ActivityLogSource;
  createdAt: IsoDateTime;
  createdBy: ConsoleId;
  note?: string | null;
};

export type SubscriptionPlan = Timestamped & {
  code: string;
  name: string;
  description?: string | null;
  memberLimit?: number | null;
  nfcCardLimit: number;
  wellnessAdminLimit?: number | null;
  reportLevel: 'basic' | 'advanced';
  supportLevel: 'standard' | 'priority';
  status: EntityLifecycleStatus;
};

export type OrganizationSubscription = Timestamped & TenantScoped & {
  planId: ConsoleId;
  planCode: string;
  status: SubscriptionStatus;
  provider: PaymentProvider;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  memberLimitOverride?: number | null;
  nfcCardLimitOverride?: number | null;
  currentPeriodEnd?: IsoDateTime | null;
};

export type AuditLog = {
  id: ConsoleId;
  actorUserId: ConsoleId;
  actorRole: ConsoleRole;
  organizationId?: ConsoleId | null;
  actionType: string;
  targetEntityType: string;
  targetEntityId: ConsoleId;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  status: AuditActionStatus;
  createdAt: IsoDateTime;
};

export type SystemSettings = Timestamped & {
  appName: string;
  supportEmail: string;
  defaultLanguage: SupportedLanguage;
  availableLanguages: SupportedLanguage[];
  defaultSubscriptionPlanId?: ConsoleId | null;
  maintenanceMode: boolean;
  featureFlags: Record<string, boolean>;
  globalActivityCategories: ActivityCategory[];
  globalNfcCardSettings: Record<string, unknown>;
};

export type OrganizationSettings = Timestamped & TenantScoped & {
  logoUrl?: string | null;
  contactEmail?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  defaultLanguage: SupportedLanguage;
  memberApprovalMode: 'manual' | 'automatic';
  nfcScanBehavior: 'member_required' | 'create_join_request';
  defaultRhythmTemplateIds: ConsoleId[];
  notificationPreferences: Record<string, boolean>;
};

