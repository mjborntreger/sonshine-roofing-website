import { listRecentVideoEntries, type VideoItem, type VideoBucketKey } from "./wp";
import { listProjectVideos } from "./projects";
import type { FacetGroup } from "./project-types";
import type { PageResult } from "../ui/pagination";
type UnknownRecord = Record<string, unknown>;

// --- Paged videos (merge video entries + project videos) -----------------
export type VideoFiltersInput = {
  buckets?: VideoBucketKey[];      // which buckets to include (OR). If omitted, include all.
  categorySlugs?: string[];        // match against v.categories[].slug/name (OR)
  materialTypeSlugs?: string[];    // project videos only (OR)
  serviceAreaSlugs?: string[];     // project videos only (OR)
  q?: string;                      // phrase match in title/excerpt (case-insensitive)
};

type VideoFiltersRecord = VideoFiltersInput & UnknownRecord;

function decodeOffset(cursor: string | null | undefined): number {
  if (!cursor) return 0;
  const n = parseInt(String(cursor), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
function encodeOffset(n: number): string { return String(n); }

function bucketOf(v: VideoItem): VideoBucketKey {
  if (v.source === "project") return "roofing-project";
  const slugs = (v.categories || []).map(c => (c.slug || c.name || "").toLowerCase());
  if (slugs.some(s => ["commercial", "commercials", "tv", "ad", "ads"].includes(s))) return "commercials";
  if (slugs.some(s => ["in-the-field"].includes(s))) return "in-the-field";
  if (slugs.some(s => ["explainer", "explainers", "how-to", "tips", "education", "educational"].includes(s))) return "explainers";
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
  // Determine which pools to fetch based on filters
  const f = (filters ?? {}) as VideoFiltersRecord;
  const record = f as UnknownRecord;
  const qValue = record.q ?? f.q;
  const q = typeof qValue === 'string' ? qValue.trim().toLowerCase() : String(qValue ?? '').trim().toLowerCase();
  const bucketsListRaw =
    Array.isArray(f.buckets) ? f.buckets
      : Array.isArray(record.bucket) ? record.bucket
        : Array.isArray(record.b) ? record.b
          : null;
  const bucketsList = bucketsListRaw ? bucketsListRaw.map((value) => String(value)) : null;
  const bucketSet = bucketsList && bucketsList.length ? new Set(bucketsList as VideoBucketKey[]) : null;

  const mtSelected = Array.isArray(f.materialTypeSlugs) && f.materialTypeSlugs.length > 0;
  const saSelected = Array.isArray(f.serviceAreaSlugs) && f.serviceAreaSlugs.length > 0;

  const wantProjects = mtSelected || saSelected || !bucketSet || bucketSet.has('roofing-project');
  const wantEntries = !bucketSet || Array.from(bucketSet).some((b) => b !== 'roofing-project');

  // Bound the pool size relative to requested page + cursor offset
  const offset = decodeOffset(after);
  const poolSize = Math.min(200, Math.max(60, offset + first * 3));

  const [entries, projects] = await Promise.all([
    wantEntries ? listRecentVideoEntries(poolSize) : Promise.resolve([]),
    wantProjects ? listProjectVideos() : Promise.resolve([]),
  ]);
  const all = [...(entries as VideoItem[]), ...(projects as VideoItem[])];
  const buckets = bucketSet;

  // Accept `categorySlugs` (preferred) or `categories`/`cat`
  const pickArray = (value: unknown): string[] | null =>
    Array.isArray(value) && value.length ? value.map((v) => String(v)) : null;

  const catInput = pickArray(f.categorySlugs)
    ?? pickArray(record.categories)
    ?? pickArray(record.cat);
  const catSlugs = catInput ? catInput.map((s) => s.toLowerCase()) : null;

  // Project-only filters with friendly aliases
  const mtInput = pickArray(f.materialTypeSlugs)
    ?? pickArray(record.materialSlugs)
    ?? pickArray(record.material);
  const mt = mtInput ? mtInput.map((s) => s.toLowerCase()) : null;

  const saInput = pickArray(f.serviceAreaSlugs)
    ?? pickArray(record.serviceAreaSlugs)
    ?? pickArray(record.serviceArea);
  const sa = saInput ? saInput.map((s) => s.toLowerCase()) : null;

  const matchesFilters = (v: VideoItem, omit?: 'bucket' | 'material_type' | 'service_area'): boolean => {
    if (omit !== 'bucket') {
      const bucket = bucketOf(v);
      if (buckets && !buckets.has(bucket)) return false;
    }

    if (catSlugs) {
      const vs = v.categories.map((c) => (c.slug || c.name || '').toLowerCase());
      if (!includesAny(vs, catSlugs)) return false;
    }

    if (omit !== 'material_type' && mt) {
      if (v.source !== 'project') return false;
      const vs = (v.materialTypes || []).map((t) => (t.slug || '').toLowerCase());
      if (!includesAny(vs, mt)) return false;
    }

    if (omit !== 'service_area' && sa) {
      if (v.source !== 'project') return false;
      const vs = (v.serviceAreas || []).map((t) => (t.slug || '').toLowerCase());
      if (!includesAny(vs, sa)) return false;
    }

    if (q) {
      const title = (v.title || '').toLowerCase();
      const ex = (v.excerpt || '').toLowerCase();
      if (!(title.includes(q) || (ex && ex.includes(q)))) return false;
    }

    return true;
  };

  const filtered = all
    .filter((v) => matchesFilters(v))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const start = decodeOffset(after);
  const end = Math.min(start + Math.max(1, Math.min(first, 50)), filtered.length);
  const slice = filtered.slice(start, end);
  const hasNextPage = end < filtered.length;
  const endCursor = hasNextPage ? encodeOffset(end) : null;

  const BUCKET_LABELS: Record<VideoBucketKey, string> = {
    commercials: "Commercials",
    explainers: "Explainers",
    "roofing-project": "Roofing Projects",
    "in-the-field": "In the Field",
    other: "Other",
  };
  const isVideoBucketKey = (value: string): value is VideoBucketKey =>
    Object.prototype.hasOwnProperty.call(BUCKET_LABELS, value);
  const bucketLabelFor = (slug: string, fallback?: string): string =>
    isVideoBucketKey(slug) ? BUCKET_LABELS[slug] : fallback ?? slug;

  const countBuckets = <T extends string>(itemsToCount: VideoItem[], getKeys: (v: VideoItem) => { slug: T; name: string }[]): Map<T, { name: string; count: number }> => {
    const map = new Map<T, { name: string; count: number }>();
    for (const item of itemsToCount) {
      for (const info of getKeys(item)) {
        const prev = map.get(info.slug);
        if (prev) {
          prev.count += 1;
        } else {
          map.set(info.slug, { name: info.name, count: 1 });
        }
      }
    }
    return map;
  };

  const bucketFacetItems = all.filter((v) => matchesFilters(v, 'bucket'));
  const bucketCountsRaw = countBuckets(bucketFacetItems, (v) => [
    { slug: bucketOf(v) as string, name: bucketLabelFor(bucketOf(v)) },
  ]);
  const bucketOrder: string[] = [...(Object.keys(BUCKET_LABELS) as VideoBucketKey[])];
  const bucketCounts = new Map<string, { name: string; count: number }>();
  for (const slug of bucketOrder) {
    const key = String(slug).toLowerCase();
    bucketCounts.set(key, { name: bucketLabelFor(key, bucketLabelFor(String(slug))), count: 0 });
  }
  bucketCountsRaw.forEach((info, slug) => {
    const key = String(slug).toLowerCase();
    const label = bucketLabelFor(key, info.name ?? key);
    const prev = bucketCounts.get(key);
    bucketCounts.set(key, { name: label, count: (prev?.count ?? 0) + info.count });
    if (!bucketOrder.includes(key)) bucketOrder.push(key);
  });
  if (Array.isArray(bucketsList) && bucketsList.length) {
    for (const value of bucketsList) {
      const key = String(value).toLowerCase();
      if (!bucketOrder.includes(key)) bucketOrder.push(key);
      if (!bucketCounts.has(key)) {
        const label = bucketLabelFor(key);
        bucketCounts.set(key, { name: label, count: 0 });
      }
    }
  }

  const materialFacetItems = all.filter((v) => matchesFilters(v, 'material_type'));
  const materialCounts = countBuckets(materialFacetItems, (v) =>
    (v.materialTypes || []).map((term) => ({ slug: String(term.slug || '').toLowerCase(), name: String(term.name || term.slug || '') }))
  );

  const serviceFacetItems = all.filter((v) => matchesFilters(v, 'service_area'));
  const serviceCounts = countBuckets(serviceFacetItems, (v) =>
    (v.serviceAreas || []).map((term) => ({ slug: String(term.slug || '').toLowerCase(), name: String(term.name || term.slug || '') }))
  );

  const ensureKeys = (map: Map<string, { name: string; count: number }>, keys: (string | undefined | null)[], fallbackName?: (slug: string) => string) => {
    for (const key of keys) {
      if (!key) continue;
      const slug = String(key).toLowerCase();
      if (!map.has(slug)) {
        map.set(slug, { name: fallbackName ? fallbackName(slug) : slug, count: 0 });
      }
    }
  };

  ensureKeys(materialCounts, mtInput || []);
  ensureKeys(serviceCounts, saInput || []);

  const facets: FacetGroup[] = [
    {
      taxonomy: 'bucket',
      buckets: bucketOrder
        .map((slug) => {
          const info = bucketCounts.get(slug);
          if (!info) return null;
          return {
            slug,
            name: info.name,
            count: info.count,
          };
        })
        .filter((bucket): bucket is FacetGroup["buckets"][number] => bucket !== null),
    },
    {
      taxonomy: 'material_type',
      buckets: Array.from(materialCounts.entries()).map(([slug, info]) => ({
        slug,
        name: info.name,
        count: info.count,
      })),
    },
    {
      taxonomy: 'service_area',
      buckets: Array.from(serviceCounts.entries()).map(([slug, info]) => ({
        slug,
        name: info.name,
        count: info.count,
      })),
    },
  ];

  const total = filtered.length;

  return {
    pageInfo: { hasNextPage, endCursor },
    items: slice,
    total,
    facets,
    meta: {
      overallTotal: total,
      fullTotal: all.length,
    },
  } as PageResult<VideoItem> & { facets: FacetGroup[] };
}
