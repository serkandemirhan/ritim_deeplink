import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from 'react-native';
import AppScreen from '../../components/AppScreen';
import AppLogo from '../../components/AppLogo';
import tokens from '../../theme/ritimTokens';
import AppButton from '../../components/AppButton';

export default function LoginScreen({ navigate }) {
  const [tab, setTab] = useState('giris');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  return (
    <AppScreen style={{ backgroundColor: tokens.colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <AppLogo size={120} />
        </View>

        <Text style={styles.title}>Hoş Geldiniz</Text>
        <Text style={styles.subtitle}>Dokun. Kaydet. Geliş.</Text>

        <View style={styles.tabs}>
          <Pressable onPress={() => setTab('giris')} style={[styles.tab, tab==='giris' && styles.tabActive]}>
            <Text style={[styles.tabText, tab==='giris' && styles.tabTextActive]}>Giriş yap</Text>
          </Pressable>
          <Pressable onPress={() => setTab('kayit')} style={[styles.tab, tab==='kayit' && styles.tabActive]}>
            <Text style={[styles.tabText, tab==='kayit' && styles.tabTextActive]}>Kayıt ol</Text>
          </Pressable>
        </View>

        <TextInput style={styles.input} placeholder="E-posta veya kullanıcı adı" placeholderTextColor={tokens.colors.textSecondary} value={identifier} onChangeText={setIdentifier} />
        <TextInput style={styles.input} placeholder="Şifre" placeholderTextColor={tokens.colors.textSecondary} secureTextEntry value={password} onChangeText={setPassword} />

        <View style={{ width: '100%', marginTop: 8 }}>
          <AppButton onPress={() => alert('Giriş akışı hazırlanıyor.')} style={{ marginBottom: 8 }}>Giriş yap</AppButton>
          <AppButton onPress={() => alert('Giriş bağlantısı gönderilecek.')} outline>E-posta ile giriş bağlantısı gönder</AppButton>
        </View>

        <Text style={styles.or}>— veya —</Text>
        <View style={{ width: '100%' }}>
          <AppButton onPress={() => alert('Apple ile giriş yakında eklenecek.')} style={{ marginBottom: 8 }} secondary>Apple ile giriş yap</AppButton>
          <AppButton onPress={() => alert('Google ile giriş yakında eklenecek.')} secondary>Google ile giriş yap</AppButton>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Güvenli · Kişisel ilerleme · Gizlilik</Text>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 20 },
  header: { marginTop: 10, marginBottom: 8 },
  title: { color: tokens.colors.textPrimary, fontSize: 28, fontWeight: '800', marginTop: 8 },
  subtitle: { color: tokens.colors.textSecondary, marginBottom: 12 },
  tabs: { flexDirection: 'row', marginVertical: 8, width: '100%', justifyContent: 'center' },
  tab: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 12, marginHorizontal: 6 },
  tabActive: { backgroundColor: tokens.colors.surfaceLight },
  tabText: { color: tokens.colors.textSecondary },
  tabTextActive: { color: tokens.colors.textPrimary, fontWeight: '700' },
  input: { width: '100%', backgroundColor: tokens.colors.surface, color: tokens.colors.textPrimary, padding: 12, borderRadius: 12, marginVertical: 6 },
  or: { color: tokens.colors.textSecondary, marginVertical: 12 },
  footer: { marginTop: 18, alignItems: 'center' },
  footerText: { color: tokens.colors.textSecondary, fontSize: 12 },
});
