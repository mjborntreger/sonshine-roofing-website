import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { isEmailComplete, MAX_EMAIL_LENGTH } from '../lib/lead-capture/email.ts';

assert.equal(isEmailComplete('homeowner@example.com'), true);
assert.equal(isEmailComplete(' HomeOwner@Example.com '), true);
assert.equal(isEmailComplete('homeowner@example'), false);
assert.equal(isEmailComplete('homeowner@@example.com'), false);
assert.equal(isEmailComplete('home owner@example.com'), false);
assert.equal(isEmailComplete(`a@${'b'.repeat(MAX_EMAIL_LENGTH)}.com`), false);
assert.equal(isEmailComplete(`a@${'a.'.repeat(50_000)}`), false);

const resourceFiltersSource = await readFile(
  new URL('../lib/content/useResourceFilters.ts', import.meta.url),
  'utf8',
);
assert.doesNotMatch(resourceFiltersSource, /btn\.innerHTML\s*=/);
assert.match(resourceFiltersSource, /label\.textContent\s*=\s*chip\.label/);

console.log('Verified bounded email validation and text-only filter chip labels.');
