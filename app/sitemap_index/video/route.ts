import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { wpFetch, stripHtml, youtubeThumb } from '@/lib/wp';
import { formatLastmod, normalizeEntryPath } from '../utils';

export const dynamic = 'force-static';
export const revalidate = 3600; // safety net; tag-based revalidation should refresh sooner

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://sonshineroofing.com';
const ENABLED =
  process.env.NEXT_PUBLIC_ENV === 'production' ||
  process.env.NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW === 'true';
const PREVIEW =
  process.env.NEXT_PUBLIC_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW === 'true';

type Maybe<T> = T | null | undefined;

type VideoCategoryNode = { name?: string | null };

type VideoEntryNode = {
  slug?: string | null;
  title?: string | null;
  date?: string | null;
  modifiedGmt?: string | null;
  videoLibraryMetadata?: {
    youtubeUrl?: string | null;
    description?: string | null;
  } | null;
  videoCategories?: {
    nodes?: Maybe<VideoCategoryNode>[] | null;
  } | null;
};

type ProjectVideoNode = {
  uri?: string | null;
  slug?: string | null;
  title?: string | null;
  date?: string | null;
  modifiedGmt?: string | null;
  projectVideoInfo?: {
    youtubeUrl?: string | null;
  } | null;
  projectDetails?: {
    projectDescription?: string | null;
  } | null;
  projectFilters?: {
    materialType?: { nodes?: Maybe<{ name?: string | null }> | null } | null;
    serviceArea?: { nodes?: Maybe<{ name?: string | null }> | null } | null;
  } | null;
};

type VideoEntriesResult = {
  videoEntries?: {
    pageInfo?: { hasNextPage?: boolean; endCursor?: string | null } | null;
    nodes?: Maybe<VideoEntryNode>[] | null;
  } | null;
};

type ProjectVideosResult = {
  projects?: {
    pageInfo?: { hasNextPage?: boolean; endCursor?: string | null } | null;
    nodes?: Maybe<ProjectVideoNode>[] | null;
  } | null;
};

const getVideoEntryNodes = unstable_cache(
  async () => {
    const query = /* GraphQL */ `
      query VideoSitemapEntries($first: Int!, $after: String) {
        videoEntries(
          first: $first
          after: $after
          where: { status: PUBLISH, orderby: { field: MODIFIED, order: DESC } }
        ) {
          pageInfo { hasNextPage endCursor }
          nodes {
            slug
            title
            date
            modifiedGmt
            videoLibraryMetadata {
              youtubeUrl
              description
            }
            videoCategories(first: 10) {
              nodes { name }
            }
          }
        }
      }
    `;

    const nodes: VideoEntryNode[] = [];
    let after: string | null = null;

    do {
      const variables = after ? { first: 200, after } : { first: 200 };
      const data = await wpFetch<VideoEntriesResult>(query, variables);
      const page = data?.videoEntries;
      const pageNodes = page?.nodes ?? [];
      for (const node of pageNodes) {
        if (node) nodes.push(node);
      }
      after = page?.pageInfo?.hasNextPage ? page?.pageInfo?.endCursor ?? null : null;
    } while (after);

    return nodes;
  },
  ['sitemap-video-entries'],
  { revalidate: 3600, tags: ['sitemap', 'sitemap:videos', 'sitemap:videos:entries'] }
);

const getProjectVideoNodes = unstable_cache(
  async () => {
    const query = /* GraphQL */ `
      query ProjectSitemapVideos($first: Int!, $after: String) {
        projects(
          first: $first
          after: $after
          where: { status: PUBLISH, orderby: { field: MODIFIED, order: DESC } }
        ) {
          pageInfo { hasNextPage endCursor }
          nodes {
            uri
            slug
            title
            date
            modifiedGmt
            projectVideoInfo { youtubeUrl }
            projectDetails { projectDescription }
            projectFilters {
              materialType { nodes { name } }
              serviceArea  { nodes { name } }
            }
          }
        }
      }
    `;

    const nodes: ProjectVideoNode[] = [];
    let after: string | null = null;

    do {
      const variables = after ? { first: 200, after } : { first: 200 };
      const data = await wpFetch<ProjectVideosResult>(query, variables);
      const page = data?.projects;
      const pageNodes = page?.nodes ?? [];
      for (const node of pageNodes) {
        if (node) nodes.push(node);
      }
      after = page?.pageInfo?.hasNextPage ? page?.pageInfo?.endCursor ?? null : null;
    } while (after);

    return nodes;
  },
  ['sitemap-video-projects'],
  { revalidate: 3600, tags: ['sitemap', 'sitemap:videos', 'sitemap:videos:projects'] }
);

const VIDEO_NAMESPACE = 'http://www.google.com/schemas/sitemap-video/1.1';

const xmlEscape = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const trimTo = (value: string, max: number): string => {
  if (value.length <= max) return value;
  return value.slice(0, max).replace(/\s+\S*$/, '') + '…';
};

type VideoSitemapItem = {
  loc: string;
  lastmod?: string | null;
  playerLoc: string;
  contentUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  publicationDate?: string | null;
  tags: string[];
};

const youtubeIdFromUrl = (url?: string | null): string | null => {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').trim();
      return id || null;
    }
    if (u.searchParams.has('v')) {
      const id = u.searchParams.get('v')?.trim();
      return id || null;
    }
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[0].toLowerCase() === 'embed') {
      return parts[1] || null;
    }
    return parts.pop() || null;
  } catch {
    return null;
  }
};

const buildVideoItems = async () => {
  const [entryNodes, projectNodes] = await Promise.all([
    getVideoEntryNodes(),
    getProjectVideoNodes(),
  ]);

  const items: VideoSitemapItem[] = [];
  const seen = new Set<string>();

  for (const node of entryNodes) {
    const rawUrl = node?.videoLibraryMetadata?.youtubeUrl ?? '';
    const youtubeId = youtubeIdFromUrl(rawUrl);
    if (!youtubeId) continue;

    const slug = (node?.slug ?? '').trim();
    const slugOrId = slug || youtubeId;
    const loc = `${BASE}/video-library?v=${encodeURIComponent(slugOrId)}`;
    if (seen.has(loc)) continue;

    const title = (node?.title ?? '').trim() || 'Video';
    const rawDesc = node?.videoLibraryMetadata?.description ?? '';
    const descriptionSource = rawDesc ? stripHtml(rawDesc) : title;
    const description = trimTo(descriptionSource.trim() || title, 2048);
    const tags =
      node?.videoCategories?.nodes
        ?.map((cat) => (cat?.name ?? '').trim())
        .filter(Boolean)
        .slice(0, 32) ?? [];

    items.push({
      loc,
      lastmod: formatLastmod(node?.modifiedGmt) ?? formatLastmod(node?.date),
      playerLoc: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
      contentUrl: rawUrl || `https://www.youtube.com/watch?v=${youtubeId}`,
      thumbnailUrl: youtubeThumb(youtubeId),
      title,
      description,
      publicationDate: formatLastmod(node?.date),
      tags,
    });
    seen.add(loc);
  }

  for (const node of projectNodes) {
    const rawUrl = node?.projectVideoInfo?.youtubeUrl ?? '';
    const youtubeId = youtubeIdFromUrl(rawUrl);
    if (!youtubeId) continue;

    const path = normalizeEntryPath(node?.uri ?? '');
    if (path === '/') continue;
    const loc = `${BASE}${path}`;
    if (seen.has(loc)) continue;

    const title = (node?.title ?? '').trim() || 'Project Video';

    const details = node?.projectDetails?.projectDescription ?? '';
    const descriptionSource = details ? stripHtml(details) : title;
    const description = trimTo(descriptionSource.trim() || title, 2048);

    const materialTags =
      node?.projectFilters?.materialType?.nodes
        ?.map((n) => (n?.name ?? '').trim())
        .filter(Boolean) ?? [];
    const serviceTags =
      node?.projectFilters?.serviceArea?.nodes
        ?.map((n) => (n?.name ?? '').trim())
        .filter(Boolean) ?? [];
    const tags = [...materialTags, ...serviceTags].slice(0, 32);

    items.push({
      loc,
      lastmod: formatLastmod(node?.modifiedGmt) ?? formatLastmod(node?.date),
      playerLoc: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
      contentUrl: rawUrl || `https://www.youtube.com/watch?v=${youtubeId}`,
      thumbnailUrl: youtubeThumb(youtubeId),
      title,
      description,
      publicationDate: formatLastmod(node?.date),
      tags,
    });
    seen.add(loc);
  }

  return items.sort((a, b) => (b.lastmod ?? '').localeCompare(a.lastmod ?? ''));
};

export async function GET() {
  if (!ENABLED) {
    return NextResponse.json({ ok: true, note: 'sitemap disabled' }, { status: 404 });
  }

  const items = await buildVideoItems();
  const head = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<?xml-stylesheet type="text/xsl" href="/__sitemaps/sitemap.xsl"?>`,
  ].join('');

  const body = [
    head,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="${VIDEO_NAMESPACE}">`,
    ...items.map((item) => {
      const lastmod = item.lastmod ? `<lastmod>${item.lastmod}</lastmod>` : '';
      const publication = item.publicationDate
        ? `<video:publication_date>${item.publicationDate}</video:publication_date>`
        : '';
      const tagsXml = item.tags
        .map((tag) => `<video:tag>${xmlEscape(tag)}</video:tag>`)
        .join('');

      return [
        `<url>`,
        `<loc>${xmlEscape(item.loc)}</loc>`,
        lastmod,
        `<video:video>`,
        `<video:thumbnail_loc>${xmlEscape(item.thumbnailUrl)}</video:thumbnail_loc>`,
        `<video:title>${xmlEscape(trimTo(item.title, 100))}</video:title>`,
        `<video:description>${xmlEscape(item.description)}</video:description>`,
        `<video:player_loc allow_embed="yes">${xmlEscape(item.playerLoc)}</video:player_loc>`,
        `<video:content_loc>${xmlEscape(item.contentUrl)}</video:content_loc>`,
        publication,
        `<video:family_friendly>yes</video:family_friendly>`,
        tagsXml,
        `</video:video>`,
        `</url>`,
      ].join('');
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
