import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../theme/colors';

export default function EmptyState({ title, description, children, style }) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.dot} />
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {children ? <View style={styles.children}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.primary,
    marginBottom: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  description: {
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 19,
    textAlign: 'center',
  },
  children: {
    width: '100%',
    marginTop: 14,
  },
});
