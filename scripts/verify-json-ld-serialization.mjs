import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { serializeJsonLd } from '../lib/seo/serialize-json-ld.ts';

const hostileData = {
  headline: '</script><img src=x onerror=alert(1)>',
  separators: '\u2028\u2029',
};
const serialized = serializeJsonLd(hostileData);

assert.doesNotMatch(serialized, /</);
assert.doesNotMatch(serialized, /<\/script/i);
assert.match(serialized, /\\u003c\/script>/);
assert.match(serialized, /\\u2028\\u2029/);
assert.deepEqual(JSON.parse(serialized), hostileData);

const layoutSource = await readFile(new URL('../app/(site)/layout.tsx', import.meta.url), 'utf8');
assert.match(layoutSource, /<JsonLd data=\{getGlobalSchema\(settings\)\} \/>/);
assert.doesNotMatch(layoutSource, /dangerouslySetInnerHTML=\{\{ __html: JSON\.stringify/);

process.stdout.write('JSON-LD serialization is safe for HTML script data contexts.\n');
