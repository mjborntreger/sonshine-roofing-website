const SCHEMA_ORIGIN_FALLBACK = "https://sonshineroofing.com";

function normalizeOrigin(raw?: string | null): string | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(candidate);
    return trimTrailingSlash(`${url.protocol}//${url.host}`);
  } catch {
    return null;
  }
}

const envOrigin =
  typeof process !== "undefined"
    ? normalizeOrigin(process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL)
    : null;

export const SITE_ORIGIN = envOrigin || SCHEMA_ORIGIN_FALLBACK;
export const SITE_HOST = (() => {
  try {
    return new URL(SITE_ORIGIN).hostname.toLowerCase();
  } catch {
    return "sonshineroofing.com";
  }
})();

export const SITE_HOST_ALIASES = (() => {
  const bare = SITE_HOST.replace(/^www\./, "");
  const aliases = new Set<string>([SITE_HOST, bare]);
  aliases.add(`www.${bare}`);
  return aliases;
})();

export function isSiteHost(host?: string | null): boolean {
  if (!host) return false;
  const normalized = host.toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
  return SITE_HOST_ALIASES.has(normalized);
}

export function envFlagTrue(name: string): boolean {
  const raw = (process.env[name] || "").toString().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

export function isProdEnv(): boolean {
  return process.env.NEXT_PUBLIC_ENV === "production";
}

export function isPreviewEnabled(flagName: string): boolean {
  return !isProdEnv() && envFlagTrue(flagName);
}

export function isFeatureEnabled(flagName: string): boolean {
  return isProdEnv() || envFlagTrue(flagName);
}

export function previewRobotsHeader(flagName = "NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW"): Record<string, string> {
  return isPreviewEnabled(flagName) ? { "X-Robots-Tag": "noindex, nofollow" } : {};
}

export function sitemapEnabled() {
  return isFeatureEnabled("NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW");
}

export function sitemapPreviewHeaders() {
  return previewRobotsHeader("NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW");
}

export function requireEnv(
  name: string,
  { throwOnMissing = false, prodOnly = false }: { throwOnMissing?: boolean; prodOnly?: boolean } = {}
): string | undefined {
  const value = process.env[name];
  if (!value && (!prodOnly || isProdEnv())) {
    const message = `[env] Missing required environment variable: ${name}`;
    if (throwOnMissing && isProdEnv()) {
      throw new Error(message);
    }
    if (typeof console !== "undefined" && typeof console.error === "function") {
      console.error(message);
    }
  }
  return value;
}

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
