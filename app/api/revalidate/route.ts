import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export const dynamic = "force-dynamic"; // never cache this endpoint

// --- helpers ---------------------------------------------------------------
const ok = (data: unknown, init: ResponseInit = {}) =>
  NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init.headers || {}) },
  });

function ensureLeadingSlash(p: string) {
  return p.startsWith("/") ? p : `/${p}`;
}
function uniq<T>(xs: T[]) {
  return Array.from(new Set(xs.filter(Boolean)));
}
function authorized(req: Request) {
  const url = new URL(req.url);
  const incoming =
    req.headers.get("x-revalidate-secret") ||
    req.headers.get("x-vercel-reval-key") ||
    url.searchParams.get("secret") ||
    "";
  const expected = process.env.REVALIDATE_SECRET || "";
  return expected.length > 0 && incoming === expected;
}

// --- POST /api/revalidate --------------------------------------------------
// Body shapes supported (all optional):
// { path: "/path" } | { paths: ["/a","/b"] } | { tag: "post:123" } | { tags: ["..."] }
export async function POST(req: Request) {
  if (!authorized(req)) return ok({ error: "Unauthorized" }, { status: 401 });

  let body: any = {};
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      body = await req.json();
    }
  } catch {
    // ignore bad JSON; we'll just treat as empty body
  }

  const paths = uniq<string>(
    (body.paths ?? (body.path ? [body.path] : [])).map(String).map(ensureLeadingSlash)
  );
  const tags = uniq<string>((body.tags ?? (body.tag ? [body.tag] : [])).map(String));

  const revalidated = { paths: [] as string[], tags: [] as string[] };

  for (const p of paths) {
    revalidatePath(p);
    revalidated.paths.push(p);
  }
  for (const t of tags) {
    revalidateTag(t);
    revalidated.tags.push(t);
  }

  return ok({ revalidated, now: new Date().toISOString() });
}

// --- GET /api/revalidate ---------------------------------------------------
// Handy for quick tests: /api/revalidate?secret=...&path=/about&path=/blog
// Also supports: ?tags=foo,bar OR repeated ?tag=foo&tag=bar
export async function GET(req: Request) {
  if (!authorized(req)) return ok({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const paths = uniq<string>([
    ...url.searchParams.getAll("path"),
    ...url.searchParams.getAll("p"),
    ...(url.searchParams.get("paths")?.split(",") ?? []),
  ])
    .map(String)
    .map(ensureLeadingSlash);

  const tags = uniq<string>([
    ...url.searchParams.getAll("tag"),
    ...(url.searchParams.get("tags")?.split(",") ?? []),
  ]).map(String);

  const revalidated = { paths: [] as string[], tags: [] as string[] };

  for (const p of paths) {
    revalidatePath(p);
    revalidated.paths.push(p);
  }
  for (const t of tags) {
    revalidateTag(t);
    revalidated.tags.push(t);
  }

  return ok({ revalidated, now: new Date().toISOString() });
}

// Preflight (optional nicety if you call from a browser tool)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-revalidate-secret",
    },
  });
}