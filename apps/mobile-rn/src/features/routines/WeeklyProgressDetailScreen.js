import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import AppScreen from '../../components/AppScreen';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import useStore from '../../store/store';
import colors from '../../theme/colors';

export default function WeeklyProgressDetailScreen({ route, navigate }) {
  const routineId = route?.params?.routineId;
  const weekIndex = Number(route?.params?.weekIndex || 1);
  const routines = useStore((s) => s.routines);
  const getFourWeekRoutineProgress = useStore((s) => s.getFourWeekRoutineProgress);
  const routine = routines.find((item) => item.id === routineId);
  const week = getFourWeekRoutineProgress(routineId).find((item) => item.index === weekIndex);

  if (!week) {
    return (
      <AppScreen>
        <Text style={styles.title}>Hafta bulunamadı</Text>
        <AppButton onPress={() => navigate('routine-progress', { routineId })}>Gelişime dön</AppButton>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{week.index}. Hafta Detayı</Text>
        <Text style={styles.subtitle}>{week.startDate} - {week.endDate}</Text>

        <AppCard style={styles.summaryCard}>
          <Text style={styles.cardTitle}>{routine?.name || 'Ritim'}</Text>
          <Text style={styles.meta}>Hedef toplam: {week.planned}</Text>
          <Text style={styles.meta}>Gerçekleşen toplam: {week.completed}</Text>
          <Text style={[styles.percent, week.successPercent > 100 && styles.fireText]}>Başarı: %{week.successPercent}</Text>
          <Text style={styles.meta}>Ekstra: +{week.extra}</Text>
          <Text style={styles.meta}>Tamamlama: {week.completedCount}/{week.logs.length}</Text>
        </AppCard>

        <Text style={styles.sectionTitle}>Performanslar</Text>
        {week.logs.length ? week.logs.map((log) => (
          <AppCard key={log.id} style={styles.logCard}>
            <Text style={styles.logTitle}>{log.date}</Text>
            <Text style={styles.meta}>Hedef: {log.plannedTotalUnits} · Gerçekleşen: {log.completedTotalUnits}</Text>
            <Text style={styles.meta}>Ekstra: +{log.extraUnits} · Başarı: %{log.successPercent}</Text>
          </AppCard>
        )) : (
          <AppCard style={styles.logCard}>
            <Text style={styles.meta}>Bu haftada kayıt yok.</Text>
          </AppCard>
        )}

        <AppButton onPress={() => navigate('routine-progress', { routineId })} style={styles.secondaryButton}>Gelişime dön</AppButton>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 156 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '900' },
  subtitle: { color: colors.textSecondary, marginTop: 6, marginBottom: 16 },
  summaryCard: { marginBottom: 16, borderColor: '#40E0D0' },
  cardTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  meta: { color: colors.textSecondary, marginTop: 7 },
  percent: { color: '#40E0D0', fontSize: 24, fontWeight: '900', marginTop: 12 },
  fireText: { color: '#FF8A2A' },
  sectionTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '900', marginBottom: 12 },
  logCard: { marginBottom: 10 },
  logTitle: { color: colors.textPrimary, fontWeight: '900' },
  secondaryButton: { marginTop: 12, backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1 },
});
