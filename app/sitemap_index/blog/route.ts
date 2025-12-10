// app/sitemap_index/blog/route.ts
import { NextResponse } from 'next/server';
import { wpFetch } from '@/lib/content/wp';
import { buildAlternateLinks, formatLastmod, localizePath, normalizeEntryPath } from '../utils';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-static';
export const revalidate = 3600; // safety net; tag-based revalidation will be faster

const BASE = process.env.NEXT_PUBLIC_SITE_URL!;
const ENABLED =
  process.env.NEXT_PUBLIC_ENV === 'production' ||
  process.env.NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW === 'true';
const PREVIEW =
  process.env.NEXT_PUBLIC_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW === 'true';

type Node = { uri: string; modifiedGmt?: string | null };

type SitemapPostsResult = {
  posts: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: Node[];
  };
};

const getPostUrls = unstable_cache(async () => {
  // Grab slugs + last modified (adjust query name to yours)
  const q = /* GraphQL */ `
    query SitemapPosts($first: Int!, $after: String) {
      posts(first: $first, after: $after, where: { status: PUBLISH, orderby: { field: MODIFIED, order: DESC }}) {
        pageInfo { hasNextPage endCursor }
        nodes { uri modifiedGmt }
      }
    }
  `;
  const nodes: Node[] = [];
  let after: string | null = null;
  do {
    const vars: { first: number; after?: string } = after ? { first: 200, after } : { first: 200 };
    const data = await wpFetch<SitemapPostsResult>(q, vars);
    nodes.push(...(data?.posts?.nodes ?? []));
    after = data?.posts?.pageInfo?.hasNextPage ? data.posts.pageInfo.endCursor : null;
  } while (after);
  return nodes;
}, ['sitemap-blog'], { revalidate: 3600, tags: ['sitemap', 'sitemap:blog'] });

export async function GET() {
  if (!ENABLED) return NextResponse.json({ ok: true, note: 'sitemap disabled' }, { status: 404 });

  const items = await getPostUrls();
  const head = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<?xml-stylesheet type="text/xsl" href="/__sitemaps/sitemap.xsl"?>`,
  ].join('');
  const entries = items.flatMap(n => {
    const path = normalizeEntryPath(n.uri);
    const lastmod = formatLastmod(n.modifiedGmt);
    const alternates = buildAlternateLinks(BASE, path);
    return localizePath(path).map(({ loc }) => ({
      loc: `${BASE}${loc}`,
      lastmod,
      alternates,
    }));
  });
  const body = [
    head,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    ...entries.map((entry) => {
      const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : '';
      return `<url><loc>${entry.loc}</loc>${lastmod}${entry.alternates.join('')}</url>`;
    }),
    `</urlset>`
  ].join('');
  return new NextResponse(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      ...(PREVIEW ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}),
    },
  });
}
