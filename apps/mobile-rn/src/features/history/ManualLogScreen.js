import React, { useEffect, useMemo, useState } from 'react';
import { Text, StyleSheet, Pressable, ScrollView, View } from 'react-native';
import AppScreen from '../../components/AppScreen';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import AppCard from '../../components/AppCard';
import BottomNav from '../../components/BottomNav';
import useStore from '../../store/store';
import colors from '../../theme/colors';
import { evaluateScanFeedback, runFeedbackEffects } from '../../services/scanFeedback';
import { displayDifficulty, displayTrackingMode, displayUnit, displayWorkoutCategory } from '../../lib/uiText';

export default function ManualLogScreen({ route, navigate }) {
  const categoryParam = route?.params?.category;
  const activityNameParam = route?.params?.activityName;
  const initialCategory = Array.isArray(categoryParam) ? categoryParam[0] : categoryParam;
  const initialActivityName = Array.isArray(activityNameParam) ? activityNameParam[0] : activityNameParam;
  const activeTenantId = useStore((s) => s.activeTenantId);
  const profile = useStore((s) => s.profile);
  const activityTypes = useStore((s) => s.activityTypes);
  const cardAssignments = useStore((s) => s.cardAssignments);
  const trackedActivityTypeIds = useStore((s) => s.trackedActivityTypeIds);
  const createActivityLog = useStore((s) => s.createActivityLog);
  const updateCardAssignment = useStore((s) => s.updateCardAssignment);
  const setActivityDailyGoal = useStore((s) => s.setActivityDailyGoal);
  const getDailyGoalProgress = useStore((s) => s.getDailyGoalProgress);
  const feedbackSettings = useStore((s) => s.feedbackSettings || { soundEnabled: true, hapticEnabled: true });
  const isSingleActivityMode = Boolean(initialActivityName);
  const [category, setCategory] = useState(initialCategory === 'wellness' ? 'wellness' : 'fitness');
  const [scope, setScope] = useState(initialActivityName ? 'library' : 'tracked');
  const tenantActivities = useMemo(() => {
    const byCategory = activityTypes.filter((item) => item.tenantId === activeTenantId && item.category === category);
    const tracked = byCategory.filter((item) => trackedActivityTypeIds.includes(item.id));
    return scope === 'tracked' && tracked.length ? tracked : byCategory;
  }, [activityTypes, activeTenantId, category, scope, trackedActivityTypeIds]);
  const initialActivity = tenantActivities.find((item) => item.name === initialActivityName) || tenantActivities[0];
  const [selectedActivityId, setSelectedActivityId] = useState(initialActivity?.id || null);
  const selectedActivity = tenantActivities.find((item) => item.id === selectedActivityId) || tenantActivities[0];
  const [value, setValue] = useState(selectedActivity ? String(selectedActivity.defaultIncrement) : '1');
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const goalProgress = getDailyGoalProgress().find((item) => item.activity?.id === selectedActivity?.id);
  const goalAssignment = useMemo(() => {
    if (!selectedActivity) return null;
    return cardAssignments.find((assignment) => assignment.tenantId === activeTenantId && assignment.activityTypeId === selectedActivity.id) || null;
  }, [activeTenantId, cardAssignments, selectedActivity?.id]);
  const [dailyGoal, setDailyGoal] = useState(goalAssignment?.dailyGoal ? String(goalAssignment.dailyGoal) : '');
  const displayedGoal = dailyGoal || (goalProgress?.target ? String(goalProgress.target) : '');
  const remaining = displayedGoal ? Math.max(0, Number(displayedGoal) - (goalProgress?.total || 0)) : null;

  const cancel = () => navigate('home');

  useEffect(() => {
    if (!selectedActivity) return;
    setValue(String(selectedActivity.defaultIncrement));
  }, [selectedActivity?.id]);

  useEffect(() => {
    const fallbackGoal = goalProgress?.target || (selectedActivity ? selectedActivity.defaultIncrement * (selectedActivity.unit === 'ml' ? 5 : 3) : '');
    setDailyGoal(goalAssignment?.dailyGoal ? String(goalAssignment.dailyGoal) : String(fallbackGoal || ''));
  }, [goalAssignment?.id, goalAssignment?.dailyGoal, goalProgress?.target, selectedActivity?.id]);

  const save = () => {
    if (!selectedActivity) return;
    if (showGoalEditor && dailyGoal) {
      if (goalAssignment) {
        updateCardAssignment(goalAssignment.id, { dailyGoal: Number(dailyGoal) || goalAssignment.dailyGoal });
      } else {
        setActivityDailyGoal(activeTenantId, selectedActivity.id, Number(dailyGoal));
      }
    }
    const log = createActivityLog({
      tenantId: activeTenantId,
      userId: profile?.id,
      activityTypeId: selectedActivity.id,
      value: Number(value) || selectedActivity.defaultIncrement,
      source: 'manual',
    });
    const addedValue = Number(log?.value || value || selectedActivity.defaultIncrement) || 0;
    const targetValue = Number(goalProgress?.target || displayedGoal) || 0;
    const previousTotal = Number(goalProgress?.total) || 0;
    const previousPercent = targetValue ? Math.round((previousTotal / targetValue) * 100) : 0;
    const newPercent = targetValue ? Math.round(((previousTotal + addedValue) / targetValue) * 100) : 0;
    const feedback = evaluateScanFeedback({
      previousProgressPercent: previousPercent,
      newProgressPercent: newPercent,
      addedAmount: addedValue,
      activityName: selectedActivity.displayNameTr,
      extraAmount: targetValue ? Math.max(0, previousTotal + addedValue - targetValue) : 0,
      hasCompletedGoalTodayBefore: previousPercent >= 100,
      ...feedbackSettings,
    });
    runFeedbackEffects(feedback, feedbackSettings);
    navigate('home', {
      celebration: `${selectedActivity.displayNameTr} kaydedildi`,
      activityTypeId: selectedActivity.id,
      value: String(log?.value || value || selectedActivity.defaultIncrement),
      unit: selectedActivity.unit || '',
    });
  };

  const selectCategory = (nextCategory) => {
    setCategory(nextCategory);
    const first = activityTypes.find((item) => item.tenantId === activeTenantId && item.category === nextCategory);
    setSelectedActivityId(first?.id || null);
    setValue(first ? String(first.defaultIncrement) : '1');
    setShowGoalEditor(false);
  };

  const adjustDailyGoal = (delta) => {
    const current = Number(dailyGoal) || goalAssignment?.dailyGoal || selectedActivity?.defaultIncrement || 1;
    setDailyGoal(String(Math.max(0, current + delta)));
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable onPress={cancel} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Manuel Giriş</Text>
          <Text style={styles.subtitle}>{category === 'fitness' ? 'Fitness kayıtları' : 'Wellness, içecek ve takviyeler'}</Text>
        </View>
        <Pressable onPress={cancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Vazgeç</Text>
        </Pressable>
      </View>
      {selectedActivity && !isSingleActivityMode ? (
        <AppCard style={[styles.goalCard, selectedActivity?.category === 'wellness' && styles.wellnessItem]}>
          <Text style={[styles.goalTitle, selectedActivity?.category === 'wellness' && styles.wellnessText]}>{selectedActivity.displayNameTr} hedefi</Text>
          <Text style={styles.goalMeta}>{goalProgress?.total || 0}/{displayedGoal || '-'} {displayUnit(selectedActivity.unit)} · Kalan {remaining ?? '-'} {displayUnit(selectedActivity.unit)}</Text>
          <Text style={[styles.goalPercent, selectedActivity?.category === 'wellness' && styles.wellnessText]}>{goalProgress?.percent || 0}%</Text>
          <Pressable onPress={() => setShowGoalEditor((current) => !current)} style={styles.goalLink}>
            <Text style={styles.goalLinkText}>{showGoalEditor ? 'Hedef düzenlemeyi gizle' : 'Hedefi düzenle'}</Text>
          </Pressable>
          {showGoalEditor ? (
            <GoalEditor
              dailyGoal={dailyGoal}
              setDailyGoal={setDailyGoal}
              selectedActivity={selectedActivity}
              adjustDailyGoal={adjustDailyGoal}
            />
          ) : null}
        </AppCard>
      ) : null}
      {isSingleActivityMode ? (
        <>
          <AppCard style={[styles.singleCard, selectedActivity?.category === 'wellness' && styles.wellnessItem]}>
            <Text style={[styles.singleTitle, selectedActivity?.category === 'wellness' && styles.wellnessText]}>{selectedActivity?.displayNameTr || 'Aktivite'}</Text>
            <Text style={styles.singleMeta}>Bugün: {goalProgress?.total || 0}/{displayedGoal || '-'} {displayUnit(selectedActivity?.unit)}</Text>
            <Text style={styles.inputLabel}>Kaç eklemek istiyorsun?</Text>
            <AppTextInput value={value} onChangeText={setValue} keyboardType="numeric" placeholder="Kayıt miktarı" />
            <Pressable onPress={() => setShowGoalEditor((current) => !current)} style={styles.goalLink}>
              <Text style={styles.goalLinkText}>{showGoalEditor ? 'Hedef düzenlemeyi gizle' : 'Hedefi düzenle'}</Text>
            </Pressable>
            {showGoalEditor ? (
              <GoalEditor
                dailyGoal={dailyGoal}
                setDailyGoal={setDailyGoal}
                selectedActivity={selectedActivity}
                adjustDailyGoal={adjustDailyGoal}
              />
            ) : null}
          </AppCard>
          <View style={styles.footer}>
            <AppButton onPress={save} style={[styles.primaryButton, selectedActivity?.category === 'wellness' && styles.wellnessButton]}>
              Kaydet
            </AppButton>
            <AppButton onPress={cancel} style={styles.secondaryButton}>Vazgeç ve geri dön</AppButton>
          </View>
        </>
      ) : (
        <>
      <View style={styles.segments}>
        <Pressable onPress={() => selectCategory('fitness')} style={[styles.segment, category === 'fitness' && styles.segmentActive]}>
          <Text style={[styles.segmentText, category === 'fitness' && styles.segmentTextActive]}>Fitness</Text>
        </Pressable>
        <Pressable onPress={() => selectCategory('wellness')} style={[styles.segment, styles.wellnessSegment, category === 'wellness' && styles.wellnessSegmentActive]}>
          <Text style={[styles.segmentText, styles.wellnessText, category === 'wellness' && styles.segmentTextActive]}>Wellness</Text>
        </Pressable>
      </View>
      <View style={styles.scopeRow}>
        <Pressable onPress={() => setScope('tracked')} style={[styles.scopeButton, scope === 'tracked' && styles.scopeActive]}>
          <Text style={[styles.scopeText, scope === 'tracked' && styles.scopeTextActive]}>{category === 'fitness' ? 'Benim Egzersizlerim' : 'Takip Ettiklerim'}</Text>
        </Pressable>
        <Pressable onPress={() => setScope('library')} style={[styles.scopeButton, scope === 'library' && styles.scopeActive]}>
          <Text style={[styles.scopeText, scope === 'library' && styles.scopeTextActive]}>Tüm kütüphane</Text>
        </Pressable>
      </View>
      <View style={styles.list}>
        {tenantActivities.map((item) => (
          <Pressable key={item.id} onPress={() => { setSelectedActivityId(item.id); setValue(String(item.defaultIncrement)); setShowGoalEditor(false); }} style={[styles.item, item.category === 'wellness' && styles.wellnessItem, selectedActivity?.id === item.id && styles.itemActive, selectedActivity?.id === item.id && item.category === 'wellness' && styles.wellnessItemActive]}>
            <Text style={[styles.itemTitle, item.category === 'wellness' && styles.wellnessText]} numberOfLines={1}>{item.displayNameTr}</Text>
            <Text style={styles.itemMeta} numberOfLines={1}>+{item.defaultIncrement} {displayUnit(item.unit)} · {displayWorkoutCategory(item.category)}</Text>
            <Text style={styles.itemMeta} numberOfLines={1}>{displayWorkoutCategory(item.workoutCategory) || item.displayNameTr} · {displayDifficulty(item.difficulty) || displayTrackingMode(item.trackingMode)}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.footer}>
        <Text style={styles.inputLabel}>Kaç eklemek istiyorsun?</Text>
        <AppTextInput value={value} onChangeText={setValue} keyboardType="numeric" placeholder="Kayıt miktarı" />
        <Text style={styles.unit}>Birim: {displayUnit(selectedActivity?.unit) || '-'}</Text>
        {!!selectedActivity?.caloriesPerUnit && <Text style={styles.unit}>Tahmini kalori profil bilgilerine göre hesaplanır.</Text>}
        <AppButton onPress={save} style={[styles.primaryButton, category === 'wellness' && styles.wellnessButton]}>
          {category === 'fitness' ? 'Fitness' : 'Wellness'} kaydını ekle
        </AppButton>
        <AppButton onPress={cancel} style={styles.secondaryButton}>Vazgeç ve geri dön</AppButton>
        <AppButton onPress={() => navigate('activity-library')} style={styles.secondaryButton}>Aktivite kütüphanesi</AppButton>
      </View>
        </>
      )}
      </ScrollView>
      <BottomNav active={category} navigate={navigate} hideScan />
    </AppScreen>
  );
}

function GoalEditor({ dailyGoal, setDailyGoal, selectedActivity, adjustDailyGoal }) {
  return (
    <View style={styles.goalEditor}>
      <Text style={styles.goalEditorLabel}>Günlük hedef (ikincil)</Text>
      <View style={styles.amountRow}>
        <Pressable onPress={() => adjustDailyGoal(-(selectedActivity?.defaultIncrement || 1))} style={styles.stepButton}>
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <AppTextInput value={dailyGoal} onChangeText={setDailyGoal} keyboardType="numeric" placeholder="Günlük hedef" style={styles.amountInput} />
        <Pressable onPress={() => adjustDailyGoal(selectedActivity?.defaultIncrement || 1)} style={styles.stepButton}>
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 160 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  backButton: { width: 38, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  backText: { color: colors.textPrimary, fontSize: 30, lineHeight: 32, fontWeight: '300' },
  headerText: { flex: 1, minWidth: 0 },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
  subtitle: { color: colors.textSecondary, marginTop: 3 },
  cancelButton: { minHeight: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  cancelText: { color: colors.textSecondary, fontWeight: '900', fontSize: 12 },
  segments: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  segment: { flex: 1, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
  segmentActive: { borderColor: colors.primary, backgroundColor: colors.surfaceLight },
  wellnessSegment: { backgroundColor: colors.pinkSoft, borderColor: 'rgba(155, 92, 255, 0.45)' },
  wellnessSegmentActive: { borderColor: colors.pink },
  segmentText: { color: colors.textSecondary, fontWeight: '900' },
  segmentTextActive: { color: colors.textPrimary },
  scopeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  scopeButton: { flex: 1, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  scopeActive: { borderColor: colors.primary, backgroundColor: colors.surfaceLight },
  scopeText: { color: colors.textSecondary, fontWeight: '900', fontSize: 12 },
  scopeTextActive: { color: colors.textPrimary },
  list: { paddingBottom: 12 },
  item: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  wellnessItem: { backgroundColor: colors.pinkSoft, borderColor: 'rgba(155, 92, 255, 0.35)' },
  itemActive: { borderColor: colors.primary, borderWidth: 2 },
  wellnessItemActive: { borderColor: colors.pink },
  itemTitle: { color: colors.textPrimary, fontWeight: '800' },
  wellnessText: { color: colors.pink },
  itemMeta: { color: colors.textSecondary, marginTop: 4 },
  goalCard: { marginBottom: 12 },
  goalTitle: { color: colors.primary, fontWeight: '900' },
  goalMeta: { color: colors.textSecondary, marginTop: 5 },
  goalPercent: { color: colors.primary, fontWeight: '900', marginTop: 8 },
  goalLink: { alignSelf: 'flex-start', marginTop: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: colors.surfaceLight },
  goalLinkText: { color: colors.textSecondary, fontWeight: '800', fontSize: 12 },
  inputLabel: { color: colors.textPrimary, fontWeight: '800', marginBottom: 8 },
  singleCard: { marginBottom: 14 },
  singleTitle: { color: colors.primary, fontSize: 22, fontWeight: '900' },
  singleMeta: { color: colors.textSecondary, marginTop: 6, marginBottom: 12, fontWeight: '800' },
  goalEditor: { marginTop: 10 },
  goalEditorLabel: { color: colors.textSecondary, fontWeight: '800', marginBottom: 8 },
  amountRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  amountInput: { flex: 1, minWidth: 0, marginBottom: 0, height: 56, textAlign: 'center' },
  stepButton: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1 },
  stepText: { color: colors.textPrimary, fontSize: 24, fontWeight: '900', lineHeight: 28 },
  unit: { color: colors.textSecondary, marginBottom: 12 },
  footer: { paddingBottom: 44 },
  primaryButton: { height: 64, marginBottom: 12, borderRadius: 22 },
  wellnessButton: { backgroundColor: colors.pink, shadowColor: colors.pink },
  secondaryButton: { height: 58, backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1, marginBottom: 12 },
});
