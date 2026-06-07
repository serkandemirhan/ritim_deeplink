import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function AppTextInput({ style, placeholderTextColor, ...props }) {
  return (
    <TextInput
      placeholderTextColor={placeholderTextColor || colors.textSecondary}
      style={[styles.input, style]}
      maxFontSizeMultiplier={1.15}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    color: colors.textPrimary,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 17,
    fontWeight: '700',
  },
});
