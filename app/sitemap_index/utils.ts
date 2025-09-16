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
