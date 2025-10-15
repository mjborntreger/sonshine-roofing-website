import type { PageResult, ResourceKind, ResourceQuery } from "@/lib/ui/pagination";

const cache = new Map<string, PageResult<unknown>[]>();

function keyOf(kind: ResourceKind, q: ResourceQuery) {
  return `${kind}:${JSON.stringify({ filters: q.filters || {}, first: q.first })}`;
}

export function getCachedPages<T = unknown>(kind: ResourceKind, q: ResourceQuery): PageResult<T>[] {
  return (cache.get(keyOf(kind, q)) as PageResult<T>[] | undefined) ?? [];
}

export function setCachedPages<T = unknown>(kind: ResourceKind, q: ResourceQuery, pages: PageResult<T>[]) {
  cache.set(keyOf(kind, q), pages as PageResult<unknown>[]);
}

export async function fetchPage<T>(
  kind: ResourceKind,
  query: ResourceQuery,
  signal?: AbortSignal
): Promise<PageResult<T>> {
  const res = await fetch(`/api/resources/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
    signal,
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return (await res.json()) as PageResult<T>;
}
