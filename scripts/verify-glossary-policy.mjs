import assert from 'node:assert/strict';

import {
  mapGlossarySeoFields,
  parseGlossarySlug,
  requireGlossarySlug,
} from '../lib/content/directus-glossary-policy.ts';

assert.equal(parseGlossarySlug('roof-deck'), 'roof-deck');
assert.equal(parseGlossarySlug('Roof-Deck'), null);
assert.equal(parseGlossarySlug('deck" onclick="alert(1)'), null);
assert.throws(() => requireGlossarySlug('../roof-deck'), /slug must contain lowercase/u);

const noindex = mapGlossarySeoFields({
  slug: 'roof-deck',
  noindex: true,
  metaTitle: null,
  metaDescription: null,
  primaryFocusKeyword: 'ignored keyword',
  focusKeywords: ['ignored keyword'],
  ogTitle: null,
  ogDescription: null,
});
assert.deepEqual(noindex, {
  noindex: true,
  metaTitle: null,
  metaDescription: null,
  primaryFocusKeyword: null,
  focusKeywords: [],
  ogTitle: null,
  ogDescription: null,
});

const indexable = mapGlossarySeoFields({
  slug: 'roof-deck',
  noindex: false,
  metaTitle: 'Roof Deck Definition | SonShine Roofing',
  metaDescription: 'Learn what a roof deck is and why it matters to your roofing system.',
  primaryFocusKeyword: 'roof deck',
  focusKeywords: ['roofing glossary', 'Roof Deck', 'roof deck'],
  ogTitle: 'What Is a Roof Deck?',
  ogDescription: null,
});
assert.deepEqual(indexable, {
  noindex: false,
  metaTitle: 'Roof Deck Definition | SonShine Roofing',
  metaDescription: 'Learn what a roof deck is and why it matters to your roofing system.',
  primaryFocusKeyword: 'Roof Deck',
  focusKeywords: ['Roof Deck', 'roofing glossary'],
  ogTitle: 'What Is a Roof Deck?',
  ogDescription: null,
});

assert.throws(
  () => mapGlossarySeoFields({ ...indexable, metaTitle: null }),
  /meta_title is required/u,
);
assert.throws(
  () => mapGlossarySeoFields({ ...indexable, metaDescription: null }),
  /meta_description is required/u,
);
assert.throws(
  () => mapGlossarySeoFields({ ...noindex, noindex: null }),
  /noindex must be a boolean/u,
);

console.log('Glossary route policy fixtures passed.');
