import assert from 'node:assert/strict';
import { stripHtml } from '../lib/content/html-text.ts';

const fixtures = [
  ['', ''],
  ['  Plain\n text  ', 'Plain text'],
  ['<p>Roof <strong>repair</strong>.</p><p>Next roof<br>inspection</p>', 'Roof repair . Next roof inspection'],
  ['Roof<strong>ing</strong> &amp; repairs', 'Roof ing & repairs'],
  ['&lt;roof&gt; &amp; &quot;care&quot; &apos;today&apos; &nbsp; &#169; &#x1F3E0;', '<roof> & "care" \'today\' © 🏠'],
  ['&ndash; &mdash; &hellip; &copy; &unknown;', '– — … © &unknown;'],
  ['<a title="1 > 0">Visible &amp; safe</a>', 'Visible & safe'],
  ['<p>One <strong>two', 'One two'],
  ['Before<!-- hidden -->after', 'Before after'],
  ['<script>hidden()</script><style>.hidden {}</style><template><p>hidden</p></template><p>Visible</p>', 'Visible'],
  ['&#x110000; &#999999999999; &#0;', '� � �'],
  ['&amp;lt;still encoded&amp;gt;', '&lt;still encoded&gt;'],
];

for (const [html, expected] of fixtures) assert.equal(stripHtml(html), expected);
console.log(`Verified ${fixtures.length} CMS text extraction fixtures: summaries, word boundaries, entities, malformed HTML, and hidden content.`);
