import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sanitizeDirectusHtml as sanitizeWordPressHtml } from '../lib/content/directus-html.ts';

const malicious = sanitizeWordPressHtml(
  '<script>alert(1)</script><p onclick="alert(2)">Keep <strong>this</strong>.</p><a href="javascript:alert(3)">Bad link</a><iframe src="https://example.com/embed/test"></iframe>',
);
assert.equal(malicious, '<p>Keep <strong>this</strong>.</p><a>Bad link</a>');

const legitimate = sanitizeWordPressHtml(
  '<h2>Roofing project</h2><figure><img src="https://wp.sonshineroofing.com/wp-content/uploads/roof.jpg" alt="Finished roof"></figure><p>Read <a href="https://example.com/details" target="_blank">details</a>.</p>',
);
assert.match(legitimate, /<h2>Roofing project<\/h2>/);
assert.match(
  legitimate,
  /src="https:\/\/wp\.sonshineroofing\.com\/wp-content\/uploads\/roof\.jpg"/,
);
assert.match(legitimate, /rel="noopener noreferrer"/);

const wpSource = await readFile(new URL('../lib/content/wp.ts', import.meta.url), 'utf8');
const wordpressSanitizerSource = await readFile(
  new URL('../lib/content/wordpress-html.ts', import.meta.url),
  'utf8',
);

assert.match(
  wordpressSanitizerSource,
  /return sanitizeDirectusHtml\(html\)/,
  'WordPress sanitizer must delegate to the tested conservative CMS policy',
);

const locationMapperSource = wpSource.slice(
  wpSource.indexOf('export async function getLocationBySlug'),
);
const projectMapperSource = wpSource.slice(
  wpSource.indexOf('export async function getProjectBySlug'),
);

assert.match(
  locationMapperSource,
  /contentHtml: sanitizeWordPressHtml\(toStringSafe\(node\.content\)\)/,
);
assert.match(
  locationMapperSource,
  /neighborhoodDescription: sanitizeOptionalWordPressHtml\(\s*record\?\.neighborhoodDescription,?\s*\)/,
);
assert.match(
  projectMapperSource,
  /contentHtml: sanitizeWordPressHtml\(typeof p\.content === 'string' \? p\.content : ''\)/,
);

process.stdout.write('WordPress HTML adapter boundaries passed.\n');
