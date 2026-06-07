import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import colors from '../theme/colors';
import { UnifiedProgressBar } from './RitimFeedback';

const LEVELS = ['Acemi', 'Kararlı', 'Disiplinli', 'İstikrarlı', 'Güçlü', 'Canavar', 'Efsane'];

export function estimateXp(log) {
  const value = Number(log?.value) || 0;
  if (log?.unit === 'reps') return Math.max(5, Math.round(value * 1.5));
  if (log?.unit === 'min') return Math.max(5, Math.round(value * 2));
  return Math.max(5, Math.round(value * 8));
}

export function levelFromXp(xp = 0) {
  const levelIndex = Math.min(LEVELS.length - 1, Math.floor((Number(xp) || 0) / 100));
  return {
    level: levelIndex + 1,
    name: LEVELS[levelIndex],
    currentXp: Math.max(0, Math.floor((Number(xp) || 0) % 100)),
    totalXp: Number(xp) || 0,
    nextXp: 100,
  };
}

export function fireState(percent = 0) {
  if (percent >= 250) return { label: '🔥🔥🔥🔥 Efsane', hot: true };
  if (percent >= 200) return { label: '🔥🔥🔥 Canavar Modu', hot: true };
  if (percent >= 150) return { label: '🔥🔥 Ateştesin', hot: true };
  if (percent >= 120) return { label: 'Ritmin yükseliyor', hot: false };
  if (percent >= 100) return { label: 'Hedef tamamlandı', hot: false };
  return { label: '', hot: false };
}

export function statusMessage(percent = 0, extra = 0, unit = 'tekrar') {
  if (percent >= 150) return `🔥 Ateştesin! +${extra} ${unit} fazla`;
  if (percent >= 100) return '🎯 Günlük hedef tamamlandı';
  if (percent >= 80) return 'Hedefe çok yaklaştın';
  if (percent >= 50) return '💪 Hedefin yarısına ulaştın';
  return '⚡ Ritmini başlattın';
}

export function EnergyMeter({ value = 0 }) {
  const cappedValue = Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
  const bars = Array.from({ length: 8 }).map((_, index) => index < Math.ceil((cappedValue / 100) * 8));
  return (
    <View style={styles.energyWrap}>
      <View style={styles.energyHeader}>
        <View>
          <Text style={styles.energyTitle}>Ritim Enerjisi</Text>
          <Text style={styles.energyMeta}>Bugünkü genel ilerleme</Text>
        </View>
        <Text style={styles.energyValue}>%{cappedValue}</Text>
      </View>
      <View style={styles.energyBars}>
        {bars.map((active, index) => (
          <View key={index} style={[styles.energyBar, { height: 7 + index * 2.5 }, active && styles.energyBarActive]} />
        ))}
      </View>
    </View>
  );
}

export function FireBadge({ percent }) {
  const state = fireState(percent);
  if (!state.hot) return null;
  return (
    <View style={styles.fireBadge}>
      <Text style={styles.fireBadgeText}>{state.label}</Text>
    </View>
  );
}

export function ComboBanner({ combo = 1 }) {
  const slide = useRef(new Animated.Value(-48)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (combo < 2) return;
    slide.setValue(-48);
    opacity.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(slide, { toValue: 0, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      ]),
      Animated.delay(620),
      Animated.parallel([
        Animated.timing(slide, { toValue: -48, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]),
    ]).start();
  }, [combo, opacity, slide]);
  if (combo < 2) return null;
  return (
    <Animated.View style={[styles.combo, { opacity, transform: [{ translateY: slide }] }]}>
      <Text style={styles.comboText}>{combo >= 4 ? '⚡⚡' : '⚡'} Combo x{combo}</Text>
    </Animated.View>
  );
}

export function XPAnimation({ xp = 0 }) {
  const lift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    lift.setValue(0);
    Animated.timing(lift, { toValue: 1, duration: 820, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [lift, xp]);
  return (
    <Animated.Text style={[styles.xpFly, {
      opacity: lift.interpolate({ inputRange: [0, 0.75, 1], outputRange: [0, 1, 0] }),
      transform: [{ translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [18, -36] }) }],
    }]}>+{xp} XP</Animated.Text>
  );
}

export function LevelUpModal({ from, to }) {
  const scale = useRef(new Animated.Value(0.78)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!to) return;
    scale.setValue(0.78);
    opacity.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 260, easing: Easing.out(Easing.back(1.8)), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]),
      Animated.delay(720),
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [from, opacity, scale, to]);
  if (!to) return null;
  return (
    <Animated.View style={[styles.levelModal, { opacity, transform: [{ scale }] }]}>
      <Text style={styles.levelTitle}>🎉 SEVİYE ATLADIN</Text>
      <Text style={styles.levelMeta}>{from} → {to}</Text>
    </Animated.View>
  );
}

export function NfcSuccessAnimation({ data }) {
  const dim = useRef(new Animated.Value(0)).current;
  const card = useRef(new Animated.Value(0)).current;
  const reward = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(data?.oldPercent || 0)).current;

  useEffect(() => {
    if (!data) return;
    dim.setValue(0);
    card.setValue(0);
    reward.setValue(0);
    progress.setValue(data.oldPercent || 0);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(dim, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(card, { toValue: 1, duration: 220, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      ]),
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(card, { toValue: 1.08, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reward, { toValue: 1, duration: 760, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(progress, { toValue: data.newPercent || 0, duration: 620, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      ]),
    ]).start();
  }, [card, data, dim, progress, reward]);

  if (!data) return null;
  const fire = fireState(data.newPercent);
  const progressWidth = progress.interpolate({ inputRange: [0, 250], outputRange: ['0%', '250%'], extrapolate: 'clamp' });
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Animated.View style={[styles.dim, { opacity: dim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.72] }) }]} />
      <ComboBanner combo={data.combo} />
      <Animated.View style={[styles.successCard, fire.hot && styles.successCardFire, {
        opacity: card,
        transform: [{ scale: card }],
      }]}>
        <Text style={styles.detected}>⚡ NFC ALGILANDI</Text>
        <View style={styles.nfcTile}>
          <Text style={styles.nfcIcon}>)))</Text>
        </View>
        <Animated.View style={[styles.reward, {
          opacity: reward.interpolate({ inputRange: [0, 0.75, 1], outputRange: [0, 1, 0] }),
          transform: [{ translateY: reward.interpolate({ inputRange: [0, 1], outputRange: [20, -50] }) }],
        }]}>
          <Text style={styles.rewardValue}>+{data.value}</Text>
          <Text style={styles.rewardLabel}>{String(data.activityName || '').toUpperCase()}</Text>
        </Animated.View>
        <Text style={styles.progressText}>{data.oldTotal} / {data.target} → {data.newTotal} / {data.target}</Text>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, fire.hot && styles.progressFillFire, { width: progressWidth }]} />
        </View>
        <Text style={[styles.status, fire.hot && styles.fireText]}>{statusMessage(data.newPercent, data.extra, data.unit)}</Text>
        <FireBadge percent={data.newPercent} />
        <View style={styles.xpBar}>
          <Text style={styles.xpLabel}>Seviye {data.level.level} · {data.level.name}</Text>
          <Text style={styles.xpLabel}>{data.level.currentXp} / 100 XP</Text>
        </View>
        <UnifiedProgressBar percent={data.level.currentXp} />
        <XPAnimation xp={data.xp} />
      </Animated.View>
      <LevelUpModal from={data.previousLevel?.name} to={data.didLevelUp ? data.level.name : null} />
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: '#020A13' },
  combo: { position: 'absolute', top: 18, alignSelf: 'center', zIndex: 8, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: 'rgba(64,224,208,0.18)', borderWidth: 1, borderColor: '#40E0D0' },
  comboText: { color: '#40E0D0', fontWeight: '900' },
  successCard: { position: 'absolute', left: 24, right: 24, top: 112, minHeight: 390, borderRadius: 26, borderWidth: 1, borderColor: '#40E0D0', backgroundColor: 'rgba(13,24,40,0.96)', alignItems: 'center', padding: 20, shadowColor: '#40E0D0', shadowOpacity: 0.36, shadowRadius: 22 },
  successCardFire: { borderColor: colors.orange, shadowColor: colors.orange },
  detected: { color: '#40E0D0', fontSize: 14, fontWeight: '900', letterSpacing: 0, marginBottom: 12 },
  nfcTile: { width: 88, height: 88, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1 },
  nfcIcon: { color: colors.textPrimary, fontSize: 28, fontWeight: '900' },
  reward: { alignItems: 'center', height: 78, marginTop: 10 },
  rewardValue: { color: '#40E0D0', fontSize: 54, fontWeight: '900', lineHeight: 58 },
  rewardLabel: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  progressText: { color: colors.textPrimary, fontWeight: '900', marginTop: 8 },
  progressTrack: { width: '100%', height: 13, borderRadius: 999, overflow: 'hidden', backgroundColor: colors.border, marginTop: 12 },
  progressFill: { height: '100%', backgroundColor: '#40E0D0', shadowColor: '#40E0D0', shadowOpacity: 0.8, shadowRadius: 12 },
  progressFillFire: { backgroundColor: colors.orange, shadowColor: colors.orange },
  status: { color: '#40E0D0', fontWeight: '900', marginTop: 13, textAlign: 'center' },
  fireText: { color: colors.orange },
  fireBadge: { marginTop: 10, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: 'rgba(255,138,42,0.14)', borderColor: colors.orange, borderWidth: 1 },
  fireBadgeText: { color: colors.orange, fontWeight: '900' },
  xpBar: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 15 },
  xpLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '900' },
  xpFly: { position: 'absolute', bottom: 54, color: colors.purple, fontSize: 20, fontWeight: '900' },
  levelModal: { position: 'absolute', left: 36, right: 36, top: 220, zIndex: 12, borderRadius: 22, padding: 18, alignItems: 'center', backgroundColor: 'rgba(155,92,255,0.95)', shadowColor: colors.purple, shadowOpacity: 0.5, shadowRadius: 20 },
  levelTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  levelMeta: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 6 },
  energyWrap: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(13,24,40,0.82)', padding: 11, marginBottom: 12 },
  energyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8 },
  energyTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  energyMeta: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 2 },
  energyValue: { color: '#40E0D0', fontSize: 15, fontWeight: '900' },
  energyBars: { height: 27, flexDirection: 'row', alignItems: 'flex-end', gap: 5 },
  energyBar: { flex: 1, borderRadius: 999, backgroundColor: colors.border },
  energyBarActive: { backgroundColor: '#40E0D0', shadowColor: '#40E0D0', shadowOpacity: 0.28, shadowRadius: 5 },
});
