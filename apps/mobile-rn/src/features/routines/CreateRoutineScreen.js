import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, StyleSheet, View } from 'react-native';
import AppScreen from '../../components/AppScreen';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import ActivityIcon from '../../components/ActivityIcon';
import useStore from '../../store/store';
import colors from '../../theme/colors';
import {
  TARGET_TYPES,
  WeeklyDaySelector,
  SegmentedOptions,
  RoutinePlanEditor,
  ProgressionRuleEditor,
  RoadmapPreview,
} from './RoutineComponents';

const learningActivityNames = new Set(['book_reading', 'english', 'french', 'turkish_diction', 'education_video']);

export default function CreateRoutineScreen({ navigate }) {
  const activeTenantId = useStore((s) => s.activeTenantId);
  const activityTypes = useStore((s) => s.activityTypes);
  const routines = useStore((s) => s.routines);
  const seedDefaultActivityTypes = useStore((s) => s.seedDefaultActivityTypes);
  const createRoutineWithPlan = useStore((s) => s.createRoutineWithPlan);
  const [libraryMode, setLibraryMode] = useState('fitness');
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [targetType, setTargetType] = useState('set_based');
  const [selectedDays, setSelectedDays] = useState(['mon', 'wed', 'fri']);
  const [form, setForm] = useState({
    targetSets: '5',
    targetRepsPerSet: '15',
    targetTotalUnits: '20',
    blocks: '4',
    unitsPerBlock: '5',
    minimumSuccessPercent: '80',
    unitType: 'repetition',
  });
  const [rule, setRule] = useState({
    mode: 'weekly',
    increaseAmount: '2',
    increaseUnit: 'reps_per_set',
    startPolicy: 'next_week',
    maxTargetRepsPerSet: '30',
    maxTotalUnits: '50',
  });

  useEffect(() => {
    if (activeTenantId) seedDefaultActivityTypes(activeTenantId);
  }, [activeTenantId, seedDefaultActivityTypes]);

  const libraryItems = useMemo(() => (
    activityTypes.filter((activity) => (
      activity.tenantId === activeTenantId &&
      (
        libraryMode === 'learning'
          ? learningActivityNames.has(activity.name)
          : libraryMode === 'wellness'
            ? activity.category === 'wellness' && !learningActivityNames.has(activity.name)
            : activity.category === libraryMode
      ) &&
      !routines.some((routine) => routine.tenantId === activeTenantId && routine.activityTypeId === activity.id && routine.isActive !== false)
    ))
  ), [activeTenantId, activityTypes, libraryMode, routines]);
  const selectedActivity = libraryItems.find((activity) => activity.id === selectedActivityId) || null;

  useEffect(() => {
    if (selectedActivityId && libraryItems.some((activity) => activity.id === selectedActivityId)) return;
    setSelectedActivityId(libraryItems[0]?.id || null);
  }, [libraryItems, selectedActivityId]);

  useEffect(() => {
    if (!selectedActivity) return;
    if (selectedActivity.unit === 'reps') {
      setTargetType('set_based');
      setForm((current) => ({ ...current, unitType: 'repetition' }));
    } else if (selectedActivity.unit === 'page') {
      setTargetType('page_based');
      setForm((current) => ({ ...current, unitType: 'page', targetTotalUnits: String(selectedActivity.defaultIncrement || 20) }));
    } else if (selectedActivity.unit === 'min' || selectedActivity.unit === 'hour') {
      setTargetType('duration_based');
      setForm((current) => ({ ...current, unitType: 'minute', targetTotalUnits: String(selectedActivity.defaultIncrement || 10) }));
    } else {
      setTargetType('count_based');
      setForm((current) => ({ ...current, unitType: 'count', targetTotalUnits: String(selectedActivity.defaultIncrement || 1) }));
    }
  }, [selectedActivity?.id]);

  const normalizedForm = useMemo(() => ({
    ...form,
    unitType: targetType === 'page_based' ? 'page' : targetType === 'duration_based' ? 'minute' : targetType === 'set_based' ? 'repetition' : 'count',
  }), [form, targetType]);

  const save = () => {
    if (!selectedActivity) return;
    const result = createRoutineWithPlan({
      tenantId: activeTenantId,
      activityTypeId: selectedActivity.id,
      name: selectedActivity.displayNameTr,
      category: selectedActivity.category === 'wellness' ? 'wellness' : 'exercise',
      targetType,
      selectedDays,
      plan: normalizedForm,
      progressionRule: {
        ...rule,
        increaseUnit: targetType === 'set_based' ? 'reps_per_set' : targetType === 'page_based' ? 'pages_per_day' : targetType === 'duration_based' ? 'minutes_per_day' : 'count_per_day',
      },
    });
    navigate(result.alreadyExists ? 'routine-plan' : 'routine-daily', { routineId: result.routine.id });
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Ritim Oluştur</Text>
        <Text style={styles.subtitle}>Hedefini sadece sayı olarak değil, günlere ve gelişim planına bağla.</Text>

        <AppCard style={styles.card}>
          <Text style={styles.sectionTitle}>Aktivite kütüphanesi</Text>
          <SegmentedOptions
            options={[{ key: 'fitness', label: 'Fitness' }, { key: 'wellness', label: 'Wellness' }, { key: 'learning', label: 'Learning' }]}
            value={libraryMode}
            onChange={(nextMode) => {
              setLibraryMode(nextMode);
              setSelectedActivityId(null);
            }}
          />
          <View style={styles.libraryGrid}>
            {libraryItems.map((activity) => {
              const isSelected = activity.id === selectedActivityId;
              return (
                <Pressable
                  key={activity.id}
                  onPress={() => setSelectedActivityId(activity.id)}
                  style={[styles.activityOption, isSelected && styles.activityOptionActive]}
                >
                  <ActivityIcon activity={activity} size={36} compact />
                  <View style={styles.activityCopy}>
                    <Text style={[styles.activityName, isSelected && styles.activityNameActive]} numberOfLines={1}>{activity.displayNameTr}</Text>
                    <Text style={styles.activityMeta} numberOfLines={1}>+{activity.defaultIncrement} {activity.unit}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          {!libraryItems.length ? (
            <Text style={styles.emptyText}>Bu kategoride planlanabilir tüm aktiviteler zaten aktif. Mevcut planı Planlar ekranından düzenleyebilirsin.</Text>
          ) : null}
          <Text style={styles.helperText}>Plan ve NFC kartları aynı kütüphane aktivitesine bağlanır; bu yüzden Şınav / Push-up ayrı görünmez.</Text>
        </AppCard>

        <AppCard style={styles.card}>
          <Text style={styles.sectionTitle}>Hedef tipi</Text>
          <SegmentedOptions options={TARGET_TYPES} value={targetType} onChange={setTargetType} />
        </AppCard>

        <AppCard style={styles.card}>
          <Text style={styles.sectionTitle}>Haftalık gün seçimi</Text>
          <WeeklyDaySelector selectedDays={selectedDays} onChange={setSelectedDays} />
        </AppCard>

        <AppCard style={styles.card}>
          <Text style={styles.sectionTitle}>Günlük hedef tanımı</Text>
          <RoutinePlanEditor targetType={targetType} form={normalizedForm} setForm={setForm} />
        </AppCard>

        <AppCard style={styles.card}>
          <Text style={styles.sectionTitle}>İlerleme Planı</Text>
          <ProgressionRuleEditor targetType={targetType} rule={rule} setRule={setRule} />
        </AppCard>

        <RoadmapPreview targetType={targetType} form={normalizedForm} rule={rule} />
        <AppButton onPress={save} disabled={!selectedActivity}>Ritmi Kaydet</AppButton>
        <AppButton onPress={() => navigate('routines')} style={styles.secondaryButton}>Vazgeç</AppButton>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 156 },
  title: { color: colors.textPrimary, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colors.textSecondary, marginTop: 6, marginBottom: 16, lineHeight: 20 },
  card: { marginBottom: 14 },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', marginBottom: 12 },
  libraryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  activityOption: { width: '48%', minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 10 },
  activityOptionActive: { borderColor: '#40E0D0', backgroundColor: 'rgba(64,224,208,0.10)' },
  activityCopy: { flex: 1, minWidth: 0 },
  activityName: { color: colors.textPrimary, fontWeight: '900' },
  activityNameActive: { color: '#40E0D0' },
  activityMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  helperText: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 12 },
  emptyText: { color: '#FFB15F', fontWeight: '800', lineHeight: 18, marginTop: 12 },
  secondaryButton: { marginTop: 12, backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1 },
});
