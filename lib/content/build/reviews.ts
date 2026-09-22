import type { Review } from '../../../components/reviews-widget/types';
import type { ReviewsCarouselSettings } from '../editorial-types';
export const DEFAULT_GOOGLE_BUSINESS_PROFILE_URL =
  'https://www.google.com/maps/place/SonShine+Roofing/data=!4m2!3m1!1s0x0:0x5318594fb175e958';

export type DirectusReviewItem = {
  author_name?: unknown;
  rating?: unknown;
  review_text?: unknown;
  review_date?: unknown;
  source_created_at?: unknown;
  url?: unknown;
};

export type DirectusReviewsCarouselItem = {
  limit?: unknown;
  gbp_profile_link?: unknown;
};

export const REVIEW_FIELDS = [
  'author_name',
  'rating',
  'review_text',
  'review_date',
  'source_created_at',
  'url',
] as const;

export const CAROUSEL_FIELDS = ['limit', 'gbp_profile_link'] as const;

export function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function readValidUrl(value: unknown): string | null {
  const raw = readString(value);
  if (!raw) return null;

  try {
    return new URL(raw).toString();
  } catch {
    return null;
  }
}

export function toEpochSeconds(sourceCreatedAt: unknown, reviewDate: unknown): number | null {
  const sourceTimestamp = readString(sourceCreatedAt);
  if (sourceTimestamp) {
    const timestamp = Date.parse(sourceTimestamp);
    if (Number.isFinite(timestamp)) return Math.floor(timestamp / 1000);
  }

  const date = readString(reviewDate);
  if (!date) return null;
  const timestamp = Date.parse(`${date}T12:00:00Z`);
  return Number.isFinite(timestamp) ? Math.floor(timestamp / 1000) : null;
}

export function mapReview(item: DirectusReviewItem): Review | null {
  const authorName = readString(item.author_name);
  const text = readString(item.review_text);
  const rating = readNumber(item.rating);
  if (!authorName || !text || rating !== 5) return null;

  return {
    author_name: authorName,
    author_url: readValidUrl(item.url),
    rating,
    text,
    time: toEpochSeconds(item.source_created_at, item.review_date),
  };
}

export function normalizeCarousel(items: DirectusReviewsCarouselItem[]): ReviewsCarouselSettings {
  if (items.length !== 1) {
    throw new Error(
      `Expected exactly one reviews_carousels record for the deployment client; found ${items.length}`,
    );
  }

  const item = items[0];
  const rawLimit = readNumber(item.limit);

  return {
    limit: rawLimit && rawLimit > 0 ? Math.floor(rawLimit) : 20,
    gbpProfileLink: readValidUrl(item.gbp_profile_link) ?? DEFAULT_GOOGLE_BUSINESS_PROFILE_URL,
  };
}
