// app/video-library/page.tsx
import Section from "@/components/layout/Section";
import {
  listRecentVideoEntries,
  listProjectVideos,
  groupVideosByBucket,
  listVideoItemsPaged,
  type VideoItem,
  type TermLite,
  type VideoBucketKey,
} from "@/lib/wp";
import VideoGrid from "./video-grid";
import GridLoadingState from "@/components/layout/GridLoadingState";
import ResourcesAside from "@/components/ResourcesAside";
import ResourceSearchController from "@/components/resource-search/ResourceSearchController";

import type { PageResult } from "@/lib/pagination";
import type { Metadata } from "next";

export const revalidate = 900;

export async function generateMetadata({ searchParams }: { searchParams?: Promise<Record<string, string | string[]>> }): Promise<Metadata> {
  const spObj = (await searchParams) ?? {};
  const vParam = Array.isArray(spObj.v) ? spObj.v[0] : spObj.v;
  const v = typeof vParam === "string" ? vParam.trim() : "";

  // Default: library-level OG/Twitter
  const baseTitle = "Video Library | SonShine Roofing";
  const baseDesc = "Highlights from our projects, commercials, and accolades.";
  const defaultOg = {
    title: baseTitle,
    description: baseDesc,
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  };

  // If a specific video is selected (?v=slug), fetch its SEO for precise OG/Twitter
  if (v) {
    try {
      const mod: any = await import("@/lib/wp");
      const fn = mod?.getVideoEntryBySlug as undefined | ((slug: string) => Promise<any>);
      if (typeof fn === "function") {
        const video = await fn(v).catch(() => null);
        if (video) {
          const og = video.seo?.openGraph ?? {};
          const title = (video.seo?.title || og.title || video.title || baseTitle).trim();
          const description = (video.seo?.description || og.description || baseDesc).trim().slice(0, 160);
          const img = (og.image as any) || {};
          const ogUrl: string = img.secureUrl || img.url || video.featuredImage?.url || "/og-default.png";

          return {
            title,
            description,
            alternates: { canonical: "/video-library" },
            openGraph: {
              type: "video.other" as const,
              title,
              description,
              url: `/video-library?v=${encodeURIComponent(v)}`,
              images: [{ url: ogUrl, width: 1200, height: 630 }],
            },
            twitter: {
              card: "summary_large_image",
              title,
              description,
              images: [ogUrl],
            },
          };
        }
      }
    } catch (e) {
      // ignore and fall back to generic library meta
    }
  }

  // Fallback: generic library meta
  return {
    title: baseTitle,
    description: baseDesc,
    alternates: { canonical: "/video-library" },
    openGraph: { type: "website" as const, title: baseTitle, description: baseDesc, images: [{ url: "/og-default.png", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: baseTitle, description: baseDesc, images: ["/og-default.png"] },
  };
}

function uniqueTermsFromVideos(
  items: VideoItem[],
  key: "materialTypes" | "serviceAreas"
): TermLite[] {
  const map = new Map<string, TermLite>();
  for (const v of items) {
    const arr = (v as any)[key] as TermLite[] | undefined;
    if (!arr) continue;
    for (const t of arr) {
      const slug = String(t.slug || "").trim();
      const name = String(t.name || "").trim();
      if (!slug || !name) continue;
      if (!map.has(slug)) map.set(slug, { slug, name });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export default async function VideoLibraryPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[]>>;
}) {
  const [entries, projectVids] = await Promise.all([
    listRecentVideoEntries(200).catch((e) => {
      console.error("[videoEntries] GQL error:", e);
      return [];
    }),
    listProjectVideos(100).catch((e) => {
      console.error("[projectVideos] GQL error:", e);
      return [];
    }),
  ]);

  const all = [...entries, ...projectVids];
  const buckets = groupVideosByBucket(all);

  // JSON-LD (CollectionPage + optional VideoObject when ?v=...)
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://sonshineroofing.com";
  const collectionUrl = `${base}/video-library`;

  // Build a compact ItemList (first 12 items) using existing data
  const top = all.slice(0, 12);
  const itemListElement = top.map((i: any, idx: number) => {
    const slug = (i.slug || "").trim();
    const name = (i.title || "").trim();
    const img = i?.thumb?.url || i?.image?.url || i?.heroImage?.url || i?.featuredImage?.url || undefined;
    const url = slug ? `${collectionUrl}?v=${encodeURIComponent(slug)}` : collectionUrl;
    return { "@type": "ListItem", position: idx + 1, url, name, ...(img ? { image: img } : {}) };
  });

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Video Library",
    url: collectionUrl,
    hasPart: { "@type": "ItemList", itemListElement },
  };

  // Parse URL params -> server filters
  const spObj = (await searchParams) ?? {};
  const sp = new URLSearchParams(
    Object.entries(spObj).flatMap(([k, v]) =>
      Array.isArray(v) ? v.map((vv) => [k, String(vv)]) : [[k, String(v)]]
    )
  );
  const q = (sp.get("q") || "").trim();
  const parseCsv = (key: string) => (sp.get(key) || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Optional per-video JSON-LD when ?v=... is present (deduped with generateMetadata fetch)
  const vParam = sp.get("v");
  let selectedVideoLd: any = null;
  if (vParam) {
    try {
      const mod: any = await import("@/lib/wp");
      const getOne = mod?.getVideoEntryBySlug as undefined | ((slug: string) => Promise<any>);
      const toJsonLd = mod?.videoJsonLd as undefined | ((v: any, base: string) => any);
      if (typeof getOne === "function") {
        const selected = await getOne(vParam).catch(() => null);
        if (selected && typeof toJsonLd === "function") {
          selectedVideoLd = toJsonLd(selected, base);
        }
      }
    } catch (e) {
      // ignore; no per-video JSON-LD
    }
  }

  let bk = new Set<VideoBucketKey>(
    parseCsv("bk").filter((s): s is VideoBucketKey =>
      ["commercials", "explainers", "roofing-project", "accolades", "other"].includes(s as any)
    )
  );
  const mt = parseCsv("mt");
  const sa = parseCsv("sa");

  // If mt/sa present, force Roofing Projects bucket
  if (mt.length || sa.length) {
    bk = new Set(["roofing-project"]);
  }

  // Define sections; items fetched per-section below
  const sections: { key: VideoBucketKey; title: string }[] = [
    { key: "commercials", title: "Commercials" },
    { key: "explainers", title: "Explainers" },
    { key: "roofing-project", title: "Roofing Projects" },
  ];

  // Bucket pills (no counts). Only show buckets that have any items.
  const bucketPills = sections.filter((s) => (buckets[s.key]?.length || 0) > 0);

  // Unique terms from project videos only (others won't have these)
  const mtTerms = uniqueTermsFromVideos(projectVids, "materialTypes");
  const saTerms = uniqueTermsFromVideos(projectVids, "serviceAreas");

  // Build per-section initial pages with server-side filters
  const sectionInitials: { key: string; title: string; initial: PageResult<VideoItem>; filters: Record<string, unknown> }[] = [];
  for (const s of sections) {
    const serverFilters: Record<string, unknown> = { bucket: [s.key] };
    if (s.key === "roofing-project") {
      if (mt.length) serverFilters.materialSlugs = mt;
      if (sa.length) serverFilters.serviceAreaSlugs = sa;
    }
    // Optional: pass `q` if your server supports it; your client still does exact-phrase filtering.
    if (q) serverFilters.q = q;

    const initial = await listVideoItemsPaged({ first: 6, after: null, filters: serverFilters }).catch(() => ({ items: [], pageInfo: { hasNextPage: false, endCursor: null } }));
    sectionInitials.push({ key: s.key, title: s.title, initial, filters: serverFilters });
  }

  return (
    <Section>
      {/* JSON-LD: CollectionPage */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
      />
      {/* JSON-LD: Selected Video (when present) */}
      {selectedVideoLd && (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(selectedVideoLd) }}
        />
      )}
      <div className="container-edge py-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">

          <div>
            <h1 className="text-3xl font-semibold">Video Library</h1>
            <p className="mt-2 text-slate-600">
              Highlights from our projects, commercials, and accolades.
            </p>

            {vParam && (
              <div className="mt-4 rounded-md border border-slate-300 bg-white p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label htmlFor="video-share-url" className="text-sm font-medium text-slate-700">Share this video</label>
                  <div className="flex w-full items-center gap-2">
                    <input
                      id="video-share-url"
                      readOnly
                      value={`${collectionUrl}?v=${encodeURIComponent(vParam)}`}
                      className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                    />
                    <button id="video-share-copy" type="button" className="whitespace-nowrap rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
                      Copy link
                    </button>
                    <span id="video-share-copied" className="text-xs text-green-700 hidden">Copied!</span>
                  </div>
                </div>
              </div>
            )}

            {/* Search shell (match blog/projects styling) */}
            <div className="mt-6 rounded-xl border border-slate-400 bg-[#cef3ff]/30 p-4" role="search">
              <input
                id="video-search"
                type="search"
                placeholder="Search videos..."
                aria-label="Search videos"
                className="w-full rounded-lg border border-slate-400 bg-white px-4 py-2 text-[15px] shadow-sm focus:ring-2 focus:ring-[--brand-cyan] focus:outline-none"
              />

              {/* Filters accordion */}
              <details id="video-filters" className="mt-4 group rounded-lg border border-slate-400 bg-white/70">
                <summary className="flex items-center justify-between cursor-pointer select-none px-4 py-2 text-sm font-semibold text-slate-800 hover:translate-y-[1px] transition">
                  <span>Search Filters</span>
                  <svg className="h-4 w-4 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <div className="px-4 pb-4 pt-2">
                  <button
                    id="video-clear"
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                    aria-label="Clear filters"
                  >
                    Reset filters
                  </button>

                  {/* Bucket pills */}
                  <div className="mt-4">
                    <div className="text-xs font-semibold text-slate-600">Bucket</div>
                    <div id="video-pills-bk" className="mt-2 flex flex-wrap gap-2">
                      {bucketPills.map((b) => (
                        <button
                          key={`bk-${b.key}`}
                          type="button"
                          data-group="bk"
                          data-slug={b.key}
                          aria-pressed="false"
                          className="px-3 py-1.5 rounded-full border text-sm transition select-none border-slate-300 text-slate-700 hover:border-[--brand-blue] bg-white"
                        >
                          {b.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Material Type pills (project videos only) */}
                  {mtTerms.length > 0 && (
                    <div id="video-group-mt" className="mt-4 hidden">
                      <div className="text-xs font-semibold text-slate-600">Material</div>
                      <div id="video-pills-mt" className="mt-2 flex flex-wrap gap-2">
                        {mtTerms.map((t) => (
                          <button
                            key={`mt-${t.slug}`}
                            type="button"
                            data-group="mt"
                            data-slug={t.slug}
                            aria-pressed="false"
                            className="px-3 py-1.5 rounded-full border text-sm transition select-none border-slate-300 text-slate-700 hover:border-[--brand-blue] bg-white"
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Service Area pills (project videos only) */}
                  {saTerms.length > 0 && (
                    <div id="video-group-sa" className="mt-4 hidden">
                      <div className="text-xs font-semibold text-slate-600">Service Area</div>
                      <div id="video-pills-sa" className="mt-2 flex flex-wrap gap-2">
                        {saTerms.map((t) => (
                          <button
                            key={`sa-${t.slug}`}
                            type="button"
                            data-group="sa"
                            data-slug={t.slug}
                            aria-pressed="false"
                            className="px-3 py-1.5 rounded-full border text-sm transition select-none border-slate-300 text-slate-700 hover:border-[--brand-blue] bg-white"
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </details>

              {/* Active chips (outside accordion, like blog/projects) */}
              <div id="video-chips" className="mt-6 hidden flex-wrap gap-2">{/* chips rendered by script */}</div>


            </div>


            {/* No results */}
            <div id="video-no-results" className="mt-6 hidden rounded-md border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-700">
                No results for <span id="video-query" className="font-semibold"></span>.
              </p>
            </div>

            {/* Skeleton loading */}
            <div id="video-skeleton" className="mt-8 hidden">
              <GridLoadingState variant="video" count={6} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-2" />
            </div>

            {/* Sections */}
            <div id="video-sections" className="mt-8 space-y-10 min-w-0">
              {sectionInitials.map((section) => (
                <section
                  key={section.key}
                  className="video-section"
                  data-bucket-key={section.key}
                  data-section-title={section.title}
                >
                  <h3 className="text-xl font-semibold">{section.title}</h3>
                  <VideoGrid initial={section.initial} filters={section.filters} pageSize={24} />
                </section>
              ))}
            </div>

          </div>

          {/* Floating Content (Right) */}
          <ResourcesAside />

        </div>
      </div>

      <ResourceSearchController
        kind="video"
        ids={{
          query: "video-search",
          grid: "video-sections",     // wraps all sections
          chips: "video-chips",
          skeleton: "video-skeleton",
          noResults: "video-no-results",
          // resultCount omitted on purpose (we removed counts)
        }}
        urlKeys={{ q: "q", bk: "bk", mt: "mt", sa: "sa" }}
      />

      {/* Helpers: sync ?v=slug in URL and copy share link */}
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `(() => {
            function setVParam(slug) {
              try {
                const url = new URL(window.location.href);
                if (slug) {
                  url.searchParams.set('v', String(slug));
                } else {
                  url.searchParams.delete('v');
                }
                history.pushState(null, '', url.toString());
              } catch (_) {}
            }

            // Expose minimal API if client components want to signal open/close
            window.SSVideoUrl = {
              open: (slug) => setVParam(slug),
              close: () => setVParam(null),
            };

            // Delegate clicks on elements that advertise a video slug
            document.addEventListener('click', (ev) => {
              try {
                const t = ev.target;
                if (!t || !t.closest) return;
                const el = t.closest('[data-video-slug]');
                if (el) {
                  const slug = el.getAttribute('data-video-slug');
                  if (slug) setVParam(slug);
                }
              } catch (_) {}
            }, true);

            // Listen for custom events from other client components
            window.addEventListener('video:open', (e) => {
              try { setVParam(e.detail && e.detail.slug); } catch (_) {}
            });
            window.addEventListener('video:close', () => setVParam(null));

            // Copy link button
            const btn = document.getElementById('video-share-copy');
            if (btn) {
              btn.addEventListener('click', async () => {
                try {
                  const input = document.getElementById('video-share-url');
                  const text = input && input.value ? input.value : window.location.href;
                  try {
                    await navigator.clipboard.writeText(text);
                  } catch (_) {
                    if (input && input.select) { input.select(); document.execCommand && document.execCommand('copy'); }
                  }
                  const msg = document.getElementById('video-share-copied');
                  if (msg && msg.classList) {
                    msg.classList.remove('hidden');
                    setTimeout(() => msg.classList.add('hidden'), 1500);
                  }
                } catch (_) {}
              });
            }
          })();`,
        }}
      />
    </Section>
  );
}
