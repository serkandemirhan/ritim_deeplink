import { Redirect, router } from 'expo-router';
import NfcSettingsScreen from '../src/features/nfc/NfcSettingsScreen';
import useStore from '../src/store/store';
import { hasAppAccess } from '../src/auth/requireAuth';

export default function NfcSettingsRoute() {
  const profile = useStore((state: any) => state.profile);
  const authUserId = useStore((state: any) => state.authUserId);
  if (!hasAppAccess(profile, authUserId)) return <Redirect href="/onboarding" />;

  return <NfcSettingsScreen navigate={(route: string) => router.push(`/${route}` as never)} />;
}
