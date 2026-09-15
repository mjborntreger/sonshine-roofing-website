import assert from 'node:assert/strict';
import { CLIENT, FIELDS, hash, idOf, verifyPlan } from './core.mjs';
import { readPrivateBytes, writePrivate } from './io.mjs';

export async function readAll(readPage, pageSize = 25) {
  const rows = [], seen = new Set();
  for (let page = 1; ; page++) {
    const next = await readPage(page, pageSize);
    assert.ok(Array.isArray(next) && next.length <= pageSize, 'Invalid paginated response');
    for (const row of next) { assert.ok(row.id != null && !seen.has(row.id), 'Repeated/missing pagination identity'); seen.add(row.id); rows.push(row); }
    if (next.length < pageSize) return rows;
    assert.ok(page < 10000, 'Pagination safety boundary exceeded');
  }
}
export function directusApi({ endpoint = process.env.DIRECTUS_URL, token = process.env.DIRECTUS_TOKEN, clientSlug = process.env.DIRECTUS_CLIENT_SLUG } = {}) {
  assert.equal(clientSlug, CLIENT, 'The migration is SonShine-scoped');
  assert.ok(endpoint && token, 'Configured Directus access required');
  const base = new URL(endpoint);
  assert.equal(base.protocol, 'https:', 'Directus requires verified HTTPS');
  async function request(resource, { method = 'GET', query = {}, data, form } = {}) {
    const url = new URL(resource.replace(/^\//u, ''), `${base.href.replace(/\/$/u, '')}/`);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    const response = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, ...(!form ? { 'Content-Type': 'application/json' } : {}) },
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}), ...(form ? { body: form } : {}) });
    if (!response.ok) throw new Error(`Directus ${method} failed (HTTP ${response.status}); response body suppressed`);
    const result = await response.json();
    assert.ok(!result.errors && result.data !== undefined, 'Directus response error; body suppressed');
    return result.data;
  }
  return {
    endpointHash: hash(base.origin), request,
    async fileHash(id) {
      const { createHash } = await import('node:crypto');
      const url = new URL(`assets/${encodeURIComponent(id)}`, `${base.href.replace(/\/$/u, '')}/`);
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, redirect: 'error' });
      assert.ok(response.ok, 'Directus media-byte readback failed');
      return createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
    },
    async find(op) {
      const { provenanceKey, ...identity } = op.identity;
      const filter = Object.fromEntries(Object.entries(identity).map(([key, value]) => [key, { _eq: value }]));
      const fields = [...new Set(['id', ...(op.collection === 'directus_files' ? [] : ['date_updated']), ...Object.keys(op.data), ...(op.collection === 'reviews' ? ['external_id'] : []), ...(provenanceKey ? ['wordpress_provenance'] : []), ...(op.expectedScopeKey ? ['scope_key'] : [])])];
      const resource = op.collection === 'directus_files' ? 'files' : `items/${op.collection}`;
      const rows = await readAll((page, limit) => request(resource, { query: { filter, fields: fields.join(','), sort: 'id', page, limit } }));
      return provenanceKey ? rows.filter(row => row.wordpress_provenance?.some(p => p.key === provenanceKey)) : rows;
    },
    async create(op) {
      if (op.collection === 'directus_files') {
        const bytes = await readPrivateBytes(op.localPath);
        assert.equal(hash(bytes.toString('base64')), op.encodedBytesHash, 'Reviewed media bytes changed');
        const form = new FormData();
        for (const [key, value] of Object.entries(op.data)) form.append(key, String(value));
        form.append('file', new Blob([bytes], { type: op.mimeType }), op.data.filename_download);
        return request('files', { method: 'POST', form });
      }
      return request(`items/${op.collection}`, { method: 'POST', data: op.data });
    },
    update: op => request(`items/${op.collection}/${encodeURIComponent(op.targetId)}`, { method: 'PATCH', data: op.data }),
  };
}

/** Single coordinator execution; receipt callback must durably persist each before-image. */
export async function executePlan({ plan, expectedHash, api, receipt, approval }) {
  verifyPlan(plan, expectedHash);
  assert.equal(approval.planHash, expectedHash, 'Authorization must name the exact plan');
  assert.equal(approval.endpointHash, api.endpointHash, 'Authorization must name the intended Directus target');
  assert.equal(plan.endpointHash, api.endpointHash, 'Plan belongs to a different Directus target');
  assert.ok(approval.productionApplyAuthorized && approval.exclusiveMigrationWriter && approval.editorialChangesPaused && approval.schemaPermissionsVerified && approval.recoveryLocationApproved,
    'Explicit apply, single-writer/edit window, schema/permission, and recovery authorization required');
  const results = [];
  const requireStaticReview = row => assert.ok(Object.hasOwn(row, 'external_id') && row.external_id === null,
    'Static location import requires an explicit null Google identity; managed or incomplete records need disposition');
  for (const [index, original] of plan.operations.entries()) {
    const op = structuredClone(original);
    const found = await api.find(op);
    assert.ok(found.length <= 1, 'Ambiguous canonical identity; execution stopped');
    const current = found[0];
    if (op.collection === 'reviews' && current) requireStaticReview(current);
    if (current && op.expectedScopeKey) assert.equal(current.scope_key, op.expectedScopeKey, 'Canonical taxonomy scope conflict');
    const fields = Object.keys(op.data).filter(field => field !== 'id' && field !== 'client');
    const relations = new Set(['service_area', 'nearby_area', 'sponsor', 'section', 'overview_map', 'coverage_map', 'image']);
    const projection = row => Object.fromEntries(fields.map(field => [field, (relations.has(field) ? idOf(row[field]) : row[field]) ?? null]));
    const desired = projection(op.data);
    if (current && hash(projection(current)) === hash(desired)) {
      if (op.collection === 'directus_files') assert.equal(await api.fileHash(current.id), op.sha256, 'Existing media byte hash differs');
      results.push({ key: op.key, disposition: 'match', targetId: current.id }); continue;
    }
    if (op.action === 'create') assert.ok(!current, 'Create identity exists with different data; preserve it for review');
    else {
      assert.ok(current && current.id === op.targetId, 'Update target changed or disappeared');
      assert.equal(current.date_updated ?? null, op.expectedDateUpdated, 'Later target modification; execution stopped');
      assert.equal(hash(projection(current)), op.beforeHash, 'Later editorial field change; execution stopped');
    }
    // Persist the exact narrow before-image before the mutation. Never print it.
    await receipt(index, 'before', { key: op.key, collection: op.collection, action: op.action, identity: op.identity,
      targetId: current?.id || op.targetId || null, before: current ? projection(current) : null,
      dateUpdated: current?.date_updated ?? null, proposedAfter: desired });
    if (op.collection === 'directus_files') {
      const bytes = await readPrivateBytes(op.localPath);
      const { createHash } = await import('node:crypto');
      assert.equal(createHash('sha256').update(bytes).digest('hex'), op.sha256, 'Reviewed media bytes changed');
      op.encodedBytesHash = hash(bytes.toString('base64'));
    }
    // A fresh read immediately before PATCH narrows the race window. Directus
    // REST offers no atomic compare-and-swap contract; release must use the
    // coordinator's exclusive content-edit window. Do not call this concurrently.
    if (op.action === 'update') {
      const again = await api.find(op);
      assert.equal(again.length, 1, 'Target changed before mutation');
      if (op.collection === 'reviews') requireStaticReview(again[0]);
      assert.equal(again[0].date_updated ?? null, op.expectedDateUpdated, 'Target modified before mutation');
      assert.equal(hash(projection(again[0])), op.beforeHash, 'Target fields changed before mutation');
    }
    const written = op.action === 'create' ? await api.create(op) : await api.update(op);
    const readback = await api.find(op);
    assert.equal(readback.length, 1, 'Canonical readback count failed');
    if (op.collection === 'reviews') requireStaticReview(readback[0]);
    if (op.expectedScopeKey) assert.equal(readback[0].scope_key, op.expectedScopeKey, 'Database-maintained taxonomy scope readback failed');
    assert.equal(hash(projection(readback[0])), hash(desired), 'Written field readback failed');
    if (op.collection === 'directus_files') assert.equal(await api.fileHash(readback[0].id), op.sha256, 'Uploaded media byte hash differs');
    await receipt(index, 'after', { key: op.key, collection: op.collection, targetId: written?.id || readback[0].id,
      afterHash: hash(desired), after: desired, fields, dateUpdated: readback[0].date_updated ?? null, sourceIdentity: op.identity });
    results.push({ key: op.key, disposition: 'applied', targetId: readback[0].id });
  }
  return results;
}
export const privateReceipt = directory => (index, phase, value) => writePrivate(`${directory}/${String(index).padStart(4, '0')}-${phase}.json`, value);

export function requiredFieldsFor(collection) { return [...new Set(['id', 'date_updated', ...(FIELDS[collection] || [])])]; }
