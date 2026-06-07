import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';

export default function AppScreen({ children, style }) {
  return (
    <SafeAreaView style={styles.shell} edges={['top', 'left', 'right']}>
      <View style={[styles.phone, style]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
          style={styles.keyboard}
        >
          <View style={styles.inner}>{children}</View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  phone: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    backgroundColor: colors.backgroundSoft,
    borderColor: Platform.OS === 'web' ? 'rgba(255,255,255,0.12)' : 'transparent',
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderRadius: Platform.OS === 'web' ? 24 : 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'web' ? 0.36 : 0,
    shadowRadius: Platform.OS === 'web' ? 22 : 0,
    shadowOffset: { width: 0, height: 16 },
  },
  keyboard: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 0,
  },
});
