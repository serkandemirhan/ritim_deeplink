import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from 'react-native';
import AppScreen from '../../components/AppScreen';
import ProfileIcon from '../../components/ProfileIcon';
import tokens from '../../theme/ritimTokens';
import AppButton from '../../components/AppButton';

export default function ProfileScreen() {
  const [fullName, setFullName] = useState('Ziyaretçi Kullanıcı');
  const [email, setEmail] = useState('user@example.com');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  return (
    <AppScreen style={{ backgroundColor: tokens.colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>

        <View style={styles.profileCard}>
          <ProfileIcon size={72} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.email}>{email}</Text>
            <Text style={styles.small}>Kişisel hesap</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
          <TextInput style={styles.input} placeholder="Tam isim" placeholderTextColor={tokens.colors.textSecondary} value={fullName} onChangeText={setFullName} />
          <TextInput style={styles.input} placeholder="E-posta" placeholderTextColor={tokens.colors.textSecondary} value={email} onChangeText={setEmail} />
          <View style={styles.row}> 
            <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Yaş" placeholderTextColor={tokens.colors.textSecondary} value={age} onChangeText={setAge} keyboardType="numeric" />
            <TextInput style={[styles.input, { flex: 1, marginLeft: 8 }]} placeholder="Boy (cm)" placeholderTextColor={tokens.colors.textSecondary} value={height} onChangeText={setHeight} keyboardType="numeric" />
          </View>
          <TextInput style={styles.input} placeholder="Kilo (kg)" placeholderTextColor={tokens.colors.textSecondary} value={weight} onChangeText={setWeight} keyboardType="numeric" />
        </View>

        <View style={{ width: '100%', marginTop: 12 }}>
          <AppButton onPress={() => alert('Profil kaydedildi.')}>Profili kaydet</AppButton>
          <AppButton onPress={() => alert('Çıkış yapılıyor.')} outline style={{ marginTop: 8 }} danger>Çıkış yap</AppButton>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: tokens.colors.textPrimary, fontSize: 20, fontWeight: '800' },
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, backgroundColor: tokens.colors.surface, marginTop: 12 },
  name: { color: tokens.colors.textPrimary, fontSize: 18, fontWeight: '800' },
  email: { color: tokens.colors.textSecondary, fontSize: 13 },
  small: { color: tokens.colors.textSecondary, fontSize: 12 },
  infoCard: { padding: 14, borderRadius: 16, backgroundColor: tokens.colors.surface, marginTop: 12 },
  sectionTitle: { color: tokens.colors.textPrimary, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: tokens.colors.surfaceLight, color: tokens.colors.textPrimary, padding: 12, borderRadius: 12, marginBottom: 8 },
  row: { flexDirection: 'row' },
});
