import { Redirect, router, useLocalSearchParams } from 'expo-router';
import ManualLogScreen from '../src/features/history/ManualLogScreen';
import useStore from '../src/store/store';
import { hasAppAccess } from '../src/auth/requireAuth';

export default function ManualLogRoute() {
  const profile = useStore((state: any) => state.profile);
  const authUserId = useStore((state: any) => state.authUserId);
  const params = useLocalSearchParams<{ category?: string; activityName?: string }>();
  if (!hasAppAccess(profile, authUserId)) return <Redirect href="/onboarding" />;

  return (
    <ManualLogScreen
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
