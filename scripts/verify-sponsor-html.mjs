import assert from 'node:assert/strict';
import { sanitizeSponsorHtml } from '../lib/content/directus-sponsor-html.ts';

assert.equal(
  sanitizeSponsorHtml('<p class="wp-block-paragraph">Keep <b>this</b>.</p>'),
  '<p>Keep <strong>this</strong>.</p>',
);
assert.equal(
  sanitizeSponsorHtml('<script>alert(1)</script><p>Safe</p><img src="https://example.com/x.jpg">'),
  '<p>Safe</p>',
);
assert.equal(
  sanitizeSponsorHtml('<p><a href="javascript:alert(1)">Bad</a></p>'),
  '<p><a>Bad</a></p>',
);
assert.equal(
  sanitizeSponsorHtml('<p><a href="https://example.com" target="_blank">Good</a></p>'),
  '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">Good</a></p>',
);

process.stdout.write('Sponsor HTML fixtures passed.\n');
