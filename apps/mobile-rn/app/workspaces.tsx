import { Redirect, router } from 'expo-router';
import WorkspacesScreen from '../src/features/workspaces/WorkspacesScreen';
import useStore from '../src/store/store';
import { hasAppAccess } from '../src/auth/requireAuth';

export default function WorkspacesRoute() {
  const profile = useStore((state: any) => state.profile);
  const authUserId = useStore((state: any) => state.authUserId);
  if (!hasAppAccess(profile, authUserId)) return <Redirect href="/onboarding" />;

  return <WorkspacesScreen navigate={(route: string) => router.push(`/${route}` as never)} />;
}
