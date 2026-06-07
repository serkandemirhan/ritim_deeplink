import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Linking, Platform } from 'react-native';

const toIso = (value) => value || new Date().toISOString();

const profileRow = (profile) => ({
  id: profile.id,
  full_name: profile.fullName,
  email: profile.email || null,
  age: profile.age || null,
  gender: profile.gender || null,
  height_cm: profile.heightCm || null,
  weight_kg: profile.weightKg || null,
  activity_level: profile.activityLevel || null,
  created_at: toIso(profile.createdAt),
  updated_at: toIso(profile.updatedAt),
});

const tenantRow = (tenant) => ({
  id: tenant.id,
  name: tenant.name,
  slug: tenant.slug,
  type: tenant.type,
  created_at: toIso(tenant.createdAt),
  updated_at: toIso(tenant.updatedAt),
});

const activityTypeRow = (activity) => ({
  id: activity.id,
  tenant_id: activity.tenantId,
  category: activity.category,
  name: activity.name,
  display_name_tr: activity.displayNameTr,
  display_name_en: activity.displayNameEn,
  unit: activity.unit,
  default_increment: activity.defaultIncrement,
  icon: activity.icon || null,
  color: activity.color || null,
  calories_per_unit: activity.caloriesPerUnit ?? null,
  workout_category: activity.workoutCategory || null,
  muscle_group: activity.muscleGroup || null,
  difficulty: activity.difficulty || null,
  intensity: activity.intensity || null,
  tracking_mode: activity.trackingMode || null,
  description: activity.description || null,
  is_active: activity.isActive !== false,
  is_custom: Boolean(activity.isCustom),
  created_at: toIso(activity.createdAt),
  updated_at: toIso(activity.updatedAt),
});

const nfcTagRow = (tag) => ({
  id: tag.id,
  uid_hash: tag.uidHash,
  mock_uid: tag.mockUid || null,
  public_tag_code: tag.publicTagCode || null,
  status: tag.status,
  first_seen_at: toIso(tag.firstSeenAt),
  last_seen_at: toIso(tag.lastSeenAt),
});

const tenantCardRow = (card) => ({
  id: card.id,
  tenant_id: card.tenantId,
  tag_id: card.tagId || null,
  uid_hash: card.uidHash,
  card_name: card.cardName,
  category: card.category,
  status: card.status,
  created_at: toIso(card.createdAt),
  updated_at: toIso(card.updatedAt),
});

const assignmentRow = (assignment) => ({
  id: assignment.id,
  tenant_id: assignment.tenantId,
  tenant_card_id: assignment.tenantCardId,
  activity_type_id: assignment.activityTypeId,
  increment_value: assignment.incrementValue,
  unit: assignment.unit,
  daily_goal: assignment.dailyGoal ?? null,
  is_active: assignment.isActive !== false,
  created_at: toIso(assignment.createdAt),
  updated_at: toIso(assignment.updatedAt),
});

const logRow = (log) => ({
  id: log.id,
  tenant_id: log.tenantId,
  user_id: log.userId,
  tag_id: log.tagId || null,
  tenant_card_id: log.tenantCardId || null,
  activity_type_id: log.activityTypeId,
  category: log.category,
  value: log.value,
  unit: log.unit,
  calories: log.calories ?? null,
  source: log.source,
  sync_status: 'synced',
  logged_at: toIso(log.loggedAt),
  created_at: toIso(log.createdAt),
});

const routineRow = (routine) => ({
  id: routine.id,
  tenant_id: routine.tenantId,
  activity_type_id: routine.activityTypeId || null,
  name: routine.name,
  category: routine.category || 'exercise',
  target_type: routine.targetType || 'completion',
  description: routine.description || null,
  is_active: routine.isActive !== false,
  created_at: toIso(routine.createdAt),
  updated_at: toIso(routine.updatedAt),
});

const routinePlanRow = (plan) => ({
  id: plan.id,
  tenant_id: plan.tenantId,
  routine_id: plan.routineId,
  effective_from: plan.effectiveFrom,
  effective_to: plan.effectiveTo || null,
  schedule_type: plan.scheduleType || 'weekly',
  selected_days: plan.selectedDays || [],
  target_type: plan.targetType || 'completion',
  target_sets: plan.targetSets ?? null,
  target_reps_per_set: plan.targetRepsPerSet ?? null,
  target_total_units: plan.targetTotalUnits ?? null,
  blocks: plan.blocks ?? null,
  units_per_block: plan.unitsPerBlock ?? null,
  unit_type: plan.unitType || 'count',
  minimum_success_percent: plan.minimumSuccessPercent ?? 80,
  created_at: toIso(plan.createdAt),
  updated_at: toIso(plan.updatedAt),
});

const routineProgressionRuleRow = (rule) => ({
  id: rule.id,
  tenant_id: rule.tenantId,
  routine_id: rule.routineId,
  mode: rule.mode || 'none',
  increase_frequency: rule.increaseFrequency || rule.mode || 'none',
  increase_amount: rule.increaseAmount ?? 0,
  increase_unit: rule.increaseUnit || 'count_per_day',
  start_policy: rule.startPolicy || null,
  start_date: rule.startDate || null,
  max_target_sets: rule.maxTargetSets ?? null,
  max_target_reps_per_set: rule.maxTargetRepsPerSet ?? null,
  max_total_units: rule.maxTotalUnits ?? null,
  requires_user_approval: rule.requiresUserApproval !== false,
  custom_roadmap: rule.customRoadmap || [],
  is_active: rule.isActive !== false,
  created_at: toIso(rule.createdAt),
  updated_at: toIso(rule.updatedAt),
});

const routineDailyLogRow = (log) => ({
  id: log.id,
  tenant_id: log.tenantId,
  routine_id: log.routineId,
  date: log.date,
  plan_snapshot_json: log.planSnapshot || log.plan_snapshot_json || {},
  planned_total_units: log.plannedTotalUnits ?? 0,
  completed_total_units: log.completedTotalUnits ?? 0,
  completed_sets_count: log.completedSetsCount ?? null,
  extra_units: log.extraUnits ?? 0,
  success_percent: log.successPercent ?? 0,
  is_successful: Boolean(log.isSuccessful),
  is_overachieved: Boolean(log.isOverachieved),
  created_at: toIso(log.createdAt),
  updated_at: toIso(log.updatedAt),
});

const routineLogEntryRow = (entry) => ({
  id: entry.id,
  tenant_id: entry.tenantId,
  daily_log_id: entry.dailyLogId,
  routine_id: entry.routineId,
  entry_index: entry.entryIndex,
  entry_type: entry.entryType || 'manual',
  value: entry.value ?? 0,
  is_extra: Boolean(entry.isExtra),
  created_at: toIso(entry.createdAt),
});

const throwIfError = ({ error }) => {
  if (error) throw error;
};

const isDuplicateConflict = (error) => {
  return error?.code === '23505' || error?.status === 409 || /duplicate key|conflict/i.test(error?.message || '');
};

const profileFromRow = (row) => row ? ({
  id: row.id,
  fullName: row.full_name,
  email: row.email || undefined,
  age: row.age ?? null,
  gender: row.gender ?? null,
  heightCm: row.height_cm ?? null,
  weightKg: row.weight_kg ?? null,
  activityLevel: row.activity_level ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
}) : null;

const tenantFromRow = (row, role = 'member') => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  type: row.type,
  role,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const activityTypeFromRow = (row) => ({
  id: row.id,
  tenantId: row.tenant_id,
  category: row.category,
  name: row.name,
  displayNameTr: row.display_name_tr,
  displayNameEn: row.display_name_en,
  unit: row.unit,
  defaultIncrement: Number(row.default_increment),
  icon: row.icon || undefined,
  color: row.color || undefined,
  caloriesPerUnit: row.calories_per_unit == null ? null : Number(row.calories_per_unit),
  workoutCategory: row.workout_category || null,
  muscleGroup: row.muscle_group || null,
  difficulty: row.difficulty || null,
  intensity: row.intensity || null,
  trackingMode: row.tracking_mode || null,
  description: row.description || null,
  isActive: row.is_active,
  isCustom: row.is_custom,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const nfcTagFromRow = (row) => ({
  id: row.id,
  uidHash: row.uid_hash,
  mockUid: row.mock_uid || undefined,
  publicTagCode: row.public_tag_code || undefined,
  status: row.status,
  firstSeenAt: row.first_seen_at,
  lastSeenAt: row.last_seen_at,
});

const tenantCardFromRow = (row) => ({
  id: row.id,
  tenantId: row.tenant_id,
  tagId: row.tag_id,
  uidHash: row.uid_hash,
  cardName: row.card_name,
  category: row.category,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const assignmentFromRow = (row) => ({
  id: row.id,
  tenantId: row.tenant_id,
  tenantCardId: row.tenant_card_id,
  activityTypeId: row.activity_type_id,
  incrementValue: Number(row.increment_value),
  unit: row.unit,
  dailyGoal: row.daily_goal == null ? null : Number(row.daily_goal),
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const logFromRow = (row) => ({
  id: row.id,
  tenantId: row.tenant_id,
  userId: row.user_id,
  tagId: row.tag_id || undefined,
  tenantCardId: row.tenant_card_id || undefined,
  activityTypeId: row.activity_type_id,
  category: row.category,
  value: Number(row.value),
  unit: row.unit,
  calories: row.calories == null ? null : Number(row.calories),
  source: row.source,
  syncStatus: row.sync_status || 'synced',
  loggedAt: row.logged_at,
  createdAt: row.created_at,
});

const routineFromRow = (row) => ({
  id: row.id,
  tenantId: row.tenant_id,
  activityTypeId: row.activity_type_id || null,
  name: row.name,
  category: row.category,
  targetType: row.target_type,
  description: row.description || undefined,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const routinePlanFromRow = (row) => ({
  id: row.id,
  tenantId: row.tenant_id,
  routineId: row.routine_id,
  effectiveFrom: row.effective_from,
  effectiveTo: row.effective_to || null,
  scheduleType: row.schedule_type,
  selectedDays: row.selected_days || [],
  targetType: row.target_type,
  targetSets: row.target_sets == null ? null : Number(row.target_sets),
  targetRepsPerSet: row.target_reps_per_set == null ? null : Number(row.target_reps_per_set),
  targetTotalUnits: row.target_total_units == null ? null : Number(row.target_total_units),
  blocks: row.blocks == null ? null : Number(row.blocks),
  unitsPerBlock: row.units_per_block == null ? null : Number(row.units_per_block),
  unitType: row.unit_type,
  minimumSuccessPercent: Number(row.minimum_success_percent),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const routineProgressionRuleFromRow = (row) => ({
  id: row.id,
  tenantId: row.tenant_id,
  routineId: row.routine_id,
  mode: row.mode,
  increaseFrequency: row.increase_frequency,
  increaseAmount: Number(row.increase_amount || 0),
  increaseUnit: row.increase_unit,
  startPolicy: row.start_policy || null,
  startDate: row.start_date || null,
  maxTargetSets: row.max_target_sets == null ? null : Number(row.max_target_sets),
  maxTargetRepsPerSet: row.max_target_reps_per_set == null ? null : Number(row.max_target_reps_per_set),
  maxTotalUnits: row.max_total_units == null ? null : Number(row.max_total_units),
  requiresUserApproval: row.requires_user_approval,
  customRoadmap: row.custom_roadmap || [],
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const routineDailyLogFromRow = (row) => ({
  id: row.id,
  tenantId: row.tenant_id,
  routineId: row.routine_id,
  date: row.date,
  planSnapshot: row.plan_snapshot_json || {},
  plannedTotalUnits: Number(row.planned_total_units || 0),
  completedTotalUnits: Number(row.completed_total_units || 0),
  completedSetsCount: row.completed_sets_count == null ? null : Number(row.completed_sets_count),
  extraUnits: Number(row.extra_units || 0),
  successPercent: Number(row.success_percent || 0),
  isSuccessful: row.is_successful,
  isOverachieved: row.is_overachieved,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const routineLogEntryFromRow = (row) => ({
  id: row.id,
  tenantId: row.tenant_id,
  dailyLogId: row.daily_log_id,
  routineId: row.routine_id,
  entryIndex: Number(row.entry_index),
  entryType: row.entry_type,
  value: Number(row.value || 0),
  isExtra: row.is_extra,
  createdAt: row.created_at,
});

function getAuthRedirectTo() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  return 'ritimapp://auth/callback';
}

function normalizeAuthError(error) {
  const message = String(error?.message || '');
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return new Error('E-posta veya şifre hatalı.');
  }
  if (lower.includes('email not confirmed') || lower.includes('not confirmed')) {
    const next = new Error('E-posta onayı gerekli. Gelen kutusu ve spam klasörünü kontrol et.');
    next.needsEmailConfirmation = true;
    return next;
  }
  if (lower.includes('user already registered') || lower.includes('already registered')) {
    return new Error('Bu e-posta zaten kayıtlı. Giriş yap sekmesinden devam et.');
  }
  return error;
}

export async function signUpOrSignIn({ mode, email, password, fullName }) {
  if (!isSupabaseConfigured) throw new Error('Supabase env is not configured.');
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const emailRedirectTo = getAuthRedirectTo();
  const authResult = mode === 'signIn'
    ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
    : await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo,
        },
      });
  if (authResult.error) throw normalizeAuthError(authResult.error);
  const user = authResult.data.user || authResult.data.session?.user;
  if (!user) throw new Error('Supabase did not return a user. Email confirmation may be required.');
  if (mode === 'signUp' && user.identities && user.identities.length === 0) {
    throw new Error('Bu e-posta zaten kayıtlı. Giriş yap sekmesinden devam et.');
  }
  if (!authResult.data.session) {
    return { user, needsEmailConfirmation: true };
  }
  await supabase.auth.setSession(authResult.data.session);
  return { user, needsEmailConfirmation: false };
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured) throw new Error('Supabase env is not configured.');
  const redirectTo = getAuthRedirectTo();
  const authResult = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== 'web',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  if (authResult.error) throw normalizeAuthError(authResult.error);
  const url = authResult.data?.url;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && url) {
    window.location.assign(url);
  } else if (url) {
    await Linking.openURL(url);
  }
  return { started: true, url, redirectTo };
}

export async function resendSignupConfirmation(email) {
  if (!isSupabaseConfigured) throw new Error('Supabase env is not configured.');
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) throw new Error('Email required.');
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: normalizedEmail,
    options: { emailRedirectTo: getAuthRedirectTo() },
  });
  if (error) throw normalizeAuthError(error);
  return { sent: true };
}

export async function signOut() {
  if (!isSupabaseConfigured) return { skipped: true };
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return { signedOut: true };
}

export async function pushBootstrapData({ profile, tenant, activityTypes }) {
  if (!isSupabaseConfigured) return { skipped: true };
  const sessionResult = await supabase.auth.getSession();
  if (sessionResult.error) throw sessionResult.error;
  const userId = sessionResult.data.session?.user?.id;
  if (!userId) throw new Error('No active Supabase session for workspace bootstrap.');
  if (profile.id !== userId) throw new Error('Profile does not match active Supabase user.');

  const bootstrapResult = await supabase.rpc('bootstrap_profile_tenant', {
    p_profile: profileRow(profile),
    p_tenant: { ...tenantRow(tenant), role: tenant.role || 'tenant_owner' },
  });
  throwIfError(bootstrapResult);

  if (activityTypes?.length) {
    throwIfError(await supabase.from('activity_types').upsert(activityTypes.map(activityTypeRow)));
  }
  return { skipped: false };
}

export async function updateRemoteProfile(profile) {
  if (!isSupabaseConfigured) return { skipped: true };
  const sessionResult = await supabase.auth.getSession();
  if (sessionResult.error) throw sessionResult.error;
  const userId = sessionResult.data.session?.user?.id;
  if (!userId) throw new Error('No active Supabase session for profile update.');
  if (profile.id !== userId) throw new Error('Profile does not match active Supabase user.');
  throwIfError(await supabase.from('profiles').upsert(profileRow(profile), { onConflict: 'id' }));
  return { updated: true };
}

export async function pullRemoteData() {
  if (!isSupabaseConfigured) throw new Error('Supabase env is not configured.');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const user = sessionData.session?.user;
  if (!user) return { profile: null, tenants: [] };

  const profileResult = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  throwIfError(profileResult);

  const membershipsResult = await supabase.from('tenant_members').select('tenant_id, role').eq('user_id', user.id);
  throwIfError(membershipsResult);
  const memberships = membershipsResult.data || [];
  const tenantIds = memberships.map((item) => item.tenant_id);
  if (!tenantIds.length) return { profile: profileFromRow(profileResult.data), tenants: [] };

  const tenantsResult = await supabase.from('tenants').select('*').in('id', tenantIds);
  throwIfError(tenantsResult);
  const roleByTenant = new Map(memberships.map((item) => [item.tenant_id, item.role]));
  const tenants = (tenantsResult.data || []).map((row) => tenantFromRow(row, roleByTenant.get(row.id)));

  const activityTypesResult = await supabase.from('activity_types').select('*').in('tenant_id', tenantIds);
  throwIfError(activityTypesResult);
  const cardsResult = await supabase.from('tenant_nfc_cards').select('*').in('tenant_id', tenantIds).is('deleted_at', null);
  throwIfError(cardsResult);
  const assignmentsResult = await supabase.from('card_assignments').select('*').in('tenant_id', tenantIds);
  throwIfError(assignmentsResult);
  const logsResult = await supabase.from('activity_logs').select('*').in('tenant_id', tenantIds).order('logged_at', { ascending: false }).limit(500);
  throwIfError(logsResult);
  const routinesResult = await supabase.from('routines').select('*').in('tenant_id', tenantIds);
  throwIfError(routinesResult);
  const routinePlansResult = await supabase.from('routine_plans').select('*').in('tenant_id', tenantIds).order('effective_from', { ascending: false });
  throwIfError(routinePlansResult);
  const routineRulesResult = await supabase.from('routine_progression_rules').select('*').in('tenant_id', tenantIds);
  throwIfError(routineRulesResult);
  const routineDailyLogsResult = await supabase.from('routine_daily_logs').select('*').in('tenant_id', tenantIds).order('date', { ascending: false }).limit(1000);
  throwIfError(routineDailyLogsResult);
  const routineLogEntriesResult = await supabase.from('routine_log_entries').select('*').in('tenant_id', tenantIds).order('entry_index', { ascending: true }).limit(3000);
  throwIfError(routineLogEntriesResult);

  const tagIds = Array.from(new Set((cardsResult.data || []).map((card) => card.tag_id).filter(Boolean)));
  let nfcTags = [];
  if (tagIds.length) {
    const tagsResult = await supabase.from('nfc_tags').select('*').in('id', tagIds);
    throwIfError(tagsResult);
    nfcTags = (tagsResult.data || []).map(nfcTagFromRow);
  }

  return {
    profile: profileFromRow(profileResult.data),
    tenants,
    activeTenantId: tenants[0]?.id || null,
    activityTypes: (activityTypesResult.data || []).map(activityTypeFromRow),
    nfcTags,
    tenantNfcCards: (cardsResult.data || []).map(tenantCardFromRow),
    cardAssignments: (assignmentsResult.data || []).map(assignmentFromRow),
    activityLogs: (logsResult.data || []).map(logFromRow),
    routines: (routinesResult.data || []).map(routineFromRow),
    routinePlans: (routinePlansResult.data || []).map(routinePlanFromRow),
    routineProgressionRules: (routineRulesResult.data || []).map(routineProgressionRuleFromRow),
    routineDailyLogs: (routineDailyLogsResult.data || []).map(routineDailyLogFromRow),
    routineLogEntries: (routineLogEntriesResult.data || []).map(routineLogEntryFromRow),
  };
}

export async function importLocalDataToSupabase({
  profile,
  tenants,
  activeTenantId,
  activityTypes,
  nfcTags,
  tenantNfcCards,
  cardAssignments,
  activityLogs,
  routines = [],
  routinePlans = [],
  routineProgressionRules = [],
  routineDailyLogs = [],
  routineLogEntries = [],
}) {
  if (!isSupabaseConfigured) throw new Error('Supabase env is not configured.');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const user = sessionData.session?.user;
  if (!user) throw new Error('No active Supabase session.');

  const resolvedProfile = profile ? { ...profile, id: user.id, email: user.email || profile.email } : { id: user.id, fullName: user.email || 'User', email: user.email, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  const tenant = tenants.find((item) => item.id === activeTenantId) || tenants[0];
  if (!tenant) throw new Error('No local tenant to import.');
  await pushBootstrapData({
    profile: resolvedProfile,
    tenant,
    activityTypes: activityTypes.filter((item) => item.tenantId === tenant.id),
  });

  const tenantCards = tenantNfcCards.filter((item) => item.tenantId === tenant.id);
  const tagIds = new Set(tenantCards.map((item) => item.tagId));
  const tenantAssignments = cardAssignments.filter((item) => item.tenantId === tenant.id);
  const tenantLogs = activityLogs.filter((item) => item.tenantId === tenant.id).map((log) => ({ ...log, userId: user.id }));
  const tenantRoutines = routines.filter((item) => item.tenantId === tenant.id);
  const tenantRoutinePlans = routinePlans.filter((item) => item.tenantId === tenant.id);
  const tenantRoutineRules = routineProgressionRules.filter((item) => item.tenantId === tenant.id);
  const tenantRoutineDailyLogs = routineDailyLogs.filter((item) => item.tenantId === tenant.id);
  const tenantRoutineLogEntries = routineLogEntries.filter((item) => item.tenantId === tenant.id);

  if (tagIds.size) throwIfError(await supabase.from('nfc_tags').upsert(nfcTags.filter((tag) => tagIds.has(tag.id)).map(nfcTagRow), { onConflict: 'uid_hash', ignoreDuplicates: true }));
  if (tenantCards.length) throwIfError(await supabase.from('tenant_nfc_cards').upsert(tenantCards.map(tenantCardRow), { onConflict: 'tenant_id,uid_hash' }));
  if (tenantAssignments.length) throwIfError(await supabase.from('card_assignments').upsert(tenantAssignments.map(assignmentRow), { onConflict: 'id' }));
  if (tenantLogs.length) throwIfError(await supabase.from('activity_logs').upsert(tenantLogs.map(logRow), { onConflict: 'id' }));
  if (tenantRoutines.length) throwIfError(await supabase.from('routines').upsert(tenantRoutines.map(routineRow), { onConflict: 'id' }));
  if (tenantRoutinePlans.length) throwIfError(await supabase.from('routine_plans').upsert(tenantRoutinePlans.map(routinePlanRow), { onConflict: 'id' }));
  if (tenantRoutineRules.length) throwIfError(await supabase.from('routine_progression_rules').upsert(tenantRoutineRules.map(routineProgressionRuleRow), { onConflict: 'id' }));
  if (tenantRoutineDailyLogs.length) throwIfError(await supabase.from('routine_daily_logs').upsert(tenantRoutineDailyLogs.map(routineDailyLogRow), { onConflict: 'routine_id,date' }));
  if (tenantRoutineLogEntries.length) throwIfError(await supabase.from('routine_log_entries').upsert(tenantRoutineLogEntries.map(routineLogEntryRow), { onConflict: 'daily_log_id,entry_index' }));
  return { imported: true, profile: resolvedProfile };
}

export async function syncQueueItems({ queue, markSyncQueueItem, markEntitySynced, markEntitySyncFailed }) {
  if (!isSupabaseConfigured) throw new Error('Supabase env is not configured.');
  const sessionResult = await supabase.auth.getSession();
  if (sessionResult.error) throw sessionResult.error;
  const authUserId = sessionResult.data.session?.user?.id || null;
  if (!authUserId) throw new Error('No active Supabase session.');
  const order = {
    nfc_tag: 1,
    card: 2,
    assignment: 3,
    routine: 4,
    routine_plan: 5,
    routine_rule: 6,
    routine_daily_log: 7,
    routine_log_entry: 8,
    activity_log: 9,
  };
  const pending = queue
    .filter((entry) => entry.status === 'pending' || entry.status === 'failed')
    .sort((a, b) => (order[a.entityType] || 99) - (order[b.entityType] || 99) || new Date(a.createdAt) - new Date(b.createdAt));
  for (const item of pending) {
    try {
      if (item.entityType === 'activity_log') {
        throwIfError(await supabase.from('activity_logs').upsert(logRow({ ...item.payload, userId: authUserId }), { onConflict: 'id' }));
      } else if (item.entityType === 'nfc_tag') {
        throwIfError(await supabase.from('nfc_tags').upsert(nfcTagRow(item.payload), { onConflict: 'uid_hash', ignoreDuplicates: true }));
      } else if (item.entityType === 'card') {
        if (item.operation === 'delete') {
          throwIfError(await supabase.from('tenant_nfc_cards').update({ deleted_at: new Date().toISOString(), status: 'disabled' }).eq('id', item.entityId));
        } else {
          throwIfError(await supabase.from('tenant_nfc_cards').upsert(tenantCardRow(item.payload), { onConflict: 'tenant_id,uid_hash' }));
        }
      } else if (item.entityType === 'assignment') {
        throwIfError(await supabase.from('card_assignments').upsert(assignmentRow(item.payload), { onConflict: 'id' }));
      } else if (item.entityType === 'routine') {
        const payload = item.payload || {};
        if (payload.routine) throwIfError(await supabase.from('routines').upsert(routineRow(payload.routine), { onConflict: 'id' }));
        if (payload.plan) throwIfError(await supabase.from('routine_plans').upsert(routinePlanRow(payload.plan), { onConflict: 'id' }));
        if (payload.progressionRule) throwIfError(await supabase.from('routine_progression_rules').upsert(routineProgressionRuleRow(payload.progressionRule), { onConflict: 'id' }));
        if (!payload.routine && !payload.plan && !payload.progressionRule) {
          throwIfError(await supabase.from('routines').upsert(routineRow(payload), { onConflict: 'id' }));
        }
      } else if (item.entityType === 'routine_plan') {
        throwIfError(await supabase.from('routine_plans').upsert(routinePlanRow(item.payload), { onConflict: 'id' }));
      } else if (item.entityType === 'routine_rule') {
        throwIfError(await supabase.from('routine_progression_rules').upsert(routineProgressionRuleRow(item.payload), { onConflict: 'id' }));
      } else if (item.entityType === 'routine_daily_log') {
        throwIfError(await supabase.from('routine_daily_logs').upsert(routineDailyLogRow(item.payload), { onConflict: 'routine_id,date' }));
      } else if (item.entityType === 'routine_log_entry') {
        throwIfError(await supabase.from('routine_log_entries').upsert(routineLogEntryRow(item.payload), { onConflict: 'daily_log_id,entry_index' }));
      } else {
        markSyncQueueItem(item.id, 'failed');
        continue;
      }
      markSyncQueueItem(item.id, 'synced');
      markEntitySynced?.(item.entityType, item.entityId);
    } catch (error) {
      if (isDuplicateConflict(error) && ['nfc_tag', 'card', 'assignment', 'routine', 'routine_plan', 'routine_rule', 'routine_daily_log', 'routine_log_entry'].includes(item.entityType)) {
        markSyncQueueItem(item.id, 'synced');
        markEntitySynced?.(item.entityType, item.entityId);
        continue;
      }
      markSyncQueueItem(item.id, 'failed');
      markEntitySyncFailed?.(item.entityType, item.entityId);
    }
  }
}
