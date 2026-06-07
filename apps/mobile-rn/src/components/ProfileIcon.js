import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import tokens from '../theme/ritimTokens';

export default function ProfileIcon({ size = 64, light = false }) {
  let source;
  try {
    source = light
      ? require('../../ritim_codex_assets/ritim-icon-light.svg')
      : require('../../ritim_codex_assets/ritim-icon-dark.svg');
  } catch (e) {
    source = null;
  }

  return (
    <View style={[styles.wrapper, { width: size, height: size, borderRadius: size / 4 }]}>
      {source ? (
        <Image source={source} style={{ width: size, height: size, resizeMode: 'contain' }} />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 4 }]}>
          <Text style={styles.text}>R</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  fallback: { backgroundColor: tokens.colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  text: { color: tokens.colors.textPrimary, fontWeight: '800' },
});
