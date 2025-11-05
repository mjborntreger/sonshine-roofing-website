import { cache } from "react";
import { faqSchema, videoObjectSchema } from "@/lib/seo/schema";
import { SITE_ORIGIN, ensureAbsoluteUrl } from "@/lib/seo/site";
import type { PageInfo, PageResult } from "../ui/pagination";

type Json = Record<string, unknown>;

type Maybe<T> = T | null | undefined;

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asRecord = (value: unknown): UnknownRecord | null =>
  isRecord(value) ? (value as UnknownRecord) : null;

const asArray = <T = unknown>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const extractSlugList = (value: unknown): string[] =>
  asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return record ? toStringSafe(record.slug) : "";
    })
    .filter((slug) => slug.length > 0);

const extractNodes = (value: unknown): unknown[] => {
  const record = asRecord(value);
  return record ? asArray(record.nodes) : [];
};

const extractNode = (value: unknown, key = 'node'): unknown => {
  const record = asRecord(value);
  return record ? record[key] : undefined;
};

const toImageNode = (value: unknown): Maybe<ImageNode> => {
  const record = asRecord(value);
  return record as ImageNode | null;
};

const pickImageFrom = (value: unknown): WpImage | null => pickImage(toImageNode(extractNode(value)));

const mapTermNodes = (value: unknown): TermLite[] =>
  mapTerms(extractNodes(value) as Maybe<TermNode>[]);

const toStringSafe = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
};

const stringOrNull = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const readTrimmedString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const readProjectDescription = (details: unknown): string | null => {
  const record = asRecord(details);
  const raw = record?.projectDescription;
  return typeof raw === "string" ? raw : null;
};

const readProjectTestimonial = (details: unknown): ProjectTestimonial | null => {
  const record = asRecord(details);
  const testimonial = asRecord(record?.customerTestimonial);
  if (!testimonial) return null;

  const customerReview = readTrimmedString(testimonial.customerReview);
  if (!customerReview) return null;

  const customerName = readTrimmedString(testimonial.customerName) ?? undefined;
  const ownerReply = readTrimmedString(testimonial.ownerReply) ?? undefined;
  const reviewDate = readTrimmedString(testimonial.reviewDate) ?? undefined;
  const reviewUrlRaw = readTrimmedString(testimonial.reviewUrl);
  const reviewUrl = reviewUrlRaw ? ensureAbsoluteUrl(reviewUrlRaw, SITE_ORIGIN) : undefined;

  return {
    customerName,
    customerReview,
    ownerReply,
    reviewUrl,
    reviewDate,
  };
};

const readRecordString = (record: UnknownRecord | null, key: string): string | null => {
  if (!record) return null;
  const value = record[key];
  return typeof value === "string" ? value : null;
};

// ----- Endpoint & Auth -----
const WP_ENDPOINT =
  process.env.NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT ||
  "https://next.sonshineroofing.com/graphql";

// Server-only env vars (keep these secret)
const WP_USER = process.env.WP_BASIC_AUTH_USER;
const WP_PASS = process.env.WP_BASIC_AUTH_PASS;

// Base path of your CPT permalinks. Keep in sync with ACF CPT rewrite.
const PROJECT_BASE = process.env.WP_PROJECT_BASE || "project";

// Utility to build a project URI that WPGraphQL understands.
const buildProjectUri = (slug: string) => `/${PROJECT_BASE}/${slug}/`;

// Optional: toggle verbose error surface while developing
const WP_VERBOSE_ERRORS = process.env.NODE_ENV !== "production";

// ----- Types -----
export type WpImage = { url: string; altText: string; width?: number | null; height?: number | null };

export type TermLite = { name: string; slug: string };

export type ProductLink = { productName: string; productLink: string | null };

export type ProjectTestimonial = {
  customerName?: string;
  customerReview: string;
  ownerReply?: string;
  reviewUrl?: string;
  reviewDate?: string;
};

export type ProjectSummary = {
  slug: string;
  uri: string;
  title: string;
  year: number | null;
  /** Optional ISO publish date (used for recency sorting) */
  date?: string | null;
  heroImage: WpImage | null;
  /** Short description for client-side search (from ACF projectDetails.projectDescription) */
  projectDescription?: string | null;
  /** Optional taxonomy terms to enable client-side filtering */
  materialTypes?: TermLite[];
  /** Additional taxonomies for client-side filtering */
  roofColors?: TermLite[];
  serviceAreas?: TermLite[];
};

export type ProjectFull = ProjectSummary & {
  contentHtml: string;
  /** Full ISO date (publish date) */
  date?: string | null;
  /** ISO last-modified date */
  modified?: string | null;
  projectDescription: string | null;
  productLinks: ProductLink[];
  projectImages: WpImage[];
  materialTypes: TermLite[];
  roofColors: TermLite[];
  serviceAreas: TermLite[];
  youtubeUrl?: string | null;
  customerTestimonial?: ProjectTestimonial | null;
  /** RankMath SEO block for OG/Twitter + JSON-LD mapping */
  seo?: {
    title?: string | null;
    description?: string | null;
    canonicalUrl?: string | null;
    openGraph?: {
      title?: string | null;
      description?: string | null;
      type?: string | null;
      image?: {
        url?: string | null;
        secureUrl?: string | null;
        width?: number | null;
        height?: number | null;
        type?: string | null;
      } | null;
    } | null;
  };
};

export type PostCard = {
  slug: string;
  title: string;
  date: string; // ISO
  featuredImage?: { url: string; altText?: string | null };
  categories: string[];
  readingTimeMinutes?: number;
  categoryTerms?: TermLite[];
  excerpt?: string;
  contentPlain?: string;
};

export type PostLite = {
  slug: string;
  title: string;
  date: string | null;
  featuredImage?: WpImage | null;
  categories: TermLite[];
  excerpt?: string | null;
  contentPlain?: string | null;
};

export type Post = {
  slug: string;
  title: string;
  contentHtml: string;
  date: string; // ISO
  modified?: string; // ISO (last modified)
  authorName?: string | null;
  featuredImage?: { url: string; altText?: string | null };
  categories: string[];
  categoryTerms?: TermLite[];
  /** Optional short HTML excerpt (rendered), useful for previews & SEO fallbacks */
  excerpt?: string;
  /** RankMath SEO (as exposed by WPGraphQL Rank Math) */
  seo?: {
    title?: string | null;
    description?: string | null;
    canonicalUrl?: string | null;
    openGraph?: {
      title?: string | null;
      description?: string | null;
      type?: string | null;
      image?: {
        url?: string | null;
        secureUrl?: string | null;
        width?: number | null;
        height?: number | null;
        type?: string | null;
      } | null;
    } | null;
  };
};

export type VideoItem = {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeId: string;
  thumbnailUrl: string;
  source: "video_entry" | "project";
  slug?: string;         // for projects (link to project page)
  date?: string;
  categories: { name: string; slug?: string }[];
  /** Optional short description for client-side search */
  excerpt?: string | null;
  /** Optional taxonomy terms (for project-sourced videos) */
  materialTypes?: TermLite[];
  serviceAreas?: TermLite[];
  featuredImage?: { url?: string | null } | null;
  seo?: {
    title?: string | null;
    description?: string | null;
    canonicalUrl?: string | null;
    openGraph?: {
      title?: string | null;
      description?: string | null;
      type?: string | null;
      image?: {
        url?: string | null;
        secureUrl?: string | null;
        width?: number | null;
        height?: number | null;
        type?: string | null;
      } | null;
    } | null;
  };
};

export type VideoBucketKey = "roofing-project" | "commercials" | "accolades" | "explainers" | "other";

export type Person = {
  slug: string;
  title: string; // (name)
  contentHtml: string;
  featuredImage: WpImage | null;
  positionTitle?: string | null;
};

// === Location Types === //
export type LocationNeighborhood = {
  neighborhood: string | null;
  neighborhoodDescription: string | null;
  zipCodes: string[];
  neighborhoodImage: WpImage | null;
};
export type LocationFaqItem = { question: string | null; answer: string | null };
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
export type LocationRecord = {
  slug: string;
  title: string;
  contentHtml: string;
  date: string | null;
  modified: string | null;
  locationName: string | null;
  nearbyLandmarks: string[];
  mapImage: WpImage | null;
  featuredReviews: {
    reviewAuthor: string | null;
    review: string | null;
    ownerReply: string | null;
    reviewUrl: string | null;
    reviewDate: string | null;
  }[];
  neighborhoodsServed: LocationNeighborhood[];
  seo?: {
    title?: string | null;
    description?: string | null;
    canonicalUrl?: string | null;
    openGraph?: {
      title?: string | null;
      description?: string | null;
      type?: string | null;
      image?: {
        url?: string | null;
        secureUrl?: string | null;
        width?: number | null;
        height?: number | null;
        type?: string | null;
      } | null;
    } | null;
  };
};

// ----- Locations -----

export async function getLocationBySlug(slug: string): Promise<LocationRecord | null> {
  const query = /* GraphQL */ `
    query LocationBySlug($slug: ID!) {
      location(id: $slug, idType: SLUG) {
        slug
        title
        content(format: RENDERED)
        date
        modified
        locationAttributes {
          locationName
          nearbyLandmarks {
            landmark
          }
          map {
            node {
              sourceUrl
              altText
            }
          }
          featuredReviews {
            reviewAuthor
            review
            ownerReply
            reviewUrl
            reviewDate
          }
          neighborhoodsServed {
            neighborhood
            neighborhoodDescription
            zipCodes {
              zipCode
            }
            neighborhoodImage {
              node {
                sourceUrl
                altText
              }
            }
          }
        }
        seo {
          title
          description
          canonicalUrl
          openGraph {
            title
            description
            type
            image {
              url
              secureUrl
              width
              height
              type
            }
          }
        }
      }
    }
  `;

  const data = await wpFetch<{ location?: UnknownRecord | null }>(query, { slug }, 600);
  const node = asRecord(data?.location);
  if (!node) return null;

  const attrs = asRecord(node.locationAttributes);

  const nearbyLandmarks = asArray(attrs?.nearbyLandmarks)
    .map((item) => toStringSafe(asRecord(item)?.landmark))
    .filter((landmark) => landmark.length > 0);

  const mapImage = pickImageFrom(attrs?.map);

  const featuredReviews = asArray(attrs?.featuredReviews).map((item) => {
    const review = asRecord(item);
    return {
      reviewAuthor: stringOrNull(review?.reviewAuthor),
      review: stringOrNull(review?.review),
      ownerReply: stringOrNull(review?.ownerReply),
      reviewUrl: stringOrNull(review?.reviewUrl),
      reviewDate: stringOrNull(review?.reviewDate),
    };
  });

  const neighborhoodsServed = asArray(attrs?.neighborhoodsServed).map((item) => {
    const record = asRecord(item);
    const zipCodes = asArray(record?.zipCodes)
      .map((zip) => toStringSafe(asRecord(zip)?.zipCode))
      .filter((zip) => zip.length > 0);

    return {
      neighborhood: stringOrNull(record?.neighborhood),
      neighborhoodDescription: stringOrNull(record?.neighborhoodDescription),
      zipCodes,
      neighborhoodImage: pickImageFrom(record?.neighborhoodImage),
    };
  });

  return {
    slug: toStringSafe(node.slug) || slug,
    title: toStringSafe(node.title),
    contentHtml: toStringSafe(node.content),
    date: stringOrNull(node.date),
    modified: stringOrNull(node.modified),
    locationName: stringOrNull(attrs?.locationName),
    nearbyLandmarks,
    mapImage,
    featuredReviews,
    neighborhoodsServed,
    seo: isRecord(node.seo) ? (node.seo as LocationRecord["seo"]) : undefined,
  };
}

export const listLocationSlugs = cache(async (limit = 500): Promise<string[]> => {
  const query = /* GraphQL */ `
    query ListLocationSlugs($first: Int!, $after: String) {
      locations(
        first: $first
        after: $after
        where: { status: PUBLISH, orderby: { field: MODIFIED, order: DESC } }
      ) {
        pageInfo { hasNextPage endCursor }
        nodes { slug }
      }
    }
  `;

  const pageSize = Math.min(200, Math.max(1, limit));
  const slugs: string[] = [];
  let after: string | null = null;

  do {
    const variables: { first: number; after?: string | null } = after
      ? { first: pageSize, after }
      : { first: pageSize };

    const data = await wpFetch<{
      locations: {
        pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
        nodes?: UnknownRecord[];
      };
    }>(query, variables, 3600);

    const nodes = data?.locations?.nodes ?? [];
    for (const node of nodes) {
      const record = asRecord(node);
      const slug = record ? toStringSafe(record.slug).trim() : "";
      if (slug) {
        slugs.push(slug);
        if (slugs.length >= limit) break;
      }
    }
    if (slugs.length >= limit) break;

    const pageInfo = data?.locations?.pageInfo;
    const nextCursor = toStringSafe(pageInfo?.endCursor).trim();
    after = pageInfo?.hasNextPage && nextCursor ? nextCursor : null;
  } while (after);

  return slugs;
});

const mapSponsorFeatureNode = (node: UnknownRecord | null | undefined): SponsorFeature | null => {
  if (!node) return null;
  const attributes = asRecord(node.sponsorFeatureAttributes);
  const links = asRecord(attributes?.links);

  return {
    id: toStringSafe(node.id),
    slug: toStringSafe(node.slug),
    title: stringOrNull(node.title),
    contentHtml: stringOrNull(node.content),
    links: links
      ? {
          facebookUrl: stringOrNull(links.facebookUrl),
          instagramUrl: stringOrNull(links.instagramUrl),
          websiteUrl: stringOrNull(links.websiteUrl),
        }
      : null,
    featuredImage: pickImageFrom(node.featuredImage),
  };
};

const dedupeSponsorFeatures = (features: SponsorFeature[]): SponsorFeature[] => {
  const seen = new Set<string>();
  const result: SponsorFeature[] = [];
  for (const feature of features) {
    const key = feature.slug || feature.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(feature);
  }
  return result;
};

export async function listSponsorFeaturesByServiceArea(
  serviceAreaSlugs: string[] | string | null,
  {
    primaryLimit = 8,
    fallbackLimit = 4,
    minimum = 4,
    revalidateSeconds = 600,
  }: {
    primaryLimit?: number;
    fallbackLimit?: number;
    minimum?: number;
    revalidateSeconds?: number;
  } = {}
): Promise<SponsorFeature[]> {
  const normalizedSlugs = (Array.isArray(serviceAreaSlugs) ? serviceAreaSlugs : [serviceAreaSlugs])
    .map((value) => (typeof value === "string" ? value.trim().toLowerCase() : ""))
    .filter((value) => value.length > 0);

  type SponsorFeatureNode = {
    nodes?: UnknownRecord[] | null;
  };

  let primary: SponsorFeature[] = [];

  if (normalizedSlugs.length) {
    const primaryQuery = /* GraphQL */ `
      query SponsorFeaturesByServiceArea($slugs: [String!], $limit: Int!) {
        sponsorFeatures(
          first: $limit
          where: {
            taxQuery: {
              relation: AND
              taxArray: [
                { taxonomy: SERVICE_AREA, terms: $slugs, field: SLUG, operator: IN }
              ]
            }
          }
        ) {
          nodes {
            id
            slug
            title
            content(format: RENDERED)
            sponsorFeatureAttributes {
              links {
                facebookUrl
                instagramUrl
                websiteUrl
              }
            }
            featuredImage {
              node {
                sourceUrl
                altText
              }
            }
          }
        }
      }
    `;

    const primaryData = await wpFetch<{ sponsorFeatures?: SponsorFeatureNode }>(
      primaryQuery,
      { slugs: normalizedSlugs, limit: primaryLimit },
      { revalidateSeconds }
    ).catch(() => null);

    primary = dedupeSponsorFeatures(
      asArray<UnknownRecord>(primaryData?.sponsorFeatures?.nodes)
        .map(mapSponsorFeatureNode)
        .filter((feature): feature is SponsorFeature => feature !== null)
    );
  }

  if (primary.length >= minimum) {
    return primary;
  }

  const fallbackQuery = /* GraphQL */ `
    query FallbackSponsorFeatures($limit: Int!) {
      sponsorFeatures(first: $limit) {
        nodes {
          id
          slug
          title
          content(format: RENDERED)
          sponsorFeatureAttributes {
            links {
              facebookUrl
              instagramUrl
              websiteUrl
            }
          }
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  `;

  const fallbackData = await wpFetch<{ sponsorFeatures?: SponsorFeatureNode }>(
    fallbackQuery,
    { limit: Math.max(fallbackLimit, minimum) },
    { revalidateSeconds }
  ).catch(() => null);

  const fallback = dedupeSponsorFeatures(
    asArray<UnknownRecord>(fallbackData?.sponsorFeatures?.nodes)
      .map(mapSponsorFeatureNode)
      .filter((feature): feature is SponsorFeature => feature !== null)
  );

  const merged = dedupeSponsorFeatures([...primary, ...fallback]);

  if (!merged.length) return [];

  if (merged.length < minimum && fallbackLimit > merged.length) {
    return merged.slice(0, minimum);
  }

  return merged;
}

// ----- Glossary Types -----
export type GlossarySummary = {
  slug: string;
  title: string;
  excerpt?: string | null;
};

export type GlossaryTerm = {
  slug: string;
  title: string;
  contentHtml: string;
};

// FAQ Types
export type FaqSummary = {
  slug: string;
  title: string;       // question
  excerpt?: string | null;
  topicSlugs: string[];
};

export type Faq = {
  slug: string;
  title: string;
  contentHtml: string;
  topicSlugs: string[];
};

export type FaqFull = Faq & {
  /** Full ISO date (publish date) */
  date?: string | null;
  /** ISO last-modified date */
  modified?: string | null;
  /** RankMath SEO (as exposed by WPGraphQL Rank Math) */
  seo?: {
    title?: string | null;
    description?: string | null;
    canonicalUrl?: string | null;
    openGraph?: {
      title?: string | null;
      description?: string | null;
      type?: string | null;
      image?: {
        url?: string | null;
        secureUrl?: string | null;
        width?: number | null;
        height?: number | null;
        type?: string | null;
      } | null;
    } | null;
  };
};

export type SpecialOffer = {
  slug: string;
  title: string;
  contentHtml: string;
  featuredImage?: WpImage | null;
  date?: string | null;
  modified?: string | null;
  discount?: string | null;
  offerCode?: string | null;
  expirationDate?: string | null;
  legalDisclaimers?: string | null;
  seo?: {
    title?: string | null;
    description?: string | null;
    canonicalUrl?: string | null;
    openGraph?: {
      title?: string | null;
      description?: string | null;
      type?: string | null;
      image?: {
        url?: string | null;
        secureUrl?: string | null;
        width?: number | null;
        height?: number | null;
        type?: string | null;
      } | null;
    } | null;
  };
};

// FAQ Topic type (taxonomy term)
export type FaqTopic = {
  slug: string;
  name: string;
  count?: number;        // term usage count (if exposed)
  featured?: boolean | null; // ACF boolean on the term (GraphQL field: featured)
};


// ----- Core fetcher -----
function getAuthHeader(): string | null {
  if (!WP_USER || !WP_PASS) return null;
  const raw = `${WP_USER}:${WP_PASS}`;
  const base64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(raw).toString("base64")
      : typeof btoa !== "undefined"
        ? btoa(raw)
        : "";
  return `Basic ${base64}`;
}

type WpFetchOptions = {
  revalidateSeconds?: number;
  cache?: RequestCache;
};

export async function wpFetch<T = Json>(
  query: string,
  variables?: Record<string, unknown>,
  options?: number | WpFetchOptions
): Promise<T> {
  let revalidateSeconds = 600;
  let cacheMode: RequestCache | undefined;

  if (typeof options === "number") {
    revalidateSeconds = options;
  } else if (options) {
    if (typeof options.revalidateSeconds === "number") {
      revalidateSeconds = options.revalidateSeconds;
    }
    cacheMode = options.cache;
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const auth = getAuthHeader();
  if (auth) headers.Authorization = auth;

  const fetchInit: RequestInit & { next?: { revalidate: number } } = {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  };

  if (cacheMode) {
    fetchInit.cache = cacheMode;
  }

  if (cacheMode !== "no-store") {
    fetchInit.next = { revalidate: revalidateSeconds };
  }

  const res = await fetch(WP_ENDPOINT, fetchInit);

  if (!res.ok) {
    throw new Error(`WPGraphQL HTTP ${res.status} ${res.statusText}`);
  }

  type GraphQLError = { message?: string } & UnknownRecord;
  type GraphQLResponse = { data?: T; errors?: GraphQLError[] | GraphQLError | null };

  const json = (await res.json()) as GraphQLResponse;
  const errors = Array.isArray(json.errors)
    ? json.errors
    : json.errors
      ? [json.errors]
      : [];

  if (errors.length > 0) {
    if (WP_VERBOSE_ERRORS) {
      // surface the exact GraphQL error during dev
      throw new Error(JSON.stringify(errors));
    }
    throw new Error("WPGraphQL responded with an error");
  }
  return json.data as T;
}

// ----- Helpers -----
type ImageNode = {
  sourceUrl?: unknown;
  altText?: unknown;
  mediaDetails?: unknown;
};

const pickImage = (node?: Maybe<ImageNode>): WpImage | null => {
  if (!isRecord(node)) return null;
  const url = toStringSafe(node.sourceUrl);
  if (!url) return null;
  const mediaDetails = asRecord(node.mediaDetails);
  const width = typeof mediaDetails?.width === "number" ? mediaDetails.width : null;
  const height = typeof mediaDetails?.height === "number" ? mediaDetails.height : null;
  return {
    url,
    altText: toStringSafe(node.altText),
    width,
    height,
  };
};

const pickYear = (iso?: string | null) => (iso ? new Date(iso).getFullYear() : null);

type TermNode = {
  name?: unknown;
  slug?: unknown;
};

const mapTerms = (nodes?: readonly Maybe<TermNode>[]): TermLite[] =>
  (nodes ?? [])
    .map((node) => (isRecord(node) ? node : null))
    .filter((node): node is TermNode => node !== null)
    .map((node) => ({ name: toStringSafe(node.name), slug: toStringSafe(node.slug) }))
    .filter((term) => term.name.length > 0 || term.slug.length > 0);

type ProductLinkNode = {
  productName?: unknown;
  productLink?: unknown;
};

const mapProductLinks = (rows?: readonly Maybe<ProductLinkNode>[]): ProductLink[] =>
  (rows ?? [])
    .map((node) => (isRecord(node) ? node : null))
    .filter((node): node is ProductLinkNode => node !== null)
    .map((node) => {
      const productLinkValue = toStringSafe(node.productLink);
      return {
        productName: toStringSafe(node.productName),
        productLink: productLinkValue ? productLinkValue : null,
      };
    });

const mapImages = (rows?: readonly Maybe<ImageNode>[]): WpImage[] =>
  (rows ?? [])
    .map((node) => pickImage(node))
    .filter((image): image is WpImage => Boolean(image));

// calcReadingTimeMinutes Helper Function
const htmlEntityMap: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeHtmlEntities(input: string): string {
  if (!input) return "";

  let value = input.replace(/&#(\d+);/g, (_, dec: string) => {
    const codePoint = Number.parseInt(dec, 10);
    return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : "";
  });

  value = value.replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
    const codePoint = Number.parseInt(hex, 16);
    return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : "";
  });

  value = value.replace(/&([a-zA-Z]+);/g, (_, name: string) => htmlEntityMap[name.toLowerCase()] ?? `&${name};`);

  return value;
}

export function stripHtml(html: string): string {
  const withoutTags = html.replace(/<[^>]*>/g, " ");
  const decoded = decodeHtmlEntities(withoutTags);
  return decoded.replace(/\s+/g, " ").trim();
}
function calcReadingTimeMinutes(html: string, wpm = 225): number {
  const text = stripHtml(html);
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.round(words / wpm));
}

// Create a safe, trimmed HTML excerpt from WP's rendered excerpt
function toTrimmedExcerpt(html?: string | null, max = 200): string | undefined {
  if (!html) return undefined;
  const text = stripHtml(String(html));
  if (!text) return undefined;
  const trimmed = text.length > max ? text.slice(0, max).replace(/\s+\S*$/, "") + "…" : text;
  const escaped = trimmed
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<p>${escaped}</p>`;
}

// --- YouTube helpers

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    const v = u.searchParams.get("v");
    if (v) return v;
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "embed" || p === "shorts" || p === "v");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    // If path itself is the id (rare but possible)
    if (parts.length === 1 && parts[0].length >= 8) return parts[0];
    return null;
  } catch {
    return null;
  }
}
export function youtubeThumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

// Internal: WPGraphQL response shape for glossary index pagination
type GlossaryIndexResponse = {
  glossaryTerms: {
    nodes: Array<{ slug: string; title: string; content?: string | null }>;
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
};

// Internal: WPGraphQL response for FAQ index pagination
type FaqIndexResponse = {
  faqs: {
    nodes: Array<{
      slug: string;
      title: string;
      content?: string | null; // matches listFaqIndex query (content(format: RENDERED))
      faqTopics?: { nodes?: Array<{ slug: string }> };
    }>;
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
};

// ----- Queries -----

// === 

/** List FAQ topics (taxonomy terms) including optional ACF `featured` boolean */
export async function listFaqTopics(limit = 100): Promise<FaqTopic[]> {
  const query = /* GraphQL */ `
    query ListFaqTopics($first: Int!) {
      faqTopics(first: $first, where: { hideEmpty: false }) {
        nodes {
          slug
          name
          count
        }
      }
    }
  `;
  const data = await wpFetch<{ faqTopics: { nodes: UnknownRecord[] } }>(query, { first: limit }, 86400);
  const nodes = data?.faqTopics?.nodes ?? [];
  return nodes.map((t: UnknownRecord): FaqTopic => ({
    slug: toStringSafe(t.slug),
    name: toStringSafe(t.name),
    count: typeof t.count === 'number' ? t.count : undefined,
    featured: null,
  }));
}

// List recent FAQs (optionally by topic)
export async function listFaqs(limit = 20, topicSlug?: string): Promise<FaqSummary[]> {
  // Helper to map a node to FaqSummary and create a short excerpt
  const toSummary = (n: UnknownRecord): FaqSummary => {
    const raw = String(n?.content ?? "");
    const text = stripHtml(raw);
    const short = text ? (text.length > 160 ? text.slice(0, 157) + "…" : text) : null;
    const topicSlugs = extractSlugList(extractNodes(n.faqTopics));
    return {
      slug: toStringSafe(n.slug),
      title: toStringSafe(n.title),
      excerpt: short,
      topicSlugs,
    };
  };

  if (topicSlug) {
    const query = /* GraphQL */ `
      query FAQsByTopic($first: Int!, $slug: ID!) {
        faqTopic(id: $slug, idType: SLUG) {
          faqs(first: $first, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
            nodes {
              slug
              title
              content(format: RENDERED)
              faqTopics { nodes { slug } }
              faqAttributes { featured }
            }
          }
        }
      }
    `;
    const data = await wpFetch<{ faqTopic: { faqs?: { nodes?: UnknownRecord[] } } | null }>(
      query,
      { first: limit, slug: topicSlug },
      3600
    );
    const nodes = data?.faqTopic?.faqs?.nodes ?? [];
    return nodes.map(toSummary);
  }

  // No topic filter
  const query = /* GraphQL */ `
    query FAQs($first: Int!) {
      faqs(
        first: $first
        where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }
      ) {
        nodes {
          slug
          title
          content(format: RENDERED)
          faqTopics { nodes { slug } }
          faqAttributes { featured }
        }
      }
    }
  `;
  const data = await wpFetch<{ faqs: { nodes: UnknownRecord[] } }>(query, { first: limit }, 3600);
  const nodes = data?.faqs?.nodes ?? [];
  return nodes.map(toSummary);
}

// Single FAQ by slug (returns FaqFull)
export async function getFaq(slug: string): Promise<FaqFull | null> {
  const query = /* GraphQL */ `
    query FAQBySlug($slug: ID!) {
      faq(id: $slug, idType: SLUG) {
        slug
        title
        date(format: "c")
        modified(format: "c")
        content(format: RENDERED)
        faqTopics { nodes { slug } }
        seo {
          title
          description
          canonicalUrl
          openGraph {
            title
            description
            type
            image { url secureUrl width height type }
          }
        }
      }
    }
  `;
  const data = await wpFetch<{ faq: UnknownRecord | null }>(query, { slug }, 3600);
  const n = data?.faq;
  if (!n) return null;
  const topicSlugs = extractSlugList(extractNodes(n.faqTopics));
  const date = typeof n.date === 'string' ? n.date : null;
  const modified = typeof n.modified === 'string' ? n.modified : null;
  const seo = isRecord(n.seo) ? (n.seo as FaqFull['seo']) : undefined;
  return {
    slug: String(n.slug || slug),
    title: String(n.title || ""),
    contentHtml: String(n.content || ""),
    topicSlugs,
    date,
    modified,
    seo,
  };
}

// ----- Special Offers -----

export async function listSpecialOfferSlugs(limit = 100): Promise<string[]> {
  const query = /* GraphQL */ `
    query SpecialOfferSlugs($first: Int!) {
      specialOffers(first: $first, where: { status: PUBLISH }) {
        nodes {
          slug
        }
      }
    }
  `;

  const data = await wpFetch<{ specialOffers?: { nodes?: Array<{ slug?: string | null }> } }>(
    query,
    { first: limit },
    900
  );

  return (data?.specialOffers?.nodes ?? [])
    .map((node) => String(node?.slug || ""))
    .filter((s) => s.length > 0);
}

export async function getSpecialOfferBySlug(slug: string): Promise<SpecialOffer | null> {
  const query = /* GraphQL */ `
    query SpecialOfferBySlug($slug: ID!) {
      specialOffer(id: $slug, idType: SLUG) {
        slug
        title
        date
        modified
        content(format: RENDERED)
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        specialOffersAttributes {
          offerCode
          expirationDate
          discount
          legalDisclaimers
        }
        seo {
          title
          description
          canonicalUrl
          openGraph {
            title
            description
            type
            image { url secureUrl width height type }
          }
        }
      }
    }
  `;

  const data = await wpFetch<{ specialOffer?: UnknownRecord | null }>(query, { slug }, 900);
  const node = asRecord(data?.specialOffer);
  if (!node) return null;

  const fields = asRecord(node.specialOffersAttributes);

  return {
    slug: toStringSafe(node.slug) || slug,
    title: toStringSafe(node.title),
    contentHtml: String(node.content || ''),
    featuredImage: pickImageFrom(node.featuredImage),
    date: typeof node.date === 'string' ? node.date : null,
    modified: typeof node.modified === 'string' ? node.modified : null,
    discount: typeof fields?.discount === 'string' ? fields.discount : null,
    offerCode: typeof fields?.offerCode === 'string' ? fields.offerCode : null,
    expirationDate: typeof fields?.expirationDate === 'string' ? fields.expirationDate : null,
    legalDisclaimers: typeof fields?.legalDisclaimers === 'string' ? fields.legalDisclaimers : null,
    seo: isRecord(node.seo) ? (node.seo as SpecialOffer['seo']) : undefined,
  };
}


/**
 * Fetch a list of FAQs with full rendered content, optionally filtered by topic, for archive JSON-LD.
 */
export async function listFaqsWithContent(limit = 50, topicSlug?: string): Promise<FaqFull[]> {
  // Inner mapper used by both branches
  const mapNode = (n: UnknownRecord): FaqFull => {
    const topicSlugs = extractSlugList(extractNodes(n.faqTopics));
    const date = typeof n.date === 'string' ? n.date : null;
    const modified = typeof n.modified === 'string' ? n.modified : null;
    const seo = isRecord(n.seo) ? (n.seo as FaqFull['seo']) : undefined;
    return {
      slug: String(n.slug || ""),
      title: String(n.title || ""),
      contentHtml: String(n.content || ""),
      topicSlugs,
      date,
      modified,
      seo,
    };
  };

  if (topicSlug) {
    const query = /* GraphQL */ `
      query FaqsWithContentByTopic($first: Int!, $slug: ID!) {
        faqTopic(id: $slug, idType: SLUG) {
          faqs(first: $first, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
            nodes {
              slug
              title
              date
              modified
              content(format: RENDERED)
              faqTopics { nodes { slug } }
              seo {
                title
                description
                canonicalUrl
                openGraph {
                  title
                  description
                  type
                  image { url secureUrl width height type }
                }
              }
            }
          }
        }
      }
    `;
    const data = await wpFetch<{ faqTopic: { faqs?: { nodes?: UnknownRecord[] } } | null }>(
      query,
      { first: limit, slug: topicSlug },
      86400
    );
    const nodes = data?.faqTopic?.faqs?.nodes ?? [];
    return nodes.map(mapNode);
  }

  const query = /* GraphQL */ `
    query FaqsWithContent($first: Int!) {
      faqs(first: $first, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
        nodes {
          slug
          title
          date
          modified
          content(format: RENDERED)
          faqTopics { nodes { slug } }
          seo {
            title
            description
            canonicalUrl
            openGraph {
              title
              description
              type
              image { url secureUrl width height type }
            }
          }
        }
      }
    }
  `;
  const data = await wpFetch<{ faqs: { nodes: UnknownRecord[] } }>(query, { first: limit }, 86400);
  const nodes = data?.faqs?.nodes ?? [];
  return nodes.map(mapNode);
}

/**
 * Lightweight index of all FAQs (title/slug/excerpt + topic slugs), paginated.
 * Use for client search and grouping on /faq.
 */
export async function listFaqIndex(limit = 500): Promise<FaqSummary[]> {
  const query = /* GraphQL */ `
    query FaqIndex($first: Int!, $after: String) {
      faqs(
        first: $first
        after: $after
        where: { status: PUBLISH, orderby: { field: TITLE, order: ASC } }
      ) {
        nodes {
          slug
          title
          content(format: RENDERED)
          faqTopics { nodes { slug } }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  const pageSize = Math.min(100, Math.max(1, limit));
  const out: FaqSummary[] = [];
  let after: string | null = null;
  let hasNext = true;

  while (hasNext && out.length < limit) {
    const resp: FaqIndexResponse = await wpFetch<FaqIndexResponse>(query, { first: pageSize, after }, 86400);
    const nodes = resp?.faqs?.nodes ?? [];
    for (const n of nodes) {
      const raw = String(n?.content ?? "");
      const text = stripHtml(raw);
      const short = text ? (text.length > 160 ? text.slice(0, 157) + "…" : text) : null;
      out.push({
        slug: String(n.slug || ''),
        title: String(n.title || ''),
        excerpt: short,
        topicSlugs: (n.faqTopics?.nodes ?? []).map((t: UnknownRecord) => String(t.slug || '')),
      });
      if (out.length >= limit) break;
    }
    const pi = resp?.faqs?.pageInfo;
    hasNext = Boolean(pi?.hasNextPage);
    after = pi?.endCursor ?? null;
  }

  return out;
}

/** Slugs for static params on /faq/[slug] */
export async function listFaqSlugs(limit = 500): Promise<string[]> {
  const query = /* GraphQL */ `
    query ListFaqSlugs($limit: Int!) {
      faqs(first: $limit, where: { status: PUBLISH, orderby: { field: TITLE, order: ASC } }) {
        nodes { slug }
      }
    }
  `;
  const data = await wpFetch<{ faqs: { nodes: Array<{ slug: string | null }> } }>(query, { limit }, 86400);
  return (data?.faqs?.nodes ?? []).map((n) => n.slug).filter(Boolean) as string[];
}

/**
 * Build a FAQPage JSON-LD object from question/answer items with optional per-question URLs.
 * Google only requires name + acceptedAnswer.text; extra properties are safe but may be ignored.
 */
export function faqItemsToJsonLd(
  items: Array<{ question: string; answerHtml: string; url?: string }>,
  pageUrl?: string
) {
  const origin =
    pageUrl && pageUrl.startsWith("http")
      ? (() => {
        try {
          return new URL(pageUrl).origin;
        } catch {
          return SITE_ORIGIN;
        }
      })()
      : SITE_ORIGIN;
  return faqSchema(
    items.map((item) => ({
      question: item.question,
      answerHtml: item.answerHtml,
      url: item.url,
    })),
    {
      url: pageUrl,
      origin: origin ?? SITE_ORIGIN,
    },
  );
}

/**
 * Convenience: convert a list of FaqFull into a FAQPage JSON-LD with absolute URLs.
 * `baseUrl` should be your site origin (e.g., https://sonshineroofing.com)
 * `basePath` is the page path hosting the FAQ list (default: "/faq").
 */
export function faqListToJsonLd(faqs: FaqFull[], baseUrl: string, basePath = "/faq") {
  const pageUrl = `${baseUrl}${basePath}`;
  const items = faqs.map((f) => ({
    question: f.title,
    answerHtml: f.contentHtml,
    url: `${baseUrl}${basePath}/${f.slug}`,
  }));
  return faqItemsToJsonLd(items, pageUrl);
}

// List lightweight glossary index (title + slug), A→Z
export async function listGlossaryIndex(limit = 500): Promise<GlossarySummary[]> {
  const query = /* GraphQL */ `
    query GlossaryIndex($first: Int!, $after: String) {
      glossaryTerms(
        first: $first,
        after: $after,
        where: { status: PUBLISH, orderby: { field: TITLE, order: ASC } }
      ) {
        nodes { slug title content(format: RENDERED) }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const pageSize = Math.min(100, Math.max(1, limit)); // WPGraphQL often caps ~100
  const out: GlossarySummary[] = [];
  let after: string | null = null;
  let hasNext = true;

  while (hasNext && out.length < limit) {
    const resp: GlossaryIndexResponse = await wpFetch<GlossaryIndexResponse>(
      query,
      { first: pageSize, after }
    );

    const nodes: GlossaryIndexResponse['glossaryTerms']['nodes'] = resp?.glossaryTerms?.nodes ?? [];
    for (const n of nodes) {
      const raw = typeof n.content === 'string' ? n.content : '';
      const text = raw ? stripHtml(raw) : '';
      out.push({
        slug: String(n.slug || ''),
        title: String(n.title || ''),
        excerpt: text || null,
      });
      if (out.length >= limit) break;
    }

    const pageInfo: GlossaryIndexResponse['glossaryTerms']['pageInfo'] | null =
      resp?.glossaryTerms?.pageInfo ?? null;
    hasNext = Boolean(pageInfo?.hasNextPage);
    after = pageInfo?.endCursor ?? null;
  }

  return out;
}

// Fetch one term by slug
export async function getGlossaryTerm(slug: string): Promise<GlossaryTerm | null> {
  const query = /* GraphQL */ `
    query GlossaryBySlug($slug: ID!) {
      glossaryTerm(id: $slug, idType: SLUG) {
        slug
        title
        content(format: RENDERED)
      }
    }
  `;

  const data = await wpFetch<{ glossaryTerm: UnknownRecord | null }>(query, { slug });
  const n = data?.glossaryTerm;
  if (!n) return null;

  return {
    slug: String(n.slug || slug),
    title: String(n.title || ''),
    contentHtml: String(n.content || ''),
  };
}


// ---- PERSON ------- //
export async function listPersons(limit = 30): Promise<Person[]> {
  const query = /* GraphQL */ `
    query listPersons($limit: Int!) {
      persons(
        first: $limit
        where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }
      ) {
        nodes {
          slug
          title
          content(format: RENDERED)
          featuredImage { node { sourceUrl altText } }
          personAttributes {
            positionTitle
          }
        }
      }
    }
  `;

  const data = await wpFetch<{ persons: { nodes: UnknownRecord[] } }>(query, { limit }, 86400);
  const nodes = data?.persons?.nodes || [];

  return nodes.map((n: UnknownRecord): Person => {
    const positionTitleValue = asRecord(n.personAttributes)?.positionTitle;
    return {
      slug: toStringSafe(n.slug),
      title: toStringSafe(n.title),
      contentHtml: String(n.content || ""),
      featuredImage: pickImageFrom(n.featuredImage),
      positionTitle: typeof positionTitleValue === 'string' ? positionTitleValue : null,
    };
  });
}

/** Lightweight person list for prev/next navigation */
export async function listPersonNav(limit = 50): Promise<Array<{ slug: string; title: string; positionTitle: string | null }>> {
  const query = /* GraphQL */ `
    query listPersonNav($limit: Int!) {
      persons(
        first: $limit
        where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }
      ) {
        nodes {
          slug
          title
          personAttributes { positionTitle }
        }
      }
    }
  `;

  const data = await wpFetch<{ persons: { nodes: UnknownRecord[] } }>(query, { limit }, 86400);
  const nodes = data?.persons?.nodes || [];

  return nodes
    .map((n: UnknownRecord) => {
      const positionTitleValue = asRecord(n.personAttributes)?.positionTitle;
      return {
        slug: toStringSafe(n?.slug),
        title: toStringSafe(n?.title),
        positionTitle: typeof positionTitleValue === 'string' ? positionTitleValue : null,
      };
    })
    .filter((n) => !!n.slug);
}

/** Fetch multiple Persons by slug array, preserving the given order */
export async function listPersonsBySlugs(slugs: string[]): Promise<Person[]> {
  if (!Array.isArray(slugs) || slugs.length === 0) return [];

  const query = /* GraphQL */ `
    query PersonsBySlugs($slugs: [String]!) {
      persons(first: 100, where: { status: PUBLISH, nameIn: $slugs }) {
        nodes {
          slug
          title
          content(format: RENDERED)
          featuredImage { node { sourceUrl altText } }
          personAttributes { positionTitle }
        }
      }
    }
  `;

  const data = await wpFetch<{ persons: { nodes: UnknownRecord[] } }>(query, { slugs });
  const nodes = data?.persons?.nodes || [];

  const mapped: Person[] = nodes.map((n: UnknownRecord) => {
    const positionTitleValue = asRecord(n.personAttributes)?.positionTitle;
    return {
      slug: toStringSafe(n.slug),
      title: toStringSafe(n.title),
      contentHtml: String(n.content || ""),
      featuredImage: pickImageFrom(n.featuredImage),
      positionTitle: typeof positionTitleValue === 'string' ? positionTitleValue : null,
    };
  });

  // Preserve caller's order
  const index = new Map(slugs.map((s, i) => [s, i] as const));
  mapped.sort((a, b) => (index.get(a.slug) ?? 9999) - (index.get(b.slug) ?? 9999));
  return mapped;
}

/** Fetch a single Person CPT by slug */
export async function listPersonsBySlug(
  slug: string,
  options?: WpFetchOptions
): Promise<Person | null> {
  const query = /* GraphQL */ `
    query PersonBySlug($slug: ID!) {
      person(id: $slug, idType: SLUG) {
        slug
        title
        content(format: RENDERED)
        featuredImage { node { sourceUrl altText } }
        personAttributes { positionTitle }
      }
    }
  `;

  const data = await wpFetch<{ person: UnknownRecord | null }>(query, { slug }, options);
  const n = asRecord(data?.person);
  if (!n) return null;

  const positionTitleValue = asRecord(n.personAttributes)?.positionTitle;

  return {
    slug: toStringSafe(n.slug) || slug,
    title: toStringSafe(n.title),
    contentHtml: String(n.content || ""),
    featuredImage: pickImageFrom(n.featuredImage),
    positionTitle: typeof positionTitleValue === 'string' ? positionTitleValue : null,
  };
}

// ----- VIDEO ENTRY (Commercials, Accolades, Education, etc.) -----
export async function listRecentVideoEntries(limit = 50): Promise<VideoItem[]> {
  const query = /* GraphQL */ `
    query ListVideoEntries($limit: Int!) {
      videoEntries(first: $limit, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
        nodes {
          id
          slug
          title
          date
          videoCategories(first: 10) {
            nodes { name slug }
          }
          videoLibraryMetadata { youtubeUrl description }
        }
      }
    }
  `;
  const data = await wpFetch<{ videoEntries: { nodes: UnknownRecord[] } }>(query, { limit });
  const nodes = data?.videoEntries?.nodes || [];

  const items: VideoItem[] = [];

  for (const entry of nodes) {
    const metadata = asRecord(entry.videoLibraryMetadata);
    const rawUrl = metadata?.youtubeUrl;
    const url = typeof rawUrl === 'string' ? rawUrl : undefined;
    const id = url ? extractYouTubeId(url) : null;
    if (!id) continue;

    const categories = extractNodes(entry.videoCategories).map((node) => {
      const cat = asRecord(node);
      return {
        name: toStringSafe(cat?.name),
        slug: toStringSafe(cat?.slug) || undefined,
      };
    });

    const description = metadata && typeof metadata.description === 'string' ? metadata.description : null;

    items.push({
      id: toStringSafe(entry.id) || id,
      title: toStringSafe(entry.title),
      youtubeUrl: url!,
      youtubeId: id,
      thumbnailUrl: youtubeThumb(id),
      source: 'video_entry',
      date: typeof entry.date === 'string' ? entry.date : undefined,
      categories,
      excerpt: description,
    });
  }

  return items;
}

export async function getVideoEntryBySlug(slug: string): Promise<VideoItem | null> {
  const trimmed = slug.trim();
  if (!trimmed) return null;

  const query = /* GraphQL */ `
    query VideoEntryBySlug($slug: ID!, $taxLimit: Int!) {
      videoEntry(id: $slug, idType: SLUG) {
        id
        slug
        title
        date(format: "c")
        videoCategories(first: $taxLimit) {
          nodes { name slug }
        }
        videoLibraryMetadata {
          youtubeUrl
          description
          materialType { nodes { name slug } }
          serviceArea  { nodes { name slug } }
        }
        seo {
          title
          description
          canonicalUrl
          openGraph {
            title
            description
            type
            image { url secureUrl width height type }
          }
        }
      }
    }
  `;

  type VideoEntryResponse = { videoEntry: UnknownRecord | null };

  const data = await wpFetch<VideoEntryResponse>(query, { slug: trimmed, taxLimit: 10 }, 900);
  const node = asRecord(data?.videoEntry);
  if (!node) return null;

  const metadata = asRecord(node.videoLibraryMetadata);
  const youtubeUrl = readRecordString(metadata, "youtubeUrl");
  const youtubeId = youtubeUrl ? extractYouTubeId(youtubeUrl) : null;
  if (!youtubeUrl || !youtubeId) return null;

  const categories = extractNodes(node.videoCategories)
    .map((value) => asRecord(value))
    .filter((value): value is UnknownRecord => value !== null)
    .map((value) => ({
      name: toStringSafe(value.name),
      slug: toStringSafe(value.slug) || undefined,
    }))
    .filter((cat) => cat.name.length > 0 || (cat.slug && cat.slug.length > 0));

  const materialTypes = mapTermNodes(metadata?.materialType);
  const serviceAreas = mapTermNodes(metadata?.serviceArea);
  const description = readRecordString(metadata, "description");
  const seo = isRecord(node.seo) ? (node.seo as VideoItem["seo"]) : undefined;

  return {
    id: toStringSafe(node.id) || youtubeId,
    slug: toStringSafe(node.slug) || undefined,
    title: toStringSafe(node.title),
    youtubeUrl,
    youtubeId,
    thumbnailUrl: youtubeThumb(youtubeId),
    source: "video_entry",
    date: typeof node.date === "string" ? node.date : undefined,
    categories,
    excerpt: description,
    materialTypes,
    serviceAreas,
    seo,
  };
}

export function videoJsonLd(video: VideoItem, base: string): Record<string, unknown> {
  const origin =
    base && base.startsWith("http")
      ? (() => {
        try {
          return new URL(base).origin;
        } catch {
          return SITE_ORIGIN;
        }
      })()
      : SITE_ORIGIN;
  const seo = video.seo;
  const openGraph = isRecord(seo?.openGraph) ? (seo?.openGraph as UnknownRecord) : undefined;
  const ogImage = isRecord(openGraph?.image) ? (openGraph?.image as UnknownRecord) : null;

  const titleSource =
    (typeof seo?.title === "string" && seo.title) ||
    (typeof openGraph?.title === "string" && openGraph.title) ||
    video.title;
  const name = titleSource ? titleSource.trim() : undefined;

  const descriptionSource =
    (typeof seo?.description === "string" && seo.description) ||
    (typeof openGraph?.description === "string" && openGraph.description) ||
    (video.excerpt ? stripHtml(String(video.excerpt)) : "");
  const description = descriptionSource ? descriptionSource.trim() : undefined;

  const thumbnailCandidates: string[] = [];
  if (ogImage) {
    const secure = ogImage.secureUrl;
    const url = ogImage.url;
    if (typeof secure === "string" && secure.trim()) thumbnailCandidates.push(secure.trim());
    if (typeof url === "string" && url.trim()) thumbnailCandidates.push(url.trim());
  }
  if (video.thumbnailUrl) thumbnailCandidates.push(video.thumbnailUrl);
  const thumbnailUrl = Array.from(new Set(thumbnailCandidates.filter(Boolean)));

  const slugOrId = video.slug || video.youtubeId || video.id;
  const defaultLanding = slugOrId
    ? ensureAbsoluteUrl(`/video-library?v=${encodeURIComponent(slugOrId)}`, origin)
    : undefined;
  const canonical = typeof seo?.canonicalUrl === "string" && seo.canonicalUrl.trim()
    ? ensureAbsoluteUrl(seo.canonicalUrl.trim(), origin)
    : defaultLanding;

  const embedUrl = video.youtubeId
    ? `https://www.youtube-nocookie.com/embed/${video.youtubeId}`
    : video.youtubeUrl;

  return videoObjectSchema({
    name,
    description,
    canonicalUrl: canonical,
    contentUrl: video.youtubeUrl,
    embedUrl,
    uploadDate: video.date,
    thumbnailUrls: thumbnailUrl,
    origin,
    isFamilyFriendly: true,
    potentialAction: video.youtubeUrl
      ? {
        "@type": "WatchAction",
        target: video.youtubeUrl,
      }
      : undefined,
  });
}

// ----- PROJECTS WITH YOUTUBE (Roofing Projects bucket) ----- //
export async function listProjectVideos(limit = 100): Promise<VideoItem[]> {
  const query = /* GraphQL */ `
    query ListProjectVideos($limit: Int!) {
      projects(first: $limit, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
        nodes {
          slug
          title
          date
          projectVideoInfo {youtubeUrl}
          projectDetails { projectDescription }
          projectFilters {
            materialType { nodes { name slug } }
            serviceArea  { nodes { name slug } }
          }
        }
      }
    }
  `;
  const data = await wpFetch<{ projects: { nodes: UnknownRecord[] } }>(query, { limit });
  const nodes = data?.projects?.nodes || [];

  const items: VideoItem[] = [];

  for (const entry of nodes) {
    const videoInfo = asRecord(entry.projectVideoInfo);
    const rawUrl = videoInfo?.youtubeUrl;
    const url = typeof rawUrl === 'string' ? rawUrl : undefined;
    const id = url ? extractYouTubeId(url) : null;
    if (!id) continue;

    const excerptSource = readProjectDescription(entry.projectDetails);
    const materialTypes = mapTermNodes(asRecord(entry.projectFilters)?.materialType);
    const serviceAreas = mapTermNodes(asRecord(entry.projectFilters)?.serviceArea);

    items.push({
      id: `project-${toStringSafe(entry.slug) || id}`,
      title: toStringSafe(entry.title),
      youtubeUrl: url!,
      youtubeId: id,
      thumbnailUrl: youtubeThumb(id),
      source: 'project',
      slug: toStringSafe(entry.slug) || undefined,
      date: typeof entry.date === 'string' ? entry.date : undefined,
      excerpt: excerptSource,
      materialTypes,
      serviceAreas,
      categories: [{ name: 'Roofing Projects', slug: 'roofing-project' }],
    });
  }

  return items;
}

export function projectToVideoItem(project: ProjectFull): VideoItem | null {
  const rawUrl = typeof project.youtubeUrl === 'string' ? project.youtubeUrl.trim() : '';
  if (!rawUrl) return null;
  const youtubeId = extractYouTubeId(rawUrl);
  if (!youtubeId) return null;

  const slug = project.slug?.trim() ?? '';
  const id = slug ? `project-${slug}` : `project-${youtubeId}`;

  return {
    id,
    slug: slug || undefined,
    title: project.title,
    youtubeUrl: rawUrl,
    youtubeId,
    thumbnailUrl: youtubeThumb(youtubeId),
    source: 'project',
    date: project.date ?? undefined,
    excerpt: project.projectDescription,
    materialTypes: project.materialTypes ?? [],
    serviceAreas: project.serviceAreas ?? [],
    categories: [{ name: 'Roofing Projects', slug: 'roofing-project' }],
    featuredImage: project.heroImage ? { url: project.heroImage.url } : undefined,
    seo: project.seo,
  };
}

// --- Paged videos (merge video entries + project videos) -----------------
export type VideoFiltersInput = {
  buckets?: VideoBucketKey[];      // which buckets to include (OR). If omitted, include all.
  categorySlugs?: string[];        // match against v.categories[].slug/name (OR)
  materialTypeSlugs?: string[];    // project videos only (OR)
  serviceAreaSlugs?: string[];     // project videos only (OR)
  q?: string;                      // phrase match in title/excerpt (case-insensitive)
};

type VideoFiltersRecord = VideoFiltersInput & UnknownRecord;

function decodeOffset(cursor: string | null | undefined): number {
  if (!cursor) return 0;
  const n = parseInt(String(cursor), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
function encodeOffset(n: number): string { return String(n); }

function bucketOf(v: VideoItem): VideoBucketKey {
  if (v.source === "project") return "roofing-project";
  const slugs = (v.categories || []).map(c => (c.slug || c.name || "").toLowerCase());
  if (slugs.some(s => ["commercial", "commercials", "tv", "ad", "ads"].includes(s))) return "commercials";
  if (slugs.some(s => ["accolade", "accolades", "awards", "press"].includes(s))) return "accolades";
  if (slugs.some(s => ["explainer", "explainers", "how-to", "tips", "education", "educational"].includes(s))) return "explainers";
  return "other";
}

function includesAny(hay: string[], needles?: string[]): boolean {
  if (!needles || needles.length === 0) return true;
  const set = new Set(needles.map(s => s.toLowerCase()));
  return hay.some(h => set.has(String(h).toLowerCase()));
}

export async function listVideoItemsPaged({
  first = 24,
  after = null,
  filters = {},
}: {
  first?: number;
  after?: string | null;
  filters?: VideoFiltersInput;
}) {
  // Determine which pools to fetch based on filters
  const f = (filters ?? {}) as VideoFiltersRecord;
  const record = f as UnknownRecord;
  const qValue = record.q ?? f.q;
  const q = typeof qValue === 'string' ? qValue.trim().toLowerCase() : String(qValue ?? '').trim().toLowerCase();
  const bucketsListRaw =
    Array.isArray(f.buckets) ? f.buckets
      : Array.isArray(record.bucket) ? record.bucket
        : Array.isArray(record.b) ? record.b
          : null;
  const bucketsList = bucketsListRaw ? bucketsListRaw.map((value) => String(value)) : null;
  const bucketSet = bucketsList && bucketsList.length ? new Set(bucketsList as VideoBucketKey[]) : null;

  const mtSelected = Array.isArray(f.materialTypeSlugs) && f.materialTypeSlugs.length > 0;
  const saSelected = Array.isArray(f.serviceAreaSlugs) && f.serviceAreaSlugs.length > 0;

  const wantProjects = mtSelected || saSelected || !bucketSet || bucketSet.has('roofing-project');
  const wantEntries = !bucketSet || Array.from(bucketSet).some((b) => b !== 'roofing-project');

  // Bound the pool size relative to requested page + cursor offset
  const offset = decodeOffset(after);
  const poolSize = Math.min(200, Math.max(60, offset + first * 3));

  const [entries, projects] = await Promise.all([
    wantEntries ? listRecentVideoEntries(poolSize) : Promise.resolve([]),
    wantProjects ? listProjectVideos(poolSize) : Promise.resolve([]),
  ]);
  const all = [...(entries as VideoItem[]), ...(projects as VideoItem[])];
  const buckets = bucketSet;

  // Accept `categorySlugs` (preferred) or `categories`/`cat`
  const pickArray = (value: unknown): string[] | null =>
    Array.isArray(value) && value.length ? value.map((v) => String(v)) : null;

  const catInput = pickArray(f.categorySlugs)
    ?? pickArray(record.categories)
    ?? pickArray(record.cat);
  const catSlugs = catInput ? catInput.map((s) => s.toLowerCase()) : null;

  // Project-only filters with friendly aliases
  const mtInput = pickArray(f.materialTypeSlugs)
    ?? pickArray(record.materialSlugs)
    ?? pickArray(record.material);
  const mt = mtInput ? mtInput.map((s) => s.toLowerCase()) : null;

  const saInput = pickArray(f.serviceAreaSlugs)
    ?? pickArray(record.serviceAreaSlugs)
    ?? pickArray(record.serviceArea);
  const sa = saInput ? saInput.map((s) => s.toLowerCase()) : null;

  const matchesFilters = (v: VideoItem, omit?: 'bucket' | 'material_type' | 'service_area'): boolean => {
    if (omit !== 'bucket') {
      const bucket = bucketOf(v);
      if (buckets && !buckets.has(bucket)) return false;
    }

    if (catSlugs) {
      const vs = v.categories.map((c) => (c.slug || c.name || '').toLowerCase());
      if (!includesAny(vs, catSlugs)) return false;
    }

    if (omit !== 'material_type' && mt) {
      if (v.source !== 'project') return false;
      const vs = (v.materialTypes || []).map((t) => (t.slug || '').toLowerCase());
      if (!includesAny(vs, mt)) return false;
    }

    if (omit !== 'service_area' && sa) {
      if (v.source !== 'project') return false;
      const vs = (v.serviceAreas || []).map((t) => (t.slug || '').toLowerCase());
      if (!includesAny(vs, sa)) return false;
    }

    if (q) {
      const title = (v.title || '').toLowerCase();
      const ex = (v.excerpt || '').toLowerCase();
      if (!(title.includes(q) || (ex && ex.includes(q)))) return false;
    }

    return true;
  };

  const filtered = all
    .filter((v) => matchesFilters(v))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const start = decodeOffset(after);
  const end = Math.min(start + Math.max(1, Math.min(first, 50)), filtered.length);
  const slice = filtered.slice(start, end);
  const hasNextPage = end < filtered.length;
  const endCursor = hasNextPage ? encodeOffset(end) : null;

  const BUCKET_LABELS: Record<VideoBucketKey, string> = {
    commercials: "Commercials",
    explainers: "Explainers",
    "roofing-project": "Roofing Projects",
    accolades: "Accolades",
    other: "Other",
  };
  const isVideoBucketKey = (value: string): value is VideoBucketKey =>
    Object.prototype.hasOwnProperty.call(BUCKET_LABELS, value);
  const bucketLabelFor = (slug: string, fallback?: string): string =>
    isVideoBucketKey(slug) ? BUCKET_LABELS[slug] : fallback ?? slug;

  const countBuckets = <T extends string>(itemsToCount: VideoItem[], getKeys: (v: VideoItem) => { slug: T; name: string }[]): Map<T, { name: string; count: number }> => {
    const map = new Map<T, { name: string; count: number }>();
    for (const item of itemsToCount) {
      for (const info of getKeys(item)) {
        const prev = map.get(info.slug);
        if (prev) {
          prev.count += 1;
        } else {
          map.set(info.slug, { name: info.name, count: 1 });
        }
      }
    }
    return map;
  };

  const bucketFacetItems = all.filter((v) => matchesFilters(v, 'bucket'));
  const bucketCountsRaw = countBuckets(bucketFacetItems, (v) => [
    { slug: bucketOf(v) as string, name: bucketLabelFor(bucketOf(v)) },
  ]);
  const bucketOrder: string[] = [...(Object.keys(BUCKET_LABELS) as VideoBucketKey[])];
  const bucketCounts = new Map<string, { name: string; count: number }>();
  for (const slug of bucketOrder) {
    const key = String(slug).toLowerCase();
    bucketCounts.set(key, { name: bucketLabelFor(key, bucketLabelFor(String(slug))), count: 0 });
  }
  bucketCountsRaw.forEach((info, slug) => {
    const key = String(slug).toLowerCase();
    const label = bucketLabelFor(key, info.name ?? key);
    const prev = bucketCounts.get(key);
    bucketCounts.set(key, { name: label, count: (prev?.count ?? 0) + info.count });
    if (!bucketOrder.includes(key)) bucketOrder.push(key);
  });
  if (Array.isArray(bucketsList) && bucketsList.length) {
    for (const value of bucketsList) {
      const key = String(value).toLowerCase();
      if (!bucketOrder.includes(key)) bucketOrder.push(key);
      if (!bucketCounts.has(key)) {
        const label = bucketLabelFor(key);
        bucketCounts.set(key, { name: label, count: 0 });
      }
    }
  }

  const materialFacetItems = all.filter((v) => matchesFilters(v, 'material_type'));
  const materialCounts = countBuckets(materialFacetItems, (v) =>
    (v.materialTypes || []).map((term) => ({ slug: String(term.slug || '').toLowerCase(), name: String(term.name || term.slug || '') }))
  );

  const serviceFacetItems = all.filter((v) => matchesFilters(v, 'service_area'));
  const serviceCounts = countBuckets(serviceFacetItems, (v) =>
    (v.serviceAreas || []).map((term) => ({ slug: String(term.slug || '').toLowerCase(), name: String(term.name || term.slug || '') }))
  );

  const ensureKeys = (map: Map<string, { name: string; count: number }>, keys: (string | undefined | null)[], fallbackName?: (slug: string) => string) => {
    for (const key of keys) {
      if (!key) continue;
      const slug = String(key).toLowerCase();
      if (!map.has(slug)) {
        map.set(slug, { name: fallbackName ? fallbackName(slug) : slug, count: 0 });
      }
    }
  };

  ensureKeys(materialCounts, mtInput || []);
  ensureKeys(serviceCounts, saInput || []);

  const facets: FacetGroup[] = [
    {
      taxonomy: 'bucket',
      buckets: bucketOrder
        .map((slug) => {
          const info = bucketCounts.get(slug);
          if (!info) return null;
          return {
            slug,
            name: info.name,
            count: info.count,
          };
        })
        .filter((bucket): bucket is FacetGroup["buckets"][number] => bucket !== null),
    },
    {
      taxonomy: 'material_type',
      buckets: Array.from(materialCounts.entries()).map(([slug, info]) => ({
        slug,
        name: info.name,
        count: info.count,
      })),
    },
    {
      taxonomy: 'service_area',
      buckets: Array.from(serviceCounts.entries()).map(([slug, info]) => ({
        slug,
        name: info.name,
        count: info.count,
      })),
    },
  ];

  const total = filtered.length;

  return {
    pageInfo: { hasNextPage, endCursor },
    items: slice,
    total,
    facets,
    meta: {
      overallTotal: total,
    },
  } as PageResult<VideoItem> & { facets: FacetGroup[] };
}

// === 

// --- List recent posts for the archive ---
export async function listRecentPosts(limit = 12): Promise<PostCard[]> {
  const query = /* GraphQL */ `
    query ListRecentPosts($limit: Int!) {
      posts(first: $limit, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
        nodes {
          slug
          title
          date
          content(format: RENDERED)
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
          categories(first: 6) {
            nodes {
              name
              slug
            }
          }
          excerpt(format: RENDERED)
        }
      }
    }
  `;
  const data = await wpFetch<{ posts: { nodes: UnknownRecord[] } }>(query, { limit });
  const nodes = data?.posts?.nodes ?? [];

  return nodes.map((node) => {
    const featuredImageNode = extractNode(node.featuredImage);
    const featuredImageRecord = asRecord(featuredImageNode);
    const featuredImage = featuredImageRecord && typeof featuredImageRecord.sourceUrl === 'string'
      ? {
        url: String(featuredImageRecord.sourceUrl),
        altText: featuredImageRecord.altText ? String(featuredImageRecord.altText) : undefined,
      }
      : undefined;

    const categoriesNodes = extractNodes(node.categories);
    const categories = categoriesNodes
      .map((item) => toStringSafe(asRecord(item)?.name))
      .filter((name) => name.length > 0);

    const categoryTerms: TermLite[] = categoriesNodes
      .map((item) => {
        const record = asRecord(item);
        return record
          ? {
            name: toStringSafe(record.name),
            slug: toStringSafe(record.slug),
          }
          : null;
      })
      .filter((term): term is TermLite => !!term && term.name.length > 0);

    const content = typeof node.content === 'string' ? node.content : '';
    const excerpt = typeof node.excerpt === 'string' ? node.excerpt : undefined;

    return {
      slug: toStringSafe(node.slug),
      title: toStringSafe(node.title),
      date: toStringSafe(node.date),
      featuredImage,
      categories,
      categoryTerms,
      readingTimeMinutes: content ? calcReadingTimeMinutes(content) : undefined,
      excerpt: excerpt ?? undefined,
      contentPlain: stripHtml(content),
    } satisfies PostCard;
  });
}

/**
 * Lightweight list of blog categories (taxonomy terms) for building filter pills.
 * Uses hideEmpty to avoid fetching posts just to discover categories.
 */
export async function listBlogCategories(limit = 100): Promise<TermLite[]> {
  const query = /* GraphQL */ `
    query ListBlogCategories($first: Int!) {
      categories(first: $first, where: { hideEmpty: true }) {
        nodes { name slug }
      }
    }
  `;
  const data = await wpFetch<{ categories: { nodes: UnknownRecord[] } }>(query, { first: limit }, 86400);
  const nodes = data?.categories?.nodes || [];
  return nodes.map((n) => ({ name: String(n?.name || ''), slug: String(n?.slug || '') }));
}

/**
 * Lightweight pool of recent posts for client-side recommendation/filtering.
 * Returns only: slug, title, date, featuredImage, categories (with slugs).
 * Keep `limit` modest (e.g., 24–48) to cover common categories without heavy payloads.
 */
export async function listRecentPostsPool(limit = 36): Promise<PostLite[]> {
  const query = /* GraphQL */ `
    query ListRecentPostsPool($limit: Int!) {
      posts(first: $limit, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
        nodes {
          slug
          title
          date
          featuredImage { node { sourceUrl altText } }
          categories(first: 12) { nodes { name slug } }
          content(format: RENDERED)
          excerpt(format: RENDERED)
        }
      }
    }
  `;

  const data = await wpFetch<{ posts: { nodes: UnknownRecord[] } }>(query, { limit });
  const nodes = data?.posts?.nodes || [];

  return nodes.map((node: UnknownRecord): PostLite => {
    const contentHtml = typeof node.content === 'string' ? node.content : null;
    const excerptHtml = typeof node.excerpt === 'string' ? node.excerpt : null;
    return {
      slug: toStringSafe(node.slug),
      title: toStringSafe(node.title),
      date: typeof node.date === 'string' ? node.date : null,
      featuredImage: pickImageFrom(node.featuredImage),
      categories: mapTermNodes(node.categories),
      excerpt: toTrimmedExcerpt(excerptHtml) ?? null,
      contentPlain: (() => {
        const html = contentHtml?.length ? contentHtml : excerptHtml;
        const text = stripHtml(html ?? '');
        return text ? text : null;
      })(),
    } satisfies PostLite;
  });
}

// --- Paged blog list with optional filters (categories by slug, search) ---
export type PostsFiltersInput = {
  q?: string;                      // optional WP fulltext search
  categorySlugs?: string[];        // include categories (OR)
  excludeCategorySlugs?: string[]; // exclude categories (NOT_IN)
};

export async function listPostsPaged({
  first = 24,
  after = null,
  filters = {},
}: {
  first?: number;
  after?: string | null;
  filters?: PostsFiltersInput;
}) {
  const size = Math.max(1, Math.min(first, 50));
  const offset = after ? Math.max(0, parseInt(String(after), 10) || 0) : 0;

  const filtersRecord = asRecord(filters);

  let searchRaw = typeof filters?.q === 'string' ? filters.q : '';
  if (!searchRaw && filtersRecord && typeof filtersRecord.search === 'string') {
    searchRaw = filtersRecord.search;
  }
  const search = searchRaw.trim().length ? searchRaw.trim() : null;

  const includeCats = Array.isArray(filters?.categorySlugs)
    ? filters.categorySlugs.filter((s) => typeof s === 'string' && s.trim().length)
    : [];
  const excludeCats = Array.isArray(filters?.excludeCategorySlugs)
    ? filters.excludeCategorySlugs.filter((s) => typeof s === 'string' && s.trim().length)
    : [];

  const taxArray: Array<Record<string, unknown>> = [];
  if (includeCats.length) {
    taxArray.push({ taxonomy: 'CATEGORY', terms: includeCats, field: 'SLUG', operator: 'IN' });
  }
  if (excludeCats.length) {
    taxArray.push({ taxonomy: 'CATEGORY', terms: excludeCats, field: 'SLUG', operator: 'NOT_IN' });
  }

  const query = /* GraphQL */ `
    query BlogArchive(
      $offsetPagination: OffsetPagination
      $search: String
      $taxQuery: TaxQuery
      $facetTaxonomies: [FacetInput!]!
    ) {
      posts(
        where: {
          status: PUBLISH
          orderby: { field: DATE, order: DESC }
          search: $search
          offsetPagination: $offsetPagination
          taxQuery: $taxQuery
        }
      ) {
        nodes {
          slug
          title
          date
          featuredImage { node { sourceUrl altText } }
          categories(first: 12) { nodes { name slug } }
          content(format: RENDERED)
          excerpt(format: RENDERED)
        }
        pageInfo {
          offsetPagination {
            total
            hasMore
          }
        }
      }
      facetCounts(
        postType: "post"
        search: $search
        taxQuery: $taxQuery
        taxonomies: $facetTaxonomies
      ) {
        total
        facets {
          taxonomy
          buckets {
            slug
            name
            count
          }
        }
      }
    }
  `;

  const variables: Record<string, unknown> = {
    offsetPagination: { offset, size },
    search: search ?? undefined,
    taxQuery: taxArray.length ? { relation: 'AND', taxArray } : undefined,
    facetTaxonomies: [{ taxonomy: 'category' }],
  };

  type BlogArchiveResponse = {
    posts: {
      nodes?: UnknownRecord[];
      pageInfo?: { offsetPagination?: { total?: number; hasMore?: boolean } | null };
    };
    facetCounts?: {
      total?: number;
      facets?: UnknownRecord[];
    };
  };

  const data = await wpFetch<BlogArchiveResponse>(query, variables);

  const nodes: UnknownRecord[] = data?.posts?.nodes ?? [];
  const offsetInfo = data?.posts?.pageInfo?.offsetPagination ?? null;
  const total = typeof offsetInfo?.total === 'number'
    ? offsetInfo.total
    : Math.max(offset + nodes.length, 0);
  const hasMore = Boolean(offsetInfo?.hasMore) || offset + nodes.length < total;

  const items: PostCard[] = nodes.map((node) => {
    const featuredImageNode = extractNode(node.featuredImage);
    const featuredImageRecord = asRecord(featuredImageNode);
    const categoriesNodes = extractNodes(node.categories);

    const categories = categoriesNodes
      .map((item) => toStringSafe(asRecord(item)?.name))
      .filter((name) => name.length > 0);

    const categoryTerms: TermLite[] = categoriesNodes
      .map((item) => {
        const record = asRecord(item);
        if (!record) return null;
        const name = toStringSafe(record.name);
        const slug = toStringSafe(record.slug);
        return { name, slug } satisfies TermLite;
      })
      .filter((term): term is TermLite => term !== null);

    return {
      slug: toStringSafe(node.slug),
      title: toStringSafe(node.title),
      date: toStringSafe(node.date),
      featuredImage:
        featuredImageRecord && typeof featuredImageRecord.sourceUrl === 'string'
          ? {
            url: String(featuredImageRecord.sourceUrl || ''),
            altText: featuredImageRecord.altText ? String(featuredImageRecord.altText) : undefined,
          }
          : undefined,
      categories,
      categoryTerms,
      excerpt: toTrimmedExcerpt(typeof node.excerpt === 'string' ? node.excerpt : undefined),
      contentPlain: stripHtml(String(node.content ?? '')),
    } satisfies PostCard;
  });

  const nextOffset = offset + items.length;
  const pageInfo: PageInfo = {
    hasNextPage: hasMore,
    endCursor: hasMore ? String(nextOffset) : null,
  };

  const facetGroups = mapFacetGroupsFromWp(data?.facetCounts?.facets);

  const facetTotal = typeof data?.facetCounts?.total === 'number' ? data.facetCounts.total : total;

  return {
    items,
    pageInfo,
    total,
    facets: facetGroups,
    meta: {
      overallTotal: facetTotal,
    },
  } satisfies PageResult<PostCard> & { facets: FacetGroup[] };
}

/**
 * Build a curated pool of recent posts that guarantees enough items per category filter,
 * without fetching the entire archive. The result is merged + de-duped by slug.
 *
 * @param perType  number of posts to guarantee per category (e.g., 4)
 * @param allCount number of posts to include for the "All" tab (e.g., 4)
 * @param fetchCap minimum batch size to fetch once (upper bound; function will fetch max of this and needed)
 * @param categorySlugs list of category slugs to cover
 */
export async function listRecentPostsPoolForFilters(
  perType = 4,
  allCount = 4,
  fetchCap = 60,
  categorySlugs: string[] = ['education', 'hurricane-preparation', 'energy-efficient-roofing']
): Promise<PostCard[]> {
  const needed = allCount + perType * categorySlugs.length * 2; // modest cushion for de-dupes
  const batchSize = Math.max(fetchCap, needed);
  const recent = await listRecentPosts(batchSize);

  const byCat = (slug: string) =>
    recent
      .filter((post) =>
        Array.isArray(post.categoryTerms) && post.categoryTerms.some((term) => term.slug === slug)
      )
      .slice(0, perType);

  const allLatest = recent.slice(0, allCount);
  const buckets = categorySlugs.map(byCat);

  const seen = new Set<string>();
  const pool: PostCard[] = [];
  const pushUnique = (arr: PostCard[]) => {
    for (const p of arr) {
      if (!seen.has(p.slug)) {
        seen.add(p.slug);
        pool.push(p);
      }
    }
  };

  pushUnique(allLatest);
  buckets.forEach(pushUnique);

  return pool;
}

// --- Slugs for static params (future-proofing your /[slug]) ---
export async function listPostSlugs(limit = 200): Promise<string[]> {
  const query = /* GraphQL */ `
    query ListPostSlugs($limit: Int!) {
      posts(first: $limit, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
        nodes {
          slug
        }
      }
    }
  `;
  const data = await wpFetch<{ posts: { nodes: { slug: string | null }[] } }>(query, { limit });
  return (data.posts?.nodes || []).map((n) => n.slug).filter(Boolean) as string[];
}

/**
 * Lightweight recent post list for prev/next navigation.
 * Returns only slug, title, date. Keeps payload very small compared to full cards.
 */
export async function listRecentPostNav(limit = 200): Promise<Array<{ slug: string; title: string; date: string }>> {
  const query = /* GraphQL */ `
    query ListRecentPostNav($limit: Int!) {
      posts(first: $limit, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
        nodes { slug title date }
      }
    }
  `;
  const data = await wpFetch<{ posts: { nodes: UnknownRecord[] } }>(query, { limit }, 1800);
  const nodes = data?.posts?.nodes || [];
  return nodes
    .map((n) => ({ slug: String(n?.slug || ''), title: String(n?.title || ''), date: String(n?.date || '') }))
    .filter((n) => !!n.slug);
}

// --- Single post fetch (for your /[slug] page later) ---
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const query = /* GraphQL */ `
    query GetPostBySlug($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        slug
        title
        date
        modified
        author { node { name } }
        excerpt(format: RENDERED)
        content(format: RENDERED)
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories(first: 12) {
          nodes { name slug }
        }
        seo {
          title
          description
          canonicalUrl
          openGraph {
            title
            description
            type
            image { url secureUrl width height type }
          }
        }
      }
    }
  `;
  const data = await wpFetch<{ post: UnknownRecord | null }>(query, { slug });
  const p = asRecord(data.post);
  if (!p) return null;

  const featuredImageNode = extractNode(p.featuredImage);
  const featuredImageRecord = asRecord(featuredImageNode);
  const categoryNodes = extractNodes(p.categories);
  const categories = categoryNodes
    .map((node) => toStringSafe(readRecordString(asRecord(node), "name")))
    .filter((name) => name.length > 0);

  const categoryTerms: TermLite[] = categoryNodes
    .map((node) => {
      const record = asRecord(node);
      if (!record) return null;
      const name = toStringSafe(record.name);
      const slug = toStringSafe(record.slug);
      if (!name && !slug) return null;
      return { name, slug };
    })
    .filter((term): term is TermLite => Boolean(term && (term.name.length > 0 || term.slug.length > 0)));

  return {
    slug: toStringSafe(p.slug) || slug,
    title: toStringSafe(p.title),
    contentHtml: typeof p.content === 'string' ? p.content : '',
    date: toStringSafe(p.date),
    modified: toStringSafe(p.modified),
    authorName: (() => {
      const authorRecord = asRecord(p.author);
      const authorNode = asRecord(authorRecord?.node);
      return readRecordString(authorNode, "name");
    })(),
    featuredImage:
      featuredImageRecord && typeof featuredImageRecord.sourceUrl === 'string'
        ? {
          url: String(featuredImageRecord.sourceUrl),
          altText: featuredImageRecord.altText ? String(featuredImageRecord.altText) : undefined,
        }
        : undefined,
    categories,
    categoryTerms,
    excerpt: typeof p.excerpt === 'string' ? p.excerpt : undefined,
    seo: isRecord(p.seo) ? (p.seo as Post['seo']) : undefined,
  } satisfies Post;
}

/**
 * Get latest projects (server-side), include description and filter taxonomies
 * (material, roofColor, serviceArea) for client-side search & filtering.
 * NOTE: `_opts.material` is intentionally ignored to keep filtering on the client.
 */
export async function listRecentProjects(
  limit = 6,
  _opts?: { material?: string | null }
): Promise<ProjectSummary[]> {
  void _opts;
  const query = /* GraphQL */ `
    query RecentProjects($limit: Int!) {
      projects(first: $limit, where: { orderby: { field: DATE, order: DESC } }) {
        nodes {
          slug
          uri
          title
          date
          featuredImage { node { sourceUrl altText } }
          projectDetails { projectDescription }
          projectFilters {
            materialType { nodes { name slug } }
            roofColor    { nodes { name slug } }
            serviceArea  { nodes { name slug } }
          }
        }
      }
    }
  `;
  const data = await wpFetch<{ projects: { nodes?: UnknownRecord[] } }>(query, { limit });
  const nodes = data?.projects?.nodes ?? [];
  return nodes.map((entry) => {
    const filters = asRecord(entry.projectFilters);
    const projectDetails = asRecord(entry.projectDetails);
    const isoDate = stringOrNull(entry.date);
    return {
      slug: toStringSafe(entry.slug),
      uri: toStringSafe(entry.uri),
      title: toStringSafe(entry.title),
      year: pickYear(isoDate),
      date: isoDate,
      heroImage: pickImageFrom(entry.featuredImage),
      projectDescription: readProjectDescription(projectDetails),
      materialTypes: mapTermNodes(filters?.materialType),
      roofColors: mapTermNodes(filters?.roofColor),
      serviceAreas: mapTermNodes(filters?.serviceArea),
    } satisfies ProjectSummary;
  });
}

/**
 * Lightweight pool of recent projects for client-side recommendation modules.
 * Delegates to listRecentProjects but allows callers to request a larger batch.
 */
export async function listRecentProjectsPool(limit = 24): Promise<ProjectSummary[]> {
  return listRecentProjects(limit);
}

export type ProjectsArchiveFilters = {
  search?: string | null;
  materialTypeSlugs?: string[];
  roofColorSlugs?: string[];
  serviceAreaSlugs?: string[];
};

type FacetBucket = { slug: string; name: string; count: number };
export type FacetGroup = { taxonomy: string; buckets: FacetBucket[] };

export type ProjectSearchResult = {
  items: ProjectSummary[];
  pageInfo: PageInfo;
  total: number;
  facets: FacetGroup[];
  meta?: Record<string, unknown>;
};

export function mapFacetBucketsFromWp(rawBuckets: unknown): FacetGroup["buckets"] {
  const bucketArray = Array.isArray(rawBuckets) ? rawBuckets : extractNodes(rawBuckets);
  const buckets: FacetGroup["buckets"] = [];
  for (const bucketNode of bucketArray) {
    const bucketRecord = asRecord(bucketNode);
    if (!bucketRecord) continue;
    const slug = toStringSafe(bucketRecord.slug).trim();
    const name = toStringSafe(bucketRecord.name);
    const count = typeof bucketRecord.count === "number" ? bucketRecord.count : 0;
    if (!slug && !name) continue;
    buckets.push({ slug, name, count });
  }
  return buckets;
}

export function mapFacetGroupsFromWp(rawFacets: unknown): FacetGroup[] {
  if (!Array.isArray(rawFacets)) return [];
  return rawFacets
    .map((facetNode) => {
      const facetRecord = asRecord(facetNode);
      if (!facetRecord) return null;
      const taxonomy = toStringSafe(facetRecord.taxonomy);
      const buckets = mapFacetBucketsFromWp(facetRecord.buckets);
      return { taxonomy, buckets } satisfies FacetGroup;
    })
    .filter((facet): facet is FacetGroup => facet !== null);
}

/**
 * Cursor-based project pagination for archives.
 * Supports optional taxonomy filters for pre-selecting materials, colors, and service areas.
 */
export async function listProjectsPaged({
  first = 24,
  after = null,
  filters = {},
}: {
  first?: number;
  after?: string | null;
  filters?: ProjectsArchiveFilters;
}): Promise<ProjectSearchResult> {
  const size = Math.max(1, Math.min(first, 50));
  const offset = after ? Math.max(0, parseInt(String(after), 10) || 0) : 0;

  const searchRaw = typeof filters?.search === 'string' ? filters.search.trim() : '';
  const search = searchRaw.length ? searchRaw : null;

  const mtSlugs = Array.isArray(filters?.materialTypeSlugs)
    ? filters.materialTypeSlugs.filter((s) => typeof s === 'string' && s.trim().length)
    : [];
  const rcSlugs = Array.isArray(filters?.roofColorSlugs)
    ? filters.roofColorSlugs.filter((s) => typeof s === 'string' && s.trim().length)
    : [];
  const saSlugs = Array.isArray(filters?.serviceAreaSlugs)
    ? filters.serviceAreaSlugs.filter((s) => typeof s === 'string' && s.trim().length)
    : [];

  const taxArray: Array<Record<string, unknown>> = [];
  if (mtSlugs.length) {
    taxArray.push({ taxonomy: 'MATERIALTYPE', terms: mtSlugs, field: 'SLUG', operator: 'IN' });
  }
  if (rcSlugs.length) {
    taxArray.push({ taxonomy: 'ROOFCOLOR', terms: rcSlugs, field: 'SLUG', operator: 'IN' });
  }
  if (saSlugs.length) {
    taxArray.push({ taxonomy: 'SERVICEAREA', terms: saSlugs, field: 'SLUG', operator: 'IN' });
  }

  const taxQuery = taxArray.length ? { relation: 'AND', taxArray } : undefined;

  const query = /* GraphQL */ `
    query ProjectArchive(
      $offsetPagination: OffsetPagination
      $search: String
      $taxQuery: TaxQuery
      $facetTaxonomies: [FacetInput!]!
    ) {
      projects(
        where: {
          status: PUBLISH
          orderby: { field: DATE, order: DESC }
          search: $search
          offsetPagination: $offsetPagination
          taxQuery: $taxQuery
        }
      ) {
        nodes {
          slug
          uri
          title
          date
          featuredImage { node { sourceUrl altText } }
          projectDetails { projectDescription }
          projectFilters {
            materialType { nodes { name slug } }
            roofColor    { nodes { name slug } }
            serviceArea  { nodes { name slug } }
          }
        }
        pageInfo {
          offsetPagination {
            total
            hasMore
          }
        }
      }
      facetCounts(
        postType: "project"
        search: $search
        taxQuery: $taxQuery
        taxonomies: $facetTaxonomies
      ) {
        total
        facets {
          taxonomy
          buckets {
            slug
            name
            count
          }
        }
      }
    }
  `;

  const variables: Record<string, unknown> = {
    offsetPagination: { offset, size },
    search: search ?? undefined,
    taxQuery,
    facetTaxonomies: [
      mtSlugs.length ? { taxonomy: 'material_type', slugs: mtSlugs } : { taxonomy: 'material_type' },
      rcSlugs.length ? { taxonomy: 'roof_color', slugs: rcSlugs } : { taxonomy: 'roof_color' },
      saSlugs.length ? { taxonomy: 'service_area', slugs: saSlugs } : { taxonomy: 'service_area' },
    ],
  };

  type ProjectArchiveResponse = {
    projects: {
      nodes?: UnknownRecord[];
      pageInfo?: { offsetPagination?: { total?: number; hasMore?: boolean } | null };
    };
    facetCounts?: {
      total?: number;
      facets?: UnknownRecord[];
    };
  };

  const data = await wpFetch<ProjectArchiveResponse>(query, variables);

  const nodes: UnknownRecord[] = data?.projects?.nodes ?? [];
  const offsetInfo = data?.projects?.pageInfo?.offsetPagination ?? null;
  const total = typeof offsetInfo?.total === 'number'
    ? offsetInfo.total
    : Math.max(offset + nodes.length, 0);
  const hasMore = Boolean(offsetInfo?.hasMore) || offset + nodes.length < total;

  const items: ProjectSummary[] = nodes.map((node) => {
    const filtersRecord = asRecord(node.projectFilters);
    const detailsRecord = asRecord(node.projectDetails);
    const isoDate = stringOrNull(node.date);
    return {
      slug: toStringSafe(node.slug),
      uri: toStringSafe(node.uri),
      title: toStringSafe(node.title),
      year: pickYear(isoDate),
      date: isoDate,
      heroImage: pickImageFrom(node.featuredImage),
      projectDescription: readProjectDescription(detailsRecord),
      materialTypes: mapTermNodes(filtersRecord?.materialType),
      roofColors: mapTermNodes(filtersRecord?.roofColor),
      serviceAreas: mapTermNodes(filtersRecord?.serviceArea),
    } satisfies ProjectSummary;
  });

  const nextOffset = offset + items.length;
  const pageInfo: PageInfo = {
    hasNextPage: hasMore,
    endCursor: hasMore ? String(nextOffset) : null,
  };

  const facetGroups: FacetGroup[] = Array.isArray(data?.facetCounts?.facets)
    ? data.facetCounts.facets.map((facetNode) => {
      const facetRecord = asRecord(facetNode);
      const bucketsSource = facetRecord?.buckets;
      const bucketsNodes = Array.isArray(bucketsSource) ? bucketsSource : extractNodes(bucketsSource);

      const buckets = bucketsNodes
        .map((bucketNode) => asRecord(bucketNode))
        .filter((bucketRecord): bucketRecord is UnknownRecord => Boolean(bucketRecord))
        .map((bucketRecord) => ({
          slug: toStringSafe(bucketRecord.slug),
          name: toStringSafe(bucketRecord.name),
          count: typeof bucketRecord.count === 'number' ? bucketRecord.count : 0,
        }));

      return {
        taxonomy: toStringSafe(facetRecord?.taxonomy),
        buckets,
      } satisfies FacetGroup;
    })
    : [];

  const facetTotal = typeof data?.facetCounts?.total === 'number' ? data.facetCounts.total : total;

  return {
    items,
    pageInfo,
    total,
    facets: facetGroups,
    meta: {
      overallTotal: facetTotal,
    },
  };
}

/** Fetch newest N projects by a specific material term slug */
export async function listRecentProjectsByMaterial(
  material: 'shingle' | 'metal' | 'tile',
  limit = 4
): Promise<ProjectSummary[]> {
  const query = /* GraphQL */ `
    query RecentProjectsByMaterial($limit: Int!, $slugs: [String]) {
      projects(
        first: $limit
        where: {
          status: PUBLISH
          orderby: { field: DATE, order: DESC }
          taxQuery: {
            taxArray: [
              { taxonomy: MATERIAL_TYPE, terms: $slugs, field: SLUG, operator: IN }
            ]
          }
        }
      ) {
        nodes {
          slug
          uri
          title
          date
          featuredImage { node { sourceUrl altText } }
          projectDetails { projectDescription }
          projectFilters {
            materialType { nodes { name slug } }
            roofColor    { nodes { name slug } }
            serviceArea  { nodes { name slug } }
          }
        }
      }
    }
  `;

  const data = await wpFetch<{ projects: { nodes?: UnknownRecord[] } }>(query, { limit, slugs: [material] });
  const nodes = data?.projects?.nodes ?? [];
  return nodes.map((node) => {
    const filtersRecord = asRecord(node.projectFilters);
    const detailsRecord = asRecord(node.projectDetails);
    const isoDate = stringOrNull(node.date);
    return {
      slug: toStringSafe(node.slug),
      uri: toStringSafe(node.uri),
      title: toStringSafe(node.title),
      year: pickYear(isoDate),
      date: isoDate,
      heroImage: pickImageFrom(node.featuredImage),
      projectDescription: readProjectDescription(detailsRecord),
      materialTypes: mapTermNodes(filtersRecord?.materialType),
      roofColors: mapTermNodes(filtersRecord?.roofColor),
      serviceAreas: mapTermNodes(filtersRecord?.serviceArea),
    } satisfies ProjectSummary;
  });
}

/**
 * Build a small curated pool that guarantees enough items for each pill filter.
 * - `allCount`: newest overall (drives the "All" tab ordering)
 * - `perType`: newest per material (ensures adequate items per filter)
 * Result is merged + de-duped by slug, preserving order of first appearance.
 */
export async function listRecentProjectsPoolForFilters(
  perType = 4,
  allCount = 8,
  fetchCap = 40
): Promise<ProjectSummary[]> {
  // Fetch a bounded recent batch once. We’ll derive per-type pools from it.
  const batchSize = Math.max(fetchCap, allCount + perType * 6);
  const recent = await listRecentProjects(batchSize);

  const byType = (slug: 'shingle' | 'metal' | 'tile') =>
    recent
      .filter(p => (p.materialTypes ?? []).some(t => t.slug === slug))
      .slice(0, perType);

  const allLatest = recent.slice(0, allCount);
  const shingle = byType('shingle');
  const metal = byType('metal');
  const tile = byType('tile');

  // Merge & de-dupe, preserving first appearance (recency)
  const seen = new Set<string>();
  const pool: ProjectSummary[] = [];
  const pushUnique = (arr: ProjectSummary[]) => {
    for (const p of arr) {
      if (!seen.has(p.slug)) {
        seen.add(p.slug);
        pool.push(p);
      }
    }
  };

  // Keep newest-overall first so the “All” tab reflects true recency
  pushUnique(allLatest);
  // Then guarantee per-category coverage
  pushUnique(shingle);
  pushUnique(metal);
  pushUnique(tile);

  return pool;
}

/** Slugs (for static params) */
export async function listProjectSlugs(limit = 500): Promise<string[]> {
  const query = /* GraphQL */ `
    query ProjectSlugs($limit: Int!) {
      projects(first: $limit, where: { orderby: { field: DATE, order: DESC } }) {
        nodes { slug }
      }
    }
  `;
  const data = await wpFetch<{ projects: { nodes?: UnknownRecord[] } }>(query, { limit });
  return (data?.projects?.nodes ?? [])
    .map((node) => toStringSafe(node?.slug))
    .filter((slug): slug is string => slug.length > 0);
}

/** Single project by slug – uses URI so it works regardless of idType enum */
export async function getProjectBySlug(slug: string): Promise<ProjectFull | null> {
  const uri = buildProjectUri(slug);

  const query = /* GraphQL */ `
    query ProjectByUri($uri: ID!) {
      project(id: $uri, idType: URI) {
        slug
        uri
        title
        date
        modified
        content
        featuredImage { node { sourceUrl altText } }

        seo {
          title
          description
          canonicalUrl
          openGraph {
            title
            description
            type
            image { url secureUrl width height type }
          }
        }

        # ACF Field Group: projectVideoInfo
        projectVideoInfo {
          youtubeUrl
        }

        # ACF Field Group: projectDetails
        projectDetails {
          projectDescription
          productLinks {
            productName
            productLink
          }
          projectImages {
            nodes {
              sourceUrl
              altText
              mediaDetails {
                width
                height
              }
            }
          }
          customerTestimonial {
            customerName
            customerReview
            ownerReply
            reviewUrl
            reviewDate
          }
        }

        # ACF Field Group: projectFilters (taxonomy fields)
        projectFilters {
          materialType { nodes { name slug } }
          roofColor    { nodes { name slug } }
          serviceArea  { nodes { name slug } }
        }
      }
    }
  `;

  const data = await wpFetch<{ project: UnknownRecord | null }>(query, { uri });
  const p = asRecord(data?.project);
  if (!p) return null;

  const projectFilters = asRecord(p.projectFilters);
  const projectDetails = asRecord(p.projectDetails);
  const videoInfo = asRecord(p.projectVideoInfo);

  const isoDate = stringOrNull(p.date);

  return {
    slug: toStringSafe(p.slug) || slug,
    uri: toStringSafe(p.uri) || uri,
    title: toStringSafe(p.title),
    year: pickYear(isoDate),
    date: isoDate,
    modified: toStringSafe(p.modified) || null,
    contentHtml: typeof p.content === 'string' ? p.content : '',
    heroImage: pickImageFrom(p.featuredImage),

    projectDescription: readProjectDescription(projectDetails),
    productLinks: mapProductLinks(asArray<Maybe<ProductLinkNode>>(projectDetails?.productLinks)),
    projectImages: mapImages(extractNodes(projectDetails?.projectImages) as Maybe<ImageNode>[]),
    customerTestimonial: readProjectTestimonial(projectDetails),

    materialTypes: mapTermNodes(projectFilters?.materialType),
    roofColors: mapTermNodes(projectFilters?.roofColor),
    serviceAreas: mapTermNodes(projectFilters?.serviceArea),

    youtubeUrl: typeof videoInfo?.youtubeUrl === 'string' ? videoInfo.youtubeUrl : null,
    seo: isRecord(p.seo) ? (p.seo as ProjectFull['seo']) : undefined,
  } satisfies ProjectFull;
}

/** Filter projects by taxonomy term slugs (works whether terms come from ACF taxonomy fields or normal term assignments) */
export type ProjectFiltersInput = {
  materialTypeSlugs?: string[];
  roofColorSlugs?: string[];
  serviceAreaSlugs?: string[];
  first?: number;
  after?: string | null;
};

/**
 * Uses WPGraphQL taxonomyQuery to filter by term slugs.
 * NOTE: The taxonomy names below must match the GraphQL names you set when registering taxonomies.
 * If you used ACF's Taxonomies UI and named them:
 *  - material_type   -> GraphQL: MATERIAL_TYPE (enum), MaterialType (object)
 *  - roof_color      -> GraphQL: ROOF_COLOR
 *  - service_area    -> GraphQL: SERVICE_AREA
 * adjust the taxonomy names in the query if yours differ.
 */
export async function filterProjects({
  materialTypeSlugs = [],
  roofColorSlugs = [],
  serviceAreaSlugs = [],
  first = 12,
  after = null,
}: ProjectFiltersInput) {
  const mt = materialTypeSlugs.filter((slug) => typeof slug === 'string' && slug.trim().length);
  const rc = roofColorSlugs.filter((slug) => typeof slug === 'string' && slug.trim().length);
  const sa = serviceAreaSlugs.filter((slug) => typeof slug === 'string' && slug.trim().length);

  const taxArray: Array<Record<string, unknown>> = [];
  if (mt.length) taxArray.push({ taxonomy: 'MATERIALTYPE', terms: mt, field: 'SLUG', operator: 'IN' });
  if (rc.length) taxArray.push({ taxonomy: 'ROOFCOLOR', terms: rc, field: 'SLUG', operator: 'IN' });
  if (sa.length) taxArray.push({ taxonomy: 'SERVICEAREA', terms: sa, field: 'SLUG', operator: 'IN' });

  const taxQuery = taxArray.length ? { relation: 'AND', taxArray } : undefined;

  const query = /* GraphQL */ `
    query FilterProjects(
      $first: Int!
      $after: String
      $taxQuery: TaxQuery
    ) {
      projects(
        first: $first
        after: $after
        where: {
          orderby: { field: DATE, order: DESC }
          taxQuery: $taxQuery
        }
      ) {
        pageInfo { hasNextPage endCursor }
        nodes {
          slug
          uri
          title
          date
          featuredImage { node { sourceUrl altText } }
          projectDetails { projectDescription }
          projectFilters {
            materialType { nodes { name slug } }
            roofColor    { nodes { name slug } }
            serviceArea  { nodes { name slug } }
          }
        }
      }
    }
  `;
  type FilterProjectsResponse = {
    projects: {
      pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
      nodes?: UnknownRecord[];
    };
  };

  const data = await wpFetch<FilterProjectsResponse>(query, {
    first,
    after,
    taxQuery,
  });

  const nodes: UnknownRecord[] = data?.projects?.nodes ?? [];
  const pageInfo = data?.projects?.pageInfo ?? { hasNextPage: false, endCursor: null };

  return {
    pageInfo,
    items: nodes.map((p): ProjectSummary => {
      const filters = asRecord(p.projectFilters);
      const details = asRecord(p.projectDetails);
      const dateValue = typeof p.date === 'string' ? p.date : null;
      return {
        slug: toStringSafe(p.slug),
        uri: toStringSafe(p.uri),
        title: toStringSafe(p.title),
        year: pickYear(dateValue),
        date: dateValue,
        heroImage: pickImageFrom(p.featuredImage),
        projectDescription: readProjectDescription(details),
        materialTypes: mapTermNodes(filters?.materialType),
        roofColors: mapTermNodes(filters?.roofColor),
        serviceAreas: mapTermNodes(filters?.serviceArea),
      };
    }),
  };
}

export async function listRecentProjectsByServiceArea(
  serviceAreaSlug: string | string[] | null,
  limit = 4
): Promise<ProjectSummary[]> {
  const slugs = Array.isArray(serviceAreaSlug) ? serviceAreaSlug : [serviceAreaSlug];
  const normalized = slugs
    .map((slug) => (typeof slug === 'string' ? slug.trim().toLowerCase() : ''))
    .filter((slug) => slug.length > 0);

  if (!normalized.length) return [];

  const uniqueBySlug = (projects: ProjectSummary[]): ProjectSummary[] => {
    const seen = new Set<string>();
    const deduped: ProjectSummary[] = [];
    for (const project of projects) {
      const slug = typeof project.slug === 'string' ? project.slug : '';
      if (!slug.length) continue;
      if (seen.has(slug)) continue;
      seen.add(slug);
      deduped.push(project);
    }
    return deduped;
  };

  const FALLBACK_SERVICE_AREA_SLUG = 'sarasota';

  const result = await filterProjects({
    serviceAreaSlugs: normalized,
    first: limit,
  });

  const primaryProjects = uniqueBySlug(result.items).slice(0, limit);

  const needsFallback =
    primaryProjects.length < limit && !normalized.includes(FALLBACK_SERVICE_AREA_SLUG);

  if (!needsFallback) {
    return primaryProjects.slice(0, limit);
  }

  const fallbackResult = await filterProjects({
    serviceAreaSlugs: [FALLBACK_SERVICE_AREA_SLUG],
    first: limit,
  });

  const fallbackProjects = uniqueBySlug(fallbackResult.items);
  const existingSlugs = new Set(primaryProjects.map((project) => project.slug));
  const backfill = fallbackProjects.filter(
    (project) => typeof project.slug === 'string' && !existingSlugs.has(project.slug)
  );

  // Preserve location-specific ordering; append Sarasota projects as backfill.
  return [...primaryProjects, ...backfill].slice(0, limit);
}

/** ----------------------------------------------------------------------
 * Lightweight term lists for Project filters (Material, Roof Color, Service Area)
 * These avoid fetching projects just to build pills on the Project Gallery.
 * Relies on WPGraphQL taxonomy root fields:
 *   materialTypes, roofColors, serviceAreas
 * If your GraphQL names differ, adjust the root field names below.
 * Cached aggressively (1 day) since terms change rarely.
 * --------------------------------------------------------------------- */

export async function listProjectMaterialTypes(limit = 100): Promise<TermLite[]> {
  const query = /* GraphQL */ `
    query ListProjectMaterialTypes($first: Int!) {
      materialTypes(first: $first, where: { hideEmpty: false }) {
        nodes { name slug }
      }
    }
  `;
  const data = await wpFetch<{ materialTypes: { nodes: UnknownRecord[] } }>(query, { first: limit }, 86400);
  return mapTermNodes(data?.materialTypes);
}

export async function listProjectRoofColors(limit = 100): Promise<TermLite[]> {
  const query = /* GraphQL */ `
    query ListProjectRoofColors($first: Int!) {
      roofColors(first: $first, where: { hideEmpty: false }) {
        nodes { name slug }
      }
    }
  `;
  const data = await wpFetch<{ roofColors: { nodes: UnknownRecord[] } }>(query, { first: limit }, 86400);
  return mapTermNodes(data?.roofColors);
}

export async function listProjectServiceAreas(limit = 100): Promise<TermLite[]> {
  const query = /* GraphQL */ `
    query ListProjectServiceAreas($first: Int!) {
      serviceAreas(first: $first, where: { hideEmpty: false }) {
        nodes { name slug }
      }
    }
  `;
  const data = await wpFetch<{ serviceAreas: { nodes: UnknownRecord[] } }>(query, { first: limit }, 86400);
  return mapTermNodes(data?.serviceAreas);
}

/** Convenience: fetch all three in parallel */
export async function listProjectFilterTerms() {
  const [materials, roofColors, serviceAreas] = await Promise.all([
    listProjectMaterialTypes(100),
    listProjectRoofColors(100),
    listProjectServiceAreas(100),
  ]);
  return { materials, roofColors, serviceAreas };
}

// ----- Generic helpers you can reuse for other CPTs later -----

/** Fetch WP general settings (handy for health checks) */
export async function getSiteMeta() {
  const query = /* GraphQL */ `
    query SiteMeta {
      generalSettings { title url description }
    }
  `;
  const data = await wpFetch<{ generalSettings?: UnknownRecord | null }>(query, undefined, 60);
  return asRecord(data?.generalSettings) ?? null;
}

/** Debug route helper: simple round-trip to check connectivity */
export async function pingWP() {
  try {
    const meta = await getSiteMeta();
    return { ok: true, meta };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : null;
    return { ok: false, error: message || "WPGraphQL error" };
  }
}
