import assert from 'node:assert/strict';
import {
  PERSON_BIO_ALLOWED_TAGS,
  preparePersonBioHtml,
} from '../lib/content/directus-person-html.ts';

assert.deepEqual(PERSON_BIO_ALLOWED_TAGS, [
  'p',
  'h2',
  'h3',
  'h4',
  'a',
  'strong',
  'em',
  'ul',
  'ol',
  'li',
  'br',
]);

const prepared = preparePersonBioHtml(`
  <h2 style="color:red">Background</h2>
  <p class="lead">Safe <b>biography</b> <a href="javascript:alert(1)">link</a>.</p>
  <h3>Experience</h3><h4>Community</h4>
  <ul><li>Local</li></ul>
  <img src="/private.jpg"><script>alert(1)</script><table><tr><td>Unsafe table</td></tr></table>
`);

assert.ok(prepared);
assert.equal(
  prepared.html,
  '<h2>Background</h2>\n  <p>Safe <strong>biography</strong> <a>link</a>.</p>\n  <h3>Experience</h3><h4>Community</h4>\n  <ul><li>Local</li></ul>\n  Unsafe table',
);
assert.match(prepared.text, /Background/);
assert.doesNotMatch(prepared.html, /style=|class=|javascript:|<img|<script|<table/);

const plaintext = preparePersonBioHtml('Plain AT&T biography.');
assert.deepEqual(plaintext, {
  html: '<p>Plain AT&amp;T biography.</p>',
  text: 'Plain AT&T biography.',
});

process.stdout.write('SonShine person biography HTML fixtures passed.\n');
