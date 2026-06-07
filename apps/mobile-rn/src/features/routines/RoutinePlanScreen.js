import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, StyleSheet, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppScreen from '../../components/AppScreen';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import useStore from '../../store/store';
import colors from '../../theme/colors';
import { DAY_OPTIONS, EFFECTIVE_OPTIONS, PROGRESSION_MODES, ProgressBarWithOverflow, unitLabel } from './RoutineComponents';

const CATEGORY_CHIPS = [
  { key: 'exercise', label: 'Egzersiz', icon: '💪' },
  { key: 'book', label: 'Kitap', icon: '📖' },
  { key: 'walk', label: 'Yürüyüş', icon: '🚶' },
  { key: 'weight', label: 'Kilo', icon: '⚖️' },
  { key: 'language', label: 'Dil', icon: '🔠' },
];

const clamp = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const addWeeks = (weeks) => {
  const date = new Date();
  date.setDate(date.getDate() + weeks * 7);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const makeRoadmap = ({ targetType, form, rule }) => {
  const sets = Math.max(1, clamp(form.targetSets, 5));
  const reps = Math.max(1, clamp(form.targetRepsPerSet, 15));
  const total = Math.max(1, clamp(form.targetTotalUnits, 20));
  const inc = rule.mode === 'none' ? 0 : Math.max(0, clamp(rule.increaseAmount, targetType === 'set_based' ? 2 : 5));
  const maxReps = Math.max(reps, clamp(rule.maxTargetRepsPerSet, reps + inc * 4 || 30));
  const maxTotal = Math.max(total, clamp(rule.maxTotalUnits, total + inc * 4 || 50));
  const steps = [0, 1, 2, 3].map((index) => {
    if (targetType === 'set_based') {
      const nextReps = Math.min(maxReps, reps + inc * index);
      return { index: index + 1, label: `${sets}×${nextReps}`, total: sets * nextReps, reps: nextReps, sets };
    }
    const nextTotal = Math.min(maxTotal, total + inc * index);
    return { index: index + 1, label: `${nextTotal}`, total: nextTotal };
  });
  const finalLabel = targetType === 'set_based' ? `${sets}×${maxReps}` : `${maxTotal}`;
  const finalTotal = targetType === 'set_based' ? sets * maxReps : maxTotal;
  return [...steps, { index: '🏆', label: finalLabel, total: finalTotal, final: true, sets, reps: maxReps }];
};

const planTotal = (plan, form) => {
  if (plan?.targetType === 'set_based') return clamp(form.targetSets, plan.targetSets || 5) * clamp(form.targetRepsPerSet, plan.targetRepsPerSet || 15);
  return clamp(form.targetTotalUnits, plan?.targetTotalUnits || 20);
};

export default function RoutinePlanScreen({ route, navigate }) {
  const insets = useSafeAreaInsets();
  const routineId = route?.params?.routineId;
  const routines = useStore((s) => s.routines);
  const getLatestRoutinePlan = useStore((s) => s.getLatestRoutinePlan);
  const routineProgressionRules = useStore((s) => s.routineProgressionRules);
  const routineDailyLogs = useStore((s) => s.routineDailyLogs);
  const tenantNfcCards = useStore((s) => s.tenantNfcCards);
  const cardAssignments = useStore((s) => s.cardAssignments);
  const updateRoutinePlan = useStore((s) => s.updateRoutinePlan);
  const routine = routines.find((item) => item.id === routineId);
  const plan = getLatestRoutinePlan(routineId);
  const existingRule = routineProgressionRules.find((item) => item.routineId === routineId && item.isActive !== false);
  const lastLog = routineDailyLogs.filter((item) => item.routineId === routineId).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const linkedCards = cardAssignments
    .filter((assignment) => assignment.tenantId === routine?.tenantId && assignment.activityTypeId === routine?.activityTypeId && assignment.isActive !== false)
    .map((assignment) => ({ assignment, card: tenantNfcCards.find((card) => card.id === assignment.tenantCardId) }))
    .filter((item) => item.card);
  const [selectedCategory, setSelectedCategory] = useState('exercise');
  const [selectedDays, setSelectedDays] = useState(plan?.selectedDays || []);
  const [effectivePolicy, setEffectivePolicy] = useState('next_week');
  const [form, setForm] = useState({});
  const [rule, setRule] = useState({});

  useEffect(() => {
    if (!plan) return;
    setSelectedCategory(routine?.category === 'wellness' && plan.targetType === 'page_based' ? 'book' : routine?.category || 'exercise');
    setSelectedDays(plan.selectedDays || []);
    setForm({
      targetSets: String(plan.targetSets || ''),
      targetRepsPerSet: String(plan.targetRepsPerSet || ''),
      targetTotalUnits: String(plan.targetTotalUnits || ''),
      blocks: String(plan.blocks || ''),
      unitsPerBlock: String(plan.unitsPerBlock || ''),
      minimumSuccessPercent: String(plan.minimumSuccessPercent || 80),
      unitType: plan.unitType,
    });
    setRule({
      mode: existingRule?.mode || 'weekly',
      increaseAmount: String(existingRule?.increaseAmount || (plan.targetType === 'set_based' ? 2 : 5)),
      increaseUnit: existingRule?.increaseUnit || (plan.targetType === 'set_based' ? 'reps_per_set' : 'pages_per_day'),
      startPolicy: existingRule?.startPolicy || 'next_week',
      maxTargetSets: String(existingRule?.maxTargetSets || ''),
      maxTargetRepsPerSet: String(existingRule?.maxTargetRepsPerSet || (plan.targetType === 'set_based' ? 30 : '')),
      maxTotalUnits: String(existingRule?.maxTotalUnits || (plan.targetType === 'set_based' ? '' : 50)),
    });
  }, [existingRule?.id, plan?.id, routine?.category]);

  const roadmap = useMemo(() => makeRoadmap({ targetType: plan?.targetType, form, rule }), [plan?.targetType, form, rule]);
  const total = planTotal(plan, form);
  const current = lastLog?.completedTotalUnits || Math.round(total * 0.5);
  const percent = total ? Math.round((current / total) * 100) : 0;
  const fireLevel = Math.max(1, Math.min(5, Math.ceil(percent / 20)));
  const planUpgradeActive = percent >= 120;
  const planHintText = planUpgradeActive
    ? 'Bu ritim sana kolay geliyor. Planını yükseltmeyi düşünebilirsin.'
    : percent >= 100
      ? 'Başarılı günlerin arttıkça ateş seviyen yükselir.'
      : 'Önce bugünkü hedefi tamamlamaya odaklan. Plan önerisi hedef güçlenince belirginleşir.';
  const unit = unitLabel(plan?.unitType);
  const targetTitle = plan?.targetType === 'set_based'
    ? `${clamp(form.targetRepsPerSet, plan?.targetRepsPerSet || 15) * Math.max(1, clamp(form.targetSets, plan?.targetSets || 5) >= 5 ? 3 : 1)} Şınav`
    : `${clamp(form.targetTotalUnits, plan?.targetTotalUnits || 20)} ${unit}`;
  const selectedDayLabels = DAY_OPTIONS.filter((day) => selectedDays.includes(day.key)).map((day) => day.label).join(', ');
  const completionDate = addWeeks(8);

  const updateFormNumber = (key, delta, fallback) => {
    setForm((current) => {
      const next = Math.max(1, clamp(current[key], fallback) + delta);
      return { ...current, [key]: String(next) };
    });
  };

  const save = () => {
    const result = updateRoutinePlan({
      routineId,
      updates: {
        selectedDays,
        scheduleType: selectedDays.length >= 7 ? 'daily' : 'weekly',
        targetSets: Number(form.targetSets) || null,
        targetRepsPerSet: Number(form.targetRepsPerSet) || null,
        targetTotalUnits: Number(form.targetTotalUnits) || null,
        blocks: Number(form.blocks) || null,
        unitsPerBlock: Number(form.unitsPerBlock) || null,
        minimumSuccessPercent: Number(form.minimumSuccessPercent) || 80,
      },
      progressionRule: rule,
      effectivePolicy,
    });
    if (result) navigate('routine-plan', { routineId });
  };

  if (!routine || !plan) {
    return (
      <AppScreen>
        <Text style={styles.title}>Plan bulunamadı</Text>
        <AppButton onPress={() => navigate('routines')}>Planlara dön</AppButton>
      </AppScreen>
    );
  }

  return (
    <AppScreen style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => navigate('routines')} style={styles.iconButton}><Text style={styles.iconText}>‹</Text></Pressable>
        <Text style={styles.headerTitle}>Hedef Planı</Text>
        <Pressable onPress={() => navigate('routine-progress', { routineId })} style={styles.iconButton}><Text style={styles.menuText}>⋮</Text></Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {CATEGORY_CHIPS.map((chip) => {
          const active = chip.key === selectedCategory;
          return (
            <Pressable key={chip.key} onPress={() => setSelectedCategory(chip.key)} style={[styles.categoryChip, active && styles.categoryChipActive]}>
              <Text style={styles.categoryIcon}>{chip.icon}</Text>
              <Text style={[styles.categoryLabel, active && styles.activeText]}>{chip.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 116 + Math.max(insets.bottom, 16) }]} showsVerticalScrollIndicator={false}>
        <AppCard style={styles.goalCard}>
          <View style={styles.rowBetween}>
            <View style={styles.goalLeft}>
              <Text style={styles.cardTitle}>🎯 Hedefim</Text>
              <Text style={styles.goalTitle}>{targetTitle}</Text>
              <Text style={styles.meta}>Tek sette {targetTitle.toLowerCase()} hedefine ulaşmak</Text>
              <Text style={styles.bigPercent}>%{percent}</Text>
            </View>
            <View style={styles.fireRing}>
              <Text style={styles.fireEmoji}>🔥</Text>
              <Text style={styles.fireLabel}>Ateş Seviyesi</Text>
              <Text style={styles.fireNumber}>{fireLevel}</Text>
              <Text style={styles.fireExplain}>Düzenli güç</Text>
            </View>
          </View>
          <ProgressBarWithOverflow percent={percent} />
          <Text style={styles.fireDescription}>Ateş seviyesi, hedeflerini ne kadar düzenli ve güçlü tamamladığına göre artar.</Text>
          <Text style={[styles.planHintText, planUpgradeActive && styles.planHintStrong]}>{planHintText}</Text>
          <View style={styles.goalMetaRow}>
            <Text style={styles.meta}>Şu anki tek set: {Math.max(1, Math.round(current / Math.max(1, clamp(form.targetSets, 5))))} {unit}</Text>
            <Text style={styles.meta}>Hedefe: 8 hafta</Text>
          </View>
          <View style={styles.levelCard}>
            <View style={styles.levelBlock}>
              <Text style={styles.miniLabel}>Mevcut Seviye</Text>
              <Text style={styles.levelValue}>{roadmap[0]?.label}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.levelBlock}>
              <Text style={styles.miniLabel}>Sonraki Seviye</Text>
              <Text style={[styles.levelValue, styles.purpleText]}>{roadmap[1]?.label}</Text>
            </View>
            <Pressable onPress={() => navigate('routine-progress', { routineId })} style={styles.nextButton}><Text style={styles.nextText}>›</Text></Pressable>
          </View>
        </AppCard>

        <CompactCard title="NFC Kartları">
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.meta}>Bu ritim {routine.name} aktivitesinden beslenir.</Text>
            <Pressable onPress={() => navigate('mock-scan', { activityTypeId: routine.activityTypeId, routineId })}>
              <Text style={styles.textButton}>Kart bağla</Text>
            </Pressable>
          </View>
          {linkedCards.length ? linkedCards.map(({ card, assignment }) => (
            <Pressable key={card.id} onPress={() => navigate('cards/register', { cardId: card.id })} style={styles.linkedCardRow}>
              <View style={styles.cardDot} />
              <View style={styles.linkedCardCopy}>
                <Text style={styles.linkedCardTitle}>{card.cardName}</Text>
                <Text style={styles.meta}>Her okutma +{assignment.incrementValue} {assignment.unit}</Text>
              </View>
              <Text style={styles.linkArrow}>›</Text>
            </Pressable>
          )) : (
            <Text style={styles.emptyCardText}>Bağlı kart yok. Kart bağladığında NFC kayıtları bu planın gerçekleşen değerlerine otomatik eklenir.</Text>
          )}
        </CompactCard>

        <CompactCard title="📅 Antrenman Günleri">
          <View style={styles.daysCompact}>
            {DAY_OPTIONS.map((day) => {
              const active = selectedDays.includes(day.key);
              return (
                <Pressable
                  key={day.key}
                  onPress={() => setSelectedDays(active ? selectedDays.filter((item) => item !== day.key) : [...selectedDays, day.key])}
                  style={[styles.dayMiniChip, active && styles.dayMiniChipActive]}
                >
                  <Text style={[styles.dayMiniText, active && styles.activeText]}>{day.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.meta}>✧ Önerilen: {selectedDayLabels || 'Pzt, Çar, Cum, Paz'}</Text>
            <Pressable onPress={() => setSelectedDays(['mon', 'wed', 'fri', 'sun'])}><Text style={styles.textButton}>Düzenle</Text></Pressable>
          </View>
        </CompactCard>

        <CompactCard title="💪 Günlük Hedef">
          {plan.targetType === 'set_based' ? (
            <View style={styles.stepperRow}>
              <StepperCard label="Set sayısı" value={form.targetSets || '5'} onMinus={() => updateFormNumber('targetSets', -1, 5)} onPlus={() => updateFormNumber('targetSets', 1, 5)} />
              <StepperCard label="Tekrar / set" value={form.targetRepsPerSet || '15'} onMinus={() => updateFormNumber('targetRepsPerSet', -1, 15)} onPlus={() => updateFormNumber('targetRepsPerSet', 1, 15)} />
            </View>
          ) : (
            <View style={styles.stepperRow}>
              <StepperCard label={`Günlük ${unit}`} value={form.targetTotalUnits || '20'} onMinus={() => updateFormNumber('targetTotalUnits', -1, 20)} onPlus={() => updateFormNumber('targetTotalUnits', 1, 20)} />
              <StepperCard label="Blok" value={form.blocks || '4'} onMinus={() => updateFormNumber('blocks', -1, 4)} onPlus={() => updateFormNumber('blocks', 1, 4)} />
            </View>
          )}
        </CompactCard>

        <CompactCard title="📈 İlerleme Ayarları">
          <View style={styles.segmentLine}>
            {PROGRESSION_MODES.map((option) => {
              const active = option.key === rule.mode;
              return (
                <Pressable key={option.key} onPress={() => setRule((current) => ({ ...current, mode: option.key }))} style={[styles.modeChip, active && styles.modeChipActive]}>
                  <Text style={[styles.modeText, active && styles.activeText]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <InfoRow label="Artış miktarı" value={`+${rule.increaseAmount || 0} ${plan.targetType === 'set_based' ? 'tekrar' : unit}`} />
          <InfoRow label={plan.targetType === 'set_based' ? 'Maksimum tekrar / set' : 'Maksimum günlük hedef'} value={plan.targetType === 'set_based' ? (rule.maxTargetRepsPerSet || '30') : (rule.maxTotalUnits || '50')} />
          <Text style={styles.ruleHint}>%80 ve üzeri: sonraki seviyeye geç · %60-%79: aynı seviyeyi tekrar et · %60 altı: önceki seviyeye dön</Text>
        </CompactCard>

        <CompactCard title="Başlangıç Zamanı">
          {EFFECTIVE_OPTIONS.map((option) => (
            <Pressable key={option.key} onPress={() => setEffectivePolicy(option.key)} style={styles.radioRow}>
              <View style={[styles.radio, effectivePolicy === option.key && styles.radioActive]} />
              <Text style={styles.radioText}>{option.label}</Text>
            </Pressable>
          ))}
        </CompactCard>

        <CompactCard title="Önizleme">
          <View style={styles.previewRoad}>
            {roadmap.map((item, index) => (
              <React.Fragment key={`${item.index}-${item.label}`}>
                <View style={styles.previewStep}>
                  <View style={[styles.previewCircle, index === 0 && styles.previewCircleActive, item.final && styles.previewCircleFinal]}>
                    <Text style={[styles.previewIndex, (index === 0 || item.final) && styles.activeText]}>{item.index}</Text>
                  </View>
                  <Text style={[styles.previewLabel, item.final && styles.purpleText]}>{item.label}</Text>
                </View>
                {index < roadmap.length - 1 ? <Text style={styles.chevron}>›</Text> : null}
              </React.Fragment>
            ))}
          </View>
          <Text style={styles.estimateText}>Tahmini tamamlanma: {completionDate}</Text>
        </CompactCard>
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <AppButton onPress={() => navigate('routines')} style={styles.cancelButton} textStyle={styles.cancelText}>Vazgeç</AppButton>
        <AppButton onPress={save} style={[styles.updateButton, !planUpgradeActive && styles.updateButtonPassive]}>
          {planUpgradeActive ? '🚀 Planı Güncelle' : 'Planı gözden geçir'}
        </AppButton>
      </View>
    </AppScreen>
  );
}

function CompactCard({ title, children }) {
  return (
    <AppCard style={styles.compactCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </AppCard>
  );
}

function StepperCard({ label, value, onMinus, onPlus }) {
  return (
    <View style={styles.stepperCard}>
      <Text style={styles.miniLabel}>{label}</Text>
      <View style={styles.stepperBottom}>
        <Text style={styles.stepperValue}>{value}</Text>
        <View style={styles.stepperButtons}>
          <Pressable onPress={onMinus} style={styles.roundStepper}><Text style={styles.stepperSign}>−</Text></Pressable>
          <Pressable onPress={onPlus} style={[styles.roundStepper, styles.plusStepper]}><Text style={styles.plusSign}>＋</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#03101B' },
  header: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: colors.textPrimary, fontSize: 34, lineHeight: 36, fontWeight: '300' },
  menuText: { color: colors.textPrimary, fontSize: 28, lineHeight: 30, fontWeight: '900' },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  categoryRow: { gap: 10, paddingTop: 8, paddingBottom: 12 },
  categoryChip: { width: 78, height: 70, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(16,27,45,0.78)', alignItems: 'center', justifyContent: 'center', gap: 6 },
  categoryChipActive: { borderColor: colors.purple, backgroundColor: 'rgba(155,92,255,0.18)' },
  categoryIcon: { fontSize: 22 },
  categoryLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '900' },
  content: { paddingBottom: 112 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  compactCard: { padding: 16, borderRadius: 18, marginBottom: 12, backgroundColor: 'rgba(13,24,40,0.88)' },
  goalCard: { padding: 16, borderRadius: 18, marginBottom: 12, backgroundColor: 'rgba(13,24,40,0.9)' },
  goalLeft: { flex: 1, minWidth: 0 },
  cardTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900', marginBottom: 12 },
  goalTitle: { color: colors.textPrimary, fontSize: 30, fontWeight: '900', letterSpacing: 0 },
  meta: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  bigPercent: { color: '#40E0D0', fontSize: 36, fontWeight: '900', marginTop: 18 },
  fireRing: { width: 110, height: 110, borderRadius: 55, borderWidth: 8, borderColor: 'rgba(64,224,208,0.76)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16,27,45,0.72)' },
  fireEmoji: { fontSize: 24 },
  fireLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  fireNumber: { color: colors.textPrimary, fontSize: 26, fontWeight: '900' },
  fireExplain: { color: colors.textMuted, fontSize: 9, marginTop: -2 },
  fireDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 10 },
  planHintText: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 6 },
  planHintStrong: { color: colors.orange, fontWeight: '800' },
  goalMetaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 8 },
  levelCard: { minHeight: 70, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(17,36,58,0.55)', flexDirection: 'row', alignItems: 'center', padding: 12, marginTop: 14 },
  levelBlock: { flex: 1 },
  miniLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  levelValue: { color: '#40E0D0', fontSize: 23, fontWeight: '900', marginTop: 8 },
  purpleText: { color: '#B277FF' },
  divider: { width: 1, height: 42, backgroundColor: colors.border, marginHorizontal: 12 },
  nextButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(155,92,255,0.42)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#8D57FF' },
  nextText: { color: colors.textPrimary, fontSize: 28, lineHeight: 30 },
  daysCompact: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginBottom: 12 },
  dayMiniChip: { minWidth: 42, height: 44, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(17,36,58,0.52)' },
  dayMiniChipActive: { borderColor: '#40E0D0', backgroundColor: 'rgba(64,224,208,0.13)' },
  dayMiniText: { color: colors.textSecondary, fontSize: 12, fontWeight: '900' },
  activeText: { color: colors.textPrimary },
  textButton: { color: '#40E0D0', fontSize: 12, fontWeight: '900' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 },
  linkedCardRow: { minHeight: 62, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(17,36,58,0.62)', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginTop: 8 },
  cardDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: '#40E0D0' },
  linkedCardCopy: { flex: 1, minWidth: 0 },
  linkedCardTitle: { color: colors.textPrimary, fontWeight: '900' },
  linkArrow: { color: colors.textPrimary, fontSize: 24, fontWeight: '900' },
  emptyCardText: { color: colors.textSecondary, lineHeight: 19 },
  stepperRow: { flexDirection: 'row', gap: 10 },
  stepperCard: { flex: 1, minHeight: 88, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(17,36,58,0.62)', padding: 12, justifyContent: 'space-between' },
  stepperBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stepperValue: { color: colors.textPrimary, fontSize: 30, fontWeight: '900' },
  stepperButtons: { flexDirection: 'row', gap: 8 },
  roundStepper: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  plusStepper: { borderWidth: 1, borderColor: '#40E0D0' },
  stepperSign: { color: colors.textSecondary, fontSize: 18, fontWeight: '900' },
  plusSign: { color: '#40E0D0', fontSize: 15, fontWeight: '900' },
  segmentLine: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeChip: { flex: 1, height: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(17,36,58,0.56)' },
  modeChipActive: { borderColor: '#40E0D0', backgroundColor: 'rgba(64,224,208,0.19)' },
  modeText: { color: colors.textSecondary, fontSize: 12, fontWeight: '900' },
  infoRow: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(17,36,58,0.45)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, marginTop: 8 },
  infoLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  infoValue: { color: '#40E0D0', fontSize: 16, fontWeight: '900' },
  ruleHint: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 10 },
  radioRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.textSecondary },
  radioActive: { borderColor: '#40E0D0', backgroundColor: 'rgba(64,224,208,0.35)' },
  radioText: { color: colors.textSecondary, fontSize: 15, fontWeight: '700' },
  previewRoad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  previewStep: { alignItems: 'center', minWidth: 42 },
  previewCircle: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(17,36,58,0.72)', alignItems: 'center', justifyContent: 'center' },
  previewCircleActive: { borderColor: '#40E0D0', backgroundColor: 'rgba(64,224,208,0.2)' },
  previewCircleFinal: { borderColor: '#9B5CFF', backgroundColor: 'rgba(155,92,255,0.24)' },
  previewIndex: { color: colors.textSecondary, fontSize: 15, fontWeight: '900' },
  previewLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '900', marginTop: 8 },
  chevron: { color: colors.textSecondary, fontSize: 26, marginBottom: 20 },
  estimateText: { color: '#40E0D0', fontSize: 13, fontWeight: '900', textAlign: 'center', marginTop: 14 },
  stickyBar: { position: 'absolute', left: 22, right: 22, bottom: 0, flexDirection: 'row', gap: 12, paddingTop: 10, backgroundColor: 'rgba(3,16,27,0.96)' },
  cancelButton: { flex: 0.9, backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border, shadowOpacity: 0 },
  cancelText: { color: colors.textPrimary },
  updateButton: { flex: 1.65, backgroundColor: '#8D45F7', borderWidth: 1, borderColor: '#B277FF' },
  updateButtonPassive: { backgroundColor: colors.surfaceLight, borderColor: colors.border, shadowOpacity: 0.12 },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '900' },
});
