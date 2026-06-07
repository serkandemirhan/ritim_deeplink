import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { Text } from 'react-native';
import useStore from '../src/store/store';
import { isSupabaseConfigured, supabase } from '../src/lib/supabase';
import { pullRemoteData } from '../src/services/supabaseSync';

export default function IndexRoute() {
  const profile = useStore((state: any) => state.profile);
  const authUserId = useStore((state: any) => state.authUserId);
  const hydrateRemoteData = useStore((state: any) => state.hydrateRemoteData);
  const setAuthUserId = useStore((state: any) => state.setAuthUserId);
  const [checkingSession, setCheckingSession] = useState(isSupabaseConfigured && !authUserId);

  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      if (!isSupabaseConfigured || !supabase || authUserId) {
        setCheckingSession(false);
        return;
      }
      try {
        const sessionResult = await supabase.auth.getSession();
        const userId = sessionResult.data.session?.user?.id || null;
        setAuthUserId(userId);
        if (userId) {
          const remoteData = await pullRemoteData();
          if (remoteData.profile) hydrateRemoteData(remoteData);
        }
      } catch (_error) {
        // Keep local-first behavior.
      } finally {
        if (mounted) setCheckingSession(false);
      }
    };
    restore();
    return () => {
      mounted = false;
    };
  }, [authUserId, hydrateRemoteData, setAuthUserId]);

  if (checkingSession) return <Text />;

  return <Redirect href={profile && (!isSupabaseConfigured || profile.id === authUserId) ? '/home' : '/onboarding'} />;
}
