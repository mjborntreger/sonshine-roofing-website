const SCHEMA_ORIGIN_FALLBACK = "https://sonshineroofing.com";

const envOrigin = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_BASE_URL : undefined;
const normalizedEnvOrigin = envOrigin ? trimTrailingSlash(envOrigin.trim()) : null;

export const SITE_ORIGIN = normalizedEnvOrigin || SCHEMA_ORIGIN_FALLBACK;

type HeaderSource = {
  get(name: string): string | null | undefined;
};

export function resolveSiteOrigin(headers?: HeaderSource | null): string {
  if (!headers) return SITE_ORIGIN;

  const host = headers.get("x-forwarded-host") || headers.get("host");
  if (!host) return SITE_ORIGIN;

  const protocol =
    headers.get("x-forwarded-proto") ||
    (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");

  return `${protocol}://${host}`;
}

export function ensureAbsoluteUrl(input: string, origin = SITE_ORIGIN): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimTrailingSlash(trimmed);
  }

  if (!trimmed) return origin;

  const leadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${origin}${leadingSlash}`;
}

export function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.replace(/\/+$/, "") : value;
}

