import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fetchDirectusProjectSnapshot, mapDirectusProject, prepareProjectBody, projectHtmlToPlainText } from '../lib/content/directus-projects.mjs';
import { readProjectSnapshot, queryProjectSnapshot } from '../lib/content/project-data.ts';

const config = { url: 'https://cms.example.test', clientSlug: 'fixture-client' };
const term = (slug, name = slug) => ({ slug, name, status: 'published', client: { slug: config.clientSlug } });
const file = (id) => ({ id, type: 'image/webp', description: `A described roof ${id}`, width: 2000, height: 1500 });
const source = {
  id: 'one', scope_key: 'fixture-client:blue-roof', external_id: 'wordpress:sonshine-roofing:fixture',
  client: { slug: config.clientSlug }, status: 'published', title: 'Blue roof & sunny day', slug: 'blue-roof',
  description: 'A metal roof in Sarasota.', published_at: '2020-01-01T12:00:00Z', date_updated: '2021-02-01T12:00:00Z', source_updated_at: '2021-02-01T12:00:00Z',
  body: '<p>AT&amp;T <strong>roof</strong> <a href="javascript:alert(1)">unsafe</a></p><script>alert(1)</script>',
  featured_image: file('hero'), gallery: Array.from({ length: 24 }, (_, i) => ({ sort: 24 - i, directus_files_id: file(`image-${24 - i}`) })),
  material_type: term('metal'), service_area: term('sarasota'), roof_color: null,
  product_links: [{ label: 'Standing seam', href: 'https://example.test/product' }],
  youtube_url: 'https://www.youtube.com/watch?v=abcdefghijk', noindex: false,
  meta_description: null, focus_keywords: [],
};
const project = mapDirectusProject(source, config);
assert.equal(project.projectImages.length, 24, 'all gallery images must survive beyond the default nested page size');
assert.match(project.projectImages[0].url, /image-1$/u);
assert.equal(project.heroImage.width, 2000);
assert.equal(new URL(project.heroImage.url).search, '', 'source assets must not request a transformation');
assert.equal(project.modified, source.source_updated_at, 'import dates must not become editorial dates');
assert.equal(mapDirectusProject({ ...source, date_updated: '2026-10-01T00:00:00Z' }, config).modified, '2026-10-01T00:00:00Z', 'later editorial updates must supersede source provenance');
assert.equal(project.seo.description, null, 'existing route description fallback remains available');
assert.deepEqual(project.roofColors, []);
assert.equal(project.contentHtml, '<p>AT&amp;T <strong>roof</strong> <a>unsafe</a></p>');
assert.equal(projectHtmlToPlainText(project.contentHtml), 'AT&T roof unsafe');
assert.doesNotMatch(prepareProjectBody('<p class="lead"><a href="//unsafe.test" target="_blank">link</a><img src="https://wp.example.test/a.webp"></p>'), /class=|href=|<img/u);
assert.match(prepareProjectBody('<a href="/project/roof" target="_blank">roof</a>'), /rel="noopener noreferrer"/u);

for (const patch of [
  { status: 'draft' }, { client: { slug: 'another-client' } },
  { featured_image: { ...file('hero'), description: '' } },
  { featured_image: { ...file('hero'), type: 'video/mp4' } },
  { material_type: { ...term('metal'), status: 'draft' } },
  { service_area: { ...term('sarasota'), client: { slug: 'another-client' } } },
  { gallery: [{ sort: 1, directus_files_id: file('a') }, { sort: 1, directus_files_id: file('b') }] },
  { gallery: null }, { product_links: [{ label: 'Unsafe', href: 'javascript:alert(1)' }] },
  { external_id: null }, { primary_focus_keyword: 'roof', focus_keywords: ['wrong', 'roof'] },
]) assert.throws(() => mapDirectusProject({ ...source, ...patch }, config));

const snapshot = { version: 1, clientSlug: config.clientSlug, projects: [
  project,
  { ...project, slug: 'tile-roof', title: 'Tile roof', materialTypes: [term('tile')], roofColors: [term('red')], serviceAreas: [term('venice')], projectDescription: 'Courtyard' },
  { ...project, slug: 'another-metal', title: 'Another metal roof', roofColors: [term('red')], projectDescription: 'Courtyard' },
], terms: { materials: [term('metal'), term('tile')], roofColors: [term('red')], serviceAreas: [term('sarasota'), term('venice'), term('unused')] } };
assert.equal(queryProjectSnapshot(snapshot, { first: 1 }).pageInfo.endCursor, '1');
assert.deepEqual(queryProjectSnapshot(snapshot, { first: 1, after: '1' }).items.map((row) => row.slug), ['tile-roof']);
assert.deepEqual(queryProjectSnapshot(snapshot, { filters: { materialTypeSlugs: ['metal', 'tile'], serviceAreaSlugs: ['venice'], roofColorSlugs: ['red'] } }).items.map((row) => row.slug), ['tile-roof']);
assert.equal(queryProjectSnapshot(snapshot, { filters: { search: 'SUNNY' } }).total, 1);
assert.equal(queryProjectSnapshot(snapshot, { filters: { search: 'Courtyard' } }).total, 0);
const descriptionOnly = queryProjectSnapshot(snapshot, { filters: { search: 'Courtyard' } });
assert.equal(descriptionOnly.meta.overallTotal, 0, 'facet totals must describe the same title/body result set');
assert.ok(descriptionOnly.facets.every((facet) => facet.buckets.every((bucket) => bucket.count === 0)));
const tileSearch = queryProjectSnapshot(snapshot, { filters: { search: 'tile' } });
assert.equal(tileSearch.total, 1);
assert.equal(tileSearch.meta.overallTotal, 1);
assert.equal(tileSearch.facets.find((facet) => facet.taxonomy === 'material_type').buckets.find((bucket) => bucket.slug === 'metal').count, 0);
assert.equal(queryProjectSnapshot(snapshot, { filters: { serviceAreaSlugs: ['unused'] } }).total, 0);
const facetResult = queryProjectSnapshot(snapshot, { filters: { materialTypeSlugs: ['metal'], roofColorSlugs: ['red'] } });
assert.equal(facetResult.total, 1);
assert.deepEqual(facetResult.facets.find((facet) => facet.taxonomy === 'material_type').buckets.map(({ slug, count }) => ({ slug, count })), [{ slug: 'metal', count: 1 }, { slug: 'tile', count: 0 }]);
assert.equal(facetResult.meta.fullTotal, 3);
assert.equal('contentHtml' in facetResult.items[0], false, 'resource responses contain summaries only');

const directory = await mkdtemp(join(tmpdir(), 'project-snapshot-test-'));
const originalFetch = globalThis.fetch;
try {
  const filename = join(directory, 'projects.json');
  assert.throws(() => readProjectSnapshot(filename), /unavailable/u);
  await writeFile(filename, JSON.stringify(snapshot));
  globalThis.fetch = () => { throw new Error('Runtime CMS access is forbidden'); };
  const deployed = readProjectSnapshot(filename);
  source.title = 'An unpublished later CMS change';
  assert.equal(queryProjectSnapshot(deployed).items[0].title, 'Blue roof & sunny day');
  assert.equal(deployed.projects.find((row) => row.slug === 'new-cms-slug'), undefined);
  await writeFile(filename, '{}');
  assert.throws(() => readProjectSnapshot(filename), /invalid/u);
} finally {
  globalThis.fetch = originalFetch;
  await rm(directory, { recursive: true, force: true });
}

await assert.rejects(fetchDirectusProjectSnapshot({}), /Build requires/u);
const env = { DIRECTUS_URL: config.url, DIRECTUS_CLIENT_SLUG: config.clientSlug, DIRECTUS_TOKEN: 'synthetic-token' };
await assert.rejects(fetchDirectusProjectSnapshot(env, async () => ({ ok: false, status: 403 })), /HTTP 403/u);
await assert.rejects(fetchDirectusProjectSnapshot(env, async () => ({ ok: true, json: async () => ({ data: [] }) })), /inventory is empty/u);
const requests = [];
const full = await fetchDirectusProjectSnapshot(env, async (url, options) => {
  requests.push(url);
  assert.equal(options.cache, 'no-store');
  assert.deepEqual(JSON.parse(url.searchParams.get('filter')), { client: { slug: { _eq: config.clientSlug } }, status: { _eq: 'published' } });
  const collection = url.pathname.split('/').at(-1);
  const page = Number(url.searchParams.get('page'));
  const data = collection === 'roofing_projects'
    ? (page === 1 ? Array.from({ length: 100 }, (_, i) => ({ ...source, id: String(i), slug: `roof-${i}` })) : [{ ...source, id: 'last', slug: 'last-roof' }])
    : [{ id: collection, ...term(collection.replaceAll('_', '-')) }];
  return { ok: true, json: async () => ({ data }) };
});
assert.equal(full.projects.length, 101, 'top-level pagination must include every published project');
assert.deepEqual(JSON.parse(requests.find((url) => url.pathname.endsWith('/roofing_projects')).searchParams.get('deep')), { gallery: { _limit: -1, _sort: ['sort'] } });

for (const filename of ['lib/content/wp.ts', 'app/api/wp-debug/route.ts', 'app/sitemap_index/project/route.ts', 'app/sitemap_index/image/route.ts', 'app/sitemap_index/video/route.ts']) {
  const code = await readFile(new URL(`../${filename}`, import.meta.url), 'utf8');
  assert.doesNotMatch(code, /\bprojects\s*\(\s*(?:first|\n)|\bproject\s*\(\s*id:|WP_PROJECT_BASE/u, `${filename} retains a WordPress project query`);
}
for (const filename of ['app/(site)/project/page.tsx', 'app/(site)/project/[slug]/page.tsx', 'app/sitemap_index/project/route.ts']) {
  assert.match(await readFile(new URL(`../${filename}`, import.meta.url), 'utf8'), /export const revalidate = false/u);
}
assert.match(await readFile(new URL('../app/(site)/project/[slug]/page.tsx', import.meta.url), 'utf8'), /export const dynamicParams = false/u);
const runtime = await readFile(new URL('../lib/content/projects.ts', import.meta.url), 'utf8');
assert.doesNotMatch(runtime, /\bfetch\(|wpFetch\(|fetchDirectusProjectSnapshot|unstable_cache/u);
assert.match(await readFile(new URL('../Dockerfile', import.meta.url), 'utf8'), /\/app\/\.generated \.\/\.generated/u);
console.log('Verified Directus project scoping, media, complete pagination, HTML, SEO dates, filters, and deployment-frozen runtime policy.');
