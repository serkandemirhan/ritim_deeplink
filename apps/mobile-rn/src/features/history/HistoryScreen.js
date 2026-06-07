import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import AppScreen from '../../components/AppScreen';
import AppButton from '../../components/AppButton';
import SectionHeader from '../../components/SectionHeader';
import AppCard from '../../components/AppCard';
import BottomNav from '../../components/BottomNav';
import EmptyState from '../../components/EmptyState';
import useStore from '../../store/store';
import colors from '../../theme/colors';
import { displayDayTime, displaySource, displaySyncBadge, displayUnit } from '../../lib/uiText';

const learningActivityNames = new Set(['book_reading', 'english', 'french', 'turkish_diction', 'education_video']);

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isInRange(dateValue, range) {
  const date = new Date(dateValue);
  const today = startOfDay(new Date());
  if (range === 'today') return date >= today;
  if (range === 'week') {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return date >= start;
  }
  if (range === 'month') {
    const start = new Date(today);
    start.setDate(1);
    return date >= start;
  }
  return true;
}

export default function HistoryScreen({ navigate }) {
  const [dateFilter, setDateFilter] = useState('today');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [openLogId, setOpenLogId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const activeTenantId = useStore((s) => s.activeTenantId);
  const activityLogs = useStore((s) => s.activityLogs);
  const activityTypes = useStore((s) => s.activityTypes);
  const undoActivityLog = useStore((s) => s.undoActivityLog);
  const tenantActivities = useMemo(() => activityTypes.filter((activity) => activity.tenantId === activeTenantId), [activityTypes, activeTenantId]);
  const logs = useMemo(() => {
    return activityLogs.filter((log) => {
      const activity = activityTypes.find((item) => item.id === log.activityTypeId);
      const isLearning = activity ? learningActivityNames.has(activity.name) : false;
      if (log.tenantId !== activeTenantId) return false;
      if (!isInRange(log.loggedAt, dateFilter)) return false;
      if (categoryFilter === 'learning' && !isLearning) return false;
      if (categoryFilter === 'wellness' && (log.category !== 'wellness' || isLearning)) return false;
      if (categoryFilter === 'fitness' && log.category !== 'fitness') return false;
      if (sourceFilter === 'nfc' && !(log.source === 'mock_nfc' || log.source === 'nfc')) return false;
      if (sourceFilter === 'manual' && log.source !== 'manual') return false;
      if (activityFilter !== 'all' && log.activityTypeId !== activityFilter) return false;
      return true;
    }).sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));
  }, [activityLogs, activityTypes, activeTenantId, activityFilter, categoryFilter, dateFilter, sourceFilter]);
  const dateFilters = [
    { label: 'Bugün', value: 'today' },
    { label: 'Bu hafta', value: 'week' },
    { label: 'Bu ay', value: 'month' },
    { label: 'Tümü', value: 'all' },
  ];
  const categoryFilters = [
    { label: 'Tümü', value: 'all' },
    { label: 'Fitness', value: 'fitness' },
    { label: 'Wellness', value: 'wellness' },
    { label: 'Learning', value: 'learning' },
  ];
  const sourceFilters = [
    { label: 'Tümü', value: 'all' },
    { label: 'NFC', value: 'nfc' },
    { label: 'Manuel', value: 'manual' },
  ];
  const undoLog = (logId) => {
    const undone = undoActivityLog(logId);
    if (undone) {
      setOpenLogId(null);
      setStatusMessage('Kayıt geri alındı.');
    }
  };

  return (
    <AppScreen>
      <SectionHeader title="Geçmiş" />
      <FilterRow items={dateFilters} value={dateFilter} onChange={setDateFilter} />
      <FilterRow items={categoryFilters} value={categoryFilter} onChange={setCategoryFilter} />
      <FilterRow items={sourceFilters} value={sourceFilter} onChange={setSourceFilter} />
      <Pressable onPress={() => setShowAdvancedFilters((value) => !value)} style={styles.advancedToggle}>
        <Text style={styles.advancedToggleText}>{showAdvancedFilters ? 'Filtreleri gizle' : 'Filtrele'}</Text>
        <Text style={styles.advancedToggleMeta}>{activityFilter !== 'all' ? 'Aktivite filtresi aktif' : 'Aktivite seç'}</Text>
      </Pressable>
      {showAdvancedFilters ? (
        <AppCard style={styles.filterPanel}>
          <View style={styles.filters}>
            <Pressable onPress={() => setActivityFilter('all')} style={[styles.filter, activityFilter === 'all' && styles.filterActive]}>
              <Text style={[styles.filterText, activityFilter === 'all' && styles.filterTextActive]}>Tüm aktiviteler</Text>
            </Pressable>
            {tenantActivities.slice(0, 10).map((activity) => (
              <Pressable key={activity.id} onPress={() => setActivityFilter(activity.id)} style={[styles.filter, activity.category === 'wellness' && styles.wellnessFilter, activityFilter === activity.id && styles.filterActive, activityFilter === activity.id && activity.category === 'wellness' && styles.wellnessFilterActive]}>
                <Text style={[styles.filterText, activityFilter === activity.id && styles.filterTextActive, activity.category === 'wellness' && styles.wellnessText]}>{activity.displayNameTr}</Text>
              </Pressable>
            ))}
          </View>
        </AppCard>
      ) : null}
      {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}
      <FlatList data={logs} keyExtractor={(i)=>i.id} renderItem={({item})=>{
        const act = activityTypes.find((t) => t.id === item.activityTypeId);
        const sync = displaySyncBadge(item.syncStatus);
        const opened = openLogId === item.id;
        const categoryLabel = learningActivityNames.has(act?.name) ? 'Learning' : act?.category === 'wellness' ? 'Wellness' : 'Fitness';
        return (
          <>
            <Pressable onPress={() => setOpenLogId(opened ? null : item.id)}>
              <AppCard style={[styles.row, act?.category === 'wellness' && styles.wellnessRow]}>
                <View style={styles.rowMain}>
                  <Text style={[styles.title, act?.category === 'wellness' && styles.wellnessText]}>{act ? act.displayNameTr : 'Aktivite'}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaPill}>{displaySource(item.source)}</Text>
                    <Text style={styles.metaPill}>{displayDayTime(item.loggedAt)}</Text>
                    <Text style={[styles.metaPill, act?.category === 'wellness' && styles.wellnessPill]}>{categoryLabel}</Text>
                  </View>
                  {!!item.calories && <Text style={styles.meta}>{item.calories} kcal · {act?.workoutCategory || act?.category}</Text>}
                </View>
                <View style={styles.rowSide}>
                  <Text style={[styles.value, act?.category === 'wellness' && styles.wellnessText]}>+{item.value} {displayUnit(item.unit)}</Text>
                  <Text style={[styles.syncBadge, styles[`sync_${sync.tone}`]]}>{sync.label}</Text>
                </View>
              </AppCard>
            </Pressable>
            {opened ? (
              <AppCard style={styles.detailCard}>
                <Text style={styles.detailTitle}>Kayıt detayı</Text>
                <Text style={styles.detailText}>Aktivite: {act?.displayNameTr || 'Aktivite'}</Text>
                <Text style={styles.detailText}>Kaynak: {displaySource(item.source)}</Text>
                <Text style={styles.detailText}>Durum: {sync.label.replace(/^.\s*/, '')}</Text>
                <Text style={styles.detailText}>Zaman: {displayDayTime(item.loggedAt)}</Text>
                <View style={styles.detailActions}>
                  <AppButton onPress={() => navigate('manual-log', { category: item.category, activityName: act?.name })} style={styles.smallButton}>Düzenle</AppButton>
                  <AppButton onPress={() => undoLog(item.id)} style={styles.deleteButton}>Geri al</AppButton>
                </View>
              </AppCard>
            ) : null}
          </>
        );
      }} ListEmptyComponent={<EmptyState title="Bu filtreye uygun kayıt yok" description="Bugün ilk ritmini kaydet." />} contentContainerStyle={styles.list} />
      <View style={styles.footer}>
        {showAddMenu ? (
          <AppCard style={styles.addMenu}>
            <Pressable onPress={() => navigate('manual-log', { category: 'fitness' })} style={styles.addMenuRow}>
              <Text style={styles.addMenuTitle}>Fitness</Text>
              <Text style={styles.addMenuMeta}>Egzersiz kaydı ekle</Text>
            </Pressable>
            <Pressable onPress={() => navigate('manual-log', { category: 'wellness' })} style={styles.addMenuRow}>
              <Text style={[styles.addMenuTitle, styles.wellnessText]}>Wellness</Text>
              <Text style={styles.addMenuMeta}>Su, kahve, uyku ve sağlık</Text>
            </Pressable>
            <Pressable onPress={() => navigate('manual-log', { category: 'wellness', activityName: 'book_reading' })} style={styles.addMenuRow}>
              <Text style={[styles.addMenuTitle, styles.learningText]}>Learning</Text>
              <Text style={styles.addMenuMeta}>Okuma ve öğrenme kaydı</Text>
            </Pressable>
          </AppCard>
        ) : null}
        <AppButton onPress={() => setShowAddMenu((value) => !value)} style={styles.primaryButton}>+ Kayıt ekle</AppButton>
      </View>
      <BottomNav active="home" navigate={navigate} hideScan />
    </AppScreen>
  );
}

function FilterRow({ items, value, onChange }) {
  return (
    <View style={styles.filters}>
      {items.map((item) => (
        <Pressable key={item.value} onPress={() => onChange(item.value)} style={[styles.filter, item.value === 'wellness' && styles.wellnessFilter, value === item.value && styles.filterActive, value === item.value && item.value === 'wellness' && styles.wellnessFilterActive]}>
          <Text style={[styles.filterText, value === item.value && styles.filterTextActive, item.value === 'wellness' && styles.wellnessText]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 190 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 10 },
  filter: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  filterActive: { borderColor: colors.primary, backgroundColor: colors.surfaceLight },
  wellnessFilter: { borderColor: 'rgba(155, 92, 255, 0.35)', backgroundColor: colors.pinkSoft },
  wellnessFilterActive: { borderColor: colors.pink },
  filterText: { color: colors.textSecondary, fontWeight: '800', fontSize: 12 },
  filterTextActive: { color: colors.textPrimary },
  advancedToggle: { minHeight: 42, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 13, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  advancedToggleText: { color: colors.textPrimary, fontWeight: '800' },
  advancedToggleMeta: { color: colors.textSecondary, fontSize: 12 },
  filterPanel: { marginBottom: 10, padding: 12, backgroundColor: colors.surfaceLight },
  row: { marginBottom: 9, flexDirection: 'row', justifyContent: 'space-between', gap: 10, padding: 13 },
  rowMain: { flex: 1, minWidth: 0 },
  rowSide: { alignItems: 'flex-end', gap: 6 },
  wellnessRow: { borderColor: colors.pink, backgroundColor: colors.pinkSoft },
  title: { color: colors.textPrimary, fontWeight: '900' },
  meta: { color: colors.textSecondary, fontSize: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 },
  metaPill: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)' },
  wellnessPill: { color: colors.pink, borderColor: 'rgba(155,92,255,0.32)', backgroundColor: 'rgba(155,92,255,0.08)' },
  value: { color: colors.primary, fontWeight: '800' },
  syncBadge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden', fontSize: 10, fontWeight: '900' },
  sync_synced: { color: colors.primary, borderColor: 'rgba(53,226,122,0.42)', backgroundColor: 'rgba(53,226,122,0.08)' },
  sync_saved: { color: colors.textSecondary, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.04)' },
  sync_pending: { color: colors.secondary, borderColor: 'rgba(55,183,255,0.42)', backgroundColor: 'rgba(55,183,255,0.08)' },
  sync_failed: { color: colors.danger, borderColor: 'rgba(239,68,68,0.44)', backgroundColor: 'rgba(239,68,68,0.08)' },
  detailCard: { marginTop: -6, marginBottom: 10, backgroundColor: colors.surfaceLight },
  detailTitle: { color: colors.textPrimary, fontWeight: '900', marginBottom: 8 },
  detailText: { color: colors.textSecondary, fontSize: 12, marginBottom: 5 },
  detailActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  smallButton: { flex: 1, paddingVertical: 9, backgroundColor: colors.surface },
  deleteButton: { flex: 1, paddingVertical: 9, backgroundColor: colors.danger, shadowColor: colors.danger },
  statusMessage: { color: colors.textSecondary, textAlign: 'center', fontWeight: '800', marginBottom: 10 },
  wellnessText: { color: colors.pink },
  learningText: { color: colors.secondary },
  footer: { paddingBottom: 56 },
  primaryButton: { marginBottom: 12 },
  addMenu: { marginBottom: 10, padding: 12, backgroundColor: colors.surfaceLight },
  addMenuRow: { minHeight: 48, borderBottomWidth: 1, borderBottomColor: colors.border, justifyContent: 'center' },
  addMenuTitle: { color: colors.textPrimary, fontWeight: '900' },
  addMenuMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
