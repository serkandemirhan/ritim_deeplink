import { Redirect, router } from 'expo-router';
import MyCardsScreen from '../../src/features/cards/MyCardsScreen';
import useStore from '../../src/store/store';
import { hasAppAccess } from '../../src/auth/requireAuth';

export default function CardsRoute() {
  const profile = useStore((state: any) => state.profile);
  const authUserId = useStore((state: any) => state.authUserId);
  if (!hasAppAccess(profile, authUserId)) return <Redirect href="/onboarding" />;

  return (
    <MyCardsScreen
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }
        router.push('/profile' as never);
      }}
      navigate={(route: string, params?: Record<string, string>) => {
        if (params) {
          router.push({ pathname: `/${route}` as never, params });
          return;
        }
        router.push(`/${route}` as never);
      }}
    />
  );
}
