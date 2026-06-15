export const RITIM_ENVIRONMENT = process.env.EXPO_PUBLIC_ENVIRONMENT || 'development';
export const RITIM_DEEPLINK_HOST = process.env.EXPO_PUBLIC_DEEPLINK_DOMAIN || 'dev.getritim.com';
export const RITIM_APP_URL = (process.env.EXPO_PUBLIC_APP_URL || `https://${RITIM_DEEPLINK_HOST}`).replace(/\/$/, '');
export const RITIM_DEEPLINK_BASE_URL = `https://${RITIM_DEEPLINK_HOST}/t`;
export const RITIM_AUTH_CALLBACK_URL = `https://${RITIM_DEEPLINK_HOST}/auth/callback`;
export const RITIM_CUSTOM_SCHEME = 'ritimapp';

export function buildRitimTagUrl(tagCode) {
  return `${RITIM_DEEPLINK_BASE_URL}/${encodeURIComponent(tagCode)}`;
}

export function buildRitimCustomTagUrl(tagCode) {
  return `${RITIM_CUSTOM_SCHEME}://t/${encodeURIComponent(tagCode)}`;
}
