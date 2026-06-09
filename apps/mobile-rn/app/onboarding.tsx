import OnboardingScreen from '../src/features/onboarding/OnboardingScreen';
import { useRouter } from 'expo-router';

export default function OnboardingRoute() {
  const router = useRouter();

  const navigate = (route: string, params?: Record<string, string>) => {
    if (route === 'home') {
      router.replace('/home');
      return;
    }

    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    router.push(`/${route}${query}` as any);
  };

  return <OnboardingScreen navigate={navigate} />;
}
