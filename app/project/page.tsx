// /app/project/page.tsx
import Section from "@/components/layout/Section";
import ResourcesAside from "@/components/ResourcesAside";
import {
  listProjectsPaged,
  listProjectFilterTerms,
  type ProjectsArchiveFilters,
} from "@/lib/wp";
import type { Metadata } from "next";

import ProjectArchiveClient from "./ProjectArchiveClient";

export const revalidate = 900; // 15 minutes ISR

// ===== STATIC SEO FOR /project (EDIT HERE) =====
const SEO_TITLE_PROJECTS = "Project Gallery | Sarasota, Manatee & Charlotte Counties | SonShine Roofing";
const SEO_DESCRIPTION_PROJECTS = "Browse recent roof installations across Southwest Florida. Filter by material, color, and service area to find real projects like yours.";
const SEO_KEYWORDS_PROJECTS = [
  "roofing projects",
  "project gallery",
  "roof replacement photos",
  "shingle roof projects",
  "tile roof projects",
  "metal roof projects",
  "Sarasota roofing",
  "Manatee County roofing",
  "Charlotte County roofing",
];
const SEO_CANONICAL_PROJECTS = "/project";
const SEO_OG_IMAGE_DEFAULT = "/og-default.png";
const PAGE_SIZE = 6;
const MIN_SEARCH_LENGTH = 2;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: SEO_TITLE_PROJECTS,
    description: SEO_DESCRIPTION_PROJECTS,
    keywords: SEO_KEYWORDS_PROJECTS,
    alternates: { canonical: SEO_CANONICAL_PROJECTS },
    openGraph: {
      type: "website",
      title: SEO_TITLE_PROJECTS,
      description: SEO_DESCRIPTION_PROJECTS,
      url: SEO_CANONICAL_PROJECTS,
      images: [{ url: SEO_OG_IMAGE_DEFAULT, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: SEO_TITLE_PROJECTS,
      description: SEO_DESCRIPTION_PROJECTS,
      images: [SEO_OG_IMAGE_DEFAULT],
    },
  };
}

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function toFirstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function toSlugArray(value: string | string[] | undefined): string[] {
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
}

export default async function ProjectArchivePage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};

  const rawSearch = toFirstParam(params.q).trim();
  const materialTypeSlugs = toSlugArray(params.mt);
  const roofColorSlugs = toSlugArray(params.rc);
  const serviceAreaSlugs = toSlugArray(params.sa);

  const searchForQuery = rawSearch.length >= MIN_SEARCH_LENGTH ? rawSearch : undefined;

  const filters: ProjectsArchiveFilters = {
    search: searchForQuery,
    materialTypeSlugs,
    roofColorSlugs,
    serviceAreaSlugs,
  };

  const [initialResult, filterTerms] = await Promise.all([
    listProjectsPaged({ first: PAGE_SIZE, after: null, filters }),
    listProjectFilterTerms(),
  ]);

  const initialFilters = {
    search: rawSearch,
    materialTypeSlugs,
    roofColorSlugs,
    serviceAreaSlugs,
  };

  // JSON-LD: CollectionPage + BreadcrumbList for Project Gallery
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://sonshineroofing.com";
  const pageUrl = `${base}${SEO_CANONICAL_PROJECTS}`;

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": ["WebPage", "CollectionPage"],
    name: SEO_TITLE_PROJECTS,
    description: SEO_DESCRIPTION_PROJECTS,
    url: pageUrl,
    primaryImageOfPage: { "@type": "ImageObject", url: `${base}${SEO_OG_IMAGE_DEFAULT}` },
    isPartOf: { "@type": "WebSite", name: "SonShine Roofing", url: base },
  } as const;

  const breadcrumbsLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
      { "@type": "ListItem", position: 2, name: "Project Gallery", item: pageUrl },
    ],
  } as const;

  return (
    <Section>
      <div className="container-edge py-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">
          <div>
            <script
              type="application/ld+json"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
            />
            <script
              type="application/ld+json"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }}
            />
            <ProjectArchiveClient
              initialResult={initialResult}
              filterTerms={filterTerms}
              pageSize={PAGE_SIZE}
              initialFilters={initialFilters}
            />
          </div>
          <ResourcesAside />
        </div>
      </div>
    </Section>
  );
}
