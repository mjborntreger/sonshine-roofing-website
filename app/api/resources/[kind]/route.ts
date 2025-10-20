import { NextResponse } from "next/server";
import type { ResourceQuery } from "@/lib/ui/pagination";
import {
  // BLOG
  listPostsPaged,
  // PROJECTS
  listProjectsPaged,
  type ProjectsArchiveFilters,
  type ProjectSearchResult,
  type PostsFiltersInput,
  type VideoFiltersInput,
  // VIDEOS
  listVideoItemsPaged, // small adapter; see note below
} from "@/lib/content/wp";

type RouteContext = { params: { kind: string } };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toSlugArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === "string" ? v : String(v ?? ""))).map((v) => v.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

const clampPageSize = (value: unknown, fallback: number, max = 50, min = 1): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(min, Math.min(value, max));
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return Math.max(min, Math.min(parsed, max));
    }
  }
  return Math.max(min, Math.min(fallback, max));
};

export async function POST(
  req: Request,
  context: RouteContext
) {
  try {
    const { kind } = context.params;

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      rawBody = null;
    }

    if (!isRecord(rawBody)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const firstInput =
      typeof rawBody.first === "number"
        ? rawBody.first
        : typeof rawBody.first === "string"
        ? Number.parseInt(rawBody.first, 10)
        : undefined;

    const normalizedFirst =
      typeof firstInput === "number" && Number.isFinite(firstInput) ? firstInput : undefined;

    const body: ResourceQuery = {
      first: normalizedFirst,
      after: typeof rawBody.after === "string" || rawBody.after === null ? rawBody.after : undefined,
      filters: isRecord(rawBody.filters) ? rawBody.filters : undefined,
    };

    const first = clampPageSize(body.first ?? 24, 24);
    const after = typeof body.after === "string" ? body.after : null;
    const filters = (body.filters && isRecord(body.filters) ? body.filters : {}) as Record<string, unknown>;

    if (kind === "project") {
      const projectFilters: ProjectsArchiveFilters = {
        search:
          typeof filters.search === "string"
            ? filters.search
            : typeof filters.q === "string"
            ? filters.q
            : undefined,
        materialTypeSlugs: toSlugArray(filters.materialTypeSlugs ?? filters.mt),
        roofColorSlugs: toSlugArray(filters.roofColorSlugs ?? filters.rc),
        serviceAreaSlugs: toSlugArray(filters.serviceAreaSlugs ?? filters.sa),
      };

      const projectResult: ProjectSearchResult = await listProjectsPaged({ first, after, filters: projectFilters });
      return NextResponse.json(projectResult);
    } else if (kind === "video") {
      // Merge entries + project videos; paginate client-side
      const videoResult = await listVideoItemsPaged({ first, after, filters: filters as VideoFiltersInput });
      return NextResponse.json(videoResult);
    } else if (kind === "blog") {
      // Cursor-based blog pagination with optional search/categories
      const blogResult = await listPostsPaged({ first, after, filters: filters as PostsFiltersInput });
      return NextResponse.json(blogResult);
    } else {
      return NextResponse.json({ error: "Unknown resource kind" }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
