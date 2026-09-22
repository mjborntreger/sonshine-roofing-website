import 'server-only';
import { deployedEditorial } from './editorial';
import type {
  NormalizedBlogPost,
  BlogSitemapEntry,
  BlogImageSitemapEntry,
} from './editorial-types';
export type { BlogSitemapEntry, BlogImageSitemapEntry } from './editorial-types';
import type { PageResult } from '@/lib/ui/pagination';
import { stripHtml } from './html-text';
import type {
  FacetGroup,
  Post,
  PostCard,
  PostLite,
  PostsFiltersInput,
  TermLite,
  ContentImage,
} from './content-types';
type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;

const readString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

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

function toContentImage(image: Post['featuredImage'] | null | undefined): ContentImage | null {
  return image?.url ? { url: image.url, altText: readString(image.altText) ?? '' } : null;
}

function toPostLite(post: NormalizedBlogPost): PostLite {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date || null,
    featuredImage: toContentImage(post.featuredImage),
    categories: post.categoryTerms ?? [],
    excerpt: post.excerpt ?? null,
    contentPlain: stripHtml(post.contentHtml) || null,
  };
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

export async function listPostSlugs(limit?: number): Promise<string[]> {
  return (await listDirectusPosts()).slice(0, limit).map((post) => post.slug);
}

export async function listRecentPostNav(
  limit?: number,
): Promise<Array<{ slug: string; title: string; date: string }>> {
  return (await listDirectusPosts()).slice(0, limit).map((post) => ({
    slug: post.slug,
    title: post.title,
    date: post.date,
  }));
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
      featuredImage: toContentImage(post.featuredImage),
    }));
}

async function listDirectusPosts(): Promise<NormalizedBlogPost[]> {
  return deployedEditorial().posts;
}
export async function getPostBySlug(slug: string): Promise<Post | null> {
  return deployedEditorial().posts.find((post) => post.slug === slug.trim()) ?? null;
}
export async function listBlogCategories(limit?: number): Promise<TermLite[]> {
  return deployedEditorial().topics.slice(0, limit);
}
export type { FacetGroup, Post, PostCard, PostLite, PostsFiltersInput, TermLite };
