import { cache } from "react";

import Section from "@/components/layout/Section";
import ResourcesAside from "@/components/global-nav/static-pages/ResourcesAside";
import VideoLibraryClient from "../../components/dynamic-content/video/VideoLibraryClient";
import VideoShareBar from "../../components/dynamic-content/video/VideoShareBar";
import {
  listRecentVideoEntries,
  listProjectVideos,
  listVideoItemsPaged,
  type VideoItem,
  type TermLite,
} from "@/lib/content/wp";
import type { Metadata } from "next";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbSchema, collectionPageSchema } from "@/lib/seo/schema";
import { SITE_ORIGIN } from "@/lib/seo/site";

export const revalidate = 900;
export const dynamic = "force-static";

const SEO_TITLE = "Video Library | SonShine Roofing";
const SEO_DESCRIPTION = "Highlights from our projects, commercials, and short video explainers.";
const CANONICAL = "/video-library";
const OG_IMAGE = "/og-default.png";
const PAGE_SIZE = 8;

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
  typeof import("@/lib/content/wp"),
  "getVideoEntryBySlug" | "getProjectBySlug" | "projectToVideoItem"
>;

const BUCKET_OPTIONS: Array<{ slug: string; label: string }> = [
  { slug: "commercials", label: "Commercials" },
  { slug: "explainers", label: "Explainers" },
  { slug: "roofing-project", label: "Roofing Projects" },
  { slug: "in-the-field", label: "In the Field" },
  { slug: "other", label: "Other" },
];

const toFirstParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
};

const fetchVideoForMetadata = cache(async (slug: string) => {
  const mod: VideoModule = await import("@/lib/content/wp");
  const getEntry = mod.getVideoEntryBySlug;
  const getProject = mod.getProjectBySlug;
  const toProjectItem = mod.projectToVideoItem;

  const entry =
    typeof getEntry === "function" ? await getEntry(slug).catch(() => null) : null;
  if (entry) return entry;

  if (typeof getProject === "function" && typeof toProjectItem === "function") {
    const project = await getProject(slug).catch(() => null);
    if (project) return toProjectItem(project);
  }

  return null;
});

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: SearchParamsPromise;
}): Promise<Metadata> {
  const spObj = searchParams ? await searchParams : EMPTY_SEARCH_PARAMS;
  const v = toFirstParam(spObj.v).trim();

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
    const video = await fetchVideoForMetadata(v);
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

export default async function VideoLibraryPage() {
  const [initialResult, entries, projectVideos] = await Promise.all([
    listVideoItemsPaged({ first: PAGE_SIZE, after: null }),
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

  const materialOptions = uniqueTermsFromVideos(projectVideos, "materialTypes");
  const serviceOptions = uniqueTermsFromVideos(projectVideos, "serviceAreas");

  const initialFilters = {
    search: "",
    bucketSlugs: [] as string[],
    materialSlugs: [] as string[],
    serviceAreaSlugs: [] as string[],
  };

  return (
    <Section>
      <div className="container-edge py-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">
          <div>
            <JsonLd data={collectionLd} />
            <JsonLd data={breadcrumbsLd} />
            <VideoShareBar collectionUrl={collectionUrl} />

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
          })();`,
        }}
      />
    </Section>
  );
}
