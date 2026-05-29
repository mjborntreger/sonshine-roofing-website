import { readCookie, writeCookie } from '@/lib/telemetry/client-cookies';

export const LEAD_ATTRIBUTION_STORAGE_KEY = 'ss_lead_attribution_v1';
export const LEAD_ATTRIBUTION_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export const CLICK_ID_FIELDS = ['gclid', 'gbraid', 'wbraid'] as const;
export const UTM_FIELDS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;
export const ATTRIBUTION_QUERY_FIELDS = [...CLICK_ID_FIELDS, ...UTM_FIELDS] as const;

export type ClickIdField = (typeof CLICK_ID_FIELDS)[number];
export type UtmField = (typeof UTM_FIELDS)[number];
export type AttributionQueryField = (typeof ATTRIBUTION_QUERY_FIELDS)[number];

export type LeadAttribution = Partial<Record<AttributionQueryField, string>> & {
  landing_page?: string;
  referrer?: string;
  capturedAt: string;
  expiresAt: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalize = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
};

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function parseAttribution(raw: string | null): LeadAttribution | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (!isRecord(parsed)) return null;

    const capturedAt = normalize(parsed.capturedAt);
    const expiresAt = normalize(parsed.expiresAt);
    if (!capturedAt || !expiresAt) return null;
    if (new Date(expiresAt).getTime() <= Date.now()) return null;

    const next: LeadAttribution = { capturedAt, expiresAt };
    for (const field of ATTRIBUTION_QUERY_FIELDS) {
      const value = normalize(parsed[field]);
      if (value) next[field] = value;
    }

    const landingPage = normalize(parsed.landing_page);
    const referrer = normalize(parsed.referrer);
    if (landingPage) next.landing_page = landingPage;
    if (referrer) next.referrer = referrer;

    return next;
  } catch {
    return null;
  }
}

export function hasClickId(attribution: Partial<Record<ClickIdField, string>> | null | undefined): boolean {
  return Boolean(attribution?.gclid || attribution?.gbraid || attribution?.wbraid);
}

export function readLeadAttribution(): LeadAttribution | null {
  const local = getStorage();
  const localValue = local ? parseAttribution(local.getItem(LEAD_ATTRIBUTION_STORAGE_KEY)) : null;
  if (localValue) return localValue;
  return parseAttribution(readCookie(LEAD_ATTRIBUTION_STORAGE_KEY));
}

export function writeLeadAttribution(attribution: LeadAttribution) {
  const serialized = JSON.stringify(attribution);
  const local = getStorage();
  try {
    local?.setItem(LEAD_ATTRIBUTION_STORAGE_KEY, serialized);
  } catch {
    // ignore storage write failures
  }
  writeCookie(LEAD_ATTRIBUTION_STORAGE_KEY, serialized, LEAD_ATTRIBUTION_MAX_AGE);
}

function currentUrlWithoutHash(): string | null {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  url.hash = '';
  return url.toString();
}

function buildAttributionFromSearch(searchParams: URLSearchParams): Partial<Record<AttributionQueryField, string>> {
  const next: Partial<Record<AttributionQueryField, string>> = {};
  for (const field of ATTRIBUTION_QUERY_FIELDS) {
    const value = normalize(searchParams.get(field));
    if (value) next[field] = value;
  }
  return next;
}

export function captureLeadAttributionFromCurrentUrl(): LeadAttribution | null {
  if (typeof window === 'undefined') return null;

  const url = new URL(window.location.href);
  const tracked = buildAttributionFromSearch(url.searchParams);
  const hasTrackedParams = Object.keys(tracked).length > 0;
  const existing = readLeadAttribution();

  if (!hasTrackedParams && existing) return existing;

  const landingPage = currentUrlWithoutHash();
  if (!landingPage) return existing;

  if (!hasTrackedParams && !existing) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + LEAD_ATTRIBUTION_MAX_AGE * 1000);
    const organic: LeadAttribution = {
      capturedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      landing_page: landingPage,
      referrer: document.referrer || undefined,
    };
    writeLeadAttribution(organic);
    return organic;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + LEAD_ATTRIBUTION_MAX_AGE * 1000);
  const next: LeadAttribution = {
    ...tracked,
    capturedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    landing_page: landingPage,
    referrer: document.referrer || undefined,
  };
  writeLeadAttribution(next);
  return next;
}

export function getLeadAttributionForSubmit(): LeadAttribution | null {
  return captureLeadAttributionFromCurrentUrl() ?? readLeadAttribution();
}
