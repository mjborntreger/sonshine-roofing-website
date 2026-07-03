import { isProdEnv } from "@/lib/seo/site";
import { isSpecialOfferExpired, parseSpecialOfferDate } from "@/lib/lead-capture/specialOfferDates";

const DIRECTUS_COLLECTION = "special_offers";
const DIRECTUS_REVALIDATE_SECONDS = 900;

type UnknownRecord = Record<string, unknown>;

type DirectusFileValue =
  | string
  | {
      id?: unknown;
      description?: unknown;
      width?: unknown;
      height?: unknown;
    }
  | null;

type DirectusSpecialOfferItem = {
  client?: unknown;
  title?: unknown;
  slug?: unknown;
  featured_image?: DirectusFileValue;
  offer_code?: unknown;
  discount?: unknown;
  description?: unknown;
  expiration_date?: unknown;
  legal_disclaimer?: unknown;
  status?: unknown;
  featured?: unknown;
};

type DirectusListResponse<T> = {
  data?: T[];
  errors?: Array<{ message?: string }>;
};

type DirectusConfig = {
  url: string;
  clientSlug: string;
  token: string;
};

export type SpecialOfferImage = {
  id: string;
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type SpecialOffer = {
  slug: string;
  title: string;
  description: string;
  featuredImage: SpecialOfferImage | null;
  offerCode: string | null;
  discount: string | null;
  expirationDate: string | null;
  legalDisclaimer: string | null;
  featured: boolean;
};

const SPECIAL_OFFER_FIELDS = [
  "client.slug",
  "title",
  "slug",
  "featured_image.id",
  "featured_image.description",
  "featured_image.width",
  "featured_image.height",
  "offer_code",
  "discount",
  "description",
  "expiration_date",
  "legal_disclaimer",
  "status",
  "featured",
] as const;

let warnedForMissingConfig = false;

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function readBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getDirectusConfig(): DirectusConfig | null {
  const url = readString(process.env.DIRECTUS_URL);
  const clientSlug = readString(process.env.DIRECTUS_CLIENT_SLUG);
  const token = readString(process.env.DIRECTUS_TOKEN);

  if (!url || !clientSlug || !token) {
    if (!warnedForMissingConfig && isProdEnv()) {
      console.error("[directus] Missing DIRECTUS_URL, DIRECTUS_CLIENT_SLUG, or DIRECTUS_TOKEN.");
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

function mapFeaturedImage(value: DirectusFileValue, config: DirectusConfig): SpecialOfferImage | null {
  if (typeof value === "string") {
    const id = readString(value);
    return id ? { id, url: getAssetUrl(config, id), altText: null, width: null, height: null } : null;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

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

function mapSpecialOffer(item: DirectusSpecialOfferItem, config: DirectusConfig): SpecialOffer | null {
  const slug = readString(item.slug);
  const title = readString(item.title);
  if (!slug || !title) return null;

  return {
    slug,
    title,
    description: readString(item.description) ?? "",
    featuredImage: mapFeaturedImage(item.featured_image ?? null, config),
    offerCode: readString(item.offer_code),
    discount: readString(item.discount),
    expirationDate: readString(item.expiration_date),
    legalDisclaimer: readString(item.legal_disclaimer),
    featured: readBoolean(item.featured),
  };
}

function compareFeaturedOffers(a: SpecialOffer, b: SpecialOffer): number {
  const aDate = a.expirationDate ? parseSpecialOfferDate(a.expirationDate) : null;
  const bDate = b.expirationDate ? parseSpecialOfferDate(b.expirationDate) : null;
  const aTime = aDate ? aDate.getTime() : Number.POSITIVE_INFINITY;
  const bTime = bDate ? bDate.getTime() : Number.POSITIVE_INFINITY;
  if (aTime !== bTime) return aTime - bTime;
  return a.slug.localeCompare(b.slug);
}

type FetchSpecialOffersOptions = {
  filter?: UnknownRecord;
  sort?: string[];
  limit?: number;
};

async function fetchSpecialOfferItems({
  filter = {},
  sort,
  limit = 100,
}: FetchSpecialOffersOptions = {}): Promise<SpecialOffer[]> {
  const config = getDirectusConfig();
  if (!config) return [];

  const url = new URL(`items/${DIRECTUS_COLLECTION}`, `${config.url}/`);
  url.searchParams.set("fields", SPECIAL_OFFER_FIELDS.join(","));
  url.searchParams.set(
    "filter",
    JSON.stringify({
      client: { slug: { _eq: config.clientSlug } },
      status: {
        _eq: "published",
      },
      ...filter,
    }),
  );
  url.searchParams.set("limit", String(limit));
  if (sort?.length) {
    url.searchParams.set("sort", sort.join(","));
  }

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${config.token}`,
    },
    next: { revalidate: DIRECTUS_REVALIDATE_SECONDS },
  });

  if (!res.ok) {
    throw new Error(`Directus special_offers HTTP ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as DirectusListResponse<DirectusSpecialOfferItem>;
  if (json.errors?.length) {
    throw new Error(json.errors.map((error) => error.message).filter(Boolean).join("; ") || "Directus responded with an error");
  }

  return (json.data ?? [])
    .map((item) => mapSpecialOffer(item, config))
    .filter((offer): offer is SpecialOffer => Boolean(offer));
}

export async function listSpecialOfferSlugs(limit = 100): Promise<string[]> {
  const offers = await fetchSpecialOfferItems({
    limit,
    sort: ["slug"],
  });

  return offers.map((offer) => offer.slug);
}

export async function getSpecialOfferBySlug(slug: string): Promise<SpecialOffer | null> {
  const trimmedSlug = readString(slug);
  if (!trimmedSlug) return null;

  const offers = await fetchSpecialOfferItems({
    filter: { slug: { _eq: trimmedSlug } },
    limit: 1,
  });

  return offers[0] ?? null;
}

export async function getFeaturedSpecialOffer(): Promise<SpecialOffer | null> {
  const offers = await fetchSpecialOfferItems({
    filter: { featured: { _eq: true } },
    sort: ["expiration_date", "slug"],
    limit: 25,
  });

  return offers
    .filter((offer) => !isSpecialOfferExpired(offer.expirationDate))
    .sort(compareFeaturedOffers)[0] ?? null;
}
