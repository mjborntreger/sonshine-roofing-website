"use client";

// components/resource-search/useResourceFilters.ts
// Unifies search + filter logic for Blog, Projects, Videos, and FAQ pages.
// Designed to be mounted by a tiny controller component per page.

import { createElement, useEffect } from "react";
import { createRoot, Root } from "react-dom/client";
import SmartLink from "@/components/SmartLink";

export type ResourceKind = "blog" | "project" | "video" | "faq";

type ControllerIds = {
    query: string;       // input[type=search]
    grid: string;        // grid/wrap that contains items or sections
    chips: string;       // active chips container
    skeleton: string;    // skeleton container
    noResults: string;   // no-results container
    resultCount?: string; // (optional) count text node — not required for client-only filtering
};

type UrlKeys = { q?: string } & Record<string, string>;
// Back-compat alias (some call sites might import this)
export type ControllerUrlKeys = UrlKeys;

type MountOptions = {
    ids?: ControllerIds;
    urlKeys?: UrlKeys;         // optional; q defaults to "q" if omitted
    minQueryLen?: number;
    defer?: boolean;           // optional: allow callers to skip idle scheduling
};

/** Non-hook entry point for dynamic mounting from a tiny controller component. */
export function mountResourceFilters(kind: ResourceKind, opts: MountOptions): Cleaner {
    if (typeof window === "undefined") return () => { };
    let cleanup: Cleaner | null = null;
    let idleId: number | null = null;
    let timerId: number | null = null;

    const run = () => {
        idleId = null;
        timerId = null;
        if (cleanup) return;
        try {
            const init = STRATEGIES[kind];
            cleanup = init ? init(opts) : null;
        } catch (e) {
            console.error(`[useResourceFilters] failed to init for kind="${kind}"`, e);
        }
    };

    const shouldDefer = opts.defer !== false;

    if (shouldDefer && typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(run, { timeout: 1200 });
    } else if (shouldDefer) {
        timerId = window.setTimeout(run, 0);
    } else {
        run();
    }

    return () => {
        if (idleId != null && typeof window.cancelIdleCallback === "function") {
            try { window.cancelIdleCallback(idleId); } catch { }
        }
        if (timerId != null) {
            clearTimeout(timerId);
        }
        try { cleanup?.(); } catch { }
        cleanup = null;
    };
}

/** Public hook: mount once per page (for direct use inside components) */
export function useResourceFilters(kind: ResourceKind, opts: MountOptions) {
    useEffect(() => {
        const dispose = mountResourceFilters(kind, opts);
        return () => { try { dispose?.(); } catch { } };
    }, [kind, opts]);
}

// ------------------------------------------------------------
// Internals
// ------------------------------------------------------------

type Cleaner = () => void;

const MIN_Q = 2;
const CHIP_BUTTON_CLASS = "inline-flex items-center gap-1 rounded-full border border-[--brand-orange] bg-white px-3 py-1 text-sm";
const norm = (s: unknown) =>
    (s ?? "")
        .toString()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

const parseCsvParam = (url: URL, key: string) =>
    (url.searchParams.get(key) || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

const csvFromSet = (set: Set<string>) => Array.from(set).join(",");

const queryForUrl = (value: string, min = MIN_Q) => {
    const trimmed = value.trim();
    return trimmed.length >= min ? trimmed : null;
};

const buttonLabel = (btn: Element | null, fallback: string) => {
    if (!btn) return fallback;
    const text = btn.textContent || fallback;
    return text.replace(/\s*\(\d+\)\s*$/, "").trim();
};

type ChipDescriptor = { slug: string; label: string; group?: string };

function renderChipList(
    container: Element | null,
    chips: ChipDescriptor[],
    onRemove: (chip: ChipDescriptor) => void
) {
    if (!container) return;
    const wrap = container as HTMLElement;
    wrap.innerHTML = "";
    if (!chips.length) {
        wrap.classList.add("hidden");
        return;
    }
    wrap.classList.remove("hidden");
    wrap.style.display = "";
    for (const chip of chips) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = CHIP_BUTTON_CLASS;
        btn.setAttribute("data-chip", chip.slug);
        if (chip.group) btn.setAttribute("data-group", chip.group);
        btn.innerHTML = `<span>${chip.label}</span><span aria-hidden="true" class="text-slate-500">×</span>`;
        btn.addEventListener("click", () => onRemove(chip));
        wrap.appendChild(btn);
    }
}

const setHidden = (el: Element | null, hidden: boolean) => {
    if (!(el instanceof HTMLElement)) return;
    el.classList.toggle("hidden", hidden);
    if (!hidden) el.style.display = "";
};

const setText = (el: Element | null, text: string) => {
    if (el) el.textContent = text;
};

// ------------------------------------------------------------
// Disabled pill helpers (predictive filtering UX)
// ------------------------------------------------------------

const DISABLED_PILL_CLASSES = [
    "opacity-50",
    "cursor-not-allowed",
    "border-slate-200",
    "bg-slate-100",
    "text-slate-400",
    "hover:border-slate-200",
    "hover:bg-slate-100",
];

let tooltipEl: HTMLDivElement | null = null;
let tooltipOwner: HTMLElement | null = null;
let disabledListenersReady = false;

const findDisabledTarget = (ev: Event): HTMLElement | null => {
    const node = ev.target;
    if (!(node instanceof Element)) return null;
    return node.closest('[data-filter-disabled="true"]') as HTMLElement | null;
};

function ensureTooltipEl() {
    if (tooltipEl) return tooltipEl;
    const el = document.createElement("div");
    el.id = "resource-filter-tooltip";
    el.className = "pointer-events-none fixed z-[9999] hidden rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-lg transition-opacity duration-100";
    el.style.transform = "translateX(-50%)";
    document.body.appendChild(el);
    tooltipEl = el;
    return el;
}

function showTooltip(target: HTMLElement, message: string) {
    const el = ensureTooltipEl();
    tooltipOwner = target;
    el.textContent = message;
    const rect = target.getBoundingClientRect();
    const top = rect.bottom + 8 + window.scrollY;
    const left = rect.left + rect.width / 2 + window.scrollX;
    el.style.top = `${Math.round(top)}px`;
    el.style.left = `${Math.round(left)}px`;
    el.classList.remove("hidden");
    el.style.opacity = "1";
}

function hideTooltip(owner?: HTMLElement | null) {
    if (!tooltipEl) return;
    if (owner && owner !== tooltipOwner) return;
    tooltipEl.style.opacity = "0";
    tooltipEl.classList.add("hidden");
    tooltipOwner = null;
}

function ensureDisabledPillListeners() {
    if (disabledListenersReady) return;
    disabledListenersReady = true;

    const onPointerEnter = (ev: Event) => {
        const target = findDisabledTarget(ev);
        if (!target) return;
        const reason = target.getAttribute("data-disabled-reason") || "No matches for this combination.";
        showTooltip(target, reason);
    };

    const onPointerLeave = (ev: Event) => {
        const target = findDisabledTarget(ev);
        if (!target) return;
        hideTooltip(target);
    };

    document.addEventListener("pointerenter", onPointerEnter, true);
    document.addEventListener("focusin", onPointerEnter, true);
    document.addEventListener("pointerleave", onPointerLeave, true);
    document.addEventListener("focusout", onPointerLeave, true);
    document.addEventListener("scroll", () => hideTooltip(), true);

    document.addEventListener(
        "click",
        (ev) => {
            const btn = findDisabledTarget(ev);
            if (!btn) return;
            ev.preventDefault();
            ev.stopPropagation();
        },
        true
    );

    document.addEventListener(
        "keydown",
        (ev) => {
            if (ev.key !== "Enter" && ev.key !== " ") return;
            const btn = findDisabledTarget(ev);
            if (!btn) return;
            ev.preventDefault();
            ev.stopPropagation();
        },
        true
    );
}

function setPillDisabled(btn: Element, disabled: boolean, reason?: string) {
    const el = btn as HTMLElement;
    if (disabled) {
        ensureDisabledPillListeners();
        el.setAttribute("aria-disabled", "true");
        el.setAttribute("data-filter-disabled", "true");
        if (reason) el.setAttribute("data-disabled-reason", reason);
        el.tabIndex = 0;
        DISABLED_PILL_CLASSES.forEach((cls) => el.classList.add(cls));
    } else {
        el.removeAttribute("aria-disabled");
        el.removeAttribute("data-filter-disabled");
        el.removeAttribute("data-disabled-reason");
        DISABLED_PILL_CLASSES.forEach((cls) => el.classList.remove(cls));
        if (tooltipOwner === el) hideTooltip(el);
    }
}

type QueryRoot = Document | Element | DocumentFragment;

function isQueryRoot(value: unknown): value is QueryRoot {
    if (!value || typeof value !== "object") return false;
    const maybe = value as { querySelector?: unknown };
    return typeof maybe.querySelector === "function";
}

function $(sel: string, root?: ParentNode | Document | Element | null): Element | null {
    const scope = root ?? document;
    if (isQueryRoot(scope)) {
        return scope.querySelector(sel);
    }
    return null;
}
function $$(sel: string, root?: ParentNode | Document | Element | null): Element[] {
    const scope = root ?? document;
    if (isQueryRoot(scope)) {
        return Array.from(scope.querySelectorAll(sel));
    }
    return [];
}

function normSel(s?: string | null): string {
    if (!s) return "";
    const v = s.trim();
    if (!v) return "";
    // If it already looks like a selector, return as-is
    if (v.startsWith("#") || v.startsWith(".") || v.startsWith("[") || v.includes(" ")) return v;
    // Treat as an ID
    return `#${v}`;
}

function on<K extends keyof DocumentEventMap>(
    type: K,
    handler: (ev: DocumentEventMap[K]) => void,
    // default to bubble phase; avoid interfering with link navigation
    opts?: AddEventListenerOptions
): Cleaner {
    document.addEventListener(type, handler as EventListener, opts);
    return () => document.removeEventListener(type, handler as EventListener, opts);
}

function withLoading(toggleEl: Element | null, skeletonEl: Element | null, run: () => void) {
    const start = performance.now();
    if (toggleEl) {
        // use a separate attribute so observers watching [data-loading] don't fire
        toggleEl.setAttribute("data-filtering", "true");
        toggleEl.setAttribute("aria-busy", "true");
    }
    if (skeletonEl) skeletonEl.classList.remove("hidden");

    try { run(); } finally {
        const hide = () => {
            if (toggleEl) {
                toggleEl.setAttribute("data-filtering", "false");
                toggleEl.setAttribute("aria-busy", "false");
            }
            if (skeletonEl) skeletonEl.classList.add("hidden");
        };
        const elapsed = performance.now() - start;
        if (elapsed < 120) setTimeout(hide, 120 - elapsed); else hide();
    }
}

// Coalesce repeated calls into a single rAF tick
function makeScheduler(fn: () => void) {
    let raf = 0;
    return () => {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
            raf = 0;
            try { fn(); } catch { }
        });
    };
}

function setPillPressed(btn: Element, pressed: boolean) {
    try {
        btn.setAttribute("aria-pressed", pressed ? "true" : "false");
        const el = btn as HTMLElement;
        if (pressed) {
            el.classList.remove("border-slate-300", "text-slate-700", "bg-white");
            el.classList.add("border-[--brand-blue]", "text-white", "bg-[--brand-blue]");
        } else {
            el.classList.add("border-slate-300", "text-slate-700", "bg-white");
            el.classList.remove("border-[--brand-blue]", "text-white", "bg-[--brand-blue]");
        }
    } catch { }
}

let __lastSearch = "";
function syncUrl(params: Record<string, string | null | undefined>) {
    try {
        const url = new URL(window.location.href);
        for (const [k, v] of Object.entries(params)) {
            if (v == null || v === "") url.searchParams.delete(k); else url.searchParams.set(k, v);
        }
        const nextSearch = url.search;
        if (nextSearch !== __lastSearch) {
            __lastSearch = nextSearch;
            history.replaceState(null, "", url.toString());
        }
    } catch { }
}

// Utility: robustly test if an input event came from a given selector or id
function isOurInput(el: unknown, selectorOrId: string): el is HTMLInputElement {
    if (!(el instanceof HTMLInputElement)) return false;
    const sel = selectorOrId || '';
    let ok = false;
    try { if (sel) ok = el.matches(sel); } catch { ok = false; }
    // If the selector is an id without '#', still allow by id equality
    const maybeId = sel.startsWith('#') ? sel.slice(1) : sel;
    if (!ok && maybeId && el.id === maybeId) ok = true;
    return ok;
}

// ------------------------------------------------------------
// BLOG
// ------------------------------------------------------------
function strategyBlog(opts: MountOptions): Cleaner {
    const ids = opts.ids;
    if (!ids) return () => { };
    const sel = {
        query: normSel(ids.query),
        grid: normSel(ids.grid),
        chips: normSel(ids.chips),
        skeleton: normSel(ids.skeleton),
        noResults: normSel(ids.noResults),
        resultCount: normSel(ids.resultCount),
    };
    const urlKeys = opts.urlKeys ?? {};
    const keys = { q: urlKeys.q ?? "q", cat: urlKeys.cat ?? "cat" };
    const MINQ = opts.minQueryLen ?? MIN_Q;

    const getSearch = () => $(sel.query) as HTMLInputElement | null;
    const getGrid = () => $(sel.grid);
    const getSkeleton = () => $(sel.skeleton);
    const getNoResults = () => $(sel.noResults);
    // resultCount is now optional; sel.resultCount may be empty string (normSel returns "")
    const getResultCount = () => sel.resultCount ? $(sel.resultCount) : null;
    const getPillsWrap = () => $("#blog-pills");
    const getChipsWrap = () => $(sel.chips);

    let q = "";
    const selected = new Set<string>(); // category names
    function prewarmBlogBodies(root?: Element | null) {
        const scope = root || document;
        const cards = $$(".blog-card", scope);
        const LIMIT = 6; // keep prewarm work tiny; we only SSR ~6 anyway
        let n = 0;
        for (const card of cards) {
            if (n >= LIMIT) break;
            if (card.getAttribute("data-excerpt-norm-ready") !== "1") {
                try { ensureExcerptNorm(card); } catch { /* noop */ }
            }
            n++;
        }
    }
    function visitAddedNodesForBlog(nodes: NodeList) {
        let done = 0;
        const LIMIT = 6;
        nodes.forEach((n) => {
            if (done >= LIMIT) return;
            if (!(n instanceof Element)) return;
            const direct: Element[] = n.matches?.(".blog-card") ? [n] : [];
            const nested = Array.from(n.querySelectorAll?.(".blog-card") || []);
            for (const el of [...direct, ...nested]) {
                if (done >= LIMIT) break;
                if (el.getAttribute("data-excerpt-norm-ready") !== "1") {
                    try { ensureExcerptNorm(el); } catch { /* noop */ }
                    done++;
                }
            }
        });
    }

    function ensureTitleCatsNorm(card: Element) {
        let v = card.getAttribute("data-titlecats-norm");
        if (v != null) return v;
        const title = card.getAttribute("data-title") || "";
        const cats = card.getAttribute("data-cats") || "";
        v = norm(title + " " + cats);
        card.setAttribute("data-titlecats-norm", v);
        return v;
    }
    function ensureExcerptNorm(card: Element) {
        if (card.getAttribute("data-excerpt-norm-ready") === "1")
            return card.getAttribute("data-excerpt-norm") || "";
        let text = "";
        const tpl = card.querySelector("template.blog-body-src") as HTMLTemplateElement | null;
        if (tpl?.content) text = (tpl.content.textContent || "").replace(/\s+/g, " ").trim();
        const ex = norm(text);
        card.setAttribute("data-excerpt-norm", ex);
        card.setAttribute("data-excerpt-norm-ready", "1");
        return ex;
    }
    function matches(card: Element, qIn: string) {
        const phrase = norm(qIn);
        if (phrase.length < MINQ) return true;
        if (ensureTitleCatsNorm(card).includes(phrase)) return true;
        return ensureExcerptNorm(card).includes(phrase);
    }

    function updateChips() {
        const chips = Array.from(selected).map((name) => ({ slug: name, label: name }));
        renderChipList(getChipsWrap(), chips, ({ slug }) => {
            selected.delete(slug);
            const pill = getPillsWrap()?.querySelector(`[data-cat="${cssEscape(slug)}"]`);
            if (pill) setPillPressed(pill, false);
            if (selected.size === 0) {
                const all = getPillsWrap()?.querySelector(`[data-cat="__all__"]`);
                if (all) setPillPressed(all, true);
            }
            filterNow();
            updateChips();
        });
    }

    function filterNow() {
        const grid = getGrid();
        const skeleton = getSkeleton();
        withLoading(grid, skeleton, () => {
            const cards = grid ? $$(".blog-card", grid) : $$(".blog-card");
            const cats = new Set(Array.from(selected).map(norm));
            let visible = 0;
            for (const card of cards) {
                const catsStr = card.getAttribute("data-cats") || "";
                const postCats = new Set(catsStr.split(",").map((s) => norm(s)));
                const catsOk = cats.size === 0 || Array.from(cats).some((c) => postCats.has(c));
                const textOk = matches(card, q);
                const show = catsOk && textOk;
                (card as HTMLElement).style.display = show ? "" : "none";
                if (show) visible++;
            }
            // resultCount is optional
            setText(getResultCount(), String(visible));
            setHidden(getNoResults(), visible !== 0);
        });
        // URL sync (q + categories as CSV)
        const params: Record<string, string | null> = {
            [keys.q]: queryForUrl(q, MINQ),
            [keys.cat]: selected.size > 0 ? csvFromSet(selected) : null,
        };
        syncUrl(params);
    }
    const scheduleFilter = makeScheduler(filterNow);

    // URL init (q + categories)
    try {
        const url = new URL(window.location.href);
        q = (url.searchParams.get(keys.q) || "").trim();
        const si = getSearch(); if (si) si.value = q;

        // categories from URL
        parseCsvParam(url, keys.cat).forEach((c) => selected.add(c));

        // reflect pressed pills (All if none)
        $$("#blog-pills button[data-cat]").forEach((b) => {
            const name = b.getAttribute("data-cat") || "";
            const pressed = name === "__all__" ? selected.size === 0 : selected.has(name);
            setPillPressed(b, pressed);
        });
    } catch { }
    try {
        const run = () => prewarmBlogBodies(getGrid());
        if (typeof window.requestIdleCallback === "function") {
            window.requestIdleCallback(run, { timeout: 600 });
        } else {
            window.setTimeout(run, 0);
        }
    } catch { }

    // Robust input handler: read from event target (the actual node that fired)
    const offInput = on(
        'input',
        (ev) => {
            const target = ev.target;
            if (!isOurInput(target, sel.query)) return;
            const next = target.value ?? '';
            if (next === q) return;
            q = next;
            filterNow();
        },
        { capture: true }
    );

    const offClick = on("click", (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;

        // Reset buttons
        if (target instanceof HTMLElement && (target.id === "blog-clear" || target.id === "blog-clear-2")) {
            e.preventDefault();
            q = "";
            const si = getSearch(); if (si) si.value = "";
            selected.clear();
            // reflect pills: All on, others off
            $$("#blog-pills button[data-cat]").forEach((b) => {
                setPillPressed(b, b.getAttribute("data-cat") === "__all__");
            });
            updateChips();
            filterNow();
            return;
        }

        // Category pills
        const btn = target.closest<HTMLButtonElement>("button[data-cat]");
        if (!btn) return;
        const cat = btn.getAttribute("data-cat") || "";
        if (cat === "__all__") {
            selected.clear();
            $$("#blog-pills button[data-cat]").forEach((b) =>
                setPillPressed(b, b.getAttribute("data-cat") === "__all__")
            );
        } else {
            if (selected.has(cat)) { selected.delete(cat); setPillPressed(btn, false); }
            else {
                selected.add(cat); setPillPressed(btn, true);
                const all = $("#blog-pills [data-cat='__all__']"); if (all) setPillPressed(all, false);
            }
        }
        updateChips();
        filterNow();
    });

    // Re-run after InfiniteList loads more items OR child nodes are appended
    const grid = getGrid();
    let mo: MutationObserver | null = null;
    if (grid) {
        mo = new MutationObserver((muts) => {
            let rerun = false;
            for (const m of muts) {
                if (m.type === "attributes" && m.attributeName === "data-loading") {
                    const val = (m.target as Element).getAttribute("data-loading");
                    if (val === "false") rerun = true;
                }
                if (m.type === "childList" && ((m.addedNodes?.length || 0) > 0 || (m.removedNodes?.length || 0) > 0)) {
                    if (m.addedNodes?.length) { visitAddedNodesForBlog(m.addedNodes); }
                    rerun = true;
                }
            }
            if (rerun) scheduleFilter();
        });
        // Observe the grid itself; subtree:true lets us see attribute changes on descendants too.
        mo.observe(grid, { attributes: true, attributeFilter: ["data-loading"], childList: true, subtree: true });
    }

    // initial
    filterNow();
    updateChips();

    return () => { offInput(); offClick(); mo?.disconnect(); };
}

// ------------------------------------------------------------
// PROJECTS
// ------------------------------------------------------------
function strategyProjects(opts: MountOptions): Cleaner {
    const ids = opts.ids;
    if (!ids) return () => { };
    const sel = {
        query: normSel(ids.query),
        grid: normSel(ids.grid),
        chips: normSel(ids.chips),
        skeleton: normSel(ids.skeleton),
        noResults: normSel(ids.noResults),
        resultCount: normSel(ids.resultCount),
    };
    const urlKeys = opts.urlKeys ?? {};
    const keys = {
        q: urlKeys.q ?? "q",
        mt: urlKeys.mt ?? "mt",
        rc: urlKeys.rc ?? "rc",
        sa: urlKeys.sa ?? "sa",
    };
    const MINQ = opts.minQueryLen ?? MIN_Q;

    const getSearch = () => $(sel.query) as HTMLInputElement | null;
    const getChips = () => $(sel.chips);
    const getGrid = () => $(sel.grid);
    const getSkeleton = () => $(sel.skeleton);
    // resultCount is now optional; sel.resultCount may be empty string (normSel returns "")
    const getResultCount = () => sel.resultCount ? $(sel.resultCount) : null;
    const getNoResults = () => $(sel.noResults);
    const getQuerySpan = () => $("#project-query");

    let q = "";
    const selected = { mt: new Set<string>(), rc: new Set<string>(), sa: new Set<string>() } as const;
    type ProjectGroup = keyof typeof selected;
    const projectGroups: ProjectGroup[] = ["mt", "rc", "sa"];
    const availability: Record<ProjectGroup, Map<string, number>> = {
        mt: new Map(),
        rc: new Map(),
        sa: new Map(),
    };
    const cardDataCache = new WeakMap<Element, Record<ProjectGroup, string[]>>();
    const disabledMessage = "No projects match this combination yet.";

    function ensureTitleTaxesNorm(card: Element) {
        const existing = card.getAttribute("data-titlecats-norm");
        if (existing != null) return existing;
        const tc = norm(((card.getAttribute("data-title") || "") + " " + (card.getAttribute("data-taxes") || "")));
        card.setAttribute("data-titlecats-norm", tc);
        return tc;
    }
    function ensureExcerptNorm(card: Element) {
        if (card.getAttribute("data-excerpt-norm-ready") === "1")
            return card.getAttribute("data-excerpt-norm") || "";
        let text = "";
        const container = card.closest(".proj-item");
        // Prefer a child template (InfiniteList renderer)
        let tmpl: HTMLTemplateElement | null = (container?.querySelector("template.proj-body-src") as HTMLTemplateElement) || null;
        // Fallback to sibling template (older SSR structure)
        if (!tmpl && container && (container as HTMLElement).nextElementSibling && (container as HTMLElement).nextElementSibling?.tagName?.toLowerCase() === "template" && (container as HTMLElement).nextElementSibling?.classList?.contains("proj-body-src")) {
            tmpl = (container as HTMLElement).nextElementSibling as HTMLTemplateElement;
        }
        if (tmpl?.content) text = (tmpl.content.textContent || "").replace(/\s+/g, " ").trim();
        const ex = norm(text);
        card.setAttribute("data-excerpt-norm", ex);
        card.setAttribute("data-excerpt-norm-ready", "1");
        return ex;
    }
    function readProjectCard(card: Element): Record<ProjectGroup, string[]> {
        const cached = cardDataCache.get(card);
        if (cached) return cached;
        const read = (key: ProjectGroup) =>
            (card.getAttribute(`data-${key}`) || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        const data = { mt: read("mt"), rc: read("rc"), sa: read("sa") };
        cardDataCache.set(card, data);
        return data;
    }
    function matches(card: Element, qIn: string) {
        const phrase = norm(qIn);
        if (phrase.length < MINQ) return true;
        if (ensureTitleTaxesNorm(card).includes(phrase)) return true;
        const ex = ensureExcerptNorm(card);
        if (!ex) return false; // exclude if description missing
        return ex.includes(phrase);
    }
    function cardMatchesGroups(card: Element) {
        const data = readProjectCard(card);
        for (const group of projectGroups) {
            const set = selected[group];
            if (!set.size) continue;
            const ok = data[group].some((slug) => set.has(slug));
            if (!ok) return false;
        }
        return true;
    }

    function rebuildAvailability() {
        projectGroups.forEach((g) => availability[g].clear());
        const cards = document.querySelectorAll<HTMLElement>('.proj-card');
        cards.forEach((card) => {
            const data = readProjectCard(card);
            const matchesOthers = (exclude: ProjectGroup) =>
                projectGroups.every((group) => {
                    if (group === exclude) return true;
                    const set = selected[group];
                    if (!set.size) return true;
                    return data[group].some((slug) => set.has(slug));
                });

            for (const group of projectGroups) {
                if (!matchesOthers(group)) continue;
                const map = availability[group];
                for (const slug of data[group]) {
                    map.set(slug, (map.get(slug) ?? 0) + 1);
                }
            }
        });
    }

    function applyProjectDisabledState() {
        const anyOtherSelected = (group: ProjectGroup) =>
            projectGroups.some((g) => g !== group && selected[g].size > 0);

        const btns = document.querySelectorAll<HTMLElement>(
            '#project-pills-mt button[data-slug], #project-pills-rc button[data-slug], #project-pills-sa button[data-slug]'
        );
        btns.forEach((btn) => {
            const group = btn.getAttribute('data-group') as ProjectGroup | null;
            const slug = btn.getAttribute('data-slug') || '';
            if (!group || !slug) return;
            if (selected[group].has(slug)) {
                setPillDisabled(btn, false);
                return;
            }
            const count = availability[group].get(slug) ?? 0;
            const shouldDisable = count === 0 && anyOtherSelected(group);
            setPillDisabled(btn, shouldDisable, disabledMessage);
        });
    }

    function updateChips() {
        const chips: ChipDescriptor[] = [];
        for (const [group, set] of Object.entries(selected) as [keyof typeof selected, Set<string>][]) {
            set.forEach((slug) => {
                const btn = document.querySelector(`button[data-group="${group}"][data-slug="${cssEscape(slug)}"]`);
                chips.push({ group, slug, label: buttonLabel(btn, slug) });
            });
        }

        renderChipList(getChips(), chips, ({ group, slug }) => {
            if (group !== "mt" && group !== "rc" && group !== "sa") return;
            const set = selected[group];
            set.delete(slug);
            const pill = document.querySelector(`button[data-group="${group}"][data-slug="${cssEscape(slug)}"]`);
            if (pill) setPillPressed(pill, false);
            filterNow();
            updateChips();
        });
    }

    function filterNow() {
        const grid = getGrid();
        const skeleton = getSkeleton();
        withLoading(grid, skeleton, () => {
            rebuildAvailability();
            const items = $$(".proj-item", getGrid());
            let visible = 0;
            for (const item of items) {
                const card = item.querySelector(".proj-card");
                if (!card) continue;
                const ok = matches(card, q) && cardMatchesGroups(card);
                (item as HTMLElement).style.display = ok ? "" : "none";
                if (ok) visible++;
            }
            // resultCount is optional
            setText(getResultCount(), String(visible));
            const nr = getNoResults(); const qs = getQuerySpan();
            if (nr && qs) {
                if (q.trim().length >= MINQ && visible === 0) { nr.classList.remove("hidden"); qs.textContent = `“${q.trim()}”`; }
                else { nr.classList.add("hidden"); qs.textContent = ""; }
            }
            // URL sync
            const urlParams: Record<string, string | null> = {
                [keys.q]: queryForUrl(q, MINQ),
                [keys.mt]: selected.mt.size > 0 ? csvFromSet(selected.mt) : null,
                [keys.rc]: selected.rc.size > 0 ? csvFromSet(selected.rc) : null,
                [keys.sa]: selected.sa.size > 0 ? csvFromSet(selected.sa) : null,
            };
            syncUrl(urlParams);
            applyProjectDisabledState();
        });
    }
    const scheduleFilter = makeScheduler(filterNow);

    // Init from URL
    try {
        const url = new URL(window.location.href);
        q = (url.searchParams.get(keys.q) || "").trim();
        const si = getSearch(); if (si) si.value = q;
        for (const s of parseCsvParam(url, keys.mt)) selected.mt.add(s);
        for (const s of parseCsvParam(url, keys.rc)) selected.rc.add(s);
        for (const s of parseCsvParam(url, keys.sa)) selected.sa.add(s);
        // reflect pills
        document.querySelectorAll("button[data-group][data-slug]").forEach((btn) => {
            const g = btn.getAttribute("data-group") as keyof typeof selected | null;
            const s = btn.getAttribute("data-slug") || "";
            if (!g) return;
            setPillPressed(btn, selected[g].has(s));
        });
    } catch { }

    const offInput = on('input', (ev) => {
        const target = ev.target;
        if (!isOurInput(target, sel.query)) return;
        q = target.value || '';
        filterNow();
    }, { capture: true });

    const offClick = on("click", (ev) => {
        const el = ev.target;
        if (!(el instanceof Element)) return;
        if (el instanceof HTMLElement && el.id === "project-clear") {
            ev.preventDefault();
            q = ""; const si = getSearch(); if (si) si.value = "";
            selected.mt.clear(); selected.rc.clear(); selected.sa.clear();
            document.querySelectorAll("button[data-group][data-slug]").forEach((b) => setPillPressed(b, false));
            updateChips();
            filterNow();
            return;
        }
        const btn = el.closest<HTMLButtonElement>("button[data-group][data-slug]");
        if (!btn) return;
        ev.preventDefault();
        const groupAttr = btn.getAttribute("data-group");
        if (groupAttr !== "mt" && groupAttr !== "rc" && groupAttr !== "sa") return;
        const group: ProjectGroup = groupAttr;
        const slug = btn.getAttribute("data-slug") || "";
        const set = selected[group];
        if (!set) return;
        if (set.has(slug)) { set.delete(slug); setPillPressed(btn, false); }
        else { set.add(slug); setPillPressed(btn, true); }
        updateChips();
        filterNow();
    });

    // Observe grid for InfiniteList page-loads (robust)
    const grid = getGrid();
    let mo: MutationObserver | null = null;
    if (grid) {
        mo = new MutationObserver((muts) => {
            for (const m of muts) {
                if (m.type === "attributes" && m.attributeName === "data-loading") {
                    const val = (m.target as Element).getAttribute("data-loading");
                    if (val === "false") { scheduleFilter(); }
                }
            }
        });
        mo.observe(grid, { attributes: true, attributeFilter: ["data-loading"], childList: true, subtree: true });
    }

    // initial
    updateChips();
    filterNow();

    return () => { offInput(); offClick(); mo?.disconnect(); };
}

// ------------------------------------------------------------
// VIDEOS
// ------------------------------------------------------------
function strategyVideos(opts: MountOptions): Cleaner {
    const ids = opts.ids;
    if (!ids) return () => { };
    const sel = {
        query: normSel(ids.query),
        grid: normSel(ids.grid),
        chips: normSel(ids.chips),
        skeleton: normSel(ids.skeleton),
        noResults: normSel(ids.noResults),
        resultCount: normSel(ids.resultCount),
    };
    const urlKeys = opts.urlKeys ?? {};
    const keys = {
        q: urlKeys.q ?? "q",
        bk: urlKeys.bk ?? "bk",
        mt: urlKeys.mt ?? "mt",
        sa: urlKeys.sa ?? "sa",
    };
    const MINQ = opts.minQueryLen ?? MIN_Q;

    const getSearch = () => $(sel.query) as HTMLInputElement | null;
    const getChips = () => $(sel.chips);
    const getWrap = () => $(sel.grid);
    const getSkeleton = () => $(sel.skeleton);
    // resultCount is now optional; sel.resultCount may be empty string (normSel returns "")
    const getResultCount = () => sel.resultCount ? $(sel.resultCount) : null;
    const getNoResults = () => $(sel.noResults);
    const getQuerySpan = () => $("#video-query");

    const selected = { bk: new Set<string>(), mt: new Set<string>(), sa: new Set<string>() } as const;
    type VideoGroup = keyof typeof selected;
    const videoGroups: VideoGroup[] = ["bk", "mt", "sa"];
    const availability: Record<VideoGroup, Map<string, number>> = {
        bk: new Map(),
        mt: new Map(),
        sa: new Map(),
    };
    const cardDataCache = new WeakMap<Element, Record<VideoGroup, string[]>>();
    const disabledMessage = "No videos match this combination yet.";
    let q = "";

    function ensureTitleCatsNorm(card: Element, section?: Element | null) {
        const existing = card.getAttribute("data-titlecats-norm");
        if (existing != null) return existing;
        const title = card.getAttribute("data-title") || "";
        const cats = card.getAttribute("data-cats") || "";
        const bucketName = section?.getAttribute("data-section-title") || "";
        const normalized = norm([title, cats, bucketName].join(" "));
        card.setAttribute("data-titlecats-norm", normalized);
        return normalized;
    }
    function ensureExcerptNorm(card: Element) {
        if (card.getAttribute("data-excerpt-norm-ready") === "1")
            return card.getAttribute("data-excerpt-norm") || "";
        const tpl = card.closest(".vid-item")?.querySelector("template.vid-body-src") as HTMLTemplateElement | null;
        let text = ""; if (tpl?.content) text = (tpl.content.textContent || "").replace(/\s+/g, " ").trim();
        const ex = norm(text);
        card.setAttribute("data-excerpt-norm", ex);
        card.setAttribute("data-excerpt-norm-ready", "1");
        return ex;
    }
    function visitAddedNodesForVideo(nodes: NodeList) {
        nodes.forEach((n) => {
            if (!(n instanceof Element)) return;
            const one = n.matches?.(".vid-card") ? [n] : [];
            const nested = n.querySelectorAll?.(".vid-card") || [];
            [...one, ...Array.from(nested)].forEach((el) => {
                if (el.getAttribute("data-excerpt-norm-ready") !== "1") {
                    try { ensureExcerptNorm(el); } catch { }
                }
            });
        });
    }
    function readVideoCard(card: Element): Record<VideoGroup, string[]> {
        const cached = cardDataCache.get(card);
        if (cached) return cached;
        const read = (attr: string) =>
            (card.getAttribute(attr) || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        const data = {
            bk: read("data-bucket"),
            mt: read("data-mt"),
            sa: read("data-sa"),
        } as Record<VideoGroup, string[]>;
        cardDataCache.set(card, data);
        return data;
    }
    function matches(card: Element, section: Element | null, qIn: string) {
        const phrase = norm(qIn);
        if (phrase.length < MINQ) return true;
        if (ensureTitleCatsNorm(card, section).includes(phrase)) return true;
        const ex = ensureExcerptNorm(card);
        if (!ex) return false;
        return ex.includes(phrase);
    }

    function showEl(el?: Element | null) { if (el instanceof HTMLElement) { el.classList.remove("hidden"); el.style.display = ""; } }
    function hideEl(el?: Element | null) { if (el instanceof HTMLElement) { el.classList.add("hidden"); el.style.display = "none"; } }

    function updateProjectOnlyGroupsVisibility() {
        const show = selected.bk.has("roofing-project");
        const mtG = $("#video-group-mt");
        const saG = $("#video-group-sa");
        if (mtG) { mtG.classList.toggle("hidden", !show); (mtG as HTMLElement).style.display = ""; }
        if (saG) { saG.classList.toggle("hidden", !show); (saG as HTMLElement).style.display = ""; }
        if (!show) {
            selected.mt.clear(); selected.sa.clear();
            document.querySelectorAll('button[data-group="mt"],button[data-group="sa"]').forEach((b) => setPillPressed(b, false));
        }
    }

    function sectionMatches(section: Element) {
        if (!selected.bk.size) return true;
        const key = section.getAttribute("data-bucket-key") || "";
        return selected.bk.has(key);
    }

    function cardMatchesGroups(card: Element) {
        const data = readVideoCard(card);
        for (const group of ["mt", "sa"] as const) {
            const set = selected[group];
            if (!set.size) continue;
            const ok = data[group].some((slug) => set.has(slug));
            if (!ok) return false;
        }
        return true;
    }

    function rebuildAvailability() {
        videoGroups.forEach((g) => availability[g].clear());
        const cards = document.querySelectorAll<HTMLElement>('.vid-card');
        cards.forEach((card) => {
            const data = readVideoCard(card);
            const matchesGroupSelection = (group: VideoGroup) => {
                const set = selected[group];
                if (!set.size) return true;
                return data[group].some((slug) => set.has(slug));
            };
            const matchesOthers = (exclude: VideoGroup) =>
                videoGroups.every((group) => {
                    if (group === exclude) return true;
                    return matchesGroupSelection(group);
                });

            for (const group of videoGroups) {
                if (!matchesOthers(group)) continue;
                const map = availability[group];
                for (const slug of data[group]) {
                    map.set(slug, (map.get(slug) ?? 0) + 1);
                }
            }
        });
    }

    function applyVideoDisabledState() {
        const anyOtherSelected = (group: VideoGroup) =>
            videoGroups.some((g) => g !== group && selected[g].size > 0);

        const buttons = document.querySelectorAll<HTMLElement>(
            '#video-pills-bk button[data-slug], #video-pills-mt button[data-slug], #video-pills-sa button[data-slug]'
        );
        buttons.forEach((btn) => {
            const group = btn.getAttribute('data-group') as VideoGroup | null;
            const slug = btn.getAttribute('data-slug') || '';
            if (!group || !slug) return;
            if (selected[group].has(slug)) {
                setPillDisabled(btn, false);
                return;
            }
            const count = availability[group].get(slug) ?? 0;
            const shouldDisable = count === 0 && anyOtherSelected(group);
            setPillDisabled(btn, shouldDisable, disabledMessage);
        });
    }

    function updateChips() {
        const chips: ChipDescriptor[] = [];
        document.querySelectorAll("button[data-group][data-slug]").forEach((b) => {
            const group = b.getAttribute("data-group") as "bk" | "mt" | "sa" | null;
            const slug = b.getAttribute("data-slug") || "";
            const pressed = b.getAttribute("aria-pressed") === "true";
            if (!group || !pressed) return;
            chips.push({ group, slug, label: buttonLabel(b, slug) });
        });

        renderChipList(getChips(), chips, ({ group, slug }) => {
            if (group !== "bk" && group !== "mt" && group !== "sa") return;
            const btn = document.querySelector(`button[data-group="${group}"][data-slug="${cssEscape(slug)}"]`);
            if (btn) { btn.setAttribute("aria-pressed", "false"); setPillPressed(btn, false); }
            const set = selected[group];
            set.delete(slug);
            if (group === "bk") updateProjectOnlyGroupsVisibility();
            filterNow();
            updateChips();
        });
    }

    function filterNow() {
        const wrap = getWrap();
        const skeleton = getSkeleton();
        withLoading(wrap, skeleton, () => {
            rebuildAvailability();
            const sections = $$(".video-section", wrap);
            let total = 0;
            for (const section of sections) {
                const secOk = sectionMatches(section);
                if (!secOk) { hideEl(section); continue; } else { showEl(section); }

                let vis = 0;
                const items = $$(".vid-item", section);
                for (const item of items) {
                    const card = item.querySelector(".vid-card");
                    if (!card) { hideEl(item); continue; }
                    const textOk = matches(card, section, q);
                    const groupOk = cardMatchesGroups(card);
                    const show = textOk && groupOk;
                    if (show) { showEl(item); vis++; total++; } else hideEl(item);
                }
                if (vis === 0) { hideEl(section); } else { showEl(section); }
            }
            // resultCount is optional
            setText(getResultCount(), String(total));
            const nr = getNoResults(); const qs = getQuerySpan();
            if (nr && qs) {
                if (q.trim().length >= MINQ && total === 0) { nr.classList.remove("hidden"); qs.textContent = `“${q.trim()}”`; }
                else { nr.classList.add("hidden"); qs.textContent = ""; }
            }
            // URL sync
            const urlParams: Record<string, string | null> = {
                [keys.q]: queryForUrl(q, MINQ),
                [keys.bk]: selected.bk.size > 0 ? csvFromSet(selected.bk) : null,
                [keys.mt]: selected.mt.size > 0 ? csvFromSet(selected.mt) : null,
                [keys.sa]: selected.sa.size > 0 ? csvFromSet(selected.sa) : null,
            };
            syncUrl(urlParams);
            applyVideoDisabledState();
        });
    }
    const scheduleFilter = makeScheduler(filterNow);

    // Init from URL
    try {
        const url = new URL(window.location.href);
        q = (url.searchParams.get(keys.q) || "").trim();
        const si = getSearch(); if (si) si.value = q;
        for (const s of parseCsvParam(url, keys.bk)) selected.bk.add(s);
        for (const s of parseCsvParam(url, keys.mt)) selected.mt.add(s);
        for (const s of parseCsvParam(url, keys.sa)) selected.sa.add(s);

        // If mt/sa present, force roofing-project and drop others
        if (selected.mt.size || selected.sa.size) { selected.bk.clear(); selected.bk.add("roofing-project"); }

        // Enforce exclusivity: if RP present with others, keep only RP
        if (selected.bk.has("roofing-project")) {
            selected.bk.forEach((s) => { if (s !== "roofing-project") selected.bk.delete(s); });
        }

        // Reflect pills
        document.querySelectorAll("button[data-group][data-slug]").forEach((b) => {
            const group = b.getAttribute("data-group") as "bk" | "mt" | "sa" | null;
            const slug = b.getAttribute("data-slug") || "";
            if (!group) return;
            setPillPressed(b, selected[group].has(slug));
        });

        updateProjectOnlyGroupsVisibility();
    } catch { }

    const offInput = on('input', (e) => {
        const target = e.target;
        if (!isOurInput(target, sel.query)) return;
        q = target.value || '';
        filterNow();
    }, { capture: true });

    const offClick = on("click", (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        if (target instanceof HTMLElement && target.id === "video-clear") {
            e.preventDefault();
            q = ""; const si = getSearch(); if (si) si.value = "";
            selected.bk.clear(); selected.mt.clear(); selected.sa.clear();
            document.querySelectorAll("button[data-group][data-slug]").forEach((b) => setPillPressed(b, false));
            updateProjectOnlyGroupsVisibility();
            updateChips();
            filterNow();
            return;
        }

        const btn = target.closest<HTMLButtonElement>("button[data-group][data-slug]");
        if (!btn) return;
        e.preventDefault();
        const groupAttr = btn.getAttribute("data-group");
        if (groupAttr !== "bk" && groupAttr !== "mt" && groupAttr !== "sa") return;
        const group: VideoGroup = groupAttr;
        const slug = btn.getAttribute("data-slug") || "";

        // Toggle
        const set = selected[group];
        const next = !(btn.getAttribute("aria-pressed") === "true");
        btn.setAttribute("aria-pressed", next ? "true" : "false");
        setPillPressed(btn, next);
        if (next) set.add(slug); else set.delete(slug);

        // Bucket exclusivity
        if (group === "bk") {
            if (slug === "roofing-project" && next) {
                // Keep only RP
                selected.bk.clear(); selected.bk.add("roofing-project");
                document.querySelectorAll('button[data-group="bk"]').forEach((b) => {
                    const s = b.getAttribute("data-slug");
                    setPillPressed(b, s === "roofing-project");
                    b.setAttribute("aria-pressed", s === "roofing-project" ? "true" : "false");
                });
            } else if (slug !== "roofing-project" && next && selected.bk.has("roofing-project")) {
                // Remove RP + clear project-only filters
                selected.bk.delete("roofing-project");
                const rp = document.querySelector('button[data-group="bk"][data-slug="roofing-project"]');
                if (rp) { setPillPressed(rp, false); rp.setAttribute("aria-pressed", "false"); }
                selected.mt.clear(); selected.sa.clear();
                document.querySelectorAll('button[data-group="mt"],button[data-group="sa"]').forEach((b) => { setPillPressed(b, false); b.setAttribute("aria-pressed", "false"); });
            }
            updateProjectOnlyGroupsVisibility();
        }

        updateChips();
        filterNow();
    });

    // style patch: ensure hidden class truly removes from grid flow
    if (!document.getElementById("video-list-patch-css")) {
        const css = ".vid-item.hidden{display:none!important}.video-section{min-width:0}";
        const tag = document.createElement("style"); tag.id = "video-list-patch-css"; tag.appendChild(document.createTextNode(css)); document.head.appendChild(tag);
    }

    // Re-run after InfiniteList append cycles (robust)
    const wrap = getWrap();
    let mo: MutationObserver | null = null;
    if (wrap) {
        mo = new MutationObserver((muts) => {
            let rerun = false;
            for (const m of muts) {
                if (m.type === "attributes" && m.attributeName === "data-loading") {
                    const el = m.target as Element;
                    if (el.getAttribute("data-loading") === "false") rerun = true;
                }
                if (m.type === "childList" && ((m.addedNodes?.length || 0) > 0 || (m.removedNodes?.length || 0) > 0)) {
                    if (m.addedNodes?.length) { visitAddedNodesForVideo(m.addedNodes); }
                    rerun = true;
                }
            }
            if (rerun) scheduleFilter();
        });
        mo.observe(wrap, { attributes: true, attributeFilter: ["data-loading"], childList: true, subtree: true });
    }

    // initial
    updateChips();
    filterNow();

    return () => { offInput(); offClick(); mo?.disconnect(); };
}

// ------------------------------------------------------------
// FAQ
// ------------------------------------------------------------
function strategyFaq(opts: MountOptions): Cleaner {
    const ids = opts.ids;
    if (!ids) return () => { };
    const sel = {
        query: normSel(ids.query),
        grid: normSel(ids.grid),
        chips: normSel(ids.chips),
        skeleton: normSel(ids.skeleton),
        noResults: normSel(ids.noResults),
        resultCount: normSel(ids.resultCount),
    };
    const urlKeys = opts.urlKeys ?? {};
    const keys = { q: urlKeys.q ?? "q" };
    const MINQ = opts.minQueryLen ?? MIN_Q;

    const getSearch = () => $(sel.query) as HTMLInputElement | null;
    const getTopics = () => $$("#faq-topics details.faq-topic");
    const getItems = (root?: Element | null) => $$(".faq-item", root || document);
    const getResultCount = () => (sel.resultCount ? $(sel.resultCount) : $("#faq-result-count"));
    const getNoResults = () => (sel.noResults ? $(sel.noResults) : $("#faq-no-results"));
    const getQuerySpan = () => $("#faq-query");
    const getSugWrap = () => $("#faq-suggestions");
    const getSugList = () => {
        const el = $("#faq-suggestion-list");
        return el instanceof HTMLElement ? el : null;
    };

    const suggestionEntries: Array<{ root: Root; node: HTMLElement }> = [];

    const clearSuggestionEntries = (list?: HTMLElement | null) => {
        for (const entry of suggestionEntries) {
            try { entry.root.unmount(); } catch { }
        }
        suggestionEntries.length = 0;
        if (list) {
            if (typeof list.replaceChildren === "function") {
                list.replaceChildren();
            } else {
                list.innerHTML = "";
            }
        }
    };

    // Initialize from URL (q)
    try {
      const url = new URL(window.location.href);
      const q0 = (url.searchParams.get(keys.q) || "").trim();
      const si = getSearch();
      if (si) si.value = q0;
    } catch {}

    function ensureTitleNorm(el: Element) {
        const existing = el.getAttribute("data-title-norm");
        if (existing != null) return existing;
        const normalized = norm(el.getAttribute("data-title") || "");
        el.setAttribute("data-title-norm", normalized);
        return normalized;
    }
    function ensureTopicNorm(el: Element) {
        const existing = el.getAttribute("data-topic-norm");
        if (existing != null) return existing;
        const normalized = norm(el.getAttribute("data-topic") || "");
        el.setAttribute("data-topic-norm", normalized);
        return normalized;
    }
    function ensureExcerptNorm(el: Element) {
        const existing = el.getAttribute("data-excerpt-norm");
        if (existing != null) return existing;
        const normalized = norm(el.getAttribute("data-excerpt") || "");
        el.setAttribute("data-excerpt-norm", normalized);
        return normalized;
    }

    function matches(el: Element, q: string) {
        const phrase = norm(q);
        if (phrase.length < MINQ) return true;
        if (ensureTitleNorm(el).includes(phrase)) return true;
        if (ensureTopicNorm(el).includes(phrase)) return true;
        if (ensureExcerptNorm(el).includes(phrase)) return true;
        return false;
    }

    function buildSuggestions(all: Element[], phrase: string) {
        const tokens = norm(phrase).split(/\s+/).filter((t) => t.length >= 3);
        if (!tokens.length) return [];
        const seen = new Set<string>();
        const out: Array<{ title: string; href: string }> = [];
        for (const el of all) {
            const title = el.getAttribute("data-title") || "";
            const tNorm = ensureTitleNorm(el);
            if (tokens.some((tok) => tNorm.includes(tok))) {
                const slug = (el.id || "").replace(/^faq-/, "");
                const href = slug ? `/faq/${slug}` : "#";
                const key = slug || title;
                if (seen.has(key)) continue;
                seen.add(key);
                out.push({ title, href });
                if (out.length >= 5) break;
            }
        }
        return out;
    }

    function syncQ(q: string) {
        const trimmed = q.trim();
        const params: Record<string, string | null> = {
            [keys.q]: trimmed.length >= MINQ ? trimmed : null,
        };
        syncUrl(params);
    }

    function applyHashOpen() {
        const h = window.location.hash || "";
        if (!h.startsWith("#faq-")) return;
        const item = $(h);
        if (!item) return;
        const topic = item.closest("details.faq-topic") as HTMLDetailsElement | null;
        if (topic && !topic.open) topic.open = true;
        setTimeout(() => (item as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }

    function filterNow() {
        const q = (getSearch()?.value || "");
        const topics = getTopics();
        let totalVisible = 0;

        for (const topic of topics) {
            const items = getItems(topic);
            let vis = 0;
            for (const el of items) {
                const show = matches(el, q);
                (el as HTMLElement).style.display = show ? "" : "none";
                if (show) vis++;
            }
            const badge = $(".faq-count", topic); if (badge) badge.textContent = String(vis);
            if (vis === 0) { (topic as HTMLElement).style.display = "none"; (topic as HTMLDetailsElement).open = false; }
            else { (topic as HTMLElement).style.display = ""; if (q.trim().length >= MINQ) (topic as HTMLDetailsElement).open = true; }
            totalVisible += vis;
        }

        const rc = getResultCount(); if (rc) rc.textContent = String(totalVisible);
        const nr = getNoResults(); const qs = getQuerySpan();
        const sw = getSugWrap(); const sl = getSugList();
        if (nr && qs && sw) {
            if (q.trim().length >= MINQ && totalVisible === 0) {
                nr.classList.remove("hidden");
                qs.textContent = `“${q.trim()}”`;
                // Suggestions
                const sugg = buildSuggestions(getItems(), q);
                if (sugg.length) {
                    sw.classList.remove("hidden");
                    const listEl = sl;
                    clearSuggestionEntries(listEl ?? undefined);
                    if (listEl) {
                        for (const s of sugg) {
                            const li = document.createElement("li");
                            const root = createRoot(li);
                            root.render(
                                createElement(
                                    SmartLink,
                                    {
                                        href: s.href,
                                        className: "inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm hover:bg-slate-50",
                                    },
                                    s.title
                                )
                            );
                            suggestionEntries.push({ root, node: li });
                            listEl.appendChild(li);
                        }
                    }
                } else {
                    sw.classList.add("hidden");
                    const listEl = getSugList();
                    clearSuggestionEntries(listEl ?? undefined);
                }
            } else {
                nr.classList.add("hidden");
                qs.textContent = "";
                sw.classList.add("hidden");
                const listEl = getSugList();
                clearSuggestionEntries(listEl ?? undefined);
            }
        }
        syncQ(q);

        if (typeof window !== "undefined") {
            try { window.dispatchEvent(new CustomEvent("faq:update")); } catch { }
        }
    }

    const offInput = on('input', (e) => {
        const target = e.target;
        if (!isOurInput(target, sel.query)) return;
        filterNow();
    }, { capture: true });

    const offSubmit = on("submit", (e) => {
        const form = e.target;
        if (!(form instanceof HTMLFormElement)) return;
        if ($("#faq-search", form)) e.preventDefault();
    });

    const offClick = on("click", (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        if (!target.closest("#faq-toggle-all")) return;
        if (typeof window !== "undefined") {
            try { window.dispatchEvent(new CustomEvent("faq:update")); } catch { }
        }
    });

    // initial
    filterNow();
    applyHashOpen();

    return () => {
        offInput();
        offSubmit();
        offClick();
        const listEl = getSugList();
        clearSuggestionEntries(listEl ?? undefined);
    };
}

// ------------------------------------------------------------
// Strategy registry
// ------------------------------------------------------------
const STRATEGIES: Record<ResourceKind, (opts: MountOptions) => Cleaner> = {
    blog: strategyBlog,
    project: strategyProjects,
    video: strategyVideos,
    faq: strategyFaq,
};

// ------------------------------------------------------------
// Small util: CSS.escape polyfill wrapper
// ------------------------------------------------------------
function cssEscape(s: string) {
    try {
        const cssApi = typeof window !== "undefined" ? window.CSS : undefined;
        return cssApi && typeof cssApi.escape === "function" ? cssApi.escape(s) : s;
    } catch {
        return s;
    }
}

export default useResourceFilters;
