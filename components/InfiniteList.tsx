"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { PageResult, ResourceKind, ResourceQuery } from "@/lib/pagination";
import { fetchPage, getCachedPages, setCachedPages } from "@/lib/resource-fetch";
import { useIntersection } from "./useIntersection";
import GridLoadingState from "@/components/layout/GridLoadingState";

import SmartLink from "@/components/SmartLink";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { stripHtml } from "@/lib/wp";
import { lineClampStyle, truncateText } from "@/components/archive/card-utils";
import MediaFrame from "./MediaFrame";

type Props<T> = {
    kind: ResourceKind;
    initial: PageResult<T>;          // first SSR page
    filters: Record<string, unknown>; // from your page state
    pageSize?: number;               // default 24
    gridClass?: string;              // tailwind grid classes
    renderItem?: (item: T, i: number) => React.ReactNode;
    skeletonCount?: number;
    onVideoOpen?: (item: T) => void; // optional: scoped video open handler
    onVisibleCountChange?: (count: number) => void;
    onTotalChange?: (total: number) => void;
};

const Frame: React.FC<{
    src?: string;
    alt?: string;
    ratio?: `${number} / ${number}`;
    className?: string;
    sizes?: string;
    priority?: boolean;
}> = ({ src, alt = "", ratio = '16 / 9', className, sizes, priority }) => {
    if (!src) return <div className={className} style={{ aspectRatio: ratio }} />;
    return (
        <MediaFrame
            src={src}
            alt={alt}
            ratio={ratio}
            className={className}
            sizes={sizes}
            priority={priority}
        />
    );
};

export default function InfiniteList<T>({
    kind,
    initial,
    filters,
    pageSize = 24,
    gridClass = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4",
    renderItem,
    skeletonCount,
    onVideoOpen,
    onVisibleCountChange,
    onTotalChange,
}: Props<T>) {
    // Compose the stable query key for cache
    const baseQuery: ResourceQuery = useMemo(() => ({ first: pageSize, filters }), [pageSize, filters]);
    const serializedFilters = useMemo(() => JSON.stringify(baseQuery.filters ?? {}), [baseQuery.filters]);
    const initialPages = useMemo(() => [initial], [initial]);

    // Pull any cached pages for these filters; seed with initial if empty
    const [pages, setPages] = useState<PageResult<T>[]>(() => {
        const cached = getCachedPages(kind, baseQuery);
        return cached.length ? cached : initialPages;
    });
    const [loading, setLoading] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    // When filters/pageSize change, reset to initial
    useEffect(() => {
        setPages(initialPages);
        setCachedPages(kind, baseQuery, initialPages);
        // cancel in-flight
        if (abortRef.current) abortRef.current.abort();
    }, [kind, baseQuery.first, serializedFilters, initialPages]); // eslint-disable-line react-hooks/exhaustive-deps

    const items = pages.flatMap(p => p.items);
    useEffect(() => {
        if (typeof onVisibleCountChange === "function") {
            onVisibleCountChange(items.length);
        }
    }, [items.length, onVisibleCountChange]);

    const derivedTotal = useMemo(() => {
        for (let i = pages.length - 1; i >= 0; i -= 1) {
            const candidate = (pages[i] as any)?.total;
            if (typeof candidate === "number") return candidate;
        }
        return null;
    }, [pages]);

    useEffect(() => {
        if (typeof onTotalChange === "function" && typeof derivedTotal === "number") {
            onTotalChange(derivedTotal);
        }
    }, [derivedTotal, onTotalChange]);

    const lastPage = pages[pages.length - 1];
    const hasMore = !!lastPage?.pageInfo?.hasNextPage;
    const after = lastPage?.pageInfo?.endCursor ?? null;

    const [rootMargin, setRootMargin] = useState("600px");
    useEffect(() => {
        const choose = () =>
            typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
                ? "800px"
                : "400px";
        const apply = () => setRootMargin(choose());
        apply();
        window.addEventListener("resize", apply);
        return () => window.removeEventListener("resize", apply);
    }, []);

    const { ref: sentinelRef, intersecting } = useIntersection<HTMLDivElement>({ root: null, rootMargin });
    // Prevent rapid-fire loads while the sentinel remains intersecting
    const firedRef = useRef(false);
    useEffect(() => {
        if (!intersecting) {
            firedRef.current = false; // re-arm once sentinel leaves viewport
        }
    }, [intersecting]);
    // Match the loading shimmer to page size (capped at 12)
    const skeletonCountEff = typeof skeletonCount === "number" ? skeletonCount : Math.min(pageSize, 12);

    useEffect(() => {
        if (!intersecting || !hasMore || loading || firedRef.current) return;

        firedRef.current = true; // only fire once per intersecting period
        setLoading(true);
        const ac = new AbortController();
        abortRef.current = ac;

        fetchPage<T>(kind, { ...baseQuery, after }, ac.signal)
            .then((next) => {
                const nextPages = [...pages, next];
                setPages(nextPages);
                setCachedPages(kind, baseQuery, nextPages);
            })
            .catch((e) => {
                if (e.name !== "AbortError") console.warn(`[InfiniteList] fetch error:`, e);
            })
            .finally(() => {
                if (abortRef.current === ac) abortRef.current = null;
                setLoading(false);
            });
    }, [intersecting, hasMore, loading, kind, after, baseQuery, pages]);

    // Choose an effective renderer. If none provided and kind === 'blog', use a built-in card renderer
    const effectiveRender = useMemo(() => {
        if (renderItem) return renderItem;
        if (kind === "blog") {
            return (p: any) => {
                const date = new Date(p?.date);
                const dateLabel = isNaN(date.getTime())
                    ? ""
                    : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
                const href = "/" + (p?.slug || "");
                const rawHtml = String(p?.excerpt || "");
                const catList = (p?.categories || []).join(", ");
                const summarySource = p?.contentPlain || stripHtml(rawHtml);
                const summary = truncateText(summarySource, 260);
                return (
                    <article
                        data-title={p?.title || ""}
                        data-cats={catList}
                        data-body=""
                        data-body-ready="0"
                        className="blog-card"
                    >
                        <template className="blog-body-src" dangerouslySetInnerHTML={{ __html: rawHtml }} />
                        <SmartLink href={href} className="group block" data-icon-affordance="right">
                            <Card className="overflow-hidden hover:shadow-lg transition">
                                <CardHeader className="px-5 pb-5 pt-5 sm:px-6 sm:pt-6">
                                    <CardTitle className="font-semibold">{p?.title}</CardTitle>
                                </CardHeader>
                                {p?.featuredImage?.url ? (
                                    <Frame
                                        src={p?.featuredImage?.url}
                                        alt={p?.featuredImage?.altText ?? p?.title}
                                        ratio="16 / 9"
                                        className="w-full"
                                        sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                                    />
                                ) : (
                                    <div className="w-full bg-gradient-to-r from-[#0045d7] to-[#00e3fe]" />
                                )}
                                <CardContent className="px-5 pb-4 pt-5 sm:px-6 sm:pb-6">
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                                        {dateLabel && <span>{dateLabel}</span>}
                                    </div>
                                    {summary && (
                                        <p className="mt-3 text-sm text-slate-600" style={lineClampStyle}>
                                            {summary}
                                        </p>
                                    )}
                                    {(p?.categories?.length ?? 0) > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {p.categories.map((cat: string) => (
                                                <span
                                                    key={cat}
                                                    className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                                                >
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="flex items-center justify-between border-t border-slate-100/60 bg-slate-50/40 px-5 py-4 text-[#0045d7] sm:px-6">
                                    <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight">
                                        Read full article
                                        <ArrowRight className="icon-affordance h-4 w-4" aria-hidden="true" />
                                    </span>
                                </CardFooter>
                            </Card>
                        </SmartLink>
                    </article>
                );
            };
        } else if (kind === "video") {
            return (v: any, i: number) => {
                const safeKey = v?.id ?? v?.slug ?? v?.youtubeId ?? i;
                const safeSlug = (v?.slug || v?.id || v?.youtubeId || String(safeKey)) as string;
                const cats: any[] = Array.isArray(v?.categories) ? v.categories : [];
                const catNames = cats.map((c: any) => c?.name).filter(Boolean).join(", ");
                const bucketSlugs = cats.map((c: any) => (c?.slug || c?.name || "")).filter(Boolean).join(",");
                const mt = Array.isArray(v?.materialTypes) ? v.materialTypes.map((t: any) => t?.slug).filter(Boolean).join(",") : "";
                const sa = Array.isArray(v?.serviceAreas) ? v.serviceAreas.map((t: any) => t?.slug).filter(Boolean).join(",") : "";

                const handleOpen = (e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onVideoOpen) onVideoOpen(v);
                    // Always announce a normalized slug so page-level URL logic can update ?v=
                    if (typeof window !== "undefined") {
                        try { window.dispatchEvent(new CustomEvent("video:open", { detail: { slug: safeSlug } })); } catch {}
                    }
                };

                const description = truncateText(stripHtml(String(v?.excerpt ?? "")), 220);

                return (
                    <div className="vid-item group block" data-video-slug={safeSlug}>
                        <Card
                            className="vid-card overflow-hidden transition hover:shadow-lg"
                            data-title={v?.title || ""}
                            data-cats={catNames}
                            data-bucket={bucketSlugs}
                            data-mt={mt}
                            data-sa={sa}
                        >
                            <CardHeader>
                                <CardTitle className="font-medium">{v?.title}</CardTitle>
                            </CardHeader>

                            <button
                                type="button"
                                aria-label={`Play ${v?.title || "video"}`}
                                onClick={handleOpen}
                                data-video-slug={safeSlug}
                                className="relative block w-full"
                            >
                                <Frame
                                    src={v.thumbnailUrl}
                                    alt={v.title}
                                    ratio="16 / 9"
                                    className="w-full"
                                    sizes="(min-width: 1024px) 50vw, 100vw"
                                />
                                <span className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/15">
                                    <span className="grid place-items-center rounded-full bg-white/90 p-4 shadow-md">
                                        <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 fill-slate-900">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </span>
                                </span>
                            </button>

                                <CardContent className="px-5 pb-4 pt-5 sm:px-6 sm:pb-6">
                                    {description && (
                                        <p className="text-sm text-slate-600" style={lineClampStyle}>
                                            {description}
                                        </p>
                                    )}

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {cats.map((c: any) => (
                                            <span
                                                key={`${safeKey}-${c.slug ?? c.name}`}
                                                className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                                            >
                                                {c.name}
                                            </span>
                                        ))}
                                    </div>

                                    {v?.source === "project" && v?.slug ? (
                                        <div className="mt-3">
                                            <SmartLink
                                                href={`/project/${v.slug}`}
                                                className="text-sm font-medium text-[#0045d7] hover:underline"
                                            >
                                                See full project details
                                            </SmartLink>
                                        </div>
                                    ) : null}
                                </CardContent>
                                <CardFooter className="flex items-center justify-between border-t border-slate-100/60 bg-slate-50/40 px-5 py-4 text-[#0045d7] sm:px-6">
                                    <button
                                        type="button"
                                        onClick={handleOpen}
                                        data-video-slug={safeSlug}
                                        className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight focus-visible:outline-none"
                                        data-icon-affordance="right"
                                    >
                                        Watch video
                                        <ArrowRight className="icon-affordance h-4 w-4" aria-hidden="true" />
                                    </button>
                                </CardFooter>
                            </Card>

                        <template className="vid-body-src" suppressHydrationWarning>
                            {(v?.excerpt ?? "").toString()}
                        </template>
                    </div>
                );
            };
        } else if (kind === "project") {
            return (p: any, i: number) => {
                const key = p?.slug ?? p?.id ?? i;
                const mt = Array.isArray(p?.materialTypes) ? p.materialTypes : [];
                const rc = Array.isArray(p?.roofColors) ? p.roofColors : [];
                const sa = Array.isArray(p?.serviceAreas) ? p.serviceAreas : [];
                const taxes = [...mt, ...rc, ...sa]
                    .map((t: any) => t?.name)
                    .filter(Boolean)
                    .join(", ");

                const mtSlugs = mt.map((t: any) => t?.slug).filter(Boolean).join(",");
                const rcSlugs = rc.map((t: any) => t?.slug).filter(Boolean).join(",");
                const saSlugs = sa.map((t: any) => t?.slug).filter(Boolean).join(",");
                const searchBody = (p?.projectDescription ?? p?.excerpt ?? "").toString();
                const projectSummary = truncateText(stripHtml(searchBody), 260);

                const href = p?.uri || (p?.slug ? `/project/${p.slug}` : "#");
                const img = p?.heroImage;

                return (
                    <div className="proj-item group block" data-key={key}>
                        <SmartLink href={href} className="group block rounded-2xl focus-visible:outline-none" data-icon-affordance="right">
                            <Card
                                className="proj-card overflow-hidden hover:shadow-lg transition"
                                data-title={(p?.title || "").toString()}
                                data-taxes={taxes}
                                data-mt={(mtSlugs || "").toString()}
                                data-rc={(rcSlugs || "").toString()}
                                data-sa={(saSlugs || "").toString()}
                            >
                                <CardHeader className="px-5 pb-5 pt-5 sm:px-6 sm:pt-6">
                                    <CardTitle className="font-semibold">{p?.title}</CardTitle>
                                </CardHeader>

                                {img?.url ? (
                                    <Frame
                                        src={p.heroImage?.url}
                                        alt={p.heroImage?.altText ?? p.title}
                                        ratio="16 / 10"
                                        className="w-full"
                                        sizes="(min-width: 1024px) 50vw, 100vw"
                                    />
                                ) : (
                                    <div className="w-full bg-gradient-to-r from-[#0045d7] to-[#00e3fe]" />
                                )}

                                <CardContent className="px-5 pb-4 pt-5 sm:px-6 sm:pb-6">
                                    {projectSummary && (
                                        <p className="text-sm text-slate-600" style={lineClampStyle}>
                                            {projectSummary}
                                        </p>
                                    )}

                                    {(mt.length + rc.length + sa.length > 0) && (
                                        <div className="relative mt-4 -mx-5 sm:mx-0">
                                            <div className="flex flex-nowrap gap-2 overflow-x-auto px-5 pb-2 scrollbar-none sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                                                {mt.map((t: any) => (
                                                    <span
                                                        key={`mtb-${key}-${t?.slug}`}
                                                        className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 sm:px-3 sm:py-1 sm:text-sm"
                                                    >
                                                        {t?.name}
                                                    </span>
                                                ))}
                                                {sa.map((t: any) => (
                                                    <span
                                                        key={`sab-${key}-${t?.slug}`}
                                                        className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 sm:px-3 sm:py-1 sm:text-sm"
                                                    >
                                                        {t?.name}
                                                    </span>
                                                ))}
                                                {rc.map((t: any) => (
                                                    <span
                                                        key={`rcb-${key}-${t?.slug}`}
                                                        className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 sm:px-3 sm:py-1 sm:text-sm"
                                                    >
                                                        {t?.name}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="pointer-events-none absolute inset-y-1 left-0 w-6 bg-gradient-to-r from-white to-transparent sm:hidden" />
                                            <div className="pointer-events-none absolute inset-y-1 right-0 w-6 bg-gradient-to-l from-white to-transparent sm:hidden" />
                                        </div>
                                    )}
                                </CardContent>

                                <CardFooter className="flex items-center justify-between border-t border-slate-100/60 bg-slate-50/40 px-5 py-4 text-[#0045d7] sm:px-6">
                                    <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight">
                                        View project
                                        <ArrowRight className="icon-affordance h-4 w-4" aria-hidden="true" />
                                    </span>
                                </CardFooter>
                            </Card>
                        </SmartLink>

                        {/* Optional: body/excerpt for client-side phrase search. If not present, your page script should gracefully skip. */}
                        <template className="proj-body-src" suppressHydrationWarning>
                            {searchBody}
                        </template>
                    </div>
                );
            };
        }
        // Fallback renderer if none given and kind is not recognized
        return (it: any, i: number) => <div />;
    }, [renderItem, kind, onVideoOpen]);

    return (
        <>
            <div className={gridClass} data-loading={loading ? "true" : "false"}>
                {items.map((it, i) => {
                const key = (it as any).slug ?? (it as any).id ?? i;
                const uniqueKey = `${String(key)}-${i}`;
                return (
                    <Fragment key={uniqueKey}>
                            {effectiveRender(it, i)}
                        </Fragment>
                    );
                })}
            </div>

            {/* Loading shimmer while fetching next page */}
            {loading && <GridLoadingState variant="project" count={skeletonCountEff} />}

            {/* Intersection sentinel */}
            <div ref={sentinelRef} aria-hidden="true" />

            {/* Optional: when there’s no more content, you can render a footer message */}
            {!hasMore && items.length > 0 ? (
                <div className="mt-6 text-center text-sm text-slate-500">You’ve reached the end.</div>
            ) : null}
        </>
    );
}
