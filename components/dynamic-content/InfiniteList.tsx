"use client";

import Image from "next/image";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import type { PageResult, ResourceKind, ResourceQuery } from "@/lib/ui/pagination";
import type { PostCard, ProjectSummary, VideoItem } from "@/lib/content/wp";
import { fetchPage, getCachedPages, setCachedPages } from "@/lib/content/resource-fetch";
import { useIntersection } from "@/lib/ui/useIntersection";
import GridLoadingState from "@/components/layout/GridLoadingState";
import Grid from "@/components/layout/Grid";

import SmartLink from "@/components/utils/SmartLink";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { stripHtml } from "@/lib/content/wp";
import { lineClampStyle, truncateText } from "@/components/dynamic-content/card-utils";
import { buildBlogPostHref, buildProjectHref, buildProjectHrefFromUri, ROUTES } from "@/lib/routes";

const smallPillClass =
    "inline-flex min-w-0 max-w-full items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700";
const largePillClass =
    "inline-flex min-w-0 max-w-full items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 sm:px-3 sm:py-1 sm:text-sm";
const pillLabelClass = "block max-w-full truncate";

type Props<T> = {
    kind: ResourceKind;
    initial: PageResult<T>;
    filters: Record<string, unknown>;
    pageSize?: number;
    gridClass?: string;
    renderItem?: (item: T, i: number) => ReactNode;
    skeletonCount?: number;
    onVideoOpen?: (item: T) => void;
    onVisibleCountChange?: (count: number) => void;
    onTotalChange?: (total: number) => void;
};

type RenderFn<T> = (item: T, index: number) => ReactNode;

const Frame: React.FC<{
    src?: string;
    alt?: string;
    ratio?: `${number} / ${number}`;
    className?: string;
    sizes?: string;
    priority?: boolean;
}> = ({ src, alt = "", ratio = "16 / 9", className, sizes, priority }) => {
    const style: CSSProperties = { aspectRatio: ratio };
    if (!src) return <div className={className} style={style} />;
    const wrapperClass = ["relative w-full overflow-hidden bg-slate-100", className]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={wrapperClass} style={style}>
            <Image
                fill
                src={src}
                alt={alt}
                sizes={sizes}
                priority={priority}
                className="object-cover"
            />
        </div>
    );
};

const renderBlogItem = (post: PostCard): ReactNode => {
    const date = post.date ? new Date(post.date) : null;
    const dateLabel = date && !Number.isNaN(date.getTime())
        ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date)
        : "";
    const href = buildBlogPostHref(post.slug) ?? ROUTES.blog;
    const rawHtml = String(post.excerpt ?? "");
    const categories = post.categories ?? [];
    const catList = categories.join(", ");
    const summarySource = post.contentPlain ?? stripHtml(rawHtml);
    const summary = truncateText(summarySource, 260);

    return (
        <article
            data-title={post.title}
            data-cats={catList}
            data-body=""
            data-body-ready="0"
            className="blog-card"
        >
            <template className="blog-body-src" dangerouslySetInnerHTML={{ __html: rawHtml }} />
            <SmartLink href={href} className="group block" data-icon-affordance="right">
                <Card className="overflow-hidden hover:shadow-lg transition">
                    <CardHeader className="px-5 pb-5 pt-5 sm:px-6 sm:pt-6">
                        <CardTitle className="font-semibold">{post.title}</CardTitle>
                    </CardHeader>
                    {post.featuredImage?.url ? (
                        <Frame
                            src={post.featuredImage.url}
                            alt={post.featuredImage.altText ?? post.title}
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
                        {categories.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {categories.map((category) => (
                                    <span
                                        key={category}
                                        className={smallPillClass}
                                    >
                                        <span className={pillLabelClass}>{category}</span>
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

const renderVideoItem = (
    video: VideoItem,
    index: number,
    onVideoOpen?: (item: VideoItem) => void
): ReactNode => {
    const safeKey = video.id ?? video.slug ?? video.youtubeId ?? index;
    const safeSlug = String(safeKey);
    const categories = video.categories ?? [];
    const catNames = categories.map((category) => category.name).filter(Boolean).join(", ");
    const bucketSlugs = categories
        .map((category) => category.slug ?? category.name ?? "")
        .filter((value) => value.length > 0)
        .join(",");
    const materialSlugs = (video.materialTypes ?? [])
        .map((term) => term.slug ?? "")
        .filter(Boolean)
        .join(",");
    const serviceSlugs = (video.serviceAreas ?? [])
        .map((term) => term.slug ?? "")
        .filter(Boolean)
        .join(",");
    const description = truncateText(stripHtml(String(video.excerpt ?? "")), 220);

    const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        onVideoOpen?.(video);
        if (typeof window !== "undefined") {
            try {
                window.dispatchEvent(new CustomEvent("video:open", { detail: { slug: safeSlug } }));
            } catch {
                // ignore
            }
        }
    };

    return (
        <div className="vid-item group block" data-video-slug={safeSlug}>
            <Card
                className="vid-card overflow-hidden transition hover:shadow-lg"
                data-title={video.title}
                data-cats={catNames}
                data-bucket={bucketSlugs}
                data-mt={materialSlugs}
                data-sa={serviceSlugs}
            >
                <CardHeader>
                    <CardTitle className="font-bold">{video.title}</CardTitle>
                </CardHeader>

                <button
                    type="button"
                    aria-label={`Play ${video.title || "video"}`}
                    onClick={handleOpen}
                    data-video-slug={safeSlug}
                    className="relative block w-full"
                >
                    <Frame
                        src={video.thumbnailUrl}
                        alt={video.title}
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
                        {categories.map((category) => (
                            <span
                                key={`${safeKey}-${category.slug ?? category.name}`}
                                className={smallPillClass}
                            >
                                <span className={pillLabelClass}>{category.name}</span>
                            </span>
                        ))}
                    </div>

                    {video.source === "project" && video.slug ? (
                        <div className="mt-3">
                            <SmartLink
                                href={buildProjectHref(video.slug) ?? ROUTES.project}
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
                {String(video.excerpt ?? "")}
            </template>
        </div>
    );
};

const renderProjectItem = (project: ProjectSummary, index: number): ReactNode => {
    const key = project.slug ?? project.uri ?? index;
    const materialTypes = project.materialTypes ?? [];
    const serviceAreas = project.serviceAreas ?? [];
    const roofColors = project.roofColors ?? [];
    const taxonomyNames = [...materialTypes, ...serviceAreas, ...roofColors]
        .map((term) => term?.name)
        .filter(Boolean)
        .join(", ");
    const materialSlugs = materialTypes.map((term) => term?.slug ?? "").filter(Boolean).join(",");
    const serviceSlugs = serviceAreas.map((term) => term?.slug ?? "").filter(Boolean).join(",");
    const roofSlugs = roofColors.map((term) => term?.slug ?? "").filter(Boolean).join(",");
    const searchBody = project.projectDescription ?? "";
    const projectSummary = truncateText(stripHtml(searchBody), 260);
    const href =
        buildProjectHref(project.slug) ??
        buildProjectHrefFromUri(project.uri) ??
        project.uri ??
        ROUTES.project;
    const heroImage = project.heroImage;

    return (
        <div className="proj-item group block" data-key={key}>
            <SmartLink href={href} className="group block rounded-2xl focus-visible:outline-none" data-icon-affordance="right">
                <Card
                    className="proj-card overflow-hidden hover:shadow-lg transition"
                    data-title={project.title}
                    data-taxes={taxonomyNames}
                    data-mt={materialSlugs}
                    data-rc={roofSlugs}
                    data-sa={serviceSlugs}
                >
                    <CardHeader className="px-5 pb-5 pt-5 sm:px-6 sm:pt-6">
                        <CardTitle className="font-semibold">{project.title}</CardTitle>
                    </CardHeader>

                    {heroImage?.url ? (
                        <Frame
                            src={heroImage.url}
                            alt={heroImage.altText ?? project.title}
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

                        {(materialTypes.length + serviceAreas.length + roofColors.length > 0) && (
                            <div className="relative mt-4 -mx-5 sm:mx-0">
                                <div className="flex flex-nowrap gap-2 overflow-x-auto px-5 pb-2 scrollbar-none sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                                    {materialTypes.map((term) => (
                                        <span
                                            key={`mtb-${key}-${term.slug}`}
                                            className={largePillClass}
                                        >
                                            <span className={pillLabelClass}>{term.name}</span>
                                        </span>
                                    ))}
                                    {serviceAreas.map((term) => (
                                        <span
                                            key={`sab-${key}-${term.slug}`}
                                            className={largePillClass}
                                        >
                                            <span className={pillLabelClass}>{term.name}</span>
                                        </span>
                                    ))}
                                    {roofColors.map((term) => (
                                        <span
                                            key={`rcb-${key}-${term.slug}`}
                                            className={largePillClass}
                                        >
                                            <span className={pillLabelClass}>{term.name}</span>
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

            <template className="proj-body-src" suppressHydrationWarning>
                {String(searchBody)}
            </template>
        </div>
    );
};

export default function InfiniteList<T>({
    kind,
    initial,
    filters,
    pageSize = 24,
    gridClass = "",
    renderItem,
    skeletonCount,
    onVideoOpen,
    onVisibleCountChange,
    onTotalChange,
}: Props<T>) {
    const baseQuery: ResourceQuery = useMemo(() => ({ first: pageSize, filters }), [pageSize, filters]);
    const serializedFilters = useMemo(() => JSON.stringify(baseQuery.filters ?? {}), [baseQuery.filters]);
    const initialPages = useMemo(() => [initial], [initial]);

    const [pages, setPages] = useState<PageResult<T>[]>(() => {
        const cached = getCachedPages<T>(kind, baseQuery);
        return cached.length ? cached : initialPages;
    });
    const [loading, setLoading] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        setPages(initialPages);
        setCachedPages(kind, baseQuery, initialPages);
        if (abortRef.current) abortRef.current.abort();
    }, [kind, baseQuery, serializedFilters, initialPages]);

    const items = pages.flatMap((page) => page.items);
    useEffect(() => {
        if (typeof onVisibleCountChange === "function") {
            onVisibleCountChange(items.length);
        }
    }, [items.length, onVisibleCountChange]);

    const derivedTotal = useMemo(() => {
        for (let i = pages.length - 1; i >= 0; i -= 1) {
            const candidate = pages[i]?.total;
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
    const firedRef = useRef(false);
    useEffect(() => {
        if (!intersecting) {
            firedRef.current = false;
        }
    }, [intersecting]);
    const skeletonCountEff = typeof skeletonCount === "number" ? skeletonCount : Math.min(pageSize, 12);

    useEffect(() => {
        if (!intersecting || !hasMore || loading || firedRef.current) return;

        firedRef.current = true;
        setLoading(true);
        const ac = new AbortController();
        abortRef.current = ac;

        fetchPage<T>(kind, { ...baseQuery, after }, ac.signal)
            .then((next) => {
                const nextPages = [...pages, next];
                setPages(nextPages);
                setCachedPages(kind, baseQuery, nextPages);
            })
            .catch((error: unknown) => {
                if (error instanceof Error && error.name !== "AbortError") {
                    console.warn("[InfiniteList] fetch error:", error);
                }
            })
            .finally(() => {
                if (abortRef.current === ac) abortRef.current = null;
                setLoading(false);
            });
    }, [intersecting, hasMore, loading, kind, after, baseQuery, pages]);

    const effectiveRender = useMemo<RenderFn<T>>(() => {
        if (renderItem) return renderItem;
        switch (kind) {
            case "blog":
                return (item) => renderBlogItem(item as unknown as PostCard);
            case "video":
                return (item, index) =>
                    renderVideoItem(
                        item as unknown as VideoItem,
                        index,
                        onVideoOpen as ((video: VideoItem) => void) | undefined
                    );
            case "project":
                return (item, index) => renderProjectItem(item as unknown as ProjectSummary, index);
            default:
                return () => null;
        }
    }, [renderItem, kind, onVideoOpen]);

    const resolveItemKey = (item: T, index: number): string => {
        if (kind === "blog") {
            const post = item as Partial<PostCard>;
            return (typeof post.slug === "string" && post.slug) || `blog-${index}`;
        }
        if (kind === "video") {
            const video = item as Partial<VideoItem>;
            return (
                (video.id && String(video.id)) ||
                (video.slug ?? video.youtubeId) ||
                `video-${index}`
            );
        }
        if (kind === "project") {
            const project = item as Partial<ProjectSummary>;
            return project.slug ?? project.uri ?? `project-${index}`;
        }
        const fallback = item as { slug?: unknown; id?: unknown };
        if (typeof fallback.slug === "string") return fallback.slug;
        if (typeof fallback.id === "string" || typeof fallback.id === "number") {
            return String(fallback.id);
        }
        return `${kind}-item-${index}`;
    };

    const loaderVariant = kind === "blog" ? "blog" : kind === "video" ? "video" : "project";

    return (
        <>
            <Grid className={gridClass} data-loading={loading ? "true" : "false"}>
                {items.map((item, index) => {
                    const uniqueKey = resolveItemKey(item, index);
                    return (
                        <Fragment key={uniqueKey}>
                            {effectiveRender(item, index)}
                        </Fragment>
                    );
                })}
            </Grid>

            {loading && (
                <GridLoadingState
                    variant={loaderVariant}
                    count={skeletonCountEff}
                    className={gridClass}
                />
            )}

            <div ref={sentinelRef} aria-hidden="true" />

            {!hasMore && items.length > 0 ? (
                <div className="mt-6 text-center text-sm text-slate-500">You’ve reached the end.</div>
            ) : null}
        </>
    );
}
