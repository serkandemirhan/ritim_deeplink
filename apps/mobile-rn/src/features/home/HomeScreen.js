import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing, Platform, Image } from 'react-native';
import AppScreen from '../../components/AppScreen';
import SectionHeader from '../../components/SectionHeader';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import AppCard from '../../components/AppCard';
import ActivityIcon from '../../components/ActivityIcon';
import useStore from '../../store/store';
import colors from '../../theme/colors';
import { RoutineCard } from '../routines/RoutineComponents';
import { GoalSummaryCard, NFCResultCard, goalPercent } from '../../components/RitimFeedback';
import { EnergyMeter } from '../../components/NfcSuccessExperience';
import { displaySource, displayUnit } from '../../lib/uiText';

const dashboardTokens = require('../../../ritim_dashboard_assets/dashboard-design-tokens.json');
const ritimIcon = require('../../../ritim_dashboard_assets/ritim-icon-dark.svg');
const dashboardIcons = {
  push_ups: require('../../../ritim_dashboard_assets/icon-pushup.svg'),
  walking: require('../../../ritim_dashboard_assets/icon-walk.svg'),
  pull_ups: require('../../../ritim_dashboard_assets/icon-pullup.svg'),
  water: require('../../../ritim_dashboard_assets/icon-water.svg'),
  coffee: require('../../../ritim_dashboard_assets/icon-coffee.svg'),
  meditation: require('../../../ritim_dashboard_assets/icon-meditation.svg'),
  scan: require('../../../ritim_dashboard_assets/icon-scan.svg'),
  profile: require('../../../ritim_dashboard_assets/icon-profile.svg'),
};

const isWeb = Platform.OS === 'web';
const DEFAULT_DASHBOARD_NAMES = ['push_ups', 'water', 'coffee', 'walking', 'pull_ups'];
const PRIORITY_CARD_FALLBACKS = [
  { name: 'push_ups', displayNameTr: 'Şınav', unit: 'reps', total: 60, target: 110, percent: 55, defaultIncrement: 10, category: 'fitness' },
  { name: 'walking', displayNameTr: 'Yürüyüş', unit: 'min', total: 40, target: 30, percent: 100, defaultIncrement: 10, category: 'fitness' },
  { name: 'pull_ups', displayNameTr: 'Pull-up', unit: 'reps', total: 10, target: 15, percent: 67, defaultIncrement: 5, category: 'fitness' },
];
const WELLNESS_CARD_FALLBACKS = [
  { name: 'water', displayNameTr: 'Su', unit: 'ml', total: 500, target: 2500, percent: 20, defaultIncrement: 500, category: 'wellness' },
  { name: 'coffee', displayNameTr: 'Kahve', unit: 'cup', total: 1, target: 3, percent: 33, defaultIncrement: 1, category: 'wellness' },
  { name: 'meditation', displayNameTr: 'Meditasyon', unit: 'min', total: 10, target: 20, percent: 50, defaultIncrement: 10, category: 'wellness' },
];
const RANGE_OPTIONS = [
  { key: 'day', label: 'Gün' },
  { key: 'week', label: 'Hafta' },
  { key: 'month', label: 'Ay' },
];
const OVERDRIVE_LABELS = ['ATEŞ MODU', 'HEDEF AŞILDI', 'RİTİM YÜKSELİYOR'];
const HOME_MENU_ITEMS = [
  { label: 'NFC Kartlarım', route: 'cards', description: 'Kartlarını ve okutma miktarlarını yönet' },
  { label: 'Geçmiş', route: 'history', description: 'NFC ve manuel kayıtlarını incele' },
  { label: 'Planlar', route: 'routines', description: 'Ritimlerini ve hedef planlarını düzenle' },
  { label: 'Aktivite Kütüphanesi', route: 'activity-library', description: 'Takip edeceğin aktiviteleri seç' },
  { label: 'NFC Ayarları', route: 'nfc-settings', description: 'Kart tarama durumunu kontrol et' },
  { label: 'Profil', route: 'profile', description: 'Hesap ve çalışma alanı' },
];

function HomeActionRow({ navigate }) {
  const actions = [
    { label: 'NFC tara', icon: '⌁', route: 'mock-scan', styleKey: 'homeActionScan' },
    { label: 'Manuel kayıt ekle', icon: '+', route: 'manual-log', params: { category: 'fitness' }, styleKey: 'homeActionManual' },
    { label: 'Planları gör', icon: '↗', route: 'routines', styleKey: 'homeActionPlans' },
  ];
  return (
    <View style={styles.homeActions}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          onPress={() => navigate(action.route, action.params)}
          style={[styles.homeActionButton, styles[action.styleKey]]}
        >
          <Text style={styles.homeActionIcon}>{action.icon}</Text>
          <Text style={styles.homeActionText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function getActivityStatusMessage(item) {
  const percent = Number(item.rawPercent || 0);
  const unit = displayUnit(item.activity.unit);
  if (percent < 50) return 'Başlamak için iyi bir an.';
  if (percent < 80) return 'Ritmin oluşuyor, devam et.';
  if (percent < 100) return 'Hedefe çok yaklaştın.';
  if (percent < 150) return 'Hedef tamamlandı, harika iş.';
  return `🔥 Ateştesin! Hedefi aştın.${item.extra > 0 ? ` +${item.extra} ${unit} fazla` : ''}`;
}

function isWithinRange(dateValue, range) {
  const date = new Date(dateValue);
  const now = new Date();
  if (range === 'day') return date.toDateString() === now.toDateString();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (range === 'week' ? 6 : 29));
  return date >= start;
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getShortDayLabel(date) {
  return new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(date).replace('.', '');
}

function RangeTrendChart({ range, logs, activities, assignments, activeTenantId }) {
  if (range === 'day') return null;
  const totals = logs.reduce((acc, log) => {
    acc[log.activityTypeId] = (acc[log.activityTypeId] || 0) + (Number(log.value) || 0);
    return acc;
  }, {});
  const water = activities.find((activity) => activity.tenantId === activeTenantId && activity.name === 'water');
  const running = activities.find((activity) => activity.tenantId === activeTenantId && activity.name === 'running');
  const topActivityId = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0];
  const activity = (water && (totals[water.id] || range === 'week') ? water : null)
    || (running && totals[running.id] ? running : activities.find((item) => item.id === topActivityId))
    || water
    || running;
  if (!activity) return null;

  const assignment = assignments.find((item) => item.tenantId === activeTenantId && item.activityTypeId === activity.id && item.dailyGoal);
  const dailyTarget = Number(assignment?.dailyGoal) || (activity.name === 'water' ? 2500 : activity.defaultIncrement) || 1;
  const today = startOfDay(new Date());
  const buckets = range === 'week'
    ? Array.from({ length: 7 }).map((_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - index));
        return { key: date.toISOString().slice(0, 10), label: getShortDayLabel(date), start: date, end: new Date(date.getTime() + 86400000), target: dailyTarget };
      })
    : Array.from({ length: 4 }).map((_, index) => {
        const start = new Date(today);
        start.setDate(today.getDate() - ((3 - index) * 7 + 6));
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        return { key: String(index), label: `${index + 1}. hf`, start, end, target: dailyTarget * 7 };
      });
  const values = buckets.map((bucket) => {
    const total = logs
      .filter((log) => log.activityTypeId === activity.id)
      .filter((log) => {
        const date = new Date(log.loggedAt);
        return date >= bucket.start && date < bucket.end;
      })
      .reduce((sum, log) => sum + (Number(log.value) || 0), 0);
    return { ...bucket, total, percent: Math.min(100, Math.round((total / bucket.target) * 100)) };
  });
  const maxValue = Math.max(...values.map((item) => item.total), dailyTarget, 1);
  const total = values.reduce((sum, item) => sum + item.total, 0);
  const targetTotal = values.reduce((sum, item) => sum + item.target, 0);
  const totalPercent = Math.min(100, Math.round((total / targetTotal) * 100));

  return (
    <AppCard style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>{activity.displayNameTr} trendi</Text>
          <Text style={styles.chartMeta}>{total}/{targetTotal} {activity.unit} · hedefin %{totalPercent}</Text>
        </View>
        <Text style={[styles.chartBadge, totalPercent >= 100 && styles.chartBadgeDone]}>{range === 'week' ? '7 gün' : '4 hafta'}</Text>
      </View>
      <View style={styles.barRow}>
        {values.map((item) => {
          const height = Math.max(8, Math.round((item.total / maxValue) * 96));
          const isDone = item.total >= item.target;
          return (
            <View key={item.key} style={styles.barItem}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height }, isDone && styles.barFillDone]} />
                <View style={[styles.goalLine, { bottom: Math.min(92, Math.round((item.target / maxValue) * 96)) }]} />
              </View>
              <Text style={styles.barValue}>{item.total}</Text>
              <Text style={styles.barLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </AppCard>
  );
}

function getRelativeTimeLabel(dateValue) {
  if (!dateValue) return 'Henüz yok';
  const delta = Date.now() - new Date(dateValue).getTime();
  const minutes = Math.max(1, Math.floor(delta / 60000));
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

function EnergyProgress({ percent, toneColor, overdrive, pulseAnim }) {
  const capped = Math.max(2, Math.min(100, percent || 0));
  const glowOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.9] });
  const glowScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });
  return (
    <View style={[styles.progressTrack, overdrive && styles.progressTrackOverdrive]}>
      <Animated.View
        style={[
          styles.progressFill,
          overdrive && styles.progressFillOverdrive,
          {
            width: `${capped}%`,
            backgroundColor: toneColor,
            opacity: overdrive ? glowOpacity : 1,
            transform: overdrive ? [{ scaleX: glowScale }] : undefined,
          },
        ]}
      />
      {overdrive ? <Animated.View style={[styles.progressTrail, { opacity: glowOpacity }]} /> : null}
    </View>
  );
}

function ActivityDashboardCard({ item, index, totalCount, onMove, onGoalChange, onPress, isSettingsMode, compact = false, isActivated = false }) {
  const toneColor = item.rawPercent >= 150 ? colors.orange : item.activity.category === 'wellness' ? dashboardTokens.colors.purple : (item.activity.color || dashboardTokens.colors.green);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const activationAnim = useRef(new Animated.Value(0)).current;
  const overdrive = item.rawPercent >= 150;
  const overdriveLabel = OVERDRIVE_LABELS[index % OVERDRIVE_LABELS.length];
  const cardScale = Animated.add(
    pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, overdrive ? 1.012 : 1] }),
    activationAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.04, 0] })
  );
  const cardGlow = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.62] });
  const shake = activationAnim.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 1], outputRange: [0, -4, 4, -2, 0] });

  useEffect(() => {
    if (!overdrive) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [overdrive, pulseAnim]);

  useEffect(() => {
    if (!isActivated) return;
    activationAnim.setValue(0);
    Animated.timing(activationAnim, { toValue: 1, duration: 520, easing: Easing.out(Easing.back(1.8)), useNativeDriver: true }).start();
  }, [activationAnim, isActivated]);

  return (
    <Pressable onPress={isSettingsMode ? undefined : onPress}>
      <Animated.View style={[
        styles.animatedCardWrap,
        overdrive && { shadowColor: toneColor, shadowOpacity: cardGlow, shadowRadius: 22 },
        { transform: [{ scale: cardScale }, { translateX: shake }] },
      ]}>
      <AppCard style={[
          styles.activityCard,
          compact && styles.compactActivityCard,
          item.activity.category === 'wellness' && styles.wellnessActivityCard,
          overdrive && styles.overdriveCard,
          overdrive && { borderColor: toneColor },
        ]}>
        {overdrive ? (
          <View pointerEvents="none" style={styles.overdriveAura}>
            <Animated.View style={[styles.overdrivePulse, { opacity: cardGlow }]} />
          </View>
        ) : null}
        {isSettingsMode ? (
          <View style={styles.orderControls}>
            <Pressable onPress={() => onMove(index, index - 1)} disabled={index === 0} style={[styles.orderButton, index === 0 && styles.orderButtonDisabled]}>
              <Text style={styles.orderText}>↑</Text>
            </Pressable>
            <Pressable onPress={() => onMove(index, index + 1)} disabled={index === totalCount - 1} style={[styles.orderButton, index === totalCount - 1 && styles.orderButtonDisabled]}>
              <Text style={styles.orderText}>↓</Text>
            </Pressable>
          </View>
        ) : null}
        <ActivityIcon activity={item.activity} size={62} compact={compact} style={[styles.activityIcon, compact && styles.compactActivityIcon, { borderColor: toneColor }]} />
        <View style={styles.activityMain}>
          <View style={styles.activityTitleRow}>
            <Text style={[styles.activityTitle, item.activity.category === 'wellness' && styles.wellnessText]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.84} maxFontSizeMultiplier={1.08}>{item.activity.displayNameTr}</Text>
            {overdrive ? <Text style={[styles.overdrivePill, { color: toneColor, borderColor: toneColor }]} numberOfLines={1}>{overdriveLabel}</Text> : null}
          </View>
          <Text style={[styles.recentMeta, overdrive && { color: colors.orange }]} numberOfLines={compact ? 2 : 1}>
            Plan: {item.target} {displayUnit(item.activity.unit)} · Gerçekleşen: {item.total} / {item.target}
          </Text>
          <EnergyProgress percent={item.rawPercent} toneColor={toneColor} overdrive={overdrive} pulseAnim={pulseAnim} />
          <View style={styles.activityMetaRow}>
            <Text style={styles.cardMetaTiny} numberOfLines={1}>Son kayıt: {item.lastValue ? `+${item.lastValue}` : '-'}</Text>
            <Text style={styles.cardMetaTiny} numberOfLines={1}>Bugün x{item.todayCount || 0}</Text>
            <Text style={styles.cardMetaTiny} numberOfLines={1}>{getRelativeTimeLabel(item.lastLoggedAt)}</Text>
          </View>
          <Text style={[styles.fireCardMessage, !overdrive && styles.statusCardMessage]}>{getActivityStatusMessage(item)}</Text>
        </View>
        {isSettingsMode ? (
          <View style={styles.goalControls}>
            <Pressable onPress={() => onGoalChange(item, -1)} style={styles.goalButton}>
              <Text style={styles.goalButtonText}>−</Text>
            </Pressable>
            <Text style={styles.goalValue}>{item.target}</Text>
            <Pressable onPress={() => onGoalChange(item, 1)} style={styles.goalButton}>
              <Text style={styles.goalButtonText}>+</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={[styles.activityValue, compact && styles.compactActivityValue, item.activity.category === 'wellness' && styles.wellnessText]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>+{item.defaultIncrement}</Text>
        )}
      </AppCard>
      </Animated.View>
    </Pressable>
  );
}

export default function HomeScreen({ route, navigate }) {
  const celebrationParam = route?.params?.celebration;
  const celebrationActivityIdParam = route?.params?.activityTypeId;
  const celebrationValueParam = route?.params?.value;
  const celebrationUnitParam = route?.params?.unit;
  const undoLogIdParam = route?.params?.undoLogId;
  const celebrationText = Array.isArray(celebrationParam) ? celebrationParam[0] : celebrationParam;
  const celebrationActivityId = Array.isArray(celebrationActivityIdParam) ? celebrationActivityIdParam[0] : celebrationActivityIdParam;
  const celebrationValue = Array.isArray(celebrationValueParam) ? celebrationValueParam[0] : celebrationValueParam;
  const celebrationUnit = Array.isArray(celebrationUnitParam) ? celebrationUnitParam[0] : celebrationUnitParam;
  const undoLogId = Array.isArray(undoLogIdParam) ? undoLogIdParam[0] : undoLogIdParam;
  const [showCelebration, setShowCelebration] = useState(Boolean(celebrationText));
  const [undoCandidateId, setUndoCandidateId] = useState(undoLogId || null);
  const [undoMessage, setUndoMessage] = useState('');
  const [celebrationAnim] = useState(() => new Animated.Value(0));
  const [momentumAnim] = useState(() => new Animated.Value(0));
  const [isSettingsMode, setIsSettingsMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [range, setRange] = useState('week');
  const activeTenantId = useStore((s) => s.activeTenantId);
  const activityLogs = useStore((s) => s.activityLogs);
  const activityTypes = useStore((s) => s.activityTypes);
  const cardAssignments = useStore((s) => s.cardAssignments);
  const trackedActivityTypeIds = useStore((s) => s.trackedActivityTypeIds);
  const dashboardActivityOrder = useStore((s) => s.dashboardActivityOrder);
  const setDashboardActivityOrder = useStore((s) => s.setDashboardActivityOrder);
  const updateCardAssignment = useStore((s) => s.updateCardAssignment);
  const setActivityDailyGoal = useStore((s) => s.setActivityDailyGoal);
  const seedDefaultActivityTypes = useStore((s) => s.seedDefaultActivityTypes);
  const repairRoutineActivityLinks = useStore((s) => s.repairRoutineActivityLinks);
  const getDailyGoalProgress = useStore((s) => s.getDailyGoalProgress);
  const getCurrentStreak = useStore((s) => s.getCurrentStreak);
  const getRoutineTodaySummaries = useStore((s) => s.getRoutineTodaySummaries);
  const getFourWeekRoutineProgress = useStore((s) => s.getFourWeekRoutineProgress);
  const getRoutineSuggestion = useStore((s) => s.getRoutineSuggestion);
  const acceptRoutineProgressionSuggestion = useStore((s) => s.acceptRoutineProgressionSuggestion);
  const undoActivityLog = useStore((s) => s.undoActivityLog);

  const rangeLogs = useMemo(() => (
    activityLogs.filter((log) => log.tenantId === activeTenantId && isWithinRange(log.loggedAt, range))
  ), [activeTenantId, activityLogs, range]);
  const rangeStats = useMemo(() => {
    const activityById = new Map(activityTypes.map((activity) => [activity.id, activity]));
    return {
      workoutsCount: rangeLogs.filter((log) => log.category === 'fitness').length,
      wellnessCount: rangeLogs.filter((log) => log.category === 'wellness').length,
      waterTotal: rangeLogs.filter((log) => activityById.get(log.activityTypeId)?.name === 'water').reduce((sum, log) => sum + (Number(log.value) || 0), 0),
      caloriesTotal: Math.round(rangeLogs.reduce((sum, log) => sum + (Number(log.calories) || 0), 0)),
      nfcVerified: rangeLogs.filter((log) => log.source === 'mock_nfc' || log.source === 'nfc').length,
      totalLogs: rangeLogs.length,
    };
  }, [activityTypes, rangeLogs]);
  const rangeLabel = RANGE_OPTIONS.find((item) => item.key === range)?.label || 'Gün';
  const stats = rangeStats;
  const recent = activityLogs.filter((l) => l.tenantId === activeTenantId).slice(0, 3);
  const undoCandidate = undoCandidateId ? activityLogs.find((log) => log.id === undoCandidateId) : null;
  const undoActivity = undoCandidate ? activityTypes.find((activity) => activity.id === undoCandidate.activityTypeId) : null;
  const allGoalProgress = getDailyGoalProgress();
  const streak = getCurrentStreak();
  const routineSummaries = getRoutineTodaySummaries().filter((item) => item.isPlannedToday).slice(0, 4);
  const routineActivityIds = useMemo(() => new Set(
    routineSummaries.map(({ routine }) => routine.activityTypeId).filter(Boolean)
  ), [routineSummaries]);
  const routineActivityNames = useMemo(() => new Set(
    routineSummaries
      .map(({ routine }) => activityTypes.find((activity) => activity.id === routine.activityTypeId)?.name)
      .filter(Boolean)
  ), [activityTypes, routineSummaries]);
  const summaryItems = useMemo(() => {
    const routineItems = routineSummaries.map(({ routine, plan, log }) => ({
      id: routine.id,
      name: routine.name,
      total: log?.completedTotalUnits || 0,
      target: log?.plannedTotalUnits || (plan?.targetType === 'set_based' ? (plan.targetSets || 0) * (plan.targetRepsPerSet || 0) : plan?.targetTotalUnits || 0),
      percent: log?.successPercent || 0,
    }));
    const activityItems = allGoalProgress.filter((item) => !routineActivityIds.has(item.activity?.id)).map((item) => ({
      id: item.activity?.id,
      name: item.activity?.displayNameTr || 'Aktivite',
      total: item.total || 0,
      target: item.target || 0,
      percent: goalPercent(item.total, item.target),
    }));
    return [...routineItems, ...activityItems].filter((item) => item.id && item.target).slice(0, 5);
  }, [allGoalProgress, routineActivityIds, routineSummaries]);
  const summaryPercent = summaryItems.length ? Math.round(summaryItems.reduce((sum, item) => sum + Math.min(100, item.percent), 0) / summaryItems.length) : 0;
  const summaryCompleted = summaryItems.filter((item) => item.percent >= 100).length;
  const gamificationScore = summaryItems.reduce((sum, item) => sum + (item.percent >= 100 ? 100 : 0) + Math.max(0, item.percent - 100), 0);
  const energyValue = Math.min(100, Math.round(summaryPercent * 0.7 + (stats.totalLogs || 0) * 8 + (streak || 0) * 2));
  const averageProgress = (items) => {
    if (!items.length) return undefined;
    return Math.round(items.reduce((sum, item) => sum + item.percent, 0) / items.length);
  };
  const fitnessProgress = averageProgress(allGoalProgress.filter((item) => item.activity?.category === 'fitness'));
  const wellnessProgress = averageProgress(allGoalProgress.filter((item) => item.activity?.category === 'wellness'));
  const waterProgress = allGoalProgress.find((item) => item.activity?.name === 'water')?.percent;
  const totalProgress = averageProgress(allGoalProgress);
  const activityCards = useMemo(() => {
    const assignedIds = cardAssignments.filter((assignment) => assignment.tenantId === activeTenantId).map((assignment) => assignment.activityTypeId);
    const loggedIds = rangeLogs.map((log) => log.activityTypeId);
    const candidateNames = new Set(DEFAULT_DASHBOARD_NAMES);
    const candidateIds = new Set([...assignedIds, ...loggedIds, ...trackedActivityTypeIds]);
    const goalByActivityId = new Map(allGoalProgress.map((goal) => [goal.activity?.id, goal]));
    const candidates = activityTypes
      .filter((activity) => activity.tenantId === activeTenantId && (candidateNames.has(activity.name) || candidateIds.has(activity.id)))
      .map((activity) => {
        const goal = goalByActivityId.get(activity.id);
        const assignment = cardAssignments
          .filter((item) => item.tenantId === activeTenantId && item.activityTypeId === activity.id)
          .sort((a, b) => Number(b.dailyGoal || 0) - Number(a.dailyGoal || 0))[0];
        const logsForActivity = rangeLogs.filter((log) => log.activityTypeId === activity.id);
        const today = new Date().toDateString();
        const todaysLogs = activityLogs.filter((log) => log.tenantId === activeTenantId && log.activityTypeId === activity.id && new Date(log.loggedAt).toDateString() === today);
        const latest = activityLogs.filter((log) => log.tenantId === activeTenantId && log.activityTypeId === activity.id).sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))[0];
        const total = logsForActivity.reduce((sum, log) => sum + (Number(log.value) || 0), 0);
        const target = Number(assignment?.dailyGoal || goal?.target || activity.defaultIncrement * (activity.unit === 'ml' ? 5 : 3));
        const rawPercent = Math.max(0, Math.round((total / target) * 100));
        return {
          activity,
          assignment,
          total,
          target,
          rawPercent,
          percent: Math.min(100, rawPercent),
          extra: Math.max(0, total - target),
          todayCount: todaysLogs.length,
          lastValue: latest?.value || null,
          lastLoggedAt: latest?.loggedAt || null,
          defaultIncrement: activity.defaultIncrement,
        };
      });
    const byId = new Map(candidates.map((item) => [item.activity.id, item]));
    const ordered = dashboardActivityOrder.map((id_) => byId.get(id_)).filter(Boolean);
    const remaining = candidates.filter((item) => !dashboardActivityOrder.includes(item.activity.id));
    return [...ordered, ...remaining].filter((item) => !routineActivityIds.has(item.activity.id)).map((item, orderIndex) => ({ ...item, orderIndex }));
  }, [activeTenantId, activityLogs, activityTypes, allGoalProgress, cardAssignments, dashboardActivityOrder, rangeLogs, routineActivityIds, trackedActivityTypeIds]);
  const createFallbackCard = (fallback, index) => {
    const existing = activityCards.find((item) => item.activity.name === fallback.name);
    if (existing) return existing;
    return {
      activity: {
        id: fallback.name,
        name: fallback.name,
        displayNameTr: fallback.displayNameTr,
        unit: fallback.unit,
        category: fallback.category,
        defaultIncrement: fallback.defaultIncrement,
        color: fallback.category === 'wellness' ? dashboardTokens.colors.purple : dashboardTokens.colors.green,
      },
      assignment: null,
      total: fallback.total,
      target: fallback.target,
      rawPercent: fallback.percent,
      percent: fallback.percent,
      extra: Math.max(0, fallback.total - fallback.target),
      todayCount: fallback.total ? 1 : 0,
      lastValue: fallback.defaultIncrement,
      lastLoggedAt: null,
      defaultIncrement: fallback.defaultIncrement,
      orderIndex: index,
    };
  };
  const buildDashboardCards = (fallbacks, category) => {
    const fallbackNames = new Set(fallbacks.map((item) => item.name));
    const fallbackCards = fallbacks
      .filter((fallback) => !routineActivityNames.has(fallback.name))
      .map(createFallbackCard);
    const trackedCards = activityCards.filter((item) => item.activity.category === category && !fallbackNames.has(item.activity.name));
    return [...fallbackCards, ...trackedCards];
  };
  const priorityCards = buildDashboardCards(PRIORITY_CARD_FALLBACKS, 'fitness');
  const dashboardWellnessCards = buildDashboardCards(WELLNESS_CARD_FALLBACKS, 'wellness');
  const activatedCard = useMemo(() => {
    if (!celebrationActivityId) return null;
    return [...activityCards, ...priorityCards, ...dashboardWellnessCards].find((item) => item.activity.id === celebrationActivityId) || null;
  }, [activityCards, celebrationActivityId, dashboardWellnessCards, priorityCards]);
  const activatedRawPercent = activatedCard?.rawPercent || 0;
  const activatedExtra = activatedCard?.extra || 0;
  const getRoutineTrendLabel = (routineId) => {
    const weeks = getFourWeekRoutineProgress(routineId);
    const weeksWithData = weeks.filter((week) => week.logs.length);
    if (weeksWithData.length < 2) return null;
    const first = weeksWithData[0].successPercent || 0;
    const last = weeksWithData[weeksWithData.length - 1].successPercent || 0;
    const delta = last - first;
    return `Son 4 hafta ${delta >= 0 ? '+' : ''}${delta}%`;
  };

  const moveActivityCard = (from, to) => {
    if (to < 0 || to >= activityCards.length || from === to) return;
    const next = activityCards.map((item) => item.activity.id);
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDashboardActivityOrder(next);
  };

  const changeActivityGoal = (item, direction) => {
    const step = Math.max(1, Number(item.activity.defaultIncrement) || 1);
    const current = Math.max(step, Number(item.assignment?.dailyGoal || item.target || step));
    const nextGoal = Math.max(step, current + direction * step);
    if (item.assignment) {
      updateCardAssignment(item.assignment.id, { dailyGoal: nextGoal });
      return;
    }
    setActivityDailyGoal(activeTenantId, item.activity.id, nextGoal);
  };

  useEffect(() => {
    if (activeTenantId) {
      seedDefaultActivityTypes(activeTenantId);
      repairRoutineActivityLinks(activeTenantId);
    }
  }, [activeTenantId, repairRoutineActivityLinks, seedDefaultActivityTypes]);

  useEffect(() => {
    if (!celebrationText) return;
    setShowCelebration(true);
    celebrationAnim.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(celebrationAnim, { toValue: 1, duration: 320, easing: Easing.out(Easing.back(1.9)), useNativeDriver: true }),
        Animated.timing(momentumAnim, { toValue: 1, duration: 620, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.delay(520),
      Animated.timing(celebrationAnim, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start(() => setShowCelebration(false));
  }, [activatedExtra, activatedRawPercent, celebrationAnim, celebrationText, momentumAnim]);

  useEffect(() => {
    if (!undoLogId) return undefined;
    setUndoCandidateId(undoLogId);
    setUndoMessage('');
    const timer = setTimeout(() => setUndoCandidateId(null), 10000);
    return () => clearTimeout(timer);
  }, [undoLogId]);

  const undoLastLog = () => {
    if (!undoCandidateId) return;
    const undone = undoActivityLog(undoCandidateId);
    if (undone) {
      setUndoMessage('Son kayıt geri alındı.');
      setUndoCandidateId(null);
    }
  };

  return (
    <AppScreen style={[styles.screenShell, isWeb && styles.webBackgroundGlow]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {showCelebration ? (
          <Animated.View style={[styles.celebration, {
            opacity: celebrationAnim,
            transform: [
              { scale: celebrationAnim.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) },
              { translateY: celebrationAnim.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) },
            ],
          }]}>
            <Animated.View style={[styles.celebrationRing, {
              opacity: momentumAnim.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0] }),
              transform: [{ scale: momentumAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.8] }) }],
            }]} />
            <Text style={styles.celebrationKicker}>NFC KAYDEDİLDİ</Text>
            <Text style={styles.celebrationTitle}>{celebrationText?.toUpperCase()}</Text>
            <Text style={styles.celebrationScore}>{celebrationValue ? `+${celebrationValue} ${celebrationUnit || ''}`.trim() : 'MOMENTUM +1'}</Text>
            <Text style={styles.celebrationMeta}>MOMENTUM +1 · STREAK {streak || 1}</Text>
            {activatedCard ? (
              <NFCResultCard
                title={`${activatedCard.activity.displayNameTr} Kartı`}
                value={celebrationValue || activatedCard.defaultIncrement}
                total={activatedCard.total}
                target={activatedCard.target}
                unit={activatedCard.activity.unit}
              />
            ) : null}
          </Animated.View>
        ) : null}
        <View style={styles.header}>
          <Pressable onPress={() => setMenuOpen((value) => !value)} style={styles.menuButton}>
            <Text style={styles.menuButtonText}>{menuOpen ? '×' : '☰'}</Text>
          </Pressable>
          <View style={styles.brandHeader}>
            <Image source={ritimIcon} style={styles.logoIcon} />
            <View>
              <Text style={styles.screenTitle}>Bugün</Text>
              <Text style={styles.kicker}>Dokun. Kaydet. Geliş.</Text>
            </View>
          </View>
          <Pressable onPress={() => navigate('mock-scan')} style={styles.profileShortcut}>
            <Image source={dashboardIcons.scan} style={styles.profileShortcutIcon} />
          </Pressable>
        </View>

        {menuOpen ? (
          <AppCard style={styles.menuPanel}>
            <Text style={styles.menuTitle}>Menü</Text>
            {HOME_MENU_ITEMS.map((item) => (
              <Pressable key={item.route} onPress={() => { setMenuOpen(false); navigate(item.route); }} style={styles.menuRow}>
                <View style={styles.menuRowCopy}>
                  <Text style={styles.menuRowTitle}>{item.label}</Text>
                  <Text style={styles.menuRowMeta}>{item.description}</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </Pressable>
            ))}
          </AppCard>
        ) : null}

        <HomeActionRow navigate={navigate} />
        {undoCandidate ? (
          <AppCard style={styles.undoCard}>
            <View style={styles.undoCopy}>
              <Text style={styles.undoTitle}>{undoActivity?.displayNameTr || 'Aktivite'} +{undoCandidate.value} {displayUnit(undoCandidate.unit)} kaydedildi</Text>
              <Text style={styles.undoMeta}>Yanlış okutma olduysa son kaydı geri alabilirsin.</Text>
            </View>
            <Pressable onPress={undoLastLog} style={styles.undoButton}>
              <Text style={styles.undoButtonText}>Geri al</Text>
            </Pressable>
          </AppCard>
        ) : null}
        {undoMessage ? <Text style={styles.undoMessage}>{undoMessage}</Text> : null}
        <GoalSummaryCard
          percent={summaryPercent}
          completed={summaryCompleted}
          total={summaryItems.length}
          items={summaryItems}
          streak={streak}
          score={gamificationScore}
        />
        <EnergyMeter value={energyValue} />
        {routineSummaries.length ? (
          <View style={styles.routineTodayList}>
            <Text style={styles.routineTodayTitle}>Bugünkü Ritimler</Text>
            {routineSummaries.map(({ routine, plan, log }) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                plan={plan}
                log={log}
                trendLabel={getRoutineTrendLabel(routine.id)}
                suggestion={getRoutineSuggestion(routine.id)}
                onAcceptSuggestion={() => acceptRoutineProgressionSuggestion(routine.id)}
                onPlanPress={() => navigate('routine-plan', { routineId: routine.id })}
                onProgressPress={() => navigate('routine-progress', { routineId: routine.id })}
              />
            ))}
          </View>
        ) : null}
        <View style={styles.priorityHeader}>
          <View style={styles.priorityTitleWrap}>
            <Text style={styles.priorityIcon}>◎</Text>
            <Text style={styles.priorityTitle}>Öncelikli hedefler</Text>
          </View>
          <Pressable onPress={() => setIsSettingsMode((value) => !value)} style={[styles.sortToggle, isSettingsMode && styles.sortToggleActive]}>
            <Text style={styles.sortToggleText}>{isSettingsMode ? 'Bitti' : 'Ayarla'}</Text>
          </Pressable>
        </View>
        {isSettingsMode ? (
          <AppCard style={styles.dashboardSettingsCard}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Dashboard ayarları</Text>
              <Text style={styles.settingsMeta}>Aralık, sıralama ve hedefler</Text>
            </View>
            <View style={styles.rangePicker}>
              {RANGE_OPTIONS.map((option) => (
                <Pressable key={option.key} onPress={() => setRange(option.key)} style={[styles.rangeButton, range === option.key && styles.rangeButtonActive, range === option.key && isWeb && styles.webGradient]}>
                  <Text style={[styles.rangeText, range === option.key && styles.rangeTextActive]}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
          </AppCard>
        ) : null}
        {priorityCards.length ? (
          <View style={styles.activityList}>
            {priorityCards.map((item) => (
              <ActivityDashboardCard
                key={item.activity.id}
                item={item}
                index={item.orderIndex}
                totalCount={activityCards.length}
                onMove={moveActivityCard}
                onGoalChange={changeActivityGoal}
                isSettingsMode={isSettingsMode}
                isActivated={celebrationActivityId === item.activity.id}
                onPress={() => navigate('manual-log', { category: item.activity.category, activityName: item.activity.name })}
              />
            ))}
          </View>
        ) : (
          <EmptyState title="Kart yok" description="Kart tanımladığında öncelikli aktivite kartları burada görünür." />
        )}

        {dashboardWellnessCards.length ? (
          <>
            <View style={styles.wellnessHeader}>
              <Text style={styles.wellnessHeaderIcon}>♡</Text>
              <Text style={styles.wellnessHeaderTitle}>Wellness</Text>
            </View>
            <View style={styles.wellnessGrid}>
              {dashboardWellnessCards.map((item) => (
                <View key={item.activity.id} style={styles.wellnessGridItem}>
                  <ActivityDashboardCard
                    item={item}
                    index={item.orderIndex}
                    totalCount={activityCards.length}
                    onMove={moveActivityCard}
                    onGoalChange={changeActivityGoal}
                    isSettingsMode={isSettingsMode}
                    compact
                    isActivated={celebrationActivityId === item.activity.id}
                    onPress={() => navigate('manual-log', { category: item.activity.category, activityName: item.activity.name })}
                  />
                </View>
              ))}
            </View>
          </>
        ) : null}

        <RangeTrendChart
          range={range}
          logs={rangeLogs}
          activities={activityTypes}
          assignments={cardAssignments}
          activeTenantId={activeTenantId}
        />

        <AppCard style={styles.quickNfcCard}>
          <Image source={ritimIcon} style={styles.quickLogo} />
          <View style={styles.quickNfcMain}>
            <Text style={styles.quickNfcTitle}>NFC hızlı kayıt</Text>
            <Text style={styles.quickNfcMeta}>Fiziksel aksiyon → dijital momentum.</Text>
            <View style={styles.quickStats}>
              <View>
                <Text style={styles.quickStatValue}>{stats.nfcVerified || 0}</Text>
                <Text style={styles.quickStatLabel}>Ritim</Text>
              </View>
              <View style={styles.quickDivider} />
              <View>
                <Text style={[styles.quickStatValue, styles.wellnessText]}>{stats.waterTotal || 0} ml</Text>
                <Text style={styles.quickStatLabel}>Su</Text>
              </View>
            </View>
          </View>
        </AppCard>

        <SectionHeader title="Son aktiviteler" />
        {recent.length ? (
          <AppCard style={styles.listCard}>
            {recent.map((log) => {
            const activity = activityTypes.find((t) => t.id === log.activityTypeId);
            return (
              <View key={log.id} style={styles.recentRow}>
                <View>
                  <Text style={[styles.recentTitle, activity?.category === 'wellness' && styles.wellnessText]}>{activity ? activity.displayNameTr : 'Aktivite'}</Text>
                  <Text style={styles.recentMeta}>{displaySource(log.source)}</Text>
                </View>
                <Text style={[styles.recentValue, activity?.category === 'wellness' && styles.wellnessText]}>+{log.value} {displayUnit(log.unit)}</Text>
              </View>
            );
            })}
          </AppCard>
        ) : (
          <EmptyState title="Henüz kayıt yok" description="Kart okut veya manuel kayıt ekle." />
        )}

        <SectionHeader title={`${rangeLabel} istatistikleri`} />
        <View style={styles.statsGrid}>
          <StatCard label="Fitness" value={stats.workoutsCount} meta="antrenman" progress={fitnessProgress} tone="fitness" onPress={() => navigate('manual-log', { category: 'fitness' })} />
          <StatCard label="Wellness" value={stats.wellnessCount} meta="aksiyon" progress={wellnessProgress} tone="wellness" onPress={() => navigate('manual-log', { category: 'wellness' })} />
          <StatCard label="Su" value={stats.waterTotal} meta="ml" progress={waterProgress} tone="wellness" onPress={() => navigate('manual-log', { category: 'wellness', activityName: 'water' })} />
          <StatCard label="Toplam" value={stats.totalLogs} meta="kayıt" progress={totalProgress} onPress={() => navigate('manual-log', { category: 'fitness' })} />
          <StatCard label="Streak" value={streak} meta="gün" />
          <StatCard label="Kalori" value={Math.round(stats.caloriesTotal || 0)} meta="kcal" tone="fitness" />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenShell: { backgroundColor: dashboardTokens.colors.background },
  webBackgroundGlow: { backgroundImage: dashboardTokens.gradients.backgroundGlow },
  content: { paddingBottom: 120 },
  webGradient: { backgroundImage: dashboardTokens.gradients.brand },
  celebration: {
    position: 'absolute',
    top: 84,
    left: 10,
    right: 10,
    zIndex: 14,
    minHeight: 220,
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: dashboardTokens.colors.cyan,
    backgroundColor: 'rgba(2, 10, 19, 0.92)',
    shadowColor: dashboardTokens.colors.cyan,
    shadowOpacity: 0.64,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  celebrationRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: dashboardTokens.colors.cyan,
    backgroundColor: 'rgba(55, 183, 255, 0.08)',
  },
  celebrationKicker: { color: dashboardTokens.colors.cyan, fontSize: 12, fontWeight: '900', letterSpacing: 0 },
  celebrationTitle: { color: colors.textPrimary, fontSize: 29, fontWeight: '900', marginTop: 8, textAlign: 'center' },
  celebrationScore: { color: dashboardTokens.colors.green, fontSize: 42, fontWeight: '900', marginTop: 8, textAlign: 'center' },
  celebrationMeta: { color: dashboardTokens.colors.purple, fontWeight: '900', marginTop: 8 },
  undoCard: { marginBottom: 12, borderColor: 'rgba(255,177,95,0.44)', backgroundColor: 'rgba(255,177,95,0.08)', flexDirection: 'row', alignItems: 'center', gap: 12 },
  undoCopy: { flex: 1, minWidth: 0 },
  undoTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  undoMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 16 },
  undoButton: { minHeight: 38, borderRadius: 999, borderWidth: 1, borderColor: colors.orange, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  undoButtonText: { color: colors.orange, fontWeight: '900' },
  undoMessage: { color: colors.textSecondary, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10, minHeight: 48 },
  menuButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: dashboardTokens.colors.surface, borderColor: dashboardTokens.colors.border, borderWidth: 1 },
  menuButtonText: { color: dashboardTokens.colors.textPrimary, fontSize: 22, lineHeight: 25, fontWeight: '900' },
  brandHeader: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: { width: 58, height: 38, resizeMode: 'contain' },
  screenTitle: { color: dashboardTokens.colors.textPrimary, fontSize: 21, fontWeight: '900', letterSpacing: 0 },
  kicker: { color: dashboardTokens.colors.textSecondary, fontSize: 12, fontWeight: '700', marginTop: 1 },
  profileShortcut: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: dashboardTokens.colors.surface, borderColor: dashboardTokens.colors.border, borderWidth: 1 },
  profileShortcutIcon: { width: 22, height: 22, resizeMode: 'contain' },
  menuPanel: { marginTop: -2, marginBottom: 12, borderColor: dashboardTokens.colors.border, backgroundColor: 'rgba(13,24,40,0.96)' },
  menuTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', marginBottom: 8 },
  menuRow: { minHeight: 58, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  menuRowCopy: { flex: 1, minWidth: 0 },
  menuRowTitle: { color: colors.textPrimary, fontWeight: '800' },
  menuRowMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  menuArrow: { color: colors.textSecondary, fontSize: 24 },
  dashboardSettingsCard: { gap: 14, marginBottom: 18, padding: 14, borderRadius: 18, backgroundColor: dashboardTokens.colors.surface, borderColor: dashboardTokens.colors.border },
  settingsHeader: { gap: 3 },
  settingsTitle: { color: dashboardTokens.colors.textPrimary, fontSize: 16, fontWeight: '900' },
  settingsMeta: { color: dashboardTokens.colors.textSecondary, fontSize: 12, fontWeight: '800' },
  rangePicker: { flexDirection: 'row', gap: 6, backgroundColor: dashboardTokens.colors.surfaceElevated, borderColor: dashboardTokens.colors.border, borderWidth: 1, borderRadius: 999, padding: 4 },
  rangeButton: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999 },
  rangeButtonActive: { backgroundColor: dashboardTokens.colors.turquoise, shadowColor: dashboardTokens.colors.violet, shadowOpacity: 0.42, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  rangeText: { color: dashboardTokens.colors.textSecondary, fontSize: 16, fontWeight: '900' },
  rangeTextActive: { color: '#FFFFFF' },
  homeActions: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  homeActionButton: { flex: 1, minHeight: 48, borderRadius: 16, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: dashboardTokens.colors.surface, borderColor: dashboardTokens.colors.border },
  homeActionScan: { borderColor: dashboardTokens.colors.turquoise, backgroundColor: 'rgba(64,224,208,0.10)' },
  homeActionManual: { borderColor: dashboardTokens.colors.purple, backgroundColor: 'rgba(155,92,255,0.10)' },
  homeActionPlans: { borderColor: 'rgba(55,183,255,0.42)', backgroundColor: 'rgba(55,183,255,0.08)' },
  homeActionIcon: { color: colors.textPrimary, fontSize: 16, fontWeight: '900', lineHeight: 18 },
  homeActionText: { maxWidth: '100%', color: colors.textPrimary, fontSize: 11, fontWeight: '900', textAlign: 'center' },
  priorityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 2 },
  priorityTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  priorityIcon: { color: dashboardTokens.colors.turquoise, fontSize: 22, fontWeight: '900' },
  priorityTitle: { color: dashboardTokens.colors.textPrimary, fontSize: 19, fontWeight: '900', letterSpacing: 0 },
  sortToggle: { minWidth: 58, minHeight: 34, alignItems: 'center', justifyContent: 'center', borderColor: dashboardTokens.colors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: dashboardTokens.colors.surface },
  sortToggleActive: { borderColor: dashboardTokens.colors.turquoise, backgroundColor: dashboardTokens.colors.surfaceElevated },
  sortToggleText: { color: dashboardTokens.colors.turquoise, fontWeight: '900', fontSize: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  activityList: { gap: 9, marginBottom: 18 },
  animatedCardWrap: { borderRadius: dashboardTokens.radius.card },
  activityCard: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 90, paddingVertical: 12, paddingHorizontal: 12, borderRadius: dashboardTokens.radius.card, backgroundColor: dashboardTokens.colors.surface, borderColor: dashboardTokens.colors.border, overflow: 'hidden' },
  compactActivityCard: { minHeight: 128, alignItems: 'flex-start', gap: 8, padding: 12, flexDirection: 'column' },
  wellnessActivityCard: { borderColor: dashboardTokens.colors.purple, backgroundColor: dashboardTokens.colors.wellnessSurface },
  overdriveCard: { borderWidth: 1.5, backgroundColor: 'rgba(8, 26, 38, 0.96)' },
  overdriveAura: { ...StyleSheet.absoluteFillObject },
  overdrivePulse: { position: 'absolute', left: -40, right: -40, top: -30, height: 86, backgroundColor: 'rgba(55, 183, 255, 0.12)', borderRadius: 999 },
  orderControls: { width: 32, gap: 4 },
  orderButton: { height: 22, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1 },
  orderButtonDisabled: { opacity: 0.28 },
  orderText: { color: colors.textPrimary, fontWeight: '900', fontSize: 13 },
  goalControls: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  goalButton: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1 },
  goalButtonText: { color: colors.textPrimary, fontWeight: '900', fontSize: 15 },
  goalValue: { minWidth: 34, color: colors.textPrimary, fontWeight: '900', fontSize: 12, textAlign: 'center' },
  activityIcon: { width: 62, height: 62, borderRadius: dashboardTokens.radius.iconBox, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: dashboardTokens.colors.surfaceElevated },
  compactActivityIcon: { width: 50, height: 50, borderRadius: 999 },
  activityIconImage: { width: 30, height: 30, resizeMode: 'contain' },
  compactActivityIconImage: { width: 26, height: 26 },
  activityIconText: { fontSize: 18, fontWeight: '900' },
  compactActivityIconText: { fontSize: 20 },
  activityMain: { flex: 1, minWidth: 0 },
  activityTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  activityTitle: { flex: 1, minWidth: 0, color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  activityValue: { width: 58, textAlign: 'right', color: colors.primary, fontSize: 17, fontWeight: '900' },
  compactActivityValue: { position: 'absolute', right: 12, top: 15, fontSize: 14 },
  overdrivePill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3, fontSize: 9, fontWeight: '900', overflow: 'hidden' },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: colors.border, marginTop: 8, overflow: 'hidden', position: 'relative' },
  progressTrackOverdrive: { borderWidth: 1, borderColor: 'rgba(55,183,255,0.32)', backgroundColor: 'rgba(55,183,255,0.10)' },
  progressFill: { height: 7, borderRadius: 999 },
  progressFillOverdrive: { height: 9, shadowColor: dashboardTokens.colors.cyan, shadowOpacity: 0.8, shadowRadius: 12 },
  progressTrail: { position: 'absolute', top: 1, bottom: 1, right: 8, width: 42, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.42)' },
  activityMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 },
  cardMetaTiny: { maxWidth: '100%', color: colors.textSecondary, fontSize: 10, fontWeight: '700', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 3 },
  fireCardMessage: { color: colors.orange, fontWeight: '900', fontSize: 11, marginTop: 6 },
  statusCardMessage: { color: colors.textSecondary },
  wellnessHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2, marginBottom: 10 },
  wellnessHeaderIcon: { color: dashboardTokens.colors.purple, fontSize: 23, fontWeight: '900' },
  wellnessHeaderTitle: { color: dashboardTokens.colors.textPrimary, fontSize: 19, fontWeight: '900' },
  wellnessGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 18 },
  wellnessGridItem: { flexBasis: '31.8%', flexGrow: 1, minWidth: 124 },
  chartCard: { marginBottom: 20, borderRadius: 16, padding: 18 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 12 },
  chartTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '900' },
  chartMeta: { color: colors.textSecondary, marginTop: 4, fontWeight: '700' },
  chartBadge: { color: colors.secondary, fontSize: 12, fontWeight: '900', backgroundColor: 'rgba(55,183,255,0.12)', borderColor: colors.secondary, borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  chartBadgeDone: { color: colors.primary, borderColor: colors.primary, backgroundColor: 'rgba(53,226,122,0.12)' },
  barRow: { height: 148, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 7 },
  barItem: { flex: 1, alignItems: 'center', minWidth: 0 },
  barTrack: { height: 104, width: '100%', maxWidth: 28, justifyContent: 'flex-end', borderRadius: 999, backgroundColor: colors.surfaceLight, overflow: 'hidden', position: 'relative' },
  barFill: { width: '100%', borderTopLeftRadius: 999, borderTopRightRadius: 999, backgroundColor: colors.secondary },
  barFillDone: { backgroundColor: colors.primary },
  goalLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: colors.textPrimary, opacity: 0.45 },
  barValue: { color: colors.textPrimary, fontSize: 11, fontWeight: '900', marginTop: 7 },
  barLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', marginTop: 2 },
  quickNfcCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: dashboardTokens.radius.card, marginBottom: 18, backgroundColor: dashboardTokens.colors.surface, borderColor: dashboardTokens.colors.border },
  quickLogo: { width: 58, height: 58, resizeMode: 'contain', borderRadius: dashboardTokens.radius.iconBox },
  quickNfcMain: { flex: 1, minWidth: 0 },
  quickNfcTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: '900' },
  quickNfcMeta: { color: colors.textSecondary, fontWeight: '700', marginTop: 4 },
  quickStats: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 12 },
  quickStatValue: { color: colors.primary, fontSize: 16, fontWeight: '900' },
  quickStatLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800', marginTop: 2 },
  quickDivider: { width: 1, height: 34, backgroundColor: colors.border },
  quickScanButton: { width: 78, minHeight: 56, borderRadius: dashboardTokens.radius.button, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: dashboardTokens.colors.surfaceElevated, borderColor: dashboardTokens.colors.turquoise, borderWidth: 1, shadowColor: dashboardTokens.colors.violet, shadowOpacity: 0.36, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  quickScanIconImage: { width: 24, height: 24, resizeMode: 'contain' },
  quickScanText: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  listCard: { marginBottom: 14 },
  recentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomColor: colors.border, borderBottomWidth: 1 },
  recentTitle: { color: colors.textPrimary, fontWeight: '800' },
  recentMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  recentValue: { color: colors.primary, fontWeight: '800' },
  wellnessText: { color: colors.pink },
  fireText: { color: '#FF8A2A', fontWeight: '900', marginTop: 6 },
  routineTodayList: { marginBottom: 14 },
  routineTodayTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', marginBottom: 8 },
});
