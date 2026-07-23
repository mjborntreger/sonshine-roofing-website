import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const DIRECTUS_FETCHERS = [
  'lib/content/blog.ts',
  'lib/content/directus-build-settings.mjs',
  'lib/content/directus-faqs.ts',
  'lib/content/directus-legal-copy.ts',
  'lib/content/directus-redirects.mjs',
  'lib/content/directus-reviews.ts',
  'lib/content/directus-site.ts',
  'lib/content/directus-special-offers.ts',
  'lib/content/glossary.ts',
  'lib/content/persons.ts',
  'lib/content/sponsor-features.ts',
];

for (const filename of DIRECTUS_FETCHERS) {
  const source = await readFile(new URL(`../${filename}`, import.meta.url), 'utf8');
  assert.ok(!/\bnext\s*:\s*\{/.test(source), `${filename} must not use Next.js fetch options`);
  assert.ok(!/\brevalidate\s*:/.test(source), `${filename} must not configure ISR`);
}

process.stdout.write(
  `Verified ${DIRECTUS_FETCHERS.length} Directus fetchers use no ISR options.\n`,
);
