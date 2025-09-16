import { NextResponse, type NextRequest } from 'next/server';

// 410 Gone for legacy/gone content.
// Use matcher (below) to target only these paths.
export function middleware(_req: NextRequest) {
  return new NextResponse('Gone', {
    status: 410,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      // cache for a day at edge/CDN; adjust as desired
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

// Apply only to the gone routes. Trailing segments with :path* cover optional trailing slashes.
export const config = {
  matcher: [
    // Category/project legacy prefixes
    '/project_category/ellenton/:path*',
    '/project_category/englewood/:path*',
    '/project_category/parrish/:path*',
    '/parrish-roofing-contractor/:path*',
    '/ellenton-roofing-contractor/:path*',
    '/englewood-roofing-contractor/:path*',

    // Specific retired pages
    '/about/tony/:path*',
    '/about/adam-2/:path*',
    '/about/stephanie/:path*',
    '/open-for-business-update-covid-19-safety-measures/:path*',
  ],
};

