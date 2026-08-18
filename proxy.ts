import { NextResponse, type NextRequest } from 'next/server';

const energyEfficientLegacyPath =
  '/🌞-energy-efficient-roofing-options-for-florida-homes-save-money-and-beat-the-heat-☀💸🏠';

const goneRoutePrefixes = [
  '/project_category/ellenton',
  '/project_category/englewood',
  '/project_category/parrish',
  '/project-category/ellenton',
  '/project-category/englewood',
  '/project-category/parrish',
  '/parrish-roofing-contractor',
  '/ellenton-roofing-contractor',
  '/englewood-roofing-contractor',
  '/about/tony',
  '/about/adam-2',
  '/about/stephanie',
  '/open-for-business-update-covid-19-safety-measures',
  '/know-about-tile-roof-repair',
  '/seven-ways-to-make-sure-your-roofing-contractor-will-rip-you-off',
  '/about/kris-marszalek',
  '/the-right-place',
  '/sonshine-roofing',
] as const;

function normalizedLegacyPath(pathname: string): string {
  let decoded = pathname;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }

  const withoutVariationSelectors = decoded.replaceAll('\uFE0F', '');
  return withoutVariationSelectors.length > 1
    ? withoutVariationSelectors.replace(/\/+$/u, '')
    : withoutVariationSelectors;
}

function matchesGoneRoute(pathname: string): boolean {
  return goneRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function proxy(req: NextRequest) {
  const pathname = normalizedLegacyPath(req.nextUrl.pathname);

  if (pathname === energyEfficientLegacyPath) {
    return NextResponse.redirect(
      new URL('/energy-efficient-roofing-options-florida', req.url),
      308,
    );
  }

  if (!matchesGoneRoute(pathname)) return NextResponse.next();

  return new NextResponse('Gone', {
    status: 410,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
