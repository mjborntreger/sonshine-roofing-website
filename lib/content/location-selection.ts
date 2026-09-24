import type { GeographicRecord, LocationGroups } from './location-types';
import { hasProjectReview } from './preview-selection.ts';

export type LocationSelectionOptions = {
  areaId: string;
  /** Direct, approved neighbors from the deployment snapshot; never expanded here. */
  nearbyAreaIds: readonly string[];
  clientSlug: string;
  kind: 'projects' | 'reviews' | 'sponsors';
};

function compareIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function recordTime(record: GeographicRecord): number {
  const value = record.date ? Date.parse(record.date) : Number.NaN;
  return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
}

function recordSort(record: GeographicRecord): number {
  return 'sort' in record && typeof record.sort === 'number' && Number.isFinite(record.sort)
    ? record.sort
    : Number.POSITIVE_INFINITY;
}

function projectHasReview(record: GeographicRecord): boolean {
  if (!('project' in record) || !record.project || typeof record.project !== 'object') return false;
  const reviewSnippet = 'reviewSnippet' in record.project ? record.project.reviewSnippet : null;
  return hasProjectReview({ reviewSnippet: typeof reviewSnippet === 'string' ? reviewSnippet : null });
}

/** Select only published, assigned, same-client records; local results always win duplicates. */
export function selectLocationContent<T extends GeographicRecord>(
  records: readonly T[],
  { areaId, nearbyAreaIds, clientSlug, kind }: LocationSelectionOptions,
): LocationGroups<T> {
  const nearbyIds = new Set(nearbyAreaIds.filter((id) => id && id !== areaId));
  const eligible = records.filter(
    (record) =>
      record.id.trim() &&
      record.clientSlug === clientSlug &&
      record.status === 'published' &&
      record.serviceAreaIds.length > 0 &&
      (kind !== 'reviews' || ('rating' in record && record.rating === 5)),
  );
  const compare = (left: T, right: T): number => {
    if (kind === 'projects') {
      const reviewPriority = Number(projectHasReview(right)) - Number(projectHasReview(left));
      if (reviewPriority) return reviewPriority;
    }
    const leftValue = kind === 'sponsors' ? recordSort(left) : recordTime(left);
    const rightValue = kind === 'sponsors' ? recordSort(right) : recordTime(right);
    if (leftValue !== rightValue) {
      return kind === 'sponsors'
        ? leftValue < rightValue ? -1 : 1
        : leftValue > rightValue ? -1 : 1;
    }
    return compareIds(left.id, right.id);
  };
  const seen = new Set<string>();
  const unique = (pool: T[]) => pool.sort(compare).filter((record) => {
    if (seen.has(record.id)) return false;
    seen.add(record.id);
    return true;
  });

  const local = unique(eligible.filter((record) => record.serviceAreaIds.includes(areaId)));
  const nearby = unique(eligible.filter((record) =>
    !record.serviceAreaIds.includes(areaId) &&
    record.serviceAreaIds.some((id) => nearbyIds.has(id)),
  ));
  if (kind === 'sponsors') {
    return { local, nearby: nearby.slice(0, Math.max(0, 3 - local.length)) };
  }
  if (kind === 'reviews') {
    return { local, nearby: nearby.slice(0, Math.max(0, 6 - local.length)) };
  }
  return { local: local.slice(0, 6), nearby: nearby.slice(0, Math.max(0, 6 - local.length)) };
}
