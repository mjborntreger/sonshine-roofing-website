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

const resourceArchiveSource = await readFile(
  new URL('../components/dynamic-content/ResourceArchiveClient.tsx', import.meta.url),
  'utf8',
);
assert.doesNotMatch(
  resourceArchiveSource,
  /\bdangerouslySetInnerHTML\b|\.\s*innerHTML\s*=/,
  'Resource archive labels and search chips must remain text-only',
);

console.log('Verified bounded email validation and text-only filter chip labels.');
