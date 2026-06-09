import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../theme/colors';

const toneStyles = {
  default: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceLight,
    color: colors.textSecondary,
  },
  primary: {
    borderColor: 'rgba(53, 226, 122, 0.45)',
    backgroundColor: 'rgba(53, 226, 122, 0.12)',
    color: colors.primary,
  },
  secondary: {
    borderColor: 'rgba(55, 183, 255, 0.45)',
    backgroundColor: 'rgba(55, 183, 255, 0.12)',
    color: colors.secondary,
  },
  purple: {
    borderColor: 'rgba(155, 92, 255, 0.45)',
    backgroundColor: 'rgba(155, 92, 255, 0.14)',
    color: colors.purple,
  },
  danger: {
    borderColor: 'rgba(255, 92, 122, 0.45)',
    backgroundColor: 'rgba(255, 92, 122, 0.12)',
    color: colors.danger,
  },
};

export default function AppBadge({ children, tone = 'default', style, textStyle }) {
  const selectedTone = toneStyles[tone] || toneStyles.default;

  return (
    <View style={[styles.badge, { borderColor: selectedTone.borderColor, backgroundColor: selectedTone.backgroundColor }, style]}>
      <Text style={[styles.text, { color: selectedTone.color }, textStyle]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    fontSize: 11,
    fontWeight: '900',
  },
});
