// Shared TypeScript models for Ritim

export type ID = string;

export interface UserProfile {
  id: ID;
  fullName: string;
  email?: string;
  age?: number | null;
  gender?: 'female' | 'male' | 'other' | 'prefer_not_to_say' | null;
  heightCm?: number | null;
  weightKg?: number | null;
  activityLevel?: 'low' | 'medium' | 'high' | null;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: ID;
  name: string;
  slug: string;
  type: 'personal' | 'gym' | 'wellness_studio' | 'trainer' | 'company';
  role: 'tenant_owner' | 'tenant_admin' | 'trainer' | 'member';
  createdAt: string;
  updatedAt: string;
}

export interface ActivityType {
  id: ID;
  tenantId: ID;
  category: 'fitness' | 'wellness';
  name: string;
  displayNameTr: string;
  displayNameEn: string;
  unit: string;
  defaultIncrement: number;
  icon?: string;
  color?: string;
  caloriesPerUnit?: number | null;
  workoutCategory?: 'Chest' | 'Back' | 'Legs' | 'Shoulder' | 'Arms' | 'Core' | 'Cardio' | 'Stretching' | null;
  muscleGroup?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard' | null;
  intensity?: 'low' | 'medium' | 'high' | null;
  trackingMode?: 'duration' | 'reps' | 'sets';
  description?: string | null;
  isActive: boolean;
  isCustom?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NfcTag {
  id: ID;
  uidHash: string;
  mockUid?: string;
  publicTagCode?: string;
  status: 'active' | 'disabled';
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface TenantNfcCard {
  id: ID;
  tenantId: ID;
  tagId: ID;
  uidHash: string;
  cardName: string;
  category: 'fitness' | 'wellness';
  status: 'active' | 'unassigned' | 'disabled';
  createdAt: string;
  updatedAt: string;
}

export interface CardAssignment {
  id: ID;
  tenantId: ID;
  tenantCardId: ID;
  activityTypeId: ID;
  incrementValue: number;
  unit: string;
  dailyGoal?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: ID;
  tenantId: ID;
  userId: ID;
  tagId?: ID;
  tenantCardId?: ID;
  activityTypeId: ID;
  category: 'fitness' | 'wellness';
  value: number;
  unit: string;
  calories?: number | null;
  source: 'mock_nfc' | 'nfc' | 'manual';
  syncStatus: 'local_only' | 'pending' | 'synced' | 'failed';
  loggedAt: string;
  createdAt: string;
}

export type RoutineCategory = 'exercise' | 'wellness';
export type RoutineTargetType = 'completion' | 'set_based' | 'duration_based' | 'count_based' | 'page_based';
export type RoutineUnitType = 'repetition' | 'page' | 'minute' | 'count';
export type RoutineProgressionMode = 'none' | 'weekly' | 'monthly' | 'custom';

export interface Routine {
  id: ID;
  tenantId: ID;
  activityTypeId?: ID | null;
  name: string;
  category?: RoutineCategory;
  targetType?: RoutineTargetType;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoutinePlan {
  id: ID;
  tenantId: ID;
  routineId: ID;
  effectiveFrom: string;
  effectiveTo?: string | null;
  scheduleType: 'daily' | 'weekly' | 'custom';
  selectedDays: string[];
  targetType: RoutineTargetType;
  targetSets?: number | null;
  targetRepsPerSet?: number | null;
  targetTotalUnits?: number | null;
  blocks?: number | null;
  unitsPerBlock?: number | null;
  unitType: RoutineUnitType;
  minimumSuccessPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineProgressionRule {
  id: ID;
  tenantId: ID;
  routineId: ID;
  mode: RoutineProgressionMode;
  increaseFrequency?: RoutineProgressionMode;
  increaseAmount: number;
  increaseUnit: 'reps_per_set' | 'sets' | 'pages_per_day' | 'minutes_per_day' | 'count_per_day';
  startPolicy?: 'today' | 'next_week' | 'next_month' | 'specific_date' | string | null;
  startDate?: string | null;
  maxTargetSets?: number | null;
  maxTargetRepsPerSet?: number | null;
  maxTotalUnits?: number | null;
  requiresUserApproval: boolean;
  customRoadmap?: unknown[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineDailyLog {
  id: ID;
  tenantId: ID;
  routineId: ID;
  date: string;
  planSnapshot: Record<string, unknown>;
  plannedTotalUnits: number;
  completedTotalUnits: number;
  completedSetsCount?: number | null;
  extraUnits: number;
  successPercent: number;
  isSuccessful: boolean;
  isOverachieved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineLogEntry {
  id: ID;
  tenantId: ID;
  dailyLogId: ID;
  routineId: ID;
  entryIndex: number;
  entryType: 'set' | 'block' | 'manual';
  value: number;
  isExtra: boolean;
  createdAt: string;
}

export interface RoutineItem {
  id: ID;
  tenantId: ID;
  routineId: ID;
  activityTypeId: ID;
  targetValue: number;
  unit: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Challenge {
  id: ID;
  tenantId: ID;
  title: string;
  description?: string;
  metric: 'daily_log' | 'activity_value' | 'streak';
  targetValue: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeParticipant {
  id: ID;
  tenantId: ID;
  challengeId: ID;
  userId: ID;
  progressValue: number;
  status: 'joined' | 'completed' | 'left';
  joinedAt: string;
  updatedAt: string;
}

export interface SyncQueueItem {
  id: ID;
  tenantId?: ID | null;
  entityType:
    | 'activity_log'
    | 'tenant'
    | 'card'
    | 'assignment'
    | 'routine'
    | 'routine_plan'
    | 'routine_rule'
    | 'routine_daily_log'
    | 'routine_log_entry'
    | 'routine_item'
    | 'challenge';
  entityId: ID;
  operation: 'upsert' | 'delete';
  payload?: unknown;
  status: 'pending' | 'processing' | 'synced' | 'failed';
  attempts: number;
  createdAt: string;
  updatedAt: string;
}

export interface NfcAdapterState {
  mode: 'mock' | 'native';
  status: 'ready' | 'scanning' | 'unavailable' | 'error';
  lastError?: string | null;
}
