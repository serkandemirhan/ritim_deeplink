export const RITIM_DEEPLINK_HOST = 'ritim-deeplink.vercel.app';
export const RITIM_DEEPLINK_BASE_URL = `https://${RITIM_DEEPLINK_HOST}/t`;
export const RITIM_AUTH_CALLBACK_URL = `https://${RITIM_DEEPLINK_HOST}/auth/callback`;
export const RITIM_CUSTOM_SCHEME = 'ritimapp';

export function buildRitimTagUrl(tagCode) {
  return `${RITIM_DEEPLINK_BASE_URL}/${encodeURIComponent(tagCode)}`;
}

export function buildRitimCustomTagUrl(tagCode) {
  return `${RITIM_CUSTOM_SCHEME}://t/${encodeURIComponent(tagCode)}`;
}
