import { NextResponse } from "next/server";
import type { ResourceQuery, PageResult } from "@/lib/pagination";
import {
  // BLOG
  listPostsPaged,
  // PROJECTS
  listProjectsPaged,
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
      // Expect: { materialTypeSlugs?: string[]; roofColorSlugs?: string[]; serviceAreaSlugs?: string[] }
      result = await listProjectsPaged({ ...filters, first, after });
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