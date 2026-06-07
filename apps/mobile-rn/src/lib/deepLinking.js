import { RITIM_CUSTOM_SCHEME, RITIM_DEEPLINK_HOST } from './deepLinkConstants';

export function extractRitimTagCode(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    const isHttpsLink = parsed.protocol === 'https:' && parsed.hostname === RITIM_DEEPLINK_HOST;
    const isCustomLink = parsed.protocol === `${RITIM_CUSTOM_SCHEME}:`;
    if (!isHttpsLink && !isCustomLink) return null;

    const parts = parsed.pathname.split('/').filter(Boolean);
    if (isHttpsLink && parts[0] === 't' && parts[1]) return decodeURIComponent(parts[1]);

    if (isCustomLink) {
      if (parsed.hostname === 't' && parts[0]) return decodeURIComponent(parts[0]);
      if (parts[0] === 't' && parts[1]) return decodeURIComponent(parts[1]);
    }
  } catch (_error) {
    const match = url.match(/(?:\/t\/|ritimapp:\/\/t\/)([^/?#]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }
  return null;
}
