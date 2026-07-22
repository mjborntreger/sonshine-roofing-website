import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Section from '@/components/layout/Section';
import SmartLink from '@/components/utils/SmartLink';
import {
  getGlossaryTerm,
  listGlossaryIndex,
  type GlossarySummary,
} from '@/lib/content/glossary';
import { getSiteSettings } from '@/lib/content/directus-site';
import { buildBasicMetadata } from '@/lib/seo/meta';
import { JsonLd } from '@/lib/seo/json-ld';
import { breadcrumbSchema, definedTermSchema } from '@/lib/seo/schema';
import { SITE_ORIGIN } from '@/lib/seo/site';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Link the first plain-text occurrence of each other glossary term. Directus
 * HTML is sanitized before this helper runs, and inserted href/class values
 * are generated exclusively from validated slugs and static markup.
 */
function autoLinkGlossary(
  html: string,
  index: Array<Pick<GlossarySummary, 'slug' | 'title'>>,
  currentSlug: string,
): string {
  if (!html || !index.length) return html;

  const candidates = index
    .filter((term) => term.slug !== currentSlug && term.title)
    .sort((left, right) => right.title.length - left.title.length);
  if (!candidates.length) return html;

  const byTitle = new Map(candidates.map((term) => [term.title.toLowerCase(), term.slug]));
  const pattern = candidates.map((term) => escapeRegExp(term.title)).join('|');
  if (!pattern) return html;
  const matcher = new RegExp(`(?<![\\w-])(${pattern})(?![\\w-])`, 'gi');
  const tokens = html.split(/(<[^>]+>)/g);
  const linkedOnce = new Set<string>();
  let inAnchor = false;
  let inCode = false;
  let linkBudget = 40;

  for (let indexPosition = 0; indexPosition < tokens.length; indexPosition += 1) {
    const token = tokens[indexPosition];
    if (!token) continue;
    if (token.startsWith('<')) {
      if (/^<a\b/i.test(token)) inAnchor = true;
      else if (/^<\/a\b/i.test(token)) inAnchor = false;
      if (/^<code\b/i.test(token)) inCode = true;
      else if (/^<\/code\b/i.test(token)) inCode = false;
      continue;
    }
    if (inAnchor || inCode || linkBudget <= 0) continue;

    tokens[indexPosition] = token.replace(matcher, (match) => {
      if (linkBudget <= 0) return match;
      const slug = byTitle.get(match.toLowerCase());
      if (!slug || linkedOnce.has(slug)) return match;
      linkedOnce.add(slug);
      linkBudget -= 1;
      return `<a href="/roofing-glossary/${slug}" class="underline decoration-dotted hover:decoration-solid">${match}</a>`;
    });
  }

  return tokens.join('');
}

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [term, settings] = await Promise.all([getGlossaryTerm(slug), getSiteSettings()]);
  if (!term) notFound();

  const description =
    term.metaDescription ?? term.contentPlain.slice(0, 160) ?? 'SonShine Roofing glossary term.';
  const image = term.ogImageOverride ?? settings?.defaultOgImage;
  return buildBasicMetadata({
    title: term.metaTitle ?? `${term.title} | Roofing Glossary`,
    description,
    openGraphTitle: term.ogTitle ?? term.metaTitle ?? undefined,
    openGraphDescription: term.ogDescription ?? term.metaDescription ?? undefined,
    path: `/roofing-glossary/${term.slug}`,
    keywords: term.focusKeywords,
    image: image
      ? {
          url: image.url,
          width: image.width ?? undefined,
          height: image.height ?? undefined,
          alt: 'altText' in image ? image.altText : image.description,
        }
      : { url: '/og-default.png', width: 1200, height: 630 },
    robots: { index: !term.noindex, follow: true },
  });
}

export async function generateStaticParams() {
  const index = await listGlossaryIndex(500);
  return index.map((term) => ({ slug: term.slug }));
}

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [index, term] = await Promise.all([listGlossaryIndex(500), getGlossaryTerm(slug)]);
  if (!term) notFound();

  const position = index.findIndex((item) => item.slug === slug);
  const hasPosition = position >= 0;
  const previous =
    hasPosition && position > 0 ? index[position - 1] : hasPosition ? index[index.length - 1] : null;
  const next =
    hasPosition && position < index.length - 1 ? index[position + 1] : hasPosition ? index[0] : null;
  const termPath = `/roofing-glossary/${term.slug}`;
  const linkedHtml = autoLinkGlossary(term.contentHtml, index, term.slug);

  const definedTermLd = definedTermSchema({
    name: term.title,
    description: term.contentPlain.slice(0, 300),
    url: termPath,
    inDefinedTermSet: '/roofing-glossary',
    origin: SITE_ORIGIN,
  });
  const breadcrumbsLd = breadcrumbSchema(
    [
      { name: 'Home', item: '/' },
      { name: 'Roofing Glossary', item: '/roofing-glossary' },
      { name: term.title, item: termPath },
    ],
    { origin: SITE_ORIGIN },
  );

  return (
    <Section>
      <div className="container-edge py-8">
        <nav className="mb-4 text-sm text-slate-600">
          <SmartLink
            href="/roofing-glossary"
            className="text-sm font-semibold text-slate-600 underline-offset-2 hover:underline"
          >
            ← Back to Glossary
          </SmartLink>
        </nav>

        <article className="prose max-w-none">
          <h1>{term.title}</h1>
          <JsonLd data={definedTermLd} />
          <JsonLd data={breadcrumbsLd} />
          <div dangerouslySetInnerHTML={{ __html: linkedHtml }} />
        </article>

        {hasPosition && (
          <nav className="mt-10 flex items-center justify-between gap-4" aria-label="Term navigation">
            {previous ? (
              <SmartLink
                href={`/roofing-glossary/${previous.slug}`}
                rel="prev"
                className="group inline-flex max-w-[48%] items-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                aria-label={`Previous term: ${previous.title}`}
              >
                <span aria-hidden>←</span>
                <span className="truncate">{previous.title}</span>
              </SmartLink>
            ) : (
              <span />
            )}

            {next ? (
              <SmartLink
                href={`/roofing-glossary/${next.slug}`}
                rel="next"
                className="group inline-flex max-w-[48%] items-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                aria-label={`Next term: ${next.title}`}
              >
                <span className="truncate">{next.title}</span>
                <span aria-hidden>→</span>
              </SmartLink>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </Section>
  );
}
