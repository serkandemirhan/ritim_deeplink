import { Redirect, router, useLocalSearchParams } from 'expo-router';
import DailyExecutionScreen from '../src/features/routines/DailyExecutionScreen';
import useStore from '../src/store/store';
import { hasAppAccess } from '../src/auth/requireAuth';

export default function RoutineDailyRoute() {
  const profile = useStore((state: any) => state.profile);
  const authUserId = useStore((state: any) => state.authUserId);
  const params = useLocalSearchParams<{ routineId?: string }>();
  if (!hasAppAccess(profile, authUserId)) return <Redirect href="/onboarding" />;
  return <DailyExecutionScreen route={{ params }} navigate={(route: string, nextParams?: Record<string, string>) => nextParams ? router.push({ pathname: `/${route}` as never, params: nextParams }) : router.push(`/${route}` as never)} />;
}
