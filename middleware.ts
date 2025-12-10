import { NextResponse, type NextRequest } from 'next/server';
import { getLocaleFromPath } from './lib/i18n/locale';

const GONE_PATHS: Array<RegExp | string> = [
  // Category/project legacy prefixes
  /^\/project_category\/ellenton(?:\/|$)/,
  /^\/project_category\/englewood(?:\/|$)/,
  /^\/project_category\/parrish(?:\/|$)/,
  /^\/project-category\/ellenton(?:\/|$)/,
  /^\/project-category\/englewood(?:\/|$)/,
  /^\/project-category\/parrish(?:\/|$)/,
  /^\/parrish-roofing-contractor(?:\/|$)/,
  /^\/ellenton-roofing-contractor(?:\/|$)/,
  /^\/englewood-roofing-contractor(?:\/|$)/,

  // Specific retired pages
  /^\/about\/tony(?:\/|$)/,
  /^\/about\/adam-2(?:\/|$)/,
  /^\/about\/stephanie(?:\/|$)/,
  /^\/open-for-business-update-covid-19-safety-measures(?:\/|$)/,
  /^\/know-about-tile-roof-repair(?:\/|$)/,
  /^\/seven-ways-to-make-sure-your-roofing-contractor-will-rip-you-off(?:\/|$)/,
  /^\/about\/kris-marszalek(?:\/|$)/,
  /^\/the-right-place(?:\/|$)/,
  /^\/sonshine-roofing(?:\/|$)/,
];

const isGonePath = (pathname: string) =>
  GONE_PATHS.some((rule) => (rule instanceof RegExp ? rule.test(pathname) : pathname.startsWith(rule)));

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isGonePath(pathname)) {
    return new NextResponse('Gone', {
      status: 410,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        // cache for a day at edge/CDN; adjust as desired
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  const requestHeaders = new Headers(req.headers);
  const locale = getLocaleFromPath(pathname);
  requestHeaders.set('x-locale', locale);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Run for all routes except _next/static, _next/image and assets.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.[^.]+$).*)'],
};
