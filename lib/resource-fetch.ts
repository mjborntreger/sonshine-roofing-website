import type { PageResult, ResourceKind, ResourceQuery } from "@/lib/pagination";

const cache = new Map<string, PageResult<any>[]>();

function keyOf(kind: ResourceKind, q: ResourceQuery) {
  return `${kind}:${JSON.stringify({ filters: q.filters || {}, first: q.first })}`;
}

export function getCachedPages(kind: ResourceKind, q: ResourceQuery) {
  return cache.get(keyOf(kind, q)) || [];
}
export function setCachedPages(kind: ResourceKind, q: ResourceQuery, pages: PageResult<any>[]) {
  cache.set(keyOf(kind, q), pages);
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