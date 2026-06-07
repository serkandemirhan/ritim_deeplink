import { Redirect, router } from 'expo-router';
import CreateRoutineScreen from '../src/features/routines/CreateRoutineScreen';
import useStore from '../src/store/store';
import { hasAppAccess } from '../src/auth/requireAuth';

export default function RoutineCreateRoute() {
  const profile = useStore((state: any) => state.profile);
  const authUserId = useStore((state: any) => state.authUserId);
  if (!hasAppAccess(profile, authUserId)) return <Redirect href="/onboarding" />;
  return <CreateRoutineScreen navigate={(route: string, params?: Record<string, string>) => params ? router.push({ pathname: `/${route}` as never, params }) : router.push(`/${route}` as never)} />;
}
