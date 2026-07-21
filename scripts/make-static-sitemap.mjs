import fg from 'fast-glob';
import { execFileSync } from 'node:child_process';
import { existsSync, statSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';

const ROOT = process.cwd();
const GIT = process.platform === 'win32' ? 'git' : '/usr/bin/git';

function loadEnvFile(filename) {
  const path = join(ROOT, filename);
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    if (process.env[key] !== undefined) continue;
    let value = line.slice(separator + 1).trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.at(-1) === quote) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile('.env');
loadEnvFile('.env.local');

async function readDirectusCollection(collection, fields) {
  const baseUrl = (process.env.DIRECTUS_URL ?? '').trim().replace(/\/+$/u, '');
  const token = (process.env.DIRECTUS_TOKEN ?? process.env.DIRECTUS_STATIC_TOKEN ?? '').trim();
  const clientSlug = (process.env.DIRECTUS_CLIENT_SLUG ?? '').trim();
  if (!baseUrl || !token || !clientSlug) {
    throw new Error('[static-sitemap] Directus configuration is required.');
  }
  const url = new URL(`/items/${collection}`, baseUrl);
  url.searchParams.set('fields', fields.join(','));
  url.searchParams.set(
    'filter',
    JSON.stringify({ client: { slug: { _eq: clientSlug } }, status: { _eq: 'published' } }),
  );
  url.searchParams.set('limit', '500');
  const response = await fetch(url, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`[static-sitemap] Directus ${collection} request failed with HTTP ${response.status}.`);
  }
  const payload = await response.json();
  return Array.isArray(payload.data) ? payload.data : [];
}

const files = await fg(['app/**/page.@(tsx|jsx|mdx)'], {
  dot: false,
  onlyFiles: true,
  ignore: [
    'app/**/api/**',
    'app/**/sitemap_index/**',
    'app/**/robots.ts',
    'app/**/route.ts', // non-page routes
    'app/**/error.tsx',
    'app/**/not-found.tsx',
    'app/**/global-error.tsx',
    'app/**/[[]*[]]/**', // dynamic segments like [slug]
    'app/**/[[*]]/**', // optional catch-alls
    'app/**/@*/*', // parallel routes
  ],
});

function segmentToUrlPart(seg) {
  // drop route groups like (marketing)
  if (seg.startsWith('(') && seg.endsWith(')')) return '';
  return seg;
}

function fileToRoute(p) {
  // convert e.g. app/(marketing)/contact-us/page.tsx -> /contact-us
  const rel = p.split('app' + sep)[1].replace(/\\/g, '/');
  const parts = rel.split('/');
  parts.pop(); // remove page.tsx
  const filtered = parts.map(segmentToUrlPart).filter(Boolean);
  const route = '/' + filtered.join('/');
  return route === '/' ? '/' : route.replace(/\/index$/, '/').replace(/\/+/g, '/');
}

function toIsoTimestamp(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function fileLastmod(file) {
  try {
    const gitTimestamp = execFileSync(GIT, ['log', '-1', '--format=%cI', '--', file], {
      cwd: ROOT,
      env: {
        ...process.env,
        GIT_CONFIG_GLOBAL: '/dev/null',
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_OPTIONAL_LOCKS: '0',
      },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    if (gitTimestamp) return toIsoTimestamp(gitTimestamp);
  } catch {
    // Git metadata is not always available in CI artifacts or copied directories.
  }

  return statSync(join(ROOT, file)).mtime.toISOString();
}

const items = files
  .map((f) => {
    const route = fileToRoute(f);
    return { loc: route, lastmod: fileLastmod(f) };
  })
  .sort((a, b) => a.loc.localeCompare(b.loc));

const [websitePages, services] = await Promise.all([
  readDirectusCollection('website_pages', ['path', 'noindex']),
  readDirectusCollection('services', ['slug', 'noindex']),
]);
const fixedNoindexPaths = new Set(
  websitePages.filter((page) => page.noindex === true).map((page) => page.path),
);
const serviceNoindexPaths = new Set(
  services
    .filter((service) => service.noindex === true)
    .map((service) => `/${String(service.slug ?? '').replace(/^\/+|\/+$/gu, '')}`),
);

// Exclude specific routes from the static sitemap
const EXCLUDE = new Set(['/reviews', '/tell-us-why', '/thank-you', '/truck-for-sale']);
const filtered = items.filter(
  ({ loc }) =>
    !EXCLUDE.has(loc) && !fixedNoindexPaths.has(loc) && !serviceNoindexPaths.has(loc),
);

// Optionally fallback to commit time
const commitTs = process.env.VERCEL_GIT_COMMIT_TIMESTAMP
  ? toIsoTimestamp(process.env.VERCEL_GIT_COMMIT_TIMESTAMP)
  : null;
const routes = filtered.map(({ loc, lastmod }) => ({ loc, lastmod: commitTs || lastmod }));
const generatedAt =
  commitTs ||
  routes.reduce((latest, { lastmod }) => {
    return !latest || lastmod > latest ? lastmod : latest;
  }, null) ||
  '1970-01-01T00:00:00.000Z';

const outDir = join(ROOT, 'public', '__sitemaps');
const outPath = join(outDir, 'static-routes.json');
const payload = JSON.stringify({ generatedAt, routes }, null, 2);

mkdirSync(outDir, { recursive: true });
try {
  if (readFileSync(outPath, 'utf8') === payload) {
    console.log(`Static routes unchanged (${routes.length}) at ${outPath}`);
    process.exit(0);
  }
} catch {
  // Missing or unreadable output is handled by writing a fresh file below.
}

writeFileSync(outPath, payload);
console.log(`Wrote ${routes.length} static routes → ${outPath}`);
