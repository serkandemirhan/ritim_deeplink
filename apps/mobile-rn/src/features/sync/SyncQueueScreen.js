import React, { useState } from 'react';
import { Text, StyleSheet, FlatList, View } from 'react-native';
import AppScreen from '../../components/AppScreen';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import EmptyState from '../../components/EmptyState';
import SectionHeader from '../../components/SectionHeader';
import useStore from '../../store/store';
import colors from '../../theme/colors';
import { isSupabaseConfigured } from '../../lib/supabase';
import { syncQueueItems, importLocalDataToSupabase, pullRemoteData } from '../../services/supabaseSync';

export default function SyncQueueScreen({ navigate }) {
  const activeTenantId = useStore((s) => s.activeTenantId);
  const profile = useStore((s) => s.profile);
  const tenants = useStore((s) => s.tenants);
  const activityTypes = useStore((s) => s.activityTypes);
  const nfcTags = useStore((s) => s.nfcTags);
  const tenantNfcCards = useStore((s) => s.tenantNfcCards);
  const cardAssignments = useStore((s) => s.cardAssignments);
  const activityLogs = useStore((s) => s.activityLogs);
  const routines = useStore((s) => s.routines);
  const routinePlans = useStore((s) => s.routinePlans);
  const routineProgressionRules = useStore((s) => s.routineProgressionRules);
  const routineDailyLogs = useStore((s) => s.routineDailyLogs);
  const routineLogEntries = useStore((s) => s.routineLogEntries);
  const syncQueue = useStore((s) => s.syncQueue);
  const markSyncQueueItem = useStore((s) => s.markSyncQueueItem);
  const markEntitySynced = useStore((s) => s.markEntitySynced);
  const markEntitySyncFailed = useStore((s) => s.markEntitySyncFailed);
  const claimLocalDataForUser = useStore((s) => s.claimLocalDataForUser);
  const hydrateRemoteData = useStore((s) => s.hydrateRemoteData);
  const markAllSyncedForTenant = useStore((s) => s.markAllSyncedForTenant);
  const [status, setStatus] = useState(isSupabaseConfigured ? 'Senkronizasyon hazır.' : 'Senkronizasyon şu anda kapalı.');
  const queue = syncQueue.filter((item) => !item.tenantId || item.tenantId === activeTenantId);
  const pendingCount = queue.filter((item) => item.status === 'pending' || item.status === 'failed').length;
  const runSync = async () => {
    try {
      setStatus('Senkronize ediliyor...');
      await syncQueueItems({ queue, markSyncQueueItem, markEntitySynced, markEntitySyncFailed });
      setStatus('Senkronizasyon tamamlandı.');
    } catch (error) {
      setStatus(error?.message || 'Senkronizasyon başarısız.');
    }
  };
  const importLocal = async () => {
    try {
      setStatus('Yerel veriler aktarılıyor...');
      const result = await importLocalDataToSupabase({
        profile,
        tenants,
        activeTenantId,
        activityTypes,
        nfcTags,
        tenantNfcCards,
        cardAssignments,
        activityLogs,
        routines,
        routinePlans,
        routineProgressionRules,
        routineDailyLogs,
        routineLogEntries,
      });
      if (result.profile) claimLocalDataForUser(result.profile);
      markAllSyncedForTenant(activeTenantId);
      setStatus('Yerel veriler aktarıldı.');
    } catch (error) {
      setStatus(error?.message || 'Yerel veriler aktarılamadı.');
    }
  };
  const pullRemote = async () => {
    try {
      setStatus('Uzak veriler alınıyor...');
      hydrateRemoteData(await pullRemoteData());
      setStatus('Uzak veriler güncellendi.');
    } catch (error) {
      setStatus(error?.message || 'Uzak veriler alınamadı.');
    }
  };

  return (
    <AppScreen>
      <SectionHeader title="Senkronizasyon" />
      <Text style={styles.status}>{status}</Text>
      <AppButton onPress={runSync} style={[styles.syncButton, !isSupabaseConfigured && styles.disabledButton]}>
        Bekleyenleri senkronize et ({pendingCount})
      </AppButton>
      <View style={styles.actionRow}>
        <AppButton onPress={pullRemote} style={[styles.rowButton, !isSupabaseConfigured && styles.disabledButton]}>Verileri al</AppButton>
        <AppButton onPress={importLocal} style={[styles.rowButton, styles.importButton, !isSupabaseConfigured && styles.disabledButton]}>Yereli aktar</AppButton>
      </View>
      <FlatList
        data={queue}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AppCard style={styles.card}>
            <View>
              <Text style={styles.title}>{item.entityType} · {item.operation}</Text>
              <Text style={styles.meta}>{item.status} · deneme {item.attempts}</Text>
            </View>
            <AppButton onPress={() => markSyncQueueItem(item.id, 'synced')} style={styles.smallButton}>Tamamlandı işaretle</AppButton>
          </AppCard>
        )}
        ListEmptyComponent={<EmptyState title="Bekleyen kayıt yok" description="Senkron bekleyen değişiklikler burada görünür." />}
        contentContainerStyle={styles.list}
      />
      <View style={styles.footer}>
        <AppButton onPress={() => navigate('home')} style={styles.secondaryButton}>Bugün</AppButton>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 24 },
  status: { color: colors.textSecondary, marginBottom: 12, lineHeight: 19 },
  syncButton: { marginBottom: 14 },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  rowButton: { flex: 1, paddingVertical: 10, backgroundColor: colors.surfaceLight },
  importButton: { backgroundColor: colors.secondary, shadowColor: colors.secondary },
  disabledButton: { backgroundColor: colors.surfaceLight, shadowOpacity: 0.1 },
  card: { marginBottom: 10 },
  title: { color: colors.textPrimary, fontWeight: '900' },
  meta: { color: colors.textSecondary, marginTop: 4 },
  smallButton: { marginTop: 12 },
  footer: { paddingBottom: 32 },
  secondaryButton: { backgroundColor: colors.surfaceLight },
});
