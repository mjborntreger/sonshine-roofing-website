'use client';

import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import SmartLink from '@/components/utils/SmartLink';

type ControllerIds = {
  query: string;
  noResults: string;
  resultCount?: string;
};

type UrlKeys = { q?: string };

type MountOptions = {
  ids?: ControllerIds;
  urlKeys?: UrlKeys;
  minQueryLen?: number;
  defer?: boolean;
};

type Cleaner = () => void;
type QueryRoot = Document | Element | DocumentFragment;

const MIN_Q = 2;

const norm = (value: unknown) =>
  (value ?? '')
    .toString()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

function isQueryRoot(value: unknown): value is QueryRoot {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as { querySelector?: unknown };
  return typeof maybe.querySelector === 'function';
}

function $(selector: string, root?: ParentNode | Document | Element | null): Element | null {
  const scope = root ?? document;
  return isQueryRoot(scope) ? scope.querySelector(selector) : null;
}

function $$(selector: string, root?: ParentNode | Document | Element | null): Element[] {
  const scope = root ?? document;
  return isQueryRoot(scope) ? Array.from(scope.querySelectorAll(selector)) : [];
}

function normSelector(selector?: string | null): string {
  if (!selector) return '';
  const value = selector.trim();
  if (!value) return '';
  if (
    value.startsWith('#') ||
    value.startsWith('.') ||
    value.startsWith('[') ||
    value.includes(' ')
  ) {
    return value;
  }
  return `#${value}`;
}

function on<K extends keyof DocumentEventMap>(
  type: K,
  handler: (event: DocumentEventMap[K]) => void,
  options?: AddEventListenerOptions,
): Cleaner {
  document.addEventListener(type, handler as EventListener, options);
  return () => document.removeEventListener(type, handler as EventListener, options);
}

let lastSearch = '';

function syncUrl(params: Record<string, string | null | undefined>) {
  try {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(params)) {
      if (value == null || value === '') url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    }
    const nextSearch = url.search;
    if (nextSearch !== lastSearch) {
      lastSearch = nextSearch;
      history.replaceState(null, '', url.toString());
    }
  } catch {}
}

function isOurInput(value: unknown, selectorOrId: string): value is HTMLInputElement {
  if (!(value instanceof HTMLInputElement)) return false;
  const selector = selectorOrId || '';
  let matches = false;
  try {
    if (selector) matches = value.matches(selector);
  } catch {
    matches = false;
  }
  const maybeId = selector.startsWith('#') ? selector.slice(1) : selector;
  if (!matches && maybeId && value.id === maybeId) matches = true;
  return matches;
}

/** Mount the FAQ archive search behavior and return its cleanup function. */
export function mountFaqSearch(options: MountOptions): Cleaner {
  if (typeof window === 'undefined') return () => {};

  let cleanup: Cleaner | null = null;
  let idleId: number | null = null;
  let timerId: number | null = null;

  const run = () => {
    idleId = null;
    timerId = null;
    if (cleanup) return;
    try {
      cleanup = initializeFaqSearch(options);
    } catch (error) {
      console.error('[faq-search-runtime] failed to initialize', error);
    }
  };

  const shouldDefer = options.defer !== false;
  if (shouldDefer && typeof window.requestIdleCallback === 'function') {
    idleId = window.requestIdleCallback(run, { timeout: 1200 });
  } else if (shouldDefer) {
    timerId = window.setTimeout(run, 0);
  } else {
    run();
  }

  return () => {
    if (idleId != null && typeof window.cancelIdleCallback === 'function') {
      try {
        window.cancelIdleCallback(idleId);
      } catch {}
    }
    if (timerId != null) clearTimeout(timerId);
    try {
      cleanup?.();
    } catch {}
    cleanup = null;
  };
}

function initializeFaqSearch(options: MountOptions): Cleaner {
  const ids = options.ids;
  if (!ids) return () => {};

  const selectors = {
    query: normSelector(ids.query),
    noResults: normSelector(ids.noResults),
    resultCount: normSelector(ids.resultCount),
  };
  const urlKeys = options.urlKeys ?? {};
  const queryKey = urlKeys.q ?? 'q';
  const minQueryLength = options.minQueryLen ?? MIN_Q;

  const getSearch = () => $(selectors.query) as HTMLInputElement | null;
  const getTopics = () => $$('#faq-topics details.faq-topic');
  const getItems = (root?: Element | null) => $$('.faq-item', root || document);
  const getResultCount = () =>
    selectors.resultCount ? $(selectors.resultCount) : $('#faq-result-count');
  const getNoResults = () => (selectors.noResults ? $(selectors.noResults) : $('#faq-no-results'));
  const getQuerySpan = () => $('#faq-query');
  const getSuggestions = () => $('#faq-suggestions');
  const getSuggestionList = () => {
    const element = $('#faq-suggestion-list');
    return element instanceof HTMLElement ? element : null;
  };

  const suggestionEntries: Array<{ root: Root; node: HTMLElement }> = [];

  const clearSuggestionEntries = (list?: HTMLElement | null) => {
    for (const entry of suggestionEntries) {
      try {
        entry.root.unmount();
      } catch {}
    }
    suggestionEntries.length = 0;
    if (list) {
      if (typeof list.replaceChildren === 'function') list.replaceChildren();
      else list.innerHTML = '';
    }
  };

  try {
    const url = new URL(window.location.href);
    const initialQuery = (url.searchParams.get(queryKey) || '').trim();
    const search = getSearch();
    if (search) search.value = initialQuery;
  } catch {}

  function ensureTitleNorm(element: Element) {
    const existing = element.getAttribute('data-title-norm');
    if (existing != null) return existing;
    const normalized = norm(element.getAttribute('data-title') || '');
    element.setAttribute('data-title-norm', normalized);
    return normalized;
  }

  function ensureTopicNorm(element: Element) {
    const existing = element.getAttribute('data-topic-norm');
    if (existing != null) return existing;
    const normalized = norm(element.getAttribute('data-topic') || '');
    element.setAttribute('data-topic-norm', normalized);
    return normalized;
  }

  function ensureExcerptNorm(element: Element) {
    const existing = element.getAttribute('data-excerpt-norm');
    if (existing != null) return existing;
    const normalized = norm(element.getAttribute('data-excerpt') || '');
    element.setAttribute('data-excerpt-norm', normalized);
    return normalized;
  }

  function matches(element: Element, query: string) {
    const phrase = norm(query);
    if (phrase.length < minQueryLength) return true;
    if (ensureTitleNorm(element).includes(phrase)) return true;
    if (ensureTopicNorm(element).includes(phrase)) return true;
    return ensureExcerptNorm(element).includes(phrase);
  }

  function buildSuggestions(all: Element[], phrase: string) {
    const tokens = norm(phrase)
      .split(/\s+/)
      .filter((token) => token.length >= 3);
    if (!tokens.length) return [];

    const seen = new Set<string>();
    const suggestions: Array<{ title: string; href: string }> = [];
    for (const element of all) {
      const title = element.getAttribute('data-title') || '';
      const normalizedTitle = ensureTitleNorm(element);
      if (tokens.some((token) => normalizedTitle.includes(token))) {
        const id = (element.id || '').replace(/^faq-/, '');
        const href = id ? `/faq#faq-${id}` : '#';
        const key = id || title;
        if (seen.has(key)) continue;
        seen.add(key);
        suggestions.push({ title, href });
        if (suggestions.length >= 5) break;
      }
    }
    return suggestions;
  }

  function syncQuery(query: string) {
    const trimmed = query.trim();
    syncUrl({ [queryKey]: trimmed.length >= minQueryLength ? trimmed : null });
  }

  function applyHashOpen() {
    const hash = window.location.hash || '';
    if (!hash.startsWith('#faq-')) return;
    const item = $(hash);
    if (!item) return;
    const topic = item.closest('details.faq-topic') as HTMLDetailsElement | null;
    if (topic && !topic.open) topic.open = true;
    setTimeout(
      () => (item as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' }),
      50,
    );
  }

  function filterNow() {
    const query = getSearch()?.value || '';
    const topics = getTopics();
    let totalVisible = 0;

    for (const topic of topics) {
      const items = getItems(topic);
      let visible = 0;
      for (const element of items) {
        const show = matches(element, query);
        (element as HTMLElement).style.display = show ? '' : 'none';
        if (show) visible++;
      }
      const badge = $('.faq-count', topic);
      if (badge) badge.textContent = String(visible);
      if (visible === 0) {
        (topic as HTMLElement).style.display = 'none';
        (topic as HTMLDetailsElement).open = false;
      } else {
        (topic as HTMLElement).style.display = '';
        if (query.trim().length >= minQueryLength) (topic as HTMLDetailsElement).open = true;
      }
      totalVisible += visible;
    }

    const resultCount = getResultCount();
    if (resultCount) resultCount.textContent = String(totalVisible);
    const noResults = getNoResults();
    const querySpan = getQuerySpan();
    const suggestionWrap = getSuggestions();
    const suggestionList = getSuggestionList();

    if (noResults && querySpan && suggestionWrap) {
      if (query.trim().length >= minQueryLength && totalVisible === 0) {
        noResults.classList.remove('hidden');
        querySpan.textContent = `“${query.trim()}”`;
        const suggestions = buildSuggestions(getItems(), query);
        if (suggestions.length) {
          suggestionWrap.classList.remove('hidden');
          clearSuggestionEntries(suggestionList ?? undefined);
          if (suggestionList) {
            for (const suggestion of suggestions) {
              const item = document.createElement('li');
              const root = createRoot(item);
              root.render(
                createElement(
                  SmartLink,
                  {
                    href: suggestion.href,
                    className:
                      'inline-flex min-w-0 max-w-full items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm hover:bg-slate-50',
                  },
                  createElement(
                    'span',
                    { className: 'block max-w-full truncate' },
                    suggestion.title,
                  ),
                ),
              );
              suggestionEntries.push({ root, node: item });
              suggestionList.appendChild(item);
            }
          }
        } else {
          suggestionWrap.classList.add('hidden');
          clearSuggestionEntries(getSuggestionList() ?? undefined);
        }
      } else {
        noResults.classList.add('hidden');
        querySpan.textContent = '';
        suggestionWrap.classList.add('hidden');
        clearSuggestionEntries(getSuggestionList() ?? undefined);
      }
    }

    syncQuery(query);
    try {
      window.dispatchEvent(new CustomEvent('faq:update'));
    } catch {}
  }

  const offInput = on(
    'input',
    (event) => {
      if (!isOurInput(event.target, selectors.query)) return;
      filterNow();
    },
    { capture: true },
  );

  const offSubmit = on('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if ($('#faq-search', form)) event.preventDefault();
  });

  const offClick = on('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest('#faq-toggle-all')) return;
    try {
      window.dispatchEvent(new CustomEvent('faq:update'));
    } catch {}
  });

  filterNow();
  applyHashOpen();

  return () => {
    offInput();
    offSubmit();
    offClick();
    clearSuggestionEntries(getSuggestionList() ?? undefined);
  };
}
