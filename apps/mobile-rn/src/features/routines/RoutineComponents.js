import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import AppCard from '../../components/AppCard';
import AppTextInput from '../../components/AppTextInput';
import colors from '../../theme/colors';
import { ProgressCard } from '../../components/RitimFeedback';

export const DAY_OPTIONS = [
  { key: 'mon', label: 'Pzt' },
  { key: 'tue', label: 'Sal' },
  { key: 'wed', label: 'Çar' },
  { key: 'thu', label: 'Per' },
  { key: 'fri', label: 'Cum' },
  { key: 'sat', label: 'Cmt' },
  { key: 'sun', label: 'Paz' },
];

export const TARGET_TYPES = [
  { key: 'completion', label: 'Tamamlandı' },
  { key: 'set_based', label: 'Set Bazlı' },
  { key: 'duration_based', label: 'Süre Bazlı' },
  { key: 'count_based', label: 'Adet / Tekrar' },
  { key: 'page_based', label: 'Sayfa Bazlı' },
];

export const PROGRESSION_MODES = [
  { key: 'none', label: 'Sabit' },
  { key: 'weekly', label: 'Haftalık' },
  { key: 'monthly', label: 'Aylık' },
  { key: 'custom', label: 'Özel' },
];

export const EFFECTIVE_OPTIONS = [
  { key: 'today', label: 'Bugünden itibaren' },
  { key: 'next_week', label: 'Gelecek haftadan itibaren' },
  { key: 'next_month', label: 'Gelecek aydan itibaren' },
];

export function categoryLabel(category) {
  return category === 'wellness' ? 'Wellness' : 'Egzersiz';
}

export function unitLabel(unitType) {
  if (unitType === 'page') return 'sayfa';
  if (unitType === 'minute') return 'dakika';
  if (unitType === 'repetition') return 'tekrar';
  return 'adet';
}

export function planLabel(plan) {
  if (!plan) return 'Plan yok';
  const unit = unitLabel(plan.unitType);
  if (plan.targetType === 'set_based') return `${plan.targetSets || 0} set × ${plan.targetRepsPerSet || 0} tekrar`;
  if (plan.targetType === 'completion') return 'Tamamlandı / tamamlanmadı';
  return `${plan.targetTotalUnits || 0} ${unit}`;
}

export function ProgressBarWithOverflow({ percent = 0 }) {
  const base = Math.min(percent, 100);
  return (
    <View style={styles.progressWrap}>
      <View style={[styles.progressBase, { width: `${base}%` }]} />
    </View>
  );
}

export function OverachievementBanner({ log, unitType }) {
  if (!log?.isOverachieved) return null;
  return (
    <AppCard style={styles.fireCard}>
      <Text style={styles.fireTitle}>🔥 Ateştesin!</Text>
      <Text style={styles.fireText}>Hedefi %{log.successPercent} tamamladın.</Text>
      <Text style={styles.fireMeta}>+{log.extraUnits} {unitLabel(unitType)} fazla yaptın.</Text>
    </AppCard>
  );
}

export function WeeklyDaySelector({ selectedDays, onChange }) {
  const allSelected = selectedDays.length === DAY_OPTIONS.length;
  const toggleDay = (key) => {
    if (selectedDays.includes(key)) onChange(selectedDays.filter((day) => day !== key));
    else onChange([...selectedDays, key]);
  };
  return (
    <View>
      <Pressable onPress={() => onChange(DAY_OPTIONS.map((day) => day.key))} style={[styles.everyDay, allSelected && styles.chipActive]}>
        <Text style={[styles.chipText, allSelected && styles.chipTextActive]}>Her gün</Text>
      </Pressable>
      <View style={styles.dayRow}>
        {DAY_OPTIONS.map((day) => {
          const active = selectedDays.includes(day.key);
          return (
            <Pressable key={day.key} onPress={() => toggleDay(day.key)} style={[styles.dayChip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{day.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SegmentedOptions({ options, value, onChange }) {
  return (
    <View style={styles.segmentWrap}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable key={option.key} onPress={() => onChange(option.key)} style={[styles.segment, active && styles.segmentActive]}>
            <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function RoutinePlanEditor({ targetType, form, setForm }) {
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <View>
      {targetType === 'set_based' ? (
        <>
          <LabeledInput label="Set sayısı" value={form.targetSets} onChangeText={(value) => update('targetSets', value)} />
          <LabeledInput label="Tekrar / set" value={form.targetRepsPerSet} onChangeText={(value) => update('targetRepsPerSet', value)} />
        </>
      ) : null}
      {targetType === 'page_based' ? (
        <>
          <LabeledInput label="Günlük sayfa hedefi" value={form.targetTotalUnits} onChangeText={(value) => update('targetTotalUnits', value)} />
          <LabeledInput label="Blok sayısı" value={form.blocks} onChangeText={(value) => update('blocks', value)} />
          <LabeledInput label="Blok başına sayfa" value={form.unitsPerBlock} onChangeText={(value) => update('unitsPerBlock', value)} />
        </>
      ) : null}
      {targetType === 'duration_based' ? (
        <>
          <LabeledInput label="Günlük süre hedefi" value={form.targetTotalUnits} onChangeText={(value) => update('targetTotalUnits', value)} />
          <LabeledInput label="Blok sayısı" value={form.blocks} onChangeText={(value) => update('blocks', value)} />
        </>
      ) : null}
      {targetType === 'count_based' || targetType === 'completion' ? (
        <LabeledInput label={targetType === 'completion' ? 'Tamamlama değeri' : 'Günlük adet hedefi'} value={form.targetTotalUnits} onChangeText={(value) => update('targetTotalUnits', value)} />
      ) : null}
      <LabeledInput label="Minimum başarı (%)" value={form.minimumSuccessPercent} onChangeText={(value) => update('minimumSuccessPercent', value)} />
    </View>
  );
}

export function ProgressionRuleEditor({ targetType, rule, setRule }) {
  const update = (key, value) => setRule((current) => ({ ...current, [key]: value }));
  return (
    <View>
      <SegmentedOptions options={PROGRESSION_MODES} value={rule.mode} onChange={(mode) => update('mode', mode)} />
      {rule.mode !== 'none' ? (
        <>
          <LabeledInput label="Artış miktarı" value={rule.increaseAmount} onChangeText={(value) => update('increaseAmount', value)} />
          <SegmentedOptions
            options={EFFECTIVE_OPTIONS}
            value={rule.startPolicy}
            onChange={(value) => update('startPolicy', value)}
          />
          {targetType === 'set_based' ? (
            <LabeledInput label="Maksimum tekrar / set" value={rule.maxTargetRepsPerSet} onChangeText={(value) => update('maxTargetRepsPerSet', value)} />
          ) : (
            <LabeledInput label="Maksimum günlük hedef" value={rule.maxTotalUnits} onChangeText={(value) => update('maxTotalUnits', value)} />
          )}
        </>
      ) : null}
    </View>
  );
}

export function RoadmapPreview({ targetType, form, rule }) {
  const baseSets = Number(form.targetSets) || 5;
  const baseReps = Number(form.targetRepsPerSet) || 15;
  const baseTotal = Number(form.targetTotalUnits) || 20;
  const inc = Number(rule.increaseAmount) || 0;
  const items = Array.from({ length: 4 }).map((_, index) => {
    if (rule.mode === 'none') return targetType === 'set_based' ? `${baseSets} × ${baseReps}` : `${baseTotal}`;
    if (targetType === 'set_based') return `${baseSets} × ${baseReps + inc * index}`;
    return `${baseTotal + inc * index}`;
  });
  return (
    <AppCard style={styles.roadmap}>
      <Text style={styles.cardTitle}>Yol haritası önizleme</Text>
      {items.map((item, index) => (
        <Text key={`${item}-${index}`} style={styles.meta}>{index + 1}. {rule.mode === 'monthly' ? 'Ay' : 'Hafta'}: {item}{targetType === 'set_based' ? '' : ` ${unitLabel(form.unitType)}`}</Text>
      ))}
    </AppCard>
  );
}

export function RoutineCard({ routine, plan, log, onPlanPress, onProgressPress, trendLabel, suggestion, onAcceptSuggestion }) {
  const [expanded, setExpanded] = useState(false);
  const target = log?.plannedTotalUnits || targetTotal(plan);
  const completed = log?.completedTotalUnits || 0;
  return (
    <Pressable onPress={() => setExpanded((value) => !value)}>
      <ProgressCard
        title={routine.name}
        plan={`${categoryLabel(routine.category)} · ${planLabel(plan)}`}
        total={completed}
        target={target}
        unit={unitLabel(plan?.unitType)}
        lastValue={log?.completedTotalUnits || 0}
        todayCount={log ? 1 : 0}
        onFire
      />
      {trendLabel ? <Text style={styles.compactTrend}>📈 {trendLabel}</Text> : null}
      {suggestion ? (
        <AppCard style={styles.suggestionCard}>
          <Text style={styles.suggestionTitle}>Seviye atlamaya hazırsın</Text>
          <Text style={styles.suggestionText}>{suggestion.message}</Text>
          <Pressable onPress={onAcceptSuggestion} style={styles.suggestionButton}>
            <Text style={styles.suggestionButtonText}>Gelecek haftadan uygula</Text>
          </Pressable>
        </AppCard>
      ) : null}
      {expanded ? <AppCard style={styles.routineActionsCard}>
        <View style={styles.actionRow}>
          <Pressable onPress={onPlanPress} style={styles.smallButton}><Text style={styles.smallButtonText}>Planı Düzenle</Text></Pressable>
          <Pressable onPress={onProgressPress} style={styles.smallButton}><Text style={styles.smallButtonText}>Gelişim</Text></Pressable>
        </View>
      </AppCard> : null}
    </Pressable>
  );
}

function targetTotal(plan) {
  if (!plan) return 0;
  if (plan.targetType === 'set_based') return (plan.targetSets || 0) * (plan.targetRepsPerSet || 0);
  return plan.targetTotalUnits || 0;
}

export function SetEntryList({ entries, setEntries, plan }) {
  const plannedCount = plan?.targetType === 'set_based' ? Number(plan.targetSets) || 0 : Number(plan?.blocks) || 0;
  const entryLabel = plan?.targetType === 'set_based' ? 'set' : 'blok';
  const plannedValue = plan?.targetType === 'set_based'
    ? Number(plan.targetRepsPerSet) || 0
    : Number(plan?.unitsPerBlock) || Math.ceil((Number(plan?.targetTotalUnits) || 0) / Math.max(1, plannedCount || 1));
  const updateEntry = (index, value) => {
    setEntries(entries.map((entry, itemIndex) => itemIndex === index ? { ...entry, value } : entry));
  };
  const addEntry = () => setEntries([...entries, { value: '', entryType: plan?.targetType === 'set_based' ? 'set' : 'block' }]);
  return (
    <View>
      <Text style={styles.cardTitle}>Planlanan {entryLabel}ler</Text>
      {Array.from({ length: plannedCount }).map((_, index) => (
        <View key={`planned-${index}`} style={styles.plannedRow}>
          <Text style={styles.entryLabel}>{index + 1}. {entryLabel}</Text>
          <Text style={styles.plannedValue}>{plannedValue} {unitLabel(plan?.unitType)}</Text>
        </View>
      ))}

      <Text style={[styles.cardTitle, styles.actualTitle]}>Gerçekleşen {entryLabel}ler</Text>
      {entries.map((entry, index) => {
        const isExtra = index >= plannedCount;
        return (
          <View key={index} style={styles.entryRow}>
            <Text style={[styles.entryLabel, isExtra && styles.fireText]}>{index + 1}. {entryLabel}{isExtra ? ' · ekstra' : ''}</Text>
            <AppTextInput value={String(entry.value)} placeholder="0" onChangeText={(value) => updateEntry(index, value)} keyboardType="numeric" style={styles.entryInput} />
          </View>
        );
      })}
      <Pressable onPress={addEntry} style={styles.addButton}>
        <Text style={styles.addButtonText}>+ {entryLabel === 'set' ? 'Set' : 'Blok'} Ekle</Text>
      </Pressable>
    </View>
  );
}

function LabeledInput({ label, value, onChangeText }) {
  return (
    <View style={styles.inputBlock}>
      <Text style={styles.label}>{label}</Text>
      <AppTextInput value={String(value ?? '')} onChangeText={onChangeText} keyboardType="numeric" />
    </View>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  flex: { flex: 1, minWidth: 0 },
  routineCard: { marginBottom: 12 },
  routineActionsCard: { marginTop: -4, marginBottom: 10, padding: 10, backgroundColor: 'rgba(17,36,58,0.62)' },
  compactTrend: { color: colors.textSecondary, fontSize: 11, fontWeight: '800', marginTop: -6, marginBottom: 8, marginLeft: 4 },
  suggestionCard: { marginTop: -4, marginBottom: 10, borderColor: 'rgba(64,224,208,0.36)', backgroundColor: 'rgba(64,224,208,0.08)', padding: 12 },
  suggestionTitle: { color: colors.textPrimary, fontWeight: '900', marginBottom: 4 },
  suggestionText: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  suggestionButton: { marginTop: 10, minHeight: 36, borderRadius: 999, borderWidth: 1, borderColor: '#40E0D0', alignItems: 'center', justifyContent: 'center' },
  suggestionButtonText: { color: '#40E0D0', fontWeight: '900', fontSize: 12 },
  routineTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '900' },
  cardTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900', marginBottom: 10 },
  meta: { color: colors.textSecondary, lineHeight: 20, marginTop: 5 },
  percent: { color: '#40E0D0', fontSize: 24, fontWeight: '900' },
  progressWrap: { height: 12, flexDirection: 'row', borderRadius: 999, overflow: 'hidden', backgroundColor: colors.border, marginTop: 14, marginBottom: 8 },
  progressBase: { height: '100%', backgroundColor: '#40E0D0' },
  fireCard: { borderColor: '#FF8A2A', backgroundColor: 'rgba(255,138,42,0.10)', marginBottom: 14 },
  fireTitle: { color: '#FF8A2A', fontSize: 22, fontWeight: '900' },
  fireText: { color: '#FF8A2A', fontWeight: '900' },
  fireMeta: { color: '#FFB15F', fontWeight: '900', marginTop: 6 },
  everyDay: { minHeight: 44, borderRadius: 999, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 10, backgroundColor: colors.surface },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: { minWidth: 44, minHeight: 44, borderRadius: 999, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, backgroundColor: colors.surface },
  chipActive: { borderColor: '#40E0D0', backgroundColor: 'rgba(64,224,208,0.12)' },
  chipText: { color: colors.textSecondary, fontWeight: '900' },
  chipTextActive: { color: colors.textPrimary },
  segmentWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  segment: { minHeight: 44, borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  segmentActive: { borderColor: '#40E0D0', backgroundColor: 'rgba(64,224,208,0.12)' },
  segmentText: { color: colors.textSecondary, fontWeight: '900' },
  segmentTextActive: { color: colors.textPrimary },
  inputBlock: { marginBottom: 4 },
  label: { color: colors.textPrimary, fontWeight: '900', marginBottom: 8 },
  roadmap: { marginTop: 12, marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  smallButton: { flex: 1, minHeight: 42, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceLight },
  smallButtonText: { color: colors.textPrimary, fontWeight: '900', fontSize: 12 },
  plannedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, borderRadius: 14, backgroundColor: 'rgba(64,224,208,0.07)', borderColor: 'rgba(64,224,208,0.22)', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  plannedValue: { color: '#40E0D0', fontWeight: '900' },
  actualTitle: { marginTop: 16 },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  entryLabel: { flex: 1, color: colors.textPrimary, fontWeight: '800' },
  entryInput: { width: 104, marginBottom: 0, textAlign: 'center' },
  addButton: { minHeight: 52, borderRadius: 16, borderWidth: 1, borderColor: '#40E0D0', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  addButtonText: { color: '#40E0D0', fontWeight: '900' },
});
