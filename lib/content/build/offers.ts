import type { SpecialOffer, SpecialOfferImage } from '../editorial-types';
import { sanitizeOfferHtml, offerHtmlToPlainText } from '../directus-offer-html.ts';
export type UnknownRecord = Record<string, unknown>;

export type DirectusFileValue =
  | string
  | {
      id?: unknown;
      description?: unknown;
      width?: unknown;
      height?: unknown;
    }
  | null;

export type DirectusSpecialOfferItem = {
  client?: unknown;
  title?: unknown;
  eyebrow?: unknown;
  introduction?: unknown;
  slug?: unknown;
  featured_image?: DirectusFileValue;
  offer_code?: unknown;
  discount?: unknown;
  description?: unknown;
  expiration_date?: unknown;
  legal_disclaimer?: unknown;
  status?: unknown;
  featured?: unknown;
  noindex?: unknown;
  meta_title?: unknown;
  meta_description?: unknown;
  primary_focus_keyword?: unknown;
  focus_keywords?: unknown;
  og_title?: unknown;
  og_description?: unknown;
  og_image_override?: DirectusFileValue;
  date_updated?: unknown;
};

export type DirectusConfig = {
  url: string;
  clientSlug: string;
  token: string;
};

export const SPECIAL_OFFER_FIELDS = [
  'client.slug',
  'title',
  'eyebrow',
  'introduction',
  'slug',
  'featured_image.id',
  'featured_image.description',
  'featured_image.width',
  'featured_image.height',
  'offer_code',
  'discount',
  'description',
  'expiration_date',
  'legal_disclaimer',
  'status',
  'featured',
  'noindex',
  'meta_title',
  'meta_description',
  'primary_focus_keyword',
  'focus_keywords',
  'og_title',
  'og_description',
  'og_image_override.id',
  'og_image_override.description',
  'og_image_override.width',
  'og_image_override.height',
  'date_updated',
] as const;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function readBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return false;
}

export function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function getAssetUrl(config: DirectusConfig, fileId: string): string {
  return `${config.url}/assets/${encodeURIComponent(fileId)}`;
}

export function mapFeaturedImage(
  value: DirectusFileValue,
  config: DirectusConfig,
): SpecialOfferImage | null {
  if (typeof value === 'string') {
    const id = readString(value);
    return id
      ? { id, url: getAssetUrl(config, id), altText: null, width: null, height: null }
      : null;
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const record = value as UnknownRecord;
  const id = readString(record.id);
  if (!id) return null;

  return {
    id,
    url: getAssetUrl(config, id),
    altText: readString(record.description),
    width: readNumber(record.width),
    height: readNumber(record.height),
  };
}

export function mapSpecialOffer(
  item: DirectusSpecialOfferItem,
  config: DirectusConfig,
): SpecialOffer | null {
  const slug = readString(item.slug);
  const title = readString(item.title);
  if (!slug || !title) return null;

  const eyebrow = readString(item.eyebrow);
  const introduction = readString(item.introduction);
  if (!eyebrow || !introduction) {
    throw new Error(`Published Directus special_offers hero copy is incomplete for ${slug}.`);
  }
  const descriptionHtml = sanitizeOfferHtml(readString(item.description) ?? '');

  const noindex = readBoolean(item.noindex);
  const primaryFocusKeyword = readString(item.primary_focus_keyword);
  const focusKeywords = Array.isArray(item.focus_keywords)
    ? item.focus_keywords
        .map((value) => readString(value))
        .filter((value): value is string => Boolean(value))
    : [];
  if (!noindex && (!primaryFocusKeyword || !focusKeywords.includes(primaryFocusKeyword))) {
    throw new Error(`Directus special_offers focus keywords are incomplete for ${slug}.`);
  }

  return {
    slug,
    title,
    eyebrow,
    introduction,
    description: offerHtmlToPlainText(descriptionHtml),
    descriptionHtml,
    featuredImage: mapFeaturedImage(item.featured_image ?? null, config),
    offerCode: readString(item.offer_code),
    discount: readString(item.discount),
    expirationDate: readString(item.expiration_date),
    legalDisclaimer: readString(item.legal_disclaimer),
    featured: readBoolean(item.featured),
    noindex,
    metaTitle: readString(item.meta_title),
    metaDescription: readString(item.meta_description),
    primaryFocusKeyword,
    focusKeywords,
    ogTitle: readString(item.og_title),
    ogDescription: readString(item.og_description),
    ogImageOverride: mapFeaturedImage(item.og_image_override ?? null, config),
    dateUpdated: readString(item.date_updated),
  };
}
