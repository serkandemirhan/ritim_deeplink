import { Redirect, router, useLocalSearchParams } from 'expo-router';
import CardSuccessScreen from '../../src/features/cards/CardSuccessScreen';
import useStore from '../../src/store/store';
import { hasAppAccess } from '../../src/auth/requireAuth';

export default function CardSuccessRoute() {
  const profile = useStore((state: any) => state.profile);
  const authUserId = useStore((state: any) => state.authUserId);
  const params = useLocalSearchParams<{ cardId?: string }>();
  if (!hasAppAccess(profile, authUserId)) return <Redirect href="/onboarding" />;

  return (
    <CardSuccessScreen
      route={{ params }}
      navigate={(route: string, nextParams?: Record<string, string>) => {
        if (nextParams) {
          router.push({ pathname: `/${route}` as never, params: nextParams });
          return;
        }
        router.push(`/${route}` as never);
      }}
    />
  );
}
