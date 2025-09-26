import Section from "@/components/layout/Section";
import { listBlogCategories, listPostsPaged } from "@/lib/wp";
import { ChevronDown } from "lucide-react";
import ResourcesAside from "@/components/ResourcesAside";
import InfiniteList from "@/components/InfiniteList";
import GridLoadingState from "@/components/layout/GridLoadingState";
import ResourceSearchController from "@/components/resource-search/ResourceSearchController";
import type { Metadata } from 'next';

export const revalidate = 900;

// ===== STATIC SEO FOR /blog (EDIT HERE) =====
const SEO_TITLE_BLOG = 'Roofing Blog for Sarasota, Manatee & Charlotte Counties | SonShine Roofing';
const SEO_DESCRIPTION_BLOG = 'Practical roofing tips, how‑tos, and local insights from our Sarasota team. Serving SW Florida since 1987.';
const SEO_KEYWORDS_BLOG = [
  'roofing blog',
  'roofing tips',
  'roof repair advice',
  'roof replacement guide',
  'Sarasota roofing',
  'Manatee County roofing',
  'Charlotte County roofing'
];
const SEO_CANONICAL_BLOG = '/blog';
const SEO_OG_IMAGE_DEFAULT = '/og-default.png';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: SEO_TITLE_BLOG,
    description: SEO_DESCRIPTION_BLOG,
    keywords: SEO_KEYWORDS_BLOG,
    alternates: { canonical: SEO_CANONICAL_BLOG },
    openGraph: {
      type: 'website',
      title: SEO_TITLE_BLOG,
      description: SEO_DESCRIPTION_BLOG,
      url: SEO_CANONICAL_BLOG,
      images: [{ url: SEO_OG_IMAGE_DEFAULT, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: SEO_TITLE_BLOG,
      description: SEO_DESCRIPTION_BLOG,
      images: [SEO_OG_IMAGE_DEFAULT],
    },
  };
}

export default async function BlogArchivePage() {
  // Initial page for the list (SSR for speed/SEO)
  const first = 24;
  const initial = await listPostsPaged({ first: 6, after: null, filters: {} }).catch(() => ({ items: [], pageInfo: { hasNextPage: false, endCursor: null } }));

  // Lightweight taxonomy fetch for category pills (avoid fetching posts just to get categories)
  const blogCats = await listBlogCategories(100).catch(() => []);

  // JSON-LD: CollectionPage + BreadcrumbList for Blog archive
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://sonshineroofing.com';
  const pageUrl = `${base}${SEO_CANONICAL_BLOG}`;

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': ['WebPage', 'CollectionPage'],
    name: SEO_TITLE_BLOG,
    description: SEO_DESCRIPTION_BLOG,
    url: pageUrl,
    primaryImageOfPage: { '@type': 'ImageObject', url: `${base}${SEO_OG_IMAGE_DEFAULT}` },
    isPartOf: { '@type': 'WebSite', name: 'SonShine Roofing', url: base },
  } as const;

  const breadcrumbsLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: pageUrl },
    ],
  } as const;

  // Derive category names (no counts) from fetched posts (exclude featured, uncategorized)
  const EXCLUDE = new Set(["featured", "uncategorized"]);
  const categories = blogCats
    .map((t) => String(t.name || "").trim())
    .filter((name) => !!name && !EXCLUDE.has(name.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  return (
    <Section>
      <div className="container-edge py-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">

          {/* Main Content (Left) */}
          <div>
            <h1 className="text-3xl font-semibold">Blog</h1>
            {/* JSON-LD: CollectionPage + BreadcrumbList */}
            <script
              type="application/ld+json"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
            />
            <script
              type="application/ld+json"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }}
            />
            <p className="mt-2 text-slate-600">
              Enjoy these handcrafted articles from our team that discuss
              a wide variety of roofing topics (and a few extras,
              from our family to yours).
            </p>

            {/* Filters */}
            <div className="mt-6 rounded-xl border border-slate-400 bg-[#cef3ff]/30 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                {/* Search input */}
                <label htmlFor="blog-search" className="sr-only">Search blog</label>
                <input
                  id="blog-search"
                  type="search"
                  placeholder="Search posts..."
                  className="w-full rounded-lg border border-slate-400 px-4 py-2 text-[15px] outline-none focus:ring-2 focus:ring-[--brand-cyan]"
                  autoComplete="off"
                />
              </div>

              {/* Filters accordion */}
              <details id="blog-filters" className="mt-3 group rounded-lg border border-slate-400 bg-white/70">
                <summary className="flex items-center justify-between cursor-pointer select-none px-4 py-2 text-sm font-semibold text-slate-800 hover:translate-y-[1px] transition">
                  <span>Search Filters</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>

                <div className="px-4 pb-4 pt-2">
                  {/* Clear filters (now inside the accordion on both mobile & desktop) */}
                  <button
                    id="blog-clear"
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                    aria-label="Clear filters"
                  >
                    Reset filters
                  </button>

                  {/* Category pills */}
                  <div id="blog-pills" className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      data-cat="__all__"
                      aria-pressed="true"
                      className="px-3 py-1.5 rounded-full border text-sm transition select-none border-[--brand-blue] text-white bg-[--brand-blue] hover:bg-[--brand-blue]/90 hover:text-white"
                    >
                      All
                    </button>

                    {categories.map((name: string) => (
                      <button
                        key={name}
                        type="button"
                        data-cat={name}
                        aria-pressed="false"
                        className="px-3 py-1.5 rounded-full border text-sm transition select-none border-slate-300 text-slate-700 hover:border-[--brand-blue] bg-white"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              </details>

              {/* Active filter chips */}
              <div id="blog-chips" className="mt-6 hidden flex-wrap gap-2">
                {/* Chips will be injected here */}
              </div>

            </div>

            <div id="blog-no-results" className="mt-8 hidden rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
              <p className="mb-2 font-medium">No results found.</p>
              <p className="text-sm">Try clearing filters or adjusting your search terms.</p>
              <button id="blog-clear-2" type="button" className="mt-3 rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">Clear filters</button>
            </div>

            <div id="blog-skeleton" className="mt-8 hidden">
              <GridLoadingState variant="blog" count={6} className="grid-cols-1 lg:grid-cols-2" />
            </div>


            <div id="blog-grid">
              <InfiniteList
                kind="blog"
                initial={initial}
                filters={{}} // server-side pagination only; client handles exact-phrase filtering
                pageSize={6}
                gridClass="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4"
              />
            </div>
            <ResourceSearchController
              kind="blog"
              ids={{
                query: "blog-search",
                grid: "blog-grid",
                chips: "blog-chips",
                skeleton: "blog-skeleton",
                noResults: "blog-no-results",
              }}
              urlKeys={{ q: "q", cat: "cat" }}
              minQueryLen={2}
            />
          </div>

          {/* Floating Content (Right) */}
          <ResourcesAside />

        </div>
      </div>
    </Section>
  );
}
