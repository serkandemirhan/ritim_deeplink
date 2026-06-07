import { Redirect, router } from 'expo-router';
import HistoryScreen from '../src/features/history/HistoryScreen';
import useStore from '../src/store/store';
import { hasAppAccess } from '../src/auth/requireAuth';

export default function HistoryRoute() {
  const profile = useStore((state: any) => state.profile);
  const authUserId = useStore((state: any) => state.authUserId);
  if (!hasAppAccess(profile, authUserId)) return <Redirect href="/onboarding" />;

  return (
    <HistoryScreen
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
