import type { Review, ReviewOwnerImage } from "@/components/reviews-widget/types";
import { isProdEnv } from "@/lib/seo/site";

const REVIEWS_COLLECTION = "reviews";
const CAROUSELS_COLLECTION = "reviews_carousels";

export const DEFAULT_GOOGLE_BUSINESS_PROFILE_URL =
  "https://www.google.com/maps/place/SonShine+Roofing/data=!4m2!3m1!1s0x0:0x5318594fb175e958";

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

type DirectusFileValue =
  | string
  | {
      id?: unknown;
      description?: unknown;
      width?: unknown;
      height?: unknown;
    }
  | null;

type DirectusReviewItem = {
  author_name?: unknown;
  rating?: unknown;
  review_text?: unknown;
  owner_reply?: unknown;
  review_date?: unknown;
  source_created_at?: unknown;
  url?: unknown;
};

type DirectusReviewsCarouselItem = {
  limit?: unknown;
  gbp_profile_link?: unknown;
  owner_headshot?: DirectusFileValue;
};

export type ReviewsCarouselSettings = {
  limit: number;
  gbpProfileLink: string;
  ownerHeadshot: ReviewOwnerImage | null;
};

const REVIEW_FIELDS = [
  "author_name",
  "rating",
  "review_text",
  "owner_reply",
  "review_date",
  "source_created_at",
  "url",
] as const;

const CAROUSEL_FIELDS = [
  "limit",
  "gbp_profile_link",
  "owner_headshot.id",
  "owner_headshot.description",
  "owner_headshot.width",
  "owner_headshot.height",
] as const;

let warnedForMissingConfig = false;

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function getDirectusConfig(): DirectusConfig | null {
  const url = readString(process.env.DIRECTUS_URL);
  const clientSlug = readString(process.env.DIRECTUS_CLIENT_SLUG);
  const token = readString(process.env.DIRECTUS_TOKEN);

  if (!url || !clientSlug || !token) {
    if (!warnedForMissingConfig && isProdEnv()) {
      console.error("[directus-reviews] Missing DIRECTUS_URL, DIRECTUS_CLIENT_SLUG, or DIRECTUS_TOKEN.");
      warnedForMissingConfig = true;
    }
    return null;
  }

  return {
    url: trimTrailingSlash(url),
    clientSlug,
    token,
  };
}

function getAssetUrl(config: DirectusConfig, fileId: string): string {
  return `${config.url}/assets/${encodeURIComponent(fileId)}`;
}

function readValidUrl(value: unknown): string | null {
  const raw = readString(value);
  if (!raw) return null;

  try {
    return new URL(raw).toString();
  } catch {
    return null;
  }
}

function mapOwnerHeadshot(value: DirectusFileValue, config: DirectusConfig): ReviewOwnerImage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const record = value as UnknownRecord;
  const id = readString(record.id);
  const altText = readString(record.description);
  if (!id || !altText) return null;

  return {
    url: getAssetUrl(config, id),
    altText,
    width: readNumber(record.width),
    height: readNumber(record.height),
  };
}

function toEpochSeconds(sourceCreatedAt: unknown, reviewDate: unknown): number | null {
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

function mapReview(item: DirectusReviewItem): Review | null {
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
    ownerReply: readString(item.owner_reply),
  };
}

async function fetchDirectusItems<T>(
  config: DirectusConfig,
  collection: string,
  fields: readonly string[],
  options: {
    filter: UnknownRecord;
    sort?: string[];
    limit: number;
  },
): Promise<T[]> {
  const url = new URL(`items/${collection}`, `${config.url}/`);
  url.searchParams.set("fields", fields.join(","));
  url.searchParams.set("filter", JSON.stringify(options.filter));
  url.searchParams.set("limit", String(options.limit));
  if (options.sort?.length) url.searchParams.set("sort", options.sort.join(","));

  const response = await fetch(url, {
    cache: "force-cache",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${config.token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Directus ${collection} HTTP ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as DirectusListResponse<T>;
  if (json.errors?.length) {
    throw new Error(
      json.errors.map((error) => error.message).filter(Boolean).join("; ") ||
        `Directus ${collection} request failed`,
    );
  }

  return json.data ?? [];
}

export async function getGoogleReviews(): Promise<Review[]> {
  const config = getDirectusConfig();
  if (!config) return [];

  const items = await fetchDirectusItems<DirectusReviewItem>(
    config,
    REVIEWS_COLLECTION,
    REVIEW_FIELDS,
    {
      filter: {
        client: { slug: { _eq: config.clientSlug } },
        status: { _eq: "published" },
        source: { _eq: "Google" },
        rating: { _eq: 5 },
        external_id: { _nnull: true },
      },
      sort: ["sort_order", "-source_created_at", "-review_date"],
      limit: 100,
    },
  );

  return items.map(mapReview).filter((review): review is Review => Boolean(review));
}

export async function getReviewsCarouselSettings(): Promise<ReviewsCarouselSettings | null> {
  const config = getDirectusConfig();
  if (!config) return null;

  const items = await fetchDirectusItems<DirectusReviewsCarouselItem>(
    config,
    CAROUSELS_COLLECTION,
    CAROUSEL_FIELDS,
    {
      filter: { client: { slug: { _eq: config.clientSlug } } },
      limit: 2,
    },
  );

  if (items.length !== 1) {
    throw new Error(
      `Expected exactly one reviews_carousels record for ${config.clientSlug}; found ${items.length}`,
    );
  }

  const item = items[0];
  const rawLimit = readNumber(item.limit);

  return {
    limit: rawLimit && rawLimit > 0 ? Math.floor(rawLimit) : 20,
    gbpProfileLink: readValidUrl(item.gbp_profile_link) ?? DEFAULT_GOOGLE_BUSINESS_PROFILE_URL,
    ownerHeadshot: mapOwnerHeadshot(item.owner_headshot ?? null, config),
  };
}
