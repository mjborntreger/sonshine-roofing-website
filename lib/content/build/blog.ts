import { sanitizeDirectusHtml } from '../directus-html.ts';
import type { WpImage, TermLite } from '../wp';
import type { NormalizedBlogPost } from '../editorial-types';
export const SONSHINE_MICHAEL_PERSON_ID = 'f028dafd-c2fb-4d59-a561-2be5e46ea318';

export const DIRECTUS_POST_FIELDS = [
  'client.slug',
  'status',
  'title',
  'slug',
  'body',
  'excerpt',
  'meta_title',
  'meta_description',
  'noindex',
  'primary_focus_keyword',
  'focus_keywords',
  'og_title',
  'og_description',
  'og_image_override.id',
  'og_image_override.description',
  'og_image_override.width',
  'og_image_override.height',
  'published_at',
  'source_updated_at',
  'date_created',
  'date_updated',
  'featured',
  'featured_image.id',
  'featured_image.description',
  'featured_image.width',
  'featured_image.height',
  'author.id',
  'author.first_name',
  'author.last_name',
  'author.client.slug',
  'topics.blog_topic.name',
  'topics.blog_topic.slug',
  'topics.blog_topic.status',
  'topics.blog_topic.client.slug',
] as const;

export type UnknownRecord = Record<string, unknown>;

export type DirectusConfig = {
  url: string;
  clientSlug: string;
  token: string;
};

export type DirectusBlogPost = {
  client?: unknown;
  status?: unknown;
  title?: unknown;
  slug?: unknown;
  body?: unknown;
  excerpt?: unknown;
  meta_title?: unknown;
  meta_description?: unknown;
  noindex?: unknown;
  primary_focus_keyword?: unknown;
  focus_keywords?: unknown;
  og_title?: unknown;
  og_description?: unknown;
  og_image_override?: unknown;
  published_at?: unknown;
  source_updated_at?: unknown;
  date_created?: unknown;
  date_updated?: unknown;
  featured?: unknown;
  featured_image?: unknown;
  author?: unknown;
  topics?: unknown;
};

export const asRecord = (value: unknown): UnknownRecord | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;

export const readString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export const readBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const normalized = readString(value)?.toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

export const readNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export const readRelationSlug = (value: unknown): string | null =>
  readString(asRecord(value)?.slug);

export function directusAssetUrl(config: DirectusConfig, id: string): string {
  return `${config.url}/assets/${encodeURIComponent(id)}`;
}

export function mapDirectusImage(value: unknown, config: DirectusConfig): WpImage | null {
  const record = asRecord(value);
  const id = readString(record?.id) ?? readString(value);
  if (!id) return null;

  const description = readString(record?.description);
  if (!description) {
    throw new Error(`[blog] Directus featured image ${id} is missing its required description.`);
  }

  return {
    url: directusAssetUrl(config, id),
    altText: description,
    width: readNumber(record?.width),
    height: readNumber(record?.height),
  };
}

export function mapDirectusAuthor(value: unknown, config: DirectusConfig): string | null {
  const record = asRecord(value);
  if (!record) return null;

  const id = readString(record.id);
  const clientSlug = readRelationSlug(record.client);
  const name = [readString(record.first_name), readString(record.last_name)]
    .filter((part): part is string => Boolean(part))
    .join(' ')
    .trim();

  if (
    id !== SONSHINE_MICHAEL_PERSON_ID ||
    clientSlug !== config.clientSlug ||
    name !== 'Michael Borntreger'
  ) {
    throw new Error(
      `[blog] Directus author relation must be the approved SonShine-scoped Michael Borntreger record.`,
    );
  }

  return name;
}

export function mapDirectusTopics(value: unknown, config: DirectusConfig): TermLite[] {
  if (!Array.isArray(value)) return [];

  const topics = value
    .map((relation): TermLite | null => {
      const topic = asRecord(asRecord(relation)?.blog_topic);
      if (!topic) return null;
      if (readString(topic.status) !== 'published') return null;
      if (readRelationSlug(topic.client) !== config.clientSlug) return null;

      const name = readString(topic.name);
      const slug = readString(topic.slug);
      return name && slug ? { name, slug } : null;
    })
    .filter((topic): topic is TermLite => Boolean(topic));

  return [...new Map(topics.map((topic) => [topic.slug, topic])).values()];
}

export function requiredPostString(value: unknown, field: string, fallbackSlug?: string): string {
  const parsed = readString(value);
  if (parsed) return parsed;
  throw new Error(
    `[blog] Directus blog_posts.${field} is required${fallbackSlug ? ` for ${fallbackSlug}` : ''}.`,
  );
}

export function readFocusKeywords(
  primaryValue: unknown,
  keywordValue: unknown,
  slug: string,
): { primaryFocusKeyword: string | null; focusKeywords: string[] } {
  if (!Array.isArray(keywordValue)) {
    throw new Error(`[blog] Directus blog_posts.focus_keywords must be an array for ${slug}.`);
  }
  const focusKeywords = keywordValue.map((value) =>
    requiredPostString(value, 'focus_keywords', slug),
  );
  const primaryFocusKeyword = requiredPostString(primaryValue, 'primary_focus_keyword', slug);
  const primaryIndex = focusKeywords.findIndex(
    (keyword) =>
      keyword.toLocaleLowerCase('en-US') === primaryFocusKeyword.toLocaleLowerCase('en-US'),
  );
  if (primaryIndex < 0) {
    throw new Error(
      `[blog] Directus primary focus keyword is missing from focus_keywords for ${slug}.`,
    );
  }
  return {
    primaryFocusKeyword: focusKeywords[primaryIndex],
    focusKeywords: [
      focusKeywords[primaryIndex],
      ...focusKeywords.filter((_, index) => index !== primaryIndex),
    ],
  };
}

export function mapDirectusPost(
  item: DirectusBlogPost,
  config: DirectusConfig,
): NormalizedBlogPost {
  const slug = requiredPostString(item.slug, 'slug');
  const title = requiredPostString(item.title, 'title', slug);
  const publishedAt = requiredPostString(item.published_at, 'published_at', slug);
  const modifiedAt =
    readString(item.source_updated_at) ?? readString(item.date_updated) ?? publishedAt;
  const body = requiredPostString(item.body, 'body', slug);
  const contentHtml = sanitizeDirectusHtml(body, {
    assetBaseUrl: config.url,
  });
  const categoryTerms = mapDirectusTopics(item.topics, config);
  const featuredImage = mapDirectusImage(item.featured_image, config);
  const metaTitle = readString(item.meta_title);
  const metaDescription = readString(item.meta_description);
  const ogTitle = readString(item.og_title);
  const ogDescription = readString(item.og_description);
  const ogImageOverride = mapDirectusImage(item.og_image_override, config);
  const noindex = readBoolean(item.noindex);
  const focusKeywordMetadata = noindex
    ? { primaryFocusKeyword: null, focusKeywords: [] }
    : readFocusKeywords(item.primary_focus_keyword, item.focus_keywords, slug);
  const authorName = mapDirectusAuthor(item.author, config);

  if (categoryTerms.length === 0) {
    throw new Error(`[blog] Directus blog post ${slug} has no published client-scoped topics.`);
  }

  if (categoryTerms.length > 3) {
    throw new Error(`[blog] Directus blog post ${slug} exceeds the three-topic maximum.`);
  }

  return {
    slug,
    title,
    contentHtml,
    date: publishedAt,
    modified: modifiedAt || undefined,
    authorName,
    featuredImage: featuredImage ?? undefined,
    categories: categoryTerms.map((topic) => topic.name),
    categoryTerms,
    featured: readBoolean(item.featured),
    excerpt: readString(item.excerpt) ?? undefined,
    noindex,
    ...focusKeywordMetadata,
    seo: {
      title: metaTitle,
      description: metaDescription,
      openGraph: {
        title: ogTitle ?? metaTitle,
        description: ogDescription ?? metaDescription,
        type: 'article',
        image:
          (ogImageOverride ?? featuredImage)
            ? {
                url: (ogImageOverride ?? featuredImage)!.url,
                secureUrl: (ogImageOverride ?? featuredImage)!.url,
                width: (ogImageOverride ?? featuredImage)!.width ?? null,
                height: (ogImageOverride ?? featuredImage)!.height ?? null,
                type: null,
              }
            : null,
      },
    },
  };
}
