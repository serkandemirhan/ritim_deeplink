import { Redirect, router } from 'expo-router';
import SyncQueueScreen from '../src/features/sync/SyncQueueScreen';
import useStore from '../src/store/store';
import { hasAppAccess } from '../src/auth/requireAuth';

export default function SyncRoute() {
  const profile = useStore((state: any) => state.profile);
  const authUserId = useStore((state: any) => state.authUserId);
  if (!hasAppAccess(profile, authUserId)) return <Redirect href="/onboarding" />;

  return <SyncQueueScreen navigate={(route: string) => router.push(`/${route}` as never)} />;
}
