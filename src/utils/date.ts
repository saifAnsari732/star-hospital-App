const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const parseSafeDate = (input: string | Date | number): Date | null => {
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDisplayDate = (input: string | Date | number): string => {
  const date = parseSafeDate(input);
  if (!date) return typeof input === 'string' ? input : '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTHS_SHORT[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export const formatDisplayTime = (input: string | Date | number): string => {
  const date = parseSafeDate(input);
  if (!date) return typeof input === 'string' ? input : '—';
  const rawHours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = rawHours >= 12 ? 'PM' : 'AM';
  const hours12 = rawHours % 12 || 12;
  return `${String(hours12).padStart(2, '0')}:${minutes} ${period}`;
};

export const formatDateTime = (input: string | Date | number): string => {
  const date = parseSafeDate(input);
  if (!date) return typeof input === 'string' ? input : '—';
  return `${formatDisplayDate(date)} • ${formatDisplayTime(date)}`;
};

export const formatIsoDateOnly = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatWaitTimeMinutes = (minutes: number): string => {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return 'Up next';
  }
  if (minutes < 60) {
    return `~${Math.round(minutes)} mins`;
  }
  const hrs = Math.floor(minutes / 60);
  const rem = Math.round(minutes % 60);
  return rem === 0 ? `~${hrs} hr` : `~${hrs} hr ${rem}m`;
};

export const formatRelativeTime = (input: string | Date | number, nowMs: number = Date.now()): string => {
  const date = parseSafeDate(input);
  if (!date) return 'Just now';
  const diffSec = Math.round((nowMs - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDisplayDate(date);
};
