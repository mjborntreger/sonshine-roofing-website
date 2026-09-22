import assert from 'node:assert/strict';
import { AsyncLocalStorage } from 'node:async_hooks';
import { fetchDirectusRedirects } from '../lib/content/directus-redirects.mjs';
import {
  nonMediaLegacyRedirects,
  resolveLegacyMediaRedirect,
} from '../lib/content/legacy-media-redirects.mjs';

// Next's server test helpers expect the same async-local primitive as its server.
globalThis.AsyncLocalStorage = AsyncLocalStorage;
const { unstable_getResponseFromNextConfig } = await import('next/experimental/testing/server.js');
const main = 'https://sonshine-roofing.example.test';
const worker = 'https://legacy.example.test';
const cms = 'https://cms.example.test';
const uploads = '/wp-content/uploads/';
const aliasTargets = [
  ['GAF-Footer-LOGO.png', 'master-elite-logo-hi-res-png.png'],
  ['how-long-does-a-roof-last-composite.jpg', 'how-long-does-a-roof-last-tile.webp'],
  ['how-long-does-a-roof-last-slate.jpg', 'how-long-does-a-roof-last-tile.webp'],
  ['how-long-does-a-tile-roof-last-in-florida-1080x675.jpg', 'how-long-does-a-roof-last-tile.webp'],
  ['pitch-roofed-roof-vs.-flat-roof.jpg', 'pitched-roof-vs-flat-roof.webp'],
  ['roof-leak-warning-9-roof-stain.jpg', 'roof-leak-warning-9-roof-stain.webp'],
  ['roof-lifespan-1-1080x619.jpg', 'extend-roof-lifespan.webp'],
  ['roofing-contractor-1-1080x675.jpg', 'ask-sarasota-roofing-contractor-1.webp'],
  ['sarasota-roofing-companies-sonshine-roofing.jpg', 'cropped-GBP-logo.png'],
  ['sonshine-roofing-logo.jpg', 'cropped-GBP-logo.png'],
];
const retired = [
  ['need-roof-repair-attic2-1080x675.jpg', 'need-roof-repair-attic-800x450-1.webp'],
  ['roof-leak-warning-1-algae.jpg', 'roof-leak-warning-1-algae.webp'],
];
const targets = [...aliasTargets, ...retired].map(([source, target]) => [
  uploads + source,
  worker + uploads + target,
]);
targets.push(
  ['/wp-content', worker + '/wp-content'],
  ['/wp-content/*', worker + '/wp-content/*'],
  [uploads + 'Lifted-Cox.jpg', '/'],
);
const rows = targets.map(([source_path, destination_url], i) => ({
  id: String(i),
  client: { slug: 'sonshine-roofing' },
  status: 'published',
  source_path,
  destination_url,
  status_code: 308,
  preserve_query: true,
  sort_order: i,
}));
const ordinary = {
  ...rows[0],
  id: 'ordinary',
  source_path: '/ordinary-alias',
  destination_url: '/blog',
};
async function capture(records) {
  return fetchDirectusRedirects(
    { DIRECTUS_URL: cms, DIRECTUS_TOKEN: 'synthetic', DIRECTUS_CLIENT_SLUG: 'sonshine-roofing' },
    async (input) => {
      const url = new URL(input);
      assert.deepEqual(JSON.parse(url.searchParams.get('filter')), {
        client: { slug: { _eq: 'sonshine-roofing' } },
        status: { _eq: 'published' },
      });
      return Response.json({ data: records, meta: { filter_count: records.length } });
    },
  );
}
const before = await capture([...rows, ordinary]);
assert.equal(before.legacyMediaRedirects.length, 15);
assert.deepEqual(before.redirects, [
  { source: '/ordinary-alias', destination: '/blog', statusCode: 308 },
]);

const originalGlobals = [
  { source: '/:prefix*/page/:n(\\d+)', destination: '/:prefix*', permanent: true },
  { source: '/:path*.html', destination: '/:path*', permanent: true },
  { source: '/:prefix*/:seg(wp\\-sitemap.*)', destination: '/sitemap_index', permanent: true },
];
const originalRules = rows
  .slice()
  .sort((a, b) => Number(a.source_path.endsWith('/*')) - Number(b.source_path.endsWith('/*')))
  .map((row) => ({
    source: row.source_path.replace('/*', '/:directusPath(.+)'),
    destination: row.destination_url.replace('*', ':directusPath'),
    statusCode: row.status_code,
  }));
const canonical = {
  source: '/:path*',
  has: [{ type: 'host', value: 'www.sonshine-roofing.example.test' }],
  destination: main + '/:path*',
  permanent: true,
};
async function nextResponse(url, rules) {
  return unstable_getResponseFromNextConfig({
    url,
    nextConfig: {
      async redirects() {
        return rules;
      },
    },
  });
}
async function combined(url, snapshot) {
  const platform = await nextResponse(url, [
    canonical,
    ...snapshot.redirects,
    ...nonMediaLegacyRedirects,
  ]);
  return platform.headers.has('location')
    ? { destination: platform.headers.get('location'), statusCode: platform.status }
    : resolveLegacyMediaRedirect(url, snapshot.legacyMediaRedirects);
}
const paths = [
  ...rows.filter((row) => !row.source_path.endsWith('*')).map((row) => row.source_path),
  '/wp-content/uploads/unknown.jpg',
  '/wp-content/uploads/unknown.html',
  '/wp-content/uploads/page/2',
  '/wp-content/wp-sitemap.xml',
  '/wp-content/uploads/Foo%20Bar.jpg',
  '/wp-content/uploads/foo%2Fbar.jpg',
  '/wp-content/uploads/foo%252Fbar.jpg',
  '/wp-content/uploads/sonshine-roofing-logo%2Ejpg',
  '/wp-content/uploads/dollar$&.jpg',
];
for (const path of paths)
  for (const query of ['', '?v=1&key=unknown&width=40&download=true', '?encoded=%2F']) {
    const url = main + path + query;
    const old = await nextResponse(url, [canonical, ...originalRules, ...originalGlobals]);
    const actual = await combined(url, before);
    assert.equal(actual?.statusCode, old.status, url);
    assert.equal(new URL(actual.destination, main).href, old.headers.get('location'), url);
  }
// The experimental Next helper joins duplicate query values with commas; the
// running Next server preserves duplicates, verified before this migration.
assert.equal(
  (await combined(main + rows[0].source_path + '?x=one&x=two', before)).destination,
  rows[0].destination_url + '?x=one&x=two',
);
// The helper also drops the production route regex's case-insensitive flag.
assert.equal(
  resolveLegacyMediaRedirect(
    main + '/WP-CONTENT/uploads/SONSHINE-ROOFING-LOGO.JPG',
    before.legacyMediaRedirects,
  ).destination,
  worker + uploads + 'cropped-GBP-logo.png',
);
for (const path of [
  '/foo/page/2',
  '/page/2',
  '/foo/bar/page/2',
  '/foo.html',
  '/foo/bar.html',
  '/wp-sitemap.xml',
  '/foo/wp-sitemap.xml',
  '/wp-contentious/foo.html',
  '/WP-CONTENTIOUS/page/2',
  '/.html',
  '/foo/.html',
  '/foo//bar.html',
  '/foo/.html.html',
  '/foo//page/2',
  '/foo//wp-sitemap.xml',
]) {
  const old = await nextResponse(main + path, originalGlobals);
  const actual = await nextResponse(main + path, nonMediaLegacyRedirects);
  assert.equal(actual.status, old.status, path);
  assert.equal(actual.headers.get('location'), old.headers.get('location'), path);
}
const updates = rows.map((row, i) =>
  i < 10
    ? {
        ...row,
        preserve_query: false,
        destination_url: `${cms}/assets/${String(i).padStart(8, '0')}-1111-1111-1111-111111111111`,
      }
    : row,
);
const after = await capture([...updates, ordinary]);
for (const row of updates.slice(0, 10))
  for (const query of ['', '?key=unknown', '?width=40&download=true', '?v=1&x=one&x=two']) {
    assert.deepEqual(await combined(main + row.source_path + query, after), {
      destination: row.destination_url,
      statusCode: 308,
    });
  }
for (const row of rows.slice(10).filter((row) => !row.source_path.endsWith('*'))) {
  assert.deepEqual(
    await combined(main + row.source_path + '?key=unknown', after),
    await combined(main + row.source_path + '?key=unknown', before),
  );
}
assert.deepEqual(
  await combined('https://www.sonshine-roofing.example.test' + rows[0].source_path, after),
  { destination: main + rows[0].source_path, statusCode: 308 },
);
for (const overrides of [
  { client: { slug: 'other-client' } },
  { status: 'draft' },
  { status_code: 410 },
  {
    preserve_query: false,
    destination_url: worker + '/assets/00000000-1111-1111-1111-111111111111',
  },
  {
    preserve_query: false,
    source_path: '/other-path',
    destination_url: updates[0].destination_url,
  },
  {
    preserve_query: false,
    source_path: '/wp-content/*',
    destination_url: updates[0].destination_url,
  },
  { preserve_query: false, destination_url: updates[0].destination_url + '?key=unsafe' },
  { source_path: '/wp-content/:arbitrary' },
])
  await assert.rejects(capture([{ ...rows[0], ...overrides }]));
await assert.rejects(capture([rows[0], { ...rows[0], id: 'duplicate' }]), /Duplicate/);
await assert.rejects(
  capture([
    rows[0],
    { ...rows[0], id: 'case-duplicate', source_path: rows[0].source_path.toUpperCase() },
  ]),
  /Duplicate/,
);
console.log(
  'Verified 15 legacy media rules, ten query-free direct aliases, prior Next routing parity, wildcard/retirement delegation and fail-closed capture.',
);
