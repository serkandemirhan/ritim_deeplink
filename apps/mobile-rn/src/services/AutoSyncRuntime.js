import React, { useEffect, useRef } from 'react';
import useStore from '../store/store';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { pullRemoteData, syncQueueItems } from './supabaseSync';

function isScreenshotMode() {
  return typeof window !== 'undefined' && window.__RITIM_SCREENSHOT_MODE__ === true;
}

export default function AutoSyncRuntime() {
  const syncQueue = useStore((s) => s.syncQueue);
  const hydrateRemoteData = useStore((s) => s.hydrateRemoteData);
  const setAuthUserId = useStore((s) => s.setAuthUserId);
  const markSyncQueueItem = useStore((s) => s.markSyncQueueItem);
  const markEntitySynced = useStore((s) => s.markEntitySynced);
  const markEntitySyncFailed = useStore((s) => s.markEntitySyncFailed);
  const claimLocalDataForUser = useStore((s) => s.claimLocalDataForUser);
  const queueRef = useRef(syncQueue);
  const syncingRef = useRef(false);
  const runSyncRef = useRef(null);

  useEffect(() => {
    queueRef.current = syncQueue;
  }, [syncQueue]);

  useEffect(() => {
    if (isScreenshotMode()) return undefined;
    if (!isSupabaseConfigured) return undefined;
    let mounted = true;

    const hydrate = async () => {
      try {
        const sessionResult = await supabase.auth.getSession();
        const user = sessionResult.data.session?.user || null;
        const userId = user?.id || null;
        setAuthUserId(userId);
        if (user) claimLocalDataForUser(user);
        if (!userId) return;
        const remote = await pullRemoteData();
        if (mounted && remote.profile) hydrateRemoteData(remote);
      } catch (_error) {
        // Offline or unauthenticated; keep local state.
      }
    };

    const runSync = async () => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      try {
        await syncQueueItems({
          queue: queueRef.current,
          markSyncQueueItem,
          markEntitySynced,
          markEntitySyncFailed,
        });
      } catch (_error) {
        // Retry on the next interval.
      } finally {
        syncingRef.current = false;
      }
    };
    runSyncRef.current = runSync;

    hydrate().then(runSync);
    const interval = setInterval(runSync, 30000);
    const authSubscription = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUserId(session?.user?.id || null);
      if (session?.user) claimLocalDataForUser(session.user);
      if (session?.user) hydrate().then(runSync);
    });

    return () => {
      mounted = false;
      clearInterval(interval);
      authSubscription.data.subscription.unsubscribe();
    };
  }, [claimLocalDataForUser, hydrateRemoteData, markEntitySyncFailed, markEntitySynced, markSyncQueueItem, setAuthUserId]);

  useEffect(() => {
    if (!isSupabaseConfigured || !syncQueue.some((item) => item.status === 'pending' || item.status === 'failed')) return;
    const timeout = setTimeout(() => runSyncRef.current?.(), 500);
    return () => clearTimeout(timeout);
  }, [syncQueue]);

  return null;
}
