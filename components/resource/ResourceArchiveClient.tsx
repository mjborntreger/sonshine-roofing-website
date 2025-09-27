"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ListFilter, RotateCcw, Search } from "lucide-react";

import FilterTabs from "@/components/project/FilterTabs";
import GridLoadingState from "@/components/layout/GridLoadingState";
import type { FacetGroup, TermLite } from "@/lib/wp";
import type { PageResult, ResourceKind } from "@/lib/pagination";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}

type ResourceFacetGroup = FacetGroup;

type ResourceArchiveResult<Item> = PageResult<Item> & {
  total?: number;
  facets?: ResourceFacetGroup[];
};

export type FilterGroupConfig = {
  key: string;
  label: string;
  facet: string;
  paramKey: string;
  icon: React.ComponentType<{ className?: string }>;
  options: Array<{ slug: string; label: string }>;
};

type SelectionMap = Record<string, string[]>;

const areSelectionMapsEqual = (a: SelectionMap, b: SelectionMap): boolean => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const arrA = a[key] ?? [];
    const arrB = b[key] ?? [];
    if (arrA.length !== arrB.length) return false;
    for (let i = 0; i < arrA.length; i += 1) {
      if (arrA[i] !== arrB[i]) return false;
    }
  }
  return true;
};

type ResourceArchiveClientProps<Item> = {
  kind: ResourceKind;
  title: string;
  description?: string;
  apiPath: string;
  pageSize: number;
  initialResult: ResourceArchiveResult<Item>;
  initialFilters: {
    search?: string;
    selections: SelectionMap;
  };
  groups: FilterGroupConfig[];
  searchPlaceholder: string;
  labels: {
    itemSingular: string;
    itemPlural: string;
  };
  emptyState: {
    title: string;
    description: {
      default: string;
      withSearch?: string;
    };
    actionLabel?: string;
  };
  minSearchLength?: number;
  searchParamKey?: string;
  buildFiltersPayload?: (input: {
    search: string;
    selections: Record<string, string[]>;
  }) => Record<string, unknown>;
  buildQueryParams?: (input: {
    search: string;
    selections: SelectionMap;
  }) => Record<string, string>;
  renderResults: (args: {
    result: ResourceArchiveResult<Item>;
    listFilters: Record<string, unknown>;
    listKey: string;
    loading: boolean;
  }) => React.ReactNode;
  chipsLabel?: (groupKey: string, option: { slug: string; label: string }) => string;
  loadingOverlayMessage?: string;
  normalizeSelections?: (input: SelectionMap) => SelectionMap;
};

export default function ResourceArchiveClient<Item>({
  kind,
  title,
  description,
  apiPath,
  pageSize,
  initialResult,
  initialFilters,
  groups,
  searchPlaceholder,
  labels,
  emptyState,
  minSearchLength = 2,
  searchParamKey = "q",
  buildFiltersPayload,
  buildQueryParams,
  renderResults,
  chipsLabel,
  loadingOverlayMessage,
  normalizeSelections,
}: ResourceArchiveClientProps<Item>) {
  const router = useRouter();
  const pathname = usePathname();

  const [searchInput, setSearchInput] = useState(initialFilters.search ?? "");
  const [selections, setSelections] = useState<SelectionMap>(() => {
    const clone: SelectionMap = {};
    for (const group of groups) {
      const values = initialFilters.selections?.[group.key] ?? [];
      clone[group.key] = Array.isArray(values) ? [...values] : [];
    }
    const normalized = normalizeSelections ? normalizeSelections(clone) : clone;
    return normalized;
  });
  const [result, setResult] = useState<ResourceArchiveResult<Item>>(initialResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overallTotalRef = useRef<number | null>(
    typeof initialResult.meta?.overallTotal === "number"
      ? initialResult.meta.overallTotal
      : typeof initialResult.total === "number"
      ? initialResult.total
      : initialResult.items.length
  );

  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const normalizedSearch = debouncedSearch.trim();
  const searchForRequest = normalizedSearch.length >= minSearchLength ? normalizedSearch : "";

  useEffect(() => {
    if (!normalizeSelections) return;
    const normalized = normalizeSelections(selections);
    if (!areSelectionMapsEqual(normalized, selections)) {
      setSelections(normalized);
    }
  }, [normalizeSelections, selections]);

  const sortedSelections = useMemo(() => {
    const out: SelectionMap = {};
    for (const group of groups) {
      const values = selections[group.key] ?? [];
      out[group.key] = Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    }
    return out;
  }, [groups, selections]);

  const filtersPayload = useMemo(() => {
    if (buildFiltersPayload) {
      return buildFiltersPayload({ search: searchForRequest, selections: sortedSelections });
    }
    const payload: Record<string, unknown> = {};
    if (searchForRequest) payload.search = searchForRequest;
    for (const group of groups) {
      const values = sortedSelections[group.key];
      if (values?.length) {
        payload[group.key] = values;
      }
    }
    return payload;
  }, [buildFiltersPayload, groups, searchForRequest, sortedSelections]);

  const listFilters = useMemo(() => filtersPayload, [filtersPayload]);
  const listKey = useMemo(() => JSON.stringify(listFilters), [listFilters]);

  const facetMap = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    const facets = (result as any).facets as ResourceFacetGroup[] | undefined;
    if (Array.isArray(facets)) {
      for (const facet of facets) {
        const bucketMap = new Map<string, number>();
        for (const bucket of facet.buckets ?? []) {
          bucketMap.set(String(bucket.slug), typeof bucket.count === "number" ? bucket.count : 0);
        }
        map.set(String(facet.taxonomy), bucketMap);
      }
    }
    return map;
  }, [result]);

  const tabs = useMemo(() => {
    return groups.map((group) => {
      const facetCounts = facetMap.get(group.facet) ?? new Map();
      const optionMap = new Map(group.options.map((opt) => [opt.slug, opt.label]));
      const seen = new Set<string>();
      const terms: Array<TermLite & { count: number } & { slug: string }> = [];

      const pushTerm = (slug: string, label: string, count: number) => {
        if (seen.has(slug)) return;
        seen.add(slug);
        terms.push({ slug, name: label, count } as TermLite & { count: number } & { slug: string });
      };

      facetCounts.forEach((count, slug) => {
        const label = optionMap.get(slug) ?? optionMap.get(slug.toLowerCase()) ?? slug;
        pushTerm(slug, label, count);
      });

      for (const opt of group.options) {
        const existing = facetCounts.get(opt.slug) ?? facetCounts.get(opt.slug.toLowerCase()) ?? 0;
        pushTerm(opt.slug, opt.label, existing);
      }

      const selected = sortedSelections[group.key] ?? [];
      for (const slug of selected) {
        if (!seen.has(slug)) {
          const label = optionMap.get(slug) ?? slug;
          pushTerm(slug, label, facetCounts.get(slug) ?? 0);
        }
      }

      const totalCount = terms.reduce((sum, term) => sum + term.count, 0);

      return {
        key: group.key,
        label: group.label,
        icon: group.icon,
        terms,
        totalCount,
        selectedCount: selected.length,
      };
    });
  }, [facetMap, groups, sortedSelections]);

  const hasActiveFilters = useMemo(() => {
    if (searchForRequest) return true;
    return groups.some((group) => (sortedSelections[group.key] ?? []).length > 0);
  }, [groups, searchForRequest, sortedSelections]);

  const filteredCount = typeof result.total === "number" ? result.total : result.items.length;
  const overallTotal = typeof result.meta?.overallTotal === "number"
    ? result.meta.overallTotal
    : overallTotalRef.current ?? filteredCount;

  useEffect(() => {
    if (typeof result.meta?.overallTotal === "number") {
      overallTotalRef.current = result.meta.overallTotal;
    } else if (typeof result.total === "number") {
      overallTotalRef.current = result.total;
    }
  }, [result]);

  const lastQueryRef = useRef<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (normalizedSearch.length >= minSearchLength) {
      params.set(searchParamKey, normalizedSearch);
    }

    for (const group of groups) {
      const values = sortedSelections[group.key];
      if (values?.length) {
        params.set(group.paramKey, values.join(","));
      }
    }

    if (buildQueryParams) {
      const custom = buildQueryParams({ search: searchForRequest, selections: sortedSelections });
      for (const [key, value] of Object.entries(custom)) {
        if (value) params.set(key, value);
      }
    }

    const next = params.toString();
    if (lastQueryRef.current === next) return;
    lastQueryRef.current = next;
    const href = next ? `${pathname}?${next}` : pathname;
    router.replace(href as Parameters<typeof router.replace>[0], { scroll: false });
  }, [buildQueryParams, groups, minSearchLength, normalizedSearch, pathname, router, searchParamKey, searchForRequest, sortedSelections]);

  const abortRef = useRef<AbortController | null>(null);
  const firstRunRef = useRef(true);

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

    fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first: pageSize,
        after: null,
        filters: filtersPayload,
      }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setResult(json as ResourceArchiveResult<Item>);
      })
      .catch((err: any) => {
        if (err?.name === "AbortError") return;
        setError("Unable to load results for the selected filters. Please try again.");
        console.error("[ResourceArchive] fetch failed", err);
      })
      .finally(() => {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setLoading(false);
      });

    return () => controller.abort();
  }, [apiPath, filtersPayload, pageSize]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const toggleSelection = useCallback((groupKey: string, slug: string) => {
    setSelections((prev) => {
      const current = prev[groupKey] ?? [];
      const exists = current.includes(slug);
      const nextValues = exists ? current.filter((item) => item !== slug) : [...current, slug];
      return { ...prev, [groupKey]: nextValues };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setSelections(() => {
      const reset: SelectionMap = {};
      for (const group of groups) reset[group.key] = [];
      return reset;
    });
  }, [groups]);

  const chips = useMemo(() => {
    const out: Array<{ key: string; label: string; onRemove: () => void }> = [];
    if (normalizedSearch.length >= minSearchLength) {
      out.push({
        key: `search:${normalizedSearch}`,
        label: `Search: “${normalizedSearch}”`,
        onRemove: () => setSearchInput(""),
      });
    }

    const optionMaps = new Map<string, Map<string, string>>();
    for (const group of groups) {
      optionMaps.set(
        group.key,
        new Map(group.options.map((opt) => [opt.slug, opt.label]))
      );
    }

    for (const group of groups) {
      const selected = sortedSelections[group.key] ?? [];
      const map = optionMaps.get(group.key) ?? new Map();
      selected.forEach((slug) => {
        const label = chipsLabel?.(group.key, { slug, label: map.get(slug) ?? slug }) ?? map.get(slug) ?? slug;
        out.push({
          key: `${group.key}:${slug}`,
          label,
          onRemove: () => toggleSelection(group.key, slug),
        });
      });
    }

    return out;
  }, [chipsLabel, groups, minSearchLength, normalizedSearch, sortedSelections, toggleSelection]);

  const [activeTabKey, setActiveTabKey] = useState<string>(groups[0]?.key ?? "");
  useEffect(() => {
    if (!groups.length) return;
    if (!groups.some((group) => group.key === activeTabKey)) {
      setActiveTabKey(groups[0].key);
    }
  }, [activeTabKey, groups]);

  const filtersRef = useRef<HTMLDivElement | null>(null);
  const scrollToFilters = useCallback(() => {
    filtersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const loadingMessage = loadingOverlayMessage ?? `Loading ${labels.itemPlural.toLowerCase()}…`;

  return (
    <div>
      <h1 className="text-3xl md:text-5xl font-semibold text-center tracking-tight text-slate-900 mb-12">{title}</h1>
      {description ? (
        <p className="text-slate-600 max-w-3xl text-center mb-8 mx-auto">{description}</p>
      ) : null}

      <div
        ref={filtersRef}
        className="rounded-2xl border border-slate-300 bg-white/80 p-4 shadow-md backdrop-blur md:p-6"
        role="search"
      >
        <div className="flex flex-col gap-4">
          <div className="flex inline-flex w-full items-start">
            <label htmlFor={`${kind}-search`} className="sr-only">Search {labels.itemPlural}</label>
            <Search className="h-6 w-6 mr-4 translate-y-2 text-[--brand-blue]" />
            <input
              id={`${kind}-search`}
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-[15px] shadow-sm focus:ring-2 focus:ring-[--brand-cyan] focus:outline-none"
            />
          </div>

          {groups.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
              <h2 className="text-sm font-semibold text-slate-700"><ListFilter className="h-4 w-4 mr-2 inline" />Filters</h2>
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-100"
              >
                Reset filters
                <RotateCcw className="h-4 w-4 inline ml-2" />
              </button>
            </div>
          ) : null}

          {groups.length > 0 ? (
            <FilterTabs
              tabs={tabs}
              activeKey={activeTabKey as string}
              onTabChange={setActiveTabKey}
              isLoading={loading}
              ariaLabel="Project filters"
            >
              {(tabKey) => {
                const group = groups.find((g) => g.key === tabKey);
                const tab = tabs.find((t) => t.key === tabKey);
                if (!group || !tab) return null;

                return (
                  <div className="flex flex-wrap gap-2">
                    {tab.terms.map((term) => {
                      const active = (sortedSelections[group.key] ?? []).includes(term.slug);
                      const disabled = term.count === 0 && !active;
                      return (
                        <button
                          key={term.slug}
                          type="button"
                          onClick={() => toggleSelection(group.key, term.slug)}
                          disabled={disabled}
                          className={`px-3 py-1.5 rounded-full border text-sm transition select-none ${
                            active
                              ? "border-[--brand-blue] bg-[--brand-blue] text-white"
                              : disabled
                                ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "border-slate-200 bg-white text-slate-700 hover:border-[--brand-blue]"
                          }`}
                          aria-pressed={active}
                        >
                          {term.name} ({term.count})
                        </button>
                      );
                    })}
                  </div>
                );
              }}
            </FilterTabs>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-700">
          Showing {filteredCount} of {overallTotal} {filteredCount === 1 ? labels.itemSingular : labels.itemPlural}
        </span>
        {loading && (
          <span className="inline-flex items-center gap-2 rounded-full border border-[--brand-blue]/40 bg-[--brand-blue]/10 px-3 py-1 text-xs font-medium text-[--brand-blue]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[--brand-blue]" aria-hidden />
            Updating {labels.itemPlural.toLowerCase()}…
          </span>
        )}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      {chips.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
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
      ) : null}

      {filteredCount === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
          <p className="mb-2 font-medium">{emptyState.title}</p>
          <p className="text-sm">
            {normalizedSearch.length >= minSearchLength && emptyState.description.withSearch
              ? emptyState.description.withSearch
              : emptyState.description.default}
          </p>
          {hasActiveFilters && emptyState.actionLabel ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              {emptyState.actionLabel}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="relative">
          {loading && <GridLoadingState mode="overlay" message={loadingMessage} />}
          <div className={loading ? "pointer-events-none" : ""}>
            {renderResults({ result, listFilters, listKey, loading })}
          </div>
        </div>
      )}

      <div className="fixed left-1/2 bottom-20 z-40 flex -translate-x-1/2 md:hidden pointer-events-none">
        <button
          type="button"
          onClick={scrollToFilters}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-[--brand-blue] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[--brand-blue]/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
        >
          <span className="h-2 w-2 rounded-full bg-white" aria-hidden />
          Filters
        </button>
      </div>
    </div>
  );
}
