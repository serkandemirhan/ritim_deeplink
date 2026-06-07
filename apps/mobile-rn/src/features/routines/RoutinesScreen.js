import React, { useEffect } from 'react';
import { ScrollView, Text, StyleSheet, View, Pressable } from 'react-native';
import AppScreen from '../../components/AppScreen';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import EmptyState from '../../components/EmptyState';
import useStore from '../../store/store';
import colors from '../../theme/colors';
import { RoutineCard } from './RoutineComponents';

const learningActivityNames = new Set(['book_reading', 'english', 'french', 'turkish_diction', 'education_video']);

export default function RoutinesScreen({ navigate }) {
  const activeTenantId = useStore((s) => s.activeTenantId);
  const routines = useStore((s) => s.routines);
  const activityTypes = useStore((s) => s.activityTypes);
  const getRoutineTodaySummaries = useStore((s) => s.getRoutineTodaySummaries);
  const getLatestRoutinePlan = useStore((s) => s.getLatestRoutinePlan);
  const getFourWeekRoutineProgress = useStore((s) => s.getFourWeekRoutineProgress);
  const getRoutineSuggestion = useStore((s) => s.getRoutineSuggestion);
  const acceptRoutineProgressionSuggestion = useStore((s) => s.acceptRoutineProgressionSuggestion);
  const createRoutineWithPlan = useStore((s) => s.createRoutineWithPlan);
  const seedDefaultActivityTypes = useStore((s) => s.seedDefaultActivityTypes);
  const repairRoutineActivityLinks = useStore((s) => s.repairRoutineActivityLinks);
  const summaries = getRoutineTodaySummaries().filter((item) => item.routine.tenantId === activeTenantId);
  const completedCount = summaries.filter((item) => (item.log?.successPercent || 0) >= 100).length;
  const overCount = summaries.filter((item) => (item.log?.successPercent || 0) > 100).length;
  const waitingCount = summaries.filter((item) => (item.log?.successPercent || 0) < 100).length;
  const getActivity = (routine) => activityTypes.find((activity) => activity.id === routine.activityTypeId);
  const fitnessSummaries = summaries.filter((item) => item.routine.category !== 'wellness');
  const learningSummaries = summaries.filter((item) => learningActivityNames.has(getActivity(item.routine)?.name));
  const wellnessSummaries = summaries.filter((item) => item.routine.category === 'wellness' && !learningActivityNames.has(getActivity(item.routine)?.name));

  const getTrendLabel = (routineId) => {
    const weeks = getFourWeekRoutineProgress(routineId);
    const weeksWithData = weeks.filter((week) => week.logs.length);
    if (weeksWithData.length < 2) return null;
    const first = weeksWithData[0].successPercent || 0;
    const last = weeksWithData[weeksWithData.length - 1].successPercent || 0;
    const delta = last - first;
    return `Son 4 hafta ${delta >= 0 ? '+' : ''}${delta}%`;
  };

  const renderGroup = (title, icon, items, tone) => {
    if (!items.length) return null;
    return (
      <View style={styles.group}>
        <View style={styles.groupHeader}>
          <Text style={[styles.groupIcon, tone === 'wellness' && styles.groupIconWellness]}>{icon}</Text>
          <Text style={styles.groupTitle}>{title}</Text>
        </View>
        {items.map(({ routine, plan, log }) => {
          const displayPlan = getLatestRoutinePlan(routine.id) || plan;
          const suggestion = getRoutineSuggestion(routine.id);
          return (
            <RoutineCard
              key={routine.id}
              routine={routine}
              plan={displayPlan}
              log={log}
              trendLabel={getTrendLabel(routine.id)}
              suggestion={suggestion}
              onAcceptSuggestion={() => acceptRoutineProgressionSuggestion(routine.id)}
              onPlanPress={() => navigate('routine-plan', { routineId: routine.id })}
              onProgressPress={() => navigate('routine-progress', { routineId: routine.id })}
            />
          );
        })}
      </View>
    );
  };

  useEffect(() => {
    if (!activeTenantId) return;
    const library = seedDefaultActivityTypes(activeTenantId);
    repairRoutineActivityLinks(activeTenantId);
    if (routines.some((routine) => routine.tenantId === activeTenantId && routine.targetType)) return;
    const pushUps = library.find((activity) => activity.name === 'push_ups');
    const bookReading = library.find((activity) => activity.name === 'book_reading');
    createRoutineWithPlan({
      tenantId: activeTenantId,
      activityTypeId: pushUps?.id,
      name: 'Şınav',
      category: 'exercise',
      targetType: 'set_based',
      selectedDays: ['mon', 'wed', 'fri'],
      plan: { targetSets: 5, targetRepsPerSet: 15, unitType: 'repetition', minimumSuccessPercent: 80 },
      progressionRule: { mode: 'weekly', increaseAmount: 2, increaseUnit: 'reps_per_set', startPolicy: 'next_week', maxTargetRepsPerSet: 30 },
    });
    createRoutineWithPlan({
      tenantId: activeTenantId,
      activityTypeId: bookReading?.id,
      name: 'Kitap Okuma',
      category: 'wellness',
      targetType: 'page_based',
      selectedDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      plan: { targetTotalUnits: 20, blocks: 4, unitsPerBlock: 5, unitType: 'page', minimumSuccessPercent: 80 },
      progressionRule: { mode: 'monthly', increaseAmount: 5, increaseUnit: 'pages_per_day', startPolicy: 'next_month', maxTotalUnits: 50 },
    });
  }, [activeTenantId, activityTypes.length, createRoutineWithPlan, repairRoutineActivityLinks, routines, seedDefaultActivityTypes]);

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Planlar</Text>
            <Text style={styles.subtitle}>Hedefini günlere böl, aşınca ritmini yükselt.</Text>
          </View>
          <Pressable onPress={() => navigate('routine-create')} style={styles.plusButton}>
            <Text style={styles.plusText}>+</Text>
          </Pressable>
        </View>

        <AppCard style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>🔥 Günlük Ritim</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryValue}>{completedCount}</Text>
              <Text style={styles.summaryLabel}>tamamlandı</Text>
            </View>
            <View style={[styles.summaryPill, styles.summaryPillFire]}>
              <Text style={[styles.summaryValue, styles.fireText]}>{overCount}</Text>
              <Text style={styles.summaryLabel}>aşıldı</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryValue}>{waitingCount}</Text>
              <Text style={styles.summaryLabel}>bekliyor</Text>
            </View>
          </View>
        </AppCard>

        {summaries.length ? (
          <>
            {renderGroup('Fitness', '💪', fitnessSummaries, 'fitness')}
            {renderGroup('Wellness', '◆', wellnessSummaries, 'wellness')}
            {renderGroup('Learning', '📚', learningSummaries, 'learning')}
          </>
        ) : (
          <EmptyState title="Henüz ritim oluşturmadın" description="İlk hedefini belirle." />
        )}

        <AppButton onPress={() => navigate('routine-create')} style={styles.createButton}>Ritim Oluştur</AppButton>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 88 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  headerText: { flex: 1, minWidth: 0 },
  title: { color: colors.textPrimary, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colors.textSecondary, marginTop: 4, lineHeight: 20 },
  plusButton: { width: 56, height: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#40E0D0' },
  plusText: { color: '#061422', fontSize: 34, fontWeight: '900', marginTop: -2 },
  summaryCard: { marginBottom: 14, borderColor: 'rgba(64,224,208,0.34)', backgroundColor: 'rgba(64,224,208,0.07)', padding: 14 },
  summaryTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: '900', marginBottom: 11 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryPill: { flex: 1, minHeight: 58, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  summaryPillFire: { borderColor: 'rgba(255,138,42,0.42)', backgroundColor: 'rgba(255,138,42,0.09)' },
  summaryValue: { color: '#40E0D0', fontSize: 21, fontWeight: '900' },
  summaryLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800', marginTop: 2 },
  fireText: { color: colors.orange },
  group: { marginTop: 4, marginBottom: 8 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 8, paddingHorizontal: 2 },
  groupIcon: { color: '#40E0D0', fontSize: 18, fontWeight: '900' },
  groupIconWellness: { color: colors.purple },
  groupTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  createButton: { marginTop: 8 },
});
