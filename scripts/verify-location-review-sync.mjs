import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { reviewSync } from './location-reviews/core.mjs';
import { buildWorkflowPatch, graphHash, managedReviewQuery } from './location-reviews/patch.mjs';

let checks = 0;
function check(name, run) {
  try { run(); checks += 1; }
  catch (error) { throw new Error(`${name}: ${error.message}`, { cause: error }); }
}
const clientId = 'synthetic-client';
const ext = (index) => `accounts/synthetic/locations/synthetic/reviews/review-${String(index).padStart(3, '0')}`;
const source = (index, overrides = {}) => ({ name: ext(index), starRating: 'FIVE', reviewer: { displayName: 'Synthetic Author' }, comment: `Synthetic review ${index}`, createTime: `2026-08-${String(index % 28 + 1).padStart(2, '0')}T12:00:00Z`, updateTime: '2026-09-01T12:00:00Z', ...overrides });
const context = (sources) => ({ ...reviewSync.normalize(sources), clientId });
const record = (target, id = target.external_id.split('/').at(-1), extra = {}) => ({ id, client: clientId, source: 'Google', status: 'published', ...target, ...extra });
const materialize = (rows, plan) => {
  const result = structuredClone(rows);
  for (const action of plan) {
    if (action.action === 'create') result.push({ id: `created-${result.length}`, ...action.payload });
    if (['update', 'clear-membership'].includes(action.action)) Object.assign(result.find((row) => row.id === action.itemId), action.payload);
  }
  return result;
};
for (const count of [0, 1, 19, 20, 25, 40]) check(`source pool ${count}`, () => {
  const ctx = context(Array.from({ length: count }, (_, index) => source(index)));
  assert.equal(ctx.targetReviews.length, Math.min(count, 20));
  const plan = reviewSync.planUpserts([], ctx);
  assert.ok(plan.length > 0);
  const rows = materialize([], plan);
  assert.equal(reviewSync.verifyMembership(rows, ctx).selectedCount, Math.min(count, 20));
});
check('successful zero placeholder and non-five-star selection', () => {
  assert.equal(reviewSync.normalize([{}]).targetReviews.length, 0);
  assert.equal(reviewSync.normalize([source(1, { starRating: 'FOUR' })]).targetReviews.length, 0);
  assert.equal(reviewSync.normalize([source(1, { comment: '  ' })]).targetReviews.length, 0);
});
check('malformed source and missing verified facts fail', () => {
  for (const rows of [[{}, source(1)], [{ error: 'upstream failed' }], [source(1, { createTime: '' })], [source(1, { createTime: 'bad-date' })], [source(1, { name: 'wordpress:synthetic' })], [source(1, { reviewer: {} })]]) assert.throws(() => reviewSync.normalize(rows));
});
check('source deduplication and conflict', () => {
  assert.equal(reviewSync.normalize([source(1), source(1)]).eligibleCount, 1);
  assert.throws(() => reviewSync.normalize([source(1), source(1, { comment: 'Conflicting source facts' })]));
});
check('deterministic ties', () => {
  const date = '2026-08-01T12:00:00Z';
  assert.deepEqual(context([source(2, { createTime: date }), source(1, { createTime: date })]).targetReviews.map((row) => row.external_id), [ext(1), ext(2)]);
});
check('rollover retains approved older local review', () => {
  const old = context([source(1)]);
  const next = context([source(2)]);
  const rows = [record(old.targetReviews[0], 'older', { service_area: 'synthetic-sarasota' })];
  const afterUpserts = materialize(rows, reviewSync.planUpserts(rows, next));
  const after = materialize(afterUpserts, reviewSync.planDeparture(afterUpserts, next));
  assert.equal(after[0].status, 'published');
  assert.equal(after[0].service_area, 'synthetic-sarasota');
  assert.equal(after[0].latest_feed_member, false);
  assert.equal(after[0].latest_feed_order, null);
  assert.equal(reviewSync.verifyMembership(after.filter((row) => row.latest_feed_member), next).selectedCount, 1);
});
for (const status of ['draft', 'archived']) check(`selected ${status} stays unpublished`, () => {
  const ctx = context([source(1)]);
  const rows = [record(ctx.targetReviews[0], 'selected', { status, latest_feed_member: false, latest_feed_order: null })];
  const plan = reviewSync.planUpserts(rows, ctx);
  assert.equal(Object.hasOwn(plan[0].payload, 'status'), false);
  const after = materialize(rows, plan);
  assert.equal(after[0].status, status);
  assert.equal(reviewSync.verifyMembership(after, ctx).selectedCount, 1);
});
check('new review publication and geography', () => {
  const created = reviewSync.planUpserts([], context([source(1)]))[0].payload;
  assert.equal(created.status, 'published');
  assert.equal(Object.hasOwn(created, 'service_area'), false);
});
check('editorial changes and migration fields preserved on update', () => {
  const ctx = context([source(1)]);
  const preserved = { status: 'draft', service_area: 'synthetic-venice', owner_reply: 'Synthetic retained reply', url: 'https://example.test/review', wordpress_provenance: [{ source: 'synthetic-wp' }], sort_order: 99 };
  const rows = [record(ctx.targetReviews[0], 'selected', { ...preserved, review_text: 'Previous source text' })];
  const plan = reviewSync.planUpserts(rows, ctx);
  for (const key of Object.keys(preserved)) assert.equal(Object.hasOwn(plan[0].payload, key), false);
  rows[0].status = 'archived';
  rows[0].owner_reply = 'Synthetic later editor reply';
  const after = materialize(rows, plan)[0];
  for (const key of Object.keys(preserved)) assert.deepEqual(after[key], rows[0][key]);
});
check('idempotent rerun', () => {
  const ctx = context([source(1), source(2)]);
  const rows = materialize([], reviewSync.planUpserts([], ctx));
  assert.ok(reviewSync.planUpserts(rows, ctx).every((row) => row.action === 'noop'));
  assert.deepEqual(reviewSync.planDeparture(rows, ctx), [{ action: 'membership-noop' }]);
});
check('cross-client and duplicate target reads rejected', () => {
  const ctx = context([source(1)]);
  const row = record(ctx.targetReviews[0]);
  assert.throws(() => reviewSync.planUpserts([{ ...row, client: 'another-client' }], ctx));
  assert.throws(() => reviewSync.planUpserts([row, { ...row, id: 'duplicate-identity' }], ctx));
  assert.throws(() => reviewSync.planUpserts([{ ...row, external_id: null }], ctx));
});
check('partial upsert failure prevents departure', () => {
  const ctx = context([source(1), source(2)]);
  assert.throws(() => reviewSync.planDeparture([record(ctx.targetReviews[0])], ctx));
});
check('exact membership set and order readback', () => {
  const ctx = context([source(1), source(2)]);
  const rows = ctx.targetReviews.map((row) => record(row));
  assert.throws(() => reviewSync.verifyMembership(rows.slice(1), ctx));
  assert.throws(() => reviewSync.verifyMembership([...rows, record(context([source(3)]).targetReviews[0])], ctx));
  assert.throws(() => reviewSync.verifyMembership([{ ...rows[0], latest_feed_order: 2 }, rows[1]], ctx));
  assert.throws(() => reviewSync.verifyMembership([{ ...rows[0], latest_feed_member: false }, rows[1]], ctx));
});
check('zero targets clear membership but retain all editorial states', () => {
  const ctx = context([]);
  const rows = context([source(1), source(2)]).targetReviews.map((row, index) => record(row, `id-${index}`, { status: index ? 'archived' : 'published' }));
  const after = materialize(rows, reviewSync.planDeparture(rows, ctx));
  assert.deepEqual(after.map((row) => row.status), ['published', 'archived']);
  assert.ok(after.every((row) => !row.latest_feed_member && row.latest_feed_order === null));
  assert.equal(reviewSync.verifyMembership([{}], ctx).selectedCount, 0);
});
check('seed requires exact known identities, preserves publication and is repeatable', () => {
  const ctx = context([source(1), source(2)]);
  const rows = ctx.targetReviews.map((row, index) => record(row, `id-${index}`, { latest_feed_member: false, latest_feed_order: null, status: 'archived' }));
  assert.throws(() => reviewSync.seedMembership(rows, [ext(4)], clientId));
  assert.throws(() => reviewSync.seedMembership(rows, [ext(1), ext(1)], clientId));
  const plan = reviewSync.seedMembership(rows, [ext(1)], clientId);
  assert.ok(plan.every((row) => Object.keys(row.payload).every((key) => key.startsWith('latest_feed_'))));
  const after = materialize(rows, plan.map((row) => ({ ...row, action: 'update' })));
  assert.ok(after.every((row) => row.status === 'archived'));
  assert.deepEqual(reviewSync.seedMembership(after, [ext(1)], clientId), []);
});
check('rollback detects later edits and permits narrow unchanged before-image', () => {
  const after = { date_updated: '2026-09-15T12:00:00Z', latest_feed_member: true, latest_feed_order: 1 };
  const before = { latest_feed_member: false, latest_feed_order: null };
  const images = [{ id: 'synthetic-id', client: clientId, before, after }];
  const row = { id: 'synthetic-id', client: clientId, ...after };
  assert.deepEqual(reviewSync.planRollback(images, [row])[0].payload, before);
  assert.equal(reviewSync.planRollback(images, [{ ...row, date_updated: '2026-09-15T12:01:00Z' }])[0].disposition, 'conflict');
  assert.equal(reviewSync.planRollback(images, [{ ...row, latest_feed_order: 2 }])[0].disposition, 'conflict');
});

function syntheticGraph() {
  const names = ['Daily 2:15 AM ET', 'Fetch Latest 40 Reviews', 'Keep Five-Star Reviews', 'Normalize Latest 20', 'Get Clients', 'Filter SonShine Roofing', 'Resolve Client Context', 'Get Existing Managed Reviews', 'Prepare Upsert Plan', 'Route Upsert Actions', 'Create Review', 'Update Review', 'Keep Unchanged Review', 'Wait For Upserts', 'Read Back Before Archive', 'Verify Upserts Before Archive', 'Route Archive Actions', 'Archive Stale Review', 'No Reviews To Archive', 'Wait For Archive', 'Final Published Readback', 'Verify Final Latest 20', 'Revalidate Reviews Cache', 'Verify Cache Revalidation', 'Documentation - Source And Schedule', 'Documentation - Transform Contract', 'Documentation - Safe Upsert', 'Documentation - Test And Cache TODO'];
  const nodes = names.map((name, index) => ({ id: `synthetic-node-${index}`, name, type: name.includes('Documentation') ? 'n8n-nodes-base.stickyNote' : 'n8n-nodes-base.code', typeVersion: 2, parameters: {} }));
  nodes.find((node) => node.name === 'Route Archive Actions').parameters = { mode: 'expression', numberOutputs: 2, output: "={{ $json.action === 'archive' ? 0 : 1 }}" };
  const connections = Object.fromEntries(names.slice(0, 23).map((name, index) => [name, { main: [[{ node: names[index + 1], type: 'main', index: 0 }]] }]));
  return { id: 'synthetic-workflow', name: 'SRI Latest Reviews Catcher -> Directus', versionId: 'synthetic-version', activeVersionId: 'synthetic-version', nodes, connections, settings: {}, activeVersion: { nodes: structuredClone(nodes), connections: structuredClone(connections) } };
}
const inputArg = process.argv.slice(2);
if (inputArg.length && (inputArg.length !== 2 || inputArg[0] !== '--private-recovery' || !inputArg[1].startsWith('/private/tmp/sonshine-location-migration-20260915/'))) throw new Error('Optional argument: --private-recovery APPROVED_PRIVATE_JSON');
const original = inputArg.length ? JSON.parse(await readFile(inputArg[1], 'utf8')).current : syntheticGraph();
const patch = buildWorkflowPatch(original, { expectedHash: graphHash(original) });
const graph = patch.candidate;
const node = (name) => graph.nodes.find((value) => value.name === name);
function runCode(name, rows, outputs = {}) {
  const inputs = rows.map((json) => ({ json }));
  const $ = (key) => ({ first: () => ({ json: outputs[key]?.[0] }), all: () => (outputs[key] ?? []).map((json) => ({ json })) });
  return JSON.parse(JSON.stringify(vm.runInNewContext(`(function(){${node(name).parameters.jsCode}\n})()`, { $input: { all: () => inputs }, $ }, { timeout: 1000 }))).map((item) => item.json);
}
check('graph guard and active/current agreement', () => {
  assert.throws(() => buildWorkflowPatch(original, { expectedHash: 'changed' }));
  const changed = structuredClone(original);
  changed.activeVersionId = 'different';
  assert.throws(() => buildWorkflowPatch(changed, { expectedHash: graphHash(changed) }));
});
check('atomic operation plan reconstructs the candidate graph', () => {
  const saved = structuredClone(original);
  for (const operation of patch.operations) {
    const selected = saved.nodes.find((value) => value.name === operation.nodeName);
    if (operation.type === 'updateNodeParameters') selected.parameters = structuredClone(operation.parameters);
    else if (operation.type === 'setNodeSettings') Object.assign(selected, operation.settings);
    else if (operation.type === 'removeConnection') {
      const edges = saved.connections[operation.source]?.main[operation.sourceIndex] ?? [];
      const index = edges.findIndex((edge) => edge.node === operation.target && edge.index === operation.targetIndex);
      assert.notEqual(index, -1);
      edges.splice(index, 1);
    } else if (operation.type === 'addConnection') {
      saved.connections[operation.source] ??= { main: [[]] };
      saved.connections[operation.source].main[operation.sourceIndex].push({ node: operation.target, type: 'main', index: operation.targetIndex });
    } else if (operation.type === 'removeNode') {
      saved.nodes = saved.nodes.filter((value) => value.name !== operation.nodeName);
      delete saved.connections[operation.nodeName];
      for (const connection of Object.values(saved.connections)) for (let index = 0; index < (connection.main ?? []).length; index += 1) connection.main[index] = connection.main[index].filter((edge) => edge.node !== operation.nodeName);
    } else if (operation.type === 'renameNode') {
      saved.nodes.find((value) => value.name === operation.oldName).name = operation.newName;
      if (saved.connections[operation.oldName]) {
        saved.connections[operation.newName] = saved.connections[operation.oldName];
        delete saved.connections[operation.oldName];
      }
      for (const connection of Object.values(saved.connections)) for (const edges of connection.main ?? []) for (const edge of edges) if (edge.node === operation.oldName) edge.node = operation.newName;
    } else assert.fail('Unexpected operation type');
  }
  assert.equal(graphHash(saved), patch.candidateGraphSha256);
});
check('tenant-scoped actual query expressions', () => {
  for (const [name, membersOnly] of [['Get Existing Managed Reviews', false], ['Read Back Before Membership Cleanup', false], ['Final Membership Readback', true]]) {
    const expression = node(name).parameters.queryParameters.slice(3, -2);
    const actual = JSON.parse(vm.runInNewContext(expression, { $: () => ({ first: () => ({ json: { clientId } }) }) }));
    assert.deepEqual(actual, managedReviewQuery(clientId, membersOnly));
    assert.equal(Object.hasOwn(actual.filter, 'status'), false);
    assert.equal(Object.hasOwn(actual.filter, 'external_id'), false);
    assert.equal(node(name).alwaysOutputData, true);
  }
  const clients = JSON.parse(node('Get Clients').parameters.queryParameters);
  assert.deepEqual(clients.filter, { slug: { _eq: 'sonshine-roofing' }, is_active: { _eq: true } });
});
check('source empty path is wired and errors stop', () => {
  assert.equal(node('Keep Five-Star Reviews'), undefined);
  assert.equal(node('Fetch Latest 40 Reviews').alwaysOutputData, true);
  assert.equal(node('Fetch Latest 40 Reviews').onError, 'stopWorkflow');
  assert.ok(graph.connections['Fetch Latest 40 Reviews'].main[0].some((edge) => edge.node === 'Normalize Latest 20'));
  assert.equal(node('Clear Stale Membership').onError, 'stopWorkflow');
});
for (const count of [0, 3, 20, 25]) check(`embedded Code nodes end-to-end synthetic ${count}`, () => {
  const sources = Array.from({ length: count }, (_, index) => source(index));
  const normalized = runCode('Normalize Latest 20', sources.length ? sources : [{}]);
  const resolved = runCode('Resolve Client Context', [{ id: clientId, slug: 'sonshine-roofing', is_active: true }], { 'Normalize Latest 20': normalized });
  const outputs = { 'Resolve Client Context': resolved };
  const planned = runCode('Prepare Upsert Plan', [{}], outputs);
  let rows = materialize([], planned);
  const cleanup = runCode('Verify Upserts Before Membership Cleanup', rows.length ? rows : [{}], outputs);
  rows = materialize(rows, cleanup);
  const result = runCode('Verify Final Latest 20', rows.length ? rows : [{}], { ...outputs, 'Prepare Upsert Plan': planned, 'Verify Upserts Before Membership Cleanup': cleanup });
  assert.equal(result[0].selectedCount, Math.min(count, 20));
  assert.equal(result[0].deploymentRequiredForLocations, true);
});
check('candidate lacks status mutation in departure and upsert updates', () => {
  assert.equal(node('Archive Stale Review'), undefined);
  assert.equal(node('Final Published Readback'), undefined);
  const expression = node('Route Membership Cleanup').parameters.output.slice(3, -2);
  assert.equal(vm.runInNewContext(expression, { $json: { action: 'clear-membership' } }), 0);
  assert.equal(vm.runInNewContext(expression, { $json: { action: 'membership-noop' } }), 1);
});
console.log(`Location review synchronization: ${checks} synthetic checks passed${inputArg.length ? ' against refreshed private graph' : ''}. No external effects executed.`);
