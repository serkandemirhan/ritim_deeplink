import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import AppScreen from '../../components/AppScreen';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import AppCard from '../../components/AppCard';
import ActivityIcon from '../../components/ActivityIcon';
import useStore from '../../store/store';
import colors from '../../theme/colors';
import { uidHashFromRealUid, writeNfcDeepLink } from '../nfc/nfcAdapter';
import { buildRitimTagUrl } from '../../lib/deepLinkConstants';
import { displayUnit, displayWorkspaceName, maskCardCode } from '../../lib/uiText';
import tr from '../../i18n/tr';

const getDefaultDailyGoal = (activity) => {
  if (!activity) return 10;
  if (activity.name === 'water') return 2500;
  if (activity.name === 'coffee') return 3;
  if (activity.name === 'sleep') return 8;
  if (activity.name === 'steps') return 8000;
  if (activity.unit === 'min') return activity.defaultIncrement * 3;
  return activity.defaultIncrement * 10;
};

const learningActivityNames = new Set([
  'book_reading',
  'english',
  'french',
  'turkish_diction',
  'education_video',
]);

const getUiCategory = (activity) => {
  if (!activity) return 'fitness';
  if (learningActivityNames.has(activity.name)) return 'learning';
  return activity.category;
};

export default function RegisterCardScreen({ route, navigate }) {
  const params = route?.params || {};
  const mockUid = Array.isArray(params.mockUid) ? params.mockUid[0] : params.mockUid;
  const scannedUid = Array.isArray(params.scannedUid) ? params.scannedUid[0] : params.scannedUid;
  const scanSource = Array.isArray(params.scanSource) ? params.scanSource[0] : params.scanSource;
  const paramUidHash = Array.isArray(params.uidHash) ? params.uidHash[0] : params.uidHash;
  const cardId = Array.isArray(params.cardId) ? params.cardId[0] : params.cardId;
  const presetActivityTypeIdParam = Array.isArray(params.activityTypeId) ? params.activityTypeId[0] : params.activityTypeId;
  const [generatedTagCode] = useState(() => `NFC_${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
  const uidHash = paramUidHash || (scanSource === 'nfc'
    ? uidHashFromRealUid(scannedUid)
    : mockUid
      ? `mock-hash-${mockUid}`
      : `deeplink-${generatedTagCode.toUpperCase()}`);
  const activeTenantId = useStore((s) => s.activeTenantId);
  const tenants = useStore((s) => s.tenants);
  const createMockNfcTag = useStore((s) => s.createMockNfcTag);
  const createNfcTagFromScan = useStore((s) => s.createNfcTagFromScan);
  const createTenantNfcCard = useStore((s) => s.createTenantNfcCard);
  const createCardAssignment = useStore((s) => s.createCardAssignment);
  const updateTenantNfcCard = useStore((s) => s.updateTenantNfcCard);
  const updateCardAssignment = useStore((s) => s.updateCardAssignment);
  const setCardStatus = useStore((s) => s.setCardStatus);
  const seedDefaultActivityTypes = useStore((s) => s.seedDefaultActivityTypes);
  const tenantNfcCards = useStore((s) => s.tenantNfcCards);
  const cardAssignments = useStore((s) => s.cardAssignments);
  const activityTypesAll = useStore((s) => s.activityTypes);
  const trackedActivityTypeIds = useStore((s) => s.trackedActivityTypeIds);
  // derive tenant-specific activity types before using them for initial state
  const activityTypes = (activityTypesAll || []).filter((a) => a.tenantId === activeTenantId);
  const existingCard = cardId ? tenantNfcCards.find((card) => card.id === cardId) : null;
  const existingAssignment = existingCard ? cardAssignments.find((assignment) => assignment.tenantCardId === existingCard.id) : null;
  const existingActivity = existingAssignment ? activityTypes.find((activity) => activity.id === existingAssignment.activityTypeId) : null;
  const presetActivity = presetActivityTypeIdParam ? activityTypes.find((activity) => activity.id === presetActivityTypeIdParam) : null;
  const isEditMode = Boolean(existingCard);
  const [cardName, setCardName] = useState(existingCard?.cardName || '');
  const [category, setCategory] = useState(getUiCategory(presetActivity));
  const [scope, setScope] = useState('tracked');
  const [selectedActivityId, setSelectedActivityId] = useState(existingAssignment?.activityTypeId || presetActivity?.id || (activityTypes.length ? activityTypes[0].id : null));
  const [increment, setIncrement] = useState(existingAssignment?.incrementValue || presetActivity?.defaultIncrement || 10);
  const [dailyGoal, setDailyGoal] = useState(existingAssignment?.dailyGoal ? String(existingAssignment.dailyGoal) : '');
  const [includeDailyGoal, setIncludeDailyGoal] = useState(existingAssignment ? existingAssignment.dailyGoal !== null && existingAssignment.dailyGoal !== undefined : true);
  const [writeStatus, setWriteStatus] = useState('idle');
  const [writeMessage, setWriteMessage] = useState(null);
  const activeTenant = tenants.find((t) => t.id === activeTenantId);
  const filtered = useMemo(() => {
    const byCategory = activityTypes.filter((a) => {
      if (category === 'learning') return learningActivityNames.has(a.name);
      if (category === 'wellness') return a.category === 'wellness' && !learningActivityNames.has(a.name);
      return a.category === category;
    });
    const tracked = byCategory.filter((a) => trackedActivityTypeIds.includes(a.id));
    return scope === 'tracked' && tracked.length ? tracked : byCategory;
  }, [activityTypes, category, scope, trackedActivityTypeIds]);
  const selectedActivity = activityTypes.find((a) => a.id === selectedActivityId);
  const suggestedCardName = selectedActivity ? `${selectedActivity.displayNameTr} Kartı` : 'Kart adı';
  const hasActivityChanged = isEditMode && existingAssignment?.activityTypeId && existingAssignment.activityTypeId !== selectedActivityId;
  const adjustNumber = (setter, current, delta, min = 1) => {
    setter(String(Math.max(min, (Number(current) || min) + delta)));
  };

  useEffect(() => {
    if (activeTenantId) seedDefaultActivityTypes(activeTenantId);
  }, [activeTenantId, seedDefaultActivityTypes]);

  useEffect(() => {
    if (isEditMode || !presetActivity) return;
    setCategory(getUiCategory(presetActivity));
    setSelectedActivityId(presetActivity.id);
    setIncrement(presetActivity.defaultIncrement);
    setDailyGoal(String(getDefaultDailyGoal(presetActivity)));
    setIncludeDailyGoal(true);
  }, [isEditMode, presetActivity?.id]);

  useEffect(() => {
    if (isEditMode) return;
    const first = filtered[0];
    if (!first) return;
    if (!selectedActivityId || !filtered.find((a) => a.id === selectedActivityId)) {
      setSelectedActivityId(first.id);
      setIncrement(first.defaultIncrement);
      setDailyGoal(String(getDefaultDailyGoal(first)));
    }
  }, [filtered, selectedActivityId, isEditMode]);

  useEffect(() => {
    if (isEditMode || !selectedActivity || dailyGoal) return;
    setDailyGoal(String(getDefaultDailyGoal(selectedActivity)));
  }, [dailyGoal, isEditMode, selectedActivity?.id]);

  useEffect(() => {
    if (!existingCard) return;
    setCardName(existingCard.cardName);
    setCategory(getUiCategory(existingActivity) || (existingCard.category === 'wellness' ? 'wellness' : 'fitness'));
    setSelectedActivityId(existingAssignment?.activityTypeId || null);
    setIncrement(existingAssignment?.incrementValue || existingActivity?.defaultIncrement || 1);
    setDailyGoal(existingAssignment?.dailyGoal ? String(existingAssignment.dailyGoal) : String(getDefaultDailyGoal(existingActivity)));
    setIncludeDailyGoal(existingAssignment?.dailyGoal !== null && existingAssignment?.dailyGoal !== undefined);
  }, [existingCard?.id, existingAssignment?.id, existingActivity?.id]);

  const save = async () => {
    if (!selectedActivity) {
      alert('Lütfen aktivite seçin');
      return;
    }
    const savedCardName = cardName.trim() || suggestedCardName;
    const savedDailyGoal = includeDailyGoal ? (Number(dailyGoal) || getDefaultDailyGoal(selectedActivity)) : null;
    if (isEditMode) {
      updateTenantNfcCard(existingCard.id, { cardName: savedCardName, category: selectedActivity.category });
      if (existingAssignment) {
        updateCardAssignment(existingAssignment.id, {
          activityTypeId: selectedActivityId,
          incrementValue: Number(increment) || selectedActivity.defaultIncrement,
          unit: selectedActivity.unit,
          dailyGoal: savedDailyGoal,
        });
      } else {
        const assignment = createCardAssignment({
          tenantId: activeTenantId,
          tenantCardId: existingCard.id,
          activityTypeId: selectedActivityId,
          incrementValue: Number(increment) || selectedActivity.defaultIncrement,
          unit: selectedActivity.unit,
          dailyGoal: savedDailyGoal,
        });
        updateTenantNfcCard(existingCard.id, { status: 'assigned', shortcutId: assignment.id, category: selectedActivity.category });
      }
      if (existingAssignment) {
        updateTenantNfcCard(existingCard.id, { status: 'assigned', shortcutId: existingAssignment.id, category: selectedActivity.category });
      }
      navigate('cards/success', { cardId: existingCard.id });
      return;
    }

    const tagUrl = buildRitimTagUrl(generatedTagCode);
    setWriteStatus('writing');
    setWriteMessage('Kartı bağlamak için NFC karta Ritim linki yazılıyor. Telefonu karta yaklaştır.');
    const writeResult = await writeNfcDeepLink(generatedTagCode);
    if (!writeResult.success) {
      setWriteStatus('error');
      setWriteMessage(writeResult.error || 'NFC karta deeplink yazılamadı. Kart bağlanmadı.');
      return;
    }

    const tag = scanSource === 'nfc'
      ? createNfcTagFromScan({ uid: scannedUid || uidHash.replace('nfc-hash-', ''), uidHash, source: 'nfc' })
      : mockUid
        ? createMockNfcTag(mockUid)
        : { id: null };
    const card = createTenantNfcCard({ tenantId: activeTenantId, tagId: tag.id, uidHash, cardName: savedCardName, category: selectedActivity.category });
    const assignment = createCardAssignment({
      tenantId: activeTenantId,
      tenantCardId: card.id,
      activityTypeId: selectedActivityId,
      incrementValue: Number(increment) || selectedActivity.defaultIncrement,
      unit: selectedActivity.unit,
      dailyGoal: savedDailyGoal,
    });
    updateTenantNfcCard(card.id, { status: 'assigned', shortcutId: assignment.id, category: selectedActivity.category, tagCode: generatedTagCode, url: tagUrl });
    setWriteStatus('success');
    setWriteMessage('Kart bağlandı ve deeplink yazıldı.');
    navigate('cards/success', { cardId: card.id });
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigate('cards')}><Text style={styles.back}>‹</Text></Pressable>
          <Text style={styles.title}>{isEditMode ? 'Kartı Düzenle' : 'Yeni Kart Algılandı'}</Text>
          <Text style={styles.spacer}>i</Text>
        </View>

        <View style={styles.successPulse}>
          <View style={styles.successCore}><Text style={styles.check}>✓</Text></View>
        </View>
        <Text style={styles.detected}>{isEditMode ? 'Kart bağlantısını güncelle' : 'Yeni kart algılandı'}</Text>

        <AppCard style={styles.idCard}>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.idLabel}>Kart kodu</Text>
              <Text style={styles.idValue}>{maskCardCode(existingCard?.uidHash || mockUid || scannedUid || uidHash)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.idLabel}>Kart tipi</Text>
              <Text style={styles.idValue}>Kişisel alan</Text>
            </View>
          </View>
          {isEditMode ? (
            <View style={styles.currentLinkBox}>
              <Text style={styles.idMeta}>Mevcut bağlantı</Text>
              <Text style={styles.currentLinkText}>{existingActivity?.displayNameTr || 'Aktivite yok'} · +{existingAssignment?.incrementValue || 0} {displayUnit(existingAssignment?.unit || existingActivity?.unit || '')}</Text>
            </View>
          ) : (
            <Text style={styles.idMeta}>{activeTenant ? displayWorkspaceName(activeTenant.name) : ''}</Text>
          )}
        </AppCard>

        <Text style={styles.sectionLabel}>Kart adı</Text>
        <AppTextInput value={cardName} onChangeText={setCardName} placeholder="Kart adı" />
        {!cardName.trim() ? <Text style={styles.helperText}>Öneri: {suggestedCardName}</Text> : null}

        <Text style={styles.sectionLabel}>Kategori seçimi</Text>
        <View style={styles.categoryGrid}>
          <Pressable onPress={()=>setCategory('fitness')} style={[styles.cat, category==='fitness'&&styles.catActive]}>
            <Text style={styles.catIcon}>↯</Text>
            <Text style={styles.catText}>Fitness</Text>
          </Pressable>
          <Pressable onPress={()=>setCategory('wellness')} style={[styles.cat, styles.wellnessCat, category==='wellness'&&styles.wellnessCatActive]}>
            <Text style={[styles.catIcon, styles.wellnessText]}>◆</Text>
            <Text style={styles.catText}>Wellness</Text>
          </Pressable>
          <Pressable onPress={()=>setCategory('learning')} style={[styles.cat, styles.learningCat, category==='learning'&&styles.learningCatActive]}>
            <Text style={[styles.catIcon, styles.learningText]}>▤</Text>
            <Text style={styles.catText}>Learning</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Aktivite seçimi</Text>
        {selectedActivity ? (
          <View style={styles.selectedHeader}>
            <Text style={[styles.selectedHeaderTitle, selectedActivity.category === 'wellness' && styles.wellnessText]}>{selectedActivity.displayNameTr}</Text>
            <Text style={styles.selectedHeaderMeta}>Her okutma +{increment || selectedActivity.defaultIncrement} {displayUnit(selectedActivity.unit)} kaydeder</Text>
          </View>
        ) : null}
        <View style={styles.scopeRow}>
          <Pressable onPress={() => setScope('tracked')} style={[styles.scopeButton, scope === 'tracked' && styles.scopeActive]}>
            <Text style={[styles.scopeText, scope === 'tracked' && styles.scopeTextActive]}>Benim Listem</Text>
          </Pressable>
          <Pressable onPress={() => setScope('library')} style={[styles.scopeButton, scope === 'library' && styles.scopeActive]}>
            <Text style={[styles.scopeText, scope === 'library' && styles.scopeTextActive]}>Tüm Kütüphane</Text>
          </Pressable>
        </View>
        <Text style={styles.helperText}>
          {scope === 'tracked' ? tr.activityLibrary.trackedFirst : 'Kartı bağlamak için kütüphaneden aktivite seç.'}
        </Text>

        <View style={styles.activityGrid}>
          {filtered.map((item) => (
            <Pressable key={item.id} onPress={() => { setSelectedActivityId(item.id); setIncrement(item.defaultIncrement); setDailyGoal(String(getDefaultDailyGoal(item))); }} style={[styles.item, item.category === 'wellness' && styles.wellnessItem, selectedActivityId===item.id && styles.itemActive, selectedActivityId===item.id && item.category === 'wellness' && styles.wellnessItemActive]}>
              <ActivityIcon activity={item} size={34} style={styles.activityIcon} />
              <Text style={[styles.itemTitle, item.category === 'wellness' && styles.wellnessText]}>{item.displayNameTr}</Text>
              <Text style={styles.meta}>{item.displayNameEn}</Text>
              <Text style={styles.meta}>+{item.defaultIncrement} {displayUnit(item.unit)}</Text>
            </Pressable>
          ))}
        </View>

        <AppCard style={styles.configCard}>
          <Text style={styles.sectionLabel}>Her okutma miktarı</Text>
          {selectedActivity ? (
            <View style={styles.scanSummary}>
              <Text style={styles.scanSummaryLabel}>Aktivite</Text>
              <Text style={[styles.scanSummaryValue, selectedActivity.category === 'wellness' && styles.wellnessText]}>{selectedActivity.displayNameTr}</Text>
            </View>
          ) : null}
          <View style={styles.amountRow}>
            <Pressable onPress={() => setIncrement(Math.max(1, (Number(increment) || 1) - (selectedActivity?.defaultIncrement || 1)))}><Text style={styles.minus}>−</Text></Pressable>
            <AppTextInput value={String(increment)} onChangeText={(t)=>setIncrement(Number(t)||0)} placeholder="Okutma miktarı" keyboardType="numeric" style={styles.amountInput} />
            <Text style={styles.unit}>{selectedActivity ? displayUnit(selectedActivity.unit) : '-'}</Text>
            <Pressable onPress={() => setIncrement((Number(increment) || 0) + (selectedActivity?.defaultIncrement || 1))}><Text style={styles.plus}>+</Text></Pressable>
          </View>
          <Text style={styles.amountHelp}>Her okutma bu miktarda kayıt oluşturur.</Text>
          {selectedActivity ? (
            <Text style={styles.amountResult}>
              Bu kart okutulunca hesabına +{Number(increment) || selectedActivity.defaultIncrement} {displayUnit(selectedActivity.unit)} {selectedActivity.displayNameTr.toLowerCase()} kaydedilir.
            </Text>
          ) : null}
          {hasActivityChanged ? (
            <Text style={styles.warningText}>Bu değişiklikten sonraki okutmalar yeni aktiviteye kaydedilir. Eski kayıtlar değişmez.</Text>
          ) : null}
          {!isEditMode ? (
            <Text style={[styles.amountResult, writeStatus === 'error' && styles.errorText]}>
              {writeMessage || `Kart bağlanırken NFC karta ${generatedTagCode} deeplink'i yazılacak.`}
            </Text>
          ) : null}
          <View style={styles.configRow}>
            <View>
              <Text style={styles.configRowTitle}>Günlük hedefe dahil et</Text>
              <Text style={styles.configRowMeta}>Açıksa bu kart günlük hedef ilerlemesini günceller.</Text>
            </View>
            <Pressable onPress={() => setIncludeDailyGoal((value) => !value)} style={[styles.toggle, includeDailyGoal && styles.toggleActive]}>
              <Text style={[styles.toggleText, includeDailyGoal && styles.toggleTextActive]}>{includeDailyGoal ? 'Açık' : 'Kapalı'}</Text>
            </Pressable>
          </View>
          {includeDailyGoal ? (
            <>
              <Text style={styles.goalLabel}>Günlük hedef</Text>
              <View style={styles.amountRow}>
                <Pressable onPress={() => adjustNumber(setDailyGoal, dailyGoal, -(selectedActivity?.defaultIncrement || 1))}><Text style={styles.minus}>−</Text></Pressable>
                <AppTextInput value={dailyGoal} onChangeText={setDailyGoal} placeholder="Günlük hedef" keyboardType="numeric" style={styles.amountInput} />
                <Text style={styles.unit}>{selectedActivity ? displayUnit(selectedActivity.unit) : '-'}</Text>
                <Pressable onPress={() => adjustNumber(setDailyGoal, dailyGoal, selectedActivity?.defaultIncrement || 1)}><Text style={styles.plus}>+</Text></Pressable>
              </View>
            </>
          ) : null}
          <View style={styles.frequencyBox}>
            <Text style={styles.configRowTitle}>Sıklık</Text>
            <Text style={styles.frequencyValue}>Her okutma</Text>
          </View>
        </AppCard>

      </ScrollView>
      <View style={styles.stickyFooter}>
        <AppButton onPress={save} disabled={writeStatus === 'writing'} style={styles.stickyPrimary}>{isEditMode ? 'Değişiklikleri kaydet' : writeStatus === 'writing' ? 'Karta yazılıyor...' : 'Karta yaz ve bağla'}</AppButton>
        {isEditMode ? (
          <AppButton
            onPress={() => { setCardStatus(existingCard.id, 'disabled'); navigate('cards'); }}
            style={styles.dangerSecondaryButton}
            textStyle={styles.dangerSecondaryText}
          >
            Kartı pasifleştir
          </AppButton>
        ) : (
          <AppButton onPress={() => navigate('mock-scan')} style={styles.secondaryButton}>Taramaya dön</AppButton>
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 230 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  back: { color: colors.textPrimary, fontSize: 26, fontWeight: '300' },
  title: { color: colors.textPrimary, fontWeight: '900', fontSize: 16 },
  spacer: { color: 'transparent' },
  successPulse: { alignItems: 'center', marginVertical: 8 },
  successCore: { width: 68, height: 68, borderRadius: 999, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 16 },
  check: { color: '#FFFFFF', fontSize: 34, fontWeight: '900' },
  detected: { color: colors.textPrimary, textAlign: 'center', fontWeight: '800', marginBottom: 10 },
  idCard: { marginBottom: 12, paddingVertical: 12 },
  infoGrid: { flexDirection: 'row', gap: 10 },
  infoItem: { flex: 1, minWidth: 0 },
  idLabel: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  idValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '900', marginTop: 3 },
  idMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  currentLinkBox: { marginTop: 10, borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 10 },
  currentLinkText: { color: colors.textPrimary, fontWeight: '800', marginTop: 4 },
  sectionLabel: { color: colors.textPrimary, fontWeight: '900', marginBottom: 8 },
  categoryGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  scopeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  scopeButton: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
  scopeActive: { borderColor: colors.primary, backgroundColor: colors.surfaceLight },
  scopeText: { color: colors.textSecondary, fontWeight: '900', fontSize: 12 },
  scopeTextActive: { color: colors.textPrimary },
  helperText: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginBottom: 10 },
  errorText: { color: colors.danger, fontWeight: '800' },
  cat: { flex: 1, minHeight: 72, padding: 10, borderRadius: 10, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  catActive: { borderColor: colors.borderBright, borderWidth: 2 },
  wellnessCat: { backgroundColor: colors.pinkSoft },
  wellnessCatActive: { borderColor: colors.pink, borderWidth: 2 },
  learningCat: { backgroundColor: 'rgba(55, 183, 255, 0.10)' },
  learningCatActive: { borderColor: colors.secondary, borderWidth: 2 },
  catIcon: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  catText: { color: colors.textPrimary, marginTop: 4, fontWeight: '800', fontSize: 12 },
  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  item: { width: '48%', minHeight: 92, padding: 9, borderRadius: 10, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, alignItems: 'center' },
  wellnessItem: { backgroundColor: colors.pinkSoft, borderColor: 'rgba(155, 92, 255, 0.35)' },
  itemActive: { borderColor: colors.borderBright, borderWidth: 2 },
  wellnessItemActive: { borderColor: colors.pink },
  activityIcon: { marginBottom: 6 },
  itemTitle: { color: colors.textPrimary, fontWeight: '900', fontSize: 12 },
  wellnessText: { color: colors.pink },
  learningText: { color: colors.secondary },
  meta: { color: colors.textSecondary, fontSize: 10, marginTop: 4, textAlign: 'center' },
  selectedHeader: { marginBottom: 10, paddingVertical: 8, borderBottomColor: colors.border, borderBottomWidth: 1 },
  selectedHeaderTitle: { color: colors.primary, fontWeight: '900', fontSize: 16 },
  selectedHeaderMeta: { color: colors.textSecondary, marginTop: 3, fontSize: 12 },
  configCard: { marginBottom: 12 },
  scanSummary: { borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, marginBottom: 10 },
  scanSummaryLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  scanSummaryValue: { color: colors.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 4 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amountInput: { flex: 1, marginBottom: 0, textAlign: 'center', fontSize: 18, fontWeight: '900' },
  minus: { color: colors.textSecondary, backgroundColor: colors.surfaceLight, width: 34, height: 34, borderRadius: 8, textAlign: 'center', lineHeight: 32, fontSize: 20 },
  plus: { color: colors.textPrimary, backgroundColor: colors.surfaceLight, width: 34, height: 34, borderRadius: 8, textAlign: 'center', lineHeight: 32, fontSize: 20 },
  unit: { color: colors.textPrimary, fontWeight: '800', minWidth: 34 },
  amountHelp: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 8 },
  amountResult: { color: colors.secondary, fontSize: 12, lineHeight: 17, marginTop: 5, fontWeight: '700' },
  warningText: { color: colors.orange, fontSize: 12, lineHeight: 17, marginTop: 8, fontWeight: '800', borderWidth: 1, borderColor: 'rgba(255,138,42,0.36)', backgroundColor: 'rgba(255,138,42,0.10)', borderRadius: 12, padding: 10 },
  goalLabel: { color: colors.textSecondary, fontWeight: '800', marginTop: 12, marginBottom: 8 },
  configRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  configRowTitle: { color: colors.textPrimary, fontWeight: '900' },
  configRowMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 3, lineHeight: 15, maxWidth: 210 },
  toggle: { minWidth: 74, minHeight: 34, borderRadius: 999, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  toggleActive: { borderColor: colors.primary, backgroundColor: 'rgba(53, 226, 122, 0.14)' },
  toggleText: { color: colors.textSecondary, fontWeight: '900', fontSize: 12 },
  toggleTextActive: { color: colors.primary },
  frequencyBox: { marginTop: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  frequencyValue: { color: colors.secondary, fontWeight: '900' },
  footer: { marginTop: 0, paddingBottom: 42 },
  stickyFooter: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 24, backgroundColor: 'rgba(7,17,31,0.96)', borderTopWidth: 1, borderTopColor: colors.border },
  stickyPrimary: { minHeight: 52 },
  secondaryButton: { marginTop: 10, backgroundColor: colors.surfaceLight, shadowOpacity: 0 },
  dangerSecondaryButton: { marginTop: 10, backgroundColor: 'rgba(255,82,82,0.10)', borderWidth: 1, borderColor: colors.danger, shadowOpacity: 0 },
  dangerSecondaryText: { color: colors.danger },
});
