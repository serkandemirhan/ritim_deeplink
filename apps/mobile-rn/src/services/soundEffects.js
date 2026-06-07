import { Audio } from 'expo-av';

const SOURCES = {
  nfcDetected: require('../../assets/sounds/nfc-detected.wav'),
  scanSuccess: require('../../assets/sounds/scan-success.wav'),
  goalComplete: require('../../assets/sounds/goal-complete.wav'),
  overdrive: require('../../assets/sounds/overdrive.wav'),
  momentum: require('../../assets/sounds/momentum.wav'),
};

const VOLUME = {
  nfcDetected: 0.34,
  scanSuccess: 0.42,
  goalComplete: 0.48,
  overdrive: 0.44,
  momentum: 0.36,
};

let isAudioReady = false;
let lastPlayedAt = {};

async function ensureAudioReady() {
  if (isAudioReady) return true;
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
  isAudioReady = true;
  return true;
}

export async function playSoundEffect(name) {
  const source = SOURCES[name];
  if (!source) return;

  const now = Date.now();
  if (now - (lastPlayedAt[name] || 0) < 180) return;
  lastPlayedAt[name] = now;

  try {
    await ensureAudioReady();
    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: true,
      volume: VOLUME[name] ?? 0.4,
      isLooping: false,
    });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status?.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch (_error) {
    // Audio can be unavailable on simulators, locked-down browsers, or muted devices.
  }
}

export function playSoundEffectSoon(name, delayMs = 0) {
  setTimeout(() => {
    playSoundEffect(name);
  }, delayMs);
}
