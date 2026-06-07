import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView, Vibration, Animated, Easing } from 'react-native';
import AppScreen from '../../components/AppScreen';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import useStore from '../../store/store';
import colors from '../../theme/colors';
import { isNativeNfcRuntime, scanRealNfcTag } from './nfcAdapter';
import { playSoundEffect } from '../../services/soundEffects';
import { NfcSuccessAnimation, estimateXp, levelFromXp } from '../../components/NfcSuccessExperience';
import { canShowDebugUi, maskCardCode } from '../../lib/uiText';

const MOCKS = ['MOCK-TAG-001', 'MOCK-TAG-002', 'MOCK-TAG-003'];

function normalizeNfcError(error) {
  const text = String(error || '').toLowerCase();
  if (text.includes('not support') || text.includes('only available') || text.includes('not available')) {
    return 'NFC desteklenmiyor.';
  }
  if (text.includes('disabled') || text.includes('off') || text.includes('kapalı')) {
    return 'NFC kapalı. Telefon ayarlarından NFC’yi aç.';
  }
  return 'Kart okunamadı, tekrar dene.';
}

export default function MockScanScreen({ route, navigate }) {
  const presetActivityTypeIdParam = route?.params?.activityTypeId;
  const presetRoutineIdParam = route?.params?.routineId;
  const presetActivityTypeId = Array.isArray(presetActivityTypeIdParam) ? presetActivityTypeIdParam[0] : presetActivityTypeIdParam;
  const presetRoutineId = Array.isArray(presetRoutineIdParam) ? presetRoutineIdParam[0] : presetRoutineIdParam;
  const [selected, setSelected] = useState(MOCKS[0]);
  const [mockUids, setMockUids] = useState(MOCKS);
  const [unknownTag, setUnknownTag] = useState(null);
  const [message, setMessage] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [showDevTools, setShowDevTools] = useState(false);
  const createMockNfcTag = useStore((s) => s.createMockNfcTag);
  const createNfcTagFromScan = useStore((s) => s.createNfcTagFromScan);
  const logActivityFromMockScan = useStore((s) => s.logActivityFromMockScan);
  const logActivityFromUidHash = useStore((s) => s.logActivityFromUidHash);
  const adapter = useStore((s) => s.nfcAdapter);
  const devToolsEnabled = useStore((s) => s.devToolsEnabled);
  const setNfcAdapterMode = useStore((s) => s.setNfcAdapterMode);
  const setNfcAdapterStatus = useStore((s) => s.setNfcAdapterStatus);
  const activeTenantId = useStore((s) => s.activeTenantId);
  const profile = useStore((s) => s.profile);
  const activityTypes = useStore((s) => s.activityTypes);
  const activityLogs = useStore((s) => s.activityLogs);
  const getDailyGoalProgress = useStore((s) => s.getDailyGoalProgress);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const scanLockRef = useRef(false);
  const comboRef = useRef({ activityTypeId: null, count: 0, lastAt: 0 });
  const showDebugUi = canShowDebugUi(devToolsEnabled);
  const nativeNfcAvailable = isNativeNfcRuntime();
  const isScanning = adapter.status === 'scanning';
  const isError = adapter.status === 'error';
  const isUnsupported = !nativeNfcAvailable;
  const statusLabel = isScanning
    ? 'Kart bekleniyor...'
    : isUnsupported
      ? 'NFC desteklenmiyor'
      : isError
        ? normalizeNfcError(adapter.lastError)
        : 'NFC hazır';
  const heroTitle = isScanning ? 'Kart bekleniyor...' : 'Telefonunu NFC karta yaklaştır';
  const heroDescription = isScanning
    ? 'Kartı telefonun NFC alanına sabit tut.'
    : nativeNfcAvailable
      ? 'Taramayı başlat, sonra telefonunu karta yaklaştır.'
      : 'Bu ortam gerçek NFC okuyamaz. Kartı manuel ekleyebilirsin.';
  const radarTone = isError || isUnsupported ? 'error' : isScanning ? 'scanning' : 'ready';

  useEffect(() => {
    if (isError || isUnsupported) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: isScanning ? 850 : 1450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: isScanning ? 850 : 1450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isError, isScanning, isUnsupported, pulseAnim]);

  const outerScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, isScanning ? 1.14 : 1.08] });
  const midScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, isScanning ? 0.9 : 0.96] });
  const ringOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.48, 0.92] });

  const buildSuccessData = (log, activity) => {
    const progress = getDailyGoalProgress().find((item) => item.activity?.id === log.activityTypeId);
    const target = Number(progress?.target) || Number(activity?.defaultIncrement || log.value || 1) * 10;
    const newTotal = Number(progress?.total) || Number(log.value) || 0;
    const oldTotal = Math.max(0, newTotal - (Number(log.value) || 0));
    const newPercent = target ? Math.round((newTotal / target) * 100) : 0;
    const oldPercent = target ? Math.round((oldTotal / target) * 100) : 0;
    const comboWindowMs = 12000;
    const nowMs = Date.now();
    const previousCombo = comboRef.current;
    const combo = previousCombo.activityTypeId === log.activityTypeId && nowMs - previousCombo.lastAt <= comboWindowMs
      ? previousCombo.count + 1
      : 1;
    comboRef.current = { activityTypeId: log.activityTypeId, count: combo, lastAt: nowMs };
    const previousXp = activityLogs
      .filter((item) => item.tenantId === activeTenantId && item.id !== log.id)
      .reduce((sum, item) => sum + estimateXp(item), 0);
    const xp = estimateXp(log);
    const previousLevel = levelFromXp(previousXp);
    const level = levelFromXp(previousXp + xp);
    return {
      value: log.value,
      unit: log.unit || activity?.unit || 'tekrar',
      activityName: activity?.displayNameTr || 'Aktivite',
      oldTotal,
      newTotal,
      target,
      oldPercent,
      newPercent,
      extra: Math.max(0, newTotal - target),
      combo,
      xp,
      previousLevel,
      level,
      didLevelUp: level.level > previousLevel.level,
      streakIncreased: true,
    };
  };

  const showSuccessThenHome = (log, activity) => {
    const data = buildSuccessData(log, activity);
    setSuccessData(data);
    playSoundEffect(data.didLevelUp ? 'goalComplete' : data.newPercent >= 150 ? 'overdrive' : data.newPercent >= 100 ? 'goalComplete' : 'scanSuccess');
    setTimeout(() => {
      setSuccessData(null);
      navigate('home', {
        celebration: `${activity?.displayNameTr || 'Aktivite'} kaydedildi`,
        activityTypeId: log.activityTypeId,
        value: String(log.value),
        unit: log.unit || '',
        undoLogId: log.id,
      });
      scanLockRef.current = false;
    }, 1900);
  };

  const simulateScan = () => {
    if (scanLockRef.current) return;
    scanLockRef.current = true;
    playSoundEffect('nfcDetected');
    const tag = createMockNfcTag(selected);
    const log = logActivityFromMockScan({ tenantId: activeTenantId, userId: profile?.id, mockUid: selected });
    if (log) {
      const activity = activityTypes.find((a) => a.id === log.activityTypeId);
      setUnknownTag(null);
      setMessage(null);
      Vibration.vibrate([0, 70, 40, 120]);
      showSuccessThenHome(log, activity);
    } else {
      setUnknownTag({
        mockUid: selected,
        uidHash: tag.uidHash,
        ...(presetActivityTypeId ? { activityTypeId: presetActivityTypeId } : {}),
        ...(presetRoutineId ? { routineId: presetRoutineId } : {}),
      });
      setMessage('Bu kart henüz bağlı değil.');
    }
    if (!log) setTimeout(() => { scanLockRef.current = false; }, 1200);
  };

  const scanRealTag = async () => {
    if (scanLockRef.current) return;
    scanLockRef.current = true;
    playSoundEffect('nfcDetected');
    setNfcAdapterMode('native');
    setNfcAdapterStatus('scanning');
    setUnknownTag(null);
    setMessage('Telefonu gerçek NFC karta yaklaştır.');

    const result = await scanRealNfcTag();
    if (!result.ok) {
      const normalizedError = normalizeNfcError(result.error);
      setNfcAdapterStatus('error', normalizedError);
      setMessage(normalizedError);
      scanLockRef.current = false;
      return;
    }

    const tag = createNfcTagFromScan({ uid: result.uid, uidHash: result.uidHash, source: 'nfc' });
    const log = logActivityFromUidHash({ tenantId: activeTenantId, userId: profile?.id, uidHash: tag.uidHash, source: 'nfc' });
    setNfcAdapterStatus('ready');

    if (log) {
      const activity = activityTypes.find((a) => a.id === log.activityTypeId);
      setMessage(null);
      Vibration.vibrate([0, 70, 40, 120]);
      showSuccessThenHome(log, activity);
      return;
    }

    setUnknownTag({
      scannedUid: result.uid,
      uidHash: tag.uidHash,
      scanSource: 'nfc',
      ...(presetActivityTypeId ? { activityTypeId: presetActivityTypeId } : {}),
      ...(presetRoutineId ? { routineId: presetRoutineId } : {}),
    });
    setMessage('Bu kart henüz bağlı değil.');
    setTimeout(() => {
      scanLockRef.current = false;
    }, 1200);
  };

  const generateMockUid = () => {
    const next = `MOCK-TAG-${Math.floor(100 + Math.random() * 900)}`;
    setMockUids((items) => items.includes(next) ? items : [next, ...items]);
    setSelected(next);
    setUnknownTag(null);
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigate('home')}><Text style={styles.back}>‹</Text></Pressable>
          <Text style={styles.title}>NFC Kart Tara</Text>
          <Text style={styles.spacer}>i</Text>
        </View>
        <Text style={styles.scanTitle}>{heroTitle}</Text>
        <Text style={styles.scanSubtitle}>{heroDescription}</Text>
        <View style={[styles.statusPill, styles[`statusPill${radarTone}`]]}>
          <Text style={[styles.status, styles[`statusText${radarTone}`]]}>{showDebugUi ? `DEV · ${statusLabel}` : statusLabel}</Text>
        </View>

        <View style={styles.radar}>
          <Animated.View style={[
            styles.ringOuter,
            styles[`ringOuter${radarTone}`],
            { transform: [{ scale: outerScale }], opacity: isError || isUnsupported ? 1 : ringOpacity },
          ]}>
            <Animated.View style={[
              styles.ringMid,
              styles[`ringMid${radarTone}`],
              { transform: [{ scale: midScale }] },
            ]}>
              <View style={[styles.ringCore, styles[`ringCore${radarTone}`]]}>
                <Text style={styles.nfcMark}>)))</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </View>

        <AppCard style={styles.tipCard}>
          <Text style={styles.tipTitle}>Kart okutma</Text>
          <Text style={styles.tipText}>Tanımlı kart kayıt oluşturur. Tanımlı değilse kartı ekleyebilirsin.</Text>
          <View style={styles.tipStates}>
            <Text style={styles.tipState}>✓ Tanımlı kart: otomatik kayıt</Text>
            <Text style={styles.tipState}>• Bağlantı yoksa: offline saklanır</Text>
          </View>
        </AppCard>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {unknownTag ? (
          <AppCard style={styles.unknownBox}>
            <Text style={styles.unknownTitle}>Bu kart henüz bağlı değil</Text>
            <Text style={styles.itemMeta}>Kart kodu: {maskCardCode(unknownTag.mockUid || unknownTag.scannedUid || unknownTag.uidHash)}</Text>
            <AppButton onPress={() => navigate('cards/register', unknownTag)} style={styles.registerButton}>Bu kartı tanımla</AppButton>
          </AppCard>
        ) : null}

        <View style={styles.footer}>
          <AppButton onPress={scanRealTag} disabled={!nativeNfcAvailable || isScanning} style={styles.primaryButton}>
            {isScanning ? 'Kart bekleniyor...' : nativeNfcAvailable ? 'Taramayı başlat' : 'NFC desteklenmiyor'}
          </AppButton>
          {!nativeNfcAvailable && !showDebugUi ? (
            <AppButton onPress={() => navigate('cards/register')} style={styles.secondaryButton}>Kartı manuel ekle</AppButton>
          ) : null}
          {showDebugUi ? (
            <Pressable onPress={() => setShowDevTools((value) => !value)} style={styles.devToggle}>
              <Text style={styles.devToggleText}>{showDevTools ? 'DEV araçlarını gizle' : 'DEV araçlarını göster'}</Text>
            </Pressable>
          ) : null}
          {showDebugUi && showDevTools ? (
            <AppCard style={styles.devCard}>
              <Text style={styles.devTitle}>DEV NFC araçları</Text>
              <Text style={styles.devText}>Web ve test akışı için kart simülasyonu.</Text>
              <FlatList data={mockUids} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(i) => i} renderItem={({ item }) => (
                <Pressable onPress={() => { setSelected(item); setUnknownTag(null); }} style={[styles.item, selected === item && styles.sel]}>
                  <Text style={styles.itemTitle}>Kart {maskCardCode(item)}</Text>
                  <Text style={styles.itemMeta}>DEV kart</Text>
                </Pressable>
              )} contentContainerStyle={styles.list} />
              <AppButton onPress={simulateScan} style={styles.mockButton}>Simülasyon okut</AppButton>
              <AppButton onPress={generateMockUid} style={styles.secondaryButton}>DEV kart üret</AppButton>
            </AppCard>
          ) : null}
        </View>
      </ScrollView>
      <NfcSuccessAnimation data={successData} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 140 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  back: { color: colors.textPrimary, fontSize: 26, fontWeight: '300' },
  title: { color: colors.textPrimary, fontWeight: '900', fontSize: 16 },
  spacer: { color: 'transparent', width: 18 },
  scanTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '900', textAlign: 'center', marginHorizontal: 22, lineHeight: 28 },
  scanSubtitle: { color: colors.textSecondary, textAlign: 'center', marginTop: 8, marginHorizontal: 28, lineHeight: 19, fontWeight: '700' },
  statusPill: { alignSelf: 'center', minHeight: 32, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7, marginTop: 14, marginBottom: 18 },
  statusPillready: { borderColor: 'rgba(53,226,122,0.42)', backgroundColor: 'rgba(53,226,122,0.10)' },
  statusPillscanning: { borderColor: colors.primary, backgroundColor: 'rgba(53,226,122,0.15)' },
  statusPillerror: { borderColor: colors.orange, backgroundColor: 'rgba(255,138,42,0.12)' },
  status: { textAlign: 'center', fontWeight: '900', fontSize: 12 },
  statusTextready: { color: colors.primary },
  statusTextscanning: { color: colors.primary },
  statusTexterror: { color: colors.orange },
  radar: { alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  ringOuter: { width: 206, height: 206, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ringOuterready: { borderColor: 'rgba(50,215,75,0.22)', backgroundColor: 'rgba(50,215,75,0.04)' },
  ringOuterscanning: { borderColor: 'rgba(50,215,75,0.34)', backgroundColor: 'rgba(50,215,75,0.07)' },
  ringOutererror: { borderColor: 'rgba(255,138,42,0.34)', backgroundColor: 'rgba(255,138,42,0.06)' },
  ringMid: { width: 146, height: 146, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ringMidready: { borderColor: 'rgba(50,215,75,0.35)', backgroundColor: 'rgba(50,215,75,0.08)' },
  ringMidscanning: { borderColor: 'rgba(50,215,75,0.58)', backgroundColor: 'rgba(50,215,75,0.12)' },
  ringMiderror: { borderColor: 'rgba(255,138,42,0.52)', backgroundColor: 'rgba(255,138,42,0.10)' },
  ringCore: { width: 94, height: 94, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  ringCoreready: { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 18 },
  ringCorescanning: { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.72, shadowRadius: 24 },
  ringCoreerror: { backgroundColor: colors.orange, shadowColor: colors.orange, shadowOpacity: 0.42, shadowRadius: 18 },
  nfcMark: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  tipCard: { marginBottom: 14, padding: 14 },
  tipTitle: { color: colors.textPrimary, fontWeight: '900', marginBottom: 5 },
  tipText: { color: colors.textSecondary, lineHeight: 18 },
  tipStates: { gap: 4, marginTop: 10 },
  tipState: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  message: { color: colors.textSecondary, textAlign: 'center', marginBottom: 12, lineHeight: 18 },
  list: { paddingBottom: 14, gap: 8 },
  item: { width: 132, padding: 12, borderRadius: 10, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, marginRight: 8 },
  itemTitle: { color: colors.textPrimary, fontWeight: '900' },
  itemMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  sel: { borderColor: colors.primary, borderWidth: 2 },
  unknownBox: { borderColor: colors.secondary, marginBottom: 12 },
  unknownTitle: { color: colors.textPrimary, fontWeight: '800', marginBottom: 4 },
  registerButton: { marginTop: 12 },
  footer: { paddingBottom: 24 },
  primaryButton: { shadowOpacity: 0.34 },
  devToggle: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 18 },
  devToggleText: { color: colors.textSecondary, fontWeight: '900' },
  devCard: { marginTop: 2, marginBottom: 14 },
  devTitle: { color: colors.textPrimary, fontWeight: '900', marginBottom: 4 },
  devText: { color: colors.textSecondary, marginBottom: 12, lineHeight: 18 },
  mockButton: { marginTop: 12, backgroundColor: colors.secondary, shadowColor: colors.secondary },
  secondaryButton: { marginTop: 12, backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border, shadowOpacity: 0, shadowRadius: 0 },
});
