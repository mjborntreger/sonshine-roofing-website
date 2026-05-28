import fg from 'fast-glob';
import { execFileSync } from 'node:child_process';
import { statSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';

const ROOT = process.cwd();
const GIT = process.platform === 'win32' ? 'git' : '/usr/bin/git';

const files = await fg(['app/**/page.@(tsx|jsx|mdx)'], {
  dot: false,
  onlyFiles: true,
  ignore: [
    'app/**/api/**',
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

const items = files.map((f) => {
  const route = fileToRoute(f);
  return { loc: route, lastmod: fileLastmod(f) };
}).sort((a, b) => a.loc.localeCompare(b.loc));

// Exclude specific routes from the static sitemap
const EXCLUDE = new Set(["/reviews", "/tell-us-why"]);
const filtered = items.filter(({ loc }) => !EXCLUDE.has(loc));

// Optionally fallback to commit time
const commitTs = process.env.VERCEL_GIT_COMMIT_TIMESTAMP
  ? toIsoTimestamp(process.env.VERCEL_GIT_COMMIT_TIMESTAMP)
  : null;
const routes = filtered.map(({ loc, lastmod }) => ({ loc, lastmod: commitTs || lastmod }));
const generatedAt = commitTs || routes.reduce((latest, { lastmod }) => {
  return !latest || lastmod > latest ? lastmod : latest;
}, null) || '1970-01-01T00:00:00.000Z';

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
