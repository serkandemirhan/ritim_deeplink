import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import AppScreen from '../../components/AppScreen';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import AppBadge from '../../components/AppBadge';
import SectionHeader from '../../components/SectionHeader';
import useStore from '../../store/store';
import colors from '../../theme/colors';
import { isNativeNfcRuntime } from './nfcAdapter';
import { buildRitimCustomTagUrl, buildRitimTagUrl } from '../../lib/deepLinkConstants';
import { extractRitimTagCode } from '../../lib/deepLinking';
import { canShowDebugUi, displayDayTime, isProductionUi } from '../../lib/uiText';

export default function NfcSettingsScreen({ navigate }) {
  const adapter = useStore((s) => s.nfcAdapter);
  const setNfcAdapterMode = useStore((s) => s.setNfcAdapterMode);
  const devToolsEnabled = useStore((s) => s.devToolsEnabled);
  const setDevToolsEnabled = useStore((s) => s.setDevToolsEnabled);
  const activeTenantId = useStore((s) => s.activeTenantId);
  const tenantNfcCards = useStore((s) => s.tenantNfcCards);
  const activityLogs = useStore((s) => s.activityLogs);
  const activityTypes = useStore((s) => s.activityTypes);
  const testTagCode = 'NFC_TEST_001';
  const showDebugUi = canShowDebugUi(devToolsEnabled);
  const cards = tenantNfcCards.filter((card) => card.tenantId === activeTenantId);
  const lastNfcLog = activityLogs
    .filter((log) => log.tenantId === activeTenantId && (log.source === 'mock_nfc' || log.source === 'nfc'))
    .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))[0];
  const lastActivity = lastNfcLog ? activityTypes.find((activity) => activity.id === lastNfcLog.activityTypeId) : null;
  const nfcStatus = adapter.status === 'error' ? 'NFC hatası' : adapter.status === 'scanning' ? 'Kart bekleniyor' : 'NFC hazır';

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title="NFC Ayarları" />
        <AppCard>
          {showDebugUi ? <AppBadge>DEV</AppBadge> : null}
          <Text style={styles.title}>NFC kart okutma hazır</Text>
          <Text style={styles.meta}>Tanımlı kart okutulursa kayıt otomatik işlenir. Boş kart okutulursa aynı ekrandan kart bağlayabilirsin.</Text>
          <View style={styles.summaryGrid}>
            <Summary label="Kayıtlı kart" value={String(cards.length)} />
            <Summary label="NFC durumu" value={nfcStatus} />
            <Summary label="Son okutma" value={lastNfcLog ? `${lastActivity?.displayNameTr || 'Aktivite'} · ${displayDayTime(lastNfcLog.loggedAt)}` : 'Henüz okutma yok'} wide />
          </View>
          {showDebugUi ? <Text style={styles.meta}>Runtime: {isNativeNfcRuntime() ? 'native iOS/Android' : 'web'}</Text> : null}
          {showDebugUi ? <Text style={styles.meta}>Durum: {adapter.status}</Text> : null}
          {adapter.lastError ? <Text style={styles.error}>{adapter.lastError}</Text> : null}
        </AppCard>
        {showDebugUi ? (
          <AppCard style={styles.testCard}>
            <Text style={styles.title}>Deep link testi</Text>
            <Text style={styles.meta}>HTTPS: {extractRitimTagCode(buildRitimTagUrl(testTagCode))}</Text>
            <Text style={styles.meta}>Scheme: {extractRitimTagCode(buildRitimCustomTagUrl(testTagCode))}</Text>
            <AppButton onPress={() => navigate('t/NFC_TEST_001')} style={styles.secondaryButton}>NFC_TEST_001 aç</AppButton>
          </AppCard>
        ) : null}
        <View style={styles.actions}>
          {showDebugUi ? <AppButton onPress={() => setNfcAdapterMode('native')} style={styles.primaryButton}>Gerçek NFC kullan</AppButton> : null}
          {!isProductionUi ? (
            <AppButton onPress={() => setDevToolsEnabled(!devToolsEnabled)} style={styles.secondaryButton}>
              {devToolsEnabled ? 'DEV araçlarını kapat' : 'DEV araçlarını aç'}
            </AppButton>
          ) : null}
          {showDebugUi ? <AppButton onPress={() => setNfcAdapterMode('mock')} style={styles.secondaryButton}>Simülasyon adaptörü</AppButton> : null}
          <AppButton onPress={() => navigate('mock-scan')} style={styles.primaryButton}>NFC kart tara</AppButton>
          <AppButton onPress={() => navigate('cards')} style={styles.secondaryButton}>Kartlarım</AppButton>
          <AppButton onPress={() => navigate('home')} style={styles.secondaryButton}>Bugün’e dön</AppButton>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function Summary({ label, value, wide }) {
  return (
    <View style={[styles.summaryBox, wide && styles.summaryWide]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={wide ? 2 : 1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 170 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', marginTop: 12 },
  meta: { color: colors.textSecondary, marginTop: 8, lineHeight: 20 },
  error: { color: colors.danger, marginTop: 8, lineHeight: 20, fontWeight: '800' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  summaryBox: { flexBasis: '48%', flexGrow: 1, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceLight, padding: 12 },
  summaryWide: { flexBasis: '100%' },
  summaryLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  summaryValue: { color: colors.textPrimary, fontWeight: '800', marginTop: 6, lineHeight: 18 },
  actions: { marginTop: 18, paddingBottom: 160 },
  testCard: { marginTop: 14 },
  primaryButton: { marginBottom: 12 },
  secondaryButton: { backgroundColor: colors.surfaceLight, marginBottom: 12 },
});
