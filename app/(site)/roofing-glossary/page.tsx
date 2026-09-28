import ResourcePage from '@/components/resources/ResourcePage';
import { ArrowRight } from 'lucide-react';
import { listGlossaryIndex } from '@/lib/content/glossary';
import GlossaryQuickSearch from '@/components/dynamic-content/roofing-glossary/GlossaryQuickSearch';
import type { Metadata } from 'next';
import SmartLink from '@/components/utils/SmartLink';
import { JsonLd } from '@/lib/seo/json-ld';
import { breadcrumbSchema, definedTermSchema } from '@/lib/seo/schema';
import { SITE_ORIGIN } from '@/lib/seo/site';
import { getWebsitePageMetadata } from '@/lib/content/directus-site';

export const revalidate = false;
const PAGE_PATH = '/roofing-glossary';

export async function generateMetadata(): Promise<Metadata> {
  // EDIT: Roofing Glossary archive SEO (title/description)
  const title = 'Roofing Glossary | SonShine Roofing';
  const description =
    'Plain-English definitions of roofing terms for Sarasota, Manatee, and Charlotte Counties. No jargon, just clarity.';

  return getWebsitePageMetadata({
    title,
    description,
    path: PAGE_PATH,
    image: { url: '/og-default.png?v=20260818', width: 1200, height: 630 },
  });
}

export default async function GlossaryArchivePage() {
  const terms = await listGlossaryIndex();

  // JSON-LD: DefinedTermSet + Breadcrumbs
  const origin = SITE_ORIGIN;
  const pageUrl = `${origin}${PAGE_PATH}`;
  const definedTerms = terms.map((t) =>
    definedTermSchema({
      name: t.title,
      description: t.excerpt.slice(0, 200),
      url: `${PAGE_PATH}/${t.slug}`,
      inDefinedTermSet: PAGE_PATH,
      origin,
      withContext: false,
    }),
  );

  const glossaryLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Roofing Glossary',
    description:
      'Plain-English definitions of roofing terms used by homeowners and pros in Southwest Florida.',
    url: pageUrl,
    hasDefinedTerm: definedTerms,
  } as const;

  const breadcrumbsLd = breadcrumbSchema(
    [
      { name: 'Home', item: '/' },
      { name: 'Roofing Glossary', item: PAGE_PATH },
    ],
    { origin },
  );

  return (
    <ResourcePage
      title="Roofing Glossary"
      introduction="Clear, plain-English definitions for common (and not-so-common) roofing terms."
      activePath={PAGE_PATH}
    >
      <JsonLd data={glossaryLd} />
      <JsonLd data={breadcrumbsLd} />
      <GlossaryQuickSearch terms={terms.map(({ title, slug }) => ({ title, slug }))} />
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-blue-200 pt-5">
        <p className="text-sm text-slate-600">Have a roofing question?</p>
        <SmartLink href="/faq" aria-label="Read our FAQs" className="btn btn-sm btn-ghost gap-2">
          Read our FAQs <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </SmartLink>
      </div>
    </ResourcePage>
  );
}

export const dynamic = 'force-static';
