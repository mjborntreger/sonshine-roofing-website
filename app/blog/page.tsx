import Section from "@/components/layout/Section";
import ResourcesAside from "@/components/ResourcesAside";
import BlogArchiveClient from "./BlogArchiveClient";
import {
  listBlogCategories,
  listPostsPaged,
  type PostsFiltersInput,
} from "@/lib/wp";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { buildBasicMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbSchema, collectionPageSchema } from "@/lib/seo/schema";
import { resolveSiteOrigin } from "@/lib/seo/site";

export const revalidate = 900;

const PAGE_PATH = "/blog";
const PAGE_TITLE = "Roofing Blog for Sarasota, Manatee & Charlotte Counties | SonShine Roofing";
const PAGE_DESCRIPTION = "Practical roofing tips, how‑tos, and local insights from our Sarasota team. Serving SW Florida since 1987.";
const PAGE_IMAGE = "/og-default.png";
const PAGE_SIZE = 6;
const MIN_SEARCH_LENGTH = 2;

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

type PageProps = {
  searchParams?: Promise<Record<string, string | string[]>>;
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

export default async function BlogArchivePage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};

  const rawSearch = toFirstParam(params.q).trim();
  const categorySlugs = toSlugArray(params.cat);
  const searchForQuery = rawSearch.length >= MIN_SEARCH_LENGTH ? rawSearch : undefined;

  const filters: PostsFiltersInput = {
    q: searchForQuery,
    categorySlugs: categorySlugs.length ? categorySlugs : undefined,
  };

  const [initialResult, categories] = await Promise.all([
    listPostsPaged({ first: PAGE_SIZE, after: null, filters }),
    listBlogCategories(100),
  ]);

  const filteredCategories = categories.filter((cat) => cat.slug.toLowerCase() !== "uncategorized");

  const initialFilters = {
    search: rawSearch,
    categorySlugs,
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

          <ResourcesAside />
        </div>
      </div>
    </Section>
  );
}
