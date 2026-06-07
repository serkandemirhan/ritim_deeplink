import { Redirect, router, useLocalSearchParams } from 'expo-router';
import WeeklyProgressDetailScreen from '../src/features/routines/WeeklyProgressDetailScreen';
import useStore from '../src/store/store';
import { hasAppAccess } from '../src/auth/requireAuth';

export default function RoutineWeekRoute() {
  const profile = useStore((state: any) => state.profile);
  const authUserId = useStore((state: any) => state.authUserId);
  const params = useLocalSearchParams<{ routineId?: string; weekIndex?: string }>();
  if (!hasAppAccess(profile, authUserId)) return <Redirect href="/onboarding" />;
  return <WeeklyProgressDetailScreen route={{ params }} navigate={(route: string, nextParams?: Record<string, string>) => nextParams ? router.push({ pathname: `/${route}` as never, params: nextParams }) : router.push(`/${route}` as never)} />;
}
