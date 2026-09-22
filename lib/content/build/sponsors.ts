import { sanitizeSponsorHtml } from '../directus-sponsor-html.ts';
import type { DirectusSponsorFeature } from '../editorial-types';
export type UnknownRecord = Record<string, unknown>;

export type DirectusConfig = {
  url: string;
  clientSlug: string;
  token: string;
};

export const DIRECTUS_FIELDS = [
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

export function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

export function readUrl(value: unknown, field: string, slug: string): string | null {
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

export function readServiceAreaSlugs(value: unknown, slug: string): string[] {
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

export function mapSponsorFeature(value: unknown, config: DirectusConfig): DirectusSponsorFeature {
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
