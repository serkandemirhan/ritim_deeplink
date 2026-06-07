import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import tokens from '../theme/ritimTokens';

export default function AppLogo({ style, width = 220, height = 68, size }) {
  let source;
  try {
    source = require('../../ritim_codex_assets/ritim-logo-full.svg');
  } catch (e) {
    source = null;
  }
  const resolvedWidth = size || width;
  const resolvedHeight = size ? Math.round(size * 0.31) : height;

  return (
    <View style={[styles.container, style]}>
      {source ? (
        <Image source={source} style={{ width: resolvedWidth, height: resolvedHeight, resizeMode: 'contain' }} />
      ) : (
        <View style={[styles.fallback, { width: resolvedWidth, height: resolvedHeight }]}>
          <Text style={styles.text}>Ritim</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  fallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.surface, borderRadius: 12 },
  text: { color: tokens.colors.textPrimary, fontSize: 28, fontWeight: '800' },
});
