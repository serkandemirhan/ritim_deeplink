import { isSupabaseConfigured } from '../lib/supabase';

function isScreenshotMode() {
  return typeof window !== 'undefined' && (window as any).__RITIM_SCREENSHOT_MODE__ === true;
}

export function hasAppAccess(profile: any, authUserId?: string | null) {
  if (!profile) return false;
  if (isScreenshotMode()) return true;
  if (!isSupabaseConfigured) return true;
  return Boolean(authUserId && profile.id === authUserId);
}
