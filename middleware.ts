// middleware.ts
import { NextResponse } from "next/server";

export function middleware(req: Request) {
  const host = new URL(req.url).host;
  const isStagingHost = host.startsWith("staging.");

  const user = (process.env.BASIC_AUTH_USER || "").trim();
  const pass = (process.env.BASIC_AUTH_PASS || "").trim();

  // Only enforce if we're on staging AND both vars exist
  const shouldProtect = isStagingHost && !!user && !!pass;
  if (!shouldProtect) return NextResponse.next();

  // Edge-safe base64
  const expected = "Basic " + btoa(`${user}:${pass}`);
  const provided = req.headers.get("authorization") || "";

  if (provided !== expected) {
    return new NextResponse("Auth required", {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="SonShine Staging", charset="UTF-8"',
        // small hint for debugging without leaking secrets
        'x-auth-stage': 'challenge',
      },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots\\.txt|sitemap_index|__sitemaps).*)',
  ],
};
