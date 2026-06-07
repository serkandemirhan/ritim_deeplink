import { useEffect } from 'react';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import { extractRitimTagCode } from '../lib/deepLinking';

export default function DeepLinkRuntime() {
  useEffect(() => {
    const open = (url: string | null) => {
      const tagCode = url ? extractRitimTagCode(url) : null;
      if (!tagCode) return;
      router.push({ pathname: '/t/[tagCode]' as never, params: { tagCode } });
    };

    Linking.getInitialURL().then(open).catch(() => undefined);
    const subscription = Linking.addEventListener('url', ({ url }) => open(url));
    return () => subscription.remove();
  }, []);

  return null;
}
