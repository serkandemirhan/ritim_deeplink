import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Image, Platform, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../theme/colors';

const dashboardTokens = require('../../ritim_dashboard_assets/dashboard-design-tokens.json');
const dashboardNavIcons = {
  home: require('../../ritim_dashboard_assets/icon-home.svg'),
  progress: require('../../ritim_dashboard_assets/icon-progress.svg'),
  profile: require('../../ritim_dashboard_assets/icon-profile.svg'),
  scan: require('../../ritim_dashboard_assets/icon-scan.svg'),
};
const isWeb = Platform.OS === 'web';

export default function BottomNav({ active = 'home', navigate, hideScan = false, variant = 'floating' }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 12);
  const barBottom = safeBottom + 16;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1350, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1350, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const go = (route, params) => {
    navigate(route, params);
  };

  if (!navigate) return null;
  if (hideScan || variant !== 'dashboard') return null;

  return (
    <View pointerEvents="box-none" style={styles.layer}>
      <View pointerEvents="auto" style={[styles.dashboardBar, { bottom: barBottom }]}>
          <Pressable onPress={() => go('home')} style={[styles.dashboardItem, active === 'home' && styles.dashboardItemActive]}>
            <Image source={dashboardNavIcons.home} style={styles.dashboardIcon} />
            <Text style={[styles.dashboardLabel, active === 'home' && styles.dashboardLabelActive]}>Bugün</Text>
          </Pressable>
          <Pressable onPress={() => go('mock-scan')} style={[styles.dashboardItem, styles.dashboardScanItem, active === 'scan' && styles.dashboardItemActive]}>
            <Animated.View style={[styles.scanPulseOuter, {
              opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0] }),
              transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.18] }) }],
            }]} />
            <Animated.View style={[styles.dashboardScan, isWeb && styles.webScanGradient, {
              transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) }],
            }]}>
              <Image source={dashboardNavIcons.scan} style={styles.dashboardScanIcon} />
            </Animated.View>
            <Text style={[styles.dashboardLabel, active === 'scan' && styles.dashboardLabelActive]}>Tara</Text>
          </Pressable>
          <Pressable onPress={() => go('profile')} style={[styles.dashboardItem, active === 'profile' && styles.dashboardItemActive]}>
            <Image source={dashboardNavIcons.profile} style={styles.dashboardIconMuted} />
            <Text style={[styles.dashboardLabel, active === 'profile' && styles.dashboardLabelActive]}>Profil</Text>
          </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: -22,
    right: -22,
    bottom: 0,
    zIndex: 20,
  },
  webScanGradient: { backgroundImage: dashboardTokens.gradients.scanButton },
  dashboardBar: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: 64,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: dashboardTokens.colors.border,
    backgroundColor: dashboardTokens.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  dashboardItem: {
    flex: 1,
    minWidth: 0,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dashboardItemActive: {
    backgroundColor: dashboardTokens.colors.surfaceElevated,
  },
  dashboardIcon: { width: 24, height: 24, resizeMode: 'contain' },
  dashboardIconMuted: { width: 24, height: 24, resizeMode: 'contain', opacity: 0.62 },
  dashboardScanItem: { overflow: 'visible' },
  dashboardTextIcon: { color: dashboardTokens.colors.textSecondary, fontSize: 23, fontWeight: '900' },
  dashboardLabel: { color: dashboardTokens.colors.textSecondary, fontSize: 11, fontWeight: '900' },
  dashboardLabelActive: { color: dashboardTokens.colors.textPrimary },
  scanPulseOuter: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: dashboardTokens.colors.cyan,
    backgroundColor: 'rgba(55,183,255,0.045)',
    top: 4,
  },
  dashboardScan: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTokens.colors.surfaceElevated,
    borderColor: dashboardTokens.colors.cyan,
    borderWidth: 1,
    shadowColor: dashboardTokens.colors.violet,
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    overflow: 'hidden',
  },
  dashboardScanIcon: { width: 20, height: 20, resizeMode: 'contain' },
});
