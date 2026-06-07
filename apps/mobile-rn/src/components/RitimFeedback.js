import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppCard from './AppCard';
import colors from '../theme/colors';

export const goalPercent = (total = 0, target = 0) => {
  const parsedTarget = Number(target) || 0;
  if (parsedTarget <= 0) return 0;
  return Math.max(0, Math.round(((Number(total) || 0) / parsedTarget) * 100));
};

export const motivationMessage = ({ percent = 0, extra = 0, unit = 'tekrar' }) => {
  if (percent >= 300) return `👑 Ritim Ustası! +${extra} ${unit} fazla`;
  if (percent >= 200) return `🚀 Bugün efsanesin! +${extra} ${unit} fazla`;
  if (percent >= 150) return `🔥 Ateştesin! +${extra} ${unit} fazla`;
  if (percent >= 100) return 'Hedef tamamlandı, harika iş.';
  if (percent >= 80) return 'Hedefe çok yaklaştın.';
  if (percent >= 50) return 'Ritmin oluşuyor, devam et.';
  return 'Başlamak için iyi bir an.';
};

export const levelName = (score = 0) => {
  if (score >= 5000) return 'Efsane';
  if (score >= 2500) return 'Canavar';
  if (score >= 1200) return 'İstikrarlı';
  if (score >= 600) return 'Disiplinli';
  if (score >= 200) return 'Kararlı';
  return 'Acemi';
};

export function UnifiedProgressBar({ percent = 0, overachieved = false, style }) {
  const base = Math.min(100, Math.max(0, percent));
  return (
    <View style={[styles.track, overachieved && styles.trackFire, style]}>
      <View style={[styles.fill, { width: `${base}%` }]} />
    </View>
  );
}

export function StatPill({ children, tone = 'default' }) {
  return (
    <View style={[styles.pill, tone === 'fire' && styles.firePill, tone === 'purple' && styles.purplePill]}>
      <Text style={[styles.pillText, tone === 'fire' && styles.fireText, tone === 'purple' && styles.purpleText]} numberOfLines={1}>{children}</Text>
    </View>
  );
}

export function StreakBadge({ streak = 0, level }) {
  return (
    <View style={styles.streakBadge}>
      <Text style={styles.streakText}>🔥 Streak x{streak || 1}</Text>
      {level ? <Text style={styles.levelText}>{level}</Text> : null}
    </View>
  );
}

export function GoalSummaryCard({ percent = 0, completed = 0, total = 0, items = [], streak = 0, score = 0 }) {
  const completedLabel = total ? `${completed}/${total} tamamlandı` : 'Henüz hedef yok';
  return (
    <AppCard style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryTitle}>Bugünkü Ritim</Text>
          <Text style={styles.summaryMeta}>{total ? 'Genel oran hedefleri %100’de sabitler.' : 'Tara, kaydet, ateş yak.'}</Text>
        </View>
        <View style={styles.summaryScore}>
          <Text style={styles.completedLabel}>{completedLabel}</Text>
          <Text style={styles.completedHint}>bugün</Text>
        </View>
        <View style={styles.percentBubble}>
          <Text style={styles.percentBig}>{percent}%</Text>
        </View>
      </View>
      <UnifiedProgressBar percent={percent} overachieved={percent > 100} />
      <View style={styles.summaryList}>
        {items.slice(0, 3).map((item) => (
          <View key={item.id || item.name} style={styles.summaryRow}>
            <Text style={styles.summaryName} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.summaryValue, item.percent > 100 && styles.fireText]}>{item.total} / {item.target}</Text>
          </View>
        ))}
      </View>
      <View style={styles.summaryFooter}>
        <StreakBadge streak={streak} level={levelName(score)} />
        <Text style={styles.loopText}>Tara → Kaydet → Ateş Yak → Seviye Atla</Text>
      </View>
    </AppCard>
  );
}

export function ProgressCard({ title, plan, total, target, unit, lastValue, todayCount, onFire }) {
  const percent = goalPercent(total, target);
  const extra = Math.max(0, (Number(total) || 0) - (Number(target) || 0));
  const over = percent > 100;
  const fireLevel = percent >= 150;
  const legendary = percent >= 200;
  return (
    <AppCard style={[styles.progressCard, over && styles.progressCardOver, fireLevel && styles.progressCardFire, legendary && styles.progressCardLegendary]}>
      <View style={styles.progressHeader}>
        <View style={styles.progressMain}>
          <Text style={styles.progressTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.progressMeta} numberOfLines={1}>Plan: {plan || `${target} ${unit}`}</Text>
        </View>
        <View style={[styles.percentBadge, over && styles.percentBadgeOver, fireLevel && styles.percentBadgeFire]}>
          <Text style={[styles.progressPercent, over && styles.fireText]}>{percent}%</Text>
        </View>
      </View>
      <Text style={styles.progressLine}>{total} / {target} {unit}</Text>
      <UnifiedProgressBar percent={percent} overachieved={over} />
      {over ? <Text style={styles.fireBanner}>{motivationMessage({ percent, extra, unit })}</Text> : onFire ? <Text style={styles.motivation}>{motivationMessage({ percent, extra, unit })}</Text> : null}
    </AppCard>
  );
}

export function NFCResultCard({ title, value, total, target, unit }) {
  const percent = goalPercent(total, target);
  const extra = Math.max(0, (Number(total) || 0) - (Number(target) || 0));
  const over = percent > 100;
  return (
    <AppCard style={[styles.nfcCard, over && styles.nfcFireCard]}>
      <Text style={styles.nfcTitle}>⚡ {title}</Text>
      <Text style={styles.nfcValue}>+{value} {unit} işlendi</Text>
      <Text style={styles.nfcTotal}>{total} / {target}</Text>
      <Text style={[styles.nfcPercent, over && styles.fireText]}>%{percent} tamamlandı</Text>
      <UnifiedProgressBar percent={percent} overachieved={over} />
      <Text style={[styles.nfcMotivation, over && styles.fireText]}>{motivationMessage({ percent, extra, unit })}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  track: { height: 7, borderRadius: 999, overflow: 'hidden', flexDirection: 'row', backgroundColor: colors.border, marginTop: 8 },
  trackFire: { borderWidth: 1, borderColor: 'rgba(255,138,42,0.32)', backgroundColor: 'rgba(255,138,42,0.10)' },
  fill: { height: '100%', backgroundColor: '#40E0D0' },
  pill: { minHeight: 28, borderRadius: 999, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderColor: colors.border, borderWidth: 1 },
  firePill: { borderColor: colors.orange, backgroundColor: 'rgba(255,138,42,0.12)' },
  purplePill: { borderColor: colors.purple, backgroundColor: 'rgba(155,92,255,0.12)' },
  pillText: { color: colors.textSecondary, fontSize: 11, fontWeight: '900' },
  fireText: { color: colors.orange },
  purpleText: { color: colors.purple },
  streakBadge: { minHeight: 34, borderRadius: 999, paddingHorizontal: 11, flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: 'rgba(255,138,42,0.12)', borderColor: colors.orange, borderWidth: 1 },
  streakText: { color: colors.orange, fontWeight: '900', fontSize: 12 },
  levelText: { color: colors.textPrimary, fontWeight: '900', fontSize: 12 },
  summaryCard: { marginBottom: 12, borderColor: '#40E0D0', backgroundColor: 'rgba(13,24,40,0.94)', padding: 14 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 9 },
  summaryCopy: { flex: 1.1, minWidth: 0 },
  summaryTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  summaryMeta: { color: colors.textSecondary, marginTop: 3, fontSize: 11, fontWeight: '700' },
  summaryScore: { minWidth: 84, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 7, backgroundColor: 'rgba(64,224,208,0.08)', borderColor: 'rgba(64,224,208,0.2)', borderWidth: 1 },
  completedLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  completedHint: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', textAlign: 'center', marginTop: 1 },
  percentBubble: { minWidth: 56, minHeight: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#40E0D0', backgroundColor: 'rgba(64,224,208,0.1)', paddingHorizontal: 8 },
  percentBig: { color: '#40E0D0', fontSize: 18, fontWeight: '900' },
  summaryList: { gap: 5, marginTop: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  summaryName: { flex: 1, minWidth: 0, color: colors.textSecondary, fontWeight: '800' },
  summaryValue: { color: colors.textPrimary, fontWeight: '900' },
  summaryFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 10 },
  loopText: { flex: 1, color: colors.textMuted, fontSize: 11, textAlign: 'right', fontWeight: '800' },
  progressCard: { marginBottom: 8, borderRadius: 16, padding: 12, borderWidth: 1, backgroundColor: 'rgba(13,24,40,0.92)' },
  progressCardOver: { borderColor: 'rgba(64,224,208,0.38)', shadowColor: '#40E0D0', shadowOpacity: 0.08, shadowRadius: 8 },
  progressCardFire: { borderColor: 'rgba(255,138,42,0.54)', shadowColor: colors.orange, shadowOpacity: 0.11, shadowRadius: 9 },
  progressCardLegendary: { borderColor: colors.orange, backgroundColor: 'rgba(25,24,40,0.94)' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  progressMain: { flex: 1, minWidth: 0 },
  progressTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  progressMeta: { color: colors.textSecondary, marginTop: 4, fontSize: 11, fontWeight: '700' },
  percentBadge: { minWidth: 52, minHeight: 30, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(64,224,208,0.42)', backgroundColor: 'rgba(64,224,208,0.10)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  percentBadgeOver: { borderColor: 'rgba(64,224,208,0.7)', backgroundColor: 'rgba(64,224,208,0.14)' },
  percentBadgeFire: { borderColor: colors.orange, backgroundColor: 'rgba(255,138,42,0.13)' },
  progressPercent: { color: '#40E0D0', fontSize: 14, fontWeight: '900' },
  progressLine: { color: colors.textPrimary, marginTop: 7, fontWeight: '900', fontSize: 15 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 },
  fireBanner: { color: colors.orange, fontSize: 12, fontWeight: '900', marginTop: 7 },
  motivation: { color: '#40E0D0', fontSize: 12, fontWeight: '900', marginTop: 7 },
  nfcCard: { alignItems: 'center', borderColor: '#40E0D0', backgroundColor: 'rgba(13,24,40,0.96)' },
  nfcFireCard: { borderColor: colors.orange, shadowColor: colors.orange, shadowOpacity: 0.4, shadowRadius: 24 },
  nfcTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  nfcValue: { color: '#40E0D0', fontSize: 30, fontWeight: '900', marginTop: 10, textAlign: 'center' },
  nfcTotal: { color: colors.textPrimary, fontSize: 21, fontWeight: '900', marginTop: 10 },
  nfcPercent: { color: colors.textSecondary, fontWeight: '900', marginTop: 4 },
  nfcMotivation: { color: '#40E0D0', fontWeight: '900', marginTop: 12, textAlign: 'center' },
});
