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
import SkeletonGrid from "@/components/layout/SkeletonGrid";
import ResourcesAside from "@/components/ResourcesAside";
import ResourceSearchController from "@/components/resource-search/ResourceSearchController";

import type { PageResult } from "@/lib/pagination";

export const revalidate = 900;


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
      <div className="container-edge py-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">
          <span id="page-top" className="sr-only" />

          <div>
            <h1 className="text-3xl font-semibold">Video Library</h1>
            <p className="mt-2 text-slate-600">
              Highlights from our projects, commercials, and accolades.
            </p>

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
              <SkeletonGrid variant="video" count={6} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-2" />
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

            <div className="mt-6">
              <a href="#page-top" className="text-sm text-slate-600 prose">Back to top ↑</a>
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
    </Section>
  );
}
