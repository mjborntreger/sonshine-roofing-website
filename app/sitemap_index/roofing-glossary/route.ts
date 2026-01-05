
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { wpFetch } from '@/lib/content/wp';
import { formatLastmod, normalizeEntryPath } from '../utils';
import { SITE_ORIGIN, sitemapEnabled, sitemapPreviewHeaders } from '@/lib/seo/site';

export const dynamic = 'force-static';
export const revalidate = 3600; // safety net; tag-based revalidation will be faster

const BASE = SITE_ORIGIN;
const SITEMAPS_ENABLED = sitemapEnabled();
const PREVIEW_HEADERS = sitemapPreviewHeaders();

// Minimal node shape for sitemap entries
interface Node { uri: string; modifiedGmt?: string | null }

interface SitemapGlossaryResult {
  glossaryTerms: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: Node[];
  };
}

// Cache the list with a tag so WP can ping /api/revalidate to bust it
const getGlossaryUrls = unstable_cache(
  async () => {
    const q = /* GraphQL */ `
      query SitemapGlossary($first: Int!, $after: String) {
        glossaryTerms(
          first: $first,
          after: $after,
          where: { status: PUBLISH, orderby: { field: MODIFIED, order: DESC } }
        ) {
          pageInfo { hasNextPage endCursor }
          nodes { uri modifiedGmt }
        }
      }
    `;

    const nodes: Node[] = [];
    let after: string | undefined;

    do {
      const vars: { first: number; after?: string } = after ? { first: 200, after } : { first: 200 };
      const data = await wpFetch<SitemapGlossaryResult>(q, vars);
      const page = data?.glossaryTerms;
      if (page?.nodes?.length) nodes.push(...page.nodes);
      after = page?.pageInfo?.hasNextPage ? (page.pageInfo.endCursor ?? undefined) : undefined;
    } while (after);

    return nodes;
  },
  ['sitemap-glossary'],
  { revalidate: 3600, tags: ['sitemap', 'sitemap:glossary'] }
);

export async function GET() {
  if (!SITEMAPS_ENABLED) {
    return NextResponse.json({ ok: true, note: 'sitemap disabled' }, { status: 404 });
  }

  const items = await getGlossaryUrls();

  const head = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<?xml-stylesheet type="text/xsl" href="/__sitemaps/sitemap.xsl"?>`,
  ].join('');
  const body = [
    head,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...items.map((n) => {
      const rawPath = normalizeEntryPath(n.uri);
      const path = rawPath.startsWith('/glossary_term/')
        ? rawPath.replace('/glossary_term/', '/roofing-glossary/')
        : rawPath;
      const loc = `${BASE}${path}`;
      const isoLastmod = formatLastmod(n.modifiedGmt);
      const lastmod = isoLastmod ? `<lastmod>${isoLastmod}</lastmod>` : '';
      return `<url><loc>${loc}</loc>${lastmod}</url>`;
    }),
    `</urlset>`,
  ].join('');

  return new NextResponse(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      ...PREVIEW_HEADERS,
    },
  });
}
