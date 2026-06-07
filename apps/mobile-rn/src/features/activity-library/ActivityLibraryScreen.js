import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import AppScreen from '../../components/AppScreen';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import BottomNav from '../../components/BottomNav';
import EmptyState from '../../components/EmptyState';
import SectionHeader from '../../components/SectionHeader';
import ActivityIcon from '../../components/ActivityIcon';
import useStore from '../../store/store';
import colors from '../../theme/colors';
import { canShowDebugUi, displayDifficulty, displayTrackingMode, displayUnit, displayWorkoutCategory } from '../../lib/uiText';

const WORKOUT_CATEGORIES = ['All', 'Chest', 'Back', 'Legs', 'Shoulder', 'Arms', 'Core', 'Cardio', 'Stretching'];
const learningActivityNames = new Set(['book_reading', 'english', 'french', 'turkish_diction', 'education_video']);

const displayLibraryCategory = (activity, mode) => {
  if (mode === 'learning' || learningActivityNames.has(activity.name)) return 'Learning';
  return activity.category === 'fitness' ? 'Fitness' : 'Wellness';
};

export default function ActivityLibraryScreen({ navigate }) {
  const activeTenantId = useStore((s) => s.activeTenantId);
  const activityTypes = useStore((s) => s.activityTypes);
  const trackedActivityTypeIds = useStore((s) => s.trackedActivityTypeIds);
  const seedDefaultActivityTypes = useStore((s) => s.seedDefaultActivityTypes);
  const devToolsEnabled = useStore((s) => s.devToolsEnabled);
  const toggleTrackedActivityType = useStore((s) => s.toggleTrackedActivityType);
  const [category, setCategory] = useState('All');
  const [mode, setMode] = useState('fitness');
  const [scope, setScope] = useState('library');
  const showDebugUi = canShowDebugUi(devToolsEnabled);

  const activities = useMemo(() => {
    return activityTypes.filter((activity) => {
      if (activity.tenantId !== activeTenantId) return false;
      if (mode === 'learning') {
        if (!learningActivityNames.has(activity.name)) return false;
      } else if (mode === 'wellness') {
        if (activity.category !== 'wellness' || learningActivityNames.has(activity.name)) return false;
      } else if (activity.category !== mode) {
        return false;
      }
      if (scope === 'tracked' && !trackedActivityTypeIds.includes(activity.id)) return false;
      if (mode === 'wellness') return true;
      if (mode === 'learning') return true;
      if (category === 'All') return true;
      return activity.workoutCategory === category;
    });
  }, [activityTypes, activeTenantId, category, mode, scope, trackedActivityTypeIds]);

  const ensureLibrary = () => {
    if (activeTenantId) seedDefaultActivityTypes(activeTenantId);
  };

  return (
    <AppScreen>
      <SectionHeader title="Aktivite Kütüphanesi" />
      <Text style={styles.desc}>Kartlar, planlar ve manuel kayıtlar için hazır aktivitelerden seçim yap.</Text>

      <View style={styles.scopeRow}>
        <Pressable onPress={() => setScope('library')} style={[styles.scopeButton, scope === 'library' && styles.scopeActive]}>
          <Text style={[styles.scopeText, scope === 'library' && styles.scopeTextActive]}>Kütüphane</Text>
        </Pressable>
        <Pressable onPress={() => setScope('tracked')} style={[styles.scopeButton, scope === 'tracked' && styles.scopeActive]}>
          <Text style={[styles.scopeText, scope === 'tracked' && styles.scopeTextActive]}>{mode === 'fitness' ? 'Benim Egzersizlerim' : 'Takip Ettiklerim'}</Text>
        </Pressable>
      </View>

      <View style={styles.segments}>
        <Pressable onPress={() => setMode('fitness')} style={[styles.segment, mode === 'fitness' && styles.segmentActive]}>
          <Text style={[styles.segmentText, mode === 'fitness' && styles.segmentTextActive]}>Fitness</Text>
        </Pressable>
        <Pressable onPress={() => setMode('wellness')} style={[styles.segment, styles.wellnessSegment, mode === 'wellness' && styles.wellnessSegmentActive]}>
          <Text style={[styles.segmentText, styles.wellnessText, mode === 'wellness' && styles.segmentTextActive]}>Wellness</Text>
        </Pressable>
        <Pressable onPress={() => setMode('learning')} style={[styles.segment, styles.learningSegment, mode === 'learning' && styles.learningSegmentActive]}>
          <Text style={[styles.segmentText, styles.learningText, mode === 'learning' && styles.segmentTextActive]}>Learning</Text>
        </Pressable>
      </View>

      {mode === 'fitness' ? (
        <View style={styles.filters}>
          {WORKOUT_CATEGORIES.map((item) => (
            <Pressable key={item} onPress={() => setCategory(item)} style={[styles.filter, category === item && styles.filterActive]}>
              <Text style={[styles.filterText, category === item && styles.filterTextActive]}>{displayWorkoutCategory(item)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const tracked = trackedActivityTypeIds.includes(item.id);
          return (
          <AppCard style={[styles.item, item.category === 'wellness' && styles.wellnessItem]}>
            <View style={styles.itemTop}>
              <View style={styles.titleRow}>
                <ActivityIcon activity={item} size={38} />
                <View style={styles.titleCopy}>
                <Text style={[styles.title, item.category === 'wellness' && styles.wellnessText]}>{item.displayNameTr}</Text>
                <Text style={styles.meta}>{displayLibraryCategory(item, mode)} · Her kayıt +{item.defaultIncrement} {displayUnit(item.unit)}</Text>
                </View>
              </View>
              <View style={styles.itemSide}>
                <Text style={[styles.value, item.category === 'wellness' && styles.wellnessText]}>+{item.defaultIncrement} {displayUnit(item.unit)}</Text>
                {tracked ? <Text style={styles.trackedBadge}>Listemde</Text> : null}
              </View>
            </View>
            {showDebugUi ? (
              <>
                <View style={styles.infoGrid}>
                  <Text style={styles.info}>Kas: {displayWorkoutCategory(item.muscleGroup)}</Text>
                  <Text style={styles.info}>Zorluk: {displayDifficulty(item.difficulty)}</Text>
                  <Text style={styles.info}>Kalori: {item.caloriesPerUnit ? `${item.caloriesPerUnit}/birim` : '-'}</Text>
                  <Text style={styles.info}>Takip: {displayTrackingMode(item.trackingMode)}</Text>
                </View>
                {!!item.description && <Text style={styles.description}>{item.description}</Text>}
              </>
            ) : null}
            <Pressable onPress={() => toggleTrackedActivityType(item.id)} style={[styles.trackChip, tracked && styles.trackChipActive]}>
              <Text style={[styles.trackChipText, tracked && styles.trackChipTextActive]}>{tracked ? 'Kaldır' : 'Ekle'}</Text>
            </Pressable>
          </AppCard>
        );
        }}
        ListEmptyComponent={<EmptyState title={scope === 'tracked' ? 'Henüz seçim yok' : 'Kütüphane boş'} description={scope === 'tracked' ? 'Takip etmek istediğin aktiviteleri kütüphaneden seç.' : 'Aktivite kütüphanesi henüz hazır değil.'} />}
        contentContainerStyle={styles.list}
      />

      <View style={styles.footer}>
        {showDebugUi ? <AppButton onPress={ensureLibrary} style={styles.primaryButton}>DEV: Kütüphaneyi onar</AppButton> : null}
        <AppButton onPress={() => navigate('manual-log', { category: mode === 'fitness' ? 'fitness' : 'wellness' })} style={[styles.primaryButton, mode !== 'fitness' && styles.wellnessButton]}>
          {mode === 'fitness' ? 'Egzersiz kaydı ekle' : mode === 'learning' ? 'Learning kaydı ekle' : 'Wellness kaydı ekle'}
        </AppButton>
        <AppButton onPress={() => navigate('home')} style={styles.secondaryButton}>Bugün</AppButton>
      </View>
      <BottomNav active={mode === 'wellness' ? 'wellness' : 'fitness'} navigate={navigate} hideScan />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  desc: { color: colors.textSecondary, marginBottom: 14, lineHeight: 19 },
  segments: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  scopeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  scopeButton: { flex: 1, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  scopeActive: { borderColor: colors.primary, backgroundColor: colors.surfaceLight },
  scopeText: { color: colors.textSecondary, fontWeight: '900', fontSize: 12 },
  scopeTextActive: { color: colors.textPrimary },
  segment: { flex: 1, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
  segmentActive: { borderColor: colors.primary, backgroundColor: colors.surfaceLight },
  wellnessSegment: { backgroundColor: colors.pinkSoft, borderColor: 'rgba(155, 92, 255, 0.45)' },
  wellnessSegmentActive: { borderColor: colors.pink },
  learningSegment: { backgroundColor: 'rgba(55, 183, 255, 0.10)', borderColor: 'rgba(55, 183, 255, 0.35)' },
  learningSegmentActive: { borderColor: colors.secondary },
  segmentText: { color: colors.textSecondary, fontWeight: '900', fontSize: 12 },
  segmentTextActive: { color: colors.textPrimary },
  wellnessText: { color: colors.pink },
  learningText: { color: colors.secondary },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  filter: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  filterActive: { borderColor: colors.primary, backgroundColor: colors.surfaceLight },
  filterText: { color: colors.textSecondary, fontWeight: '800', fontSize: 12 },
  filterTextActive: { color: colors.textPrimary },
  list: { paddingBottom: 170 },
  item: { marginBottom: 10 },
  wellnessItem: { borderColor: colors.pink, backgroundColor: colors.pinkSoft },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  titleCopy: { flex: 1, minWidth: 0 },
  title: { color: colors.textPrimary, fontWeight: '900', fontSize: 16 },
  meta: { color: colors.textSecondary, marginTop: 4 },
  value: { color: colors.primary, fontWeight: '900' },
  itemSide: { alignItems: 'flex-end', gap: 6 },
  trackedBadge: { color: colors.textSecondary, fontSize: 10, fontWeight: '800' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  info: { color: colors.textSecondary, backgroundColor: colors.surfaceLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, fontSize: 12 },
  description: { color: colors.textSecondary, marginTop: 10, lineHeight: 18 },
  trackChip: { alignSelf: 'flex-start', marginTop: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.purple, backgroundColor: 'rgba(155,92,255,0.12)', paddingHorizontal: 13, paddingVertical: 7 },
  trackChipActive: { borderColor: colors.border, backgroundColor: colors.surfaceLight },
  trackChipText: { color: colors.textPrimary, fontWeight: '800', fontSize: 12 },
  trackChipTextActive: { color: colors.textSecondary },
  footer: { paddingBottom: 56 },
  primaryButton: { marginBottom: 12 },
  wellnessButton: { backgroundColor: colors.pink, shadowColor: colors.pink },
  secondaryButton: { backgroundColor: colors.surfaceLight },
});
