// /app/project/page.tsx
import Section from "@/components/layout/Section";
import ResourcesAside from "@/components/ResourcesAside";
import {
  listProjectsPaged,
  listProjectFilterTerms,
  type ProjectsArchiveFilters,
} from "@/lib/wp";
import type { Metadata } from "next";
import { headers } from "next/headers";
import ProjectArchiveClient from "./ProjectArchiveClient";
import { buildBasicMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbSchema, collectionPageSchema } from "@/lib/seo/schema";
import { resolveSiteOrigin } from "@/lib/seo/site";

export const revalidate = 900; // 15 minutes ISR

const PAGE_PATH = "/project";
const PAGE_TITLE = "Project Gallery | Sarasota, Manatee & Charlotte Counties | SonShine Roofing";
const PAGE_DESCRIPTION = "Browse recent roof installations across Southwest Florida. Filter by material, color, and service area to find real projects like yours.";
const PAGE_IMAGE = "/og-default.png";
const PAGE_SIZE = 6;
const MIN_SEARCH_LENGTH = 2;

export async function generateMetadata(): Promise<Metadata> {
  return buildBasicMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    keywords: [
      "roofing projects",
      "project gallery",
      "roof replacement photos",
      "shingle roof projects",
      "tile roof projects",
      "metal roof projects",
      "Sarasota roofing",
      "Manatee County roofing",
      "Charlotte County roofing",
    ],
    image: { url: PAGE_IMAGE, width: 1200, height: 630 },
  });
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

  const origin = resolveSiteOrigin(await headers());

  const collectionLd = collectionPageSchema({
    name: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_PATH,
    origin,
    primaryImage: PAGE_IMAGE,
    isPartOf: { "@type": "WebSite", name: "SonShine Roofing", url: origin },
  });

  const breadcrumbsLd = breadcrumbSchema(
    [
      { name: "Home", item: "/" },
      { name: "Project Gallery", item: PAGE_PATH },
    ],
    { origin },
  );

  return (
    <Section>
      <div className="container-edge py-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">
          <div>
            <JsonLd data={collectionLd} />
            <JsonLd data={breadcrumbsLd} />
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
