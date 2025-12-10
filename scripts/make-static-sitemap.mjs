import fg from 'fast-glob';
import { statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, sep } from 'node:path';

const ROOT = process.cwd();
const SUPPORTED_LOCALES = ["en", "es"];
const DEFAULT_LOCALE = "en";

const files = await fg(['app/**/page.@(tsx|jsx|mdx)'], {
  dot: false,
  onlyFiles: true,
  ignore: [
    'app/**/api/**',
    'app/es/**',
    'app/**/sitemap_index/**',
    'app/**/robots.ts',
    'app/**/route.ts',          // non-page routes
    'app/**/error.tsx',
    'app/**/not-found.tsx',
    'app/**/global-error.tsx',
    'app/**/[[]*[]]/**',        // dynamic segments like [slug]
    'app/**/[[*]]/**',          // optional catch-alls
    'app/**/@*/*',              // parallel routes
  ]
});

function segmentToUrlPart(seg) {
  // drop route groups like (marketing)
  if (seg.startsWith('(') && seg.endsWith(')')) return '';
  return seg;
}

function fileToRoute(p) {
  // convert e.g. app/(marketing)/contact-us/page.tsx -> /contact-us
  const rel = p.split('app'+sep)[1].replace(/\\/g, '/');
  const parts = rel.split('/');
  parts.pop(); // remove page.tsx
  const filtered = parts.map(segmentToUrlPart).filter(Boolean);
  const route = '/'+filtered.join('/');
  return route === '/' ? '/' : route.replace(/\/index$/,'/').replace(/\/+/g, '/');
}

const items = files.map((f) => {
  const route = fileToRoute(f);
  const mtime = statSync(join(ROOT, f)).mtime.toISOString();
  return { loc: route, lastmod: mtime };
});

// Exclude specific routes from the static sitemap
const EXCLUDE = new Set(["/calendly-test", "/reviews", "/tell-us-why"]);

const stripLocale = (path) => {
  if (typeof path !== "string") return "/";
  if (path.startsWith("/es")) {
    const remainder = path.slice(3) || "/";
    return remainder.startsWith("/") ? remainder : `/${remainder}`;
  }
  return path;
};

const prefixLocale = (path, locale) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return normalized;
  return normalized === "/" ? "/es" : `/es${normalized}`;
};

const filtered = items.filter(({ loc }) => !EXCLUDE.has(stripLocale(loc)));

// Optionally fallback to commit time
const commitTs = process.env.VERCEL_GIT_COMMIT_TIMESTAMP;
const routes = filtered.flatMap(({ loc, lastmod }) => {
  const base = stripLocale(loc);
  return SUPPORTED_LOCALES.map((locale) => ({
    loc: prefixLocale(base, locale),
    locale,
    lastmod: commitTs || lastmod,
  }));
});

const outDir = join(ROOT, 'public', '__sitemaps');
const outPath = join(outDir, 'static-routes.json');
mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), routes }, null, 2));
console.log(`Wrote ${routes.length} static routes → ${outPath}`);
