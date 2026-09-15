import { createHash } from 'node:crypto';
import { reviewSyncRuntime } from './core.mjs';

export const CONTRACT_VERSION = 'location-v3';
export const BASE_GRAPH_SHA256 = 'dfe166e47bc8224252cb8a4c51354465ae9c99fdcd3a0e337689e5c367ae9569';

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}
export function graphHash(graph) {
  const serialized = JSON.stringify(stable({ nodes: graph.nodes, connections: graph.connections, settings: graph.settings ?? null }))
    .replace(/[\u0080-\uffff]/g, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
  return createHash('sha256').update(serialized).digest('hex');
}
const runtime = `const sync = (${reviewSyncRuntime.toString()})();\n`;
const allRows = '$input.all().map(item => item.json)';
const code = (body) => ({ mode: 'runOnceForAllItems', language: 'javaScript', jsCode: runtime + body });
const fields = ['id', 'client', 'author_name', 'rating', 'review_text', 'review_date', 'source', 'external_id', 'source_created_at', 'source_updated_at', 'latest_feed_member', 'latest_feed_order'];

export function managedReviewQuery(client, membersOnly = false) {
  if (!client) throw new Error('A resolved client is required');
  return { fields, filter: { client: { _eq: client }, ...(membersOnly ? { latest_feed_member: { _eq: true } } : {}) }, sort: ['id'], limit: -1 };
}
const queryExpression = (membersOnly) => `={{ JSON.stringify({ fields: ${JSON.stringify(fields)}, filter: { client: { _eq: $('Resolve Client Context').first().json.clientId }${membersOnly ? ', latest_feed_member: { _eq: true }' : ''} }, sort: ['id'], limit: -1 }) }}`;

// Prepare an exact atomic MCP update operation list. This never calls n8n.
export function buildWorkflowPatch(recovery, { expectedHash = BASE_GRAPH_SHA256 } = {}) {
  const original = recovery.current ?? recovery.workflow ?? recovery;
  if (graphHash(original) !== expectedHash) throw new Error('Workflow graph changed; refresh current/active evidence before preparing a patch');
  if (original.name !== 'SRI Latest Reviews Catcher -> Directus') throw new Error('Unexpected workflow target');
  if (original.versionId !== original.activeVersionId || !original.activeVersion || JSON.stringify(original.nodes) !== JSON.stringify(original.activeVersion.nodes) || JSON.stringify(original.connections) !== JSON.stringify(original.activeVersion.connections)) throw new Error('Current and active workflow graphs differ; reconcile before patching');
  const candidate = structuredClone(original);
  const operations = [];
  function node(name) {
    const matches = candidate.nodes.filter((value) => value.name === name);
    if (matches.length !== 1) throw new Error(`Expected one workflow node: ${name}`);
    return matches[0];
  }
  function parameters(name, value) {
    node(name).parameters = value;
    operations.push({ type: 'updateNodeParameters', nodeName: name, parameters: value, replace: true });
  }
  function settings(name, value) {
    Object.assign(node(name), value);
    operations.push({ type: 'setNodeSettings', nodeName: name, settings: value });
  }
  function removeConnection(source, target) {
    const connections = candidate.connections[source]?.main ?? [];
    connections.forEach((edges, sourceIndex) => {
      for (const edge of [...edges]) if (edge.node === target) {
        operations.push({ type: 'removeConnection', source, sourceIndex, target, targetIndex: edge.index, connectionType: 'main' });
        edges.splice(edges.indexOf(edge), 1);
      }
    });
  }
  function connect(source, target) {
    candidate.connections[source] ??= { main: [[]] };
    candidate.connections[source].main[0].push({ node: target, type: 'main', index: 0 });
    operations.push({ type: 'addConnection', source, sourceIndex: 0, target, targetIndex: 0, connectionType: 'main' });
  }
  function remove(name) {
    node(name);
    for (const source of Object.keys(candidate.connections)) removeConnection(source, name);
    delete candidate.connections[name];
    candidate.nodes = candidate.nodes.filter((value) => value.name !== name);
    operations.push({ type: 'removeNode', nodeName: name });
  }
  function rename(oldName, newName) {
    node(oldName).name = newName;
    if (candidate.connections[oldName]) {
      candidate.connections[newName] = candidate.connections[oldName];
      delete candidate.connections[oldName];
    }
    for (const connection of Object.values(candidate.connections)) for (const edges of connection.main ?? []) for (const edge of edges) if (edge.node === oldName) edge.node = newName;
    operations.push({ type: 'renameNode', oldName, newName });
  }

  // Bypass the filter because an all-non-five-star response still needs cleanup.
  remove('Keep Five-Star Reviews');
  connect('Fetch Latest 40 Reviews', 'Normalize Latest 20');
  settings('Fetch Latest 40 Reviews', { alwaysOutputData: true, onError: 'stopWorkflow', executeOnce: true });
  parameters('Normalize Latest 20', code(`return [{ json: sync.normalize(${allRows}) }];`));
  parameters('Resolve Client Context', code(`const clients = ${allRows};\nif (clients.length !== 1 || !clients[0]?.id || clients[0].slug !== 'sonshine-roofing' || clients[0].is_active !== true) throw new Error('Expected exactly one active intended Directus client');\nconst normalized = $('Normalize Latest 20').first().json;\nconst context = { ...normalized, clientId: clients[0].id };\nsync.validateContext(context);\nreturn [{ json: context }];`));
  remove('Filter SonShine Roofing');
  connect('Get Clients', 'Resolve Client Context');
  parameters('Get Clients', { resource: 'item', operation: 'getAllRaw', collection: 'clients', queryParameters: JSON.stringify({ fields: ['id', 'slug', 'is_active'], filter: { slug: { _eq: 'sonshine-roofing' }, is_active: { _eq: true } }, limit: 2 }) });
  settings('Get Clients', { alwaysOutputData: true, executeOnce: true, onError: 'stopWorkflow' });
  parameters('Get Existing Managed Reviews', { resource: 'item', operation: 'getAllRaw', collection: 'reviews', queryParameters: queryExpression(false) });
  settings('Get Existing Managed Reviews', { alwaysOutputData: true, executeOnce: true, onError: 'stopWorkflow' });
  parameters('Prepare Upsert Plan', code(`return sync.planUpserts(${allRows}, $('Resolve Client Context').first().json).map(json => ({ json }));`));
  for (const name of ['Create Review', 'Update Review', 'Archive Stale Review']) settings(name, { onError: 'stopWorkflow' });

  rename('Read Back Before Archive', 'Read Back Before Membership Cleanup');
  rename('Verify Upserts Before Archive', 'Verify Upserts Before Membership Cleanup');
  rename('Route Archive Actions', 'Route Membership Cleanup');
  rename('Archive Stale Review', 'Clear Stale Membership');
  rename('No Reviews To Archive', 'No Membership To Clear');
  rename('Wait For Archive', 'Wait For Membership Cleanup');
  rename('Final Published Readback', 'Final Membership Readback');

  for (const [name, membersOnly] of [['Read Back Before Membership Cleanup', false], ['Final Membership Readback', true]]) {
    parameters(name, { resource: 'item', operation: 'getAllRaw', collection: 'reviews', queryParameters: queryExpression(membersOnly) });
    settings(name, { alwaysOutputData: true, executeOnce: true, onError: 'stopWorkflow' });
  }
  parameters('Verify Upserts Before Membership Cleanup', code(`return sync.planDeparture(${allRows}, $('Resolve Client Context').first().json).map(json => ({ json }));`));
  const route = node('Route Membership Cleanup');
  const ruleParams = JSON.parse(JSON.stringify(route.parameters).replaceAll('archive-noop', 'membership-noop').replaceAll('archive', 'clear-membership'));
  parameters(route.name, ruleParams);
  parameters('Verify Final Latest 20', code(`const summary = sync.verifyMembership(${allRows}, $('Resolve Client Context').first().json);\nconst planned = $('Prepare Upsert Plan').all().map(item => item.json);\nconst cleanup = $('Verify Upserts Before Membership Cleanup').all().map(item => item.json);\nreturn [{ json: { ...summary, createdCount: planned.filter(row => row.action === 'create').length, updatedCount: planned.filter(row => row.action === 'update').length, unchangedCount: planned.filter(row => row.action === 'noop' && !row.emptySelection).length, membershipClearedCount: cleanup.filter(row => row.action === 'clear-membership').length } }];`));
  const notes = {
    'Documentation - Source And Schedule': '## Source and schedule\nDaily 2:15 AM America/New_York. Successful source fetch selects at most 20 written five-star reviews from the latest 40. Errors stop before writes; successful zero eligible results clear stale membership. No production execution for tests.',
    'Documentation - Transform Contract': '## Source ownership\nGoogle owns verified resource identity, source facts and timestamps, latest_feed_member and latest_feed_order. Preserve existing attribution abbreviation and approved brand-spelling normalization. Never invent source dates or Google identities.',
    'Documentation - Safe Upsert': '## Editorial preservation\nNew eligible reviews are created published. Updates send source/membership fields only. Status, service_area, url, owner_reply, wordpress_provenance and legacy sort_order are preserved. Departure clears membership/order, never publication. Exact selected-set readback is capped at 20 regardless of editorial publication.',
    'Documentation - Test And Cache TODO': '## Release and recovery\nRun local synthetic rollover/unpublication/zero-set tests. Pause the old schedule before historical retention. Deploy membership-gated sitewide readers before expanding history. Read back the saved and active candidate after authorized publication. Reviews cache refresh does not deploy location snapshots. Rollback requires application compatibility and guarded narrow record recovery before the old archiving workflow is enabled.',
  };
  for (const [name, content] of Object.entries(notes)) parameters(name, { ...node(name).parameters, content });
  return { format: 'sonshine-review-workflow-patch-v1', contractVersion: CONTRACT_VERSION, sourceGraphSha256: expectedHash,
    candidateGraphSha256: graphHash(candidate), workflowId: original.id, operations, candidate };
}
