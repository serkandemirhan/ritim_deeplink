const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const baseUrl = process.env.RITIM_SCREENSHOT_BASE_URL || 'http://localhost:4174';
const outDir = path.resolve(__dirname, '../screenshots/app-map');
const loginEmail = process.env.RITIM_SCREENSHOT_EMAIL || 'serkandemirhan@gmail.com';
const loginPassword = process.env.RITIM_SCREENSHOT_PASSWORD || '123456';
const debugLogin = process.env.RITIM_SCREENSHOT_DEBUG_LOGIN === '1';
const routeFilter = process.env.RITIM_SCREENSHOT_ONLY || '';

const now = new Date();
const iso = now.toISOString();
const day = iso.slice(0, 10);
const tenantId = 'tenant-demo';
const userId = 'user-demo';

function activity(id, category, name, displayNameTr, displayNameEn, unit, defaultIncrement, color) {
  return {
    id,
    tenantId,
    category,
    name,
    displayNameTr,
    displayNameEn,
    unit,
    defaultIncrement,
    icon: name,
    color,
    caloriesPerUnit: category === 'fitness' ? 0.32 : null,
    isActive: true,
    isCustom: false,
    createdAt: iso,
    updatedAt: iso,
  };
}

const activities = [
  activity('act-push', 'fitness', 'push_ups', 'Şınav', 'Push-ups', 'reps', 10, '#35E27A'),
  activity('act-walk', 'fitness', 'walking', 'Yürüyüş', 'Walking', 'min', 10, '#37B7FF'),
  activity('act-pull', 'fitness', 'pull_ups', 'Pull-up', 'Pull-ups', 'reps', 5, '#35E27A'),
  activity('act-water', 'wellness', 'water', 'Su', 'Water', 'ml', 500, '#37B7FF'),
  activity('act-coffee', 'wellness', 'coffee', 'Kahve', 'Coffee', 'cup', 1, '#A56B42'),
  activity('act-book', 'wellness', 'book_reading', 'Kitap Okuma', 'Reading', 'page', 20, '#9B5CFF'),
  activity('act-meditation', 'wellness', 'meditation', 'Meditasyon', 'Meditation', 'min', 10, '#9B5CFF'),
];

const persistedState = {
  profile: {
    id: userId,
    fullName: 'Demo Kullanıcı',
    email: 'demo@ritim.app',
    age: 34,
    heightCm: 178,
    weightKg: 82,
    gender: 'prefer_not_to_say',
    activityLevel: 'medium',
    goal: 'maintain',
    createdAt: iso,
    updatedAt: iso,
  },
  authUserId: userId,
  tenants: [{
    id: tenantId,
    name: 'Demo Workspace',
    slug: 'demo-workspace',
    type: 'personal',
    role: 'tenant_owner',
    createdAt: iso,
    updatedAt: iso,
  }],
  activeTenantId: tenantId,
  activityTypes: activities,
  trackedActivityTypeIds: activities.map((item) => item.id),
  activityDailyGoals: [
    { id: 'goal-walk', tenantId, activityTypeId: 'act-walk', dailyGoal: 30, createdAt: iso, updatedAt: iso },
    { id: 'goal-water', tenantId, activityTypeId: 'act-water', dailyGoal: 2500, createdAt: iso, updatedAt: iso },
    { id: 'goal-coffee', tenantId, activityTypeId: 'act-coffee', dailyGoal: 3, createdAt: iso, updatedAt: iso },
  ],
  nfcTags: [
    { id: 'tag-push', uidHash: 'mock-hash-MOCK-TAG-001', mockUid: 'MOCK-TAG-001', publicTagCode: 'TAG-001', status: 'active', firstSeenAt: iso, lastSeenAt: iso },
    { id: 'tag-water', uidHash: 'mock-hash-MOCK-TAG-002', mockUid: 'MOCK-TAG-002', publicTagCode: 'TAG-002', status: 'active', firstSeenAt: iso, lastSeenAt: iso },
  ],
  tenantNfcCards: [
    { id: 'card-push', tenantId, tagId: 'tag-push', uidHash: 'mock-hash-MOCK-TAG-001', cardName: 'Şınav Kartı', category: 'fitness', status: 'active', createdAt: iso, updatedAt: iso },
    { id: 'card-water', tenantId, tagId: 'tag-water', uidHash: 'mock-hash-MOCK-TAG-002', cardName: 'Su Kartı', category: 'wellness', status: 'active', createdAt: iso, updatedAt: iso },
  ],
  cardAssignments: [
    { id: 'assign-push', tenantId, tenantCardId: 'card-push', activityTypeId: 'act-push', incrementValue: 10, unit: 'reps', dailyGoal: 75, isActive: true, createdAt: iso, updatedAt: iso },
    { id: 'assign-water', tenantId, tenantCardId: 'card-water', activityTypeId: 'act-water', incrementValue: 500, unit: 'ml', dailyGoal: 2500, isActive: true, createdAt: iso, updatedAt: iso },
  ],
  activityLogs: [
    { id: 'log-push-1', tenantId, userId, tagId: 'tag-push', tenantCardId: 'card-push', activityTypeId: 'act-push', category: 'fitness', value: 75, unit: 'reps', calories: 24, source: 'mock_nfc', syncStatus: 'local_only', loggedAt: iso, createdAt: iso },
    { id: 'log-push-2', tenantId, userId, tagId: 'tag-push', tenantCardId: 'card-push', activityTypeId: 'act-push', category: 'fitness', value: 69, unit: 'reps', calories: 22, source: 'manual', syncStatus: 'local_only', loggedAt: iso, createdAt: iso },
    { id: 'log-water-1', tenantId, userId, tagId: 'tag-water', tenantCardId: 'card-water', activityTypeId: 'act-water', category: 'wellness', value: 500, unit: 'ml', calories: null, source: 'mock_nfc', syncStatus: 'local_only', loggedAt: iso, createdAt: iso },
    { id: 'log-book-1', tenantId, userId, activityTypeId: 'act-book', category: 'wellness', value: 35, unit: 'page', calories: null, source: 'manual', syncStatus: 'local_only', loggedAt: iso, createdAt: iso },
  ],
  nfcDeepLinkEvents: [],
  devToolsEnabled: true,
  dashboardActivityOrder: ['act-push', 'act-walk', 'act-pull', 'act-water', 'act-coffee'],
  routines: [
    { id: 'routine-push', tenantId, activityTypeId: 'act-push', name: 'Şınav', category: 'exercise', targetType: 'set_based', description: 'Tek sette güçlenme planı', isActive: true, createdAt: iso, updatedAt: iso },
    { id: 'routine-book', tenantId, activityTypeId: 'act-book', name: 'Kitap Okuma', category: 'wellness', targetType: 'page_based', description: 'Okuma ritmi', isActive: true, createdAt: iso, updatedAt: iso },
  ],
  routineItems: [],
  routinePlans: [
    { id: 'plan-push', tenantId, routineId: 'routine-push', effectiveFrom: day, effectiveTo: null, scheduleType: 'weekly', selectedDays: ['mon', 'wed', 'fri', 'sun'], targetType: 'set_based', targetSets: 5, targetRepsPerSet: 15, targetTotalUnits: null, blocks: null, unitsPerBlock: null, unitType: 'repetition', minimumSuccessPercent: 80, createdAt: iso, updatedAt: iso },
    { id: 'plan-book', tenantId, routineId: 'routine-book', effectiveFrom: day, effectiveTo: null, scheduleType: 'daily', selectedDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], targetType: 'page_based', targetSets: null, targetRepsPerSet: null, targetTotalUnits: 20, blocks: 4, unitsPerBlock: 5, unitType: 'page', minimumSuccessPercent: 80, createdAt: iso, updatedAt: iso },
  ],
  routineProgressionRules: [
    { id: 'rule-push', tenantId, routineId: 'routine-push', mode: 'weekly', increaseFrequency: null, increaseAmount: 2, increaseUnit: 'reps_per_set', startPolicy: 'next_week', startDate: null, maxTargetSets: null, maxTargetRepsPerSet: 30, maxTotalUnits: null, requiresUserApproval: true, customRoadmap: [], isActive: true, createdAt: iso, updatedAt: iso },
  ],
  routineDailyLogs: [
    { id: 'daily-push-today', tenantId, routineId: 'routine-push', date: day, planSnapshotJson: {}, plannedTotalUnits: 75, completedTotalUnits: 144, completedSetsCount: 5, extraUnits: 69, successPercent: 192, isSuccessful: true, isOverachieved: true, createdAt: iso, updatedAt: iso },
    { id: 'daily-book-today', tenantId, routineId: 'routine-book', date: day, planSnapshotJson: {}, plannedTotalUnits: 20, completedTotalUnits: 35, completedSetsCount: 4, extraUnits: 15, successPercent: 175, isSuccessful: true, isOverachieved: true, createdAt: iso, updatedAt: iso },
    { id: 'daily-push-w1', tenantId, routineId: 'routine-push', date: new Date(now.getTime() - 21 * 86400000).toISOString().slice(0, 10), planSnapshotJson: {}, plannedTotalUnits: 75, completedTotalUnits: 75, completedSetsCount: 5, extraUnits: 0, successPercent: 100, isSuccessful: true, isOverachieved: false, createdAt: iso, updatedAt: iso },
    { id: 'daily-push-w2', tenantId, routineId: 'routine-push', date: new Date(now.getTime() - 14 * 86400000).toISOString().slice(0, 10), planSnapshotJson: {}, plannedTotalUnits: 85, completedTotalUnits: 95, completedSetsCount: 5, extraUnits: 10, successPercent: 112, isSuccessful: true, isOverachieved: true, createdAt: iso, updatedAt: iso },
    { id: 'daily-push-w3', tenantId, routineId: 'routine-push', date: new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10), planSnapshotJson: {}, plannedTotalUnits: 95, completedTotalUnits: 110, completedSetsCount: 5, extraUnits: 15, successPercent: 116, isSuccessful: true, isOverachieved: true, createdAt: iso, updatedAt: iso },
  ],
  routineLogEntries: [
    { id: 'entry-1', tenantId, dailyLogId: 'daily-push-today', routineId: 'routine-push', entryIndex: 1, entryType: 'set', value: 30, isExtra: false, createdAt: iso },
    { id: 'entry-2', tenantId, dailyLogId: 'daily-push-today', routineId: 'routine-push', entryIndex: 2, entryType: 'set', value: 30, isExtra: false, createdAt: iso },
  ],
  challenges: [],
  challengeParticipants: [],
  syncQueue: [],
  nfcAdapter: { mode: 'mock', status: 'ready', lastError: null },
};

function cloneDemoState(authUserId = userId, email = 'demo@ritim.app') {
  const cloned = JSON.parse(JSON.stringify(persistedState));
  cloned.authUserId = authUserId;
  cloned.profile.id = authUserId;
  cloned.profile.email = email;
  cloned.activityLogs = cloned.activityLogs.map((log) => ({ ...log, userId: authUserId }));
  return cloned;
}

async function setStoreState(page, state) {
  await page.evaluate((payload) => {
    localStorage.setItem('ritim-phase-1-store', JSON.stringify({
      state: payload,
      version: 4,
    }));
  }, state);
}

async function getStoredAuthUserId(page) {
  return page.evaluate(() => {
    const storeRaw = localStorage.getItem('ritim-phase-1-store');
    if (storeRaw) {
      try {
        const parsed = JSON.parse(storeRaw);
        const state = parsed?.state || {};
        if (state.authUserId) return state.authUserId;
        if (state.profile?.id) return state.profile.id;
      } catch (_error) {}
    }

    for (const key of Object.keys(localStorage)) {
      if (!key.includes('auth-token')) continue;
      try {
        const parsed = JSON.parse(localStorage.getItem(key));
        const userId = parsed?.user?.id || parsed?.currentSession?.user?.id;
        if (userId) return userId;
      } catch (_error) {}
    }
    return null;
  });
}

async function loginAndSeedDemoState(context) {
  const page = await context.newPage();
  await page.goto(`${baseUrl}/onboarding`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${baseUrl}/onboarding`, { waitUntil: 'networkidle' });
  await page.getByPlaceholder('E-posta veya kullanıcı adı').fill(loginEmail);
  await page.getByPlaceholder('Şifre').fill(loginPassword);
  await page.getByText('Giriş yap', { exact: true }).nth(1).click();

  try {
    await page.waitForFunction(() => {
      const raw = localStorage.getItem('ritim-phase-1-store');
      if (!raw) return false;
      try {
        const state = JSON.parse(raw)?.state || {};
        return Boolean(state.authUserId && state.profile);
      } catch (_error) {
        return false;
      }
    }, null, { timeout: 15000 });
  } catch (error) {
    if (debugLogin) {
      await page.screenshot({ path: path.join(outDir, '_debug-login-failed.png'), fullPage: true });
    }
    const text = await page.locator('body').innerText().catch(() => '');
    const storageKeys = await page.evaluate(() => Object.keys(localStorage));
    await page.close();
    throw new Error(`Login did not produce app auth state. Page text:\n${text}\n\nlocalStorage keys: ${storageKeys.join(', ')}`);
  }

  const authUserId = await getStoredAuthUserId(page);
  if (!authUserId) throw new Error('Login completed but no auth user id was stored.');
  await setStoreState(page, cloneDemoState(authUserId, loginEmail));
  await page.close();
  return authUserId;
}

const routes = [
  ['00-onboarding-login-empty', '/onboarding', false],
  ['00-onboarding-login-filled', '/onboarding', false, async (page) => {
    await page.getByPlaceholder('E-posta veya kullanıcı adı').fill('serkandemirhan@gmail.com');
    await page.getByPlaceholder('Şifre').fill('123456');
  }],
  ['00-onboarding-signup', '/onboarding', false, async (page) => {
    await page.getByText('Kayıt ol').first().click();
    await page.getByPlaceholder('Ad Soyad').fill('Serkan Demirhan');
    await page.getByPlaceholder('E-posta veya kullanıcı adı').fill('serkandemirhan@gmail.com');
    await page.getByPlaceholder('Şifre').fill('123456');
  }],
  ['01-home', '/home', true],
  ['02-mock-scan', '/mock-scan', true],
  ['03-cards', '/cards', true],
  ['04-cards-register-new', '/cards/register?mockUid=MOCK-TAG-003&uidHash=mock-hash-MOCK-TAG-003', true],
  ['05-cards-register-edit', '/cards/register?cardId=card-push', true],
  ['06-cards-success', '/cards/success?cardId=card-push', true],
  ['07-history', '/history', true],
  ['08-manual-log-fitness', '/manual-log?category=fitness&activityName=push_ups', true],
  ['09-manual-log-wellness', '/manual-log?category=wellness&activityName=water', true],
  ['10-activity-library', '/activity-library', true],
  ['11-wellness', '/wellness', true],
  ['12-routines', '/routines', true],
  ['13-routine-create', '/routine-create', true],
  ['14-routine-daily', '/routine-daily?routineId=routine-push', true],
  ['15-routine-plan', '/routine-plan?routineId=routine-push', true],
  ['16-routine-progress', '/routine-progress?routineId=routine-push', true],
  ['17-routine-week', '/routine-week?routineId=routine-push&weekIndex=1', true],
  ['18-profile', '/profile', true],
  ['19-workspaces', '/workspaces', true],
  ['20-nfc-settings', '/nfc-settings', true],
  ['21-sync', '/sync', true],
  ['22-challenges', '/challenges', true],
  ['23-deeplink-tag', '/t/NFC_TEST_001', true],
];

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const onboardingContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const appContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  await appContext.addInitScript(() => {
    window.__RITIM_SCREENSHOT_MODE__ = true;
  });

  let realAuthUserId = userId;
  try {
    realAuthUserId = await loginAndSeedDemoState(appContext);
  } catch (error) {
    console.warn(`Login fallback: ${error.message.split('\n')[0]}`);
    const seedPage = await appContext.newPage();
    await seedPage.goto(baseUrl, { waitUntil: 'networkidle' });
    await seedPage.evaluate(() => localStorage.clear());
    await setStoreState(seedPage, cloneDemoState(realAuthUserId, loginEmail));
    await seedPage.close();
  }
  const authedState = cloneDemoState(realAuthUserId, loginEmail);

  const selectedRoutes = routeFilter
    ? routes.filter(([name]) => name === routeFilter || name.includes(routeFilter))
    : routes;

  if (!selectedRoutes.length) {
    throw new Error(`No screenshot route matched RITIM_SCREENSHOT_ONLY=${routeFilter}`);
  }

  for (const [name, route, authed, prepare] of selectedRoutes) {
    const context = authed ? appContext : onboardingContext;
    const page = await context.newPage();
    if (!authed) {
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await page.evaluate(() => localStorage.clear());
    } else {
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await setStoreState(page, authedState);
    }

    const url = `${baseUrl}${route}`;
    await page.goto(url, { waitUntil: 'networkidle' });
    if (authed && page.url().includes('/onboarding')) {
      await setStoreState(page, authedState);
      await page.goto(url, { waitUntil: 'networkidle' });
    }
    if (prepare) {
      try {
        await prepare(page);
      } catch (error) {
        console.warn(`Prepare skipped for ${name}: ${error.message.split('\n')[0]}`);
      }
    }
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
    await page.close();
  }

  await onboardingContext.close();
  await appContext.close();
  await browser.close();
  console.log(`Saved ${selectedRoutes.length} screenshots to ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
