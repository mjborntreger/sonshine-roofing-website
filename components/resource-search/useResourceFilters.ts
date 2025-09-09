"use client";

// components/resource-search/useResourceFilters.ts
// Unifies search + filter logic for Blog, Projects, Videos, and FAQ pages.
// Designed to be mounted by a tiny controller component per page.

import { useEffect } from "react";

export type ResourceKind = "blog" | "project" | "video" | "faq";

export type ControllerIds = {
    query: string;       // input[type=search]
    grid: string;        // grid/wrap that contains items or sections
    chips: string;       // active chips container
    skeleton: string;    // skeleton container
    noResults: string;   // no-results container
    resultCount?: string; // (optional) count text node — not required for client-only filtering
};

export type UrlKeys = { q?: string } & Record<string, string>;
// Back-compat alias (some call sites might import this)
export type ControllerUrlKeys = UrlKeys;

export type MountOptions = {
    ids?: ControllerIds;
    urlKeys?: UrlKeys;         // optional; q defaults to "q" if omitted
    minQueryLen?: number;
};

/** Non-hook entry point for dynamic mounting from a tiny controller component. */
export function mountResourceFilters(kind: ResourceKind, opts: MountOptions): Cleaner {
    if (typeof window === "undefined") return () => { };
    let cleanup: Cleaner | null = null;

    const run = () => {
        try {
            const init = STRATEGIES[kind];
            cleanup = init ? init(opts) : null;
        } catch (e) {
            console.error(`[useResourceFilters] failed to init for kind="${kind}"`, e);
        }
    };

    // Mount on idle-after-hydration to reduce render blocking
    if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(run, { timeout: 1200 });
    } else {
        setTimeout(run, 0);
    }

    return () => {
        try { cleanup?.(); } catch { }
        cleanup = null;
    };
}

/** Public hook: mount once per page (for direct use inside components) */
export function useResourceFilters(kind: ResourceKind, opts: MountOptions) {
    useEffect(() => {
        const dispose = mountResourceFilters(kind, opts);
        return () => { try { dispose?.(); } catch { } };
    }, [kind, JSON.stringify(opts)]);
}

// ------------------------------------------------------------
// Internals
// ------------------------------------------------------------

type Cleaner = () => void;

const MIN_Q = 2;
const norm = (s: unknown) =>
    (s ?? "")
        .toString()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

function $(sel: string, root?: ParentNode | Document | Element | null): Element | null {
    const scope: ParentNode | Document | Element = (root ?? document);
    return (scope as any).querySelector(sel);
}
function $$(sel: string, root?: ParentNode | Document | Element | null): Element[] {
    const scope: ParentNode | Document | Element = (root ?? document);
    return Array.from((scope as any).querySelectorAll(sel));
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
    handler: (ev: DocumentEventMap[K]) => any,
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
function isOurInput(el: any, selectorOrId: string): el is HTMLInputElement {
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
    const urlKeys = (opts.urlKeys || {}) as Record<string, string>;
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

    function renderChips() {
        const wrap = getChipsWrap();
        if (!wrap) return;
        const list = Array.from(selected);
        (wrap as HTMLElement).innerHTML = "";
        if (!list.length) { wrap.classList.add("hidden"); return; }
        wrap.classList.remove("hidden");
        for (const name of list) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "inline-flex items-center gap-1 rounded-full border border-[--brand-orange] bg-white px-3 py-1 text-sm";
            btn.setAttribute("data-chip", name);
            btn.innerHTML = `<span>${name}</span><span aria-hidden="true" class="text-slate-500">×</span>`;
            btn.addEventListener("click", () => {
                selected.delete(name);
                const pillsWrap = getPillsWrap();
                const pill = pillsWrap?.querySelector(`[data-cat="${cssEscape(name)}"]`);
                if (pill) setPillPressed(pill, false);
                filterNow();
                renderChips();
            });
            wrap.appendChild(btn);
        }
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
            const rc = getResultCount(); if (rc) rc.textContent = String(visible);
            const nr = getNoResults(); if (nr) nr.classList.toggle("hidden", visible !== 0);
        });
        // URL sync (q + categories as CSV)
        const catsCsv = Array.from(selected).join(",");
        syncUrl({
            [keys.q]: (q.trim().length >= MINQ ? q.trim() : null) as any,
            [keys.cat]: catsCsv || null,
        } as any);
    }

    // URL init (q + categories)
    try {
        const url = new URL(window.location.href);
        q = (url.searchParams.get(keys.q) || "").trim();
        const si = getSearch(); if (si) si.value = q;

        // categories from URL
        const catsCsv = (url.searchParams.get(keys.cat) || "")
            .split(",").map((s) => s.trim()).filter(Boolean);
        catsCsv.forEach((c) => selected.add(c));

        // reflect pressed pills (All if none)
        $$("#blog-pills button[data-cat]").forEach((b) => {
            const name = b.getAttribute("data-cat") || "";
            const pressed = name === "__all__" ? selected.size === 0 : selected.has(name);
            setPillPressed(b, pressed);
        });
    } catch { }
    try {
        const run = () => prewarmBlogBodies(getGrid());
        if ("requestIdleCallback" in window) { (window as any).requestIdleCallback(run, { timeout: 600 }); }
        else { setTimeout(run, 0); }
    } catch { }

    // Robust input handler: read from event target (the actual node that fired)
    const offInput = on(
        'input',
        (ev) => {
            const t = ev.target as any;
            if (!isOurInput(t, sel.query)) return;
            const next = t.value ?? '';
            if (next === q) return;
            q = next;
            filterNow();
        },
        { capture: true }
    );

    const offClick = on("click", (e) => {
        const t = e.target as Element;

        // Reset buttons
        if ((t as HTMLElement).id === "blog-clear" || (t as HTMLElement).id === "blog-clear-2") {
            e.preventDefault();
            q = "";
            const si = getSearch(); if (si) si.value = "";
            selected.clear();
            // reflect pills: All on, others off
            $$("#blog-pills button[data-cat]").forEach((b) => {
                setPillPressed(b, b.getAttribute("data-cat") === "__all__");
            });
            renderChips();
            filterNow();
            return;
        }

        // Category pills
        const btn = t.closest?.("button[data-cat]");
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
        renderChips();
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
            if (rerun) queueMicrotask(filterNow);
        });
        // Observe the grid itself; subtree:true lets us see attribute changes on descendants too.
        mo.observe(grid, { attributes: true, attributeFilter: ["data-loading"], childList: true, subtree: true });
    }

    // initial
    filterNow();
    renderChips();

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
    const urlKeys = (opts.urlKeys || {}) as Record<string, string>;
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

    function ensureTitleTaxesNorm(card: Element) {
        let v = card.getAttribute("data-titlecats-norm");
        if (v != null) return v;
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
    function matches(card: Element, qIn: string) {
        const phrase = norm(qIn);
        if (phrase.length < MINQ) return true;
        if (ensureTitleTaxesNorm(card).includes(phrase)) return true;
        const ex = ensureExcerptNorm(card);
        if (!ex) return false; // exclude if description missing
        return ex.includes(phrase);
    }
    function cardMatchesGroups(card: Element) {
        const groups: (keyof typeof selected)[] = ["mt", "rc", "sa"];
        for (const g of groups) {
            const set = selected[g];
            if (!set.size) continue; // no constraint for this group
            const own = new Set((card.getAttribute(`data-${g}`) || "").split(",").map(s => s.trim()).filter(Boolean));
            let ok = false; for (const v of Array.from(set)) { if (own.has(v)) { ok = true; break; } }
            if (!ok) return false;
        }
        return true;
    }

    function renderChips() {
        const wrap = getChips(); if (!wrap) return;
        (wrap as HTMLElement).innerHTML = "";
        const chips: { group: keyof typeof selected; slug: string; label: string }[] = [];
        for (const [group, set] of Object.entries(selected) as [keyof typeof selected, Set<string>][]) {
            set.forEach((slug) => {
                const btn = document.querySelector(`button[data-group="${group}"][data-slug="${cssEscape(slug)}"]`);
                const label = btn ? (btn.textContent || slug).replace(/\s*\(\d+\)\s*$/, "") : slug;
                chips.push({ group, slug, label });
            });
        }
        if (!chips.length) { wrap.classList.add("hidden"); return; }
        wrap.classList.remove("hidden");
        for (const c of chips) {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "inline-flex items-center gap-1 rounded-full border border-[--brand-orange] bg-white px-3 py-1 text-sm";
            chip.setAttribute("data-chip", c.slug);
            chip.setAttribute("data-group", c.group);
            chip.innerHTML = `<span>${c.label}</span><span aria-hidden="true" class="text-slate-500">×</span>`;
            chip.addEventListener("click", () => {
                selected[c.group].delete(c.slug);
                const pill = document.querySelector(`button[data-group="${c.group}"][data-slug="${cssEscape(c.slug)}"]`);
                if (pill) setPillPressed(pill, false);
                renderChips();
                filterNow();
            });
            wrap.appendChild(chip);
        }
    }

    function filterNow() {
        const grid = getGrid();
        const skeleton = getSkeleton();
        withLoading(grid, skeleton, () => {
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
            const rc = getResultCount(); if (rc) rc.textContent = String(visible);
            const nr = getNoResults(); const qs = getQuerySpan();
            if (nr && qs) {
                if (q.trim().length >= MINQ && visible === 0) { nr.classList.remove("hidden"); qs.textContent = `“${q.trim()}”`; }
                else { nr.classList.add("hidden"); qs.textContent = ""; }
            }
            // URL sync
            const toCsv = (s: Set<string>) => Array.from(s).join(",");
            syncUrl({
                [keys.q]: (q.trim().length >= MINQ ? q.trim() : null) as any,
                [keys.mt]: toCsv(selected.mt) || null,
                [keys.rc]: toCsv(selected.rc) || null,
                [keys.sa]: toCsv(selected.sa) || null,
            } as any);
        });
    }

    // Init from URL
    try {
        const url = new URL(window.location.href);
        q = (url.searchParams.get(keys.q) || "").trim();
        const si = getSearch(); if (si) si.value = q;
        const csv = (k: string) => (url.searchParams.get(k) || "").split(",").map((s) => s.trim()).filter(Boolean);
        for (const s of csv(keys.mt)) selected.mt.add(s);
        for (const s of csv(keys.rc)) selected.rc.add(s);
        for (const s of csv(keys.sa)) selected.sa.add(s);
        // reflect pills
        document.querySelectorAll("button[data-group][data-slug]").forEach((btn) => {
            const g = btn.getAttribute("data-group") as keyof typeof selected | null;
            const s = btn.getAttribute("data-slug") || "";
            if (!g) return;
            setPillPressed(btn, selected[g].has(s));
        });
    } catch { }

    const offInput = on('input', (ev) => {
        const t = ev.target as any;
        if (!isOurInput(t, sel.query)) return;
        q = t.value || '';
        filterNow();
    }, { capture: true });

    const offClick = on("click", (ev) => {
        const el = ev.target as Element;
        if ((el as HTMLElement).id === "project-clear") {
            ev.preventDefault();
            q = ""; const si = getSearch(); if (si) si.value = "";
            selected.mt.clear(); selected.rc.clear(); selected.sa.clear();
            document.querySelectorAll("button[data-group][data-slug]").forEach((b) => setPillPressed(b, false));
            renderChips();
            filterNow();
            return;
        }
        const btn = el.closest?.("button[data-group][data-slug]");
        if (!btn) return;
        ev.preventDefault();
        const group = (btn.getAttribute("data-group") || "") as keyof typeof selected;
        const slug = btn.getAttribute("data-slug") || "";
        const set = selected[group];
        if (!set) return;
        if (set.has(slug)) { set.delete(slug); setPillPressed(btn, false); }
        else { set.add(slug); setPillPressed(btn, true); }
        renderChips();
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
                    if (val === "false") { queueMicrotask(filterNow); }
                }
            }
        });
        mo.observe(grid, { attributes: true, attributeFilter: ["data-loading"], childList: true, subtree: true });
    }

    // initial
    renderChips();
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
    const urlKeys = (opts.urlKeys || {}) as Record<string, string>;
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
    let q = "";

    function ensureTitleCatsNorm(card: Element, section?: Element | null) {
        let v = card.getAttribute("data-titlecats-norm");
        if (v != null) return v;
        const title = card.getAttribute("data-title") || "";
        const cats = card.getAttribute("data-cats") || "";
        const bucketName = section?.getAttribute("data-section-title") || "";
        v = norm([title, cats, bucketName].join(" "));
        card.setAttribute("data-titlecats-norm", v);
        return v;
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
        for (const g of ["mt", "sa"] as const) {
            const set = selected[g];
            if (!set.size) continue;
            const own = new Set((card.getAttribute(`data-${g}`) || "").split(",").map((s) => s.trim()).filter(Boolean));
            let ok = false; for (const s of Array.from(set)) { if (own.has(s)) { ok = true; break; } }
            if (!ok) return false;
        }
        return true;
    }

    function renderChips() {
        const wrap = getChips(); if (!wrap) return;
        (wrap as HTMLElement).innerHTML = "";
        const chips: { group: "bk" | "mt" | "sa"; slug: string; label: string }[] = [];
        document.querySelectorAll("button[data-group][data-slug]").forEach((b) => {
            const group = b.getAttribute("data-group") as "bk" | "mt" | "sa" | null;
            const slug = b.getAttribute("data-slug") || "";
            const pressed = b.getAttribute("aria-pressed") === "true";
            if (!group || !pressed) return;
            const label = (b.textContent || slug).replace(/\s*\(\d+\)\s*$/, "");
            chips.push({ group, slug, label });
        });
        if (!chips.length) { wrap.classList.add("hidden"); return; }
        wrap.classList.remove("hidden");
        for (const c of chips) {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "inline-flex items-center gap-1 rounded-full border border-[--brand-orange] bg-white px-3 py-1 text-sm";
            chip.setAttribute("data-chip", c.slug);
            chip.setAttribute("data-group", c.group);
            chip.innerHTML = `<span>${c.label}</span><span aria-hidden="true" class="text-slate-500">×</span>`;
            chip.addEventListener("click", () => {
                const btn = document.querySelector(`button[data-group="${c.group}"][data-slug="${cssEscape(c.slug)}"]`);
                if (btn) { btn.setAttribute("aria-pressed", "false"); setPillPressed(btn, false); }
                (selected as any)[c.group].delete(c.slug);
                renderChips();
                filterNow();
            });
            wrap.appendChild(chip);
        }
    }

    function filterNow() {
        const wrap = getWrap();
        const skeleton = getSkeleton();
        withLoading(wrap, skeleton, () => {
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
            const rc = getResultCount(); if (rc) rc.textContent = String(total);
            const nr = getNoResults(); const qs = getQuerySpan();
            if (nr && qs) {
                if (q.trim().length >= MINQ && total === 0) { nr.classList.remove("hidden"); qs.textContent = `“${q.trim()}”`; }
                else { nr.classList.add("hidden"); qs.textContent = ""; }
            }
            // URL sync
            const toCsv = (s: Set<string>) => Array.from(s).join(",");
            syncUrl({
                [keys.q]: (q.trim().length >= MINQ ? q.trim() : null) as any,
                [keys.bk]: toCsv(selected.bk) || null,
                [keys.mt]: toCsv(selected.mt) || null,
                [keys.sa]: toCsv(selected.sa) || null,
            } as any);
        });
    }

    // Init from URL
    try {
        const url = new URL(window.location.href);
        q = (url.searchParams.get(keys.q) || "").trim();
        const si = getSearch(); if (si) si.value = q;
        const csv = (k: string) => (url.searchParams.get(k) || "").split(",").map((s) => s.trim()).filter(Boolean);
        for (const s of csv(keys.bk)) selected.bk.add(s);
        for (const s of csv(keys.mt)) selected.mt.add(s);
        for (const s of csv(keys.sa)) selected.sa.add(s);

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
            setPillPressed(b, (selected as any)[group].has(slug));
        });

        updateProjectOnlyGroupsVisibility();
    } catch { }

    const offInput = on('input', (e) => {
        const t = e.target as any;
        if (!isOurInput(t, sel.query)) return;
        q = t.value || '';
        filterNow();
    }, { capture: true });

    const offClick = on("click", (e) => {
        const t = e.target as Element;
        if ((t as HTMLElement).id === "video-clear") {
            e.preventDefault();
            q = ""; const si = getSearch(); if (si) si.value = "";
            selected.bk.clear(); selected.mt.clear(); selected.sa.clear();
            document.querySelectorAll("button[data-group][data-slug]").forEach((b) => setPillPressed(b, false));
            updateProjectOnlyGroupsVisibility();
            renderChips();
            filterNow();
            return;
        }

        const btn = t.closest?.("button[data-group][data-slug]");
        if (!btn) return;
        e.preventDefault();
        const group = btn.getAttribute("data-group") as "bk" | "mt" | "sa" | null;
        const slug = btn.getAttribute("data-slug") || "";
        if (!group) return;

        // Toggle
        const set = (selected as any)[group] as Set<string>;
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

        renderChips();
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
            if (rerun) queueMicrotask(filterNow);
        });
        mo.observe(wrap, { attributes: true, attributeFilter: ["data-loading"], childList: true, subtree: true });
    }

    // initial
    renderChips();
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
    const urlKeys = (opts.urlKeys || {}) as Record<string, string>;
    const keys = { q: urlKeys.q ?? "q" };
    const MINQ = opts.minQueryLen ?? MIN_Q;

    const getSearch = () => $(sel.query) as HTMLInputElement | null;
    const getTopics = () => $$("#faq-topics details.faq-topic");
    const getItems = (root?: Element | null) => $$(".faq-item", root || document);
    const getResultCount = () => (sel.resultCount ? $(sel.resultCount) : $("#faq-result-count"));
    const getNoResults = () => (sel.noResults ? $(sel.noResults) : $("#faq-no-results"));
    const getQuerySpan = () => $("#faq-query");
    const getSugWrap = () => $("#faq-suggestions");
    const getSugList = () => $("#faq-suggestion-list");
    const getExpandBtn = () => $("#faq-expand-all");
    const getCollapseBtn = () => $("#faq-collapse-all");

    // Initialize from URL (q)
    try {
      const url = new URL(window.location.href);
      const q0 = (url.searchParams.get(keys.q) || "").trim();
      const si = getSearch();
      if (si) si.value = q0;
    } catch {}

    function ensureTitleNorm(el: Element) { let v = el.getAttribute("data-title-norm"); if (v != null) return v; v = norm(el.getAttribute("data-title") || ""); el.setAttribute("data-title-norm", v); return v; }
    function ensureTopicNorm(el: Element) { let v = el.getAttribute("data-topic-norm"); if (v != null) return v; v = norm(el.getAttribute("data-topic") || ""); el.setAttribute("data-topic-norm", v); return v; }
    function ensureExcerptNorm(el: Element) { let v = el.getAttribute("data-excerpt-norm"); if (v != null) return v; v = norm(el.getAttribute("data-excerpt") || ""); el.setAttribute("data-excerpt-norm", v); return v; }

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
        if (!tokens.length) return [] as { title: string; href: string }[];
        const seen = new Set<string>();
        const out: { title: string; href: string }[] = [];
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
        syncUrl({ [keys.q]: (q.trim().length >= MINQ ? q.trim() : null) as any } as any);
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

    function expandAll() { getTopics().forEach((t) => { if ((t as HTMLElement).style.display === "none") return; (t as HTMLDetailsElement).open = true; }); }
    function collapseAll() { getTopics().forEach((t) => { if ((t as HTMLElement).style.display === "none") return; (t as HTMLDetailsElement).open = false; }); }

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
        if (nr && qs && sw && sl) {
            if (q.trim().length >= MINQ && totalVisible === 0) {
                nr.classList.remove("hidden");
                qs.textContent = `“${q.trim()}”`;
                // Suggestions
                const sugg = buildSuggestions(getItems(), q);
                if (sugg.length) {
                    sw.classList.remove("hidden");
                    (sl as HTMLElement).innerHTML = "";
                    for (const s of sugg) {
                        const li = document.createElement("li");
                        li.innerHTML = `<a href="${s.href}" class="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm hover:bg-slate-50">${s.title}</a>`;
                        sl.appendChild(li);
                    }
                } else { sw.classList.add("hidden"); (sl as HTMLElement).innerHTML = ""; }
            } else {
                nr.classList.add("hidden"); qs.textContent = ""; sw.classList.add("hidden"); (sl as HTMLElement).innerHTML = "";
            }
        }
        syncQ(q);
    }

    const offInput = on('input', (e) => {
        const t = e.target as any;
        if (!isOurInput(t, sel.query)) return;
        filterNow();
    }, { capture: true });

    const offSubmit = on("submit", (e) => {
        const form = e.target as HTMLElement;
        if (!(form instanceof HTMLFormElement)) return;
        if ($("#faq-search", form)) e.preventDefault();
    });

    const offClick = on("click", (e) => {
        const t = e.target as Element;
        if (t.closest && t.closest("#faq-expand-all")) { e.preventDefault(); expandAll(); return; }
        if (t.closest && t.closest("#faq-collapse-all")) { e.preventDefault(); collapseAll(); return; }
    });

    // initial
    filterNow();
    applyHashOpen();

    return () => { offInput(); offSubmit(); offClick(); };
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
    try { return (window as any).CSS?.escape ? (window as any).CSS.escape(s) : s; } catch { return s; }
}

export default useResourceFilters;
