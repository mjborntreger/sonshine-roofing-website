import Section from "@/components/layout/Section";
import ResourcesAside from "@/components/global-nav/static-pages/ResourcesAside";
import BlogArchiveClient from "../../components/dynamic-content/blog/BlogArchiveClient";
import { listBlogCategories, listPostsPaged } from "@/lib/content/wp";
import type { Metadata } from "next";
import { buildBasicMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbSchema, collectionPageSchema } from "@/lib/seo/schema";
import { SITE_ORIGIN } from "@/lib/seo/site";

export const revalidate = 900;

const PAGE_PATH = "/blog";
const PAGE_TITLE = "Roofing Blog for Sarasota, Manatee & Charlotte Counties | SonShine Roofing";
const PAGE_DESCRIPTION = "Practical roofing tips, how‑tos, and local insights from our Sarasota team. Serving SW Florida since 1987.";
const PAGE_IMAGE = "/og-default.png";
const PAGE_SIZE = 6;

export async function generateMetadata(): Promise<Metadata> {
  return buildBasicMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    keywords: [
      "roofing blog",
      "roofing tips",
      "roof repair advice",
      "roof replacement guide",
      "Sarasota roofing",
      "Manatee County roofing",
      "Charlotte County roofing",
    ],
    image: { url: PAGE_IMAGE, width: 1200, height: 630 },
  });
}

export const dynamic = "force-static";

export default async function BlogArchivePage() {
  const [initialResult, categories] = await Promise.all([
    listPostsPaged({ first: PAGE_SIZE, after: null }),
    listBlogCategories(100),
  ]);

  const filteredCategories = categories.filter((cat) => cat.slug.toLowerCase() !== "uncategorized");

  const initialFilters = {
    search: "",
    categorySlugs: [] as string[],
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
      { name: "Blog", item: PAGE_PATH },
    ],
    { origin },
  );

  return (
    <Section>
      <div className="container-edge py-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">
          <div>
            <JsonLd data={collectionLd} />
            <JsonLd data={breadcrumbsLd} />

            <BlogArchiveClient
              initialResult={initialResult}
              categories={filteredCategories}
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
