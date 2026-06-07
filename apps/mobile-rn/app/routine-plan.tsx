import { Redirect, router, useLocalSearchParams } from 'expo-router';
import RoutinePlanScreen from '../src/features/routines/RoutinePlanScreen';
import useStore from '../src/store/store';
import { hasAppAccess } from '../src/auth/requireAuth';

export default function RoutinePlanRoute() {
  const profile = useStore((state: any) => state.profile);
  const authUserId = useStore((state: any) => state.authUserId);
  const params = useLocalSearchParams<{ routineId?: string }>();
  if (!hasAppAccess(profile, authUserId)) return <Redirect href="/onboarding" />;
  return <RoutinePlanScreen route={{ params }} navigate={(route: string, nextParams?: Record<string, string>) => nextParams ? router.push({ pathname: `/${route}` as never, params: nextParams }) : router.push(`/${route}` as never)} />;
}
