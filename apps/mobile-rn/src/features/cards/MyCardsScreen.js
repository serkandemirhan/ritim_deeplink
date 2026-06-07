import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import AppScreen from '../../components/AppScreen';
import AppButton from '../../components/AppButton';
import AppBadge from '../../components/AppBadge';
import AppCard from '../../components/AppCard';
import EmptyState from '../../components/EmptyState';
import SectionHeader from '../../components/SectionHeader';
import ActivityIcon from '../../components/ActivityIcon';
import useStore from '../../store/store';
import colors from '../../theme/colors';
import { displayDayTime, displayUnit } from '../../lib/uiText';

export default function MyCardsScreen({ navigate, onBack }) {
  const activeTenantId = useStore((s) => s.activeTenantId);
  const tenantNfcCards = useStore((s) => s.tenantNfcCards);
  const cardAssignments = useStore((s) => s.cardAssignments);
  const activityTypes = useStore((s) => s.activityTypes);
  const activityLogs = useStore((s) => s.activityLogs);
  const cards = tenantNfcCards
    .filter((c) => c.tenantId === activeTenantId)
    .sort((a, b) => {
      const rank = { unassigned: 0, assigned: 1, active: 1, disabled: 2, lost: 3 };
      return (rank[a.status] ?? 4) - (rank[b.status] ?? 4);
    });

  return (
    <AppScreen>
      <View style={styles.header}>
        <Pressable onPress={onBack || (() => navigate('profile'))}><Text style={styles.back}>‹</Text></Pressable>
        <Text style={styles.headerTitle}>NFC Kartlarım</Text>
        <Text style={styles.info}>i</Text>
      </View>
      <View style={styles.heroRow}>
        <Text style={styles.desc}>Bağlı kartlarını ve hızlı kayıt ayarlarını yönet.</Text>
        <Pressable onPress={() => navigate('cards/register')} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ NFC kart ekle</Text>
        </Pressable>
      </View>
      <SectionHeader title="NFC Kartlar" />
      <FlatList data={cards} keyExtractor={(i)=>i.id} renderItem={({item})=>{
        const asg = cardAssignments.find((a) => a.tenantCardId === item.id);
        const activity = asg ? activityTypes.find((t) => t.id === asg.activityTypeId) : null;
        const cardLogs = activityLogs.filter((log) => log.tenantCardId === item.id && log.tenantId === activeTenantId);
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthScans = cardLogs.filter((log) => new Date(log.loggedAt) >= monthStart).length;
        const totalContribution = cardLogs.reduce((sum, log) => sum + (Number(log.value) || 0), 0);
        const lastLog = cardLogs.sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))[0];
        const lastLabel = lastLog ? displayDayTime(lastLog.loggedAt) : 'Henüz okutulmadı';
        const unitLabel = displayUnit(asg?.unit || activity?.unit || '');
        const isActive = item.status === 'assigned' || item.status === 'active';
        const statusText = isActive ? 'Aktif' : item.status === 'unassigned' ? 'Atanmamış' : 'Pasif';
        return (
          <Pressable onPress={() => navigate('cards/register', { cardId: item.id })}>
            <AppCard style={[styles.card, activity?.category === 'wellness' && styles.wellnessCard]}>
              <ActivityIcon activity={activity} size={46} />
              <View style={styles.cardMain}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.name, activity?.category === 'wellness' && styles.wellnessText]} numberOfLines={1}>{item.cardName}</Text>
                  <AppBadge tone={isActive ? 'primary' : 'default'} style={styles.status}>{statusText}</AppBadge>
                </View>
                <Text style={styles.sub} numberOfLines={1}>
                  {activity ? `${activity.displayNameTr} · Her okutma +${asg?.incrementValue || 0} ${unitLabel}` : 'Aktivite bağlı değil'}
                </Text>
                <View style={styles.cardStatsRow}>
                  <Text style={styles.statPill}>Bu ay {monthScans} okutma</Text>
                  <Text style={styles.statPill}>Toplam {totalContribution} {unitLabel}</Text>
                </View>
                <Text style={styles.sub} numberOfLines={1}>Son okuma: {lastLabel}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </AppCard>
          </Pressable>
        );
      }} ListEmptyComponent={(
        <View style={styles.emptyWrap}>
          <EmptyState title="Henüz kartın yok" description="İlk NFC kartını bağlayarak ritmini fiziksel hale getir." />
          <AppButton onPress={() => navigate('cards/register')} style={styles.emptyButton}>NFC kart ekle</AppButton>
        </View>
      )} contentContainerStyle={styles.list} />
      <AppCard style={styles.tenantNote}>
        <Text style={styles.tenantNoteTitle}>Bu kart sadece senin ayarlarınla çalışır.</Text>
        <Text style={styles.tenantNoteText}>Aynı fiziksel kart başka hesapta farklı aktivite veya miktara bağlı olabilir.</Text>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  back: { color: colors.textPrimary, fontSize: 26, fontWeight: '300' },
  headerTitle: { color: colors.textPrimary, fontWeight: '900', fontSize: 16 },
  info: { color: colors.textPrimary, borderColor: colors.textPrimary, borderWidth: 1, borderRadius: 999, width: 18, height: 18, textAlign: 'center', fontWeight: '900', fontSize: 12 },
  heroRow: { marginBottom: 12 },
  desc: { color: colors.textSecondary, marginBottom: 10, lineHeight: 18 },
  addButton: { minHeight: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.purple, shadowColor: colors.purple, shadowOpacity: 0.22, shadowRadius: 10 },
  addButtonText: { color: '#FFFFFF', fontWeight: '900' },
  list: { paddingBottom: 150 },
  card: { marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12 },
  wellnessCard: { borderColor: colors.pink, backgroundColor: colors.pinkSoft },
  cardMain: { flex: 1, minWidth: 0 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  name: { flex: 1, minWidth: 0, color: colors.textPrimary, fontWeight: '900' },
  wellnessText: { color: colors.pink },
  sub: { color: colors.textSecondary, marginTop: 3, fontSize: 12 },
  cardStatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 },
  statPill: { color: colors.textPrimary, fontSize: 10, fontWeight: '800', borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3, overflow: 'hidden' },
  status: { marginTop: 0, paddingHorizontal: 8, paddingVertical: 3 },
  chevron: { color: colors.textSecondary, fontSize: 24, fontWeight: '300' },
  emptyWrap: { marginTop: 6 },
  emptyButton: { marginTop: 12, minHeight: 48 },
  tenantNote: { marginTop: 8, marginBottom: 80, borderColor: colors.purple, backgroundColor: 'rgba(155,92,255,0.10)' },
  tenantNoteTitle: { color: colors.textPrimary, fontWeight: '900' },
  tenantNoteText: { color: colors.textSecondary, marginTop: 6, lineHeight: 19 },
});
