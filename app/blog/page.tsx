import Section from "@/components/layout/Section";
import ResourcesAside from "@/components/ResourcesAside";
import BlogArchiveClient from "./BlogArchiveClient";
import {
  listBlogCategories,
  listPostsPaged,
  type PostsFiltersInput,
} from "@/lib/wp";
import type { Metadata } from "next";

export const revalidate = 900;

// ===== STATIC SEO FOR /blog (EDIT HERE) =====
const SEO_TITLE_BLOG = "Roofing Blog for Sarasota, Manatee & Charlotte Counties | SonShine Roofing";
const SEO_DESCRIPTION_BLOG = "Practical roofing tips, how‑tos, and local insights from our Sarasota team. Serving SW Florida since 1987.";
const SEO_KEYWORDS_BLOG = [
  "roofing blog",
  "roofing tips",
  "roof repair advice",
  "roof replacement guide",
  "Sarasota roofing",
  "Manatee County roofing",
  "Charlotte County roofing",
];
const SEO_CANONICAL_BLOG = "/blog";
const SEO_OG_IMAGE_DEFAULT = "/og-default.png";
const PAGE_SIZE = 6;
const MIN_SEARCH_LENGTH = 2;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: SEO_TITLE_BLOG,
    description: SEO_DESCRIPTION_BLOG,
    keywords: SEO_KEYWORDS_BLOG,
    alternates: { canonical: SEO_CANONICAL_BLOG },
    openGraph: {
      type: "website",
      title: SEO_TITLE_BLOG,
      description: SEO_DESCRIPTION_BLOG,
      url: SEO_CANONICAL_BLOG,
      images: [{ url: SEO_OG_IMAGE_DEFAULT, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: SEO_TITLE_BLOG,
      description: SEO_DESCRIPTION_BLOG,
      images: [SEO_OG_IMAGE_DEFAULT],
    },
  };
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

  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://sonshineroofing.com";
  const pageUrl = `${base}${SEO_CANONICAL_BLOG}`;

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": ["WebPage", "CollectionPage"],
    name: SEO_TITLE_BLOG,
    description: SEO_DESCRIPTION_BLOG,
    url: pageUrl,
    primaryImageOfPage: { "@type": "ImageObject", url: `${base}${SEO_OG_IMAGE_DEFAULT}` },
    isPartOf: { "@type": "WebSite", name: "SonShine Roofing", url: base },
  } as const;

  const breadcrumbsLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: pageUrl },
    ],
  } as const;

  return (
    <Section>
      <div className="container-edge py-8">
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
