// /app/project/page.tsx
import Section from "@/components/layout/Section";
import ResourceSearchController from "@/components/resource-search/ResourceSearchController";
import { listProjectsPaged, listProjectFilterTerms } from "@/lib/wp";
import ResourcesAside from "@/components/ResourcesAside";
import InfiniteList from "@/components/InfiniteList";

export const revalidate = 900; // 15 minutes ISR

type PageProps = { searchParams?: Promise<{ q?: string }> };

export default async function ProjectArchivePage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? ({} as { q?: string });
  const qRaw = sp.q ?? "";
  const q = qRaw.trim();


  // Prepare pills (no counts)
  const { materials, roofColors: colors, serviceAreas: areas } = await listProjectFilterTerms();

  const initialPage = await listProjectsPaged({
    first: 6,
    after: null,
  });

  return (
    <Section>
      <div className="container-edge py-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">
          <span id="page-top" className="sr-only" />

          {/* Header */}
          <div>
            <h1 className="text-3xl font-semibold">Project Gallery</h1>
            <p className="mt-2 text-slate-600">
              Explore our latest installs across Sarasota, Manatee, and Charlotte
              counties. Filter by material, color, and service area—or search by
              phrase to find a specific project.
            </p>

            {/* Search */}
            <div className="mt-6 rounded-xl border border-slate-400 bg-[#cef3ff]/30 p-4" role="search">
              <input
                id="project-search"
                type="search"
                defaultValue={q}
                placeholder="Search projects..."
                aria-label="Search projects"
                aria-controls="project-grid"
                className="w-full rounded-lg border border-slate-400 bg-white px-4 py-2 text-[15px] shadow-sm focus:ring-2 focus:ring-[--brand-cyan] focus:outline-none"
              />

              {/* Filters accordion */}
              <details
                id="project-filters"
                className="mt-4 group rounded-lg border border-slate-400 bg-white/70"
              >
                <summary className="flex items-center justify-between cursor-pointer select-none px-4 py-2 text-sm font-semibold text-slate-800 hover:translate-y-[1px] transition">
                  <span>Search Filters</span>
                  <svg
                    className="h-4 w-4 transition-transform group-open:rotate-180"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 8l5 5 5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </summary>
                <div className="px-4 pb-4 pt-2">
                  {/* Clear filters */}
                  <button
                    id="project-clear"
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                    aria-label="Clear filters"
                  >
                    Reset filters
                  </button>

                  {/* Material Type */}
                  <div className="mt-4">
                    <div className="text-xs font-semibold text-slate-600">Material</div>
                    <div id="project-pills-mt" className="mt-2 flex flex-wrap gap-2">
                      {materials.map((t) => (
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

                  {/* Roof Color */}
                  <div className="mt-4">
                    <div className="text-xs font-semibold text-slate-600">Roof Color</div>
                    <div id="project-pills-rc" className="mt-2 flex flex-wrap gap-2">
                      {colors.map((t) => (
                        <button
                          key={`rc-${t.slug}`}
                          type="button"
                          data-group="rc"
                          data-slug={t.slug}
                          aria-pressed="false"
                          className="px-3 py-1.5 rounded-full border text-sm transition select-none border-slate-300 text-slate-700 hover:border-[--brand-blue] bg-white"
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Service Area */}
                  <div className="mt-4">
                    <div className="text-xs font-semibold text-slate-600">Service Area</div>
                    <div id="project-pills-sa" className="mt-2 flex flex-wrap gap-2">
                      {areas.map((t) => (
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
                </div>
              </details>

              {/* Active chips (outside accordion, like blog) */}
              <div id="project-chips" className="mt-4 hidden flex flex-wrap gap-2">
                {/* chips rendered by script */}
              </div>
            </div>

            {/* No results */}
            <div
              id="project-no-results"
              role="status"
              aria-live="polite"
              className="mt-6 hidden rounded-md border border-slate-200 bg-white p-4"
            >
              <p className="text-sm text-slate-700">
                No results for <span id="project-query" className="font-semibold"></span>.
              </p>
            </div>

            {/* Grid */}
            <div id="project-grid">
              <InfiniteList
                kind="project"
                initial={initialPage}
                filters={{}}
                pageSize={6}
                gridClass="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4"
              />
            </div>

            <div className="mt-6">
              <a href="#page-top" className="text-sm text-slate-600 prose">Back to top ↑</a>
            </div>
          </div>

          {/* Floating Content (Right) */}
          <ResourcesAside />
        </div>

        <ResourceSearchController
          kind="project"
          ids={{
            query: "#project-search",
            grid: "#project-grid",
            chips: "#project-chips",
            skeleton: "project-skeleton",
            noResults: "#project-no-results",
          }}
          urlKeys={{ q: "q", mt: "mt", rc: "rc", sa: "sa" }}
          minQueryLen={2}
        />
      </div>
    </Section>
  );
}