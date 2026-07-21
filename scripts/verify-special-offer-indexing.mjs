import assert from 'node:assert/strict';

import { isSpecialOfferIndexable } from '../lib/seo/special-offer-indexing.ts';

const cases = [
  { label: 'active indexable offer', expired: false, noindex: false, expected: true },
  { label: 'active noindex offer', expired: false, noindex: true, expected: false },
  { label: 'expired indexable offer', expired: true, noindex: false, expected: true },
  { label: 'expired noindex offer', expired: true, noindex: true, expected: false },
];

for (const testCase of cases) {
  assert.equal(
    isSpecialOfferIndexable({
      noindex: testCase.noindex,
      expirationDate: testCase.expired ? '2020-01-01' : '2099-01-01',
    }),
    testCase.expected,
    `${testCase.label}: expiration must not override the Directus noindex toggle`,
  );
}

console.log(`Verified ${cases.length} special-offer indexing cases.`);
