export type ContentImage = { url: string; altText: string; width?: number | null; height?: number | null };

export type TermLite = { name: string; slug: string };

export type PostCard = {
  slug: string;
  title: string;
  date: string; // ISO
  featuredImage?: { url: string; altText?: string | null };
  categories: string[];
  readingTimeMinutes?: number;
  categoryTerms?: TermLite[];
  excerpt?: string;
  contentPlain?: string;
};

export type PostLite = {
  slug: string;
  title: string;
  date: string | null;
  featuredImage?: ContentImage | null;
  categories: TermLite[];
  excerpt?: string | null;
  contentPlain?: string | null;
};

export type Post = {
  slug: string;
  title: string;
  contentHtml: string;
  date: string; // ISO
  modified?: string; // ISO (last modified)
  authorName?: string | null;
  featuredImage?: { url: string; altText?: string | null };
  categories: string[];
  categoryTerms?: TermLite[];
  /** Optional short HTML excerpt (rendered), useful for previews & SEO fallbacks */
  excerpt?: string;
  noindex?: boolean;
  primaryFocusKeyword?: string | null;
  focusKeywords?: string[];
  /** Normalized CMS SEO values used by metadata and structured data. */
  seo?: {
    title?: string | null;
    description?: string | null;
    canonicalUrl?: string | null;
    openGraph?: {
      title?: string | null;
      description?: string | null;
      type?: string | null;
      image?: {
        url?: string | null;
        secureUrl?: string | null;
        width?: number | null;
        height?: number | null;
        type?: string | null;
      } | null;
    } | null;
  };
};

export type PostsFiltersInput = {
  q?: string;
  categorySlugs?: string[];
  excludeCategorySlugs?: string[];
};

export type FacetGroup = {
  taxonomy: string;
  buckets: Array<TermLite & { count: number }>;
};
