

type Json = Record<string, any>;

// ----- Endpoint & Auth -----
const WP_ENDPOINT =
  process.env.NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT ||
  "https://next.sonshineroofing.com/graphql";

// Server-only env vars (keep these secret)
const WP_USER = process.env.WP_BASIC_AUTH_USER;
const WP_PASS = process.env.WP_BASIC_AUTH_PASS;

// Base path of your CPT permalinks. Keep in sync with ACF CPT rewrite.
const PROJECT_BASE = process.env.WP_PROJECT_BASE || "project";

// Utility to build a project URI that WPGraphQL understands.
const buildProjectUri = (slug: string) => `/${PROJECT_BASE}/${slug}/`;

// Optional: toggle verbose error surface while developing
const WP_VERBOSE_ERRORS = process.env.NODE_ENV !== "production";

// ----- Types -----
export type WpImage = { url: string; altText: string };

export type TermLite = { name: string; slug: string };

export type ProductLink = { productName: string; productLink: string | null };

export type ProjectSummary = {
  slug: string;
  uri: string;
  title: string;
  year: number | null;
  heroImage: WpImage | null;
  /** Short description for client-side search (from ACF projectDetails.projectDescription) */
  projectDescription?: string | null;
  /** Optional taxonomy terms to enable client-side filtering */
  materialTypes?: TermLite[];
  /** Additional taxonomies for client-side filtering */
  roofColors?: TermLite[];
  serviceAreas?: TermLite[];
};

export type ProjectFull = ProjectSummary & {
  contentHtml: string;
  projectDescription: string | null;
  productLinks: ProductLink[];
  materialTypes: TermLite[];
  roofColors: TermLite[];
  serviceAreas: TermLite[];
  youtubeUrl?: string | null;
};

export type PostCard = {
  slug: string;
  title: string;
  date: string; // ISO
  featuredImage?: { url: string; altText?: string | null };
  categories: string[];
  readingTimeMinutes?: number;
  categoryTerms?: TermLite[];
  excerpt?: string;
};

export type PostLite = {
  slug: string;
  title: string;
  date: string | null;
  featuredImage?: WpImage | null;
  categories: TermLite[];
};

export type Post = {
  slug: string;
  title: string;
  contentHtml: string;
  date: string; // ISO
  featuredImage?: { url: string; altText?: string | null };
  categories: string[];
};

export type VideoItem = {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeId: string;
  thumbnailUrl: string;
  source: "video_entry" | "project";
  slug?: string;         // for projects (link to project page)
  date?: string;
  categories: { name: string; slug?: string }[];
  /** Optional short description for client-side search */
  excerpt?: string | null;
  /** Optional taxonomy terms (for project-sourced videos) */
  materialTypes?: TermLite[];
  serviceAreas?: TermLite[];
};

export type Person = {
  slug: string;
  title: string; // (name)
  contentHtml: string;
  featuredImage: WpImage | null;
  positionTitle?: string | null;
};

// ----- Glossary Types -----
export type GlossarySummary = {
  slug: string;
  title: string;
};

export type GlossaryTerm = {
  slug: string;
  title: string;
  contentHtml: string;
};

// FAQ Types
export type FaqSummary = {
  slug: string;
  title: string;       // question
  excerpt?: string | null;
  topicSlugs: string[];
};

export type Faq = {
  slug: string;
  title: string;
  contentHtml: string;
  topicSlugs: string[];
};

// FAQ Topic type (taxonomy term)
export type FaqTopic = {
  slug: string;
  name: string;
  count?: number;        // term usage count (if exposed)
  featured?: boolean | null; // ACF boolean on the term (GraphQL field: featured)
};


// ----- Core fetcher -----
function getAuthHeader(): string | null {
  if (!WP_USER || !WP_PASS) return null;
  const raw = `${WP_USER}:${WP_PASS}`;
  const base64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(raw).toString("base64")
      : typeof btoa !== "undefined"
      ? btoa(raw)
      : "";
  return `Basic ${base64}`;
}

async function wpFetch<T = Json>(
  query: string,
  variables?: Record<string, any>,
  revalidateSeconds = 600
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const auth = getAuthHeader();
  if (auth) headers.Authorization = auth;

  const res = await fetch(WP_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    next: { revalidate: revalidateSeconds },
  });

  if (!res.ok) {
    throw new Error(`WPGraphQL HTTP ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { data?: T; errors?: any };
  if (json.errors) {
    if (WP_VERBOSE_ERRORS) {
      // surface the exact GraphQL error during dev
      throw new Error(JSON.stringify(json.errors));
    }
    throw new Error("WPGraphQL responded with an error");
  }
  return json.data as T;
}

// ----- Helpers -----
const pickImage = (node?: any): WpImage | null =>
  node?.sourceUrl ? { url: String(node.sourceUrl), altText: String(node.altText || "") } : null;

const pickYear = (iso?: string | null) => (iso ? new Date(iso).getFullYear() : null);

const mapTerms = (nodes?: any[]): TermLite[] =>
  (nodes ?? [])
    .filter(Boolean)
    .map((t) => ({ name: String(t.name || ""), slug: String(t.slug || "") }));

const mapProductLinks = (rows?: any[]): ProductLink[] =>
  (rows ?? []).map((r) => ({
    productName: String(r?.productName || ""),
    productLink: r?.productLink ? String(r.productLink) : null,
  }));

// calcReadingTimeMinutes Helper Function
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
function calcReadingTimeMinutes(html: string, wpm = 225): number {
  const text = stripHtml(html);
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.round(words / wpm));
}

// Create a safe, trimmed HTML excerpt from WP's rendered excerpt
function toTrimmedExcerpt(html?: string | null, max = 200): string | undefined {
  if (!html) return undefined;
  const text = stripHtml(String(html));
  if (!text) return undefined;
  const trimmed = text.length > max ? text.slice(0, max).replace(/\s+\S*$/, "") + "…" : text;
  const escaped = trimmed
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<p>${escaped}</p>`;
}

// --- YouTube helpers

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    const v = u.searchParams.get("v");
    if (v) return v;
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "embed" || p === "shorts" || p === "v");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    // If path itself is the id (rare but possible)
    if (parts.length === 1 && parts[0].length >= 8) return parts[0];
    return null;
  } catch {
    return null;
  }
}
function youtubeThumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

// Internal: WPGraphQL response shape for glossary index pagination
type GlossaryIndexResponse = {
  glossaryTerms: {
    nodes: Array<{ slug: string; title: string }>;
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
};

// Internal: WPGraphQL response for FAQ index pagination
type FaqIndexResponse = {
  faqs: {
    nodes: Array<{
      slug: string;
      title: string;
      content?: string | null; // matches listFaqIndex query (content(format: RENDERED))
      faqTopics?: { nodes?: Array<{ slug: string }> };
    }>;
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
};

// ----- Queries -----

/** List FAQ topics (taxonomy terms) including optional ACF `featured` boolean */
export async function listFaqTopics(limit = 100): Promise<FaqTopic[]> {
  const query = /* GraphQL */ `
    query ListFaqTopics($first: Int!) {
      faqTopics(first: $first, where: { hideEmpty: false }) {
        nodes {
          slug
          name
          count
        }
      }
    }
  `;
  const data = await wpFetch<{ faqTopics: { nodes: any[] } }>(query, { first: limit }, 86400);
  const nodes = data?.faqTopics?.nodes ?? [];
  return nodes.map((t: any): FaqTopic => ({
    slug: String(t.slug || ''),
    name: String(t.name || ''),
    count: typeof t.count === 'number' ? t.count : undefined,
    featured: null,
  }));
}

// List recent FAQs (optionally by topic)
export async function listFaqs(limit = 20, topicSlug?: string): Promise<FaqSummary[]> {
  // Helper to map a node to FaqSummary and create a short excerpt
  const toSummary = (n: any): FaqSummary => {
    const raw = String(n?.content ?? "");
    const text = stripHtml(raw);
    const short = text ? (text.length > 160 ? text.slice(0, 157) + "…" : text) : null;
    return {
      slug: String(n.slug || ""),
      title: String(n.title || ""),
      excerpt: short,
      topicSlugs: (n?.faqTopics?.nodes ?? []).map((t: any) => String(t.slug || "")),
    };
  };

  if (topicSlug) {
    const query = /* GraphQL */ `
      query FAQsByTopic($first: Int!, $slug: ID!) {
        faqTopic(id: $slug, idType: SLUG) {
          faqs(first: $first, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
            nodes {
              slug
              title
              content(format: RENDERED)
              faqTopics { nodes { slug } }
              faqAttributes { featured }
            }
          }
        }
      }
    `;
    const data = await wpFetch<{ faqTopic: { faqs?: { nodes?: any[] } } | null }>(
      query,
      { first: limit, slug: topicSlug },
      3600
    );
    const nodes = data?.faqTopic?.faqs?.nodes ?? [];
    return nodes.map(toSummary);
  }

  // No topic filter
  const query = /* GraphQL */ `
    query FAQs($first: Int!) {
      faqs(
        first: $first
        where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }
      ) {
        nodes {
          slug
          title
          content(format: RENDERED)
          faqTopics { nodes { slug } }
          faqAttributes { featured }
        }
      }
    }
  `;
  const data = await wpFetch<{ faqs: { nodes: any[] } }>(query, { first: limit }, 3600);
  const nodes = data?.faqs?.nodes ?? [];
  return nodes.map(toSummary);
}

// Single FAQ by slug
export async function getFaq(slug: string): Promise<Faq | null> {
  const query = /* GraphQL */ `
    query FAQBySlug($slug: ID!) {
      faq(id: $slug, idType: SLUG) {
        slug
        title
        content(format: RENDERED)
        faqTopics { nodes { slug } }
        faqAttributes { featured }
      }
    }
  `;
  const data = await wpFetch<{ faq: any | null }>(query, { slug }, 3600);
  const n = data?.faq;
  if (!n) return null;
  return {
    slug: String(n.slug || slug),
    title: String(n.title || ""),
    contentHtml: String(n.content || ""),
    topicSlugs: (n.faqTopics?.nodes ?? []).map((t: any) => String(t.slug || "")),
  };
}

/**
 * Lightweight index of all FAQs (title/slug/excerpt + topic slugs), paginated.
 * Use for client search and grouping on /faq.
 */
export async function listFaqIndex(limit = 500): Promise<FaqSummary[]> {
  const query = /* GraphQL */ `
    query FaqIndex($first: Int!, $after: String) {
      faqs(
        first: $first
        after: $after
        where: { status: PUBLISH, orderby: { field: TITLE, order: ASC } }
      ) {
        nodes {
          slug
          title
          content(format: RENDERED)
          faqTopics { nodes { slug } }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  const pageSize = Math.min(100, Math.max(1, limit));
  const out: FaqSummary[] = [];
  let after: string | null = null;
  let hasNext = true;

  while (hasNext && out.length < limit) {
    const resp: FaqIndexResponse = await wpFetch<FaqIndexResponse>(query, { first: pageSize, after }, 86400);
    const nodes = resp?.faqs?.nodes ?? [];
    for (const n of nodes) {
      const raw = String(n?.content ?? "");
      const text = stripHtml(raw);
      const short = text ? (text.length > 160 ? text.slice(0, 157) + "…" : text) : null;
      out.push({
        slug: String(n.slug || ''),
        title: String(n.title || ''),
        excerpt: short,
        topicSlugs: (n.faqTopics?.nodes ?? []).map((t: any) => String(t.slug || '')),
      });
      if (out.length >= limit) break;
    }
    const pi = resp?.faqs?.pageInfo;
    hasNext = Boolean(pi?.hasNextPage);
    after = pi?.endCursor ?? null;
  }

  return out;
}

/** Slugs for static params on /faq/[slug] */
export async function listFaqSlugs(limit = 500): Promise<string[]> {
  const query = /* GraphQL */ `
    query ListFaqSlugs($limit: Int!) {
      faqs(first: $limit, where: { status: PUBLISH, orderby: { field: TITLE, order: ASC } }) {
        nodes { slug }
      }
    }
  `;
  const data = await wpFetch<{ faqs: { nodes: Array<{ slug: string | null }> } }>(query, { limit }, 86400);
  return (data?.faqs?.nodes ?? []).map((n) => n.slug).filter(Boolean) as string[];
}

export function faqJsonLd(items: { question: string; answerHtml: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map(i => ({
      "@type": "Question",
      "name": i.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": i.answerHtml, // must match visible content
      }
    }))
  };
}

// List lightweight glossary index (title + slug), A→Z
export async function listGlossaryIndex(limit = 500): Promise<GlossarySummary[]> {
  const query = /* GraphQL */ `
    query GlossaryIndex($first: Int!, $after: String) {
      glossaryTerms(
        first: $first,
        after: $after,
        where: { status: PUBLISH, orderby: { field: TITLE, order: ASC } }
      ) {
        nodes {
          slug
          title
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const pageSize = Math.min(100, Math.max(1, limit)); // WPGraphQL often caps ~100
  const out: GlossarySummary[] = [];
  let after: string | null = null;
  let hasNext = true;

  while (hasNext && out.length < limit) {
    const resp: GlossaryIndexResponse = await wpFetch<GlossaryIndexResponse>(
      query,
      { first: pageSize, after }
    );

    const nodes: GlossaryIndexResponse['glossaryTerms']['nodes'] = resp?.glossaryTerms?.nodes ?? [];
    for (const n of nodes) {
      out.push({ slug: String(n.slug || ''), title: String(n.title || '') });
      if (out.length >= limit) break;
    }

    const pageInfo: GlossaryIndexResponse['glossaryTerms']['pageInfo'] | null =
      resp?.glossaryTerms?.pageInfo ?? null;
    hasNext = Boolean(pageInfo?.hasNextPage);
    after = pageInfo?.endCursor ?? null;
  }

  return out;
}

// Fetch one term by slug
export async function getGlossaryTerm(slug: string): Promise<GlossaryTerm | null> {
  const query = /* GraphQL */ `
    query GlossaryBySlug($slug: ID!) {
      glossaryTerm(id: $slug, idType: SLUG) {
        slug
        title
        content(format: RENDERED)
      }
    }
  `;

  const data = await wpFetch<{ glossaryTerm: any | null }>(query, { slug });
  const n = data?.glossaryTerm;
  if (!n) return null;

  return {
    slug: String(n.slug || slug),
    title: String(n.title || ''),
    contentHtml: String(n.content || ''),
  };
}


// ---- PERSON ------- //
export async function listPersons(limit = 30): Promise<Person[]> {
  const query = /* GraphQL */ `
    query listPersons($limit: Int!) {
      persons(
        first: $limit
        where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }
      ) {
        nodes {
          slug
          title
          content(format: RENDERED)
          featuredImage { node { sourceUrl altText } }
          personAttributes {
            positionTitle
          }
        }
      }
    }
  `;

  const data = await wpFetch<{ persons: { nodes: any[] } }>(query, { limit });
  const nodes = data?.persons?.nodes || [];

  return nodes.map((n: any): Person => ({
    slug: String(n.slug || ""),
    title: String(n.title || ""),
    contentHtml: String(n.content || ""),
    featuredImage: pickImage(n.featuredImage?.node),
    positionTitle: n.personAttributes?.positionTitle ?? null,
  }));
}

/** Fetch multiple Persons by slug array, preserving the given order */
export async function listPersonsBySlugs(slugs: string[]): Promise<Person[]> {
  if (!Array.isArray(slugs) || slugs.length === 0) return [];

  const query = /* GraphQL */ `
    query PersonsBySlugs($slugs: [String]!) {
      persons(first: 100, where: { status: PUBLISH, nameIn: $slugs }) {
        nodes {
          slug
          title
          content(format: RENDERED)
          featuredImage { node { sourceUrl altText } }
          personAttributes { positionTitle }
        }
      }
    }
  `;

  const data = await wpFetch<{ persons: { nodes: any[] } }>(query, { slugs });
  const nodes = data?.persons?.nodes || [];

  const mapped: Person[] = nodes.map((n: any) => ({
    slug: String(n.slug || ""),
    title: String(n.title || ""),
    contentHtml: String(n.content || ""),
    featuredImage: pickImage(n.featuredImage?.node),
    positionTitle: n.personAttributes?.positionTitle ?? null,
  }));

  // Preserve caller's order
  const index = new Map(slugs.map((s, i) => [s, i] as const));
  mapped.sort((a, b) => (index.get(a.slug) ?? 9999) - (index.get(b.slug) ?? 9999));
  return mapped;
}

/** Fetch a single Person CPT by slug */
export async function listPersonsBySlug(slug: string): Promise<Person | null> {
  const query = /* GraphQL */ `
    query PersonBySlug($slug: ID!) {
      person(id: $slug, idType: SLUG) {
        slug
        title
        content(format: RENDERED)
        featuredImage { node { sourceUrl altText } }
        personAttributes { positionTitle }
      }
    }
  `;

  const data = await wpFetch<{ person: any | null }>(query, { slug });
  const n = data?.person;
  if (!n) return null;

  return {
    slug: String(n.slug || slug),
    title: String(n.title || ""),
    contentHtml: String(n.content || ""),
    featuredImage: pickImage(n.featuredImage?.node),
    positionTitle: n.personAttributes?.positionTitle ?? null,
  } as Person;
}

// ----- VIDEO ENTRY (Commercials, Accolades, Education, etc.) -----
export async function listRecentVideoEntries(limit = 50): Promise<VideoItem[]> {
  const query = /* GraphQL */ `
    query ListVideoEntries($limit: Int!) {
      videoEntries(first: $limit, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
        nodes {
          id
          slug
          title
          date
          videoCategories(first: 10) {
            nodes { name slug }
          }
          videoLibraryMetadata { youtubeUrl }
        }
      }
    }
  `;
  const data = await wpFetch<{ videoEntries: { nodes: any[] } }>(query, { limit });
  const nodes = data?.videoEntries?.nodes || [];

return nodes
    .map((n) => {
      const url: string | undefined = n?.videoLibraryMetadata?.youtubeUrl || undefined;
      const id = url ? extractYouTubeId(url) : null;
      if (!id) return null;
      return {
        id: n.id,
        title: n.title,
        youtubeUrl: url!,
        youtubeId: id,
        thumbnailUrl: youtubeThumb(id),
        source: "video_entry" as const,
        date: n.date,
        categories: (n.videoCategories?.nodes || []).map((c: any) => ({ name: c.name, slug: c.slug })),
      } as VideoItem;
    })
    .filter(Boolean) as VideoItem[];
}

// ----- PROJECTS WITH YOUTUBE (Roofing Projects bucket) -----
export async function listProjectVideos(limit = 100): Promise<VideoItem[]> {
  const query = /* GraphQL */ `
    query ListProjectVideos($limit: Int!) {
      projects(first: $limit, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
        nodes {
          slug
          title
          date
          projectVideoInfo {youtubeUrl}
          projectDetails { projectDescription }
          projectFilters {
            materialType { nodes { name slug } }
            serviceArea  { nodes { name slug } }
          }
        }
      }
    }
  `;
  const data = await wpFetch<{ projects: { nodes: any[] } }>(query, { limit });
  const nodes = data?.projects?.nodes || [];

  return nodes
    .map((n) => {
      const url: string | undefined = n?.projectVideoInfo?.youtubeUrl || undefined;
      const id = url ? extractYouTubeId(url) : null;
      if (!id) return null;
      return {
        id: `project-${n.slug}`,
        title: n.title,
        youtubeUrl: url!,
        youtubeId: id,
        thumbnailUrl: youtubeThumb(id),
        source: "project" as const,
        slug: n.slug,
        date: n.date,
        // Optional fields for filtering/search on the client
        excerpt: n?.projectDetails?.projectDescription ?? null,
        materialTypes: mapTerms(n?.projectFilters?.materialType?.nodes),
        serviceAreas:  mapTerms(n?.projectFilters?.serviceArea?.nodes),
        categories: [{ name: "Roofing Projects", slug: "roofing-project" }],
      } as VideoItem;
    })
    .filter(Boolean) as VideoItem[];
}

// ----- Grouping helper (future-proof for new buckets) -----
export type VideoBucketKey = "roofing-project" | "commercials" | "accolades" | "explainers" | "other";

export function groupVideosByBucket(items: VideoItem[]) {
  const buckets = { "roofing-project": [], commercials: [], accolades: [], explainers: [], other: [] } as
    Record<"roofing-project"|"commercials"|"accolades"|"explainers"|"other", VideoItem[]>;

  const is = (v: VideoItem, names: string[]) => {
    const slugs = v.categories.map(c => (c.slug || c.name || "").toLowerCase());
    return slugs.some(s => names.includes(s));
  };

  for (const v of items) {
    if (v.source === "project") { buckets["roofing-project"].push(v); continue; }
    if (is(v, ["commercials","tv","ads"]))        buckets.commercials.push(v);
    else if (is(v, ["accolades","awards","press"])) buckets.accolades.push(v);
    else if (is(v, ["explainers","how-to","tips"]))  buckets.explainers.push(v);
    else buckets.other.push(v);
  }

  for (const k of Object.keys(buckets) as (keyof typeof buckets)[]) {
    buckets[k].sort((a,b) => (b.date||"").localeCompare(a.date||""));
  }
  return buckets;
}

// --- Paged videos (merge video entries + project videos) -----------------
export type VideoFiltersInput = {
  buckets?: VideoBucketKey[];      // which buckets to include (OR). If omitted, include all.
  categorySlugs?: string[];        // match against v.categories[].slug/name (OR)
  materialTypeSlugs?: string[];    // project videos only (OR)
  serviceAreaSlugs?: string[];     // project videos only (OR)
  q?: string;                      // phrase match in title/excerpt (case-insensitive)
};

function decodeOffset(cursor: string | null | undefined): number {
  if (!cursor) return 0;
  const n = parseInt(String(cursor), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
function encodeOffset(n: number): string { return String(n); }

function bucketOf(v: VideoItem): VideoBucketKey {
  if (v.source === "project") return "roofing-project";
  const slugs = (v.categories || []).map(c => (c.slug || c.name || "").toLowerCase());
  if (slugs.some(s => ["commercials","tv","ads"].includes(s))) return "commercials";
  if (slugs.some(s => ["accolades","awards","press"].includes(s))) return "accolades";
  if (slugs.some(s => ["explainers","how-to","tips"].includes(s))) return "explainers";
  return "other";
}

function includesAny(hay: string[], needles?: string[]): boolean {
  if (!needles || needles.length === 0) return true;
  const set = new Set(needles.map(s => s.toLowerCase()));
  return hay.some(h => set.has(String(h).toLowerCase()));
}

export async function listVideoItemsPaged({
  first = 24,
  after = null,
  filters = {},
}: {
  first?: number;
  after?: string | null;
  filters?: VideoFiltersInput;
}) {
  // Fetch a bounded pool (cached by Next via wpFetch revalidate)
  const [entries, projects] = await Promise.all([
    listRecentVideoEntries(200),
    listProjectVideos(200),
  ]);
  const all = [...entries, ...projects];

  const f: any = filters || {};
  const q = (f.q || '').toString().trim().toLowerCase();

  // Accept `buckets` (preferred) or `bucket` (alias) or `b`
  const bucketsList: any[] | null =
    Array.isArray(f.buckets) ? f.buckets
    : Array.isArray(f.bucket) ? f.bucket
    : Array.isArray(f.b) ? f.b
    : null;
  const buckets = bucketsList && bucketsList.length
    ? new Set(bucketsList as VideoBucketKey[])
    : null;

  // Accept `categorySlugs` (preferred) or `categories`/`cat`
  const catInput: any[] | null =
    Array.isArray(f.categorySlugs) ? f.categorySlugs
    : Array.isArray(f.categories) ? f.categories
    : Array.isArray(f.cat) ? f.cat
    : null;
  const catSlugs = catInput ? catInput.map((s: any) => String(s).toLowerCase()) : null;

  // Project-only filters with friendly aliases
  const mtInput: any[] | null = Array.isArray(f.materialTypeSlugs) ? f.materialTypeSlugs : (Array.isArray(f.material) ? f.material : null);
  const mt = mtInput ? mtInput.map((s: any) => String(s).toLowerCase()) : null;

  const saInput: any[] | null = Array.isArray(f.serviceAreaSlugs) ? f.serviceAreaSlugs : (Array.isArray(f.serviceArea) ? f.serviceArea : null);
  const sa = saInput ? saInput.map((s: any) => String(s).toLowerCase()) : null;

  const filtered = all
    .filter((v) => {
      // Bucket filter (OR); if buckets null => pass
      const b = bucketOf(v);
      if (buckets && !buckets.has(b)) return false;

      // Category slugs (OR across names/slugs)
      if (catSlugs) {
        const vs = v.categories.map(c => (c.slug || c.name || '').toLowerCase());
        if (!includesAny(vs, catSlugs)) return false;
      }

      // Project-only filters
      if (mt) {
        if (v.source !== 'project') return false; // material selected => exclude non-projects
        const vs = (v.materialTypes || []).map(t => (t.slug || '').toLowerCase());
        if (!includesAny(vs, mt)) return false;
      }
      if (sa) {
        if (v.source !== 'project') return false; // service area selected => exclude non-projects
        const vs = (v.serviceAreas || []).map(t => (t.slug || '').toLowerCase());
        if (!includesAny(vs, sa)) return false;
      }

      // Phrase match in title/excerpt
      if (q) {
        const title = (v.title || '').toLowerCase();
        const ex = (v.excerpt || '').toLowerCase();
        if (!(title.includes(q) || (ex && ex.includes(q)))) return false;
      }

      return true;
    })
    // newest first
    .sort((a,b) => (b.date || '').localeCompare(a.date || ''));

  const start = decodeOffset(after);
  const end = Math.min(start + Math.max(1, Math.min(first, 50)), filtered.length);
  const slice = filtered.slice(start, end);
  const hasNextPage = end < filtered.length;
  const endCursor = hasNextPage ? encodeOffset(end) : null;

  return {
    pageInfo: { hasNextPage, endCursor },
    items: slice,
  };
}

// --- List recent posts for the archive ---
export async function listRecentPosts(limit = 12): Promise<PostCard[]> {
  const query = /* GraphQL */ `
    query ListRecentPosts($limit: Int!) {
      posts(first: $limit, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
        nodes {
          slug
          title
          date
          content(format: RENDERED)
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
          categories(first: 6) {
            nodes {
              name
              slug
            }
          }
          excerpt(format: RENDERED)
        }
      }
    }
  `;
  const data = await wpFetch<{ posts: { nodes: any[] } }>(query, { limit });

  return (data.posts?.nodes || []).map((n) => ({
    slug: n.slug,
    title: n.title,
    date: n.date,
    featuredImage: n.featuredImage?.node
      ? { url: n.featuredImage.node.sourceUrl, altText: n.featuredImage.node.altText }
      : undefined,
    categories: (n.categories?.nodes || []).map((c: any) => c.name),
    categoryTerms: (n.categories?.nodes || []).map((c: any) => ({ name: c.name, slug: c.slug })) as TermLite[],
    readingTimeMinutes: n.content ? calcReadingTimeMinutes(n.content) : undefined,
    excerpt: n.excerpt ? String(n.excerpt) : undefined,
  }));
}

/**
 * Lightweight pool of recent posts for client-side recommendation/filtering.
 * Returns only: slug, title, date, featuredImage, categories (with slugs).
 * Keep `limit` modest (e.g., 24–48) to cover common categories without heavy payloads.
 */
export async function listRecentPostsPool(limit = 36): Promise<PostLite[]> {
  const query = /* GraphQL */ `
    query ListRecentPostsPool($limit: Int!) {
      posts(first: $limit, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
        nodes {
          slug
          title
          date
          featuredImage { node { sourceUrl altText } }
          categories(first: 12) { nodes { name slug } }
        }
      }
    }
  `;

  const data = await wpFetch<{ posts: { nodes: any[] } }>(query, { limit });
  const nodes = data?.posts?.nodes || [];

  return nodes.map((n: any): PostLite => ({
    slug: String(n.slug || ""),
    title: String(n.title || ""),
    date: n.date || null,
    featuredImage: pickImage(n.featuredImage?.node),
    categories: mapTerms(n.categories?.nodes),
  }));
}

// --- Paged blog list with optional filters (categories by slug, search) ---
export type PostsFiltersInput = {
  q?: string;                      // optional WP fulltext search
  categorySlugs?: string[];        // include categories (OR)
  excludeCategorySlugs?: string[]; // exclude categories (NOT_IN)
};

export async function listPostsPaged({
  first = 24,
  after = null,
  filters = {},
}: {
  first?: number;
  after?: string | null;
  filters?: PostsFiltersInput;
}) {
  // Normalize filters
  const includeCats = Array.isArray(filters.categorySlugs) && filters.categorySlugs.length
    ? filters.categorySlugs
    : null;
  const excludeCats = Array.isArray(filters.excludeCategorySlugs) && filters.excludeCategorySlugs.length
    ? filters.excludeCategorySlugs
    : null;

  // Build GraphQL query signature and where/taxQuery blocks dynamically so we never send
  // `terms: null` (which can result in 0 results in WPGraphQL).
  const paramParts: string[] = ["$first: Int!", "$after: String"]; // base params
  const taxArrayParts: string[] = [];
  if (includeCats) {
    paramParts.push("$cats: [String!]");
    taxArrayParts.push("{ taxonomy: CATEGORY, terms: $cats, field: SLUG, operator: IN }");
  }
  if (excludeCats) {
    paramParts.push("$excludeCats: [String!]");
    taxArrayParts.push("{ taxonomy: CATEGORY, terms: $excludeCats, field: SLUG, operator: NOT_IN }");
  }

  const taxQueryBlock = taxArrayParts.length
    ? `taxQuery: { relation: AND, taxArray: [\n              ${taxArrayParts.join("\n              ")}\n            ] }`
    : "";

  const query = /* GraphQL */ `
    query ListPostsPaged(${paramParts.join(", ")}) {
      posts(
        first: $first
        after: $after
        where: {
          status: PUBLISH
          orderby: { field: DATE, order: DESC }
          ${taxQueryBlock}
        }
      ) {
        pageInfo { hasNextPage endCursor }
        nodes {
          slug
          title
          date
          featuredImage { node { sourceUrl altText } }
          categories(first: 12) { nodes { name slug } }
          excerpt(format: RENDERED)
        }
      }
    }
  `;

  const variables: Record<string, any> = {
    first: Math.max(1, Math.min(first, 50)),
    after,
  };
  if (includeCats) variables.cats = includeCats;
  if (excludeCats) variables.excludeCats = excludeCats;

  const data = await wpFetch<any>(query, variables);

  const nodes: any[] = data?.posts?.nodes ?? [];
  const pageInfo = data?.posts?.pageInfo ?? { hasNextPage: false, endCursor: null };

  return {
    pageInfo,
    items: nodes.map((n) => ({
      slug: n.slug,
      title: n.title,
      date: n.date,
      featuredImage: n.featuredImage?.node
        ? { url: n.featuredImage.node.sourceUrl, altText: n.featuredImage.node.altText }
        : undefined,
      categories: (n.categories?.nodes || []).map((c: any) => c.name),
      categoryTerms: (n.categories?.nodes || []).map((c: any) => ({ name: c.name, slug: c.slug })) as TermLite[],
      excerpt: toTrimmedExcerpt(n.excerpt),
    })) as PostCard[],
  };
}

/**
 * Build a curated pool of recent posts that guarantees enough items per category filter,
 * without fetching the entire archive. The result is merged + de-duped by slug.
 *
 * @param perType  number of posts to guarantee per category (e.g., 4)
 * @param allCount number of posts to include for the "All" tab (e.g., 4)
 * @param fetchCap minimum batch size to fetch once (upper bound; function will fetch max of this and needed)
 * @param categorySlugs list of category slugs to cover
 */
export async function listRecentPostsPoolForFilters(
  perType = 4,
  allCount = 4,
  fetchCap = 60,
  categorySlugs: string[] = ['education','hurricane-preparation','energy-efficient-roofing']
): Promise<PostCard[]> {
  const needed = allCount + perType * categorySlugs.length * 2; // modest cushion for de-dupes
  const batchSize = Math.max(fetchCap, needed);
  const recent = await listRecentPosts(batchSize);

  const byCat = (slug: string) =>
    recent
      .filter((p: any) => Array.isArray(p.categoryTerms) && p.categoryTerms.some((t: any) => t.slug === slug))
      .slice(0, perType);

  const allLatest = recent.slice(0, allCount);
  const buckets = categorySlugs.map(byCat);

  const seen = new Set<string>();
  const pool: PostCard[] = [];
  const pushUnique = (arr: PostCard[]) => {
    for (const p of arr) {
      if (!seen.has(p.slug)) {
        seen.add(p.slug);
        pool.push(p);
      }
    }
  };

  pushUnique(allLatest);
  buckets.forEach(pushUnique);

  return pool;
}

// --- Slugs for static params (future-proofing your /[slug]) ---
export async function listPostSlugs(limit = 200): Promise<string[]> {
  const query = /* GraphQL */ `
    query ListPostSlugs($limit: Int!) {
      posts(first: $limit, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
        nodes {
          slug
        }
      }
    }
  `;
  const data = await wpFetch<{ posts: { nodes: { slug: string | null }[] } }>(query, { limit });
  return (data.posts?.nodes || []).map((n) => n.slug).filter(Boolean) as string[];
}

// --- Single post fetch (for your /[slug] page later) ---
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const query = /* GraphQL */ `
    query GetPostBySlug($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        slug
        title
        date
        content(format: RENDERED)
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories(first: 12) {
          nodes {
            name
          }
        }
      }
    }
  `;
  const data = await wpFetch<{ post: any | null }>(query, { slug });
  const p = data.post;
  if (!p) return null;
  return {
    slug: p.slug,
    title: p.title,
    contentHtml: p.content ?? "",
    date: p.date,
    featuredImage: p.featuredImage?.node
      ? { url: p.featuredImage.node.sourceUrl, altText: p.featuredImage.node.altText }
      : undefined,
    categories: (p.categories?.nodes || []).map((c: any) => c.name),
  };
}

/**
 * Get latest projects (server-side), include description and filter taxonomies
 * (material, roofColor, serviceArea) for client-side search & filtering.
 * NOTE: `_opts.material` is intentionally ignored to keep filtering on the client.
 */
export async function listRecentProjects(
  limit = 6,
  _opts?: { material?: string | null }
): Promise<ProjectSummary[]> {
  const query = /* GraphQL */ `
    query RecentProjects($limit: Int!) {
      projects(first: $limit, where: { orderby: { field: DATE, order: DESC } }) {
        nodes {
          slug
          uri
          title
          date
          featuredImage { node { sourceUrl altText } }
          projectDetails { projectDescription }
          projectFilters {
            materialType { nodes { name slug } }
            roofColor    { nodes { name slug } }
            serviceArea  { nodes { name slug } }
          }
        }
      }
    }
  `;
  const data = await wpFetch<any>(query, { limit });
  const nodes = data?.projects?.nodes ?? [];
  return nodes.map((p: any): ProjectSummary => ({
    slug: p.slug,
    uri: p.uri,
    title: String(p.title || ''),
    year: pickYear(p.date),
    heroImage: pickImage(p.featuredImage?.node),
    projectDescription: p?.projectDetails?.projectDescription ?? null,
    materialTypes: mapTerms(p.projectFilters?.materialType?.nodes),
    roofColors: mapTerms(p.projectFilters?.roofColor?.nodes),
    serviceAreas: mapTerms(p.projectFilters?.serviceArea?.nodes),
  }));
}

/**
 * Cursor-based, filter-free project pagination for archives.
 * Keep this minimal to support client-side filtering/search and InfiniteList.
 */
export async function listProjectsPaged({
  first = 24,
  after = null,
}: {
  first?: number;
  after?: string | null;
}) {
  const query = /* GraphQL */ `
    query ListProjectsPaged($first: Int!, $after: String) {
      projects(
        first: $first
        after: $after
        where: {
          status: PUBLISH
          orderby: { field: DATE, order: DESC }
        }
      ) {
        pageInfo { hasNextPage endCursor }
        nodes {
          slug
          uri
          title
          date
          featuredImage { node { sourceUrl altText } }
          projectDetails { projectDescription }
          projectFilters {
            materialType { nodes { name slug } }
            roofColor    { nodes { name slug } }
            serviceArea  { nodes { name slug } }
          }
        }
      }
    }
  `;

  const data = await wpFetch<any>(query, {
    first: Math.max(1, Math.min(first, 50)),
    after,
  });

  const nodes: any[] = data?.projects?.nodes ?? [];
  const pageInfo = data?.projects?.pageInfo ?? { hasNextPage: false, endCursor: null };

  return {
    pageInfo,
    items: nodes.map((p: any) => ({
      slug: String(p.slug || ""),
      uri: String(p.uri || ""),
      title: String(p.title || ""),
      year: pickYear(p.date),
      heroImage: pickImage(p.featuredImage?.node),
      projectDescription: p?.projectDetails?.projectDescription ?? null,
      materialTypes: mapTerms(p.projectFilters?.materialType?.nodes),
      roofColors: mapTerms(p.projectFilters?.roofColor?.nodes),
      serviceAreas: mapTerms(p.projectFilters?.serviceArea?.nodes),
    })) as ProjectSummary[],
  };
}

/** Fetch newest N projects by a specific material term slug */
export async function listRecentProjectsByMaterial(
  material: 'shingle' | 'metal' | 'tile',
  limit = 4
): Promise<ProjectSummary[]> {
  const query = /* GraphQL */ `
    query RecentProjectsByMaterial($limit: Int!, $slugs: [String]) {
      projects(
        first: $limit
        where: {
          status: PUBLISH
          orderby: { field: DATE, order: DESC }
          taxQuery: {
            taxArray: [
              { taxonomy: MATERIAL_TYPE, terms: $slugs, field: SLUG, operator: IN }
            ]
          }
        }
      ) {
        nodes {
          slug
          uri
          title
          date
          featuredImage { node { sourceUrl altText } }
          projectDetails { projectDescription }
          projectFilters {
            materialType { nodes { name slug } }
            roofColor    { nodes { name slug } }
            serviceArea  { nodes { name slug } }
          }
        }
      }
    }
  `;

  const data = await wpFetch<any>(query, { limit, slugs: [material] });
  const nodes = data?.projects?.nodes ?? [];
  return nodes.map((p: any): ProjectSummary => ({
    slug: p.slug,
    uri: p.uri,
    title: String(p.title || ''),
    year: pickYear(p.date),
    heroImage: pickImage(p.featuredImage?.node),
    projectDescription: p?.projectDetails?.projectDescription ?? null,
    materialTypes: mapTerms(p.projectFilters?.materialType?.nodes),
    roofColors: mapTerms(p.projectFilters?.roofColor?.nodes),
    serviceAreas: mapTerms(p.projectFilters?.serviceArea?.nodes),
  }));
}

/**
 * Build a small curated pool that guarantees enough items for each pill filter.
 * - `allCount`: newest overall (drives the "All" tab ordering)
 * - `perType`: newest per material (ensures adequate items per filter)
 * Result is merged + de-duped by slug, preserving order of first appearance.
 */
export async function listRecentProjectsPoolForFilters(
  perType = 4,
  allCount = 8,
  fetchCap = 40
): Promise<ProjectSummary[]> {
  // Fetch a bounded recent batch once. We’ll derive per-type pools from it.
  const batchSize = Math.max(fetchCap, allCount + perType * 6);
  const recent = await listRecentProjects(batchSize);

  const byType = (slug: 'shingle' | 'metal' | 'tile') =>
    recent
      .filter(p => (p.materialTypes ?? []).some(t => t.slug === slug))
      .slice(0, perType);

  const allLatest = recent.slice(0, allCount);
  const shingle = byType('shingle');
  const metal   = byType('metal');
  const tile    = byType('tile');

  // Merge & de-dupe, preserving first appearance (recency)
  const seen = new Set<string>();
  const pool: ProjectSummary[] = [];
  const pushUnique = (arr: ProjectSummary[]) => {
    for (const p of arr) {
      if (!seen.has(p.slug)) {
        seen.add(p.slug);
        pool.push(p);
      }
    }
  };

  // Keep newest-overall first so the “All” tab reflects true recency
  pushUnique(allLatest);
  // Then guarantee per-category coverage
  pushUnique(shingle);
  pushUnique(metal);
  pushUnique(tile);

  return pool;
}

/** Slugs (for static params) */
export async function listProjectSlugs(limit = 500): Promise<string[]> {
  const query = /* GraphQL */ `
    query ProjectSlugs($limit: Int!) {
      projects(first: $limit, where: { orderby: { field: DATE, order: DESC } }) {
        nodes { slug }
      }
    }
  `;
  const data = await wpFetch<any>(query, { limit });
  return (data?.projects?.nodes ?? []).map((n: any) => String(n.slug)).filter(Boolean);
}

/** Single project by slug – uses URI so it works regardless of idType enum */
export async function getProjectBySlug(slug: string): Promise<ProjectFull | null> {
  const uri = buildProjectUri(slug);

  const query = /* GraphQL */ `
    query ProjectByUri($uri: ID!) {
      project(id: $uri, idType: URI) {
        slug
        uri
        title
        date
        content
        featuredImage { node { sourceUrl altText } }

        # ACF Field Group: projectVideoInfo
        projectVideoInfo {
          youtubeUrl
        }

        # ACF Field Group: projectDetails
        projectDetails {
          projectDescription
          productLinks {
            productName
            productLink
          }
        }

        # ACF Field Group: projectFilters (taxonomy fields)
        projectFilters {
          materialType { nodes { name slug } }
          roofColor    { nodes { name slug } }
          serviceArea  { nodes { name slug } }
        }
      }
    }
  `;

  const data = await wpFetch<any>(query, { uri });
  const p = data?.project;
  if (!p) return null;

  const details = p.projectDetails ?? {};
  const filters = p.projectFilters ?? {};
  const video = p.projectVideoInfo ?? {};

  return {
    slug: String(p.slug || slug),
    uri: String(p.uri || uri),
    title: String(p.title || ""),
    year: pickYear(p.date),
    contentHtml: String(p.content || ""),
    heroImage: pickImage(p.featuredImage?.node),

    projectDescription: details.projectDescription ?? null,
    productLinks: mapProductLinks(details.productLinks),

    materialTypes: mapTerms(filters.materialType?.nodes),
    roofColors: mapTerms(filters.roofColor?.nodes),
    serviceAreas: mapTerms(filters.serviceArea?.nodes),

    youtubeUrl: video.youtubeUrl ?? null,
  };
}

/** Filter projects by taxonomy term slugs (works whether terms come from ACF taxonomy fields or normal term assignments) */
export type ProjectFiltersInput = {
  materialTypeSlugs?: string[];
  roofColorSlugs?: string[];
  serviceAreaSlugs?: string[];
  first?: number;
  after?: string | null;
};

/**
 * Uses WPGraphQL taxonomyQuery to filter by term slugs.
 * NOTE: The taxonomy names below must match the GraphQL names you set when registering taxonomies.
 * If you used ACF's Taxonomies UI and named them:
 *  - material_type   -> GraphQL: MATERIAL_TYPE (enum), MaterialType (object)
 *  - roof_color      -> GraphQL: ROOF_COLOR
 *  - service_area    -> GraphQL: SERVICE_AREA
 * adjust the taxonomy names in the query if yours differ.
 */
export async function filterProjects({
  materialTypeSlugs = [],
  roofColorSlugs = [],
  serviceAreaSlugs = [],
  first = 12,
  after = null,
}: ProjectFiltersInput) {
  const query = /* GraphQL */ `
    query FilterProjects(
      $first: Int!
      $after: String
      $mt: [String!]
      $rc: [String!]
      $sa: [String!]
    ) {
      projects(
        first: $first
        after: $after
        where: {
          orderby: { field: DATE, order: DESC }
          taxQuery: {
            relation: AND
            taxArray: [
              { taxonomy: MATERIAL_TYPE, terms: $mt, field: SLUG, operator: IN }
              { taxonomy: ROOF_COLOR,     terms: $rc, field: SLUG, operator: IN }
              { taxonomy: SERVICE_AREA,   terms: $sa, field: SLUG, operator: IN }
            ]
          }
        }
      ) {
        pageInfo { hasNextPage endCursor }
        nodes {
          slug
          uri
          title
          date
          featuredImage { node { sourceUrl altText } }
          projectFilters {
            materialType { nodes { name slug } }
            roofColor    { nodes { name slug } }
            serviceArea  { nodes { name slug } }
          }
        }
      }
    }
  `;
  const data = await wpFetch<any>(query, {
    first,
    after,
    mt: materialTypeSlugs.length ? materialTypeSlugs : null,
    rc: roofColorSlugs.length ? roofColorSlugs : null,
    sa: serviceAreaSlugs.length ? serviceAreaSlugs : null,
  });

  const nodes: any[] = data?.projects?.nodes ?? [];
  const pageInfo = data?.projects?.pageInfo ?? { hasNextPage: false, endCursor: null };

  return {
    pageInfo,
    items: nodes.map((p) => ({
      slug: p.slug,
      uri: p.uri,
      title: String(p.title || ""),
      year: pickYear(p.date),
      heroImage: pickImage(p.featuredImage?.node),
      materialTypes: mapTerms(p.projectFilters?.materialType?.nodes),
      roofColors: mapTerms(p.projectFilters?.roofColor?.nodes),
      serviceAreas: mapTerms(p.projectFilters?.serviceArea?.nodes),
    })) as ProjectSummary[],
  };
}

/** ----------------------------------------------------------------------
 * Lightweight term lists for Project filters (Material, Roof Color, Service Area)
 * These avoid fetching projects just to build pills on the Project Gallery.
 * Relies on WPGraphQL taxonomy root fields:
 *   materialTypes, roofColors, serviceAreas
 * If your GraphQL names differ, adjust the root field names below.
 * Cached aggressively (1 day) since terms change rarely.
 * --------------------------------------------------------------------- */

export async function listProjectMaterialTypes(limit = 100): Promise<TermLite[]> {
  const query = /* GraphQL */ `
    query ListProjectMaterialTypes($first: Int!) {
      materialTypes(first: $first, where: { hideEmpty: false }) {
        nodes { name slug }
      }
    }
  `;
  const data = await wpFetch<{ materialTypes: { nodes: any[] } }>(query, { first: limit }, 86400);
  return mapTerms(data?.materialTypes?.nodes);
}

export async function listProjectRoofColors(limit = 100): Promise<TermLite[]> {
  const query = /* GraphQL */ `
    query ListProjectRoofColors($first: Int!) {
      roofColors(first: $first, where: { hideEmpty: false }) {
        nodes { name slug }
      }
    }
  `;
  const data = await wpFetch<{ roofColors: { nodes: any[] } }>(query, { first: limit }, 86400);
  return mapTerms(data?.roofColors?.nodes);
}

export async function listProjectServiceAreas(limit = 100): Promise<TermLite[]> {
  const query = /* GraphQL */ `
    query ListProjectServiceAreas($first: Int!) {
      serviceAreas(first: $first, where: { hideEmpty: false }) {
        nodes { name slug }
      }
    }
  `;
  const data = await wpFetch<{ serviceAreas: { nodes: any[] } }>(query, { first: limit }, 86400);
  return mapTerms(data?.serviceAreas?.nodes);
}

/** Convenience: fetch all three in parallel */
export async function listProjectFilterTerms() {
  const [materials, roofColors, serviceAreas] = await Promise.all([
    listProjectMaterialTypes(100),
    listProjectRoofColors(100),
    listProjectServiceAreas(100),
  ]);
  return { materials, roofColors, serviceAreas };
}

// ----- Generic helpers you can reuse for other CPTs later -----

/** Fetch WP general settings (handy for health checks) */
export async function getSiteMeta() {
  const query = /* GraphQL */ `
    query SiteMeta {
      generalSettings { title url description }
    }
  `;
  const data = await wpFetch<any>(query, undefined, 60);
  return data?.generalSettings ?? null;
}

/** Debug route helper: simple round-trip to check connectivity */
export async function pingWP() {
  try {
    const meta = await getSiteMeta();
    return { ok: true, meta };
  } catch (e: any) {
    return { ok: false, error: e?.message || "WPGraphQL error" };
  }
}
