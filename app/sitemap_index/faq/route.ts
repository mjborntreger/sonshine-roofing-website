import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { wpFetch } from '@/lib/content/wp';
import { formatLastmod, normalizeEntryPath } from '../utils';

export const dynamic = 'force-static';
export const revalidate = 3600; // safety net; tag-based revalidation will be faster

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://sonshineroofing.com';
const ENABLED =
  process.env.NEXT_PUBLIC_ENV === 'production' ||
  process.env.NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW === 'true';
const PREVIEW =
  process.env.NEXT_PUBLIC_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_ENABLE_SITEMAPS_PREVIEW === 'true';
const FAQ_ENABLED = process.env.NEXT_PUBLIC_ENABLE_FAQ_SITEMAP === 'true';

type Node = { uri: string; modifiedGmt?: string | null };

type SitemapFaqsResult = {
  faqs: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: Node[];
  };
};

const getFaqUrls = unstable_cache(
  async () => {
    const q = /* GraphQL */ `
      query SitemapFaqs($first: Int!, $after: String) {
        faqs(
          first: $first
          after: $after
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
      const data = await wpFetch<SitemapFaqsResult>(q, vars);
      const page = data?.faqs;
      if (page?.nodes?.length) nodes.push(...page.nodes);
      after = page?.pageInfo?.hasNextPage ? (page.pageInfo.endCursor ?? undefined) : undefined;
    } while (after);

    return nodes;
  },
  ['sitemap-faq'],
  { revalidate: 3600, tags: ['sitemap', 'sitemap:faq'] }
);

export async function GET() {
  if (!ENABLED || !FAQ_ENABLED) {
    return NextResponse.json({ ok: true, note: 'sitemap disabled' }, { status: 404 });
  }

  const items = await getFaqUrls();

  const head = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<?xml-stylesheet type="text/xsl" href="/__sitemaps/sitemap.xsl"?>`,
  ].join('');
  const body = [
    head,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...items.map((n) => {
      const path = normalizeEntryPath(n.uri);
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
      ...(PREVIEW ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}),
    },
  });
}
