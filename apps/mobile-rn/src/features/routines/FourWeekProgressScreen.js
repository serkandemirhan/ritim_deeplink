import React, { useMemo, useState } from 'react';
import { ScrollView, Text, StyleSheet, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppScreen from '../../components/AppScreen';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import useStore from '../../store/store';
import colors from '../../theme/colors';

const TABS = ['Yol Haritası', 'İlerleme', 'Geçmiş'];

const numberValue = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const completionDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 8 * 7);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const makeTimeline = (plan, rule) => {
  const sets = Math.max(1, numberValue(plan?.targetSets, 5));
  const baseReps = Math.max(1, numberValue(plan?.targetRepsPerSet, 15));
  const inc = rule?.mode === 'none' ? 0 : Math.max(0, numberValue(rule?.increaseAmount, 2));
  const maxReps = Math.max(baseReps, numberValue(rule?.maxTargetRepsPerSet, 30));
  const weekIndexes = [0, 1, 2, 3, 4, 5, 6, 8];
  return weekIndexes.map((week, index) => {
    const reps = week === 0 ? baseReps : Math.min(maxReps, baseReps + inc * week);
    return {
      key: `${week}-${reps}`,
      week,
      title: week === 0 ? 'Başlangıç' : `${week}. Hafta`,
      label: `${sets} × ${reps}`,
      total: sets * reps,
      current: index === 1,
      final: week === 8 || reps >= maxReps,
    };
  });
};

export default function FourWeekProgressScreen({ route, navigate }) {
  const insets = useSafeAreaInsets();
  const routineId = route?.params?.routineId;
  const routines = useStore((s) => s.routines);
  const getLatestRoutinePlan = useStore((s) => s.getLatestRoutinePlan);
  const routineProgressionRules = useStore((s) => s.routineProgressionRules);
  const getFourWeekRoutineProgress = useStore((s) => s.getFourWeekRoutineProgress);
  const updateRoutinePlan = useStore((s) => s.updateRoutinePlan);
  const routine = routines.find((item) => item.id === routineId);
  const plan = getLatestRoutinePlan(routineId);
  const rule = routineProgressionRules.find((item) => item.routineId === routineId && item.isActive !== false);
  const weeks = getFourWeekRoutineProgress(routineId);
  const [activeTab, setActiveTab] = useState('Yol Haritası');
  const timeline = useMemo(() => makeTimeline(plan, rule), [plan?.id, rule?.id]);
  const totals = weeks.reduce((acc, week) => ({
    completed: acc.completed + week.completed,
    extra: acc.extra + week.extra,
    logs: acc.logs + week.logs.length,
  }), { completed: 0, extra: 0, logs: 0 });
  const chartValues = weeks.map((week) => week.completed || 0);
  const maxChart = Math.max(1, ...chartValues, ...weeks.map((week) => week.planned || 0));
  const weeklyAverage = weeks.length ? Math.round(weeks.reduce((sum, week) => sum + week.completed, 0) / weeks.length) : 0;
  const bestWeek = Math.max(...chartValues, 0);
  const overTargetRate = weeks.length ? Math.round((weeks.filter((week) => week.successPercent > 100).length / weeks.length) * 100) : 0;
  const planUpgradeActive = weeks.some((week) => week.successPercent >= 120);
  const today = timeline[0] || { label: '5×15', total: 75 };
  const inFourWeeks = timeline[4] || timeline[timeline.length - 2] || today;
  const inEightWeeks = timeline[timeline.length - 1] || today;
  const estimatedSingleSet = Math.max(1, Math.round(inEightWeeks.total / Math.max(1, numberValue(plan?.targetSets, 5))) + 22);

  const save = () => {
    navigate('routine-plan', { routineId });
  };

  return (
    <AppScreen style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => navigate('routine-plan', { routineId })} style={styles.iconButton}><Text style={styles.backText}>‹</Text></Pressable>
        <Text style={styles.headerTitle}>Yol Haritası</Text>
        <Pressable onPress={() => navigate('routines')} style={styles.iconButton}><Text style={styles.shareText}>⌂</Text></Pressable>
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const active = tab === activeTab;
          return (
            <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabText, active && styles.activeText]}>{tab}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.rangeSummary}>Son 4 haftanın gerçek kayıtları gösteriliyor.</Text>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 150 + Math.max(insets.bottom, 16) }]} showsVerticalScrollIndicator={false}>
        {activeTab === 'Yol Haritası' ? (
          <>
            <AppCard style={styles.timelineCard}>
              <View style={styles.timelineLine} />
              {timeline.map((item) => (
                <View key={item.key} style={styles.timelineRow}>
                  <View style={[styles.timelineDot, item.current && styles.timelineDotCurrent, item.final && styles.timelineDotFinal]}>
                    {item.final ? <Text style={styles.trophy}>🏆</Text> : null}
                  </View>
                  <Text style={[styles.timelineTitle, item.current && styles.turquoiseText, item.final && styles.purpleText]}>{item.title}</Text>
                  <View style={[styles.timelineValueCard, item.final && styles.finalValueCard]}>
                    <Text style={[styles.timelineValue, item.final && styles.purpleText]}>{item.label}</Text>
                    <Text style={styles.meta}>{item.total} tekrar</Text>
                  </View>
                  {item.current ? <View style={styles.nowBadge}><Text style={styles.nowText}>Şu An</Text></View> : null}
                </View>
              ))}
              <View style={styles.completionBox}>
                <View>
                  <Text style={styles.meta}>Tahmini tamamlanma</Text>
                  <Text style={styles.completionDate}>{completionDate()}</Text>
                </View>
                <View style={styles.calendarBox}><Text style={styles.calendarText}>📅</Text></View>
              </View>
            </AppCard>

            <SimulationCard today={today} inFourWeeks={inFourWeeks} inEightWeeks={inEightWeeks} estimatedSingleSet={estimatedSingleSet} />
            <ProgressStats average={weeklyAverage} best={bestWeek} streak={totals.logs} overTargetRate={overTargetRate} nextTarget={inFourWeeks.label} />
            <PerformanceCard chartValues={chartValues} maxChart={maxChart} totals={totals} />
            <TipCard active={planUpgradeActive} />
          </>
        ) : activeTab === 'İlerleme' ? (
          <>
            <SimulationCard today={today} inFourWeeks={inFourWeeks} inEightWeeks={inEightWeeks} estimatedSingleSet={estimatedSingleSet} />
            <ProgressStats average={weeklyAverage} best={bestWeek} streak={totals.logs} overTargetRate={overTargetRate} nextTarget={inFourWeeks.label} />
            <PerformanceCard chartValues={chartValues} maxChart={maxChart} totals={totals} />
          </>
        ) : (
          <AppCard style={styles.timelineCard}>
            <Text style={styles.cardTitle}>Geçmiş</Text>
            {weeks.map((week) => (
              <Pressable key={week.index} onPress={() => navigate('routine-week', { routineId, weekIndex: String(week.index) })} style={styles.historyRow}>
                <View>
                  <Text style={styles.historyTitle}>{week.index}. Hafta</Text>
                  <Text style={styles.meta}>Hedef: {week.planned} · Gerçekleşen: {week.completed}</Text>
                </View>
                <Text style={styles.historyPercent}>%{week.successPercent}</Text>
              </Pressable>
            ))}
          </AppCard>
        )}
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

function SimulationCard({ today, inFourWeeks, inEightWeeks, estimatedSingleSet }) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.cardTitle}>📊 İlerleme Simülasyonu</Text>
      <View style={styles.simGrid}>
        <SimCell label="Bugün" title={today.label} value={today.total} />
        <SimCell label="4 hafta sonra" title={inFourWeeks.label} value={inFourWeeks.total} />
        <SimCell label="8 hafta sonra" title={inEightWeeks.label} value={inEightWeeks.total} />
        <View style={styles.simCell}>
          <Text style={styles.simLabel}>Tahmini tek set</Text>
          <Text style={styles.simBig}>{estimatedSingleSet}</Text>
          <Text style={styles.meta}>şınav</Text>
        </View>
      </View>
    </AppCard>
  );
}

function ProgressStats({ average, best, streak, overTargetRate, nextTarget }) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.cardTitle}>⚡ İlerleme Özeti</Text>
      <View style={styles.progressStatsGrid}>
        <MiniStat label="Haftalık ortalama" value={average} meta="tekrar" />
        <MiniStat label="En iyi gün" value={best} meta="tekrar" />
        <MiniStat label="Streak" value={`x${streak}`} meta="aktif gün" />
        <MiniStat label="Hedef aşma" value={`%${overTargetRate}`} meta="oran" />
      </View>
      <Text style={styles.nextTargetText}>Önerilen sonraki hedef: {nextTarget}</Text>
    </AppCard>
  );
}

function MiniStat({ label, value, meta }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatLabel}>{label}</Text>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.meta}>{meta}</Text>
    </View>
  );
}

function SimCell({ label, title, value }) {
  return (
    <View style={styles.simCell}>
      <Text style={styles.simLabel}>{label}</Text>
      <Text style={styles.simTitle}>{title}</Text>
      <Text style={styles.simBig}>{value}</Text>
      <Text style={styles.meta}>tekrar</Text>
    </View>
  );
}

function PerformanceCard({ chartValues, maxChart, totals }) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.cardTitle}>📈 Son 4 Hafta Performansım</Text>
      <View style={styles.chartWrap}>
        {chartValues.slice(0, 4).map((value, index) => (
          <View key={`${index}-${value}`} style={styles.barRow}>
            <Text style={styles.barLabel}>Hafta {index + 1}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.max(8, Math.min(100, (value / maxChart) * 100))}%` }]} />
            </View>
            <Text style={styles.barValue}>{value}</Text>
          </View>
        ))}
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statLabel}>En Uzun Seri</Text>
          <Text style={styles.statValue}>{totals.logs} gün</Text>
          <Text style={styles.meta}>Devam ediyorsun!</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>⚡</Text>
          <Text style={styles.statLabel}>Toplam Şınav</Text>
          <Text style={styles.statValue}>{(totals.completed || 4850).toLocaleString('tr-TR')}</Text>
          <Text style={styles.meta}>Tüm zamanlar</Text>
        </View>
      </View>
    </AppCard>
  );
}

function TipCard({ active }) {
  return (
    <AppCard style={styles.tipCard}>
      <Text style={styles.tipTitle}>💡 Ritim İpucu</Text>
      <Text style={styles.tipText}>Ateş seviyesi, hedeflerini ne kadar düzenli ve güçlü tamamladığına göre artar.</Text>
      <Text style={[styles.tipText, active && styles.tipStrong]}>
        {active ? 'Bu ritim sana kolay geliyor. Planını yükseltmeyi düşünebilirsin.' : 'Başarılı günlerin arttıkça ateş seviyen yükselir.'}
      </Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#03101B' },
  header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.textPrimary, fontSize: 34, lineHeight: 36, fontWeight: '300' },
  shareText: { color: colors.textPrimary, fontSize: 24, fontWeight: '900' },
  headerTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: '900' },
  tabs: { height: 54, flexDirection: 'row', gap: 4, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(16,27,45,0.86)', padding: 5, marginTop: 8, marginBottom: 14 },
  tab: { flex: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: 'rgba(64,224,208,0.38)', borderWidth: 1, borderColor: '#40E0D0' },
  tabText: { color: colors.textSecondary, fontSize: 13, fontWeight: '900' },
  rangeSummary: { color: colors.textSecondary, fontWeight: '800', marginBottom: 14, textAlign: 'center' },
  activeText: { color: colors.textPrimary },
  content: { paddingBottom: 112 },
  timelineCard: { padding: 18, borderRadius: 18, marginBottom: 14, backgroundColor: 'rgba(13,24,40,0.9)' },
  timelineLine: { position: 'absolute', left: 32, top: 42, bottom: 110, width: 2, backgroundColor: 'rgba(168,181,199,0.55)' },
  timelineRow: { minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: 12 },
  timelineDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: colors.textSecondary, backgroundColor: '#0D1828', zIndex: 1 },
  timelineDotCurrent: { width: 24, height: 24, borderRadius: 12, borderColor: '#40E0D0', backgroundColor: 'rgba(64,224,208,0.35)' },
  timelineDotFinal: { width: 26, height: 26, borderRadius: 13, borderColor: colors.purple, backgroundColor: 'rgba(155,92,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  trophy: { fontSize: 12 },
  timelineTitle: { width: 84, color: colors.textSecondary, fontSize: 15, fontWeight: '900' },
  turquoiseText: { color: '#40E0D0' },
  purpleText: { color: '#B277FF' },
  timelineValueCard: { width: 120, minHeight: 66, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(17,36,58,0.58)', paddingHorizontal: 14, justifyContent: 'center' },
  finalValueCard: { borderColor: colors.purple, backgroundColor: 'rgba(155,92,255,0.12)' },
  timelineValue: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
  meta: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  nowBadge: { marginLeft: 'auto', borderRadius: 999, borderWidth: 1, borderColor: '#40E0D0', paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(64,224,208,0.1)' },
  nowText: { color: '#40E0D0', fontSize: 12, fontWeight: '900' },
  completionBox: { minHeight: 82, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(17,36,58,0.52)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, marginTop: 8 },
  completionDate: { color: colors.textPrimary, fontSize: 22, fontWeight: '900', marginTop: 6 },
  calendarBox: { width: 56, height: 56, borderRadius: 16, borderWidth: 1, borderColor: colors.purple, backgroundColor: 'rgba(155,92,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  calendarText: { fontSize: 25 },
  card: { padding: 16, borderRadius: 18, marginBottom: 14, backgroundColor: 'rgba(13,24,40,0.9)' },
  cardTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900', marginBottom: 14 },
  simGrid: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: 'hidden' },
  simCell: { flex: 1, minHeight: 92, padding: 10, justifyContent: 'center', borderRightWidth: 1, borderRightColor: colors.border },
  simLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800' },
  simTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '900', marginTop: 8 },
  simBig: { color: colors.textPrimary, fontSize: 26, fontWeight: '900', marginTop: 2 },
  progressStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniStat: { flexBasis: '48%', flexGrow: 1, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(17,36,58,0.55)', padding: 12 },
  miniStatLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '900' },
  miniStatValue: { color: '#40E0D0', fontSize: 22, fontWeight: '900', marginTop: 7 },
  nextTargetText: { color: colors.purple, fontSize: 13, fontWeight: '900', marginTop: 12 },
  chartWrap: { gap: 10 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 58, color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  barTrack: { flex: 1, height: 18, borderRadius: 999, backgroundColor: 'rgba(17,36,58,0.72)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999, backgroundColor: '#40E0D0' },
  barValue: { width: 32, color: colors.textPrimary, textAlign: 'right', fontSize: 13, fontWeight: '900' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  statBox: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(17,36,58,0.52)', padding: 14 },
  statIcon: { fontSize: 20 },
  statLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '900', marginTop: 4 },
  statValue: { color: colors.textPrimary, fontSize: 24, fontWeight: '900', marginTop: 8 },
  tipCard: { padding: 16, borderRadius: 18, marginBottom: 14, backgroundColor: 'rgba(13,24,40,0.9)' },
  tipTitle: { color: '#FFD166', fontSize: 16, fontWeight: '900', marginBottom: 8 },
  tipText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  historyRow: { minHeight: 64, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  historyPercent: { color: '#40E0D0', fontSize: 18, fontWeight: '900' },
  stickyBar: { position: 'absolute', left: 22, right: 22, bottom: 0, flexDirection: 'row', gap: 12, paddingTop: 10, backgroundColor: 'rgba(3,16,27,0.96)' },
  cancelButton: { flex: 0.9, backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border, shadowOpacity: 0 },
  cancelText: { color: colors.textPrimary },
  updateButton: { flex: 1.65, backgroundColor: '#8D45F7', borderWidth: 1, borderColor: '#B277FF' },
  updateButtonPassive: { backgroundColor: colors.surfaceLight, borderColor: colors.border, shadowOpacity: 0.12 },
  tipStrong: { color: colors.orange, fontWeight: '800', marginTop: 6 },
});
