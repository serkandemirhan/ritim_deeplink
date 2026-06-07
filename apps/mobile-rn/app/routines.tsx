import { Redirect, router } from 'expo-router';
import RoutinesScreen from '../src/features/routines/RoutinesScreen';
import useStore from '../src/store/store';
import { hasAppAccess } from '../src/auth/requireAuth';

export default function RoutinesRoute() {
  const profile = useStore((state: any) => state.profile);
  const authUserId = useStore((state: any) => state.authUserId);
  if (!hasAppAccess(profile, authUserId)) return <Redirect href="/onboarding" />;

  return (
    <RoutinesScreen
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
