const DASH_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const COMPACT_PATTERN = /^\d{8}$/;
const SLASH_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

function toDate(year: number, month: number, day: number): Date | null {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  // Guard against JS auto-correcting invalid dates (e.g., Apr 31 -> May 1)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function parseSpecialOfferDate(raw?: string | null): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (COMPACT_PATTERN.test(trimmed)) {
    const year = Number.parseInt(trimmed.slice(0, 4), 10);
    const month = Number.parseInt(trimmed.slice(4, 6), 10);
    const day = Number.parseInt(trimmed.slice(6, 8), 10);
    return toDate(year, month, day);
  }

  if (DASH_PATTERN.test(trimmed)) {
    const [yearStr, monthStr, dayStr] = trimmed.split('-');
    return toDate(Number.parseInt(yearStr, 10), Number.parseInt(monthStr, 10), Number.parseInt(dayStr, 10));
  }

  const slashMatch = trimmed.match(SLASH_PATTERN);
  if (slashMatch) {
    const [, monthStr, dayStr, yearStr] = slashMatch;
    return toDate(Number.parseInt(yearStr, 10), Number.parseInt(monthStr, 10), Number.parseInt(dayStr, 10));
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function endOfDay(date: Date): Date {
  const clone = new Date(date);
  clone.setHours(23, 59, 59, 999);
  return clone;
}

export function formatSpecialOfferExpiration(raw?: string | null, locale = 'en-US'): string | null {
  const parsed = parseSpecialOfferDate(raw);
  if (!parsed) return null;
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(parsed);
  } catch {
    return parsed.toLocaleDateString();
  }
}

export function isSpecialOfferExpired(raw?: string | null): boolean {
  const parsed = parseSpecialOfferDate(raw);
  if (!parsed) return false;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfExpiration = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  return startOfExpiration.getTime() < startOfToday.getTime();
}

export function serializeSpecialOfferDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default parseSpecialOfferDate;
