import { Platform } from 'react-native';
import { buildRitimTagUrl } from '../../lib/deepLinkConstants';

const toHexByte = (value) => Number(value || 0).toString(16).padStart(2, '0').toUpperCase();
const uidToString = (uid) => {
  if (Array.isArray(uid)) return uid.map(toHexByte).join('');
  if (uid instanceof Uint8Array) return Array.from(uid).map(toHexByte).join('');
  return String(uid || '').trim();
};
const normalizeUid = (uid) => uidToString(uid).toUpperCase().replace(/[^A-F0-9]/g, '');
const hashRealUid = (uid) => `nfc-hash-${normalizeUid(uid) || String(uid || '').trim()}`;

export function isNativeNfcRuntime() {
  return Platform.OS !== 'web';
}

export async function scanRealNfcTag() {
  if (!isNativeNfcRuntime()) {
    return { ok: false, error: 'Real NFC is only available in native iOS/Android builds.' };
  }

  let NfcManager;
  let NfcTech;
  try {
    const nfcModule = require('react-native-nfc-manager');
    NfcManager = nfcModule.default || nfcModule;
    NfcTech = nfcModule.NfcTech;
  } catch (error) {
    return { ok: false, error: 'react-native-nfc-manager is not available in this runtime.' };
  }

  try {
    const supported = await NfcManager.isSupported();
    if (!supported) return { ok: false, error: 'This device does not support NFC.' };

    await NfcManager.start();
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
    } catch (_ndefError) {
      await NfcManager.requestTechnology(NfcTech.NfcA);
    }
    const tag = await NfcManager.getTag();
    const rawUid = uidToString(tag?.id || tag?.ndefMessage?.[0]?.id || '');
    if (!rawUid) return { ok: false, error: 'NFC tag was scanned, but no UID was exposed.' };

    return {
      ok: true,
      uid: rawUid,
      uidHash: hashRealUid(rawUid),
      tag,
    };
  } catch (error) {
    return { ok: false, error: error?.message || 'NFC scan failed.' };
  } finally {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch (_error) {
      // Ignore cleanup failures; the scan result is already resolved.
    }
  }
}

export function uidHashFromRealUid(uid) {
  return hashRealUid(uid);
}

export async function writeNfcDeepLink(tagCode) {
  const url = buildRitimTagUrl(tagCode);
  if (!isNativeNfcRuntime()) {
    return { success: false, url, error: 'NFC writing is only available in native iOS/Android builds.' };
  }

  let NfcManager;
  let Ndef;
  let NfcTech;
  try {
    const nfcModule = require('react-native-nfc-manager');
    NfcManager = nfcModule.default || nfcModule;
    Ndef = nfcModule.Ndef;
    NfcTech = nfcModule.NfcTech;
  } catch (error) {
    return { success: false, url, error: 'react-native-nfc-manager is not available in this runtime.' };
  }

  try {
    const supported = await NfcManager.isSupported();
    if (!supported) return { success: false, url, error: 'This device does not support NFC.' };

    await NfcManager.start();

    const bytes = Ndef.encodeMessage([Ndef.uriRecord(url)]);
    if (!bytes) throw new Error('Failed to encode NDEF message.');

    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
    } catch (ndefError) {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (_cleanupError) {
        // Ignore cleanup before trying the Android formatable fallback.
      }

      if (Platform.OS !== 'android' || !NfcTech.NdefFormatable || !NfcManager.ndefFormatableHandlerAndroid) {
        throw ndefError;
      }

      await NfcManager.requestTechnology(NfcTech.NdefFormatable);
      await NfcManager.ndefFormatableHandlerAndroid.formatNdef(bytes, { readOnly: false });
    }

    return { success: true, url };
  } catch (error) {
    const message = error?.message || 'NFC write failed.';
    const hint = message.toLowerCase().includes('unsupported tag api')
      ? 'Bu etiket Android tarafında NDEF yazılabilir olarak görünmüyor. NTAG213/215/216 gibi NDEF uyumlu, yazılabilir bir NFC etiketi dene.'
      : message;
    return { success: false, url, error: hint };
  } finally {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch (_error) {
      // Ignore cleanup failures; the write result is already resolved.
    }
  }
}
