import Section from '@/components/layout/Section';
import Link from 'next/link';
import { listGlossaryIndex, stripHtml } from '@/lib/wp';
import GlossaryQuickSearch from './GlossaryQuickSearch';
import ResourcesAside from '@/components/ResourcesAside';
import type { Metadata } from 'next';
import SmartLink from '@/components/SmartLink';

export const revalidate = 86400; // daily ISR

export async function generateMetadata(): Promise<Metadata> {
  // EDIT: Roofing Glossary archive SEO (title/description)
  const title = 'Roofing Glossary | SonShine Roofing';
  const description = 'Plain-English definitions of roofing terms for Sarasota, Manatee, and Charlotte Counties. No jargon, just clarity.';

  return {
    title,
    description,
    alternates: { canonical: '/roofing-glossary' },
    openGraph: {
      type: 'website',
      title,
      description,
      url: '/roofing-glossary',
      images: [{ url: '/og-default.png', width: 1200, height: 630 }], // EDIT: swap if you add a dedicated OG image
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-default.png'],
    },
  };
}

export default async function GlossaryArchivePage() {
  const terms = await listGlossaryIndex(500);

  // Group by first letter (A-Z, then # for non-letters)
  const groups = new Map<string, { title: string; slug: string }[]>();
  for (const t of terms) {
    const letter = /^[A-Za-z]/.test(t.title) ? t.title[0].toUpperCase() : '#';
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push(t);
  }
  const letters = Array.from(groups.keys()).sort((a, b) =>
    a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b),
  );

  // JSON-LD: DefinedTermSet + Breadcrumbs
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://sonshineroofing.com';
  const definedTerms = terms.map((t) => ({
    '@type': 'DefinedTerm',
    name: t.title,
    description: stripHtml((t as any).excerpt || '').slice(0, 200),
    url: `${base}/roofing-glossary/${t.slug}`,
    inDefinedTermSet: `${base}/roofing-glossary`,
  }));

  const glossaryLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Roofing Glossary',
    description: 'Plain-English definitions of roofing terms used by homeowners and pros in Southwest Florida.',
    url: `${base}/roofing-glossary`,
    hasDefinedTerm: definedTerms,
  } as const;

  const breadcrumbsLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
      { '@type': 'ListItem', position: 2, name: 'Roofing Glossary', item: `${base}/roofing-glossary` },
    ],
  } as const;

  return (
    <Section>
      <div className="container-edge py-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">

          {/* LEFT: main content */}
          <div>
            <h1 className="text-3xl font-semibold">Roofing Glossary</h1>
            <p className="mt-2 text-slate-600">
              Clear, plain-English definitions for common (and not-so-common) roofing terms.
            </p>

            {/* JSON-LD: DefinedTermSet + Breadcrumbs */}
            <script
              type="application/ld+json"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: JSON.stringify(glossaryLd) }}
            />
            <script
              type="application/ld+json"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }}
            />

            <GlossaryQuickSearch terms={terms} />

            {/* A–Z nav */}
            <nav className="mt-6 flex flex-wrap gap-2 text-sm" aria-label="Glossary letters">
              {letters.map((l) => (
                <SmartLink
                  key={l}
                  href={`#glossary-${l === '#' ? 'num' : l}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white hover:bg-slate-50"
                >
                  {l}
                </SmartLink>
              ))}
            </nav>

            <div className="mt-8 space-y-10">
              {letters.map((l) => {
                const list = groups.get(l)!;
                const anchor = l === '#' ? 'num' : l;
                return (
                  <section key={l} id={`glossary-${anchor}`}>
                    <h2 className="text-xl font-semibold">{l === '#' ? '0–9' : l}</h2>
                    <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {list.map((t) => (
                        <li key={t.slug}>
                          <Link
                            href={`/roofing-glossary/${t.slug}`}
                            className="block rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-800 hover:bg-slate-50"
                          >
                            {t.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </div>

          {/* RIGHT: floating aside on desktop */}
          <ResourcesAside />

        </div>
      </div>
    </Section>
  );
}
