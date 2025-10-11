import BlogArchiveCard from "@/components/archive/BlogArchiveCard";
import ProjectArchiveCard from "@/components/archive/ProjectArchiveCard";
import type { PostCard, ProjectSummary } from "@/lib/wp";
import { ArrowRight, Sparkles } from "lucide-react";
import SmartLink from "@/components/SmartLink";

const lessFatCta = "btn btn-brand-blue btn-lg w-full sm:w-auto";

// Minimal blog post shape expected from wp.ts
type BlogPoolItem = {
  slug: string;
  title: string;
  featuredImage?: { url: string; altText?: string | null } | null;
  categories?: { slug: string; name?: string | null }[] | null;
  date?: string | null; // ISO string optional; used for stable sorting if present
  excerpt?: string | null;
  contentPlain?: string | null;
};

// Minimal project shape (aligned with ProjectSummary expectations)
type ProjectPoolItem = {
  slug: string;
  title: string;
  uri?: string | null;
  date?: string | null;
  heroImage?: { url: string; altText?: string | null } | null;
  projectDescription?: string | null;
  materialTypes?: { slug: string; name?: string | null }[] | null;
  roofColors?: { slug: string; name?: string | null }[] | null;
  serviceAreas?: { slug: string; name?: string | null }[] | null;
};

type BaseProps = {
  /** Exclude a specific slug (e.g., current entry) */
  excludeSlug?: string;
  /** Number of cards to show (default 4) */
  limit?: number;
  /** Optional wrapper className */
  className?: string;
  /** Optional custom heading to override defaults */
  heading?: string;
  /** Override CTA href */
  ctaHref?: string;
  /** Override CTA label text */
  ctaLabel?: string;
};

type BlogVariantProps = BaseProps & {
  variant?: "blog";
  /** Pool of recent blog posts fetched on the server (should include categories). */
  posts: BlogPoolItem[];
  /** Target category slug to prioritize (e.g., 'roof-repair'). */
  category?: string;
};

type ProjectVariantProps = BaseProps & {
  variant: "project";
  /** Pool of recent projects fetched on the server (should include serviceAreas). */
  projects: ProjectPoolItem[];
  /** Slug(s) of service areas to prioritize (case-insensitive). */
  serviceAreaSlug?: string | string[] | null;
  /** Friendly service-area label for default heading copy. */
  serviceAreaName?: string | null;
};

type Props = BlogVariantProps | ProjectVariantProps;

const formatServiceArea = (value: string | null | undefined) => {
  if (!value) return "";
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const toPostCard = (item: BlogPoolItem): PostCard => {
  const categories = (item.categories ?? [])
    .map((category) => category?.name ?? category?.slug ?? "")
    .filter(Boolean);

  return {
    slug: item.slug,
    title: item.title,
    date: item.date ?? "",
    categories,
    featuredImage: item.featuredImage?.url
      ? {
          url: item.featuredImage.url,
          altText: item.featuredImage.altText ?? null,
        }
      : undefined,
    excerpt: item.excerpt ?? undefined,
    contentPlain: item.contentPlain ?? undefined,
  };
};

function toProjectSummary(item: ProjectPoolItem): ProjectSummary {
  const parseYear = () => {
    if (!item.date) return null;
    const d = new Date(item.date);
    return Number.isFinite(d.getFullYear()) ? d.getFullYear() : null;
  };

  const mapTerms = (terms?: { slug: string; name?: string | null }[] | null) =>
    (terms ?? [])
      .map((term) => {
        const slug = term?.slug ?? "";
        const name = term?.name ?? term?.slug ?? "";
        if (!slug && !name) return null;
        return { slug, name };
      })
      .filter((term): term is { slug: string; name: string } => term !== null);

  return {
    slug: item.slug,
    uri: item.uri ?? "",
    title: item.title,
    year: parseYear(),
    heroImage: item.heroImage?.url
      ? {
          url: item.heroImage.url,
          altText: item.heroImage.altText ?? item.title,
        }
      : null,
    projectDescription: item.projectDescription ?? null,
    materialTypes: mapTerms(item.materialTypes),
    roofColors: mapTerms(item.roofColors),
    serviceAreas: mapTerms(item.serviceAreas),
  };
}

function selectBlogPosts(
  posts: BlogPoolItem[],
  { category, excludeSlug, limit }: { category?: string; excludeSlug?: string; limit: number },
) {
  if (!Array.isArray(posts) || posts.length === 0) return [];

  const normalized = posts
    .filter((post) => post && typeof post.slug === "string" && post.slug !== excludeSlug)
    .slice();

  normalized.sort((a, b) => {
    const ad = a.date ? Date.parse(a.date) : 0;
    const bd = b.date ? Date.parse(b.date) : 0;
    return bd - ad;
  });

  const pick: BlogPoolItem[] = [];
  const seen = new Set<string>();

  const push = (post: BlogPoolItem) => {
    if (!post.slug || seen.has(post.slug)) return;
    seen.add(post.slug);
    pick.push(post);
  };

  if (category) {
    const target = category.toLowerCase();
    for (const post of normalized) {
      const slugs = (post.categories ?? []).map((c) => (c?.slug || "").toLowerCase());
      if (slugs.includes(target)) push(post);
      if (pick.length >= limit) break;
    }
  }

  if (pick.length < limit) {
    for (const post of normalized) {
      if (pick.length >= limit) break;
      push(post);
    }
  }

  return pick.slice(0, limit);
}

function selectProjects(
  projects: ProjectPoolItem[],
  {
    serviceAreaSlug,
    excludeSlug,
    limit,
  }: { serviceAreaSlug?: string | string[] | null; excludeSlug?: string; limit: number },
) {
  if (!Array.isArray(projects) || projects.length === 0) return [];

  const targetSlugs = (() => {
    if (!serviceAreaSlug) return null;
    const source = Array.isArray(serviceAreaSlug) ? serviceAreaSlug : [serviceAreaSlug];
    const normalized = source
      .map((slug) => (typeof slug === "string" ? slug.trim().toLowerCase() : ""))
      .filter(Boolean);
    return normalized.length ? new Set(normalized) : null;
  })();

  const normalized = projects
    .filter((project) => project && typeof project.slug === "string" && project.slug !== excludeSlug)
    .slice();

  normalized.sort((a, b) => {
    const ad = a.date ? Date.parse(a.date) : 0;
    const bd = b.date ? Date.parse(b.date) : 0;
    return bd - ad;
  });

  const pick: ProjectPoolItem[] = [];
  const seen = new Set<string>();

  const push = (project: ProjectPoolItem) => {
    if (!project.slug || seen.has(project.slug)) return;
    seen.add(project.slug);
    pick.push(project);
  };

  if (targetSlugs) {
    for (const project of normalized) {
      const slugs = (project.serviceAreas ?? []).map((area) => (area?.slug || "").toLowerCase());
      if (slugs.some((slug) => targetSlugs.has(slug))) push(project);
      if (pick.length >= limit) break;
    }
  }

  if (pick.length < limit) {
    for (const project of normalized) {
      if (pick.length >= limit) break;
      push(project);
    }
  }

  return pick.slice(0, limit);
}

const buildProjectHeading = (heading: string | undefined, fallbackName?: string | null, slug?: string | string[] | null) => {
  if (heading && heading.trim()) return heading;
  const preferred = fallbackName?.trim();
  if (preferred) return `Explore More Roofing Projects in ${preferred}`;

  const firstSlug = Array.isArray(slug) ? slug[0] : slug;
  const formatted = formatServiceArea(firstSlug);
  return formatted ? `Explore More Roofing Projects in ${formatted}` : "Explore More Roofing Projects";
};

export default function YouMayAlsoLike(props: Props) {
  const { className, excludeSlug, ctaHref, ctaLabel } = props;
  const limit = props.limit ?? 4;
  const baseClassName = ["mt-32 not-prose px-2", className].filter(Boolean).join(" ");

  if (props.variant === "project") {
    const projectItems = selectProjects(props.projects, {
      serviceAreaSlug: props.serviceAreaSlug,
      excludeSlug,
      limit,
    });

    if (!projectItems.length) return null;

    const finalHeading = buildProjectHeading(props.heading, props.serviceAreaName, props.serviceAreaSlug);
    const finalCtaHref = ctaHref || "/project";
    const finalCtaLabel = ctaLabel || "See All Projects";

    return (
      <section className={baseClassName} aria-labelledby="ymal-heading">
        <div className="flex justify-start mt-36 mb-12">
          <h2 id="ymal-heading" className="text-3xl md:text-4xl">
            <Sparkles className="inline h-7 w-7 md:h-10 md:w-10 text-[--brand-blue] mr-3" />
            {finalHeading}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {projectItems.map((item, index) => (
            <ProjectArchiveCard
              key={item.slug}
              project={toProjectSummary(item)}
              className="motion-safe:animate-lp-fade-in"
              style={{ animationDelay: `${index * 60}ms` }}
            />
          ))}
        </div>

        <div className="mt-12 text-center md:text-right">
          <SmartLink
            href={finalCtaHref}
            className={lessFatCta}
            title={finalCtaLabel}
            data-icon-affordance="right"
            proseGuard
          >
            {finalCtaLabel}
            <ArrowRight className="icon-affordance h-4 w-4 inline ml-2" />
          </SmartLink>
        </div>
      </section>
    );
  }

  const blogItems = selectBlogPosts(props.posts, {
    category: props.category,
    excludeSlug,
    limit,
  });

  if (!blogItems.length) return null;

  const finalHeading = props.heading ?? "You May Also Like";
  const finalCtaHref = ctaHref || "/blog";
  const finalCtaLabel = ctaLabel || "See All Posts";

  return (
    <section className={baseClassName} aria-labelledby="ymal-heading">
      <div className="flex justify-start mt-36 mb-12">
        <h2 id="ymal-heading" className="text-3xl md:text-4xl">
          <Sparkles className="inline h-7 w-7 md:h-10 md:w-10 text-[--brand-blue] mr-3" />
          {finalHeading}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {blogItems.map((item, index) => (
          <BlogArchiveCard
            key={item.slug}
            post={toPostCard(item)}
            className="motion-safe:animate-lp-fade-in"
            style={{ animationDelay: `${index * 60}ms` }}
          />
        ))}
      </div>

      <div className="mt-12 text-center md:text-right">
        <SmartLink
          href={finalCtaHref}
          className={lessFatCta}
          title={finalCtaLabel}
          data-icon-affordance="right"
          proseGuard
        >
          {finalCtaLabel}
          <ArrowRight className="icon-affordance h-4 w-4 inline ml-2" />
        </SmartLink>
      </div>
    </section>
  );
}
