import assert from 'node:assert/strict';
import { inventoryWordPress } from './location-migration/inventory.mjs';

// Anonymous WPGraphQL exposes rendered content while RAW is null. Exercise the
// actual HTTP query so switching back to RAW makes this regression fail.
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async (_url, options) => {
    const { query } = JSON.parse(options.body);
    return { ok: true, json: async () => ({ data: { locations: {
      nodes: [{ databaseId: 1, content: null, ...(query.includes('renderedContent:content(format:RENDERED)') ? { renderedContent: '<p>Available location body.</p>' } : {}) }],
      pageInfo: { hasNextPage: false, endCursor: null },
    } } }) };
  };
  const source = await inventoryWordPress();
  assert.equal(source.nodes[0].renderedContent, '<p>Available location body.</p>', 'Recovery export must retain publicly available rendered content');
  assert.equal(source.version, 'wordpress-location-source-v2');
  assert.equal(source.contentFormat, 'rendered-html');
  assert.equal(source.nodes[0].contentAvailability, 'available');
} finally { globalThis.fetch = originalFetch; }
console.log('WordPress rendered-content export regression passed.');
const connection = nodes => ({ nodes, pageInfo: { hasNextPage: false, endCursor: null } });
const empty = await inventoryWordPress(async () => connection([{ databaseId: 2, renderedContent: '' }]));
assert.equal(empty.nodes[0].contentAvailability, 'available-empty');
for (const body of [null, undefined, 123]) {
  await assert.rejects(inventoryWordPress(async () => connection([{ databaseId: 2, renderedContent: body }])), /content unavailable/);
}
await assert.rejects(inventoryWordPress(async () => connection([{ databaseId: 2, renderedContent: '' }, { databaseId: 2, renderedContent: '' }])), /Duplicate/);
await assert.rejects(inventoryWordPress(async () => ({ nodes: [], pageInfo: { hasNextPage: true, endCursor: 'repeated' } })), /Repeated/);
for (const response of [
  { ok: false, status: 502 },
  { ok: true, json: async () => ({ errors: [{ message: 'Synthetic error' }] }) },
  { ok: true, json: async () => ({ data: {} }) },
]) {
  globalThis.fetch = async () => response;
  try { await assert.rejects(inventoryWordPress(), /inventory failed|query\/schema failure/); }
  finally { globalThis.fetch = originalFetch; }
}
console.log('WordPress availability, HTTP/schema failure and pagination fixtures passed.');
