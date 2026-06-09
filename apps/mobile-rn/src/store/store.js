const _zustand = require('zustand');
const { persist, createJSONStorage } = require('zustand/middleware');
let AsyncStorage = null;
try {
  const asyncStorageModule = require('@react-native-async-storage/async-storage');
  AsyncStorage = asyncStorageModule.default || asyncStorageModule;
} catch (_error) {
  AsyncStorage = null;
}
let create = null;
if (typeof _zustand === 'function') {
  create = _zustand;
} else if (_zustand && typeof _zustand.create === 'function') {
  create = _zustand.create;
} else if (_zustand && typeof _zustand.default === 'function') {
  create = _zustand.default;
} else {
  create = (_zustand && _zustand.default) ? _zustand.default : _zustand;
}
if (typeof create !== 'function') {
  throw new Error('Unable to initialize zustand create() from module. Check zustand version and imports.');
}

const now = () => new Date().toISOString();
const id = () => {
  const cryptoObject = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
  if (cryptoObject?.randomUUID) return cryptoObject.randomUUID();
  const bytes = new Array(16).fill(0).map(() => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
};
const toHexByte = (value) => Number(value || 0).toString(16).padStart(2, '0').toUpperCase();
const uidToString = (uid) => {
  if (Array.isArray(uid)) return uid.map(toHexByte).join('');
  if (uid instanceof Uint8Array) return Array.from(uid).map(toHexByte).join('');
  return String(uid || '').trim();
};

const uidHashFromMock = (mockUid) => `mock-hash-${mockUid}`;
const uidHashFromReal = (uid) => `nfc-hash-${uidToString(uid).toUpperCase().replace(/[^A-F0-9]/g, '') || uidToString(uid)}`;
const todayKey = (date = new Date()) => date.toISOString().slice(0, 10);
const SCAN_DEDUPE_MS = 2500;
const DEFAULT_WEIGHT_KG = 75;
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_INDEX_TO_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const nextDateByPolicy = (policy = 'today') => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  if (policy === 'next_week') {
    const day = date.getDay();
    const offset = day === 0 ? 1 : 8 - day;
    date.setDate(date.getDate() + offset);
  } else if (policy === 'next_month') {
    date.setMonth(date.getMonth() + 1, 1);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(String(policy))) {
    return policy;
  }
  return todayKey(date);
};
const weekStart = (date = new Date()) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  const day = next.getDay();
  next.setDate(next.getDate() - (day === 0 ? 6 : day - 1));
  return next;
};
const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const clampPositive = (value, fallback = 1) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const normalizeLookupText = (value) => String(value || '')
  .toLowerCase()
  .replace(/ı/g, 'i')
  .replace(/ş/g, 's')
  .replace(/ğ/g, 'g')
  .replace(/ü/g, 'u')
  .replace(/ö/g, 'o')
  .replace(/ç/g, 'c')
  .replace(/[^a-z0-9]+/g, '');
const routineCategoryFromActivity = (activity) => activity?.category === 'wellness' ? 'wellness' : 'exercise';
const targetTypeFromActivity = (activity, fallback = 'count_based') => {
  if (!activity) return fallback;
  if (activity.unit === 'reps') return fallback === 'set_based' ? 'set_based' : 'count_based';
  if (activity.unit === 'min' || activity.unit === 'hour') return 'duration_based';
  if (activity.unit === 'page') return 'page_based';
  return 'count_based';
};
const unitTypeFromActivity = (activity, targetType = 'count_based') => {
  if (targetType === 'set_based') return 'repetition';
  if (activity?.unit === 'page') return 'page';
  if (activity?.unit === 'min' || activity?.unit === 'hour') return 'minute';
  if (activity?.unit === 'reps') return 'repetition';
  return 'count';
};
const findActivityForRoutine = (activityTypes, routine) => {
  if (!routine) return null;
  const tenantActivities = activityTypes.filter((activity) => activity.tenantId === routine.tenantId);
  if (routine.activityTypeId) {
    const linked = tenantActivities.find((activity) => activity.id === routine.activityTypeId);
    if (linked) return linked;
  }
  const routineName = normalizeLookupText(routine.name);
  return tenantActivities.find((activity) => {
    const names = [activity.name, activity.displayNameTr, activity.displayNameEn].map(normalizeLookupText);
    if (names.includes(routineName)) return true;
    if ((routineName.includes('pushup') || routineName.includes('sinav')) && activity.name === 'push_ups') return true;
    if ((routineName.includes('kitap') || routineName.includes('reading')) && activity.name === 'book_reading') return true;
    return false;
  }) || null;
};
const targetTotalFromPlan = (plan) => {
  if (!plan) return 0;
  if (plan.targetType === 'completion') return 1;
  if (plan.targetType === 'set_based') return clampPositive(plan.targetSets, 1) * clampPositive(plan.targetRepsPerSet, 1);
  return clampPositive(plan.targetTotalUnits, 1);
};
const snapshotFromPlan = (plan) => {
  const plannedTotalUnits = targetTotalFromPlan(plan);
  return {
    target_type: plan.targetType,
    target_sets: plan.targetSets ?? null,
    target_reps_per_set: plan.targetRepsPerSet ?? null,
    target_total_units: plan.targetTotalUnits ?? plannedTotalUnits,
    blocks: plan.blocks ?? null,
    units_per_block: plan.unitsPerBlock ?? null,
    planned_total_units: plannedTotalUnits,
    minimum_success_percent: plan.minimumSuccessPercent ?? 80,
    unit_type: plan.unitType,
  };
};
const applyProgressionRule = (plan, rule, dateValue = todayKey()) => {
  if (!plan || !rule || rule.mode === 'none' || rule.isActive === false) return plan;
  const startDate = new Date(rule.startDate || plan.effectiveFrom || dateValue);
  const currentDate = new Date(dateValue);
  if (Number.isNaN(startDate.getTime()) || currentDate < startDate) return plan;
  const elapsedMs = currentDate.getTime() - startDate.getTime();
  const elapsedUnits = rule.mode === 'monthly'
    ? Math.max(0, (currentDate.getFullYear() - startDate.getFullYear()) * 12 + currentDate.getMonth() - startDate.getMonth() + 1)
    : Math.max(0, Math.floor(elapsedMs / (7 * 86400000)) + 1);
  const increase = elapsedUnits * clampPositive(rule.increaseAmount, 0);
  const next = { ...plan };
  if (rule.increaseUnit === 'reps_per_set') {
    next.targetRepsPerSet = Math.min(rule.maxTargetRepsPerSet || Infinity, clampPositive(plan.targetRepsPerSet, 1) + increase);
  } else if (rule.increaseUnit === 'sets') {
    next.targetSets = Math.min(rule.maxTargetSets || Infinity, clampPositive(plan.targetSets, 1) + increase);
  } else if (['pages_per_day', 'minutes_per_day', 'count_per_day'].includes(rule.increaseUnit)) {
    next.targetTotalUnits = Math.min(rule.maxTotalUnits || Infinity, clampPositive(plan.targetTotalUnits, 1) + increase);
  }
  return next;
};
const computeRoutineLogSummary = ({ plan, entries }) => {
  const plannedTotalUnits = targetTotalFromPlan(plan);
  const completedTotalUnits = entries.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
  const completedSetsCount = entries.filter((entry) => entry.entryType === 'set').length || null;
  const extraUnits = Math.max(completedTotalUnits - plannedTotalUnits, 0);
  const successPercent = plannedTotalUnits > 0 ? Math.round((completedTotalUnits / plannedTotalUnits) * 100) : 0;
  return {
    plannedTotalUnits,
    completedTotalUnits,
    completedSetsCount,
    extraUnits,
    successPercent,
    isSuccessful: successPercent >= (plan.minimumSuccessPercent ?? 80),
    isOverachieved: successPercent > 100,
  };
};
const workoutCategories = {
  push_ups: 'Chest',
  squats: 'Legs',
  bench_press: 'Chest',
  plank: 'Core',
  running: 'Cardio',
  walking: 'Cardio',
  jump_rope: 'Cardio',
  lunges: 'Legs',
  sit_ups: 'Core',
  burpees: 'Cardio',
  pull_ups: 'Back',
  cycling: 'Cardio',
  stretching: 'Stretching',
  yoga: 'Stretching',
};
const difficultyByName = {
  walking: 'easy',
  stretching: 'easy',
  yoga: 'easy',
  plank: 'medium',
  push_ups: 'medium',
  squats: 'medium',
  cycling: 'medium',
  running: 'hard',
  jump_rope: 'hard',
  burpees: 'hard',
  pull_ups: 'hard',
  bench_press: 'medium',
};
const intensityMultiplier = {
  low: 0.85,
  medium: 1,
  high: 1.18,
};
const getProfileWeight = (profile) => {
  const weight = Number(profile?.weightKg);
  return Number.isFinite(weight) && weight > 0 ? weight : DEFAULT_WEIGHT_KG;
};
const calculateCalories = (activity, value, profile) => {
  if (!activity?.caloriesPerUnit) return null;
  const weightFactor = getProfileWeight(profile) / DEFAULT_WEIGHT_KG;
  const intensity = intensityMultiplier[activity.intensity || 'medium'] || 1;
  return Math.round(value * activity.caloriesPerUnit * weightFactor * intensity);
};
const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};
const localStorageProvider = () => {
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return AsyncStorage || noopStorage;
};

const readInitialPersistedState = () => {
  try {
    if (typeof globalThis === 'undefined' || !globalThis.localStorage) return {};
    const raw = globalThis.localStorage.getItem('ritim-phase-1-store');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed?.state || {};
  } catch (_error) {
    return {};
  }
};

const initialPersistedState = readInitialPersistedState();
const DEMO_MOCK_CARDS = [
  { mockUid: 'MOCK-TAG-001', cardName: 'Push-up Tag', activityName: 'push_ups', dailyGoal: 100 },
  { mockUid: 'MOCK-TAG-002', cardName: 'Water Bottle', activityName: 'water', dailyGoal: 2500 },
  { mockUid: 'MOCK-TAG-003', cardName: 'Meditation Corner', activityName: 'meditation', dailyGoal: 20 },
];

function seedActivityTypes(tenantId) {
  const t = now();
  const make = (data) => ({
    id: id('act-'),
    tenantId,
    ...data,
    workoutCategory: data.category === 'fitness' ? workoutCategories[data.name] || 'Cardio' : null,
    muscleGroup: data.category === 'fitness' ? workoutCategories[data.name] || null : null,
    difficulty: data.category === 'fitness' ? difficultyByName[data.name] || 'medium' : null,
    intensity: data.category === 'fitness' ? (difficultyByName[data.name] === 'hard' ? 'high' : 'medium') : null,
    trackingMode: data.unit === 'reps' ? 'reps' : data.unit === 'set' ? 'sets' : 'duration',
    description: data.description || null,
    isActive: true,
    isCustom: false,
    createdAt: t,
    updatedAt: t,
  });

  const fitness = [
    make({ category: 'fitness', name: 'push_ups', displayNameTr: 'Şınav', displayNameEn: 'Push-ups', unit: 'reps', defaultIncrement: 10, icon: 'push_up', color: '#35E27A', caloriesPerUnit: 0.32 }),
    make({ category: 'fitness', name: 'squats', displayNameTr: 'Squat', displayNameEn: 'Squats', unit: 'reps', defaultIncrement: 20, icon: 'squat', color: '#35E27A', caloriesPerUnit: 0.32 }),
    make({ category: 'fitness', name: 'bench_press', displayNameTr: 'Bench Press', displayNameEn: 'Bench Press', unit: 'reps', defaultIncrement: 10, icon: 'bench_press', color: '#35E27A', caloriesPerUnit: 0.45, description: 'Chest strength exercise.' }),
    make({ category: 'fitness', name: 'plank', displayNameTr: 'Plank', displayNameEn: 'Plank', unit: 'min', defaultIncrement: 1, icon: 'plank', color: '#37B7FF', caloriesPerUnit: 4.1 }),
    make({ category: 'fitness', name: 'running', displayNameTr: 'Koşu', displayNameEn: 'Running', unit: 'min', defaultIncrement: 10, icon: 'running', color: '#37B7FF', caloriesPerUnit: 8.0 }),
    make({ category: 'fitness', name: 'walking', displayNameTr: 'Yürüyüş', displayNameEn: 'Walking', unit: 'min', defaultIncrement: 10, icon: 'walking', color: '#37B7FF', caloriesPerUnit: 4.0 }),
    make({ category: 'fitness', name: 'jump_rope', displayNameTr: 'İp Atlama', displayNameEn: 'Jump Rope', unit: 'min', defaultIncrement: 5, icon: 'jump_rope', color: '#35E27A', caloriesPerUnit: 10.0 }),
    make({ category: 'fitness', name: 'lunges', displayNameTr: 'Lunges', displayNameEn: 'Lunges', unit: 'reps', defaultIncrement: 10, icon: 'lunges', color: '#35E27A', caloriesPerUnit: 0.30 }),
    make({ category: 'fitness', name: 'sit_ups', displayNameTr: 'Sit-up', displayNameEn: 'Sit-ups', unit: 'reps', defaultIncrement: 10, icon: 'sit_up', color: '#35E27A', caloriesPerUnit: 0.25 }),
    make({ category: 'fitness', name: 'burpees', displayNameTr: 'Burpee', displayNameEn: 'Burpees', unit: 'reps', defaultIncrement: 10, icon: 'burpee', color: '#9B5CFF', caloriesPerUnit: 0.50 }),
    make({ category: 'fitness', name: 'pull_ups', displayNameTr: 'Pull-up', displayNameEn: 'Pull-ups', unit: 'reps', defaultIncrement: 5, icon: 'pull_up', color: '#35E27A', caloriesPerUnit: 0.50 }),
    make({ category: 'fitness', name: 'cycling', displayNameTr: 'Bisiklet', displayNameEn: 'Cycling', unit: 'min', defaultIncrement: 10, icon: 'cycling', color: '#37B7FF', caloriesPerUnit: 7.0 }),
    make({ category: 'fitness', name: 'stretching', displayNameTr: 'Esneme', displayNameEn: 'Stretching', unit: 'min', defaultIncrement: 10, icon: 'stretching', color: '#9B5CFF', caloriesPerUnit: 2.0 }),
    make({ category: 'fitness', name: 'yoga', displayNameTr: 'Yoga', displayNameEn: 'Yoga', unit: 'min', defaultIncrement: 15, icon: 'yoga', color: '#9B5CFF', caloriesPerUnit: 3.0 }),
  ];

  const wellness = [
    make({ category: 'wellness', name: 'water', displayNameTr: 'Su', displayNameEn: 'Water', unit: 'ml', defaultIncrement: 500, icon: 'water', color: '#37B7FF', caloriesPerUnit: null }),
    make({ category: 'wellness', name: 'coffee', displayNameTr: 'Kahve', displayNameEn: 'Coffee', unit: 'cup', defaultIncrement: 1, icon: 'coffee', color: '#A56B42', caloriesPerUnit: null }),
    make({ category: 'wellness', name: 'book_reading', displayNameTr: 'Kitap Okuma', displayNameEn: 'Reading', unit: 'page', defaultIncrement: 20, icon: 'book', color: '#9B5CFF', caloriesPerUnit: null }),
    make({ category: 'wellness', name: 'english', displayNameTr: 'İngilizce', displayNameEn: 'English', unit: 'min', defaultIncrement: 15, icon: 'book', color: '#37B7FF', caloriesPerUnit: null }),
    make({ category: 'wellness', name: 'french', displayNameTr: 'Fransızca', displayNameEn: 'French', unit: 'min', defaultIncrement: 15, icon: 'book', color: '#37B7FF', caloriesPerUnit: null }),
    make({ category: 'wellness', name: 'turkish_diction', displayNameTr: 'Türkçe Diksiyon', displayNameEn: 'Turkish Diction', unit: 'min', defaultIncrement: 10, icon: 'book', color: '#9B5CFF', caloriesPerUnit: null }),
    make({ category: 'wellness', name: 'education_video', displayNameTr: 'Eğitim Videosu', displayNameEn: 'Education Video', unit: 'min', defaultIncrement: 20, icon: 'book', color: '#37B7FF', caloriesPerUnit: null }),
    make({ category: 'wellness', name: 'meditation', displayNameTr: 'Meditasyon', displayNameEn: 'Meditation', unit: 'min', defaultIncrement: 10, icon: 'meditation', color: '#9B5CFF', caloriesPerUnit: null }),
    make({ category: 'wellness', name: 'vitamins', displayNameTr: 'Vitamin', displayNameEn: 'Vitamins', unit: 'tablet', defaultIncrement: 1, icon: 'vitamins', color: '#9B5CFF', caloriesPerUnit: null }),
    make({ category: 'wellness', name: 'breathing', displayNameTr: 'Nefes Egzersizi', displayNameEn: 'Breathing', unit: 'min', defaultIncrement: 5, icon: 'breathing', color: '#37B7FF', caloriesPerUnit: null }),
    make({ category: 'wellness', name: 'walk_break', displayNameTr: 'Yürüyüş Molası', displayNameEn: 'Walk Break', unit: 'min', defaultIncrement: 10, icon: 'walk_break', color: '#35E27A', caloriesPerUnit: null }),
    make({ category: 'wellness', name: 'sleep', displayNameTr: 'Uyku', displayNameEn: 'Sleep', unit: 'hour', defaultIncrement: 1, icon: 'sleep', color: '#9B5CFF', caloriesPerUnit: null }),
    make({ category: 'wellness', name: 'stretch_break', displayNameTr: 'Esneme Molası', displayNameEn: 'Stretch Break', unit: 'min', defaultIncrement: 5, icon: 'stretch_break', color: '#9B5CFF', caloriesPerUnit: null }),
    make({ category: 'wellness', name: 'healthy_meal', displayNameTr: 'Sağlıklı Öğün', displayNameEn: 'Healthy Meal', unit: 'meal', defaultIncrement: 1, icon: 'healthy_meal', color: '#35E27A', caloriesPerUnit: null }),
    make({ category: 'wellness', name: 'steps', displayNameTr: 'Adım', displayNameEn: 'Steps', unit: 'steps', defaultIncrement: 1000, icon: 'steps', color: '#9B5CFF', caloriesPerUnit: null }),
    make({ category: 'wellness', name: 'weight', displayNameTr: 'Kilo', displayNameEn: 'Weight', unit: 'kg', defaultIncrement: 1, icon: 'weight', color: '#9B5CFF', caloriesPerUnit: null }),
    make({ category: 'wellness', name: 'daily_note', displayNameTr: 'Günlük Not', displayNameEn: 'Daily Note', unit: 'note', defaultIncrement: 1, icon: 'note', color: '#9B5CFF', caloriesPerUnit: null }),
  ];

  return [...fitness, ...wellness];
}

const useStore = create(persist((set, get) => ({
  profile: initialPersistedState.profile || null,
  authUserId: initialPersistedState.authUserId || null,
  tenants: initialPersistedState.tenants || [],
  activeTenantId: initialPersistedState.activeTenantId || null,
  activityTypes: initialPersistedState.activityTypes || [],
  trackedActivityTypeIds: initialPersistedState.trackedActivityTypeIds || [],
  activityDailyGoals: initialPersistedState.activityDailyGoals || [],
  nfcTags: initialPersistedState.nfcTags || [],
  tenantNfcCards: initialPersistedState.tenantNfcCards || [],
  cardAssignments: initialPersistedState.cardAssignments || [],
  activityLogs: initialPersistedState.activityLogs || [],
  nfcDeepLinkEvents: initialPersistedState.nfcDeepLinkEvents || [],
  devToolsEnabled: initialPersistedState.devToolsEnabled || false,
  dashboardActivityOrder: initialPersistedState.dashboardActivityOrder || [],
  routines: initialPersistedState.routines || [],
  routineItems: initialPersistedState.routineItems || [],
  routinePlans: initialPersistedState.routinePlans || [],
  routineProgressionRules: initialPersistedState.routineProgressionRules || [],
  routineDailyLogs: initialPersistedState.routineDailyLogs || [],
  routineLogEntries: initialPersistedState.routineLogEntries || [],
  challenges: initialPersistedState.challenges || [],
  challengeParticipants: initialPersistedState.challengeParticipants || [],
  syncQueue: initialPersistedState.syncQueue || [],
  nfcAdapter: initialPersistedState.nfcAdapter || { mode: 'native', status: 'ready', lastError: null },
  feedbackSettings: initialPersistedState.feedbackSettings || { soundEnabled: true, hapticEnabled: true },

  // Actions
  createProfile: (fullName, email, details = {}) => {
    const p = { ...details, id: details.id || id('u-'), fullName, email, createdAt: now(), updatedAt: now() };
    set({ profile: p });
    return p;
  },

  updateProfile: (updates) => {
    set((s) => ({ profile: s.profile ? { ...s.profile, ...updates, updatedAt: now() } : s.profile }));
  },

  setAuthUserId: (authUserId) => set({ authUserId }),

  createTenant: (name, type = 'personal', role = 'tenant_owner') => {
    const t = { id: id('t-'), name, slug: name.toLowerCase().replace(/\s+/g,'-'), type, role, createdAt: now(), updatedAt: now() };
    const types = seedActivityTypes(t.id);
    set((s) => ({ tenants: [t, ...s.tenants], activityTypes: [...types, ...s.activityTypes] }));
    return t;
  },

  setActiveTenant: (tenantId) => set({ activeTenantId: tenantId }),

  updateTenant: (tenantId, updates) => {
    const updatedAt = now();
    set((s) => ({
      tenants: s.tenants.map((tenant) => tenant.id === tenantId ? { ...tenant, ...updates, updatedAt } : tenant),
    }));
  },

  seedDefaultActivityTypes: (tenantId) => {
    const existing = get().activityTypes.filter((a) => a.tenantId === tenantId);
    const types = seedActivityTypes(tenantId);
    const missing = types.filter((type) => !existing.find((item) => item.name === type.name && item.category === type.category));
    if (!missing.length) return existing;
    set((s) => ({ activityTypes: [...missing, ...s.activityTypes] }));
    return [...missing, ...existing];
  },

  getActivityTypesByCategory: (category) => {
    const active = get().activeTenantId;
    return get().activityTypes.filter((a) => a.tenantId === active && a.category === category);
  },

  toggleTrackedActivityType: (activityTypeId) => {
    set((s) => ({
      trackedActivityTypeIds: s.trackedActivityTypeIds.includes(activityTypeId)
        ? s.trackedActivityTypeIds.filter((id_) => id_ !== activityTypeId)
        : [activityTypeId, ...s.trackedActivityTypeIds],
    }));
  },

  setActivityDailyGoal: (tenantId, activityTypeId, dailyGoal) => {
    const parsedGoal = Number(dailyGoal);
    if (!tenantId || !activityTypeId || !Number.isFinite(parsedGoal) || parsedGoal <= 0) return null;
    const updatedAt = now();
    let updatedGoal = null;
    set((s) => {
      const existing = s.activityDailyGoals.find((goal) => goal.tenantId === tenantId && goal.activityTypeId === activityTypeId);
      if (existing) {
        updatedGoal = { ...existing, dailyGoal: parsedGoal, updatedAt };
        return {
          activityDailyGoals: s.activityDailyGoals.map((goal) => goal.id === existing.id ? updatedGoal : goal),
        };
      }
      updatedGoal = {
        id: id('goal-'),
        tenantId,
        activityTypeId,
        dailyGoal: parsedGoal,
        createdAt: updatedAt,
        updatedAt,
      };
      return { activityDailyGoals: [updatedGoal, ...s.activityDailyGoals] };
    });
    return updatedGoal;
  },

  getTrackedActivitiesByCategory: (category) => {
    const active = get().activeTenantId;
    const tracked = new Set(get().trackedActivityTypeIds);
    return get().activityTypes.filter((activity) => activity.tenantId === active && activity.category === category && tracked.has(activity.id));
  },

  createMockNfcTag: (mockUid) => {
    const uidHash = uidHashFromMock(mockUid);
    return get().createNfcTagFromScan({ uid: mockUid, uidHash, source: 'mock' });
  },

  createNfcTagFromScan: ({ uid, uidHash, source = 'nfc' }) => {
    const resolvedUidHash = uidHash || (source === 'mock' ? uidHashFromMock(uid) : uidHashFromReal(uid));
    const existing = get().nfcTags.find((t) => t.uidHash === resolvedUidHash);
    if (existing) {
      const updated = {
        ...existing,
        mockUid: source === 'mock' ? (existing.mockUid || uid) : existing.mockUid,
        publicTagCode: existing.publicTagCode || String(uid || '').slice(-12),
        lastSeenAt: now(),
      };
      set((s) => ({ nfcTags: s.nfcTags.map((t) => t.id === updated.id ? updated : t) }));
      return updated;
    }
    const tag = {
      id: id('tag-'),
      uidHash: resolvedUidHash,
      mockUid: source === 'mock' ? uid : undefined,
      publicTagCode: source === 'mock' ? String(uid || '').replace('MOCK-', '') : String(uid || '').slice(-12),
      status: 'active',
      firstSeenAt: now(),
      lastSeenAt: now(),
    };
    set((s) => ({ nfcTags: [tag, ...s.nfcTags] }));
    get().addSyncQueueItem({ entityType: 'nfc_tag', entityId: tag.id, payload: tag });
    return tag;
  },

  createTenantNfcCard: ({ tenantId, tagId, uidHash, cardName, category }) => {
    const existing = get().tenantNfcCards.find((card) => card.tenantId === tenantId && card.uidHash === uidHash);
    if (existing) {
      const updated = { ...existing, tagId: tagId || existing.tagId, cardName, category, status: 'active', updatedAt: now() };
      set((s) => ({ tenantNfcCards: s.tenantNfcCards.map((card) => card.id === existing.id ? updated : card) }));
      get().addSyncQueueItem({ entityType: 'card', entityId: updated.id, payload: updated });
      return updated;
    }
    const card = { id: id('card-'), tenantId, tagId, uidHash, cardName, category, status: 'active', createdAt: now(), updatedAt: now() };
    set((s) => ({ tenantNfcCards: [card, ...s.tenantNfcCards] }));
    get().addSyncQueueItem({ entityType: 'card', entityId: card.id, payload: card });
    return card;
  },

  createCardAssignment: ({ tenantId, tenantCardId, activityTypeId, incrementValue, unit, dailyGoal }) => {
    const asg = { id: id('asg-'), tenantId, tenantCardId, activityTypeId, incrementValue, unit, dailyGoal: dailyGoal ?? null, isActive: true, createdAt: now(), updatedAt: now() };
    set((s) => ({ cardAssignments: [asg, ...s.cardAssignments] }));
    get().addSyncQueueItem({ entityType: 'assignment', entityId: asg.id, payload: asg });
    return asg;
  },

  updateTenantNfcCard: (cardId, updates) => {
    const updatedAt = now();
    let updatedCard = null;
    set((s) => ({
      tenantNfcCards: s.tenantNfcCards.map((card) => {
        if (card.id !== cardId) return card;
        updatedCard = { ...card, ...updates, updatedAt };
        return updatedCard;
      }),
    }));
    if (updatedCard) get().addSyncQueueItem({ entityType: 'card', entityId: cardId, payload: updatedCard });
  },

  updateCardAssignment: (assignmentId, updates) => {
    const updatedAt = now();
    let updatedAssignment = null;
    set((s) => ({
      cardAssignments: s.cardAssignments.map((assignment) => {
        if (assignment.id !== assignmentId) return assignment;
        updatedAssignment = { ...assignment, ...updates, updatedAt };
        return updatedAssignment;
      }),
    }));
    if (updatedAssignment) get().addSyncQueueItem({ entityType: 'assignment', entityId: assignmentId, payload: updatedAssignment });
  },

  setCardStatus: (cardId, status) => {
    get().updateTenantNfcCard(cardId, { status });
  },

  deleteTenantNfcCard: (cardId) => {
    const card = get().tenantNfcCards.find((item) => item.id === cardId);
    set((s) => ({
      tenantNfcCards: s.tenantNfcCards.filter((item) => item.id !== cardId),
      cardAssignments: s.cardAssignments.filter((assignment) => assignment.tenantCardId !== cardId),
    }));
    if (card) get().addSyncQueueItem({ entityType: 'card', entityId: cardId, operation: 'delete', payload: { id: cardId, tenantId: card.tenantId } });
  },

  addSyncQueueItem: ({ entityType, entityId, operation = 'upsert', payload }) => {
    const item = {
      id: id('sync-'),
      tenantId: get().activeTenantId,
      entityType,
      entityId,
      operation,
      payload,
      status: 'pending',
      attempts: 0,
      createdAt: now(),
      updatedAt: now(),
    };
    set((s) => ({ syncQueue: [item, ...s.syncQueue] }));
    return item;
  },

  markSyncQueueItem: (syncItemId, status) => {
    set((s) => ({
      syncQueue: s.syncQueue.map((item) => item.id === syncItemId ? { ...item, status, attempts: item.attempts + 1, updatedAt: now() } : item),
    }));
  },

  markEntitySynced: (entityType, entityId) => {
    if (entityType === 'activity_log') {
      set((s) => ({
        activityLogs: s.activityLogs.map((log) => log.id === entityId ? { ...log, syncStatus: 'synced' } : log),
      }));
    }
  },

  markEntitySyncFailed: (entityType, entityId) => {
    if (entityType === 'activity_log') {
      set((s) => ({
        activityLogs: s.activityLogs.map((log) => log.id === entityId ? { ...log, syncStatus: 'failed' } : log),
      }));
    }
  },

  markAllSyncedForTenant: (tenantId) => {
    set((s) => ({
      activityLogs: s.activityLogs.map((log) => log.tenantId === tenantId ? { ...log, syncStatus: 'synced' } : log),
      syncQueue: s.syncQueue.map((item) => (!tenantId || item.tenantId === tenantId) ? { ...item, status: 'synced', updatedAt: now() } : item),
    }));
  },

  claimLocalDataForUser: (user) => {
    if (!user?.id) return;
    set((s) => {
      const previousProfileId = s.profile?.id;
      return {
        profile: s.profile ? { ...s.profile, id: user.id, email: user.email || s.profile.email, updatedAt: now() } : s.profile,
        activityLogs: s.activityLogs.map((log) => (!log.userId || log.userId === 'local-user' || log.userId === previousProfileId) ? { ...log, userId: user.id, syncStatus: log.syncStatus === 'synced' ? 'synced' : 'pending' } : log),
        syncQueue: s.syncQueue.map((item) => item.entityType === 'activity_log' && item.payload
          ? { ...item, payload: { ...item.payload, userId: user.id } }
          : item),
      };
    });
  },

  hydrateRemoteData: ({
    profile,
    tenants,
    activeTenantId,
    activityTypes,
    nfcTags,
    tenantNfcCards,
    cardAssignments,
    activityLogs,
    routines,
    routinePlans,
    routineProgressionRules,
    routineDailyLogs,
    routineLogEntries,
  }) => {
    set((s) => {
      const mergeById = (localItems, remoteItems) => {
        const map = new Map(localItems.map((item) => [item.id, item]));
        remoteItems.forEach((item) => map.set(item.id, { ...(map.get(item.id) || {}), ...item }));
        return Array.from(map.values());
      };
      const nextTenants = mergeById(s.tenants, tenants || []);
      return {
        profile: profile || s.profile,
        authUserId: profile?.id || s.authUserId || null,
        tenants: nextTenants,
        activeTenantId: activeTenantId || s.activeTenantId || nextTenants[0]?.id || null,
        activityTypes: mergeById(s.activityTypes, activityTypes || []),
        nfcTags: mergeById(s.nfcTags, nfcTags || []),
        tenantNfcCards: mergeById(s.tenantNfcCards, tenantNfcCards || []),
        cardAssignments: mergeById(s.cardAssignments, cardAssignments || []),
        activityLogs: mergeById(s.activityLogs, activityLogs || []),
        routines: mergeById(s.routines, routines || []),
        routinePlans: mergeById(s.routinePlans, routinePlans || []),
        routineProgressionRules: mergeById(s.routineProgressionRules, routineProgressionRules || []),
        routineDailyLogs: mergeById(s.routineDailyLogs, routineDailyLogs || []),
        routineLogEntries: mergeById(s.routineLogEntries, routineLogEntries || []),
      };
    });
  },

  createActivityLog: ({ tenantId, userId, activityTypeId, value, source = 'manual', tagId, tenantCardId }) => {
    const activity = get().activityTypes.find((t) => t.id === activityTypeId);
    if (!activity) return null;
    const scannedAt = Date.now();
    const shouldDedupeScan = (source === 'nfc' || source === 'mock_nfc') && (tenantCardId || tagId);
    if (shouldDedupeScan) {
      const duplicate = get().activityLogs.find((log) => (
        log.tenantId === tenantId &&
        log.activityTypeId === activityTypeId &&
        log.source === source &&
        (tenantCardId ? log.tenantCardId === tenantCardId : log.tagId === tagId) &&
        scannedAt - new Date(log.createdAt || log.loggedAt).getTime() < SCAN_DEDUPE_MS
      ));
      if (duplicate) return { ...duplicate, deduped: true };
    }
    const calories = calculateCalories(activity, value, get().profile);
    const log = {
      id: id('log-'),
      tenantId,
      userId: userId || get().authUserId || get().profile?.id || 'local-user',
      tagId,
      tenantCardId,
      activityTypeId,
      category: activity.category,
      value,
      unit: activity.unit,
      calories,
      source,
      syncStatus: 'pending',
      loggedAt: now(),
      createdAt: now(),
    };
    set((s) => ({ activityLogs: [log, ...s.activityLogs] }));
    get().applyActivityLogToRoutineDailyLog(log);
    get().addSyncQueueItem({ entityType: 'activity_log', entityId: log.id, payload: log });
    return log;
  },

  recalculateRoutineDailyLog: (dailyLogId) => {
    const dailyLog = get().routineDailyLogs.find((item) => item.id === dailyLogId);
    if (!dailyLog) return null;
    const plan = {
      targetType: dailyLog.planSnapshot.target_type,
      targetSets: dailyLog.planSnapshot.target_sets,
      targetRepsPerSet: dailyLog.planSnapshot.target_reps_per_set,
      targetTotalUnits: dailyLog.planSnapshot.target_total_units,
      unitType: dailyLog.planSnapshot.unit_type,
      minimumSuccessPercent: dailyLog.planSnapshot.minimum_success_percent,
    };
    const entries = get().routineLogEntries
      .filter((entry) => entry.dailyLogId === dailyLog.id)
      .sort((a, b) => a.entryIndex - b.entryIndex)
      .map((entry, index) => ({ ...entry, entryIndex: index + 1 }));
    const summary = computeRoutineLogSummary({ plan, entries });
    const updatedLog = { ...dailyLog, ...summary, updatedAt: now() };
    set((s) => ({
      routineLogEntries: [
        ...entries,
        ...s.routineLogEntries.filter((entry) => entry.dailyLogId !== dailyLog.id),
      ],
      routineDailyLogs: s.routineDailyLogs.map((log) => log.id === dailyLog.id ? updatedLog : log),
    }));
    get().addSyncQueueItem({ entityType: 'routine_daily_log', entityId: updatedLog.id, payload: updatedLog });
    return updatedLog;
  },

  undoActivityLog: (activityLogId) => {
    const log = get().activityLogs.find((item) => item.id === activityLogId);
    if (!log) return null;
    const affectedDailyLogIds = [...new Set(
      get().routineLogEntries
        .filter((entry) => entry.sourceActivityLogId === activityLogId)
        .map((entry) => entry.dailyLogId)
    )];
    set((s) => ({
      activityLogs: s.activityLogs.filter((item) => item.id !== activityLogId),
      routineLogEntries: s.routineLogEntries.filter((entry) => entry.sourceActivityLogId !== activityLogId),
      nfcDeepLinkEvents: s.nfcDeepLinkEvents.map((event) => event.activityLogId === activityLogId ? { ...event, activityLogId: null, syncStatus: 'pending', updatedAt: now() } : event),
    }));
    affectedDailyLogIds.forEach((dailyLogId) => get().recalculateRoutineDailyLog(dailyLogId));
    get().addSyncQueueItem({ entityType: 'activity_log', entityId: activityLogId, operation: 'delete', payload: { id: activityLogId, deletedAt: now() } });
    return log;
  },

  seedDemoCardsForTenant: (tenantId) => {
    const activityTypes = get().activityTypes.filter((a) => a.tenantId === tenantId);
    if (!tenantId || !activityTypes.length) return [];

    const createdCards = [];
    DEMO_MOCK_CARDS.forEach((demo) => {
      const activity = activityTypes.find((a) => a.name === demo.activityName);
      if (!activity) return;

      const tag = get().createMockNfcTag(demo.mockUid);
      const existingCard = get().tenantNfcCards.find((c) => c.tenantId === tenantId && c.uidHash === tag.uidHash);
      if (existingCard) return;

      const card = get().createTenantNfcCard({
        tenantId,
        tagId: tag.id,
        uidHash: tag.uidHash,
        cardName: demo.cardName,
        category: activity.category,
      });
      get().createCardAssignment({
        tenantId,
        tenantCardId: card.id,
        activityTypeId: activity.id,
        incrementValue: activity.defaultIncrement,
        unit: activity.unit,
        dailyGoal: demo.dailyGoal,
      });
      createdCards.push(card);
    });

    return createdCards;
  },

  logActivityFromMockScan: ({ tenantId, userId, mockUid, valueOverride }) => {
    const uidHash = uidHashFromMock(mockUid);
    return get().logActivityFromUidHash({ tenantId, userId, uidHash, source: 'mock_nfc', valueOverride });
  },

  logActivityFromUidHash: ({ tenantId, userId, uidHash, source = 'nfc', valueOverride }) => {
    const tenantCard = get().tenantNfcCards.find((c) => c.tenantId === tenantId && c.uidHash === uidHash);
    if (!tenantCard) return null;
    if (tenantCard.status !== 'active' && tenantCard.status !== 'assigned') return null;
    const assignment = get().cardAssignments.find((a) => a.tenantCardId === tenantCard.id && a.tenantId === tenantId);
    if (!assignment) return null;

    const activity = get().activityTypes.find((t) => t.id === assignment.activityTypeId);
    const value = typeof valueOverride === 'number' ? valueOverride : assignment.incrementValue;
    const calories = calculateCalories(activity, value, get().profile);
    const scannedAt = Date.now();
    const duplicate = get().activityLogs.find((log) => (
      log.tenantId === tenantId &&
      log.tenantCardId === tenantCard.id &&
      log.activityTypeId === assignment.activityTypeId &&
      log.source === source &&
      scannedAt - new Date(log.createdAt || log.loggedAt).getTime() < SCAN_DEDUPE_MS
    ));
    if (duplicate) return { ...duplicate, deduped: true };

    const log = {
      id: id('log-'),
      tenantId,
      userId: userId || get().authUserId || get().profile?.id || 'local-user',
      tagId: tenantCard.tagId,
      tenantCardId: tenantCard.id,
      activityTypeId: assignment.activityTypeId,
      category: tenantCard.category,
      value,
      unit: assignment.unit,
      calories,
      source,
      syncStatus: 'pending',
      loggedAt: now(),
      createdAt: now(),
    };

    set((s) => ({ activityLogs: [log, ...s.activityLogs] }));
    get().applyActivityLogToRoutineDailyLog(log);
    get().addSyncQueueItem({ entityType: 'activity_log', entityId: log.id, payload: log });
    return log;
  },

  getNfcCardByTagCode: (tagCode) => {
    const active = get().activeTenantId;
    return get().tenantNfcCards.find((card) => card.tenantId === active && card.tagCode === tagCode) || null;
  },

  logActivityFromTagCode: ({ tenantId, userId, tagCode }) => {
    const tenantCard = get().tenantNfcCards.find((card) => card.tenantId === tenantId && card.tagCode === tagCode);
    if (!tenantCard) return { status: 'unknown', tagCode };
    if (tenantCard.status === 'unassigned') return { status: 'unassigned', card: tenantCard, tagCode };
    if (tenantCard.status === 'disabled' || tenantCard.status === 'lost') return { status: tenantCard.status, card: tenantCard, tagCode };

    const assignment = get().cardAssignments.find((item) => item.tenantCardId === tenantCard.id && item.tenantId === tenantId && item.isActive !== false);
    if (!assignment) return { status: 'unassigned', card: tenantCard, tagCode };

    const log = get().createActivityLog({
      tenantId,
      userId,
      activityTypeId: assignment.activityTypeId,
      value: assignment.incrementValue,
      source: 'nfc',
      tenantCardId: tenantCard.id,
      tagId: tenantCard.tagId,
    });
    const event = {
      eventId: id('evt-'),
      tagCode,
      shortcutId: assignment.id,
      actionType: 'activity_log',
      createdAt: now(),
      source: 'nfc',
      syncStatus: 'pending',
      activityLogId: log?.id || null,
    };
    set((s) => ({ nfcDeepLinkEvents: [event, ...s.nfcDeepLinkEvents] }));
    return { status: 'logged', card: tenantCard, assignment, log, event };
  },

  applyActivityLogToRoutineDailyLog: (log) => {
    if (!log?.activityTypeId || log.deduped) return [];
    const date = todayKey(new Date(log.loggedAt || log.createdAt || now()));
    const activityTypes = get().activityTypes;
    const routinesForActivity = get().routines.filter((routine) => (
      routine.tenantId === log.tenantId &&
      routine.isActive !== false &&
      (
        routine.activityTypeId === log.activityTypeId ||
        findActivityForRoutine(activityTypes, routine)?.id === log.activityTypeId
      ) &&
      get().isRoutinePlannedForDate(routine.id, date)
    ));
    const repairedRoutines = routinesForActivity.filter((routine) => routine.activityTypeId !== log.activityTypeId);
    if (repairedRoutines.length) {
      set((s) => ({
        routines: s.routines.map((routine) => {
          const repaired = repairedRoutines.find((item) => item.id === routine.id);
          return repaired ? { ...routine, activityTypeId: log.activityTypeId, updatedAt: now() } : routine;
        }),
      }));
      repairedRoutines.forEach((routine) => {
        get().addSyncQueueItem({ entityType: 'routine', entityId: routine.id, payload: { ...routine, activityTypeId: log.activityTypeId, updatedAt: now() } });
      });
    }
    return routinesForActivity.map((routine) => {
      const dailyLog = get().getOrCreateRoutineDailyLog(routine.id, date);
      if (!dailyLog) return null;
      const existingEntries = get().routineLogEntries
        .filter((entry) => entry.dailyLogId === dailyLog.id)
        .sort((a, b) => a.entryIndex - b.entryIndex);
      if (existingEntries.some((entry) => entry.sourceActivityLogId === log.id)) return { dailyLog, entries: existingEntries };
      const targetType = dailyLog.planSnapshot?.target_type || routine.targetType;
      const entryType = targetType === 'set_based' ? 'set' : targetType === 'page_based' || targetType === 'duration_based' ? 'block' : 'manual';
      return get().upsertRoutineLogEntries({
        routineId: routine.id,
        date,
        entries: [
          ...existingEntries,
          {
            entryType,
            value: log.value,
            sourceActivityLogId: log.id,
          },
        ],
      });
    }).filter(Boolean);
  },

  repairRoutineActivityLinks: (tenantId) => {
    if (!tenantId) return [];
    get().seedDefaultActivityTypes(tenantId);
    const activityTypes = get().activityTypes;
    const repaired = [];
    const nextRoutines = get().routines.map((routine) => {
      if (routine.tenantId !== tenantId) return routine;
      const activity = findActivityForRoutine(activityTypes, routine);
      if (!activity) return routine;
      const next = {
        ...routine,
        activityTypeId: activity.id,
        name: activity.displayNameTr,
        category: routineCategoryFromActivity(activity),
        targetType: routine.targetType || targetTypeFromActivity(activity),
        updatedAt: now(),
      };
      if (
        next.activityTypeId !== routine.activityTypeId ||
        next.name !== routine.name ||
        next.category !== routine.category
      ) {
        repaired.push(next);
        return next;
      }
      return routine;
    });
    if (!repaired.length) return [];
    set({ routines: nextRoutines });
    repaired.forEach((routine) => get().addSyncQueueItem({ entityType: 'routine', entityId: routine.id, payload: routine }));
    const today = todayKey();
    get().activityLogs
      .filter((log) => log.tenantId === tenantId && todayKey(new Date(log.loggedAt || log.createdAt)) === today)
      .forEach((log) => get().applyActivityLogToRoutineDailyLog(log));
    return repaired;
  },

  createRoutine: ({ tenantId, name, description }) => {
    const routine = {
      id: id('routine-'),
      tenantId,
      name,
      description,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    };
    set((s) => ({ routines: [routine, ...s.routines] }));
    get().addSyncQueueItem({ entityType: 'routine', entityId: routine.id, payload: routine });
    return routine;
  },

  createRoutineWithPlan: ({ tenantId, activityTypeId = null, name, category = 'exercise', targetType = 'set_based', selectedDays = ['mon', 'wed', 'fri'], plan = {}, progressionRule = {} }) => {
    const createdAt = now();
    const activity = activityTypeId ? get().activityTypes.find((item) => item.id === activityTypeId && item.tenantId === tenantId) : null;
    const existingRoutine = activity?.id
      ? get().routines.find((routine) => routine.tenantId === tenantId && routine.activityTypeId === activity.id && routine.isActive !== false)
      : null;
    if (existingRoutine) {
      return {
        routine: existingRoutine,
        plan: get().getLatestRoutinePlan(existingRoutine.id) || get().getActiveRoutinePlan(existingRoutine.id),
        progressionRule: get().routineProgressionRules.find((rule) => rule.routineId === existingRoutine.id && rule.isActive !== false) || null,
        alreadyExists: true,
      };
    }
    const resolvedTargetType = targetType || targetTypeFromActivity(activity, 'count_based');
    const resolvedCategory = activity ? routineCategoryFromActivity(activity) : category;
    const resolvedName = activity ? activity.displayNameTr : name;
    const routine = {
      id: id('routine-'),
      tenantId,
      activityTypeId: activity?.id || activityTypeId || null,
      name: resolvedName || 'Yeni Ritim',
      category: resolvedCategory,
      targetType: resolvedTargetType,
      isActive: true,
      createdAt,
      updatedAt: createdAt,
    };
    const normalizedUnitType = plan.unitType || unitTypeFromActivity(activity, resolvedTargetType);
    const routinePlan = {
      id: id('rplan-'),
      tenantId,
      routineId: routine.id,
      effectiveFrom: plan.effectiveFrom || todayKey(),
      effectiveTo: null,
      scheduleType: selectedDays.length >= 7 ? 'daily' : 'weekly',
      selectedDays: selectedDays.length ? selectedDays : DAY_KEYS,
      targetType: resolvedTargetType,
      targetSets: resolvedTargetType === 'set_based' ? clampPositive(plan.targetSets, 5) : null,
      targetRepsPerSet: resolvedTargetType === 'set_based' ? clampPositive(plan.targetRepsPerSet, 15) : null,
      targetTotalUnits: resolvedTargetType === 'set_based' ? null : clampPositive(plan.targetTotalUnits, resolvedTargetType === 'page_based' ? 20 : (activity?.defaultIncrement || 10)),
      blocks: plan.blocks ? clampPositive(plan.blocks, 1) : null,
      unitsPerBlock: plan.unitsPerBlock ? clampPositive(plan.unitsPerBlock, 1) : null,
      unitType: normalizedUnitType,
      minimumSuccessPercent: clampPositive(plan.minimumSuccessPercent, 80),
      createdAt,
      updatedAt: createdAt,
    };
    const rule = {
      id: id('rrule-'),
      tenantId,
      routineId: routine.id,
      mode: progressionRule.mode || 'none',
      increaseFrequency: progressionRule.increaseFrequency || progressionRule.mode || 'none',
      increaseAmount: Number(progressionRule.increaseAmount) || 0,
      increaseUnit: progressionRule.increaseUnit || (resolvedTargetType === 'set_based' ? 'reps_per_set' : resolvedTargetType === 'page_based' ? 'pages_per_day' : resolvedTargetType === 'duration_based' ? 'minutes_per_day' : 'count_per_day'),
      startPolicy: progressionRule.startPolicy || 'next_week',
      startDate: progressionRule.startDate || nextDateByPolicy(progressionRule.startPolicy || 'next_week'),
      maxTargetSets: progressionRule.maxTargetSets ? clampPositive(progressionRule.maxTargetSets, 1) : null,
      maxTargetRepsPerSet: progressionRule.maxTargetRepsPerSet ? clampPositive(progressionRule.maxTargetRepsPerSet, 1) : null,
      maxTotalUnits: progressionRule.maxTotalUnits ? clampPositive(progressionRule.maxTotalUnits, 1) : null,
      requiresUserApproval: progressionRule.requiresUserApproval !== false,
      customRoadmap: progressionRule.customRoadmap || [],
      isActive: true,
      createdAt,
      updatedAt: createdAt,
    };
    set((s) => ({
      routines: [routine, ...s.routines],
      routinePlans: [routinePlan, ...s.routinePlans],
      routineProgressionRules: [rule, ...s.routineProgressionRules],
    }));
    get().addSyncQueueItem({ entityType: 'routine', entityId: routine.id, payload: { routine, plan: routinePlan, progressionRule: rule } });
    return { routine, plan: routinePlan, progressionRule: rule };
  },

  updateRoutinePlan: ({ routineId, updates = {}, progressionRule = {}, effectivePolicy = 'today' }) => {
    const currentPlan = get().getLatestRoutinePlan(routineId) || get().getActiveRoutinePlan(routineId);
    const currentRule = get().routineProgressionRules.find((rule) => rule.routineId === routineId && rule.isActive !== false);
    if (!currentPlan) return null;
    const effectiveFrom = nextDateByPolicy(effectivePolicy);
    const updatedAt = now();
    const newPlan = {
      ...currentPlan,
      ...updates,
      id: id('rplan-'),
      effectiveFrom,
      effectiveTo: null,
      updatedAt,
      createdAt: updatedAt,
    };
    const newRule = {
      ...(currentRule || {}),
      ...progressionRule,
      id: id('rrule-'),
      tenantId: currentPlan.tenantId,
      routineId,
      startPolicy: progressionRule.startPolicy || effectivePolicy,
      startDate: progressionRule.startDate || nextDateByPolicy(progressionRule.startPolicy || effectivePolicy),
      isActive: true,
      createdAt: updatedAt,
      updatedAt,
    };
    set((s) => ({
      routinePlans: [
        newPlan,
        ...s.routinePlans.map((plan) => plan.id === currentPlan.id ? { ...plan, effectiveTo: effectiveFrom, updatedAt } : plan),
      ],
      routineProgressionRules: [
        newRule,
        ...s.routineProgressionRules.map((rule) => rule.routineId === routineId ? { ...rule, isActive: false, updatedAt } : rule),
      ],
    }));
    get().addSyncQueueItem({ entityType: 'routine', entityId: routineId, payload: { plan: newPlan, progressionRule: newRule } });
    return { plan: newPlan, progressionRule: newRule };
  },

  addRoutineItem: ({ tenantId, routineId, activityTypeId, targetValue }) => {
    const activity = get().activityTypes.find((a) => a.id === activityTypeId);
    if (!activity) return null;
    const item = {
      id: id('ritem-'),
      tenantId,
      routineId,
      activityTypeId,
      targetValue,
      unit: activity.unit,
      sortOrder: get().routineItems.filter((existing) => existing.routineId === routineId).length,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    };
    set((s) => ({ routineItems: [...s.routineItems, item] }));
    get().addSyncQueueItem({ entityType: 'routine_item', entityId: item.id, payload: item });
    return item;
  },

  completeRoutine: (routineId) => {
    const routine = get().routines.find((r) => r.id === routineId);
    if (!routine || !get().profile) return [];
    const items = get().routineItems.filter((item) => item.routineId === routineId && item.isActive);
    return items.map((item) => get().createActivityLog({
      tenantId: routine.tenantId,
      userId: get().profile.id,
      activityTypeId: item.activityTypeId,
      value: item.targetValue,
      source: 'manual',
    })).filter(Boolean);
  },

  getActiveRoutinePlan: (routineId, dateValue = todayKey()) => {
    const plans = get().routinePlans
      .filter((plan) => plan.routineId === routineId && plan.effectiveFrom <= dateValue && (!plan.effectiveTo || plan.effectiveTo > dateValue))
      .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());
    const plan = plans[0] || get().routinePlans.find((item) => item.routineId === routineId) || null;
    const rule = get().routineProgressionRules.find((item) => item.routineId === routineId && item.isActive !== false);
    return applyProgressionRule(plan, rule, dateValue);
  },

  getLatestRoutinePlan: (routineId) => {
    return get().routinePlans
      .filter((plan) => plan.routineId === routineId)
      .sort((a, b) => (
        new Date(b.effectiveFrom || b.createdAt).getTime() - new Date(a.effectiveFrom || a.createdAt).getTime()
      ) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;
  },

  isRoutinePlannedForDate: (routineId, dateValue = todayKey()) => {
    const plan = get().getActiveRoutinePlan(routineId, dateValue);
    if (!plan) return false;
    if (plan.scheduleType === 'daily') return true;
    const dayKey = DAY_INDEX_TO_KEY[new Date(dateValue).getDay()];
    return (plan.selectedDays || []).includes(dayKey);
  },

  getOrCreateRoutineDailyLog: (routineId, dateValue = todayKey()) => {
    const existing = get().routineDailyLogs.find((log) => log.routineId === routineId && log.date === dateValue);
    if (existing) return existing;
    const routine = get().routines.find((item) => item.id === routineId);
    const plan = get().getActiveRoutinePlan(routineId, dateValue);
    if (!routine || !plan) return null;
    const snapshot = snapshotFromPlan(plan);
    const createdAt = now();
    const log = {
      id: id('rdlog-'),
      tenantId: routine.tenantId,
      routineId,
      date: dateValue,
      planSnapshot: snapshot,
      plannedTotalUnits: snapshot.planned_total_units,
      completedTotalUnits: 0,
      completedSetsCount: null,
      extraUnits: 0,
      successPercent: 0,
      isSuccessful: false,
      isOverachieved: false,
      createdAt,
      updatedAt: createdAt,
    };
    set((s) => ({ routineDailyLogs: [log, ...s.routineDailyLogs] }));
    return log;
  },

  upsertRoutineLogEntries: ({ routineId, date = todayKey(), entries }) => {
    const dailyLog = get().getOrCreateRoutineDailyLog(routineId, date);
    if (!dailyLog) return null;
    const plan = {
      targetType: dailyLog.planSnapshot.target_type,
      targetSets: dailyLog.planSnapshot.target_sets,
      targetRepsPerSet: dailyLog.planSnapshot.target_reps_per_set,
      targetTotalUnits: dailyLog.planSnapshot.target_total_units,
      unitType: dailyLog.planSnapshot.unit_type,
      minimumSuccessPercent: dailyLog.planSnapshot.minimum_success_percent,
    };
    const normalizedEntries = (entries || []).filter((entry) => Number(entry.value) > 0).map((entry, index) => ({
      id: entry.id || id('rentry-'),
      tenantId: dailyLog.tenantId,
      dailyLogId: dailyLog.id,
      routineId,
      entryIndex: index + 1,
      entryType: entry.entryType || (plan.targetType === 'set_based' ? 'set' : 'block'),
      value: Number(entry.value) || 0,
      isExtra: plan.targetType === 'set_based' ? index >= (plan.targetSets || 0) : false,
      sourceActivityLogId: entry.sourceActivityLogId || null,
      createdAt: entry.createdAt || now(),
    }));
    const summary = computeRoutineLogSummary({ plan, entries: normalizedEntries });
    const updatedLog = { ...dailyLog, ...summary, updatedAt: now() };
    set((s) => ({
      routineLogEntries: [
        ...normalizedEntries,
        ...s.routineLogEntries.filter((entry) => entry.dailyLogId !== dailyLog.id),
      ],
      routineDailyLogs: s.routineDailyLogs.map((log) => log.id === dailyLog.id ? updatedLog : log),
    }));
    get().addSyncQueueItem({ entityType: 'routine_daily_log', entityId: updatedLog.id, payload: updatedLog });
    normalizedEntries.forEach((entry) => {
      get().addSyncQueueItem({ entityType: 'routine_log_entry', entityId: entry.id, payload: entry });
    });
    return { dailyLog: updatedLog, entries: normalizedEntries };
  },

  getRoutineTodaySummaries: () => {
    const active = get().activeTenantId;
    const date = todayKey();
    return get().routines
      .filter((routine) => routine.tenantId === active && routine.isActive !== false)
      .map((routine) => {
        const plan = get().getActiveRoutinePlan(routine.id, date);
        const log = get().routineDailyLogs.find((item) => item.routineId === routine.id && item.date === date);
        return { routine, plan, log, isPlannedToday: get().isRoutinePlannedForDate(routine.id, date) };
      });
  },

  getRoutineSuggestion: (routineId) => {
    const routine = get().routines.find((item) => item.id === routineId);
    const plan = get().getActiveRoutinePlan(routineId);
    const rule = get().routineProgressionRules.find((item) => item.routineId === routineId && item.isActive !== false);
    if (!routine || !plan || !rule || rule.mode === 'none') return null;
    const today = new Date();
    const plannedDays = Array.from({ length: 7 }).map((_, index) => {
      const date = addDays(today, index - 6);
      const dateKey = todayKey(date);
      if (!get().isRoutinePlannedForDate(routineId, dateKey)) return null;
      const log = get().routineDailyLogs.find((item) => item.routineId === routineId && item.date === dateKey);
      return { date: dateKey, log, successful: (log?.successPercent || 0) >= 100 };
    }).filter(Boolean);
    if (!plannedDays.length) return null;
    const successCount = plannedDays.filter((item) => item.successful).length;
    const successRate = Math.round((successCount / plannedDays.length) * 100);
    if (successRate < 80) return null;
    const increase = Number(rule.increaseAmount) || (plan.targetType === 'set_based' ? 2 : 5);
    const nextPlan = {
      targetSets: plan.targetSets,
      targetRepsPerSet: plan.targetRepsPerSet,
      targetTotalUnits: plan.targetTotalUnits,
    };
    if (plan.targetType === 'set_based') {
      nextPlan.targetRepsPerSet = Math.min(Number(rule.maxTargetRepsPerSet) || (Number(plan.targetRepsPerSet) + increase), Number(plan.targetRepsPerSet || 0) + increase);
    } else {
      nextPlan.targetTotalUnits = Math.min(Number(rule.maxTotalUnits) || (Number(plan.targetTotalUnits) + increase), Number(plan.targetTotalUnits || 0) + increase);
    }
    const nextValue = plan.targetType === 'set_based' ? nextPlan.targetRepsPerSet : nextPlan.targetTotalUnits;
    return {
      routine,
      plan,
      rule,
      successCount,
      plannedCount: plannedDays.length,
      successRate,
      nextPlan,
      nextValue,
      requiresUserApproval: rule.requiresUserApproval !== false,
      message: `Son 7 günde planlı günlerin ${successCount}/${plannedDays.length} tanesinde hedefi tamamladın. Seviye atlamaya hazırsın.`,
    };
  },

  acceptRoutineProgressionSuggestion: (routineId) => {
    const suggestion = get().getRoutineSuggestion(routineId);
    if (!suggestion) return null;
    const updates = suggestion.plan.targetType === 'set_based'
      ? { targetRepsPerSet: suggestion.nextPlan.targetRepsPerSet }
      : { targetTotalUnits: suggestion.nextPlan.targetTotalUnits };
    return get().updateRoutinePlan({
      routineId,
      updates,
      progressionRule: suggestion.rule,
      effectivePolicy: suggestion.rule.startPolicy || 'next_week',
    });
  },

  getFourWeekRoutineProgress: (routineId) => {
    const start = weekStart(addDays(new Date(), -21));
    return Array.from({ length: 4 }).map((_, index) => {
      const weekStartDate = addDays(start, index * 7);
      const weekEndDate = addDays(weekStartDate, 6);
      const logs = get().routineDailyLogs.filter((log) => {
        const date = new Date(log.date);
        return log.routineId === routineId && date >= weekStartDate && date <= weekEndDate;
      });
      const planned = logs.reduce((sum, log) => sum + (Number(log.plannedTotalUnits) || 0), 0);
      const completed = logs.reduce((sum, log) => sum + (Number(log.completedTotalUnits) || 0), 0);
      const extra = logs.reduce((sum, log) => sum + (Number(log.extraUnits) || 0), 0);
      const successPercent = planned ? Math.round((completed / planned) * 100) : 0;
      return {
        index: index + 1,
        startDate: todayKey(weekStartDate),
        endDate: todayKey(weekEndDate),
        logs,
        planned,
        completed,
        extra,
        successPercent,
        completedCount: logs.filter((log) => log.isSuccessful).length,
      };
    });
  },

  seedChallengeFoundation: (tenantId) => {
    const existing = get().challenges.filter((challenge) => challenge.tenantId === tenantId);
    if (existing.length) return existing;
    const start = todayKey();
    const challenge = {
      id: id('challenge-'),
      tenantId,
      title: '7 Day Consistency',
      description: 'Log at least one activity every day for 7 days.',
      metric: 'daily_log',
      targetValue: 7,
      startDate: start,
      endDate: start,
      status: 'draft',
      createdAt: now(),
      updatedAt: now(),
    };
    set((s) => ({ challenges: [challenge, ...s.challenges] }));
    return [challenge];
  },

  joinChallenge: (challengeId) => {
    const challenge = get().challenges.find((item) => item.id === challengeId);
    if (!challenge || !get().profile) return null;
    const existing = get().challengeParticipants.find((item) => item.challengeId === challengeId && item.userId === get().profile.id);
    if (existing) return existing;
    const participant = {
      id: id('cp-'),
      tenantId: challenge.tenantId,
      challengeId,
      userId: get().profile.id,
      progressValue: 0,
      status: 'joined',
      joinedAt: now(),
      updatedAt: now(),
    };
    set((s) => ({ challengeParticipants: [participant, ...s.challengeParticipants] }));
    return participant;
  },

  setNfcAdapterMode: (mode) => {
    set({ nfcAdapter: { mode, status: mode === 'mock' ? 'ready' : 'ready', lastError: null } });
  },

  setNfcAdapterStatus: (status, lastError = null) => {
    set((s) => ({ nfcAdapter: { ...s.nfcAdapter, status, lastError } }));
  },

  setFeedbackSettings: (updates = {}) => {
    set((s) => ({
      feedbackSettings: {
        soundEnabled: s.feedbackSettings?.soundEnabled !== false,
        hapticEnabled: s.feedbackSettings?.hapticEnabled !== false,
        ...updates,
      },
    }));
  },

  setDevToolsEnabled: (enabled) => {
    set((s) => ({
      devToolsEnabled: Boolean(enabled),
      nfcAdapter: Boolean(enabled) ? s.nfcAdapter : { ...s.nfcAdapter, mode: 'native' },
    }));
  },

  setDashboardActivityOrder: (activityIds) => {
    set({ dashboardActivityOrder: Array.isArray(activityIds) ? activityIds : [] });
  },

  getActiveTenant: () => get().tenants.find((t) => t.id === get().activeTenantId) || null,

  getCardsForActiveTenant: () => {
    const active = get().activeTenantId;
    return get().tenantNfcCards.filter((c) => c.tenantId === active);
  },

  getLogsForActiveTenant: () => {
    const active = get().activeTenantId;
    return get().activityLogs.filter((l) => l.tenantId === active);
  },

  getTodayStats: () => {
    const logs = get().getLogsForActiveTenant();
    const today = new Date().toDateString();
    const todays = logs.filter((l) => new Date(l.loggedAt).toDateString() === today);
    const workouts = todays.filter((l) => l.category === 'fitness').length;
    const wellness = todays.filter((l) => l.category === 'wellness').length;
    const water = todays.filter((l) => l.activityTypeId && get().activityTypes.find((t)=>t.id===l.activityTypeId && t.name==='water')).reduce((s,c)=>s+(c.value||0),0);
    const coffee = todays.filter((l) => l.activityTypeId && get().activityTypes.find((t)=>t.id===l.activityTypeId && t.name==='coffee')).reduce((s,c)=>s+(c.value||0),0);
    const sleep = todays.filter((l) => l.activityTypeId && get().activityTypes.find((t)=>t.id===l.activityTypeId && t.name==='sleep')).reduce((s,c)=>s+(c.value||0),0);
    const steps = todays.filter((l) => l.activityTypeId && get().activityTypes.find((t)=>t.id===l.activityTypeId && t.name==='steps')).reduce((s,c)=>s+(c.value||0),0);
    const calories = Math.round(todays.reduce((sum, log) => sum + (Number(log.calories) || 0), 0));
    const nfcVerified = todays.filter((log) => log.source === 'mock_nfc' || log.source === 'nfc').length;
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const weeklyLogs = logs.filter((log) => new Date(log.loggedAt) >= weekStart);
    const topActivities = Object.entries(weeklyLogs.reduce((acc, log) => {
      if (!acc[log.activityTypeId]) acc[log.activityTypeId] = { count: 0, total: 0 };
      acc[log.activityTypeId].count += 1;
      acc[log.activityTypeId].total += Number(log.value) || 0;
      return acc;
    }, {})).sort((a, b) => b[1].total - a[1].total).slice(0, 3).map(([activityTypeId, summary]) => ({
      activity: get().activityTypes.find((item) => item.id === activityTypeId),
      count: summary.count,
      total: summary.total,
    }));
    const goalsByActivity = Object.values(get().cardAssignments.reduce((acc, assignment) => {
      if (assignment.tenantId !== get().activeTenantId || !assignment.dailyGoal) return acc;
      const current = acc[assignment.activityTypeId];
      if (!current || Number(assignment.dailyGoal) > Number(current.dailyGoal)) {
        acc[assignment.activityTypeId] = assignment;
      }
      return acc;
    }, {}));
    const completedGoals = goalsByActivity.filter((assignment) => {
      const total = todays
        .filter((log) => log.activityTypeId === assignment.activityTypeId)
        .reduce((sum, log) => sum + (log.value || 0), 0);
      return total >= assignment.dailyGoal;
    }).length;
    return { workoutsCount: workouts, wellnessCount: wellness, waterTotal: water, coffeeTotal: coffee, sleepTotal: sleep, stepsTotal: steps, caloriesTotal: calories, nfcVerified, weeklyLogs: weeklyLogs.length, topActivities, totalLogs: todays.length, completedGoals };
  },

  getDailyGoalProgress: () => {
    const active = get().activeTenantId;
    const today = new Date().toDateString();
    const todays = get().activityLogs.filter((log) => log.tenantId === active && new Date(log.loggedAt).toDateString() === today);
    const assignmentGoalsByActivity = get().cardAssignments
      .filter((assignment) => assignment.tenantId === active && assignment.dailyGoal)
      .reduce((acc, assignment) => {
        const current = acc[assignment.activityTypeId];
        if (!current || Number(assignment.dailyGoal) > Number(current.dailyGoal)) {
          acc[assignment.activityTypeId] = { ...assignment, source: 'assignment' };
        }
        return acc;
      }, {});
    const localGoalsByActivity = get().activityDailyGoals
      .filter((goal) => goal.tenantId === active && goal.dailyGoal)
      .reduce((acc, goal) => {
        const current = acc[goal.activityTypeId];
        if (!current || Number(goal.dailyGoal) > Number(current.dailyGoal)) {
          acc[goal.activityTypeId] = { ...goal, source: 'manual_goal' };
        }
        return acc;
      }, {});
    const goalsByActivity = Object.values({ ...assignmentGoalsByActivity, ...localGoalsByActivity });
    return goalsByActivity
      .map((goal) => {
        const activity = get().activityTypes.find((item) => item.id === goal.activityTypeId);
        const total = todays
          .filter((log) => log.activityTypeId === goal.activityTypeId)
          .reduce((sum, log) => sum + (log.value || 0), 0);
        return { assignment: goal.source === 'assignment' ? goal : null, goal, activity, total, target: goal.dailyGoal, percent: Math.min(100, Math.round((total / goal.dailyGoal) * 100)) };
      });
  },

  getCurrentStreak: () => {
    const active = get().activeTenantId;
    const days = new Set(get().activityLogs.filter((log) => log.tenantId === active).map((log) => todayKey(new Date(log.loggedAt))));
    let streak = 0;
    const cursor = new Date();
    while (days.has(todayKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  },

  getAssignmentForTenantCard: (tenantCardId) => get().cardAssignments.find((a) => a.tenantCardId === tenantCardId) || null,

  getActivityTypeById: (id_) => get().activityTypes.find((t) => t.id === id_) || null,
}), {
  name: 'ritim-phase-1-store',
  storage: createJSONStorage(localStorageProvider),
  version: 4,
  migrate: (persistedState) => ({
    profile: persistedState?.profile || null,
    authUserId: persistedState?.authUserId || null,
    tenants: persistedState?.tenants || [],
    activeTenantId: persistedState?.activeTenantId || null,
    activityTypes: (persistedState?.activityTypes || []).map((activity) => ({
      ...activity,
      workoutCategory: activity.workoutCategory || (activity.category === 'fitness' ? workoutCategories[activity.name] || 'Cardio' : null),
      muscleGroup: activity.muscleGroup || (activity.category === 'fitness' ? workoutCategories[activity.name] || null : null),
      difficulty: activity.difficulty || (activity.category === 'fitness' ? difficultyByName[activity.name] || 'medium' : null),
      intensity: activity.intensity || (activity.category === 'fitness' ? (difficultyByName[activity.name] === 'hard' ? 'high' : 'medium') : null),
      trackingMode: activity.trackingMode || (activity.unit === 'reps' ? 'reps' : activity.unit === 'set' ? 'sets' : 'duration'),
      description: activity.description || null,
    })),
    trackedActivityTypeIds: persistedState?.trackedActivityTypeIds || [],
    activityDailyGoals: persistedState?.activityDailyGoals || [],
    nfcTags: persistedState?.nfcTags || [],
    tenantNfcCards: persistedState?.tenantNfcCards || [],
    cardAssignments: persistedState?.cardAssignments || [],
    activityLogs: persistedState?.activityLogs || [],
    nfcDeepLinkEvents: persistedState?.nfcDeepLinkEvents || [],
    devToolsEnabled: persistedState?.devToolsEnabled || false,
    dashboardActivityOrder: persistedState?.dashboardActivityOrder || [],
    routines: persistedState?.routines || [],
    routineItems: persistedState?.routineItems || [],
    routinePlans: persistedState?.routinePlans || [],
    routineProgressionRules: persistedState?.routineProgressionRules || [],
    routineDailyLogs: persistedState?.routineDailyLogs || [],
    routineLogEntries: persistedState?.routineLogEntries || [],
    challenges: persistedState?.challenges || [],
    challengeParticipants: persistedState?.challengeParticipants || [],
    syncQueue: persistedState?.syncQueue || [],
    nfcAdapter: persistedState?.nfcAdapter ? { ...persistedState.nfcAdapter, mode: persistedState?.devToolsEnabled ? persistedState.nfcAdapter.mode : 'native' } : { mode: 'native', status: 'ready', lastError: null },
    feedbackSettings: persistedState?.feedbackSettings || { soundEnabled: true, hapticEnabled: true },
  }),
  partialize: (state) => ({
    profile: state.profile,
    authUserId: state.authUserId,
    tenants: state.tenants,
    activeTenantId: state.activeTenantId,
    activityTypes: state.activityTypes,
    trackedActivityTypeIds: state.trackedActivityTypeIds,
    activityDailyGoals: state.activityDailyGoals,
    nfcTags: state.nfcTags,
    tenantNfcCards: state.tenantNfcCards,
    cardAssignments: state.cardAssignments,
    activityLogs: state.activityLogs,
    nfcDeepLinkEvents: state.nfcDeepLinkEvents,
    devToolsEnabled: state.devToolsEnabled,
    dashboardActivityOrder: state.dashboardActivityOrder,
    routines: state.routines,
    routineItems: state.routineItems,
    routinePlans: state.routinePlans,
    routineProgressionRules: state.routineProgressionRules,
    routineDailyLogs: state.routineDailyLogs,
    routineLogEntries: state.routineLogEntries,
    challenges: state.challenges,
    challengeParticipants: state.challengeParticipants,
    syncQueue: state.syncQueue,
    nfcAdapter: state.nfcAdapter,
    feedbackSettings: state.feedbackSettings,
  }),
}));

export default useStore;
