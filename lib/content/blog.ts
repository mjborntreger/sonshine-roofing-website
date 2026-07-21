import 'server-only';

import { sanitizeDirectusHtml } from '@/lib/content/directus-html';
import type { PageResult } from '@/lib/ui/pagination';
import {
  stripHtml,
  type FacetGroup,
  type Post,
  type PostCard,
  type PostLite,
  type PostsFiltersInput,
  type TermLite,
  type WpImage,
} from '@/lib/content/wp';

const DIRECTUS_REVALIDATE_SECONDS = 900;
const DIRECTUS_POST_LIMIT = 500;
const SONSHINE_MICHAEL_PERSON_ID = 'f028dafd-c2fb-4d59-a561-2be5e46ea318';
const DIRECTUS_POST_FIELDS = [
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

type DirectusBlogPost = {
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

type NormalizedBlogPost = Post & {
  featured?: boolean;
};

export type BlogSitemapEntry = {
  uri: string;
  modified: string | null;
};

export type BlogImageSitemapEntry = BlogSitemapEntry & {
  featuredImage: WpImage | null;
};

const asRecord = (value: unknown): UnknownRecord | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;

const readString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const readBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const normalized = readString(value)?.toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

const readNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const readRelationSlug = (value: unknown): string | null => readString(asRecord(value)?.slug);

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

function getDirectusConfig(): DirectusConfig {
  const url = readString(process.env.DIRECTUS_URL);
  const clientSlug = readString(process.env.DIRECTUS_CLIENT_SLUG);
  const token =
    readString(process.env.DIRECTUS_TOKEN) ?? readString(process.env.DIRECTUS_STATIC_TOKEN);

  if (!url || !clientSlug || !token) {
    throw new Error(
      '[blog] Directus blog content requires DIRECTUS_URL, DIRECTUS_CLIENT_SLUG, and DIRECTUS_TOKEN or DIRECTUS_STATIC_TOKEN.',
    );
  }

  return { url: trimTrailingSlash(url), clientSlug, token };
}

function directusAssetUrl(config: DirectusConfig, id: string): string {
  return `${config.url}/assets/${encodeURIComponent(id)}`;
}

function mapDirectusImage(value: unknown, config: DirectusConfig): WpImage | null {
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

function mapDirectusAuthor(value: unknown, config: DirectusConfig): string | null {
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

function mapDirectusTopics(value: unknown, config: DirectusConfig): TermLite[] {
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

function requiredPostString(value: unknown, field: string, fallbackSlug?: string): string {
  const parsed = readString(value);
  if (parsed) return parsed;
  throw new Error(
    `[blog] Directus blog_posts.${field} is required${fallbackSlug ? ` for ${fallbackSlug}` : ''}.`,
  );
}

function readFocusKeywords(
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

function mapDirectusPost(item: DirectusBlogPost, config: DirectusConfig): NormalizedBlogPost {
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

function toPostCard(post: NormalizedBlogPost): PostCard {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    featuredImage: post.featuredImage,
    categories: post.categories,
    categoryTerms: post.categoryTerms,
    excerpt: post.excerpt,
    contentPlain: stripHtml(post.contentHtml),
  };
}

function toWpImage(image: Post['featuredImage'] | null | undefined): WpImage | null {
  return image?.url ? { url: image.url, altText: readString(image.altText) ?? '' } : null;
}

function toPostLite(post: NormalizedBlogPost): PostLite {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date || null,
    featuredImage: toWpImage(post.featuredImage),
    categories: post.categoryTerms ?? [],
    excerpt: post.excerpt ?? null,
    contentPlain: stripHtml(post.contentHtml) || null,
  };
}

async function fetchDirectusCollection<T>(
  collection: string,
  fields: readonly string[],
  options: {
    filter?: UnknownRecord;
    limit?: number;
    sort?: readonly string[];
  } = {},
): Promise<T[]> {
  const config = getDirectusConfig();
  const url = new URL(`items/${collection}`, `${config.url}/`);
  url.searchParams.set('fields', fields.join(','));
  url.searchParams.set(
    'filter',
    JSON.stringify({
      ...(options.filter ?? {}),
      client: { slug: { _eq: config.clientSlug } },
      status: { _eq: 'published' },
    }),
  );
  url.searchParams.set('limit', String(options.limit ?? DIRECTUS_POST_LIMIT));
  if (options.sort?.length) url.searchParams.set('sort', options.sort.join(','));

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${config.token}`,
    },
    next: {
      revalidate: DIRECTUS_REVALIDATE_SECONDS,
      tags: [`directus:${collection}:${config.clientSlug}`],
    },
  });

  if (!response.ok) {
    throw new Error(
      `[blog] Directus ${collection} HTTP ${response.status} ${response.statusText}.`,
    );
  }

  const payload = (await response.json()) as DirectusListResponse<T>;
  if (payload.errors?.length) {
    throw new Error(
      payload.errors
        .map((error) => error.message)
        .filter(Boolean)
        .join('; ') || `[blog] Directus ${collection} request failed.`,
    );
  }

  return payload.data ?? [];
}

async function listDirectusPosts(): Promise<NormalizedBlogPost[]> {
  const config = getDirectusConfig();
  const items = await fetchDirectusCollection<DirectusBlogPost>(
    'blog_posts',
    DIRECTUS_POST_FIELDS,
    { sort: ['-published_at', '-date_created'], limit: DIRECTUS_POST_LIMIT },
  );

  return items.map((item) => mapDirectusPost(item, config));
}

async function getDirectusPostBySlug(slug: string): Promise<Post | null> {
  const trimmedSlug = readString(slug);
  if (!trimmedSlug) return null;
  const config = getDirectusConfig();
  const items = await fetchDirectusCollection<DirectusBlogPost>(
    'blog_posts',
    DIRECTUS_POST_FIELDS,
    { filter: { slug: { _eq: trimmedSlug } }, limit: 1 },
  );

  return items[0] ? mapDirectusPost(items[0], config) : null;
}

function normalizeFilterSlugs(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .map((slug) => readString(slug)?.toLowerCase())
        .filter((slug): slug is string => Boolean(slug))
    : [];
}

function filterDirectusPosts(
  posts: NormalizedBlogPost[],
  filters: PostsFiltersInput,
): NormalizedBlogPost[] {
  const filterRecord = asRecord(filters);
  const search = readString(filters.q) ?? readString(filterRecord?.search) ?? '';
  const query = search.toLocaleLowerCase('en-US');
  const include = new Set(normalizeFilterSlugs(filters.categorySlugs));
  const exclude = new Set(normalizeFilterSlugs(filters.excludeCategorySlugs));

  return posts.filter((post) => {
    const topicSlugs = (post.categoryTerms ?? []).map((topic) => topic.slug.toLowerCase());

    if (include.size && !topicSlugs.some((slug) => include.has(slug))) return false;
    if (exclude.size && topicSlugs.some((slug) => exclude.has(slug))) return false;
    if (!query) return true;

    const haystack = [
      post.title,
      stripHtml(post.excerpt ?? ''),
      stripHtml(post.contentHtml),
      post.categories.join(' '),
    ]
      .join(' ')
      .toLocaleLowerCase('en-US');

    return haystack.includes(query);
  });
}

function buildTopicFacets(posts: NormalizedBlogPost[]): FacetGroup[] {
  const buckets = new Map<string, { name: string; count: number }>();

  for (const post of posts) {
    for (const topic of post.categoryTerms ?? []) {
      const current = buckets.get(topic.slug);
      buckets.set(topic.slug, {
        name: topic.name,
        count: (current?.count ?? 0) + 1,
      });
    }
  }

  return [
    {
      taxonomy: 'category',
      buckets: [...buckets.entries()]
        .map(([slug, value]) => ({ slug, ...value }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    },
  ];
}

export async function listPostsPaged({
  first = 24,
  after = null,
  filters = {},
}: {
  first?: number;
  after?: string | null;
  filters?: PostsFiltersInput;
} = {}): Promise<PageResult<PostCard> & { facets: FacetGroup[] }> {
  const size = Math.max(1, Math.min(first, 50));
  const offset = after ? Math.max(0, Number.parseInt(after, 10) || 0) : 0;
  const allPosts = await listDirectusPosts();
  const filteredPosts = filterDirectusPosts(allPosts, filters);
  const items = filteredPosts.slice(offset, offset + size).map(toPostCard);
  const nextOffset = offset + items.length;
  const hasNextPage = nextOffset < filteredPosts.length;

  return {
    items,
    pageInfo: {
      hasNextPage,
      endCursor: hasNextPage ? String(nextOffset) : null,
    },
    total: filteredPosts.length,
    facets: buildTopicFacets(filteredPosts),
    meta: {
      overallTotal: filteredPosts.length,
      fullTotal: allPosts.length,
    },
  };
}

export async function listBlogCategories(limit = 100): Promise<TermLite[]> {
  const topics = await fetchDirectusCollection<{
    name?: unknown;
    slug?: unknown;
  }>('blog_topics', ['name', 'slug', 'sort'], {
    limit: Math.max(1, Math.min(limit, 500)),
    sort: ['sort', 'name'],
  });

  return topics
    .map((topic): TermLite | null => {
      const name = readString(topic.name);
      const slug = readString(topic.slug);
      return name && slug ? { name, slug } : null;
    })
    .filter((topic): topic is TermLite => Boolean(topic));
}

export async function listRecentPosts(limit = 12): Promise<PostCard[]> {
  return (await listDirectusPosts()).slice(0, limit).map(toPostCard);
}

export async function listRecentPostsPoolForFilters(
  perType = 4,
  allCount = 4,
  fetchCap = 60,
  topicSlugs: string[] = ['roof-repair', 'hurricane-preparation', 'energy-efficient-roofing'],
): Promise<PostCard[]> {
  const batchSize = Math.max(fetchCap, allCount + perType * topicSlugs.length * 2);
  const recent = await listRecentPosts(batchSize);
  const pool: PostCard[] = [];
  const seen = new Set<string>();
  const append = (posts: PostCard[]) => {
    for (const post of posts) {
      if (seen.has(post.slug)) continue;
      seen.add(post.slug);
      pool.push(post);
    }
  };

  append(recent.slice(0, allCount));
  for (const topicSlug of topicSlugs) {
    append(
      recent
        .filter((post) => post.categoryTerms?.some((topic) => topic.slug === topicSlug))
        .slice(0, perType),
    );
  }

  return pool;
}

export async function listRecentPostsPool(limit = 36): Promise<PostLite[]> {
  return (await listDirectusPosts()).slice(0, limit).map(toPostLite);
}

export async function listPostSlugs(limit = 200): Promise<string[]> {
  return (await listDirectusPosts()).slice(0, limit).map((post) => post.slug);
}

export async function listRecentPostNav(
  limit = 200,
): Promise<Array<{ slug: string; title: string; date: string }>> {
  return (await listDirectusPosts()).slice(0, limit).map((post) => ({
    slug: post.slug,
    title: post.title,
    date: post.date,
  }));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  return getDirectusPostBySlug(slug);
}

export async function listBlogSitemapEntries(): Promise<BlogSitemapEntry[]> {
  return (await listDirectusPosts())
    .filter((post) => !post.noindex)
    .map((post) => ({
      uri: `/${post.slug}`,
      modified: post.modified ?? post.date ?? null,
    }));
}

export async function listBlogImageSitemapEntries(): Promise<BlogImageSitemapEntry[]> {
  return (await listDirectusPosts())
    .filter((post) => !post.noindex)
    .map((post) => ({
      uri: `/${post.slug}`,
      modified: post.modified ?? post.date ?? null,
      featuredImage: toWpImage(post.featuredImage),
    }));
}

export type { FacetGroup, Post, PostCard, PostLite, PostsFiltersInput, TermLite };
