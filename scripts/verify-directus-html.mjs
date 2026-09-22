import assert from 'node:assert/strict';
import { sanitizeDirectusHtml } from '../lib/content/directus-html.ts';

const youtube = sanitizeDirectusHtml(
  '<iframe src="https://www.youtube.com/embed/gmQTgprVeGw?feature=oembed" title="Roofing test" width="500" height="281"></iframe>',
);
assert.match(youtube, /^<iframe /);
assert.match(youtube, /src="https:\/\/www\.youtube\.com\/embed\/gmQTgprVeGw\?feature=oembed"/);
assert.match(youtube, /loading="lazy"/);
assert.match(youtube, /allowfullscreen/);

const privacyEnhancedYoutube = sanitizeDirectusHtml(
  '<iframe src="https://www.youtube-nocookie.com/embed/gmQTgprVeGw"></iframe>',
);
assert.match(privacyEnhancedYoutube, /^<iframe /);

for (const unsafe of [
  '<iframe src="http://www.youtube.com/embed/gmQTgprVeGw"></iframe>',
  '<iframe src="https://youtu.be/gmQTgprVeGw"></iframe>',
  '<iframe src="https://example.com/embed/gmQTgprVeGw"></iframe>',
  '<iframe src="javascript:alert(1)"></iframe>',
]) {
  assert.equal(sanitizeDirectusHtml(unsafe), '');
}

const directusImage = sanitizeDirectusHtml(
  '<figure><img src="/assets/5fe404a6-98ab-4ece-8713-85c544655fe4" alt="BBB seal" srcset="legacy" sizes="100vw"></figure>',
  { assetBaseUrl: 'https://directus.example.com' },
);
assert.equal(
  directusImage,
  '<figure><img src="https://directus.example.com/assets/5fe404a6-98ab-4ece-8713-85c544655fe4" alt="BBB seal" loading="lazy" decoding="async" /></figure>',
);

assert.equal(sanitizeDirectusHtml('<script>alert(1)</script><p>Keep</p>'), '<p>Keep</p>');

assert.equal(
  sanitizeDirectusHtml('<script>alert(1)</script><p onclick="alert(2)">Keep <strong>this</strong>.</p><a href="javascript:alert(3)">Bad link</a><iframe src="https://example.com/embed/test"></iframe>'),
  '<p>Keep <strong>this</strong>.</p><a>Bad link</a>',
);
const article = sanitizeDirectusHtml(
  '<h2>Roofing project</h2><figure><img src="https://cms.example.test/assets/roof" alt="Finished roof"></figure><p>Read <a href="https://example.com/details" target="_blank">details</a>.</p>',
);
assert.match(article, /<h2>Roofing project<\/h2>/);
assert.match(article, /src="https:\/\/cms\.example\.test\/assets\/roof"/);
assert.match(article, /rel="noopener noreferrer"/);

process.stdout.write('Directus article HTML fixtures passed.\n');
