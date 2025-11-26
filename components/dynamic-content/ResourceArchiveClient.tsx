"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUp, Minus, Plus, RotateCcw, Search } from "lucide-react";

import FilterTabs from "@/components/dynamic-content/FilterTabs";
import GridLoadingState from "@/components/layout/GridLoadingState";
import type { FacetGroup, TermLite } from "@/lib/content/wp";
import type { PageResult, ResourceKind } from "@/lib/ui/pagination";

type ResourceFacetGroup = FacetGroup;

type ResourceArchiveResult<Item> = PageResult<Item> & {
  total?: number;
  facets?: ResourceFacetGroup[];
};

type FacetBucketInfo = {
  count: number;
  label?: string;
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
  apiPath: string;
  pageSize: number;
  initialResult: ResourceArchiveResult<Item>;
  initialFilters: {
    search?: string;
    selections: SelectionMap;
  };
  groups: FilterGroupConfig[];
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
  apiPath,
  pageSize,
  initialResult,
  initialFilters,
  groups,
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
  const searchParams = useSearchParams();
  const paramsSignature = searchParams?.toString() ?? "";

  const [searchInput, setSearchInput] = useState(initialFilters.search ?? "");
  const [committedSearch, setCommittedSearch] = useState(initialFilters.search ?? "");
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

  const fullTotalRef = useRef<number | null>(
    typeof initialResult.meta?.fullTotal === "number"
      ? initialResult.meta.fullTotal
      : typeof initialResult.meta?.overallTotal === "number"
        ? initialResult.meta.overallTotal
        : typeof initialResult.total === "number"
          ? initialResult.total
          : initialResult.items.length
  );

  const normalizedCommittedSearch = committedSearch.trim();
  const searchForRequest = normalizedCommittedSearch.length >= minSearchLength ? normalizedCommittedSearch : "";

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
  const [pendingSignature, setPendingSignature] = useState<string | null>(null);
  const [appliedSignature, setAppliedSignature] = useState<string | null>(listKey);
  const loadingStartedAtRef = useRef<number>(0);

  const facetMap = useMemo(() => {
    const map = new Map<string, Map<string, FacetBucketInfo>>();
    const facets = result.facets;
    if (Array.isArray(facets)) {
      for (const facet of facets) {
        const bucketMap = new Map<string, FacetBucketInfo>();
        for (const bucket of facet.buckets ?? []) {
          const slug = String(bucket.slug);
          if (!slug) continue;
          const bucketLabel =
            typeof bucket.name === "string" && bucket.name.trim().length ? bucket.name : undefined;
          bucketMap.set(slug, {
            count: typeof bucket.count === "number" ? bucket.count : 0,
            label: bucketLabel,
          });
        }
        map.set(String(facet.taxonomy), bucketMap);
      }
    }
    return map;
  }, [result]);

  const tabs = useMemo(() => {
    return groups.map((group) => {
      const facetCounts = facetMap.get(group.facet) ?? new Map<string, FacetBucketInfo>();
      const optionMap = new Map(group.options.map((opt) => [opt.slug, opt.label]));
      const seen = new Set<string>();
      const terms: Array<TermLite & { count: number } & { slug: string }> = [];

      const pushTerm = (slug: string, label: string, count: number) => {
        if (seen.has(slug)) return;
        seen.add(slug);
        terms.push({ slug, name: label, count } as TermLite & { count: number } & { slug: string });
      };

      facetCounts.forEach((info, slug) => {
        const optionLabel = optionMap.get(slug) ?? optionMap.get(slug.toLowerCase());
        const label = optionLabel ?? info.label ?? slug;
        pushTerm(slug, label, info.count);
      });

      for (const opt of group.options) {
        const bucketInfo = facetCounts.get(opt.slug) ?? facetCounts.get(opt.slug.toLowerCase());
        const existing = bucketInfo?.count ?? 0;
        pushTerm(opt.slug, opt.label, existing);
      }

      const selected = sortedSelections[group.key] ?? [];
      for (const slug of selected) {
        if (!seen.has(slug)) {
          const bucketInfo = facetCounts.get(slug) ?? facetCounts.get(slug.toLowerCase());
          const label = optionMap.get(slug) ?? bucketInfo?.label ?? slug;
          pushTerm(slug, label, bucketInfo?.count ?? 0);
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

  const hasActiveSelections = useMemo(
    () => groups.some((group) => (sortedSelections[group.key] ?? []).length > 0),
    [groups, sortedSelections]
  );

  const hasActiveFilters = searchForRequest ? true : hasActiveSelections;

  const filteredCount = typeof result.meta?.overallTotal === "number"
    ? result.meta.overallTotal
    : typeof result.total === "number"
      ? result.total
      : result.items.length;
  const rawFullTotal =
    typeof result.meta?.fullTotal === "number"
      ? result.meta.fullTotal
      : typeof result.meta?.overallTotal === "number"
        ? result.meta.overallTotal
        : null;
  const fullTotal = rawFullTotal ?? fullTotalRef.current ?? filteredCount;
  const displayTotal = Math.max(filteredCount, fullTotal ?? filteredCount);
  const overlayActive = loading || (pendingSignature && pendingSignature !== appliedSignature);

  useEffect(() => {
    const next = typeof result.meta?.fullTotal === "number"
      ? result.meta.fullTotal
      : typeof result.meta?.overallTotal === "number"
        ? result.meta.overallTotal
        : null;
    if (typeof next === "number") {
      fullTotalRef.current = Math.max(fullTotalRef.current ?? 0, next);
    } else if (typeof result.total === "number") {
      fullTotalRef.current = Math.max(fullTotalRef.current ?? 0, result.total);
    }
  }, [result]);

  const lastQueryRef = useRef<string | null>(null);

  useEffect(() => {
    const params = paramsSignature ? new URLSearchParams(paramsSignature) : new URLSearchParams();
    const urlSearchValue = params.get(searchParamKey) ?? "";

    const nextSelections: SelectionMap = {};
    for (const group of groups) {
      const raw = params.get(group.paramKey);
      if (raw) {
        const parsed = raw
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        nextSelections[group.key] = parsed;
      } else {
        nextSelections[group.key] = [];
      }
    }

    const normalizedSelections = normalizeSelections ? normalizeSelections(nextSelections) : nextSelections;

    setSearchInput((prev) => (prev === urlSearchValue ? prev : urlSearchValue));
    setCommittedSearch((prev) => (prev === urlSearchValue ? prev : urlSearchValue));
    setSelections((prev) => (areSelectionMapsEqual(prev, normalizedSelections) ? prev : normalizedSelections));
  }, [groups, normalizeSelections, paramsSignature, searchParamKey]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (normalizedCommittedSearch.length >= minSearchLength) {
      params.set(searchParamKey, normalizedCommittedSearch);
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
  }, [buildQueryParams, groups, minSearchLength, normalizedCommittedSearch, pathname, router, searchParamKey, searchForRequest, sortedSelections]);

  const abortRef = useRef<AbortController | null>(null);
  const firstRunRef = useRef(true);

  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }

    loadingStartedAtRef.current = Date.now();
    setPendingSignature(listKey);
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
        setAppliedSignature(listKey);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Unable to load results for the selected filters. Please try again.");
        console.error("[ResourceArchive] fetch failed", err);
      })
      .finally(() => {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        const MIN_SHOW_MS = 600;
        const elapsed = Date.now() - loadingStartedAtRef.current;
        const delay = Math.max(0, MIN_SHOW_MS - elapsed);
        requestAnimationFrame(() => {
          setTimeout(() => {
            setLoading(false);
            setPendingSignature(null);
          }, delay);
        });
      });

    return () => controller.abort();
  }, [apiPath, filtersPayload, listKey, pageSize]);

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
    setCommittedSearch("");
    setSelections(() => {
      const reset: SelectionMap = {};
      for (const group of groups) reset[group.key] = [];
      return reset;
    });
  }, [groups]);

  const submitThrottleRef = useRef<number>(0);
  const handleSearchSubmit = useCallback(() => {
    const now = Date.now();
    if (now - submitThrottleRef.current < 150) return;
    submitThrottleRef.current = now;
    setCommittedSearch(searchInput);
  }, [searchInput]);

  const chips = useMemo(() => {
    const out: Array<{ key: string; label: string; onRemove: () => void }> = [];
    if (normalizedCommittedSearch.length >= minSearchLength) {
      out.push({
        key: `search:${normalizedCommittedSearch}`,
        label: `Search: “${normalizedCommittedSearch}”`,
        onRemove: () => {
          setSearchInput("");
          setCommittedSearch("");
        },
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
  }, [chipsLabel, groups, minSearchLength, normalizedCommittedSearch, sortedSelections, toggleSelection]);

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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersAccordionRef = useRef<HTMLDetailsElement | null>(null);
  const filtersPanelId = `${kind}-filters-panel`;

  const handleFiltersKeyDown = useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (filtersAccordionRef.current) {
        filtersAccordionRef.current.open = !filtersAccordionRef.current.open;
        setFiltersOpen(filtersAccordionRef.current.open);
      }
    }
  }, []);

  return (
    <div>
      <div
        ref={filtersRef}
        className="rounded-3xl border border-blue-300 bg-white p-4 shadow-md md:p-6"
        role="search"
      >
        <div className="flex flex-col gap-4">
          <div>
            <Search className="h-5 inline w-5 align-text-top mr-2 text-[--brand-blue]" />
            <h2 className="text-2xl inline">{`Search ${labels.itemPlural}`}</h2>
          </div>
            <form
              className="w-full"
              onSubmit={(event) => {
                event.preventDefault();
                handleSearchSubmit();
              }}
            >
              <div className="flex flex-row gap-2 sm:flex-row sm:items-center">
                <label htmlFor={`${kind}-search`} className="sr-only">Search {labels.itemPlural}</label>
                <input
                  id={`${kind}-search`}
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Type here..."
                  className="w-full rounded-lg border border-blue-300 bg-white px-4 py-2 shadow-sm focus:ring-2 focus:ring-[--brand-cyan] focus:outline-none"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSearchSubmit();
                    }
                  }}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="inline-flex items-center gap-2 rounded-lg bg-[--brand-blue] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[--brand-blue]/90 focus:outline-none focus:ring-2 focus:ring-[--brand-cyan] focus:ring-offset-2"
                  >
                    Search
                  </button>
                </div>
              </div>
            </form>

          {groups.length > 0 ? (
            <div className="border-t border-blue-200 pt-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <details
                  ref={filtersAccordionRef}
                  className="group/filter-accordion flex-1 min-w-0 [&_summary::-webkit-details-marker]:hidden"
                  onToggle={(event) => setFiltersOpen(event.currentTarget.open)}
                >
                  <summary
                    className="flex w-full cursor-pointer select-none items-center justify-between rounded-xl border border-blue-200 bg-cyan-50 px-3 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[--brand-blue] focus-visible:ring-offset-2"
                    aria-controls={filtersPanelId}
                    aria-expanded={filtersOpen}
                    onKeyDown={handleFiltersKeyDown}
                  >
                    <span className="flex flex-col">
                      <span className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        Filters
                        {hasActiveSelections ? (
                          <span
                            aria-hidden
                            className="inline-flex h-2 w-2 items-center justify-center rounded-full bg-[--brand-blue] shadow ring-[3px] ring-white"
                          />
                        ) : null}
                        <span className="sr-only">
                          {hasActiveSelections ? "Filters selected" : "No filters selected"}
                        </span>
                      </span>
                      <span className="text-xs md:text-sm text-slate-500">Choose filters to sort results</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          clearFilters();
                        }}
                        disabled={!hasActiveFilters}
                        className="inline-flex items-center gap-1 rounded-full border border-blue-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-100"
                      >
                        Reset
                        <RotateCcw className="h-4 w-4" aria-hidden />
                      </button>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-white text-[--brand-blue]">
                        <Plus className="h-4 w-4 transition-opacity duration-150 ease-out group-open/filter-accordion:hidden" aria-hidden />
                        <Minus className="hidden h-4 w-4 transition-opacity duration-150 ease-out group-open/filter-accordion:block" aria-hidden />
                      </span>
                    </span>
                  </summary>
                  <div id={filtersPanelId} className="accordion-motion">
                    <div className="mt-3">
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
                            <div>
                              <p className="text-xs md:text-sm my-2 mx-2 text-slate-500">Tap to select / deselect</p>
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
                                      className={`px-3 py-1.5 rounded-full border text-sm transition select-none ${active
                                        ? "border-[--brand-blue] bg-[--brand-blue] text-white"
                                        : disabled
                                          ? "border-blue-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                                          : "border-blue-200 bg-cyan-50 text-slate-700 hover:border-[--brand-blue]"
                                        }`}
                                      aria-pressed={active}
                                    >
                                      {term.name} ({term.count})
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }}
                      </FilterTabs>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-700">
          Showing {filteredCount} of {displayTotal} {filteredCount === 1 ? labels.itemSingular : labels.itemPlural}
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
        <div className="mt-8 rounded-xl border border-amber-400 bg-white p-6 text-slate-700">
          <p className="mb-2 font-medium">{emptyState.title}</p>
          <p className="text-sm">
            {normalizedCommittedSearch.length >= minSearchLength && emptyState.description.withSearch
                  ? emptyState.description.withSearch
                  : emptyState.description.default}
              </p>
              {hasActiveFilters && emptyState.actionLabel ? (
                <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-md border border-amber-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              {emptyState.actionLabel}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="relative">
          {overlayActive && <GridLoadingState mode="overlay" message={loadingMessage} />}
          <div className={overlayActive ? "pointer-events-none opacity-60 transition" : ""}>
            {renderResults({ result, listFilters, listKey, loading })}
          </div>
        </div>
      )}

      <div className="fixed left-1/2 bottom-20 z-40 flex -translate-x-1/2 md:hidden pointer-events-none">
        <button
          type="button"
          onClick={scrollToFilters}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-[--brand-blue] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[--brand-blue]/30 focus:outline-none focus:ring-2 focus:ring-[--brand-cyan] focus:ring-offset-2"
        >
          To Filters
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
