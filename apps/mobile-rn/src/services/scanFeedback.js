import { Vibration } from 'react-native';
import { playSoundEffect } from './soundEffects';

export const FEEDBACK_TYPES = {
  NFC_DETECTED: 'nfc_detected',
  SCAN_SUCCESS: 'scan_success',
  MOMENTUM: 'momentum',
  GOAL_COMPLETE: 'goal_complete',
  OVERDRIVE: 'overdrive',
};

const FEEDBACK_CONFIG = {
  [FEEDBACK_TYPES.NFC_DETECTED]: {
    soundName: 'nfcDetected',
    soundFile: 'nfc-detected.wav',
    hapticType: 'light',
    title: 'Kart algılandı',
    message: 'Kontrol ediliyor...',
    animationType: 'pulse',
    showExtraProgressBadge: false,
    priority: 1,
  },
  [FEEDBACK_TYPES.SCAN_SUCCESS]: {
    soundName: 'scanSuccess',
    soundFile: 'scan-success.wav',
    hapticType: 'medium',
    title: 'Kaydedildi',
    message: 'Harika, ritim devam ediyor',
    animationType: 'energy_transfer',
    showExtraProgressBadge: false,
    priority: 2,
  },
  [FEEDBACK_TYPES.MOMENTUM]: {
    soundName: 'momentum',
    soundFile: 'momentum.wav',
    hapticType: 'medium',
    title: 'Ritim yakalandı',
    message: 'Momentum sende',
    animationType: 'glow',
    showExtraProgressBadge: false,
    priority: 3,
  },
  [FEEDBACK_TYPES.GOAL_COMPLETE]: {
    soundName: 'goalComplete',
    soundFile: 'goal-complete.wav',
    hapticType: 'success',
    title: 'Bugünkü hedef tamamlandı',
    message: 'Ritim sende!',
    animationType: 'confetti',
    showExtraProgressBadge: false,
    priority: 4,
  },
  [FEEDBACK_TYPES.OVERDRIVE]: {
    soundName: 'overdrive',
    soundFile: 'overdrive.wav',
    hapticType: 'strong',
    title: 'Overdrive!',
    message: 'Bugün sınırı geçtin',
    animationType: 'fire_mode',
    showExtraProgressBadge: true,
    priority: 5,
  },
};

const HAPTIC_PATTERNS = {
  light: [0, 18],
  medium: [0, 42],
  success: [0, 45, 35, 85],
  strong: [0, 58, 32, 120],
};

let lastEffect = { at: 0, priority: 0 };

const toPercent = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const amountLabel = (amount, activityName) => {
  const value = Number(amount) || 0;
  return `+${value} ${activityName || 'aktivite'} eklendi`;
};

function buildFeedback(type, overrides = {}) {
  const base = FEEDBACK_CONFIG[type] || FEEDBACK_CONFIG[FEEDBACK_TYPES.SCAN_SUCCESS];
  return {
    feedbackType: type,
    soundFile: base.soundFile,
    soundName: base.soundName,
    hapticType: base.hapticType,
    title: base.title,
    message: base.message,
    animationType: base.animationType,
    showExtraProgressBadge: base.showExtraProgressBadge,
    priority: base.priority,
    ...overrides,
  };
}

export function evaluateNfcDetectedFeedback(options = {}) {
  return buildFeedback(FEEDBACK_TYPES.NFC_DETECTED, {
    soundEnabled: options.soundEnabled !== false,
    hapticEnabled: options.hapticEnabled !== false,
  });
}

export function evaluateScanFeedback({
  previousProgressPercent = 0,
  newProgressPercent = 0,
  addedAmount = 0,
  activityName = 'aktivite',
  extraAmount = 0,
  isStreakContinued = false,
  hasCompletedGoalTodayBefore = false,
  soundEnabled = true,
  hapticEnabled = true,
} = {}) {
  const previous = toPercent(previousProgressPercent);
  const next = toPercent(newProgressPercent);
  const crossedHalf = previous < 50 && next >= 50;
  const crossedThreeQuarter = previous < 75 && next >= 75;
  const crossedGoal = previous < 100 && next >= 100 && !hasCompletedGoalTodayBefore;
  const overdrive = (previous >= 100 && next > previous) || next >= 110;
  const amountText = amountLabel(addedAmount, activityName);
  const settings = { soundEnabled: soundEnabled !== false, hapticEnabled: hapticEnabled !== false };

  if (overdrive) {
    const extra = Number(extraAmount) || 0;
    return buildFeedback(FEEDBACK_TYPES.OVERDRIVE, {
      ...settings,
      title: 'Overdrive!',
      message: extra > 0 ? `Hedefin üstüne çıktın. +${extra} ekstra` : 'Bugün sınırı geçtin',
    });
  }
  if (crossedGoal) {
    return buildFeedback(FEEDBACK_TYPES.GOAL_COMPLETE, {
      ...settings,
      title: 'Bugünkü hedef tamamlandı',
      message: 'Harika iş çıkardın',
    });
  }
  if (crossedThreeQuarter || crossedHalf || isStreakContinued) {
    return buildFeedback(FEEDBACK_TYPES.MOMENTUM, {
      ...settings,
      title: crossedThreeQuarter ? 'Hedefe çok yaklaştın' : 'Ritim yakalandı',
      message: isStreakContinued ? 'Seri devam ediyor' : 'Bugün iyi gidiyorsun',
    });
  }
  return buildFeedback(FEEDBACK_TYPES.SCAN_SUCCESS, {
    ...settings,
    title: amountText,
    message: 'Harika, ritim devam ediyor',
  });
}

export function runFeedbackEffects(feedback, options = {}) {
  if (!feedback) return;
  const now = Date.now();
  if (now - lastEffect.at < 120 && (feedback.priority || 0) <= (lastEffect.priority || 0)) return;
  lastEffect = { at: now, priority: feedback.priority || 0 };
  const soundEnabled = feedback.soundEnabled !== false && options.soundEnabled !== false;
  const hapticEnabled = feedback.hapticEnabled !== false && options.hapticEnabled !== false;
  if (hapticEnabled) {
    const pattern = HAPTIC_PATTERNS[feedback.hapticType] || HAPTIC_PATTERNS.medium;
    Vibration.vibrate(pattern);
  }
  if (soundEnabled && feedback.soundName) {
    playSoundEffect(feedback.soundName);
  }
}
