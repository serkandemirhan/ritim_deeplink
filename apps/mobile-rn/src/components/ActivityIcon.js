import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import colors from '../theme/colors';

const GLYPHS = {
  push_ups: '⌁',
  push_up: '⌁',
  squats: '⌄',
  squat: '⌄',
  bench_press: '▰',
  plank: '▬',
  running: '↗',
  walking: '↷',
  walk_break: '↷',
  jump_rope: '∞',
  lunges: '⌞',
  sit_ups: '⌃',
  sit_up: '⌃',
  burpees: '✦',
  burpee: '✦',
  pull_ups: '⌐',
  pull_up: '⌐',
  cycling: '○',
  stretching: '〰',
  stretch_break: '〰',
  yoga: '◌',
  water: '◍',
  coffee: '◒',
  meditation: '◉',
  vitamins: '+',
  breathing: '≈',
  sleep: '☾',
  healthy_meal: '◇',
  steps: '↟',
  weight: '◼',
  daily_note: '✎',
  note: '✎',
};

export default function ActivityIcon({ activity, size = 44, compact = false, style }) {
  const toneColor = activity?.category === 'wellness' ? colors.pink : (activity?.color || colors.primary);
  const key = activity?.name || activity?.icon;
  const glyph = GLYPHS[key] || GLYPHS[activity?.icon] || (activity?.displayNameTr || '?').slice(0, 1);
  const dimension = compact ? Math.round(size * 0.84) : size;
  const fontSize = Math.max(16, Math.round(dimension * 0.48));

  return (
    <View style={[
      styles.box,
      {
        width: dimension,
        height: dimension,
        borderRadius: Math.round(dimension * 0.28),
        borderColor: toneColor,
        backgroundColor: activity?.category === 'wellness' ? 'rgba(155, 92, 255, 0.16)' : 'rgba(53, 226, 122, 0.10)',
      },
      style,
    ]}>
      <Text style={[styles.glyph, { color: toneColor, fontSize }]}>{glyph}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontWeight: '900',
    lineHeight: 30,
    includeFontPadding: false,
    textAlign: 'center',
  },
});
