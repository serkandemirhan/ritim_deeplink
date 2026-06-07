import { Redirect, router } from 'expo-router';
import ActivityLibraryScreen from '../src/features/activity-library/ActivityLibraryScreen';
import useStore from '../src/store/store';
import { hasAppAccess } from '../src/auth/requireAuth';

export default function ActivityLibraryRoute() {
  const profile = useStore((state: any) => state.profile);
  const authUserId = useStore((state: any) => state.authUserId);
  if (!hasAppAccess(profile, authUserId)) return <Redirect href="/onboarding" />;

  return (
    <ActivityLibraryScreen
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
