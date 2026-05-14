import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

export function toDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isValid(input) ? input : null;
  const parsed = parseISO(input);
  return isValid(parsed) ? parsed : null;
}

export function formatDate(input: string | Date | null | undefined, pattern = 'PP'): string {
  const date = toDate(input);
  if (!date) return '—';
  return format(date, pattern);
}

export function formatDateTime(input: string | Date | null | undefined): string {
  return formatDate(input, "PP 'at' p");
}

export function formatRelative(input: string | Date | null | undefined): string {
  const date = toDate(input);
  if (!date) return '—';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatNumber(value: number | null | undefined, fractionDigits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatPercent(
  value: number | null | undefined,
  options: { fractionDigits?: number } = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'percent',
    minimumFractionDigits: options.fractionDigits ?? 0,
    maximumFractionDigits: options.fractionDigits ?? 1,
  }).format(value);
}

export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const seconds = Math.floor(totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(secs)}`;
  return `${minutes}:${pad(secs)}`;
}

export function initialsOf(name: string | null | undefined): string {
  if (!name) return '·';
  const trimmed = name.trim();
  if (trimmed.length === 0) return '·';
  const parts = trimmed.split(/\s+/).slice(0, 2);
  const fromParts = parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
  return fromParts || (trimmed[0]?.toUpperCase() ?? '·');
}
