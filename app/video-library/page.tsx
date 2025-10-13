import Section from "@/components/layout/Section";
import ResourcesAside from "@/components/ResourcesAside";
import VideoLibraryClient from "./VideoLibraryClient";
import {
  listRecentVideoEntries,
  listProjectVideos,
  listVideoItemsPaged,
  type VideoItem,
  type TermLite,
} from "@/lib/wp";
import type { Metadata } from "next";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbSchema, collectionPageSchema } from "@/lib/seo/schema";
import { SITE_ORIGIN } from "@/lib/seo/site";

export const revalidate = 900;

const SEO_TITLE = "Video Library | SonShine Roofing";
const SEO_DESCRIPTION = "Highlights from our projects, commercials, and short video explainers.";
const CANONICAL = "/video-library";
const OG_IMAGE = "/og-default.png";
const PAGE_SIZE = 8;
const MIN_SEARCH_LENGTH = 2;

type SearchParamsRecord = Record<string, string | string[] | undefined>;
type SearchParamsPromise = Promise<SearchParamsRecord>;
const EMPTY_SEARCH_PARAMS: SearchParamsRecord = {};

type VideoWithHeroImage = VideoItem & {
  heroImage?: { url?: string | null } | null;
};

const heroImageUrl = (item: VideoItem): string | undefined => {
  if ("heroImage" in item) {
    const hero = (item as VideoWithHeroImage).heroImage;
    if (hero && typeof hero.url === "string") return hero.url;
  }
  return undefined;
};

type VideoModule = Pick<
  typeof import("@/lib/wp"),
  "getVideoEntryBySlug" | "getProjectBySlug" | "projectToVideoItem" | "videoJsonLd"
>;

const BUCKET_OPTIONS: Array<{ slug: string; label: string }> = [
  { slug: "commercials", label: "Commercials" },
  { slug: "explainers", label: "Explainers" },
  { slug: "roofing-project", label: "Roofing Projects" },
  { slug: "accolades", label: "Accolades" },
  { slug: "other", label: "Other" },
];

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: SearchParamsPromise;
}): Promise<Metadata> {
  const spObj = searchParams ? await searchParams : EMPTY_SEARCH_PARAMS;
  const vParam = Array.isArray(spObj.v) ? spObj.v[0] : spObj.v;
  const v = typeof vParam === "string" ? vParam.trim() : "";

  const defaultMeta: Metadata = {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    alternates: { canonical: CANONICAL },
    openGraph: {
      type: "website",
      title: SEO_TITLE,
      description: SEO_DESCRIPTION,
      url: CANONICAL,
      images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: SEO_TITLE,
      description: SEO_DESCRIPTION,
      images: [OG_IMAGE],
    },
  };

  if (!v) return defaultMeta;

  try {
    const mod: VideoModule = await import("@/lib/wp");
    const fn = mod.getVideoEntryBySlug;
    if (typeof fn !== "function") return defaultMeta;
    const video = await fn(v).catch(() => null);
    if (!video) return defaultMeta;

    const og = video.seo?.openGraph ?? {};
    const title = (video.seo?.title || og.title || video.title || SEO_TITLE).trim();
    const description = (video.seo?.description || og.description || SEO_DESCRIPTION).trim().slice(0, 160);
    const ogImage = og.image && typeof og.image === "object" ? og.image : null;
    const ogUrl =
      (ogImage && typeof ogImage.secureUrl === "string" && ogImage.secureUrl) ||
      (ogImage && typeof ogImage.url === "string" && ogImage.url) ||
      video.featuredImage?.url ||
      OG_IMAGE;

    return {
      title,
      description,
      alternates: { canonical: CANONICAL },
      openGraph: {
        type: "video.other" as const,
        title,
        description,
        url: `${CANONICAL}?v=${encodeURIComponent(v)}`,
        images: [{ url: ogUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogUrl],
      },
    };
  } catch {
    return defaultMeta;
  }
}

type PageProps = {
  searchParams?: SearchParamsPromise;
};

const toFirstParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
};

const toSlugArray = (value: string | string[] | undefined): string[] => {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => (typeof item === "string" ? item.split(",") : []))
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

function uniqueTermsFromVideos(items: VideoItem[], key: "materialTypes" | "serviceAreas"): TermLite[] {
  const map = new Map<string, TermLite>();
  for (const v of items) {
    const arr = v[key];
    if (!arr) continue;
    for (const t of arr) {
      const slug = String(t.slug || "").trim();
      const name = String(t.name || "").trim();
      if (!slug || !name) continue;
      if (!map.has(slug)) map.set(slug, { slug, name });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export default async function VideoLibraryPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : EMPTY_SEARCH_PARAMS;
  const rawSearch = toFirstParam(params.q).trim();
  const bucketSlugs = toSlugArray(params.bk);
  const materialSlugs = toSlugArray(params.mt).map((s) => s.toLowerCase());
  const serviceAreaSlugs = toSlugArray(params.sa).map((s) => s.toLowerCase());
  const videoSlug = toFirstParam(params.v).trim();

  const searchForQuery = rawSearch.length >= MIN_SEARCH_LENGTH ? rawSearch : undefined;

  const filters: Record<string, unknown> = {
    q: searchForQuery,
  };
  if (bucketSlugs.length) filters.buckets = bucketSlugs;
  if (materialSlugs.length) filters.materialTypeSlugs = materialSlugs;
  if (serviceAreaSlugs.length) filters.serviceAreaSlugs = serviceAreaSlugs;

  const [initialResult, entries, projectVideos] = await Promise.all([
    listVideoItemsPaged({ first: PAGE_SIZE, after: null, filters }),
    listRecentVideoEntries(200).catch((e) => {
      console.error("[videoEntries] GQL error:", e);
      return [];
    }),
    listProjectVideos(200).catch((e) => {
      console.error("[projectVideos] GQL error:", e);
      return [];
    }),
  ]);

  const allVideos: VideoItem[] = [...entries, ...projectVideos];

  const origin = SITE_ORIGIN;
  const collectionUrl = `${origin}${CANONICAL}`;
  const base = collectionUrl;

  const topList = allVideos.slice(0, 12);
  const itemListElement = topList.map((item, index) => {
    const slug = (item.slug || "").trim();
    const url = slug ? `${collectionUrl}?v=${encodeURIComponent(slug)}` : collectionUrl;
    const name = (item.title || "").trim();
    const imageUrl = item.thumbnailUrl || heroImageUrl(item);
    return {
      "@type": "ListItem",
      position: index + 1,
      url,
      name,
      ...(imageUrl ? { image: imageUrl } : {}),
    } satisfies Record<string, unknown>;
  });

  const collectionLd = collectionPageSchema({
    name: "Video Library",
    description: SEO_DESCRIPTION,
    url: CANONICAL,
    origin,
    itemList: { "@type": "ItemList", itemListElement },
  });

  const breadcrumbsLd = breadcrumbSchema(
    [
      { name: "Home", item: "/" },
      { name: "Video Library", item: CANONICAL },
    ],
    { origin },
  );

  let selectedVideoLd: Record<string, unknown> | null = null;
  if (videoSlug) {
    try {
      const mod: VideoModule = await import("@/lib/wp");
      const getEntry = mod.getVideoEntryBySlug;
      const getProject = mod.getProjectBySlug;
      const toProjectItem = mod.projectToVideoItem;
      const toJsonLd = mod.videoJsonLd;

      let selected = typeof getEntry === "function" ? await getEntry(videoSlug).catch(() => null) : null;

      if (!selected && typeof getProject === "function" && typeof toProjectItem === "function") {
        const project = await getProject(videoSlug).catch(() => null);
        selected = project ? toProjectItem(project) : null;
      }

      if (selected && typeof toJsonLd === "function") {
        selectedVideoLd = toJsonLd(selected, base);
      }
    } catch {
      // ignore
    }
  }

  const materialOptions = uniqueTermsFromVideos(projectVideos, "materialTypes");
  const serviceOptions = uniqueTermsFromVideos(projectVideos, "serviceAreas");

  const initialFilters = {
    search: rawSearch,
    bucketSlugs,
    materialSlugs,
    serviceAreaSlugs,
  };

  return (
    <Section>
      <div className="container-edge py-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">
          <div>
            <JsonLd data={collectionLd} />
            <JsonLd data={breadcrumbsLd} />
            {selectedVideoLd ? <JsonLd data={selectedVideoLd} /> : null}

            {videoSlug ? (
              <div className="mb-6 rounded-md border border-slate-300 bg-white p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label htmlFor="video-share-url" className="text-sm font-medium text-slate-700">Share this video</label>
                  <div className="flex w-full items-center gap-2">
                    <input
                      id="video-share-url"
                      readOnly
                      value={`${collectionUrl}?v=${encodeURIComponent(videoSlug)}`}
                      className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                    />
                    <button id="video-share-copy" type="button" className="whitespace-nowrap rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
                      Copy link
                    </button>
                    <span id="video-share-copied" className="text-xs text-green-700 hidden">Copied!</span>
                  </div>
                </div>
              </div>
            ) : null}

            <VideoLibraryClient
              initialResult={initialResult}
              bucketOptions={BUCKET_OPTIONS}
              materialOptions={materialOptions}
              serviceOptions={serviceOptions}
              pageSize={PAGE_SIZE}
              initialFilters={initialFilters}
            />
          </div>

          <ResourcesAside activePath={CANONICAL} />
        </div>
      </div>

      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `(() => {
            function setVParam(slug) {
              try {
                const url = new URL(window.location.href);
                if (slug) {
                  url.searchParams.set('v', String(slug));
                } else {
                  url.searchParams.delete('v');
                }
                history.pushState(null, '', url.toString());
              } catch (_) {}
            }

            window.SSVideoUrl = {
              open: (slug) => setVParam(slug),
              close: () => setVParam(null),
            };

            document.addEventListener('click', (ev) => {
              try {
                const el = ev.target && ev.target.closest ? ev.target.closest('[data-video-slug]') : null;
                if (el) {
                  const slug = el.getAttribute('data-video-slug');
                  if (slug) setVParam(slug);
                }
              } catch (_) {}
            }, true);

            window.addEventListener('video:open', (e) => {
              try { setVParam(e.detail && e.detail.slug); } catch (_) {}
            });
            window.addEventListener('video:close', () => setVParam(null));

            const btn = document.getElementById('video-share-copy');
            if (btn) {
              btn.addEventListener('click', async () => {
                try {
                  const input = document.getElementById('video-share-url');
                  const text = input && input.value ? input.value : window.location.href;
                  try {
                    await navigator.clipboard.writeText(text);
                  } catch (_) {
                    if (input && input.select) { input.select(); document.execCommand && document.execCommand('copy'); }
                  }
                  const msg = document.getElementById('video-share-copied');
                  if (msg && msg.classList) {
                    msg.classList.remove('hidden');
                    setTimeout(() => msg.classList.add('hidden'), 1500);
                  }
                } catch (_) {}
              });
            }
          })();`,
        }}
      />
    </Section>
  );
}
