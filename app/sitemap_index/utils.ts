export const formatLastmod = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const isoLike = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const withZone = /([+-]\d{2}:?\d{2}|Z)$/i.test(isoLike) ? isoLike : `${isoLike}Z`;
  const date = new Date(withZone);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const normalizeEntryPath = (value?: string | null) => {
  if (!value) return '/';
  const trimmed = value.trim();
  if (!trimmed) return '/';
  const leading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (leading === '/') return '/';
  return leading.replace(/\/+$/, '');
};

export const xmlEscape = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const trimTo = (value: string, max: number): string => {
  if (value.length <= max) return value;
  return value.slice(0, max).replace(/\s+\S*$/, '') + '…';
};
