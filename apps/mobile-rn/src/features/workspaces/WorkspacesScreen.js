import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Platform } from 'react-native';
import AppScreen from '../../components/AppScreen';
import useStore from '../../store/store';
import tokens from '../../theme/ritimTokens';
import { isSupabaseConfigured } from '../../lib/supabase';
import { signOut, updateRemoteProfile } from '../../services/supabaseSync';
import { displayWorkspaceName } from '../../lib/uiText';

const isWeb = Platform.OS === 'web';

const accountTypeLabels = {
  personal: 'Kişisel',
  gym: 'Spor salonu',
  wellness_studio: 'Wellness stüdyosu',
  trainer: 'Antrenör',
  company: 'Şirket',
};

const genderOptions = [
  { label: 'Kadın', value: 'female' },
  { label: 'Erkek', value: 'male' },
  { label: 'Diğer', value: 'other' },
  { label: 'Belirtmek istemiyorum', value: 'prefer_not_to_say' },
];

const activityOptions = [
  { label: 'Düşük', value: 'low' },
  { label: 'Orta', value: 'medium' },
  { label: 'Yüksek', value: 'high' },
];

const goalOptions = [
  { label: 'Form koru', value: 'maintain' },
  { label: 'Kas kazan', value: 'gain_muscle' },
  { label: 'Yağ yak', value: 'fat_loss' },
];

const profileLinks = [
  { label: 'Kartlarım', description: 'NFC kartlarını yönet', route: 'cards' },
  { label: 'Geçmiş', description: 'Kayıtlarını incele', route: 'history' },
  { label: 'Planlar', description: 'Hedef ve ritimlerini düzenle', route: 'routines' },
  { label: 'Aktivite Kütüphanesi', description: 'Takip edeceğin aktiviteleri seç', route: 'activity-library' },
  { label: 'Wellness', description: 'Su, kahve, uyku ve adım kayıtları', route: 'wellness' },
  { label: 'NFC Ayarları', description: 'Kart okuma tercihleri', route: 'nfc-settings' },
];

export default function WorkspacesScreen({ navigate }) {
  const profile = useStore((s) => s.profile);
  const authUserId = useStore((s) => s.authUserId);
  const updateProfile = useStore((s) => s.updateProfile);
  const tenants = useStore((s) => s.tenants);
  const activeTenantId = useStore((s) => s.activeTenantId);
  const activityLogs = useStore((s) => s.activityLogs);
  const setAuthUserId = useStore((s) => s.setAuthUserId);
  const [status, setStatus] = useState('');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [gender, setGender] = useState('prefer_not_to_say');
  const [activityLevel, setActivityLevel] = useState('medium');
  const [goal, setGoal] = useState('maintain');
  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId);
  const activeLogs = activityLogs.filter((log) => log.tenantId === activeTenantId);
  const accountType = accountTypeLabels[activeTenant?.type] || activeTenant?.type || '-';
  const authStatus = isSupabaseConfigured ? (authUserId ? 'Giriş yapıldı' : 'Çıkış yapıldı') : 'Yerel mod';

  useEffect(() => {
    setAge(profile?.age ? String(profile.age) : '');
    setHeightCm(profile?.heightCm ? String(profile.heightCm) : '');
    setWeightKg(profile?.weightKg ? String(profile.weightKg) : '');
    setGender(profile?.gender || 'prefer_not_to_say');
    setActivityLevel(profile?.activityLevel || 'medium');
    setGoal(profile?.goal || 'maintain');
  }, [profile]);

  const numberOrNull = (value) => {
    const parsed = Number(String(value || '').replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const saveProfile = async () => {
    if (!profile) return;
    const updates = {
      age: numberOrNull(age),
      heightCm: numberOrNull(heightCm),
      weightKg: numberOrNull(weightKg),
      gender,
      activityLevel,
      goal,
    };
    const updatedProfile = { ...profile, ...updates, updatedAt: new Date().toISOString() };
    try {
      setStatus('Profil kaydediliyor...');
      updateProfile(updates);
      if (isSupabaseConfigured && authUserId) {
        await updateRemoteProfile(updatedProfile);
        setStatus('Profil kaydedildi ve senkronize edildi.');
      } else {
        setStatus('Profil lokal olarak kaydedildi.');
      }
    } catch (error) {
      setStatus(error?.message || 'Profil kaydedilemedi.');
    }
  };

  const logout = async () => {
    try {
      setStatus('Çıkış yapılıyor...');
      await signOut();
      setAuthUserId(null);
      setStatus('');
      navigate('onboarding');
    } catch (error) {
      setStatus(error?.message || 'Çıkış yapılamadı.');
    }
  };

  return (
    <AppScreen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigate('home')}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>

        <View style={styles.identityCard}>
          <View style={styles.profileMain}>
            <Text style={styles.profileName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} maxFontSizeMultiplier={1.12}>{profile?.fullName || 'Profil yok'}</Text>
            <Text style={styles.profileEmail} numberOfLines={1} ellipsizeMode="middle" maxFontSizeMultiplier={1.08}>{profile?.email || 'E-posta yok'}</Text>
            <Text style={styles.profileMeta} numberOfLines={1} maxFontSizeMultiplier={1.08}>Hesap türü: <Text style={styles.accentText}>{accountType}</Text></Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <InfoRow icon="♙" label="Durum" value={authStatus} accent />
          <InfoRow icon="▣" label="Hesap türü" value={accountType} />
          <InfoRow icon="□" label="Çalışma alanı" value={displayWorkspaceName(activeTenant?.name)} />
          <InfoRow icon="▰" label="Yerel kayıtlar" value={String(activeLogs.length)} last />
        </View>

        <Text style={styles.sectionTitle}>Kısayollar</Text>
        <View style={styles.linksCard}>
          {profileLinks.map((item, index) => (
            <Pressable
              key={item.route}
              onPress={() => navigate(item.route)}
              style={[styles.linkRow, index === profileLinks.length - 1 && styles.linkRowLast]}
            >
              <View style={styles.linkCopy}>
                <Text style={styles.linkTitle}>{item.label}</Text>
                <Text style={styles.linkDesc}>{item.description}</Text>
              </View>
              <Text style={styles.linkArrow}>›</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.lockedNote}>Hesap türü kayıt sırasında belirlenir ve bu ekrandan değiştirilemez.</Text>

        <Text style={styles.sectionTitle}>Kişisel bilgiler</Text>
        <View style={styles.formCard}>
          <View style={styles.inputGrid}>
            <ProfileInput label="Yaş" placeholder="Yaşınızı girin..." value={age} onChangeText={setAge} keyboardType="numeric" style={styles.inputHalf} />
            <ProfileInput label="Boy (cm)" placeholder="Boyunuzu girin..." value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" style={styles.inputHalf} />
          </View>
          <ProfileInput label="Kilo (kg)" placeholder="Kilonuzu girin..." value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" />

          <Text style={styles.formLabel}>Cinsiyet</Text>
          <View style={styles.pillGrid}>
            {genderOptions.map((item) => (
              <Pill key={item.value} label={item.label} active={gender === item.value} onPress={() => setGender(item.value)} />
            ))}
          </View>

          <Text style={styles.formLabel}>Aktivite seviyesi</Text>
          <View style={styles.pillGrid}>
            {activityOptions.map((item) => (
              <Pill key={item.value} label={item.label} active={activityLevel === item.value} onPress={() => setActivityLevel(item.value)} wide />
            ))}
          </View>

          <Text style={styles.formLabel}>Hedef</Text>
          <View style={styles.pillGrid}>
            {goalOptions.map((item) => (
              <Pill key={item.value} label={item.label} active={goal === item.value} onPress={() => setGoal(item.value)} wide />
            ))}
          </View>
        </View>

        {status ? <Text style={styles.status}>{status}</Text> : null}

        <Pressable onPress={saveProfile} style={[styles.saveButton, isWeb && styles.webGradient]}>
          <Text style={styles.saveIcon}>▣</Text>
          <Text style={styles.saveText}>Profili kaydet</Text>
        </Pressable>

        <Pressable onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutIcon}>↪</Text>
          <Text style={styles.logoutText}>Çıkış yap</Text>
        </Pressable>

        <Pressable onPress={() => navigate('home')} style={styles.homeButton}>
          <Text style={styles.homeIcon}>⌂</Text>
          <Text style={styles.homeText}>Ana sayfa</Text>
        </Pressable>
      </ScrollView>
    </AppScreen>
  );
}

function InfoRow({ icon, label, value, accent, last }) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, accent && styles.infoValueAccent]}>{value}</Text>
    </View>
  );
}

function ProfileInput({ label, style, ...props }) {
  return (
    <View style={[styles.profileInputWrap, style]}>
      <Text style={styles.profileInputLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={tokens.colors.textSecondary}
        style={styles.profileInput}
        autoCorrect={false}
        maxFontSizeMultiplier={1.12}
        {...props}
      />
    </View>
  );
}

function Pill({ label, active, onPress, wide }) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, wide && styles.pillWide, active && styles.pillActive, active && isWeb && styles.webGradient]}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: tokens.colors.background },
  webGradient: { backgroundImage: tokens.gradients.primary },
  content: { paddingTop: 14, paddingBottom: 176 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 18 },
  backButton: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: tokens.colors.primaryStart, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11, 23, 40, 0.8)' },
  backIcon: { color: tokens.colors.textPrimary, fontSize: 30, fontWeight: '900', marginTop: -2 },
  headerTitle: { color: tokens.colors.textPrimary, fontSize: 32, fontWeight: '900' },
  identityCard: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: 18, padding: 22, marginBottom: 14, backgroundColor: 'rgba(7, 17, 31, 0.86)' },
  profileMain: { flex: 1, minWidth: 0 },
  profileName: { color: tokens.colors.textPrimary, fontSize: 24, fontWeight: '900', marginBottom: 8 },
  profileEmail: { color: tokens.colors.textSecondary, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  profileMeta: { color: tokens.colors.textSecondary, fontSize: 16, marginTop: 2 },
  accentText: { color: tokens.colors.primaryMid, fontWeight: '900' },
  detailsCard: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 12, marginBottom: 14, backgroundColor: 'rgba(7, 17, 31, 0.86)' },
  infoRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48, borderBottomWidth: 1, borderBottomColor: tokens.colors.border },
  infoRowLast: { borderBottomWidth: 0 },
  infoIcon: { color: tokens.colors.primaryStart, fontSize: 24, width: 36, textAlign: 'center', marginRight: 12 },
  infoLabel: { flex: 1, color: tokens.colors.textSecondary, fontSize: 17, fontWeight: '700' },
  infoValue: { color: tokens.colors.textPrimary, fontSize: 16, fontWeight: '900', textAlign: 'right', flexShrink: 1, maxWidth: '48%' },
  infoValueAccent: { color: tokens.colors.primaryStart },
  lockedNote: { color: tokens.colors.textSecondary, marginBottom: 28, lineHeight: 20, fontWeight: '700', opacity: 0.72 },
  sectionTitle: { color: tokens.colors.textPrimary, fontSize: 25, fontWeight: '900', marginBottom: 14 },
  linksCard: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 16, backgroundColor: 'rgba(7, 17, 31, 0.86)' },
  linkRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: tokens.colors.border, gap: 12 },
  linkRowLast: { borderBottomWidth: 0 },
  linkCopy: { flex: 1, minWidth: 0 },
  linkTitle: { color: tokens.colors.textPrimary, fontSize: 16, fontWeight: '900' },
  linkDesc: { color: tokens.colors.textSecondary, fontSize: 13, fontWeight: '700', marginTop: 3 },
  linkArrow: { color: tokens.colors.primaryStart, fontSize: 28, fontWeight: '900' },
  formCard: { marginBottom: 12 },
  inputGrid: { flexDirection: 'row', gap: 12 },
  inputHalf: { flex: 1 },
  profileInputWrap: { minHeight: 70, borderRadius: 14, borderWidth: 1, borderColor: tokens.colors.border, paddingHorizontal: 16, paddingTop: 12, marginBottom: 12, backgroundColor: 'rgba(7, 17, 31, 0.75)' },
  profileInputLabel: { color: tokens.colors.textSecondary, fontSize: 14, fontWeight: '800', marginBottom: 4 },
  profileInput: { color: tokens.colors.textPrimary, fontSize: 18, fontWeight: '900', outlineStyle: 'none', padding: 0 },
  formLabel: { color: tokens.colors.textPrimary, fontSize: 18, fontWeight: '900', marginTop: 8, marginBottom: 12 },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  pill: { minHeight: 48, minWidth: 112, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, borderColor: tokens.colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: 'rgba(7, 17, 31, 0.72)' },
  pillWide: { flex: 1, minWidth: 96 },
  pillActive: { borderColor: tokens.colors.primaryStart, backgroundColor: tokens.colors.primaryMid },
  pillText: { color: tokens.colors.textSecondary, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  pillTextActive: { color: '#FFFFFF' },
  status: { color: tokens.colors.textSecondary, borderColor: tokens.colors.border, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 16, fontWeight: '800', backgroundColor: 'rgba(11, 23, 40, 0.72)' },
  saveButton: { height: 64, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12, marginTop: 12, marginBottom: 14, backgroundColor: tokens.colors.primaryMid },
  saveIcon: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  saveText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  logoutButton: { height: 60, borderRadius: 18, borderWidth: 1, borderColor: tokens.colors.danger, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12, marginBottom: 14, backgroundColor: 'rgba(239, 68, 68, 0.05)' },
  logoutIcon: { color: tokens.colors.danger, fontSize: 28, fontWeight: '900' },
  logoutText: { color: tokens.colors.danger, fontSize: 18, fontWeight: '900' },
  homeButton: { minHeight: 58, borderRadius: 999, borderWidth: 1, borderColor: tokens.colors.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12, backgroundColor: 'rgba(11, 23, 40, 0.72)' },
  homeIcon: { color: tokens.colors.textPrimary, fontSize: 24, fontWeight: '900' },
  homeText: { color: tokens.colors.textPrimary, fontSize: 17, fontWeight: '900' },
});
