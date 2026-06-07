import React from 'react';
import { View, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function AppCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0D1828',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
  },
});
