import assert from 'node:assert/strict';

import { isBuildOnlyRevalidationPath } from '../lib/content/build-only-revalidation.ts';

const cases = [
  ['/special-offers', true],
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
