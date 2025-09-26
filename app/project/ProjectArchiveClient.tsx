"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import InfiniteList from "@/components/InfiniteList";
import GridLoadingState from "@/components/layout/GridLoadingState";
import FilterTabs from "@/components/project/FilterTabs";
import type { FacetGroup, ProjectSearchResult, TermLite } from "@/lib/wp";

const MIN_SEARCH_LENGTH = 2;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}

type FiltersState = {
  search: string;
  materialTypeSlugs: string[];
  roofColorSlugs: string[];
  serviceAreaSlugs: string[];
};

type FilterTerms = {
  materials: TermLite[];
  roofColors: TermLite[];
  serviceAreas: TermLite[];
};

type Props = {
  initialResult: ProjectSearchResult;
  filterTerms: FilterTerms;
  pageSize: number;
  initialFilters: FiltersState;
};

type FacetMap = Map<string, Map<string, number>>;

const FACET_TAXONOMIES = {
  material: "material_type",
  roof: "roof_color",
  area: "service_area",
} as const;

type FacetKey = keyof typeof FACET_TAXONOMIES;

type SelectionState = {
  material: string[];
  roof: string[];
  area: string[];
};

type TabKey = FacetKey;

function buildFacetMap(facets: FacetGroup[]): FacetMap {
  const map: FacetMap = new Map();
  for (const group of facets) {
    const bucketMap = new Map<string, number>();
    for (const bucket of group.buckets) {
      bucketMap.set(bucket.slug, typeof bucket.count === "number" ? bucket.count : 0);
    }
    map.set(group.taxonomy, bucketMap);
  }
  return map;
}

function toSortedUnique(list: string[]): string[] {
  return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
}

function buildQueryString(filters: FiltersState): string {
  const params = new URLSearchParams();
  if (filters.search.trim().length >= MIN_SEARCH_LENGTH) {
    params.set("q", filters.search.trim());
  }
  if (filters.materialTypeSlugs.length) params.set("mt", filters.materialTypeSlugs.join(","));
  if (filters.roofColorSlugs.length) params.set("rc", filters.roofColorSlugs.join(","));
  if (filters.serviceAreaSlugs.length) params.set("sa", filters.serviceAreaSlugs.join(","));
  return params.toString();
}

const taxonomyLabel: Record<FacetKey, string> = {
  material: "Material",
  roof: "Roof Color",
  area: "Service Area",
};

export default function ProjectArchiveClient({
  initialResult,
  filterTerms,
  pageSize,
  initialFilters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [searchInput, setSearchInput] = useState(initialFilters.search ?? "");
  const [selection, setSelection] = useState<SelectionState>({
    material: [...(initialFilters.materialTypeSlugs ?? [])],
    roof: [...(initialFilters.roofColorSlugs ?? [])],
    area: [...(initialFilters.serviceAreaSlugs ?? [])],
  });
  const [result, setResult] = useState<ProjectSearchResult>(initialResult);
  const [facets, setFacets] = useState<FacetGroup[]>(initialResult.facets ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialOverallTotal = useMemo(() => {
    if (typeof initialResult.meta?.overallTotal === "number") return initialResult.meta.overallTotal;
    if (typeof initialResult.total === "number") return initialResult.total;
    return initialResult.items.length;
  }, [initialResult]);
  const overallTotalRef = useRef<number>(initialOverallTotal);
  const [filteredCount, setFilteredCount] = useState<number>(
    typeof initialResult.total === "number" ? initialResult.total : initialResult.items.length
  );

  const abortRef = useRef<AbortController | null>(null);
  const firstRunRef = useRef(true);
  const lastQueryRef = useRef(buildQueryString(initialFilters));

  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const normalizedSearch = useMemo(() => debouncedSearch.trim(), [debouncedSearch]);
  const searchForRequest = normalizedSearch.length >= MIN_SEARCH_LENGTH ? normalizedSearch : "";

  const filtersForRequest: FiltersState = useMemo(() => ({
    search: searchForRequest,
    materialTypeSlugs: toSortedUnique(selection.material),
    roofColorSlugs: toSortedUnique(selection.roof),
    serviceAreaSlugs: toSortedUnique(selection.area),
  }), [searchForRequest, selection.material, selection.roof, selection.area]);

  const listFilters = useMemo(
    () => ({
      search: filtersForRequest.search || undefined,
      materialTypeSlugs: filtersForRequest.materialTypeSlugs,
      roofColorSlugs: filtersForRequest.roofColorSlugs,
      serviceAreaSlugs: filtersForRequest.serviceAreaSlugs,
    }),
    [filtersForRequest]
  );

  useEffect(() => {
    const nextQuery = buildQueryString({
      search: searchInput,
      materialTypeSlugs: toSortedUnique(selection.material),
      roofColorSlugs: toSortedUnique(selection.roof),
      serviceAreaSlugs: toSortedUnique(selection.area),
    });
    if (nextQuery === lastQueryRef.current) return;
    lastQueryRef.current = nextQuery;
    const href = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(href as Parameters<typeof router.replace>[0], { scroll: false });
  }, [pathname, router, searchInput, selection.material, selection.roof, selection.area]);

  const facetMap = useMemo(() => buildFacetMap(facets), [facets]);

  useEffect(() => {
    setFilteredCount(typeof result.total === "number" ? result.total : result.items.length);
    if (typeof result.meta?.overallTotal === "number") {
      overallTotalRef.current = result.meta.overallTotal;
    }
  }, [result]);

  const hasActiveFilters = Boolean(searchForRequest) ||
    selection.material.length > 0 ||
    selection.roof.length > 0 ||
    selection.area.length > 0;

  const toggleSelection = useCallback((key: FacetKey, slug: string) => {
    setSelection((prev) => {
      const current = prev[key];
      const exists = current.includes(slug);
      const nextValues = exists ? current.filter((s) => s !== slug) : [...current, slug];
      return { ...prev, [key]: nextValues };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setSelection({ material: [], roof: [], area: [] });
  }, []);

  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const payload = {
      first: pageSize,
      after: null,
      filters: {
        search: filtersForRequest.search || undefined,
        materialTypeSlugs: filtersForRequest.materialTypeSlugs,
        roofColorSlugs: filtersForRequest.roofColorSlugs,
        serviceAreaSlugs: filtersForRequest.serviceAreaSlugs,
      },
    };

    fetch("/api/resources/project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setResult(json as ProjectSearchResult);
        setFacets(Array.isArray(json?.facets) ? json.facets : []);
      })
      .catch((err: any) => {
        if (err?.name === "AbortError") return;
        console.error("[ProjectArchive] fetch failed", err);
        setError("Unable to load projects for the selected filters. Please try again.");
      })
      .finally(() => {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setLoading(false);
      });

    return () => controller.abort();
  }, [filtersForRequest, pageSize]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const termLabelMaps = useMemo(() => ({
    material: new Map(filterTerms.materials.map((t) => [t.slug, t.name])),
    roof: new Map(filterTerms.roofColors.map((t) => [t.slug, t.name])),
    area: new Map(filterTerms.serviceAreas.map((t) => [t.slug, t.name])),
  }), [filterTerms.materials, filterTerms.roofColors, filterTerms.serviceAreas]);

  const chips = useMemo(() => {
    const out: Array<{ key: string; label: string; onRemove: () => void }> = [];
    if (searchInput.trim().length >= MIN_SEARCH_LENGTH) {
      out.push({
        key: `search:${searchInput}`,
        label: `Search: “${searchInput.trim()}”`,
        onRemove: () => setSearchInput(""),
      });
    }

    (selection.material ?? []).forEach((slug) => {
      const label = termLabelMaps.material.get(slug) || slug;
      out.push({
        key: `material:${slug}`,
        label,
        onRemove: () => toggleSelection("material", slug),
      });
    });
    (selection.roof ?? []).forEach((slug) => {
      const label = termLabelMaps.roof.get(slug) || slug;
      out.push({
        key: `roof:${slug}`,
        label,
        onRemove: () => toggleSelection("roof", slug),
      });
    });
    (selection.area ?? []).forEach((slug) => {
      const label = termLabelMaps.area.get(slug) || slug;
      out.push({
        key: `area:${slug}`,
        label,
        onRemove: () => toggleSelection("area", slug),
      });
    });

    return out;
  }, [searchInput, selection.material, selection.roof, selection.area, termLabelMaps, toggleSelection]);

  const listKey = useMemo(() => JSON.stringify(listFilters), [listFilters]);
  const tabDefs = useMemo(
    () => [
      { key: "material" as const, label: "Material", terms: filterTerms.materials },
      { key: "roof" as const, label: "Roof Color", terms: filterTerms.roofColors },
      { key: "area" as const, label: "Service Area", terms: filterTerms.serviceAreas },
    ],
    [filterTerms.materials, filterTerms.roofColors, filterTerms.serviceAreas]
  );
  const [activeTab, setActiveTab] = useState<TabKey>("material");

  const isPillDisabled = useCallback(
    (group: FacetKey, slug: string) => {
      const taxonomy = FACET_TAXONOMIES[group];
      const buckets = facetMap.get(taxonomy);
      const count = buckets?.get(slug) ?? 0;
      const isSelected = selection[group].includes(slug);
      if (isSelected) return false;
      const anySelections =
        selection.material.length > 0 ||
        selection.roof.length > 0 ||
        selection.area.length > 0 ||
        Boolean(searchForRequest);
      if (!anySelections) return false;
      return count === 0;
    },
    [facetMap, searchForRequest, selection.area.length, selection.material.length, selection.roof.length]
  );

  return (
    <div>
      <h1 className="text-3xl font-semibold">Project Gallery</h1>
      <p className="mt-2 text-slate-600 max-w-3xl">
        Explore our latest installs across Sarasota, Manatee, and Charlotte counties. Filter by material, roof color,
        and service area — or search by phrase to find a specific project.
      </p>

      <div className="mt-6 rounded-xl border border-slate-400 bg-[#cef3ff]/30 p-4" role="search">
        <label htmlFor="project-search" className="sr-only">Search projects</label>
        <input
          id="project-search"
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search projects..."
          aria-label="Search projects"
          className="w-full rounded-lg border border-slate-400 bg-white px-4 py-2 text-[15px] shadow-sm focus:ring-2 focus:ring-[--brand-cyan] focus:outline-none"
        />

        <div className="mt-4 group rounded-lg border border-slate-400 bg-white/70">
          <div className="flex items-center justify-between cursor-pointer select-none px-4 py-2 text-sm font-semibold text-slate-800 transition group-open:translate-y-[1px]">
            <h2 className="text-slate-700 font-semibold text-sm">Search Filters</h2>
          </div>

          <div className="px-4 pb-4 pt-2">
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Reset filters
            </button>

            <FilterTabs
              tabs={tabDefs}
              activeKey={activeTab}
              onTabChange={setActiveTab}
              isLoading={loading}
            >
              {(tabKey) => (
                <div className="flex flex-wrap gap-2">
                  {tabDefs
                    .find((tab) => tab.key === tabKey)
                    ?.terms.map((term) => {
                      const active = selection[tabKey].includes(term.slug);
                      const disabled = isPillDisabled(tabKey, term.slug);
                      return (
                        <button
                          key={term.slug}
                          type="button"
                          onClick={() => toggleSelection(tabKey, term.slug)}
                          disabled={disabled && !active}
                          className={`px-3 py-1.5 rounded-full border text-sm transition select-none ${
                            active
                              ? "border-[--brand-blue] bg-[--brand-blue] text-white"
                              : disabled
                              ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "border-slate-300 bg-white text-slate-700 hover:border-[--brand-blue]"
                          }`}
                        >
                          {term.name}
                        </button>
                      );
                    })}
                </div>
              )}
            </FilterTabs>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.onRemove}
                className="inline-flex items-center gap-1 rounded-full border border-[--brand-orange] bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
              >
                <span>{chip.label}</span>
                <span aria-hidden="true" className="text-slate-400">×</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-700">
          Showing {filteredCount} of {overallTotalRef.current} project{overallTotalRef.current === 1 ? "" : "s"}
        </span>
        {loading && (
          <span className="inline-flex items-center gap-2 rounded-full border border-[--brand-blue]/40 bg-[--brand-blue]/10 px-3 py-1 text-xs font-medium text-[--brand-blue]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[--brand-blue]" aria-hidden />
            Updating projects…
          </span>
        )}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      {filteredCount === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
          <p className="mb-2 font-medium">No results found.</p>
          <p className="text-sm">
            {searchForRequest
              ? `Try clearing filters or searching for a different phrase.`
              : `Try clearing or adjusting your filters to see more projects.`}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          {loading && <GridLoadingState mode="overlay" message="Loading projects…" />}
          <div className={loading ? "pointer-events-none" : ""}>
            <InfiniteList
              key={listKey}
              kind="project"
              initial={result}
              filters={listFilters}
              pageSize={pageSize}
              gridClass="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4"
            />
          </div>
        </div>
      )}
    </div>
  );
}
