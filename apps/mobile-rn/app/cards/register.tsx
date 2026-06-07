import { Redirect, router, useLocalSearchParams } from 'expo-router';
import RegisterCardScreen from '../../src/features/cards/RegisterCardScreen';
import useStore from '../../src/store/store';
import { hasAppAccess } from '../../src/auth/requireAuth';

export default function RegisterCardRoute() {
  const profile = useStore((state: any) => state.profile);
  const authUserId = useStore((state: any) => state.authUserId);
  const params = useLocalSearchParams<{ mockUid?: string; scannedUid?: string; uidHash?: string; scanSource?: string; cardId?: string; activityTypeId?: string; routineId?: string }>();
  if (!hasAppAccess(profile, authUserId)) return <Redirect href="/onboarding" />;

  return (
    <RegisterCardScreen
      route={{ params }}
      navigate={(route: string, nextParams?: Record<string, string>) => {
        if (route === 'cards') {
          router.replace('/cards');
          return;
        }
        if (route === 'cards/success') {
          router.replace({ pathname: '/cards/success' as never, params: nextParams || {} });
          return;
        }
        if (nextParams) {
          router.push({ pathname: `/${route}` as never, params: nextParams });
          return;
        }
        router.push(`/${route}` as never);
      }}
    />
  );
}
