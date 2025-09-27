import Section from '@/components/layout/Section';
import { listFaqTopics, listFaqsWithContent, faqListToJsonLd } from '@/lib/wp';
import type { FaqFull, FaqTopic } from '@/lib/wp';
import type { Metadata } from 'next';
import ResourceSearchController from '@/components/resource-search/ResourceSearchController';
import ResourcesAside from '@/components/ResourcesAside';

export const revalidate = 86400; // daily ISR

export async function generateMetadata(): Promise<Metadata> {
  // EDIT: FAQ archive SEO title/description/copy here (applies to prod + staging)
  const title = 'Roofing FAQs | SonShine Roofing';
  const description = 'Clear, no-nonsense answers to the most common roofing questions in Sarasota, Manatee, and Charlotte Counties. Get the facts before you climb a ladder.';

  return {
    title,
    description,
    alternates: { canonical: '/faq' },
    openGraph: {
      type: 'website',
      title,
      description,
      url: '/faq',
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
  const faqLd = faqListToJsonLd(faqs.slice(0, 50), base, '/faq');
  const breadcrumbsLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
      { '@type': 'ListItem', position: 2, name: 'FAQ', item: `${base}/faq` },
    ],
  } as const;

  // Sort topics: featured topics first (if available), then alphabetically
  const topicsSorted = [...topics].sort((a, b) => {
    const af = (a as any).featured ? 1 : 0;
    const bf = (b as any).featured ? 1 : 0;
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
              <input
                id="faq-search"
                type="search"
                defaultValue={q}
                placeholder="Search questions..."
                aria-label="Search FAQs"
                autoComplete="off"
                className="w-full rounded-md border border-slate-400 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#0045d7] focus:outline-none"
              />
            </div>

            {/* Results meta + controls */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-700">Showing <span id="faq-result-count" aria-live="polite">{faqs.length}</span> FAQs</span>
              <div className="ml-auto sm:flex items-center gap-2">
                <button id="faq-expand-all" type="button" className="rounded-md border border-slate-400 px-3 py-1.5 text-sm bg-white hover:bg-slate-50">
                  Expand all
                </button>
                <button id="faq-collapse-all" type="button" className="rounded-md border border-slate-400 px-3 py-1.5 text-sm bg-white hover:bg-slate-50">
                  Collapse all
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
                    <details className="faq-topic rounded-lg border border-slate-400 bg-white">
                      <summary className="flex items-center justify-between cursor-pointer select-none px-4 py-2 text-sm font-semibold text-slate-800 hover:translate-y-[1px] transition">
                        <span data-topic-name={title}>{title}</span>
                        <span className="inline-flex items-center gap-2 text-slate-600">
                          <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-[#cef3ff] px-2 text-xs font-medium text-slate-700 faq-count">
                            {list.length}
                          </span>
                        </span>
                      </summary>
                      <div className="accordion-motion px-4 pb-4 pt-2 space-y-2">
                        {list.map((f) => {
                          return (
                            <details
                              key={f.slug}
                              id={`faq-${f.slug}`}
                              className="faq-item group rounded-md border border-slate-200 bg-white"
                              data-title={(f.title || '').toString()}
                              data-topic={title}
                              data-excerpt=""
                            >
                              <summary className="flex items-start justify-between gap-4 px-4 py-3 cursor-pointer">
                                <h3 className="prose text-slate-900">{f.title}</h3>
                                <svg
                                  className="h-5 w-5 shrink-0 self-center opacity-70 transition-transform duration-200 group-open:rotate-90"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  aria-hidden
                                >
                                  <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </summary>
                              <div
                                className="accordion-motion prose prose-sm px-4 pb-4 mt-1"
                                dangerouslySetInnerHTML={{ __html: (f as any).contentHtml || '' }}
                              />
                            </details>
                          );
                        })}
                      </div>
                    </details>
                  </section>
                );
              })}
            </div>
          </div>
          {/* RIGHT: floating aside on desktop */}
          <ResourcesAside />
        </div>
      </div>

      {/* Expand/Collapse controls */}
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `(() => {
            const $all = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

            function wireBulkControls() {
              const expandAllBtn = document.getElementById('faq-expand-all');
              const collapseAllBtn = document.getElementById('faq-collapse-all');

              if (expandAllBtn) {
                expandAllBtn.addEventListener('click', () => {
                  $all('details.faq-topic').forEach((t) => (t.open = true));
                  $all('details.faq-item').forEach((d) => (d.open = true));
                });
              }

              if (collapseAllBtn) {
                collapseAllBtn.addEventListener('click', () => {
                  $all('details.faq-item').forEach((d) => (d.open = false));
                  $all('details.faq-topic').forEach((t) => (t.open = false));
                });
              }
            }

            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', wireBulkControls);
            } else {
              wireBulkControls();
            }
          })();`,
        }}
      />
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
