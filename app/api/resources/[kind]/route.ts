import { NextResponse } from "next/server";
import type { ResourceQuery, PageResult } from "@/lib/pagination";
import {
  // BLOG
  listPostsPaged,
  // PROJECTS
  listProjectsPaged,
  type ProjectsArchiveFilters,
  type ProjectSearchResult,
  // VIDEOS
  listVideoItemsPaged, // small adapter; see note below
} from "@/lib/wp";

export async function POST(
  req: Request,
  ctx: any
) {
  const { params } = ctx as { params: { kind: string } };
  try {
    const { kind } = params;
    const body = (await req.json()) as ResourceQuery;
    const first = Math.max(1, Math.min( body.first ?? 24, 50 ));
    const after = body.after ?? null;
    const filters = body.filters ?? {};

    let result: PageResult<any>;

    if (kind === "project") {
      const toSlugArray = (value: unknown): string[] => {
        if (Array.isArray(value)) {
          return value
            .map((v) => (typeof v === 'string' ? v : String(v ?? '')).trim())
            .filter(Boolean);
        }
        if (typeof value === 'string') {
          return value
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);
        }
        return [];
      };

      const projectFilters: ProjectsArchiveFilters = {
        search:
          typeof (filters as any)?.search === 'string'
            ? (filters as any).search
            : typeof (filters as any)?.q === 'string'
            ? (filters as any).q
            : undefined,
        materialTypeSlugs: toSlugArray((filters as any)?.materialTypeSlugs ?? (filters as any)?.mt),
        roofColorSlugs: toSlugArray((filters as any)?.roofColorSlugs ?? (filters as any)?.rc),
        serviceAreaSlugs: toSlugArray((filters as any)?.serviceAreaSlugs ?? (filters as any)?.sa),
      };

      const projectResult: ProjectSearchResult = await listProjectsPaged({ first, after, filters: projectFilters });
      return NextResponse.json(projectResult);
    } else if (kind === "video") {
      // Merge entries + project videos; paginate client-side
      result = await listVideoItemsPaged({ first, after, filters });
    } else if (kind === "blog") {
      // Cursor-based blog pagination with optional search/categories
      result = await listPostsPaged({ first, after, filters });
    } else {
      return NextResponse.json({ error: "Unknown resource kind" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
