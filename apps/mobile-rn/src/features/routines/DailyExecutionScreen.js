import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import AppScreen from '../../components/AppScreen';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import useStore from '../../store/store';
import colors from '../../theme/colors';
import {
  ProgressBarWithOverflow,
  OverachievementBanner,
  SetEntryList,
  planLabel,
  unitLabel,
  categoryLabel,
} from './RoutineComponents';

function defaultEntries(plan) {
  if (!plan) return [];
  if (plan.targetType === 'set_based') {
    return Array.from({ length: Number(plan.targetSets) || 1 }).map(() => ({ value: '', entryType: 'set' }));
  }
  const blocks = Number(plan.blocks) || 1;
  return Array.from({ length: blocks }).map(() => ({ value: '', entryType: 'block' }));
}

export default function DailyExecutionScreen({ route, navigate }) {
  const routineId = route?.params?.routineId;
  const routines = useStore((s) => s.routines);
  const routineLogEntries = useStore((s) => s.routineLogEntries);
  const getActiveRoutinePlan = useStore((s) => s.getActiveRoutinePlan);
  const getOrCreateRoutineDailyLog = useStore((s) => s.getOrCreateRoutineDailyLog);
  const upsertRoutineLogEntries = useStore((s) => s.upsertRoutineLogEntries);
  const getRoutineSuggestion = useStore((s) => s.getRoutineSuggestion);
  const routine = routines.find((item) => item.id === routineId);
  const plan = getActiveRoutinePlan(routineId);
  const [dailyLog, setDailyLog] = useState(null);
  const [entries, setEntries] = useState([]);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    if (!routineId) return;
    const log = getOrCreateRoutineDailyLog(routineId);
    setDailyLog(log);
    const existing = routineLogEntries.filter((entry) => entry.dailyLogId === log?.id).sort((a, b) => a.entryIndex - b.entryIndex);
    isDirtyRef.current = false;
    setEntries(existing.length ? existing.map((entry) => ({ ...entry, value: String(entry.value) })) : defaultEntries(plan));
  }, [getOrCreateRoutineDailyLog, plan?.id, routineId]);

  useEffect(() => {
    if (!routineId || !dailyLog || !isDirtyRef.current) return;
    const timeout = setTimeout(() => {
      const result = upsertRoutineLogEntries({ routineId, entries });
      if (result?.dailyLog) setDailyLog(result.dailyLog);
    }, 250);
    return () => clearTimeout(timeout);
  }, [dailyLog?.id, entries, routineId, upsertRoutineLogEntries]);

  const suggestion = useMemo(() => getRoutineSuggestion(routineId), [dailyLog?.successPercent, getRoutineSuggestion, routineId]);
  const unit = unitLabel(plan?.unitType);
  const plannedTotal = dailyLog?.plannedTotalUnits || 0;
  const completedTotal = dailyLog?.completedTotalUnits || 0;
  const minimumSuccessPercent = plan?.minimumSuccessPercent || 80;
  const minimumSuccess = Math.round((plannedTotal * minimumSuccessPercent) / 100);
  const planUpgradeActive = (dailyLog?.successPercent || 0) >= 120;

  if (!routine || !plan) {
    return (
      <AppScreen>
        <Text style={styles.title}>Ritim bulunamadı</Text>
        <AppButton onPress={() => navigate('routines')}>Planlara dön</AppButton>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Bugünkü {routine.name}</Text>
        <Text style={styles.subtitle}>{categoryLabel(routine.category)} · İlerleme otomatik kaydedilir.</Text>

        <AppCard style={styles.summaryCard}>
          <Text style={styles.planText}>Plan: {planLabel(plan)}</Text>
          <View style={styles.metricGrid}>
            <Metric label="Planlanan" value={`${dailyLog?.plannedTotalUnits || 0} ${unit}`} />
            <Metric label="Gerçekleşen" value={`${dailyLog?.completedTotalUnits || 0} ${unit}`} />
            <Metric label="Ekstra" value={`+${dailyLog?.extraUnits || 0} ${unit}`} fire={dailyLog?.isOverachieved} />
            <Metric label="Başarı" value={`%${dailyLog?.successPercent || 0}`} fire={dailyLog?.isOverachieved} />
          </View>
          <ProgressBarWithOverflow percent={dailyLog?.successPercent || 0} />
          <View style={styles.noteBox}>
            <Text style={styles.note}>Günlük hedef: {plannedTotal} {unit}</Text>
            <Text style={styles.note}>Başarılı sayılmak için minimum: {minimumSuccess} {unit} (%{minimumSuccessPercent})</Text>
            <Text style={styles.note}>Hedefi aşarsan ekstra {unit} ayrıca kaydedilir.</Text>
          </View>
        </AppCard>

        <OverachievementBanner log={dailyLog} unitType={plan.unitType} />

        {planUpgradeActive ? (
          <AppCard style={styles.planHintCard}>
            <Text style={styles.planHintTitle}>Planını yükseltmeyi düşünebilirsin</Text>
            <Text style={styles.planHintText}>Bu ritim sana kolay geliyor. Üst üste başarılı günlerin arttıkça ateş seviyen yükselir.</Text>
          </AppCard>
        ) : completedTotal >= minimumSuccess ? (
          <Text style={styles.softHint}>Başarılı günlerin arttıkça ateş seviyen yükselir.</Text>
        ) : null}

        <AppCard style={styles.card}>
          <SetEntryList
            entries={entries}
            setEntries={(updater) => {
              isDirtyRef.current = true;
              setEntries(updater);
            }}
            plan={plan}
          />
        </AppCard>

        {suggestion ? (
          <AppCard style={styles.suggestionCard}>
            <Text style={styles.suggestionTitle}>Gelişim önerisi</Text>
            <Text style={styles.suggestionText}>{suggestion.message}</Text>
            <View style={styles.actionRow}>
              <AppButton onPress={() => navigate('routine-plan', { routineId })} style={styles.acceptButton}>Öneriyi Kabul Et</AppButton>
              <AppButton onPress={() => undefined} style={styles.secondaryButton}>Daha Sonra</AppButton>
            </View>
          </AppCard>
        ) : null}

        <AppButton onPress={() => navigate('routines')} style={styles.secondaryButton}>Planlara dön</AppButton>
      </ScrollView>
    </AppScreen>
  );
}

function Metric({ label, value, fire }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, fire && styles.fireText]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 156 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '900' },
  subtitle: { color: colors.textSecondary, marginTop: 6, marginBottom: 16 },
  summaryCard: { marginBottom: 14, borderColor: '#40E0D0' },
  card: { marginBottom: 14 },
  planText: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', marginBottom: 12 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { width: '48%', borderRadius: 14, padding: 12, backgroundColor: colors.surfaceLight },
  metricLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  metricValue: { color: colors.textPrimary, fontSize: 17, fontWeight: '900', marginTop: 5 },
  fireText: { color: '#FF8A2A' },
  noteBox: { marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, gap: 5 },
  note: { color: colors.textSecondary, lineHeight: 19 },
  planHintCard: { marginBottom: 14, borderColor: colors.orange, backgroundColor: 'rgba(255,138,42,0.10)' },
  planHintTitle: { color: colors.orange, fontWeight: '900', fontSize: 16 },
  planHintText: { color: colors.textSecondary, lineHeight: 20, marginTop: 7 },
  softHint: { color: colors.textSecondary, lineHeight: 19, marginBottom: 14, paddingHorizontal: 2 },
  suggestionCard: { marginBottom: 14, borderColor: colors.purple, backgroundColor: 'rgba(155,92,255,0.10)' },
  suggestionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  suggestionText: { color: colors.textSecondary, lineHeight: 20, marginTop: 8 },
  actionRow: { gap: 10, marginTop: 12 },
  acceptButton: { backgroundColor: colors.purple },
  secondaryButton: { marginTop: 12, backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1 },
});
