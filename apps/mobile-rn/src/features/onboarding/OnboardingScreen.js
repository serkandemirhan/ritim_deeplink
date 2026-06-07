import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Platform } from 'react-native';
import AppScreen from '../../components/AppScreen';
import AppLogo from '../../components/AppLogo';
import useStore from '../../store/store';
import tokens from '../../theme/ritimTokens';
import { isSupabaseConfigured } from '../../lib/supabase';
import { signUpOrSignIn, signInWithGoogle, pushBootstrapData, pullRemoteData, resendSignupConfirmation } from '../../services/supabaseSync';
import tr from '../../i18n/tr';

const isWeb = Platform.OS === 'web';

export default function OnboardingScreen({ navigate }) {
  const createProfile = useStore((s) => s.createProfile);
  const createTenant = useStore((s) => s.createTenant);
  const seedDefaultActivityTypes = useStore((s) => s.seedDefaultActivityTypes);
  const seedDemoCardsForTenant = useStore((s) => s.seedDemoCardsForTenant);
  const seedChallengeFoundation = useStore((s) => s.seedChallengeFoundation);
  const setActiveTenant = useStore((s) => s.setActiveTenant);
  const hydrateRemoteData = useStore((s) => s.hydrateRemoteData);
  const setAuthUserId = useStore((s) => s.setAuthUserId);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState('signIn');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [status, setStatus] = useState('');
  const showNameInput = authMode === 'signUp' || !isSupabaseConfigured;
  const isSignUp = authMode === 'signUp';

  const switchAuthMode = (nextMode) => {
    setAuthMode(nextMode);
    setNeedsConfirmation(false);
    setIsSubmitting(false);
    setStatus('');
  };

  const submit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setNeedsConfirmation(false);
    setStatus(isSupabaseConfigured ? 'Hesap hazırlanıyor...' : 'Yerel hesap hazırlanıyor...');
    try {
      let user = null;
      if (isSupabaseConfigured) {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail || !password) {
          setStatus('E-posta ve şifre gerekli.');
          setIsSubmitting(false);
          return;
        }
        const auth = await signUpOrSignIn({ mode: authMode, email: normalizedEmail, password, fullName: fullName || 'Kullanıcı' });
        user = auth.user;
        if (auth.needsEmailConfirmation) {
          setNeedsConfirmation(true);
          setAuthMode('signIn');
          setStatus('E-posta onayı gerekli. Gelen bağlantıya tıkla, sonra Giriş yap ile devam et.');
          return;
        }
        setAuthUserId(user.id);
        if (authMode === 'signIn') {
          const remoteData = await pullRemoteData();
          if (remoteData.profile && remoteData.tenants?.length) {
            hydrateRemoteData(remoteData);
            navigate('home');
            return;
          }
        }
      }

      const normalizedEmail = email || user?.email || undefined;
      const displayName = (fullName || user?.user_metadata?.full_name || normalizedEmail?.split('@')[0] || 'Kullanıcı').trim();
      const profile = createProfile(displayName, normalizedEmail, {
        id: user?.id,
        age: null,
        heightCm: null,
        weightKg: null,
        gender: 'prefer_not_to_say',
        activityLevel: 'medium',
      });
      const tenant = createTenant(displayName, 'personal');
      setActiveTenant(tenant.id);
      const activityTypes = seedDefaultActivityTypes(tenant.id);
      if (!isSupabaseConfigured) seedDemoCardsForTenant(tenant.id);
      seedChallengeFoundation(tenant.id);

      if (isSupabaseConfigured) {
        setStatus('Hesap senkronize ediliyor...');
        await pushBootstrapData({ profile, tenant, activityTypes });
      }
      navigate('home');
    } catch (error) {
      if (error?.needsEmailConfirmation) setNeedsConfirmation(true);
      setStatus(error?.message || 'Kayıt sırasında hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendConfirmation = async () => {
    if (!email || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await resendSignupConfirmation(email);
      setStatus('Onay e-postası tekrar gönderildi. Gelen kutusu ve spam klasörünü kontrol et.');
    } catch (error) {
      setStatus(error?.message || 'Onay e-postası gönderilemedi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startGoogleSignIn = async () => {
    if (!isSupabaseConfigured) {
      setStatus('Google girişi için Supabase env gerekli.');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    setStatus('Google girişi başlatılıyor...');
    try {
      await signInWithGoogle();
      setStatus('Google oturumu için açılan tarayıcı akışını tamamla.');
      if (isWeb) setIsSubmitting(false);
    } catch (error) {
      setStatus(error?.message || 'Google girişi başlatılamadı.');
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <AppLogo width={166} height={52} />
          <Pressable style={styles.languagePill}>
            <Text style={styles.languageIcon}>◎</Text>
            <Text style={styles.languageText}>TR</Text>
            <Text style={styles.languageChevron}>⌄</Text>
          </Pressable>
        </View>

        <Text style={styles.title} maxFontSizeMultiplier={1.12}>{tr.auth.welcome}</Text>
        <View style={styles.promiseRow}>
          <Text style={styles.promisePrimary}>{tr.auth.promise[0]}</Text>
          <Text style={styles.promiseSecondary}>{tr.auth.promise[1]}</Text>
          <Text style={styles.promisePurple}>{tr.auth.promise[2]}</Text>
        </View>
        <Text style={styles.desc}>{tr.auth.intro}</Text>

        {isSupabaseConfigured ? (
          <View style={styles.segment}>
            <Pressable onPress={() => switchAuthMode('signIn')} style={[styles.segmentItem, authMode === 'signIn' && styles.segmentActive, authMode === 'signIn' && isWeb && styles.webGradient]}>
              <Text style={[styles.segmentText, authMode === 'signIn' && styles.segmentTextActive]} maxFontSizeMultiplier={1.12}>{tr.auth.signIn}</Text>
            </Pressable>
            <Pressable onPress={() => switchAuthMode('signUp')} style={[styles.segmentItem, authMode === 'signUp' && styles.segmentActive, authMode === 'signUp' && isWeb && styles.webGradient]}>
              <Text style={[styles.segmentText, authMode === 'signUp' && styles.segmentTextActive]} maxFontSizeMultiplier={1.12}>{tr.auth.signUp}</Text>
            </Pressable>
          </View>
        ) : null}

        {showNameInput ? (
          <AuthInput icon="♙" placeholder={tr.auth.fullName} value={fullName} onChangeText={setFullName} />
        ) : null}
        <AuthInput icon="♙" placeholder={isSignUp ? tr.auth.email : tr.auth.emailOrUsername} value={email} onChangeText={setEmail} keyboardType="email-address" />
        {isSupabaseConfigured ? (
          <AuthInput
            icon="▢"
            placeholder={tr.auth.password}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? '◉' : '◎'}
            onRightPress={() => setShowPassword((value) => !value)}
          />
        ) : null}

        {!isSignUp ? (
          <View style={styles.optionsRow}>
            <Pressable onPress={() => setRememberMe((value) => !value)} style={styles.rememberRow}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe ? <Text style={styles.checkText}>✓</Text> : null}
              </View>
              <Text style={styles.optionText}>{tr.auth.rememberMe}</Text>
            </Pressable>
            <Pressable onPress={() => setStatus('Şifre sıfırlama akışı bir sonraki adımda eklenecek.')}>
              <Text style={styles.forgotText}>{tr.auth.forgotPassword}</Text>
            </Pressable>
          </View>
        ) : null}

        {status ? <Text style={styles.status}>{status}</Text> : null}

        <Pressable onPress={submit} style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled, isWeb && styles.webGradient]}>
          <Text style={styles.primaryText}>{isSubmitting ? 'Lütfen bekle...' : authMode === 'signIn' ? tr.auth.signIn : tr.auth.signUp}</Text>
          <Text style={styles.primaryArrow}>→</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>{tr.auth.or}</Text>
          <View style={styles.divider} />
        </View>

        <SocialButton icon="" label={isSignUp ? tr.auth.appleSignUp : tr.auth.appleSignIn} onPress={() => setStatus(isSignUp ? 'Apple ile kayıt yakında eklenecek.' : 'Apple ile giriş yakında eklenecek.')} />
        <SocialButton icon="G" iconStyle={styles.googleIcon} label={isSignUp ? tr.auth.googleSignUp : tr.auth.googleSignIn} onPress={startGoogleSignIn} />

        {needsConfirmation && authMode === 'signIn' ? (
          <Pressable onPress={resendConfirmation} style={styles.resendButton}>
            <Text style={styles.resendText}>Onay e-postasını gönder</Text>
          </Pressable>
        ) : null}

        <View style={styles.trustRow}>
          <TrustItem icon="◇" title="Güvenli" text="Verileriniz şifrelenir" />
          <View style={styles.trustDivider} />
          <TrustItem icon="↗" title="Kişisel İlerleme" text="Hedeflerinizi takip edin" />
          <View style={styles.trustDivider} />
          <TrustItem icon="▣" title="Gizlilik" text="Bilgileriniz korunur" />
        </View>

        <Text style={styles.termsText}>
          Ritmi kullanarak <Text style={styles.linkText}>Kullanım Koşulları</Text> ve <Text style={styles.linkPurple}>Gizlilik Politikası</Text>'nı kabul etmiş olursunuz.
        </Text>
      </ScrollView>
    </AppScreen>
  );
}

function AuthInput({ icon, rightIcon, onRightPress, style, ...props }) {
  return (
    <View style={[styles.inputWrap, style]}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        placeholderTextColor={tokens.colors.textSecondary}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        numberOfLines={1}
        maxFontSizeMultiplier={1.12}
        {...props}
      />
      {rightIcon ? (
        <Pressable onPress={onRightPress} style={styles.inputRight}>
          <Text style={styles.inputRightText}>{rightIcon}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function SocialButton({ icon, iconStyle, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.socialButton}>
      <Text style={[styles.socialIcon, iconStyle]}>{icon}</Text>
      <Text style={styles.socialText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9} maxFontSizeMultiplier={1.12}>{label}</Text>
    </Pressable>
  );
}

function TrustItem({ icon, title, text }) {
  return (
    <View style={styles.trustItem}>
      <Text style={styles.trustIcon}>{icon}</Text>
      <Text style={styles.trustTitle}>{title}</Text>
      <Text style={styles.trustText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: tokens.colors.background },
  webGradient: { backgroundImage: tokens.gradients.primary },
  content: { paddingTop: 10, paddingBottom: 48 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  languagePill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderColor: tokens.colors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: 'rgba(11, 23, 40, 0.72)' },
  languageIcon: { color: tokens.colors.textPrimary, fontSize: 22, fontWeight: '800' },
  languageText: { color: tokens.colors.textPrimary, fontSize: 18, fontWeight: '800' },
  languageChevron: { color: tokens.colors.textPrimary, fontSize: 18, fontWeight: '900', marginTop: -2 },
  title: { color: tokens.colors.textPrimary, fontSize: 34, fontWeight: '900', marginBottom: 10 },
  promiseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  promisePrimary: { color: tokens.colors.primaryStart, fontSize: 19, fontWeight: '800' },
  promiseSecondary: { color: tokens.colors.primaryMid, fontSize: 19, fontWeight: '800' },
  promisePurple: { color: tokens.colors.primaryEnd, fontSize: 19, fontWeight: '800' },
  desc: { color: tokens.colors.textSecondary, fontSize: 16, lineHeight: 22, marginBottom: 16, width: '100%', maxWidth: 410 },
  segment: { flexDirection: 'row', height: 56, borderColor: tokens.colors.border, borderWidth: 1, borderRadius: 20, padding: 4, marginBottom: 14, overflow: 'hidden', backgroundColor: 'rgba(11, 23, 40, 0.64)' },
  segmentItem: { flex: 1, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  segmentActive: { backgroundColor: tokens.colors.primaryMid },
  segmentText: { color: tokens.colors.textSecondary, fontSize: 17, fontWeight: '900' },
  segmentTextActive: { color: '#FFFFFF' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', minHeight: 56, borderColor: '#38526F', borderWidth: 1, borderRadius: 16, marginBottom: 10, paddingRight: 14, backgroundColor: 'rgba(7, 17, 31, 0.82)' },
  inputIcon: { color: tokens.colors.textPrimary, fontSize: 24, width: 48, textAlign: 'center' },
  input: { flex: 1, minWidth: 0, color: tokens.colors.textPrimary, fontSize: 17, fontWeight: '700', outlineStyle: 'none' },
  inputRight: { width: 44, alignItems: 'flex-end', justifyContent: 'center' },
  inputRightText: { color: tokens.colors.textPrimary, fontSize: 30, fontWeight: '800' },
  optionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, marginBottom: 16, gap: 12 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 26, height: 26, borderRadius: 6, borderWidth: 1.5, borderColor: tokens.colors.primaryStart, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: 'rgba(35, 231, 210, 0.12)' },
  checkText: { color: tokens.colors.primaryStart, fontSize: 20, lineHeight: 22, fontWeight: '900' },
  optionText: { color: tokens.colors.textSecondary, fontSize: 16, fontWeight: '700' },
  forgotText: { color: tokens.colors.primaryEnd, fontSize: 16, fontWeight: '800' },
  status: { color: tokens.colors.textSecondary, borderColor: tokens.colors.border, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 16, fontWeight: '800', backgroundColor: 'rgba(11, 23, 40, 0.72)' },
  primaryButton: { minHeight: 56, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: tokens.colors.primaryMid },
  primaryButtonDisabled: { opacity: 0.72 },
  primaryText: { color: '#FFFFFF', fontSize: 19, fontWeight: '900' },
  primaryArrow: { position: 'absolute', right: 28, color: '#FFFFFF', fontSize: 30, fontWeight: '500' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 14 },
  divider: { flex: 1, height: 1, backgroundColor: tokens.colors.border },
  dividerText: { color: tokens.colors.textSecondary, fontSize: 16, fontWeight: '700' },
  socialButton: { minHeight: 52, borderRadius: 16, borderColor: tokens.colors.border, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 10, backgroundColor: 'rgba(11, 23, 40, 0.7)' },
  socialIcon: { color: tokens.colors.textPrimary, fontSize: 25, fontWeight: '900' },
  googleIcon: { color: '#4285F4' },
  socialText: { color: tokens.colors.textSecondary, fontSize: 17, fontWeight: '800' },
  resendButton: { borderColor: tokens.colors.success, borderWidth: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 2, marginBottom: 18 },
  resendText: { color: tokens.colors.success, fontWeight: '900' },
  trustRow: { flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-between', marginTop: 18, marginBottom: 18 },
  trustItem: { flex: 1, alignItems: 'center', paddingHorizontal: 7 },
  trustDivider: { width: 1, backgroundColor: tokens.colors.border },
  trustIcon: { color: tokens.colors.primaryStart, fontSize: 31, fontWeight: '900', marginBottom: 8 },
  trustTitle: { color: tokens.colors.textPrimary, fontSize: 15, fontWeight: '800', textAlign: 'center', marginBottom: 5 },
  trustText: { color: tokens.colors.textSecondary, fontSize: 12, lineHeight: 16, textAlign: 'center' },
  termsText: { color: tokens.colors.textSecondary, textAlign: 'center', lineHeight: 23, fontSize: 14, paddingHorizontal: 16 },
  linkText: { color: tokens.colors.primaryStart },
  linkPurple: { color: tokens.colors.primaryEnd },
});
