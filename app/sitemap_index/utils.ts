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

export const DEFAULT_LOCALE = 'en';
export const SUPPORTED_LOCALES = ['en', 'es'] as const;
export const resolveLocale = (value?: string | null) =>
  value && SUPPORTED_LOCALES.includes(value.toLowerCase() as typeof SUPPORTED_LOCALES[number])
    ? (value.toLowerCase() as typeof SUPPORTED_LOCALES[number])
    : null;

export const stripLocalePrefix = (path: string) => {
  if (path.startsWith('/es')) {
    const remainder = path.slice(3) || '/';
    return remainder.startsWith('/') ? remainder : `/${remainder}`;
  }
  return path;
};

export const prefixLocalePath = (path: string, locale: string) => {
  const normalized = normalizeEntryPath(stripLocalePrefix(path));
  if (locale === DEFAULT_LOCALE) return normalized;
  return normalized === '/' ? '/es' : `/es${normalized}`;
};

export const localizePath = (path: string) =>
  SUPPORTED_LOCALES.map((locale) => ({
    locale,
    loc: prefixLocalePath(path, locale),
  }));

export const buildAlternateLinks = (origin: string, basePath: string) => {
  const normalized = normalizeEntryPath(stripLocalePrefix(basePath));
  const alternates = SUPPORTED_LOCALES.map((locale) => ({
    locale,
    href: `${origin}${prefixLocalePath(normalized, locale)}`,
  }));
  const defaultAlt = alternates.find((alt) => alt.locale === DEFAULT_LOCALE);
  const links = alternates.map(
    ({ locale, href }) => `<xhtml:link rel="alternate" hreflang="${locale}" href="${href}"/>`
  );
  if (defaultAlt) {
    links.push(`<xhtml:link rel="alternate" hreflang="x-default" href="${defaultAlt.href}"/>`);
  }
  return links;
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
