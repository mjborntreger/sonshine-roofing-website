// lib/pagination.ts
export type PageInfo = { hasNextPage: boolean; endCursor: string | null };

export type PageResult<T> = {
  items: T[];
  pageInfo: PageInfo;
};

export type ResourceKind = "blog" | "project" | "video";

export type ResourceQuery = {
  // filters/search are per-kind, so keep this loose and pass-through to wp.ts
  filters?: Record<string, unknown>;
  first?: number;        // page size
  after?: string | null; // cursor
};