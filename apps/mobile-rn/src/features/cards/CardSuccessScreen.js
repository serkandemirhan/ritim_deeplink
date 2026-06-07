import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, StyleSheet, Vibration, View } from 'react-native';
import AppScreen from '../../components/AppScreen';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import ActivityIcon from '../../components/ActivityIcon';
import useStore from '../../store/store';
import colors from '../../theme/colors';
import { displayUnit, maskCardCode } from '../../lib/uiText';
import { playSoundEffectSoon } from '../../services/soundEffects';

export default function CardSuccessScreen({ route, navigate }) {
  const cardIdParam = route?.params?.cardId;
  const cardId = Array.isArray(cardIdParam) ? cardIdParam[0] : cardIdParam;
  const cards = useStore((s) => s.tenantNfcCards);
  const assignments = useStore((s) => s.cardAssignments);
  const activityTypes = useStore((s) => s.activityTypes);
  const card = cards.find((item) => item.id === cardId);
  const assignment = assignments.find((item) => item.tenantCardId === cardId);
  const activity = assignment ? activityTypes.find((item) => item.id === assignment.activityTypeId) : null;
  const isUnassigned = card?.status === 'unassigned' && !assignment;
  const accent = isUnassigned ? colors.secondary : (activity?.category === 'wellness' ? colors.pink : colors.primary);
  const checkScale = useRef(new Animated.Value(0.72)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Vibration.vibrate([0, 45, 35, 70]);
    playSoundEffectSoon(isUnassigned ? 'scanSuccess' : 'goalComplete', 80);
    Animated.parallel([
      Animated.timing(checkOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(checkScale, { toValue: 1, friction: 5, tension: 92, useNativeDriver: true }),
    ]).start();
  }, [checkOpacity, checkScale, isUnassigned]);

  const unitLabel = displayUnit(assignment?.unit || activity?.unit || '');

  return (
    <AppScreen>
      <View style={styles.hero}>
        <Animated.View style={[styles.checkCircle, { backgroundColor: accent, shadowColor: accent, opacity: checkOpacity, transform: [{ scale: checkScale }] }]}>
          <Text style={styles.check}>✓</Text>
        </Animated.View>
        <Text style={styles.title}>{isUnassigned ? 'NFC kart eklendi' : 'Kart başarıyla bağlandı'}</Text>
        <Text style={styles.subtitle}>
          {isUnassigned
            ? 'Kart hazır. Şimdi bir aktiviteye bağlayabilirsin.'
            : `Artık bu kartı okutarak ${activity?.displayNameTr || 'aktivite'} kaydı oluşturabilirsin.`}
        </Text>
      </View>

      <AppCard style={[styles.card, activity?.category === 'wellness' && styles.wellnessCard]}>
        <View style={styles.row}>
          <ActivityIcon activity={activity} size={56} style={{ borderColor: accent }} />
          <View>
            <Text style={styles.cardName}>{card?.cardName || 'Kart'}</Text>
            <Text style={styles.meta}>{isUnassigned ? 'durum' : 'bağlı aktivite'}</Text>
            <Text style={[styles.activity, { color: accent }]}>{isUnassigned ? 'Kısayol atanmamış' : activity?.displayNameTr || 'Aktivite'}</Text>
          </View>
        </View>

        <View style={styles.detailList}>
          <SummaryRow label="Kart adı" value={card?.cardName || 'Kart'} />
          <SummaryRow label="Bağlı aktivite" value={isUnassigned ? 'Henüz yok' : activity?.displayNameTr || 'Aktivite'} accent={accent} />
          <SummaryRow label="Her okutma" value={assignment ? `+${assignment.incrementValue} ${unitLabel}` : '-'} />
          <SummaryRow label="Günlük hedef" value={assignment?.dailyGoal ? `${assignment.dailyGoal} ${unitLabel}` : 'Henüz yok'} />
          <SummaryRow label="Kart kodu" value={maskCardCode(card?.tagCode || card?.uidHash) || '-'} />
          {card?.url ? <SummaryRow label="Link" value={card.url} /> : null}
        </View>
      </AppCard>

      <View style={styles.footer}>
        {isUnassigned ? <AppButton onPress={() => navigate('cards/register', { cardId })} style={styles.primaryButton}>Kısayol ata</AppButton> : null}
        <AppButton onPress={() => navigate('cards')} style={styles.primaryButton}>Kartı görüntüle</AppButton>
        <AppButton onPress={() => navigate('mock-scan')} style={styles.secondaryButton}>Başka kart tara</AppButton>
        <Pressable onPress={() => navigate('home')} style={styles.homeLink}>
          <Text style={styles.homeLinkText}>Bugüne dön</Text>
        </Pressable>
      </View>
    </AppScreen>
  );
}

function SummaryRow({ label, value, accent }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, accent && { color: accent }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: 18, paddingBottom: 14 },
  checkCircle: { width: 74, height: 74, borderRadius: 999, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.48, shadowRadius: 18 },
  check: { color: '#FFFFFF', fontWeight: '900', fontSize: 36 },
  title: { color: colors.textPrimary, fontSize: 21, fontWeight: '900', marginTop: 14, textAlign: 'center' },
  subtitle: { color: colors.textSecondary, textAlign: 'center', marginTop: 7, lineHeight: 18, marginHorizontal: 20 },
  card: { marginBottom: 14 },
  wellnessCard: { borderColor: colors.pink, backgroundColor: colors.pinkSoft },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardName: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  meta: { color: colors.textSecondary, marginTop: 2 },
  activity: { fontSize: 18, fontWeight: '900', marginTop: 2 },
  detailList: { marginTop: 14, gap: 8 },
  summaryRow: { minHeight: 34, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 8 },
  summaryLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  summaryValue: { flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: '900', textAlign: 'right' },
  footer: { marginTop: 'auto', paddingBottom: 14 },
  primaryButton: { marginBottom: 12 },
  secondaryButton: { backgroundColor: colors.surfaceLight, marginBottom: 12 },
  homeLink: { alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 10 },
  homeLinkText: { color: colors.textSecondary, fontWeight: '900' },
});
