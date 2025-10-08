import Section from '@/components/layout/Section';
import { listFaqTopics, listFaqsWithContent, faqListToJsonLd } from '@/lib/wp';
import type { FaqFull, FaqTopic } from '@/lib/wp';
import type { Metadata } from 'next';
import ResourceSearchController from '@/components/resource-search/ResourceSearchController';
import ResourcesAside from '@/components/ResourcesAside';
import { ArrowDown, ArrowUp, HelpCircle, Search } from 'lucide-react';
import { Accordion } from '@/components/Accordion';
import FaqBulkToggleClient from './FaqBulkToggleClient';

export const revalidate = 86400; // daily ISR
const PAGE_PATH = '/faq';

export async function generateMetadata(): Promise<Metadata> {
  // EDIT: FAQ archive SEO title/description/copy here (applies to prod + staging)
  const title = 'Roofing FAQs | SonShine Roofing';
  const description = 'Clear, no-nonsense answers to the most common roofing questions in Sarasota, Manatee, and Charlotte Counties. Get the facts before you climb a ladder.';

  return {
    title,
    description,
    alternates: { canonical: PAGE_PATH },
    openGraph: {
      type: 'website',
      title,
      description,
      url: PAGE_PATH,
      images: [{ url: '/og-default.png', width: 1200, height: 630 }], // EDIT: swap if you add a dedicated FAQ OG image
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-default.png'],
    },
  };
}

type PageProps = { searchParams?: Promise<{ q?: string; topic?: string }> };

export default async function FAQArchivePage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? ({} as { q?: string; topic?: string });
  const qRaw = sp.q ?? '';
  const q = qRaw.trim();

  const [topics, faqs] = await Promise.all([
    listFaqTopics(200).catch(() => [] as FaqTopic[]),
    listFaqsWithContent(500).catch(() => [] as FaqFull[]),
  ]);

  // JSON-LD: build FAQPage + Breadcrumbs (first 50 items)
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://sonshineroofing.com';
  const faqLd = faqListToJsonLd(faqs.slice(0, 50), base, PAGE_PATH);
  const breadcrumbsLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
      { '@type': 'ListItem', position: 2, name: 'FAQ', item: `${base}${PAGE_PATH}` },
    ],
  } as const;

  // Sort topics: featured topics first (if available), then alphabetically
  const topicsSorted = [...topics].sort((a, b) => {
    const af = a.featured ? 1 : 0;
    const bf = b.featured ? 1 : 0;
    if (af !== bf) return bf - af; // featured first
    return a.name.localeCompare(b.name);
  });

  // Group all items by topic for display
  const groups = new Map<string, FaqFull[]>();
  for (const f of faqs) {
    const slugs = f.topicSlugs ?? [];
    if (slugs.length > 0) {
      for (const t of slugs) {
        if (!groups.has(t)) groups.set(t, []);
        groups.get(t)!.push(f);
      }
    } else {
      if (!groups.has('uncategorized')) groups.set('uncategorized', []);
      groups.get('uncategorized')!.push(f);
    }
  }

  // Resolve group ordering by topics list (so featured first)
  const topicOrder = new Map<string, number>(topicsSorted.map((t, i) => [t.slug, i] as const));
  const orderedGroupKeys = Array.from(groups.keys()).sort((a, b) => {
    const ia = topicOrder.has(a) ? topicOrder.get(a)! : 9_999;
    const ib = topicOrder.has(b) ? topicOrder.get(b)! : 9_999;
    if (ia !== ib) return ia - ib;
    const na = topicsSorted.find((t) => t.slug === a)?.name || a;
    const nb = topicsSorted.find((t) => t.slug === b)?.name || b;
    return na.localeCompare(nb);
  });

  return (
    <Section>
      <div className="container-edge py-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">
          {/* LEFT: main content */}
          <div>
            <h1 className="text-3xl font-semibold">Frequently Asked Questions</h1>
            <p className="mt-2 text-slate-600">
              Answers to common roofing questions from our team in Sarasota. If you can’t find what you need,
              we’re one call away.
            </p>

            {/* JSON-LD: FAQPage + Breadcrumbs */}
            <script
              type="application/ld+json"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
            />
            <script
              type="application/ld+json"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }}
            />

            {/* Search (client-side, exact phrase like Blog) */}
            <div className="mt-6" role="search">
              <div className="rounded-2xl border border-slate-300 bg-white/80 p-4 shadow-sm backdrop-blur md:p-6">
                <div className="inline-flex w-full items-start">
                  <Search className="h-6 w-6 mr-4 translate-y-2 text-[--brand-blue]" />
                  <input
                    id="faq-search"
                    type="search"
                    defaultValue={q}
                    placeholder="Search questions..."
                    aria-label="Search FAQs"
                    autoComplete="off"
                    className="w-full rounded-md border border-slate-400 bg-white px-3 py-2 text-sm shadow-sm focus:border-[--brand-blue] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Results meta + controls */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-700">Showing <span id="faq-result-count" aria-live="polite">{faqs.length}</span> FAQs</span>
              <div className="ml-auto flex items-center">
                <button
                  id="faq-toggle-all"
                  type="button"
                  aria-expanded="true"
                  className="inline-flex items-center gap-2 rounded-full border border-[--brand-blue] bg-white px-4 py-1.5 text-sm font-semibold text-[--brand-blue] transition hover:bg-[--brand-blue]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--brand-blue] focus-visible:ring-offset-2"
                  data-state="expanded"
                >
                  <span data-faq-toggle-label>Collapse all</span>
                  <ArrowDown className="hidden h-4 w-4" data-faq-toggle-icon="down" aria-hidden />
                  <ArrowUp className="h-4 w-4" data-faq-toggle-icon="up" aria-hidden />
                </button>
              </div>
            </div>

            {/* Client-driven No results panel */}
            <div id="faq-no-results" className="mt-6 hidden rounded-md border border-slate-400 bg-white p-4">
              <p className="text-sm text-slate-700">
                No results for <span id="faq-query" className="font-semibold"></span>.
              </p>
              <div id="faq-suggestions" className="mt-2 hidden">
                <p className="text-sm text-slate-600">Did you mean:</p>
                <ul id="faq-suggestion-list" className="mt-2 flex flex-wrap gap-2"></ul>
              </div>
            </div>

            {/* Groups as accordions */}
            <div className="mt-8 space-y-6" id="faq-topics">
              {orderedGroupKeys.map((slug) => {
                const term = topicsSorted.find((t) => t.slug === slug);
                const title = term?.name || slug;
                const list = groups.get(slug) || [];
                if (list.length === 0) return null;
                return (
                  <section key={slug} id={`topic-${slug}`}>
                    <Accordion
                      className="faq-topic"
                      icon={<HelpCircle className="h-4 w-4" aria-hidden="true" />}
                      summary={
                        <h2 className="text-sm text-slate-700" data-topic-name={title}>
                          {title}
                        </h2>
                      }
                      meta={
                        <span className="inline-flex items-center gap-2 text-slate-600">
                          <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-[#cef3ff] px-2 text-xs font-medium text-slate-700 faq-count">
                            {list.length}
                          </span>
                        </span>
                      }
                      radius="2xl"
                      tone="medium"
                      size="sm"
                      proseBody={false}
                      defaultOpen
                    >
                      {list.map((f) => (
                        <Accordion
                          key={f.slug}
                          id={`faq-${f.slug}`}
                          className="faq-item mb-2"
                          data-title={(f.title || '').toString()}
                          data-topic={title}
                          data-excerpt=""
                          summary={<h3 className="text-[1.2rem]">{f.title}</h3>}
                          radius="2xl"
                          tone="soft"
                          size="sm"
                          proseBody={false}
                        >
                          <div dangerouslySetInnerHTML={{ __html: f.contentHtml || '' }} />
                        </Accordion>
                      ))}
                    </Accordion>
                  </section>
                );
              })}
            </div>
          </div>
          {/* RIGHT: floating aside on desktop */}
          <ResourcesAside activePath={PAGE_PATH} />
        </div>
      </div>

      <FaqBulkToggleClient />
      <ResourceSearchController
        kind="faq"
        ids={{
          query: "#faq-search",
          grid: "#faq-topics",
          chips: "",             // not used on FAQ
          skeleton: "",          // not used by default
          noResults: "#faq-no-results",
          resultCount: "#faq-result-count",
        }}
        urlKeys={{ q: "q" }}
        minQueryLen={2}
      />
    </Section>
  );
}
