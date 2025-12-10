export const SUPPORTED_LOCALES = ["en", "es"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

const LOCALE_PREFIX: Record<Locale, string> = {
  en: "",
  es: "/es",
};

const stripQueryAndHash = (value: string) => value.split(/[?#]/)[0] || "/";

const normalizePath = (value?: string | null): string => {
  if (!value) return "/";
  const trimmed = stripQueryAndHash(value.trim());
  if (!trimmed) return "/";
  try {
    const url = new URL(trimmed, "https://example.com");
    let pathname = url.pathname || "/";
    if (!pathname.startsWith("/")) pathname = `/${pathname}`;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    return pathname || "/";
  } catch {
    let pathname = trimmed.split("?")[0] || "/";
    if (!pathname.startsWith("/")) pathname = `/${pathname}`;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    return pathname || "/";
  }
};

export const isLocale = (value?: string | null): value is Locale => {
  if (!value) return false;
  return SUPPORTED_LOCALES.includes(value.toLowerCase() as Locale);
};

export const resolveLocale = (value?: string | null): Locale | null =>
  isLocale(value) ? (value.toLowerCase() as Locale) : null;

export const getLocaleFromPath = (pathname?: string | null): Locale => {
  const normalized = normalizePath(pathname);
  if (normalized === "/") return DEFAULT_LOCALE;
  return normalized.startsWith(LOCALE_PREFIX.es) ? "es" : DEFAULT_LOCALE;
};

export const stripLocaleFromPath = (
  pathname?: string | null
): { locale: Locale; pathname: string } => {
  const normalized = normalizePath(pathname);
  const locale = getLocaleFromPath(normalized);
  if (locale === DEFAULT_LOCALE) return { locale, pathname: normalized };
  const withoutPrefix = normalized.slice(LOCALE_PREFIX.es.length) || "/";
  return { locale, pathname: withoutPrefix.startsWith("/") ? withoutPrefix : `/${withoutPrefix}` };
};

export const prefixPathWithLocale = (pathname: string, locale: Locale): string => {
  const normalized = normalizePath(pathname);
  if (locale === DEFAULT_LOCALE) {
    return stripLocaleFromPath(normalized).pathname;
  }
  const base = stripLocaleFromPath(normalized).pathname;
  if (base === "/") return LOCALE_PREFIX[locale];
  return `${LOCALE_PREFIX[locale]}${base}`;
};

export const swapLocaleInPath = (pathname: string, nextLocale: Locale): string => {
  const { pathname: basePath } = stripLocaleFromPath(pathname);
  return prefixPathWithLocale(basePath, nextLocale);
};
