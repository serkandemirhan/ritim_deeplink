import { useEffect, useState } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import useStore from '../../src/store/store';
import { importLocalDataToSupabase, pullRemoteData, pushBootstrapData } from '../../src/services/supabaseSync';

function getDisplayName(user: any) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Kullanıcı'
  );
}

async function ensureLocalFirstAccount(user: any) {
  const store = useStore.getState() as any;
  store.claimLocalDataForUser?.(user);

  let state = useStore.getState() as any;
  let profile = state.profile;
  const displayName = getDisplayName(user);

  if (!profile) {
    profile = state.createProfile(displayName, user.email || undefined, {
      id: user.id,
      age: null,
      heightCm: null,
      weightKg: null,
      gender: 'prefer_not_to_say',
      activityLevel: 'medium',
    });
  }

  state = useStore.getState() as any;
  let tenant = state.tenants.find((item: any) => item.id === state.activeTenantId) || state.tenants[0];
  if (!tenant) {
    tenant = state.createTenant(displayName, 'personal');
    state.setActiveTenant(tenant.id);
  }

  const activityTypes = (useStore.getState() as any).seedDefaultActivityTypes(tenant.id);

  try {
    const nextState = useStore.getState() as any;
    if (nextState.tenants.length) {
      await importLocalDataToSupabase(nextState);
    } else {
      await pushBootstrapData({ profile, tenant, activityTypes });
    }
  } catch (_error) {
    // Keep the just-created local account usable; AutoSyncRuntime will retry later.
  }
}

export default function AuthCallbackRoute() {
  const params = useLocalSearchParams<{ code?: string }>();
  const setAuthUserId = useStore((state: any) => state.setAuthUserId);
  const hydrateRemoteData = useStore((state: any) => state.hydrateRemoteData);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let mounted = true;
    const finish = async () => {
      try {
        if (params.code && supabase) {
          await supabase.auth.exchangeCodeForSession(String(params.code));
        }
        if (supabase) {
          const sessionResult = await supabase.auth.getSession();
          const user = sessionResult.data.session?.user || null;
          const userId = user?.id || null;
          setAuthUserId(userId);
          if (userId) {
            try {
              const remoteData = await pullRemoteData();
              if (remoteData.profile) {
                hydrateRemoteData(remoteData);
              } else if (user) {
                await ensureLocalFirstAccount(user);
              }
            } catch (_error) {
              if (user) await ensureLocalFirstAccount(user);
            }
          }
        }
      } finally {
        if (mounted) setDone(true);
      }
    };
    finish();
    return () => {
      mounted = false;
    };
  }, [hydrateRemoteData, params.code, setAuthUserId]);

  if (!done) return <Text />;
  return <Redirect href="/" />;
}
