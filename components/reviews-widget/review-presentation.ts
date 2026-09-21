export function safeReviewUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/** UTC keeps date-only editorial dates unchanged across server and visitor time zones. */
export function reviewDate(value?: string | number | null, fallback?: string | null) {
  const date = value === null || value === undefined || value === ''
    ? null
    : new Date(typeof value === 'number' ? value * 1000 : value);
  if (!date || !Number.isFinite(date.getTime())) {
    return { dateTime: null, dateLabel: fallback?.trim() || null };
  }
  return {
    dateTime: date.toISOString(),
    dateLabel: new Intl.DateTimeFormat('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    }).format(date),
  };
}
