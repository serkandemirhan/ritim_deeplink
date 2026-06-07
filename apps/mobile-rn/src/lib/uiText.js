export const isProductionUi = process.env.NODE_ENV === 'production';

export function canShowDebugUi(devToolsEnabled = false) {
  return !isProductionUi && Boolean(devToolsEnabled || globalThis.__DEV__);
}

export function displayWorkspaceName(name) {
  const value = String(name || '').trim();
  if (!value || /^demo workspace$/i.test(value)) return 'Kişisel alan';
  return value;
}

export function displaySource(source) {
  if (source === 'manual') return 'Manuel giriş';
  return 'NFC ile kaydedildi';
}

export function displaySyncStatus(syncStatus) {
  if (syncStatus === 'local_only') return '✓ Kaydedildi';
  if (syncStatus === 'pending') return 'Senkron bekliyor';
  if (syncStatus === 'synced') return 'Senkronlandı';
  if (syncStatus === 'failed') return 'Senkron hatası';
  return 'Kaydedildi';
}

export function displaySyncBadge(syncStatus) {
  if (syncStatus === 'pending') return { label: '⏳ Bekliyor', tone: 'pending' };
  if (syncStatus === 'failed') return { label: '⚠️ Hata', tone: 'failed' };
  if (syncStatus === 'local_only') return { label: '✓ Kaydedildi', tone: 'saved' };
  return { label: '✓ Senkronlandı', tone: 'synced' };
}

export function displayDayTime(dateValue) {
  const date = new Date(dateValue);
  const isToday = date.toDateString() === new Date().toDateString();
  const day = isToday ? 'Bugün' : date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
  const time = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${time}`;
}

export function maskCardCode(value) {
  const raw = String(value || '').replace(/^mock-hash-/i, '').replace(/^nfc-hash-/i, '').replace(/^MOCK-TAG-/i, '');
  const compact = raw.replace(/[^a-zA-Z0-9]/g, '');
  if (!compact) return '';
  return `****${compact.slice(-3)}`;
}

export function displayUnit(unit) {
  const units = {
    reps: 'tekrar',
    min: 'dk',
    hour: 'saat',
    cup: 'fincan',
    steps: 'adım',
    page: 'sayfa',
  };
  return units[unit] || unit || '';
}

export function displayWorkoutCategory(category) {
  const labels = {
    All: 'Tümü',
    Chest: 'Göğüs',
    Back: 'Sırt',
    Legs: 'Bacak',
    Shoulder: 'Omuz',
    Arms: 'Kol',
    Core: 'Merkez',
    Cardio: 'Kardiyo',
    Stretching: 'Esneme',
    fitness: 'Egzersiz',
    wellness: 'Wellness',
  };
  return labels[category] || category || '-';
}

export function displayDifficulty(value) {
  const labels = {
    easy: 'Kolay',
    medium: 'Orta',
    hard: 'Zor',
    tracking: 'Takip',
  };
  return labels[value] || value || 'Takip';
}

export function displayTrackingMode(value) {
  const labels = {
    reps: 'Tekrar',
    sets: 'Set',
    duration: 'Süre',
  };
  return labels[value] || value || 'Süre';
}
