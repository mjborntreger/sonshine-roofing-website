export const CONTENT_PREVIEW_LIMIT = 6;

type DatedPreview = { slug: string; date?: string | null };
type PreviewTerm = { slug: string };
type PostPreview = DatedPreview & { categoryTerms?: readonly PreviewTerm[] | null };
type ProjectPreview = DatedPreview & {
  reviewSnippet?: string | null;
  materialTypes?: readonly PreviewTerm[] | null;
  serviceAreas?: readonly PreviewTerm[] | null;
};

export type RelatedPostOptions = {
  categorySlugs?: readonly string[];
  excludeSlug?: string;
  limit?: number;
};

export type RelatedProjectOptions = {
  serviceAreaSlugs?: readonly string[];
  excludeSlug?: string;
  limit?: number;
};

const normalizeSlug = (slug: string) => slug.trim().toLowerCase();

function publicationTime(value: string | null | undefined): number {
  const time = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY;
}

export function compareNewestPreviews(left: DatedPreview, right: DatedPreview): number {
  const leftTime = publicationTime(left.date);
  const rightTime = publicationTime(right.date);
  if (leftTime !== rightTime) return leftTime > rightTime ? -1 : 1;
  return left.slug < right.slug ? -1 : left.slug > right.slug ? 1 : 0;
}

export function hasProjectReview(project: { reviewSnippet?: string | null }): boolean {
  return typeof project.reviewSnippet === 'string' && project.reviewSnippet.trim().length > 0;
}

export function compareProjectPreviews(left: ProjectPreview, right: ProjectPreview): number {
  return Number(hasProjectReview(right)) - Number(hasProjectReview(left))
    || compareNewestPreviews(left, right);
}

function uniquePreviews<T extends DatedPreview>(items: readonly T[], excludeSlug?: string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.slug.trim() || item.slug === excludeSlug || seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}

function take<T>(items: T[], limit: number): T[] {
  const size = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : CONTENT_PREVIEW_LIMIT;
  return items.slice(0, size);
}

/** Rank all captured posts before limiting; zero shared topics supplies recent backfill. */
export function selectRelatedPostPreviews<T extends PostPreview>(
  posts: readonly T[],
  { categorySlugs = [], excludeSlug, limit = CONTENT_PREVIEW_LIMIT }: RelatedPostOptions = {},
): T[] {
  const targets = new Set(categorySlugs.map(normalizeSlug).filter(Boolean));
  const overlap = (post: T) => new Set(
    (post.categoryTerms ?? []).map((term) => normalizeSlug(term.slug)).filter((slug) => targets.has(slug)),
  ).size;
  const ranked = uniquePreviews(posts, excludeSlug).map((post) => ({ post, overlap: overlap(post) }));
  ranked.sort((left, right) => right.overlap - left.overlap || compareNewestPreviews(left.post, right.post));
  return take(ranked.map(({ post }) => post), limit);
}

/** Each homepage topic gets its own newest items, even when they are old globally. */
export function selectPostCategoryPreviews<T extends PostPreview>(
  posts: readonly T[], topicSlugs: readonly string[], limit = CONTENT_PREVIEW_LIMIT,
): T[] {
  const recent = uniquePreviews(posts).sort(compareNewestPreviews);
  const pool = topicSlugs.flatMap((slug) => take(recent.filter((post) =>
    post.categoryTerms?.some((term) => normalizeSlug(term.slug) === normalizeSlug(slug)),
  ), limit));
  return uniquePreviews(pool).sort(compareNewestPreviews);
}

/** Geography outranks review presence; both local and regional tiers prefer reviews. */
export function selectRelatedProjectPreviews<T extends ProjectPreview>(
  projects: readonly T[],
  { serviceAreaSlugs = [], excludeSlug, limit = CONTENT_PREVIEW_LIMIT }: RelatedProjectOptions = {},
): T[] {
  const targets = new Set(serviceAreaSlugs.map(normalizeSlug).filter(Boolean));
  const isLocal = (project: T) => project.serviceAreas?.some((term) => targets.has(normalizeSlug(term.slug))) ?? false;
  const ranked = uniquePreviews(projects, excludeSlug).sort((left, right) =>
    Number(isLocal(right)) - Number(isLocal(left)) || compareProjectPreviews(left, right),
  );
  return take(ranked, limit);
}

export function selectProjectCategoryPreviews<T extends ProjectPreview>(
  projects: readonly T[], materialSlugs: readonly string[], limit = CONTENT_PREVIEW_LIMIT,
): T[] {
  const ranked = uniquePreviews(projects).sort(compareProjectPreviews);
  const pool = materialSlugs.flatMap((slug) => take(ranked.filter((project) =>
    project.materialTypes?.some((term) => normalizeSlug(term.slug) === normalizeSlug(slug)),
  ), limit));
  return uniquePreviews(pool).sort(compareProjectPreviews);
}
