import 'server-only';

import { sanitizeSponsorHtml } from '@/lib/content/directus-sponsor-html';
import type { WpImage } from '@/lib/content/wp';

const DIRECTUS_COLLECTION = 'sponsor_features';
const DIRECTUS_LIMIT = 100;

type UnknownRecord = Record<string, unknown>;

type DirectusConfig = {
  url: string;
  clientSlug: string;
  token: string;
};

type DirectusListResponse<T> = {
  data?: T[];
  errors?: Array<{ message?: string }>;
};

export type SponsorLinks = {
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
};

export type SponsorFeature = {
  id: string;
  slug: string;
  title: string | null;
  contentHtml: string | null;
  links: SponsorLinks | null;
  featuredImage: WpImage | null;
};

type DirectusSponsorFeature = SponsorFeature & {
  serviceAreaSlugs: string[];
};

const DIRECTUS_FIELDS = [
  'id',
  'slug',
  'title',
  'description',
  'website_url',
  'facebook_url',
  'instagram_url',
  'service_area_slugs',
  'sort',
  'logo.id',
  'logo.description',
  'logo.width',
  'logo.height',
] as const;

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function getDirectusConfig(): DirectusConfig {
  const url = readString(process.env.DIRECTUS_URL)?.replace(/\/+$/, '');
  const clientSlug = readString(process.env.DIRECTUS_CLIENT_SLUG);
  const token =
    readString(process.env.DIRECTUS_TOKEN) ?? readString(process.env.DIRECTUS_STATIC_TOKEN);

  if (!url || !clientSlug || !token) {
    throw new Error(
      '[sponsor-features] DIRECTUS_URL, DIRECTUS_CLIENT_SLUG, and DIRECTUS_TOKEN or DIRECTUS_STATIC_TOKEN are required.',
    );
  }

  return { url, clientSlug, token };
}

function readUrl(value: unknown, field: string, slug: string): string | null {
  const raw = readString(value);
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:')
      throw new Error('unsupported scheme');
    return raw;
  } catch {
    throw new Error(`[sponsor-features] Invalid ${field} for ${slug}.`);
  }
}

function readServiceAreaSlugs(value: unknown, slug: string): string[] {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`[sponsor-features] service_area_slugs must be an array for ${slug}.`);
  }

  const normalized = value.map((entry) => {
    const serviceAreaSlug = readString(entry)?.toLowerCase();
    if (!serviceAreaSlug) {
      throw new Error(`[sponsor-features] Empty service-area slug for ${slug}.`);
    }
    return serviceAreaSlug;
  });

  return [...new Set(normalized)];
}

function mapSponsorFeature(value: unknown, config: DirectusConfig): DirectusSponsorFeature {
  const item = asRecord(value);
  const id = readString(item?.id);
  const slug = readString(item?.slug);
  const title = readString(item?.title);
  const description = readString(item?.description);
  const logo = asRecord(item?.logo);
  const logoId = readString(logo?.id);
  const logoDescription = readString(logo?.description);

  if (!id || !slug || !title || !description || !logoId) {
    throw new Error('[sponsor-features] A published sponsor is missing a required field.');
  }
  if (!logoDescription) {
    throw new Error(
      `[sponsor-features] Directus logo ${logoId} is missing its required description.`,
    );
  }

  const contentHtml = sanitizeSponsorHtml(description);
  if (!contentHtml) {
    throw new Error(`[sponsor-features] Description is empty after sanitization for ${slug}.`);
  }

  const facebookUrl = readUrl(item?.facebook_url, 'facebook_url', slug);
  const instagramUrl = readUrl(item?.instagram_url, 'instagram_url', slug);
  const websiteUrl = readUrl(item?.website_url, 'website_url', slug);

  return {
    id,
    slug,
    title,
    contentHtml,
    links:
      facebookUrl || instagramUrl || websiteUrl ? { facebookUrl, instagramUrl, websiteUrl } : null,
    featuredImage: {
      url: `${config.url}/assets/${encodeURIComponent(logoId)}`,
      altText: logoDescription,
      width: typeof logo?.width === 'number' ? logo.width : null,
      height: typeof logo?.height === 'number' ? logo.height : null,
    },
    serviceAreaSlugs: readServiceAreaSlugs(item?.service_area_slugs, slug),
  };
}

async function listPublishedSponsorFeatures(): Promise<DirectusSponsorFeature[]> {
  const config = getDirectusConfig();
  const url = new URL(`items/${DIRECTUS_COLLECTION}`, `${config.url}/`);
  url.searchParams.set('fields', DIRECTUS_FIELDS.join(','));
  url.searchParams.set(
    'filter',
    JSON.stringify({
      client: { slug: { _eq: config.clientSlug } },
      status: { _eq: 'published' },
    }),
  );
  url.searchParams.set('sort', 'sort,title');
  url.searchParams.set('limit', String(DIRECTUS_LIMIT));

  const response = await fetch(url, {
    cache: 'force-cache',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${config.token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`[sponsor-features] Directus HTTP ${response.status} ${response.statusText}.`);
  }

  const payload = (await response.json()) as DirectusListResponse<UnknownRecord>;
  if (payload.errors?.length) {
    throw new Error(
      payload.errors
        .map((error) => error.message)
        .filter(Boolean)
        .join('; ') || '[sponsor-features] Directus returned an error.',
    );
  }

  return (payload.data ?? []).map((item) => mapSponsorFeature(item, config));
}

function dedupeSponsorFeatures(features: DirectusSponsorFeature[]): DirectusSponsorFeature[] {
  const seen = new Set<string>();
  return features.filter((feature) => {
    const key = feature.slug || feature.id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toPublicSponsorFeature(feature: DirectusSponsorFeature): SponsorFeature {
  const { serviceAreaSlugs: _serviceAreaSlugs, ...publicFeature } = feature;
  return publicFeature;
}

export async function listSponsorFeaturesByServiceArea(
  serviceAreaSlugs: string[] | string | null | undefined,
  {
    primaryLimit = 8,
    fallbackLimit = 4,
    minimum = 4,
  }: {
    primaryLimit?: number;
    fallbackLimit?: number;
    minimum?: number;
  } = {},
): Promise<SponsorFeature[]> {
  const normalizedSlugs = (Array.isArray(serviceAreaSlugs) ? serviceAreaSlugs : [serviceAreaSlugs])
    .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
    .filter(Boolean);
  const requestedSlugs = new Set(normalizedSlugs);
  const allFeatures = await listPublishedSponsorFeatures();
  const primary = requestedSlugs.size
    ? allFeatures
        .filter((feature) => feature.serviceAreaSlugs.some((slug) => requestedSlugs.has(slug)))
        .slice(0, primaryLimit)
    : [];

  if (primary.length >= minimum) return primary.map(toPublicSponsorFeature);

  const fallback = allFeatures.slice(0, Math.max(fallbackLimit, minimum));
  return dedupeSponsorFeatures([...primary, ...fallback]).map(toPublicSponsorFeature);
}
