import React from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import AppScreen from '../../components/AppScreen';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import AppBadge from '../../components/AppBadge';
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
  const tenantChallenges = challenges.filter((challenge) => challenge.tenantId === activeTenantId);
  const showDebugUi = canShowDebugUi(devToolsEnabled);

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Meydan Okumalar" />
        {showDebugUi ? <AppButton onPress={() => seedChallengeFoundation(activeTenantId)} style={styles.primaryButton}>DEV: Meydan okuma verisi oluştur</AppButton> : null}
        {tenantChallenges.map((challenge) => {
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
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 72 },
  primaryButton: { marginBottom: 14 },
  card: { marginBottom: 12 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', marginTop: 10 },
  meta: { color: colors.textSecondary, marginTop: 6, lineHeight: 20 },
  joinButton: { marginTop: 12 },
  secondaryButton: { backgroundColor: colors.surfaceLight, marginTop: 6, marginBottom: 32 },
});
