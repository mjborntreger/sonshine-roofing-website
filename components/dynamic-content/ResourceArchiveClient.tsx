'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowUp, Search } from 'lucide-react';
import type { FacetGroup } from '@/lib/content/project-types';
import type { PageResult, ResourceKind } from '@/lib/ui/pagination';
import {
  archiveLocationKey,
  archivePayloadInput,
  isArchiveFilterEnabled,
  normalizeArchiveFilters,
  readArchiveFilters,
  writeArchiveFilters,
  type ArchiveFilterGroup,
  type ArchiveFilters,
} from '@/lib/ui/archive-filters';

export type FilterGroupConfig = ArchiveFilterGroup;
type ResourceArchiveResult<Item> = PageResult<Item> & { facets?: FacetGroup[] };

type Props<Item> = {
  kind: ResourceKind;
  apiPath: string;
  pageSize: number;
  initialResult: ResourceArchiveResult<Item>;
  initialFilters: { search?: string; selections: Record<string, string[]> };
  groups: FilterGroupConfig[];
  labels: { itemSingular: string; itemPlural: string };
  minSearchLength?: number;
  searchParamKey?: string;
  buildFiltersPayload: (input: ReturnType<typeof archivePayloadInput>) => Record<string, unknown>;
  renderResults: (args: {
    result: ResourceArchiveResult<Item>;
    listFilters: Record<string, unknown>;
    listKey: string;
    loading: boolean;
  }) => React.ReactNode;
};

const controlClass =
  'min-h-12 w-full min-w-0 rounded-lg border border-blue-300 bg-white px-3 py-2 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-[--brand-cyan] disabled:bg-slate-100 disabled:text-slate-500';

export default function ResourceArchiveClient<Item>({
  kind,
  apiPath,
  pageSize,
  initialResult,
  initialFilters,
  groups,
  labels,
  minSearchLength = 2,
  searchParamKey = 'q',
  buildFiltersPayload,
  renderResults,
}: Props<Item>) {
  const searchParams = useSearchParams();
  const paramsString = searchParams?.toString() ?? '';
  const [draft, setDraft] = useState(() =>
    normalizeArchiveFilters(
      {
        search: initialFilters.search ?? '',
        selections: Object.fromEntries(
          groups.map((group) => [group.key, initialFilters.selections[group.key]?.[0] ?? '']),
        ),
      },
      groups,
      minSearchLength,
    ),
  );
  const [requested, setRequested] = useState(draft);
  const [applied, setApplied] = useState(() => ({
    filters: draft,
    result: initialResult,
    payload: buildFiltersPayload(archivePayloadInput(draft)),
  }));
  const [requestVersion, setRequestVersion] = useState(0);
  const [forceRequest, setForceRequest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [legacyNotice, setLegacyNotice] = useState(false);
  const appliedKeyRef = useRef(JSON.stringify(draft));
  const lastLocationRef = useRef<string | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const publishUrl = useCallback(
    (filters: ArchiveFilters, replace = false) => {
      const url = new URL(window.location.href);
      url.search = writeArchiveFilters(
        url.searchParams,
        filters,
        groups,
        searchParamKey,
      ).toString();
      lastLocationRef.current = archiveLocationKey(url.searchParams, groups, searchParamKey);
      if (url.href !== window.location.href) {
        // Next's native history integration updates useSearchParams without a route fetch.
        window.history[replace ? 'replaceState' : 'pushState'](
          null,
          '',
          `${url.pathname}${url.search}${url.hash}`,
        );
      }
    },
    [groups, searchParamKey],
  );

  useEffect(() => {
    const params = new URLSearchParams(paramsString);
    const locationKey = archiveLocationKey(params, groups, searchParamKey);
    if (lastLocationRef.current === locationKey) return;
    lastLocationRef.current = locationKey;
    const restored = readArchiveFilters(params, groups, minSearchLength, searchParamKey);
    setDraft(restored.filters);
    setRequested(restored.filters);
    setForceRequest(false);
    setLegacyNotice(restored.adjustedLegacyLink);
    publishUrl(restored.filters, true);
  }, [paramsString, groups, minSearchLength, searchParamKey, publishUrl]);

  useEffect(() => {
    const key = JSON.stringify(requested);
    setError(false);
    if (key === appliedKeyRef.current && !forceRequest) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    let current = true;
    const payload = buildFiltersPayload(archivePayloadInput(requested));
    setLoading(true);
    fetch(apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first: pageSize, after: null, filters: payload }),
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('Archive request failed');
        return response.json() as Promise<ResourceArchiveResult<Item>>;
      })
      .then((result) => {
        if (!current) return;
        appliedKeyRef.current = key;
        setApplied({ filters: requested, result, payload });
      })
      .catch(() => {
        if (current) setError(true);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
      controller.abort();
    };
  }, [requested, requestVersion, forceRequest, apiPath, pageSize, buildFiltersPayload]);

  const applyFilters = (filters: ArchiveFilters) => {
    const normalized = normalizeArchiveFilters(filters, groups, minSearchLength);
    setDraft(normalized);
    setRequested(normalized);
    setForceRequest(true);
    setRequestVersion((version) => version + 1);
    setLegacyNotice(false);
    publishUrl(normalized);
  };
  const clearFilters = () => applyFilters({ search: '', selections: {} });
  const changeSelection = (key: string, value: string) => {
    setDraft((previous) => ({
      // Changing a dependent field affects only the form, never the displayed results.
      ...normalizeArchiveFilters(
        { ...previous, selections: { ...previous.selections, [key]: value } },
        groups,
        minSearchLength,
      ),
      search: previous.search,
    }));
  };
  const appliedSummary = [
    ...(applied.filters.search ? [`Search: “${applied.filters.search}”`] : []),
    ...groups.flatMap((group) => {
      const option = group.options.find(
        (item) => item.slug === applied.filters.selections[group.key],
      );
      return option ? [`${group.label}: ${option.label}`] : [];
    }),
  ].join(' · ');
  const count =
    applied.result.total ??
    (typeof applied.result.meta?.overallTotal === 'number'
      ? applied.result.meta.overallTotal
      : applied.result.items.length);
  const listKey = useMemo(() => JSON.stringify(applied.payload), [applied.payload]);
  const pendingEdits =
    JSON.stringify(normalizeArchiveFilters(draft, groups, minSearchLength)) !==
    JSON.stringify(requested);

  return (
    <div>
      <div
        ref={filtersRef}
        className="scroll-mt-28 rounded-3xl border border-blue-300 bg-white p-4 shadow-md md:p-6"
        role="search"
        aria-label={`Search ${labels.itemPlural}`}
      >
        <h2 className="text-2xl">
          <Search
            className="mr-2 inline h-5 w-5 align-text-top text-[--brand-blue]"
            aria-hidden="true"
          />
          Search {labels.itemPlural}
        </h2>
        <form
          className="mt-4 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters(draft);
          }}
        >
          <div className={`grid gap-4 ${groups.length > 1 ? 'md:grid-cols-3' : ''}`}>
            {groups.map((group) => {
              const enabled = isArchiveFilterEnabled(group, draft);
              return (
                <div key={group.key} className="min-w-0">
                  <label
                    htmlFor={`${kind}-${group.key}`}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    {group.label}
                  </label>
                  <select
                    id={`${kind}-${group.key}`}
                    name={group.paramKey}
                    value={draft.selections[group.key] ?? ''}
                    disabled={!enabled}
                    onChange={(event) => changeSelection(group.key, event.target.value)}
                    aria-describedby={
                      group.enabledWhen ? `${kind}-project-filters-help` : undefined
                    }
                    className={controlClass}
                  >
                    <option value="">
                      All{' '}
                      {group.label === 'Topic'
                        ? 'topics'
                        : group.label === 'Category'
                          ? 'categories'
                          : `${group.label.toLowerCase()}s`}
                    </option>
                    {group.options.map((option) => (
                      <option key={option.slug} value={option.slug}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
          {groups.some((group) => group.enabledWhen) && (
            <p id={`${kind}-project-filters-help`} className="text-sm text-slate-500">
              Material and location apply to roofing-project videos.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
            <div className="min-w-0">
              <label
                htmlFor={`${kind}-search`}
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Search
              </label>
              <input
                ref={searchRef}
                id={`${kind}-search`}
                name={searchParamKey}
                type="search"
                minLength={minSearchLength}
                placeholder={`Search ${labels.itemPlural}…`}
                value={draft.search}
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, search: event.target.value }))
                }
                className={controlClass}
              />
            </div>
            <button
              type="submit"
              className="min-h-12 rounded-lg bg-[--brand-blue] px-5 py-2 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[--brand-cyan] focus:ring-offset-2"
            >
              Search
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-12 rounded-lg border border-blue-300 px-4 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[--brand-cyan] focus:ring-offset-2 disabled:opacity-50"
            >
              Clear all
            </button>
          </div>
          {pendingEdits && (
            <p className="text-sm text-slate-500">Select Search to apply your changes.</p>
          )}
        </form>
        {legacyNotice && (
          <p role="status" className="mt-3 text-sm text-slate-600">
            This saved search included multiple selections. We kept the first available option in
            each filter.
          </p>
        )}
      </div>

      <div
        className="mt-6 text-sm text-slate-700"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <p>
          {count} {count === 1 ? labels.itemSingular : labels.itemPlural} found.
        </p>
        {appliedSummary && <p className="mt-1 text-slate-500">{appliedSummary}</p>}
        {loading && <p className="mt-2">Loading {labels.itemPlural}…</p>}
      </div>
      {error && (
        <div role="alert" className="mt-3 text-sm text-red-700">
          <p>Unable to load your search. The previous results are still shown.</p>
          <button
            type="button"
            onClick={() => setRequestVersion((version) => version + 1)}
            className="mt-2 min-h-12 rounded-lg border border-red-300 px-4 underline focus:outline-none focus:ring-2 focus:ring-[--brand-cyan]"
          >
            Retry search
          </button>
        </div>
      )}
      <div aria-busy={loading}>
        {count === 0 ? (
          <div className="mt-8 rounded-xl border border-amber-400 bg-white p-6 text-slate-700">
            <p className="mb-2 font-medium">No results found.</p>
            <p className="text-sm">
              Check your search and filters, or clear all filters to start again.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 min-h-12 rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[--brand-cyan]"
            >
              Clear all
            </button>
          </div>
        ) : (
          renderResults({ result: applied.result, listFilters: applied.payload, listKey, loading })
        )}
      </div>
      <div className="pointer-events-none fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 md:hidden">
        <button
          type="button"
          onClick={() => {
            filtersRef.current?.scrollIntoView({
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'instant'
                : 'smooth',
              block: 'start',
            });
            searchRef.current?.focus({ preventScroll: true });
          }}
          className="pointer-events-auto inline-flex min-h-12 items-center gap-2 rounded-full bg-[--brand-blue] px-4 py-2 text-sm font-semibold text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[--brand-cyan] focus:ring-offset-2"
        >
          To Filters <ArrowUp className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
