import { Redirect, router, useLocalSearchParams } from 'expo-router';
import MockScanScreen from '../src/features/nfc/MockScanScreen';
import useStore from '../src/store/store';
import { hasAppAccess } from '../src/auth/requireAuth';

export default function MockScanRoute() {
  const profile = useStore((state: any) => state.profile);
  const authUserId = useStore((state: any) => state.authUserId);
  const params = useLocalSearchParams<{ activityTypeId?: string; routineId?: string }>();
  if (!hasAppAccess(profile, authUserId)) return <Redirect href="/onboarding" />;

  return (
    <MockScanScreen
      route={{ params }}
      navigate={(route: string, params?: Record<string, string>) => {
        if (route === 'home') {
          router.replace(params ? { pathname: '/home' as never, params } : '/home');
          return;
        }
        router.push({ pathname: `/${route}` as never, params: params || {} });
      }}
    />
  );
}
