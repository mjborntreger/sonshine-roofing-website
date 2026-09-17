import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

import { isBuildOnlyRevalidationPath, isBuildOnlyRevalidationTag } from '../lib/content/build-only-revalidation.ts';

const cases = [
  ['/layout', true], ['/(site)/layout', true], ['/locations/[slug]/page', true],
  ['/blog/layout/?preview=1', true], ['/blog/page#section', true],
  ['page///?preview=1', true], ['/blog/layout-other', false],
  ['/%6cocations/sarasota', true], ['/blog/../locations/sarasota', true], ['/bad%ZZ', true],
  ['/locations/sarasota', true], ['/locations/unknown', true], ['/sitemap_index/location', true], ['/faq', true], ['/locations-other', false],
  ['/special-offers', true],
  ['/project', true],
  ['/video-library', true],
  ['/video-library?v=legacy-video', true],
  ['/sitemap_index/video', true],
  ['/api/resources/video', true],
  ['/api/resources/project', true],
  ['/video-library-other', false],
  ['/project/example-roof', true],
  ['project/example-roof?preview=1', true],
  ['/sitemap_index/project', true],
  ['/special-offers/', true],
  ['/special-offers/roof-care-club', true],
  ['special-offers/roof-care-club?preview=1', true],
  ['/sitemap_index/special-offer', true],
  ['/sitemap_index/special-offer/', true],
  ['/blog/example-post', false],
  ['/sitemap_index/blog', false],
];

for (const [path, expected] of cases) {
  assert.equal(
    isBuildOnlyRevalidationPath(path),
    expected,
    `${path} should ${expected ? '' : 'not '}be protected from runtime revalidation`,
  );
}

console.log(`Verified ${cases.length} build-only revalidation paths.`);

// Repeated route-file and slash delimiters must stay cheap without weakening
// protection for implicit Next cache tags or ordinary eligible content routes.
assert.equal(isBuildOnlyRevalidationPath('/page#'.repeat(100_000)), true);
assert.equal(isBuildOnlyRevalidationPath('/layout?'.repeat(100_000)), true);
assert.equal(isBuildOnlyRevalidationPath('/'.repeat(100_000) + 'blog'), false);
assert.equal(isBuildOnlyRevalidationPath('/project' + '/'.repeat(100_000)), true);

const tags = [
  ['_N_T_/layout', true], ['_N_T_/(site)/layout', true], ['_N_T_/locations/sarasota', true],
  ['locations', true], ['location:sarasota', true], ['sitemap:image:locations', true], ['directus:reviews:sonshine-roofing', false], ['faqs', true],
  ['video', true], ['video:example', true], ['videos', true],
  ['video-library', true], ['directus:videos', true],
  ['sitemap:videos:entries', true], ['sitemap-video-entries', true],
  ['sitemap', false], ['post:123', false], ['videography', false],
];
for (const [tag, expected] of tags) {
  assert.equal(isBuildOnlyRevalidationTag(tag), expected, tag);
}
console.log(`Verified ${tags.length} build-only revalidation tags.`);

// Exercise the real endpoint with the Next cache writers replaced, so a rejected
// mixed request cannot partially revalidate an otherwise eligible route or tag.
const require = createRequire(import.meta.url);
const writes = [];
const source = readFileSync(new URL('../app/api/revalidate/route.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const route = { exports: {} };
new Function('require', 'module', 'exports', compiled)((id) => {
  if (id === '@/lib/content/build-only-revalidation') return { isBuildOnlyRevalidationPath, isBuildOnlyRevalidationTag };
  if (id === 'next/cache') return {
    revalidatePath: (path) => writes.push({ path }),
    revalidateTag: (tag) => writes.push({ tag }),
  };
  return require(id);
}, route, route.exports);
const previousSecret = process.env.REVALIDATE_SECRET;
process.env.REVALIDATE_SECRET = 'synthetic-test-only';
try {
  const headers = { 'x-revalidate-secret': 'synthetic-test-only', 'content-type': 'application/json' };
  const rejectedPost = await route.exports.POST(new Request('https://revalidate.test/api/revalidate', {
    method: 'POST', headers, body: JSON.stringify({ paths: ['/blog'], tags: ['sitemap:videos:entries'] }),
  }));
  assert.equal(rejectedPost.status, 400);
  assert.deepEqual((await rejectedPost.json()).blocked.tags, ['sitemap:videos:entries']);
  assert.deepEqual(writes, [], 'mixed POST rejects before any cache write');
  const rejectedGet = await route.exports.GET(new Request('https://revalidate.test/api/revalidate?path=/video-library&tag=post:123', { headers }));
  assert.equal(rejectedGet.status, 400);
  assert.deepEqual(writes, [], 'mixed GET rejects before any cache write');
  for (const payload of [{ path: '/layout' }, { path: '/(site)/layout' }, { tag: '_N_T_/locations/sarasota' }]) {
    const post = await route.exports.POST(new Request('https://revalidate.test/api/revalidate', {
      method: 'POST', headers, body: JSON.stringify({ ...payload, paths: ['/blog'] }),
    }));
    const getUrl = new URL('https://revalidate.test/api/revalidate');
    Object.entries(payload).forEach(([key, value]) => getUrl.searchParams.set(key, value));
    getUrl.searchParams.append('path', '/blog');
    const get = await route.exports.GET(new Request(getUrl, { headers }));
    assert.equal(post.status, 400); assert.equal(get.status, 400);
    assert.deepEqual(writes, [], 'internal layout/route tags cannot invalidate a deployed location');
  }
  const allowed = await route.exports.GET(new Request('https://revalidate.test/api/revalidate?path=/blog&tag=post:123', { headers }));
  assert.equal(allowed.status, 200);
  assert.deepEqual(writes, [{ path: '/blog' }, { tag: 'post:123' }]);
} finally {
  if (previousSecret === undefined) delete process.env.REVALIDATE_SECRET;
  else process.env.REVALIDATE_SECRET = previousSecret;
}
console.log('Verified build-only rejection is atomic in both revalidation endpoint methods.');
