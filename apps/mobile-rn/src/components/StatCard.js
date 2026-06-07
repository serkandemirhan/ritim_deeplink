import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import AppCard from './AppCard';
import colors from '../theme/colors';

export default function StatCard({ label, value, meta, progress, onPress, style, tone = 'default' }) {
  const toneColor = tone === 'wellness' ? colors.pink : tone === 'fitness' ? colors.primary : colors.textPrimary;
  const content = (
    <AppCard style={[styles.card, onPress && styles.pressableCard, tone === 'wellness' && styles.wellnessCard, style]}>
      <Text style={[styles.label, tone === 'wellness' && styles.wellnessLabel]}>{label}</Text>
      <Text style={[styles.value, { color: toneColor }]}>{value}</Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      {typeof progress === 'number' ? (
        <>
          <Text style={[styles.progressText, { color: toneColor }]}>{Math.max(0, Math.min(100, Math.round(progress)))}%</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { backgroundColor: toneColor, width: `${Math.max(0, Math.min(100, progress))}%` }]} />
          </View>
        </>
      ) : null}
    </AppCard>
  );

  if (!onPress) return content;
  return <Pressable onPress={onPress} style={styles.pressable}>{content}</Pressable>;
}

const styles = StyleSheet.create({
  pressable: { width: '48%' },
  card: {
    width: '48%',
  },
  pressableCard: {
    width: '100%',
  },
  wellnessCard: {
    borderColor: colors.pink,
    backgroundColor: colors.pinkSoft,
  },
  label: { color: colors.textSecondary },
  wellnessLabel: { color: colors.pink },
  value: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' },
  meta: { color: colors.textSecondary, marginTop: 4, fontSize: 12 },
  progressText: { marginTop: 8, fontWeight: '900', fontSize: 12 },
  progressTrack: { height: 5, borderRadius: 999, backgroundColor: colors.border, marginTop: 5, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 999 },
});
