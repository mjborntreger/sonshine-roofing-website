import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir, stat, realpath } from 'node:fs/promises';
import { resolve, isAbsolute, dirname, basename, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { publicLocationFields } from './schema.mjs';

export const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fieldsOf = fields => Array.isArray(fields) ? fields : typeof fields === 'string' ? fields.split(',') : [];
/** Directus returns the complete set, including uneditable virtual system permissions. */
export async function readPermissions(request) {
  const rows = await request('permissions');
  assert.ok(Array.isArray(rows), 'Invalid complete permission response.');
  const ids = new Set(), persisted = [];
  for (const row of rows) {
    assert.ok(row && typeof row === 'object' && !Array.isArray(row), 'Invalid permission row.');
    if (row.id == null) {
      assert.ok(row.system === true && row.policy === null && typeof row.collection === 'string'
        && row.collection.startsWith('directus_') && ['create', 'read', 'update', 'delete', 'share'].includes(row.action),
      'Idless permission is not a verified virtual system grant.');
      continue;
    }
    assert.ok(typeof row.id === 'string' && row.id.length > 0 || Number.isSafeInteger(row.id), 'Permission identity missing or invalid.');
    const key = String(row.id);
    assert.ok(!ids.has(key), 'Duplicate permission identity; complete response cannot be trusted.');
    ids.add(key);
    persisted.push(row);
  }
  return persisted;
}
export function assertReaderProjection(permissions, { requireProjectAccess = true } = {}) {
  const read = permissions?.roofing_projects?.read;
  if (!read || read.access === 'none') { assert.ok(!requireProjectAccess, 'Website project access missing.'); return; }
  const fields = fieldsOf(read.fields);
  assert.ok(fields.length > 0, 'Effective project field grant unavailable.');
  assert.ok(!fields.some(field => field.includes('*') || /(^|\.)(job_id|zip)($|\.)/u.test(field)), 'Unsafe effective project wildcard/private field grant.');
}
const clientFilter = (clientId, path = 'client') => path.split('.').reverse().reduce((value, key) => ({ [key]: value }), { _eq: clientId });
export function rowScope(collection, clientId) {
  const published = { status: { _eq: 'published' } };
  if (collection === 'sponsor_service_areas') return { _and: [clientFilter(clientId, 'sponsor.client'), { sponsor: published }, clientFilter(clientId, 'service_area.client'), { service_area: published }] };
  if (collection === 'roofing_service_area_neighbors') return { _and: [clientFilter(clientId, 'service_area.client'), clientFilter(clientId, 'nearby_area.client'), { service_area: published }, { nearby_area: published }, { approved: { _eq: true } }] };
  if (collection === 'service_area_section_areas') return { _and: [clientFilter(clientId, 'section.client'), clientFilter(clientId, 'service_area.client'), { service_area: published }] };
  if (collection === 'navigation_items') return { _and: [clientFilter(clientId, 'menu.client'), published] };
  return collection === 'service_area_sections' ? clientFilter(clientId) : { _and: [clientFilter(clientId), published] };
}
function scoped(prior, required) {
  if (!prior || JSON.stringify(prior) === '{}') return required;
  if (JSON.stringify(prior) === JSON.stringify(required)) return prior;
  if (prior._and?.some(rule => JSON.stringify(rule) === JSON.stringify(required))) return prior;
  return { _and: [prior, required] };
}
export function planPermissions(rows, { policyIds, clientId, availableFields, phase = 'tighten', policyScopeVerifiedExclusive = false }) {
  assert.ok(policyIds?.length && new Set(policyIds).size === policyIds.length && clientId, 'An approved exact policy set and client are required.');
  assert.ok(['tighten', 'extend'].includes(phase), 'Invalid permission phase.');
  if (phase === 'extend') assert.ok(policyScopeVerifiedExclusive, 'Resolve policy assignments and verify exclusive SonShine use before changing tenant scopes.');
  const collections = phase === 'tighten' ? ['roofing_projects'] : Object.keys(publicLocationFields);
  const changes = [];
  for (const policy of policyIds) for (const collection of collections) {
    const grants = rows.filter(row => row.policy === policy && row.action === 'read' && row.collection === collection);
    const available = new Set(availableFields[collection] ?? []);
    assert.ok(available.size, `Missing schema for ${collection}.`);
    const allowed = publicLocationFields[collection].filter(name => available.has(name));
    assert.ok(allowed.includes('id'), `No public projection for ${collection}.`);
    if (!grants.length && phase === 'tighten') continue; // Do not grant previously absent access during tightening.
    for (const prior of grants.length ? grants : [null]) {
      const priorFields = fieldsOf(prior?.fields);
      if (phase === 'tighten') assert.ok(priorFields.length, 'Existing field scope is unavailable; resolve it before tightening.');
      const fields = phase === 'tighten' && !priorFields.includes('*') ? priorFields.filter(name => allowed.includes(name)) : allowed;
      assert.ok(fields.length, 'No existing public fields remain; review removal of this grant rather than broadening access.');
      const data = { collection, action: 'read', policy,
        fields, permissions: phase === 'tighten' ? (prior?.permissions ?? null) : scoped(prior?.permissions, rowScope(collection, clientId)) };
      if (prior && JSON.stringify(fieldsOf(prior.fields)) === JSON.stringify(data.fields) && JSON.stringify(prior.permissions) === JSON.stringify(data.permissions)) continue;
      changes.push({ id: prior?.id ?? null, before: prior, beforeDigest: digest(prior), data });
    }
  }
  return changes;
}
/** Resolve symlinks before writing private before-images, including new paths. */
export async function prepareRecoveryDirectory(directory, repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))) {
  assert.ok(directory && isAbsolute(directory), 'An absolute recovery directory outside Git is required.');
  const root = await realpath(repositoryRoot);
  let ancestor = resolve(directory);
  const missing = [];
  for (;;) {
    try { ancestor = await realpath(ancestor); break; }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      missing.unshift(basename(ancestor));
      const parent = dirname(ancestor);
      assert.notEqual(parent, ancestor, 'Recovery parent cannot be resolved.');
      ancestor = parent;
    }
  }
  const target = resolve(ancestor, ...missing);
  assert.ok(target !== root && !target.startsWith(root + '/'), 'Recovery directory must remain outside Git.');
  for (let parent = ancestor; ; parent = dirname(parent)) {
    try { await stat(join(parent, '.git')); assert.fail('Recovery directory must remain outside Git.'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (dirname(parent) === parent) break;
  }
  await mkdir(target, { recursive: true, mode: 0o700 });
  const actual = await realpath(target);
  assert.equal(actual, target, 'Recovery path changed while preparing it.');
  assert.equal((await stat(actual)).mode & 0o077, 0, 'Recovery directory must be private (0700).');
  return actual;
}
export async function applyPermissionPlan(request, changes, saveRecovery) {
  assert.equal(typeof saveRecovery, 'function', 'Private recovery writer required.');
  for (let index = 0; index < changes.length; index++) {
    const change = changes[index];
    const current = change.id === null ? null : await request(`permissions/${encodeURIComponent(change.id)}`);
    assert.equal(digest(current), change.beforeDigest, 'Permission changed since planning; stop for review.');
    // Recheck absence for creates so a resumed plan cannot duplicate permissions.
    if (change.id === null) {
      const matches = (await readPermissions(request)).filter(row => row.policy === change.data.policy
        && row.collection === change.data.collection && row.action === change.data.action);
      assert.equal(matches.length, 0, 'Permission appeared after planning; replan.');
    }
    await saveRecovery(index, change);
    const updated = await request(change.id === null ? 'permissions' : `permissions/${encodeURIComponent(change.id)}`, change.id === null ? 'POST' : 'PATCH', change.data);
    const readback = await request(`permissions/${encodeURIComponent(updated.id)}`);
    for (const key of ['collection', 'action', 'policy', 'fields', 'permissions']) assert.ok(JSON.stringify(readback[key]) === JSON.stringify(change.data[key]), `Permission readback failed for ${key}.`);
    await saveRecovery(index, { ...change, after: readback, afterDigest: digest(readback) });
  }
  return { changed: changes.length };
}

export async function probePrivateProjectAccess(base, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const queries = [
    'items/roofing_projects?fields=id,job_id&limit=1',
    'items/videos?fields=id,project.job_id&limit=1',
    'items/roofing_projects?fields=id,reference&alias[reference]=job_id&limit=1',
  ];
  for (const query of queries) {
    const response = await fetch(`${base}/${query}`, { headers });
    assert.ok([400, 403].includes(response.status), 'Private-field request was not denied; stop release.');
  }
  for (const query of ['items/roofing_projects?fields=*&limit=2', 'items/videos?fields=*,project.*&limit=2']) {
    const response = await fetch(`${base}/${query}`, { headers });
    if (!token && response.status === 403) continue;
    assert.ok(response.ok, 'Public projection probe failed.');
    const result = await response.json();
    const walk = value => {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
        assert.ok(!['job_id', 'zip'].includes(key), 'Private project key appeared in public response.'); walk(child);
      }
    };
    walk(result.data);
  }
  return { explicitAndAliasQueriesDenied: 3, wildcardQueriesChecked: 2 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const arg = name => { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1]; };
  const phase = arg('--phase') ?? 'tighten';
  assert.ok(['tighten', 'extend', 'probe'].includes(phase), 'Phase must be tighten, extend or probe.');
  const base = process.env.DIRECTUS_URL?.replace(/\/+$/u, '');
  assert.ok(base, 'DIRECTUS_URL required.');
  if (phase === 'probe') {
    assert.ok(process.env.LOCATION_WEBSITE_TOKEN, 'LOCATION_WEBSITE_TOKEN required.');
    console.log(JSON.stringify({ website: await probePrivateProjectAccess(base, process.env.LOCATION_WEBSITE_TOKEN), anonymous: await probePrivateProjectAccess(base, null) }));
  } else {
    const token = process.env.LOCATION_DIRECTUS_ADMIN_TOKEN;
    const configPath = arg('--approved-policy-config');
    assert.ok(token && configPath, 'Authorized admin token and private approved-policy config required.');
    assert.equal((await stat(configPath)).mode & 0o077, 0, 'Approved policy configuration must be private (0600).');
    if (args.includes('--apply')) assert.ok(process.env.LOCATION_WEBSITE_TOKEN, 'LOCATION_WEBSITE_TOKEN is required before any permission mutation.');
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    const request = async (route, method = 'GET', body) => {
      const response = await fetch(`${base}/${route}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      const payload = await response.json();
      assert.ok(response.ok && !payload.errors, `${method} ${route.split('?')[0]} failed: HTTP ${response.status}.`);
      return payload.data;
    };
    // This system endpoint ignores pagination/filter query arguments in the live API.
    const rows = await readPermissions(request);
    const availableFields = {};
    for (const name of phase === 'tighten' ? ['roofing_projects'] : Object.keys(publicLocationFields)) availableFields[name] = (await request(`fields/${name}`)).map(row => row.field);
    const changes = planPermissions(rows, { ...config, availableFields, phase });
    if (args.includes('--apply')) {
      const directory = await prepareRecoveryDirectory(arg('--recovery-dir'));
      const runDirectory = resolve(directory, `permissions-${phase}-${Date.now()}-${randomUUID()}`);
      await mkdir(runDirectory, { mode: 0o700 });
      const save = async (index, change) => writeFile(resolve(runDirectory, `${index}.${change.after ? 'after' : 'before'}.json`), JSON.stringify(change), { mode: 0o600, flag: 'wx' });
      await applyPermissionPlan(request, changes, save);
      const reader = process.env.LOCATION_WEBSITE_TOKEN;
      assert.ok(reader, 'LOCATION_WEBSITE_TOKEN is required for post-apply effective readback.');
      const response = await fetch(`${base}/permissions/me`, { headers: { Authorization: `Bearer ${reader}` } });
      assert.ok(response.ok, 'Effective reader verification failed.');
      assertReaderProjection((await response.json()).data);
    }
    console.log(JSON.stringify({ phase, mode: args.includes('--apply') ? 'applied' : 'dry-run', changes: changes.map(change => ({ collection: change.data.collection, action: change.id === null ? 'create read grant' : 'tighten read grant' })) }, null, 2));
  }
}
