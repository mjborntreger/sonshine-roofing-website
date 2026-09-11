import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fetchDirectusProjectSnapshot, mapDirectusProject } from '../lib/content/directus-projects.mjs';
import { readProjectSnapshot, queryProjectSnapshot, projectServiceLabel } from '../lib/content/project-data.ts';

assert.equal(projectServiceLabel('New construction shingle roof installation in North Port.'), 'Roof Installation');
assert.equal(projectServiceLabel('Metal roof installation on a new construction home.'), 'Roof Installation');
assert.equal(projectServiceLabel('A TILE ROOF REPLACEMENT with new flashing installation.'), 'Roof Replacement');
assert.equal(projectServiceLabel('A roofing project with a new skylight.'), 'Roofing Project');
assert.equal(projectServiceLabel(null), 'Roofing Project');

const config = { url: 'https://cms.example.test', clientSlug: 'fixture-client' };
const term = (slug, name = slug) => ({ slug, name, status: 'published', client: { slug: config.clientSlug } });
const file = (id) => ({ id, type: 'image/webp', description: `A described roof ${id}`, width: 2000, height: 1500 });
const source = {
  id: 'one', scope_key: 'fixture-client:blue-roof', external_id: 'wordpress:sonshine-roofing:fixture',
  client: { slug: config.clientSlug }, status: 'published', title: 'Blue roof & sunny day', slug: 'blue-roof',
  description: 'A metal roof in Sarasota.', published_at: '2020-01-01T12:00:00Z', date_updated: '2021-02-01T12:00:00Z', source_updated_at: '2021-02-01T12:00:00Z',
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
assert.equal('contentHtml' in project, false);
assert.equal('contentPlain' in project, false);
assert.equal('youtubeUrl' in project, false, 'the old project-owned URL must not be a frontend source');
const testimonial = mapDirectusProject({ ...source, client_testimonial: 'A synthetic approved testimonial.', review_source: 'Google', review_url: null }, config);
assert.equal(testimonial.customerTestimonial.customerReview, 'A synthetic approved testimonial.');
assert.equal(testimonial.customerTestimonial.reviewUrl, undefined, 'an approved testimonial can appear without a source URL');

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

const snapshot = { version: 2, clientSlug: config.clientSlug, videos: [], projects: [
  project,
  { ...project, slug: 'tile-roof', title: 'Tile roof', materialTypes: [term('tile')], roofColors: [term('red')], serviceAreas: [term('venice')], projectDescription: 'Courtyard' },
  { ...project, slug: 'another-metal', title: 'Another metal roof', roofColors: [term('red')], projectDescription: 'Courtyard' },
], terms: { materials: [term('metal'), term('tile')], roofColors: [term('red')], serviceAreas: [term('sarasota'), term('venice'), term('unused')] } };
assert.equal(queryProjectSnapshot(snapshot, { first: 1 }).pageInfo.endCursor, '1');
assert.deepEqual(queryProjectSnapshot(snapshot, { first: 1, after: '1' }).items.map((row) => row.slug), ['tile-roof']);
assert.deepEqual(queryProjectSnapshot(snapshot, { filters: { materialTypeSlugs: ['metal', 'tile'], serviceAreaSlugs: ['venice'], roofColorSlugs: ['red'] } }).items.map((row) => row.slug), ['tile-roof']);
assert.equal(queryProjectSnapshot(snapshot, { filters: { search: 'SUNNY' } }).total, 1);
const descriptionOnly = queryProjectSnapshot(snapshot, { first: 1, filters: { search: '  COURTYARD  ' } });
assert.deepEqual(descriptionOnly.items.map((row) => row.slug), ['tile-roof']);
assert.equal(descriptionOnly.total, 2);
assert.equal(descriptionOnly.meta.overallTotal, 2, 'facet totals must describe the same title/description result set');
assert.equal(descriptionOnly.meta.fullTotal, 3);
assert.deepEqual(descriptionOnly.pageInfo, { hasNextPage: true, endCursor: '1' });
assert.deepEqual(descriptionOnly.facets.map((facet) => facet.buckets.map(({ slug, count }) => ({ slug, count }))), [
  [{ slug: 'metal', count: 1 }, { slug: 'tile', count: 1 }],
  [{ slug: 'red', count: 2 }],
  [{ slug: 'sarasota', count: 1 }, { slug: 'venice', count: 1 }, { slug: 'unused', count: 0 }],
]);
const nextDescriptionPage = queryProjectSnapshot(snapshot, { first: 1, after: descriptionOnly.pageInfo.endCursor, filters: { search: 'Courtyard' } });
assert.deepEqual(nextDescriptionPage.items.map((row) => row.slug), ['another-metal']);
assert.deepEqual(nextDescriptionPage.pageInfo, { hasNextPage: false, endCursor: null });
assert.equal(nextDescriptionPage.total, descriptionOnly.total);
assert.deepEqual(nextDescriptionPage.facets, descriptionOnly.facets);
const filteredDescription = queryProjectSnapshot(snapshot, { filters: { search: 'Courtyard', materialTypeSlugs: ['tile'], roofColorSlugs: ['red'], serviceAreaSlugs: ['venice'] } });
assert.deepEqual(filteredDescription.items.map((row) => row.slug), ['tile-roof']);
assert.equal(filteredDescription.total, 1);
assert.equal(filteredDescription.meta.overallTotal, 1);
assert.equal(filteredDescription.facets[0].buckets.find((bucket) => bucket.slug === 'metal').count, 0);
assert.equal(queryProjectSnapshot(snapshot, { filters: { search: 'undefined' } }).total, 0);
assert.equal(queryProjectSnapshot(snapshot, { filters: { search: 'no matching description' } }).total, 0);
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
const emptyProjects = await fetchDirectusProjectSnapshot(env, async () => ({ ok: true, json: async () => ({ data: [], meta: { filter_count: 0 } }) }));
assert.deepEqual(emptyProjects.projects, [], 'a verified empty project inventory is a valid publication state');
const requests = [];
const full = await fetchDirectusProjectSnapshot(env, async (url, options) => {
  requests.push(url);
  assert.equal(options.cache, 'no-store');
  assert.deepEqual(JSON.parse(url.searchParams.get('filter')), { client: { slug: { _eq: config.clientSlug } }, status: { _eq: 'published' } });
  const collection = url.pathname.split('/').at(-1);
  if (collection === 'roofing_projects') {
    const fields = url.searchParams.get('fields').split(',');
    assert.ok(fields.includes('description'), 'project search requires the description');
    assert.ok(!fields.includes('body') && !fields.some((field) => field.includes('*')), 'project fetches must work after body schema removal');
  }
  const page = Number(url.searchParams.get('page'));
  const data = collection === 'roofing_projects'
    ? (page === 1 ? Array.from({ length: 100 }, (_, i) => ({ ...source, id: String(i), slug: `roof-${i}` })) : [{ ...source, id: 'last', slug: 'last-roof' }])
    : [{ id: collection, ...term(collection.replaceAll('_', '-')) }];
  return { ok: true, json: async () => ({ data, meta: { filter_count: collection === 'roofing_projects' ? 101 : 1 } }) };
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
console.log('Verified Directus project scoping, media, description search, complete pagination, SEO dates, optional review links, filters, and deployment-frozen runtime policy.');
