import { cache } from "react";
import { videoObjectSchema } from "@/lib/seo/schema";
import { SITE_ORIGIN, ensureAbsoluteUrl } from "@/lib/seo/site";
import { sanitizeWordPressHtml } from "@/lib/content/wordpress-html";
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

const extractNodes = (value: unknown): unknown[] => {
  const record = asRecord(value);
  return record ? asArray(record.nodes) : [];
};

const extractNode = (value: unknown, key = 'node'): unknown => {
  const record = asRecord(value);
  return record ? record[key] : undefined;
};

const toImageNode = (value: unknown): Maybe<WpImageNode> => {
  const record = asRecord(value);
  return record as WpImageNode | null;
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

const sanitizeOptionalWordPressHtml = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const sanitized = sanitizeWordPressHtml(value).trim();
  return sanitized || null;
};

const readRecordString = (record: UnknownRecord | null, key: string): string | null => {
  if (!record) return null;
  const value = record[key];
  return typeof value === "string" ? value : null;
};

// ----- Endpoint & Auth -----
const WP_ENDPOINT =
  process.env.NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT ||
  "https://wp.sonshineroofing.com/graphql";

// Server-only env vars (keep these secret)
const WP_USER = process.env.WP_BASIC_AUTH_USER;
const WP_PASS = process.env.WP_BASIC_AUTH_PASS;

// Optional: toggle verbose error surface while developing
const WP_VERBOSE_ERRORS = process.env.NODE_ENV !== "production";

// ----- Types -----
export type WpImage = { url: string; altText: string; width?: number | null; height?: number | null };

export type TermLite = { name: string; slug: string };

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
  noindex?: boolean;
  primaryFocusKeyword?: string | null;
  focusKeywords?: string[];
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

export type VideoBucketKey = "roofing-project" | "commercials" | "explainers" | "in-the-field" | "other";

// === Location Types === //
export type LocationNeighborhood = {
  neighborhood: string | null;
  neighborhoodDescription: string | null;
  zipCodes: string[];
  neighborhoodImage: WpImage | null;
};
export type LocationFaqItem = { question: string | null; answer: string | null };
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
      neighborhoodDescription: sanitizeOptionalWordPressHtml(
        record?.neighborhoodDescription,
      ),
      zipCodes,
      neighborhoodImage: pickImageFrom(record?.neighborhoodImage),
    };
  });

  return {
    slug: toStringSafe(node.slug) || slug,
    title: toStringSafe(node.title),
    contentHtml: sanitizeWordPressHtml(toStringSafe(node.content)),
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
export type WpImageNode = {
  sourceUrl?: unknown;
  altText?: unknown;
  mediaDetails?: unknown;
};

const pickImage = (node?: Maybe<WpImageNode>): WpImage | null => {
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

export const mapImages = (rows?: readonly Maybe<WpImageNode>[]): WpImage[] =>
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

export function extractYouTubeId(url: string): string | null {
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

// ----- Queries -----
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
      $facetTaxonomiesFiltered: [FacetInput!]!
      $facetTaxonomiesAll: [FacetInput!]!
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
      facetCountsFiltered: facetCounts(
        postType: "post"
        search: $search
        taxQuery: $taxQuery
        taxonomies: $facetTaxonomiesFiltered
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
      facetCountsAll: facetCounts(
        postType: "post"
        taxonomies: $facetTaxonomiesAll
      ) {
        total
      }
    }
  `;

  const variables: Record<string, unknown> = {
    offsetPagination: { offset, size },
    search: search ?? undefined,
    taxQuery: taxArray.length ? { relation: 'AND', taxArray } : undefined,
    facetTaxonomiesFiltered: [{ taxonomy: 'category' }],
    facetTaxonomiesAll: [{ taxonomy: 'category' }],
  };

  type BlogArchiveResponse = {
    posts: {
      nodes?: UnknownRecord[];
      pageInfo?: { offsetPagination?: { total?: number; hasMore?: boolean } | null };
    };
    facetCountsFiltered?: {
      total?: number;
      facets?: UnknownRecord[];
    };
    facetCountsAll?: {
      total?: number;
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

  const facetGroups = mapFacetGroupsFromWp(data?.facetCountsFiltered?.facets);
  const facetTotal = typeof data?.facetCountsFiltered?.total === 'number' ? data.facetCountsFiltered.total : total;
  const fullTotal = typeof data?.facetCountsAll?.total === 'number' ? data.facetCountsAll.total : facetTotal;

  return {
    items,
    pageInfo,
    total,
    facets: facetGroups,
    meta: {
      overallTotal: facetTotal,
      fullTotal,
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

type FacetBucket = { slug: string; name: string; count: number };
export type FacetGroup = { taxonomy: string; buckets: FacetBucket[] };

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
