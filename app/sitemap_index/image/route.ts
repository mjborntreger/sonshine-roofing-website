import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { wpFetch } from '@/lib/content/wp';
import { formatLastmod, normalizeEntryPath } from '../utils';

export const dynamic = 'force-static';
export const revalidate = 3600;

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://sonshineroofing.com';
const ENABLED =
  process.env.NEXT_PUBLIC_ENV === 'production' ||
  process.env.NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW === 'true';
const PREVIEW =
  process.env.NEXT_PUBLIC_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW === 'true';

type Maybe<T> = T | null | undefined;

type MediaNode = {
  sourceUrl?: string | null;
  altText?: string | null;
  mediaDetails?: Maybe<{ width?: number | null; height?: number | null }>;
};

type MediaWrapper = { node?: Maybe<MediaNode> };

type BlogImageNode = {
  uri?: string | null;
  modifiedGmt?: string | null;
  featuredImage?: Maybe<MediaWrapper>;
};

type ProjectImageNode = {
  uri?: string | null;
  modifiedGmt?: string | null;
  featuredImage?: Maybe<MediaWrapper>;
  projectDetails?: Maybe<{
    projectImages?: Maybe<{ nodes?: Maybe<MediaNode>[] | null }>;
  }>;
};

type LocationImageNode = {
  uri?: string | null;
  modifiedGmt?: string | null;
  locationAttributes?: Maybe<{
    map?: Maybe<MediaWrapper>;
    neighborhoodsServed?: Maybe<
      Array<
        Maybe<{
          neighborhood?: string | null;
          neighborhoodImage?: Maybe<MediaWrapper>;
        }>
      >
    >;
  }>;
};

type BlogImageResult = {
  posts?: {
    pageInfo?: { hasNextPage?: boolean; endCursor?: string | null } | null;
    nodes?: Maybe<BlogImageNode>[] | null;
  } | null;
};

type ProjectImageResult = {
  projects?: {
    pageInfo?: { hasNextPage?: boolean; endCursor?: string | null } | null;
    nodes?: Maybe<ProjectImageNode>[] | null;
  } | null;
};

type LocationImageResult = {
  locations?: {
    pageInfo?: { hasNextPage?: boolean; endCursor?: string | null } | null;
    nodes?: Maybe<LocationImageNode>[] | null;
  } | null;
};

type SitemapImage = {
  url: string;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
};

type ImageSitemapEntry = {
  loc: string;
  lastmod?: string | null;
  images: SitemapImage[];
};

const pickImage = (node?: Maybe<MediaNode>): SitemapImage | null => {
  if (!node || !node.sourceUrl) return null;
  const url = node.sourceUrl.trim();
  if (!url) return null;
  return {
    url,
    alt: node.altText?.trim() || null,
    width: typeof node.mediaDetails?.width === 'number' ? node.mediaDetails.width : null,
    height: typeof node.mediaDetails?.height === 'number' ? node.mediaDetails.height : null,
  };
};

const pickImageFromWrapper = (wrapper?: Maybe<MediaWrapper>) => pickImage(wrapper?.node);

const dedupeImages = (images: Array<SitemapImage | null>, limit = 100): SitemapImage[] => {
  const seen = new Set<string>();
  const result: SitemapImage[] = [];
  for (const img of images) {
    if (!img) continue;
    const url = img.url.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    result.push({ ...img, url });
    if (result.length >= limit) break;
  }
  return result;
};

const getBlogImageNodes = unstable_cache(
  async () => {
    const query = /* GraphQL */ `
      query ImageSitemapPosts($first: Int!, $after: String) {
        posts(
          first: $first
          after: $after
          where: { status: PUBLISH, orderby: { field: MODIFIED, order: DESC } }
        ) {
          pageInfo { hasNextPage endCursor }
          nodes {
            uri
            modifiedGmt
            featuredImage {
              node {
                sourceUrl
                altText
                mediaDetails { width height }
              }
            }
          }
        }
      }
    `;

    const nodes: BlogImageNode[] = [];
    let after: string | null = null;

    do {
      const variables: { first: number; after?: string | null } = after
        ? { first: 200, after }
        : { first: 200 };
      const data = await wpFetch<BlogImageResult>(query, variables);
      const page = data?.posts;
      const pageNodes = page?.nodes ?? [];
      for (const node of pageNodes) {
        if (node) nodes.push(node);
      }
      after = page?.pageInfo?.hasNextPage ? page?.pageInfo?.endCursor ?? null : null;
    } while (after);

    return nodes;
  },
  ['sitemap-image-blog'],
  { revalidate: 3600, tags: ['sitemap', 'sitemap:image', 'sitemap:image:blog'] }
);

const getProjectImageNodes = unstable_cache(
  async () => {
    const query = /* GraphQL */ `
      query ImageSitemapProjects($first: Int!, $after: String) {
        projects(
          first: $first
          after: $after
          where: { status: PUBLISH, orderby: { field: MODIFIED, order: DESC } }
        ) {
          pageInfo { hasNextPage endCursor }
          nodes {
            uri
            modifiedGmt
            featuredImage {
              node {
                sourceUrl
                altText
                mediaDetails { width height }
              }
            }
            projectDetails {
              projectImages {
                nodes {
                  sourceUrl
                  altText
                  mediaDetails { width height }
                }
              }
            }
          }
        }
      }
    `;

    const nodes: ProjectImageNode[] = [];
    let after: string | null = null;

    do {
      const variables: { first: number; after?: string | null } = after
        ? { first: 200, after }
        : { first: 200 };
      const data = await wpFetch<ProjectImageResult>(query, variables);
      const page = data?.projects;
      const pageNodes = page?.nodes ?? [];
      for (const node of pageNodes) {
        if (node) nodes.push(node);
      }
      after = page?.pageInfo?.hasNextPage ? page?.pageInfo?.endCursor ?? null : null;
    } while (after);

    return nodes;
  },
  ['sitemap-image-projects'],
  { revalidate: 3600, tags: ['sitemap', 'sitemap:image', 'sitemap:image:projects'] }
);

const getLocationImageNodes = unstable_cache(
  async () => {
    const query = /* GraphQL */ `
      query ImageSitemapLocations($first: Int!, $after: String) {
        locations(
          first: $first
          after: $after
          where: { status: PUBLISH, orderby: { field: MODIFIED, order: DESC } }
        ) {
          pageInfo { hasNextPage endCursor }
          nodes {
            uri
            modifiedGmt
            locationAttributes {
              map {
                node {
                  sourceUrl
                  altText
                  mediaDetails { width height }
                }
              }
              neighborhoodsServed {
                neighborhood
                neighborhoodImage {
                  node {
                    sourceUrl
                    altText
                    mediaDetails { width height }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const nodes: LocationImageNode[] = [];
    let after: string | null = null;

    do {
      const variables: { first: number; after?: string | null } = after
        ? { first: 200, after }
        : { first: 200 };
      const data = await wpFetch<LocationImageResult>(query, variables);
      const page = data?.locations;
      const pageNodes = page?.nodes ?? [];
      for (const node of pageNodes) {
        if (node) nodes.push(node);
      }
      after = page?.pageInfo?.hasNextPage ? page?.pageInfo?.endCursor ?? null : null;
    } while (after);

    return nodes;
  },
  ['sitemap-image-locations'],
  { revalidate: 3600, tags: ['sitemap', 'sitemap:image', 'sitemap:image:locations'] }
);

const buildImageEntries = async (): Promise<ImageSitemapEntry[]> => {
  const [blogNodes, projectNodes, locationNodes] = await Promise.all([
    getBlogImageNodes(),
    getProjectImageNodes(),
    getLocationImageNodes(),
  ]);

  const entries: ImageSitemapEntry[] = [];

  for (const node of blogNodes) {
    const path = normalizeEntryPath(node.uri ?? '');
    if (path === '/') continue;
    const images = dedupeImages([pickImageFromWrapper(node.featuredImage)]);
    if (!images.length) continue;
    entries.push({
      loc: path,
      lastmod: formatLastmod(node.modifiedGmt),
      images,
    });
  }

  for (const node of projectNodes) {
    const path = normalizeEntryPath(node.uri ?? '');
    if (path === '/') continue;
    const gallery =
      node.projectDetails?.projectImages?.nodes?.map((item) => pickImage(item)) ?? [];
    const images = dedupeImages([pickImageFromWrapper(node.featuredImage), ...gallery]);
    if (!images.length) continue;
    entries.push({
      loc: path,
      lastmod: formatLastmod(node.modifiedGmt),
      images,
    });
  }

  for (const node of locationNodes) {
    const rawPath = normalizeEntryPath(node.uri ?? '');
    const path = rawPath.startsWith('/location/')
      ? rawPath.replace('/location/', '/locations/')
      : rawPath;
    if (path === '/') continue;

    const neighborhoods =
      node.locationAttributes?.neighborhoodsServed
        ?.map((item) => {
          if (!item) return null;
          const img = pickImageFromWrapper(item.neighborhoodImage);
          if (!img) return null;
          return img.alt ? img : { ...img, alt: item.neighborhood ?? img.alt };
        }) ?? [];

    const images = dedupeImages([
      pickImageFromWrapper(node.locationAttributes?.map),
      ...neighborhoods,
    ]);

    if (!images.length) continue;
    entries.push({
      loc: path,
      lastmod: formatLastmod(node.modifiedGmt),
      images,
    });
  }

  return entries.sort((a, b) => (b.lastmod ?? '').localeCompare(a.lastmod ?? ''));
};

export async function GET() {
  if (!ENABLED) {
    return NextResponse.json({ ok: true, note: 'sitemap disabled' }, { status: 404 });
  }

  const entries = await buildImageEntries();

  const head = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<?xml-stylesheet type="text/xsl" href="/__sitemaps/sitemap.xsl"?>`,
  ].join('');

  const body = [
    head,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
    ...entries.map((entry) => {
      const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : '';
      return `<url><loc>${BASE}${entry.loc}</loc>${lastmod}</url>`;
    }),
    `</urlset>`,
  ].join('');

  return new NextResponse(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      ...(PREVIEW ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}),
    },
  });
}
