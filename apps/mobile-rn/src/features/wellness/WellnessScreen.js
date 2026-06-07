import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppScreen from '../../components/AppScreen';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import AppTextInput from '../../components/AppTextInput';
import BottomNav from '../../components/BottomNav';
import EmptyState from '../../components/EmptyState';
import SectionHeader from '../../components/SectionHeader';
import StatCard from '../../components/StatCard';
import useStore from '../../store/store';
import colors from '../../theme/colors';
import { canShowDebugUi, displaySource, displayUnit } from '../../lib/uiText';

const WELLNESS_NAMES = ['water', 'coffee', 'sleep', 'steps', 'weight', 'daily_note'];

export default function WellnessScreen({ navigate }) {
  const activeTenantId = useStore((s) => s.activeTenantId);
  const profile = useStore((s) => s.profile);
  const activityTypes = useStore((s) => s.activityTypes);
  const activityLogs = useStore((s) => s.activityLogs);
  const createActivityLog = useStore((s) => s.createActivityLog);
  const getTodayStats = useStore((s) => s.getTodayStats);
  const getDailyGoalProgress = useStore((s) => s.getDailyGoalProgress);
  const seedDefaultActivityTypes = useStore((s) => s.seedDefaultActivityTypes);
  const devToolsEnabled = useStore((s) => s.devToolsEnabled);
  const [selectedName, setSelectedName] = useState('water');
  const [value, setValue] = useState('500');
  const showDebugUi = canShowDebugUi(devToolsEnabled);

  const stats = getTodayStats();
  const goalProgress = getDailyGoalProgress();
  const progressFor = (name) => goalProgress.find((item) => item.activity?.name === name)?.percent;
  const wellnessActivities = useMemo(() => {
    return activityTypes
      .filter((item) => item.tenantId === activeTenantId && item.category === 'wellness' && WELLNESS_NAMES.includes(item.name))
      .sort((a, b) => WELLNESS_NAMES.indexOf(a.name) - WELLNESS_NAMES.indexOf(b.name));
  }, [activityTypes, activeTenantId]);
  const selectedActivity = wellnessActivities.find((item) => item.name === selectedName) || wellnessActivities[0];
  const today = new Date().toDateString();
  const todaysWellness = activityLogs.filter((log) => log.tenantId === activeTenantId && log.category === 'wellness' && new Date(log.loggedAt).toDateString() === today);

  const selectActivity = (activity) => {
    setSelectedName(activity.name);
    setValue(String(activity.defaultIncrement));
  };

  const save = () => {
    if (!selectedActivity) return;
    createActivityLog({
      tenantId: activeTenantId,
      userId: profile?.id,
      activityTypeId: selectedActivity.id,
      value: Number(value) || selectedActivity.defaultIncrement,
      source: 'manual',
    });
    setValue(String(selectedActivity.defaultIncrement));
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Wellness Takibi" />
        <Text style={styles.desc}>Su, kahve, uyku, adım, kilo ve günlük notlar egzersizlerden ayrı takip edilir.</Text>

        <View style={styles.statsGrid}>
          <StatCard label="Su" value={stats.waterTotal || 0} meta="ml" progress={progressFor('water')} tone="wellness" onPress={() => navigate('manual-log', { category: 'wellness', activityName: 'water' })} />
          <StatCard label="Kahve" value={stats.coffeeTotal || 0} meta="fincan" progress={progressFor('coffee')} tone="wellness" onPress={() => navigate('manual-log', { category: 'wellness', activityName: 'coffee' })} />
          <StatCard label="Uyku" value={stats.sleepTotal || 0} meta="saat" progress={progressFor('sleep')} tone="wellness" onPress={() => navigate('manual-log', { category: 'wellness', activityName: 'sleep' })} />
          <StatCard label="Adım" value={stats.stepsTotal || 0} meta="adım" progress={progressFor('steps')} tone="wellness" onPress={() => navigate('manual-log', { category: 'wellness', activityName: 'steps' })} />
        </View>

        <SectionHeader title="Hızlı wellness kaydı" />
        <View style={styles.grid}>
          {wellnessActivities.map((activity) => (
            <Pressable key={activity.id} onPress={() => selectActivity(activity)} style={[styles.option, selectedActivity?.id === activity.id && styles.optionActive]}>
              <Text style={styles.optionTitle}>{activity.displayNameTr}</Text>
              <Text style={styles.optionMeta}>+{activity.defaultIncrement} {displayUnit(activity.unit)}</Text>
            </Pressable>
          ))}
        </View>

        <AppCard style={styles.logCard}>
          <Text style={styles.cardTitle}>{selectedActivity?.displayNameTr || 'Wellness'}</Text>
          <AppTextInput value={value} onChangeText={setValue} keyboardType="numeric" placeholder="Değer" />
          <Text style={styles.meta}>Birim: {displayUnit(selectedActivity?.unit) || '-'}</Text>
          <AppButton onPress={save} style={styles.wellnessButton}>{selectedActivity ? `${selectedActivity.displayNameTr} Kaydet` : 'Kaydet'}</AppButton>
        </AppCard>

        <SectionHeader title="Bugün" />
        {todaysWellness.length ? todaysWellness.slice(0, 6).map((log) => {
          const activity = activityTypes.find((item) => item.id === log.activityTypeId);
          return (
            <AppCard key={log.id} style={styles.row}>
              <View>
                <Text style={styles.rowTitle}>{activity?.displayNameTr || 'Wellness'}</Text>
                <Text style={styles.meta}>{displaySource(log.source)} · {new Date(log.loggedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <Text style={styles.rowValue}>+{log.value} {displayUnit(log.unit)}</Text>
            </AppCard>
          );
        }) : <EmptyState title="Bugün wellness kaydı yok" description="Su, kahve, uyku, adım, kilo veya not ekle." />}

        <View style={styles.footer}>
          {showDebugUi ? <AppButton onPress={() => activeTenantId && seedDefaultActivityTypes(activeTenantId)} style={styles.primaryButton}>DEV: Wellness kütüphanesini onar</AppButton> : null}
          <AppButton onPress={() => navigate('activity-library')} style={styles.secondaryButton}>Aktivite kütüphanesi</AppButton>
        </View>
      </ScrollView>
      <BottomNav active="wellness" navigate={navigate} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 170 },
  desc: { color: colors.textSecondary, marginBottom: 14, lineHeight: 19 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  option: { width: '48%', backgroundColor: colors.pinkSoft, borderColor: 'rgba(155, 92, 255, 0.35)', borderWidth: 1, borderRadius: 10, padding: 12 },
  optionActive: { borderColor: colors.pink, borderWidth: 2 },
  optionTitle: { color: colors.pink, fontWeight: '900' },
  optionMeta: { color: colors.textSecondary, marginTop: 5, fontSize: 12 },
  logCard: { borderColor: colors.pink, backgroundColor: colors.pinkSoft, marginBottom: 14 },
  cardTitle: { color: colors.pink, fontWeight: '900', marginBottom: 10, fontSize: 16 },
  meta: { color: colors.textSecondary, marginBottom: 10 },
  wellnessButton: { backgroundColor: colors.pink, shadowColor: colors.pink, marginTop: 4 },
  row: { marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderColor: colors.pink, backgroundColor: colors.pinkSoft },
  rowTitle: { color: colors.pink, fontWeight: '900' },
  rowValue: { color: colors.pink, fontWeight: '900' },
  footer: { paddingBottom: 56 },
  primaryButton: { backgroundColor: colors.pink, shadowColor: colors.pink, marginBottom: 12 },
  secondaryButton: { backgroundColor: colors.surfaceLight },
});
