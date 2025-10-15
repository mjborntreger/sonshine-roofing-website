// /app/project/page.tsx
import Section from "@/components/layout/Section";
import ResourcesAside from "@/components/global-nav/static-pages/ResourcesAside";
import { listProjectsPaged, listProjectFilterTerms } from "@/lib/content/wp";
import type { Metadata } from "next";
import ProjectArchiveClient from "../../components/dynamic-content/project/ProjectArchiveClient";
import { buildBasicMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbSchema, collectionPageSchema } from "@/lib/seo/schema";
import { SITE_ORIGIN } from "@/lib/seo/site";

export const revalidate = 900; // 15 minutes ISR
export const dynamic = "force-static";

const PAGE_PATH = "/project";
const PAGE_TITLE = "Project Gallery | Sarasota, Manatee & Charlotte Counties | SonShine Roofing";
const PAGE_DESCRIPTION = "Browse recent roof installations across Southwest Florida. Filter by material, color, and service area to find real projects like yours.";
const PAGE_IMAGE = "/og-default.png";
const PAGE_SIZE = 6;

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

export default async function ProjectArchivePage() {
  const [initialResult, filterTerms] = await Promise.all([
    listProjectsPaged({ first: PAGE_SIZE, after: null }),
    listProjectFilterTerms(),
  ]);

  const initialFilters = {
    search: "",
    materialTypeSlugs: [] as string[],
    roofColorSlugs: [] as string[],
    serviceAreaSlugs: [] as string[],
  };

  const origin = SITE_ORIGIN;

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
          <ResourcesAside activePath={PAGE_PATH} />
        </div>
      </div>
    </Section>
  );
}
