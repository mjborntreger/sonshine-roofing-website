import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { wpFetch, mapImages, type WpImageNode } from '@/lib/content/wp';
import { formatLastmod, normalizeEntryPath } from '../utils';
import { serializeImageEntry, type ImageSitemapEntry } from './serialization';

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

type ImageNodeWrapper = { node?: Maybe<WpImageNode> };

type BlogImageNode = {
  uri?: string | null;
  modifiedGmt?: string | null;
  featuredImage?: Maybe<ImageNodeWrapper>;
};

type ProjectImageNode = {
  uri?: string | null;
  modifiedGmt?: string | null;
  featuredImage?: Maybe<ImageNodeWrapper>;
  projectDetails?: Maybe<{
    projectImages?: Maybe<{ nodes?: Maybe<WpImageNode>[] | null }>;
  }>;
};

type LocationImageNode = {
  uri?: string | null;
  modifiedGmt?: string | null;
  locationAttributes?: Maybe<{
    map?: Maybe<ImageNodeWrapper>;
    neighborhoodsServed?: Maybe<
      Array<
        Maybe<{
          neighborhood?: string | null;
          neighborhoodImage?: Maybe<ImageNodeWrapper>;
        }>
      >
    >;
  }>;
};

type PersonImageNode = {
  uri?: string | null;
  modifiedGmt?: string | null;
  featuredImage?: Maybe<ImageNodeWrapper>;
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

type PersonImageResult = {
  persons?: {
    pageInfo?: { hasNextPage?: boolean; endCursor?: string | null } | null;
    nodes?: Maybe<PersonImageNode>[] | null;
  } | null;
};

const mapWrapperImages = (wrapper?: Maybe<ImageNodeWrapper>) => {
  const node = wrapper?.node;
  return node ? mapImages([node]) : [];
};

const toImageNodeArray = (
  nodes?: Maybe<WpImageNode>[] | null
): ReadonlyArray<Maybe<WpImageNode>> | undefined =>
  Array.isArray(nodes) ? nodes : undefined;

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
              }
            }
            projectDetails {
              projectImages {
                nodes {
                  sourceUrl
                  altText
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
                }
              }
              neighborhoodsServed {
                neighborhood
                neighborhoodImage {
                  node {
                    sourceUrl
                    altText
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

const getPersonImageNodes = unstable_cache(
  async () => {
    const query = /* GraphQL */ `
      query ImageSitemapPersons($first: Int!, $after: String) {
        persons(
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
              }
            }
          }
        }
      }
    `;

    const nodes: PersonImageNode[] = [];
    let after: string | null = null;

    do {
      const variables: { first: number; after?: string | null } = after
        ? { first: 200, after }
        : { first: 200 };
      const data = await wpFetch<PersonImageResult>(query, variables);
      const page = data?.persons;
      const pageNodes = page?.nodes ?? [];
      for (const node of pageNodes) {
        if (node) nodes.push(node);
      }
      after = page?.pageInfo?.hasNextPage ? page?.pageInfo?.endCursor ?? null : null;
    } while (after);

    return nodes;
  },
  ['sitemap-image-persons'],
  { revalidate: 3600, tags: ['sitemap', 'sitemap:image', 'sitemap:image:person'] }
);

const buildImageEntries = async (): Promise<ImageSitemapEntry[]> => {
  const [blogNodes, projectNodes, locationNodes, personNodes] = await Promise.all([
    getBlogImageNodes(),
    getProjectImageNodes(),
    getLocationImageNodes(),
    getPersonImageNodes(),
  ]);

  const entries: ImageSitemapEntry[] = [];

  for (const node of blogNodes) {
    const path = normalizeEntryPath(node.uri ?? '');
    if (path === '/') continue;
    const images = mapWrapperImages(node.featuredImage);
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
    const gallery = mapImages(toImageNodeArray(node.projectDetails?.projectImages?.nodes));
    const hero = mapWrapperImages(node.featuredImage);
    const images = [...hero, ...gallery];
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

    const mapImage = mapWrapperImages(node.locationAttributes?.map);
    const neighborhoodImages =
      node.locationAttributes?.neighborhoodsServed?.flatMap((item) => {
        if (!item) return [];
        const images = mapWrapperImages(item.neighborhoodImage);
        if (!images.length) return [];
        return images.map((img) => ({
          ...img,
          altText: img.altText || item.neighborhood || undefined,
        }));
      }) ?? [];

    const images = [...mapImage, ...neighborhoodImages];
    if (!images.length) continue;
    entries.push({
      loc: path,
      lastmod: formatLastmod(node.modifiedGmt),
      images,
    });
  }

  for (const node of personNodes) {
    const path = normalizeEntryPath(node.uri ?? '');
    if (path === '/') continue;
    const images = mapWrapperImages(node.featuredImage);
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

  const urls = entries
    .map((entry) => serializeImageEntry(BASE, entry))
    .filter((entry): entry is string => Boolean(entry));

  const body = [
    head,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
    ...urls,
    `</urlset>`,
  ].join('');

  return new NextResponse(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      ...(PREVIEW ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}),
    },
  });
}
