import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import AppScreen from '../../components/AppScreen';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import { NfcSuccessAnimation, estimateXp, levelFromXp } from '../../components/NfcSuccessExperience';
import { evaluateNfcDetectedFeedback, evaluateScanFeedback, runFeedbackEffects } from '../../services/scanFeedback';
import useStore from '../../store/store';
import colors from '../../theme/colors';

export default function NfcDeepLinkScreen({ tagCode, navigate }) {
  const activeTenantId = useStore((s) => s.activeTenantId);
  const profile = useStore((s) => s.profile);
  const activityTypes = useStore((s) => s.activityTypes);
  const activityLogs = useStore((s) => s.activityLogs);
  const logActivityFromTagCode = useStore((s) => s.logActivityFromTagCode);
  const getNfcCardByTagCode = useStore((s) => s.getNfcCardByTagCode);
  const feedbackSettings = useStore((s) => s.feedbackSettings || { soundEnabled: true, hapticEnabled: true });
  const [result, setResult] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const handledRef = useRef(false);
  const redirectTimerRef = useRef(null);
  const card = useMemo(() => getNfcCardByTagCode(tagCode), [getNfcCardByTagCode, tagCode, result?.status]);
  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;

  const buildSuccessData = (log, assignment) => {
    const activity = activityTypes.find((item) => item.id === log.activityTypeId);
    const target = Number(assignment?.dailyGoal) || Number(activity?.defaultIncrement || log.value || 1) * 10;
    const logDay = new Date(log.loggedAt || log.createdAt).toDateString();
    const logsIncludingCurrent = [
      log,
      ...activityLogs.filter((item) => item.id !== log.id),
    ];
    const newTotal = logsIncludingCurrent
      .filter((item) => (
        item.tenantId === activeTenantId &&
        item.activityTypeId === log.activityTypeId &&
        new Date(item.loggedAt || item.createdAt).toDateString() === logDay
      ))
      .reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    const oldTotal = Math.max(0, newTotal - (Number(log.value) || 0));
    const oldPercent = target ? Math.round((oldTotal / target) * 100) : 0;
    const newPercent = target ? Math.round((newTotal / target) * 100) : 0;
    const previousXp = logsIncludingCurrent
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
      combo: 1,
      xp,
      previousLevel,
      level,
      didLevelUp: level.level > previousLevel.level,
      streakIncreased: false,
    };
  };

  useEffect(() => {
    if (!tagCode || !activeTenantId || handledRef.current) return undefined;
    handledRef.current = true;
    runFeedbackEffects(evaluateNfcDetectedFeedback(feedbackSettings), feedbackSettings);

    const nextResult = logActivityFromTagCode({ tenantId: activeTenantId, userId: profile?.id, tagCode });
    setResult(nextResult);

    if (nextResult?.status === 'logged' && nextResult.log) {
      const data = buildSuccessData(nextResult.log, nextResult.assignment);
      const feedback = evaluateScanFeedback({
        previousProgressPercent: data.oldPercent,
        newProgressPercent: data.newPercent,
        addedAmount: data.value,
        activityName: data.activityName,
        extraAmount: data.extra,
        isStreakContinued: false,
        hasCompletedGoalTodayBefore: data.oldPercent >= 100,
        ...feedbackSettings,
      });
      setSuccessData({ ...data, feedback });
      runFeedbackEffects(feedback, feedbackSettings);
      redirectTimerRef.current = setTimeout(() => {
        setSuccessData(null);
        navigate('home', {
          celebration: `${data.activityName} kaydedildi`,
          activityTypeId: nextResult.log.activityTypeId,
          value: String(nextResult.log.value),
          unit: nextResult.log.unit || '',
          undoLogId: nextResult.log.id,
        });
      }, 1900);
    }

    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, [activeTenantId, feedbackSettings, logActivityFromTagCode, profile?.id, tagCode]);

  const titleByStatus = {
    logged: 'NFC kaydı alındı',
    unassigned: 'Bu NFC kartta henüz kısayol yok',
    unknown: 'Bilinmeyen NFC kart',
    disabled: 'Bu NFC kart pasif',
    lost: 'Bu NFC kart silinmiş/kayıp',
  };
  const status = result?.status || 'unknown';
  const scannedTagUID = tagCode;
  const registerUnknownTag = () => {
    if (!scannedTagUID) return;
    navigate('cards/register', {
      scannedUid: scannedTagUID,
      uidHash: `deeplink-${scannedTagUID.toUpperCase()}`,
      scanSource: 'deeplink',
    });
  };

  return (
    <AppScreen>
      <View style={styles.header}>
        <Text style={styles.title}>NFC Kart</Text>
        <Text style={styles.tag}>{tagCode}</Text>
      </View>
      {status === 'logged' ? (
        <View style={styles.processingCard}>
          <Text style={styles.processingTitle}>NFC kaydı alındı</Text>
          <Text style={styles.processingMeta}>Ritmin işleniyor...</Text>
        </View>
      ) : null}
      <NfcSuccessAnimation data={successData} />
      {status !== 'logged' ? (
        <>
          <AppCard style={styles.card}>
            <Text style={styles.cardTitle}>{titleByStatus[status] || 'NFC kart işlendi'}</Text>
            {status === 'unassigned' ? (
              <>
                <Text style={styles.meta}>Bu NFC kart tanımlı ama henüz bir aktiviteye bağlı değil.</Text>
                <AppButton onPress={() => navigate('cards/register', { cardId: card?.id || result?.card?.id })} style={styles.button}>Kısayol ata</AppButton>
              </>
            ) : null}
            {status === 'unknown' ? (
              <>
                <Text style={styles.meta}>{isOffline ? 'Bu kart bu cihazda çevrimdışı kullanılabilir değil.' : 'Kart bu alanda bulunamadı. Kartı tanımlayıp aktiviteye bağlayabilirsin.'}</Text>
                {scannedTagUID ? <Text style={styles.note}>Kart kodu: {scannedTagUID}</Text> : null}
              </>
            ) : null}
          </AppCard>
          <View style={styles.actions}>
            {status === 'unknown' ? (
              <>
                <AppButton onPress={registerUnknownTag}>Bu Kartı Tanımla</AppButton>
                <AppButton onPress={() => navigate('home')} style={styles.secondaryButton}>Vazgeç / Ana Sayfa</AppButton>
              </>
            ) : (
              <>
                <AppButton onPress={() => navigate('home')}>Ana sayfa</AppButton>
                <AppButton onPress={() => navigate('cards')} style={styles.secondaryButton}>Kartlarım</AppButton>
              </>
            )}
          </View>
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 16 },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '900' },
  tag: { color: colors.textSecondary, marginTop: 6, fontWeight: '800' },
  processingCard: { borderWidth: 1, borderColor: 'rgba(64,224,208,0.28)', borderRadius: 18, backgroundColor: 'rgba(16,27,45,0.76)', padding: 18, marginBottom: 16 },
  processingTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '900', marginBottom: 6 },
  processingMeta: { color: colors.primary, fontWeight: '800' },
  card: { marginBottom: 16 },
  cardTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '900', marginBottom: 8 },
  meta: { color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  note: { color: colors.primary, fontWeight: '800', lineHeight: 20 },
  button: { marginTop: 6 },
  actions: { gap: 12 },
  secondaryButton: { backgroundColor: colors.surfaceLight },
});
