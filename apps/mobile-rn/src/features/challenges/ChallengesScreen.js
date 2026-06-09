import React from 'react';
import { Text, StyleSheet, ScrollView, View } from 'react-native';
import AppScreen from '../../components/AppScreen';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import AppBadge from '../../components/AppBadge';
import EmptyState from '../../components/EmptyState';
import SectionHeader from '../../components/SectionHeader';
import useStore from '../../store/store';
import colors from '../../theme/colors';
import { canShowDebugUi } from '../../lib/uiText';

export default function ChallengesScreen({ navigate }) {
  const activeTenantId = useStore((s) => s.activeTenantId);
  const challenges = useStore((s) => s.challenges);
  const participants = useStore((s) => s.challengeParticipants);
  const seedChallengeFoundation = useStore((s) => s.seedChallengeFoundation);
  const joinChallenge = useStore((s) => s.joinChallenge);
  const devToolsEnabled = useStore((s) => s.devToolsEnabled);
  const challengesList = challenges.filter((challenge) => challenge.tenantId === activeTenantId);
  const showDebugUi = canShowDebugUi(devToolsEnabled);
  const hasChallenges = challengesList.length > 0;

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={[styles.content, !hasChallenges && styles.emptyContent]} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Meydan Okumalar" />
        {hasChallenges ? (
          <>
            {showDebugUi ? <AppButton onPress={() => seedChallengeFoundation(activeTenantId)} style={styles.primaryButton}>DEV: Meydan okuma verisi oluştur</AppButton> : null}
            {challengesList.map((challenge) => {
              const joined = participants.find((item) => item.challengeId === challenge.id);
              return (
                <AppCard key={challenge.id} style={styles.card}>
                  <AppBadge tone="purple">{challenge.status}</AppBadge>
                  <Text style={styles.title}>{challenge.title}</Text>
                  <Text style={styles.meta}>{challenge.description}</Text>
                  <Text style={styles.meta}>Ölçüm: {challenge.metric} · Hedef: {challenge.targetValue}</Text>
                  <AppButton onPress={() => joinChallenge(challenge.id)} style={styles.joinButton}>{joined ? 'Katıldın' : 'Katıl'}</AppButton>
                </AppCard>
              );
            })}
            <AppButton onPress={() => navigate('home')} style={styles.secondaryButton}>Bugün</AppButton>
          </>
        ) : (
          <View style={styles.emptyWrap}>
            <EmptyState
              title="Aktif meydan okuma yok"
              description="Şu an aktif bir meydan okuma bulunmuyor. Yeni rutinler oluşturarak sınırlarını zorla!"
              style={styles.emptyState}
            >
              {showDebugUi ? <AppButton onPress={() => seedChallengeFoundation(activeTenantId)} style={styles.primaryButton}>DEV: Meydan okuma verisi oluştur</AppButton> : null}
            </EmptyState>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 72 },
  emptyContent: { flexGrow: 1 },
  emptyWrap: { flex: 1, justifyContent: 'center', paddingVertical: 72 },
  emptyState: { backgroundColor: 'rgba(16, 27, 45, 0.62)' },
  primaryButton: { marginBottom: 14 },
  card: { marginBottom: 12 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', marginTop: 10 },
  meta: { color: colors.textSecondary, marginTop: 6, lineHeight: 20 },
  joinButton: { marginTop: 12 },
  secondaryButton: { backgroundColor: colors.surfaceLight, marginTop: 6, marginBottom: 32 },
});
