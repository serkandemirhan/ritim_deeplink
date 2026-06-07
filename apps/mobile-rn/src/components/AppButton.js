import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function AppButton({ children, onPress, style, textStyle, disabled }) {
  return (
    <Pressable style={[styles.button, disabled && styles.disabled, style]} onPress={disabled ? undefined : onPress}>
      <Text style={[styles.text, textStyle]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.86} maxFontSizeMultiplier={1.15}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.purple,
    width: '100%',
    minHeight: 56,
    maxHeight: 64,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.purple,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  disabled: {
    opacity: 0.62,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    textAlign: 'center',
  },
});
