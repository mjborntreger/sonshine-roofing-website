import assert from 'node:assert/strict';
import { mkdtemp, mkdir, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setupLocationSchema } from './setup-location-schema.mjs';
import { locationSchema, locationRelations, publicProjectFields, publicLocationFields } from './location-model/schema.mjs';
import { planPermissions, applyPermissionPlan, assertReaderProjection, rowScope, prepareRecoveryDirectory } from './location-model/permissions.mjs';

// Synthetic API state, separate from the live CMS and its clients.
const tables = new Map(Object.keys(locationSchema).filter(name => !['roofing_neighborhoods', 'sponsor_service_areas', 'roofing_service_area_neighbors', 'service_area_section_areas'].includes(name)).map(name => [name, []]));
tables.get('roofing_projects').push({ field: 'service_area', type: 'uuid', schema: { is_nullable: false }, meta: { required: true } });
tables.get('navigation_items').push({ field: 'link_type', type: 'string', meta: { options: { choices: [{ text: 'Page', value: 'page' }] } } });
const relations = [];
const writes = [];
let gatePassed = false;
const request = async (route, method = 'GET', body) => {
  if (method !== 'GET') { assert.ok(gatePassed, 'Schema wrote before effective permission gate.'); writes.push({ route, method }); }
  if (route === 'collections') {
    if (method === 'POST') { tables.set(body.collection, structuredClone(body.fields)); return body; }
    return [...tables.keys()].map(collection => ({ collection }));
  }
  if (route === 'relations') { if (method === 'POST') { relations.push(structuredClone(body)); return body; } return relations; }
  const [, collection, name] = route.split('/');
  if (method === 'POST') { tables.get(collection).push(structuredClone(body)); return body; }
  if (method === 'PATCH') { const existing = tables.get(collection).find(row => row.field === name); existing.meta = { ...existing.meta, ...body.meta }; return existing; }
  return tables.get(collection);
};
const dry = await setupLocationSchema(request);
assert.ok(dry.actions.length > 20);
assert.equal(writes.length, 0, 'Default mode must not mutate.');
await assert.rejects(setupLocationSchema(request, { apply: true }), /effective reader/u);
assert.equal(writes.length, 0);
await setupLocationSchema(request, { apply: true, verifyPrivateAccess: async () => { gatePassed = true; } });
assert.equal((await setupLocationSchema(request, { verifyOnly: true })).actions.length, 0);
const appliedCount = writes.length;
assert.equal((await setupLocationSchema(request, { apply: true, verifyPrivateAccess: async () => {} })).actions.length, 0);
assert.equal(writes.length, appliedCount, 'Schema rerun duplicated changes.');
assert.equal(relations.length, locationRelations.length);
const photo = locationSchema.roofing_neighborhoods.find(row => row.field === 'image');
assert.equal(photo.schema.is_nullable, true);
assert.ok(photo.meta.note.includes('photo'));
assert.ok(publicLocationFields.roofing_neighborhoods.includes('image'));
assert.ok(publicLocationFields.roofing_neighborhoods.includes('coverage_map'));
// Existing v1 collections receive only the additive photo field and relation.
tables.set('roofing_neighborhoods', tables.get('roofing_neighborhoods').filter(row => row.field !== 'image'));
relations.splice(relations.findIndex(row => row.collection === 'roofing_neighborhoods' && row.field === 'image'), 1);
assert.deepEqual((await setupLocationSchema(request)).actions, ['create field roofing_neighborhoods.image', 'create relation roofing_neighborhoods.image']);
await setupLocationSchema(request, { apply: true, verifyPrivateAccess: async () => {} });
assert.equal((await setupLocationSchema(request, { verifyOnly: true })).actions.length, 0);
tables.get('roofing_projects').find(row => row.field === 'service_area').schema.is_nullable = true;
await assert.rejects(setupLocationSchema(request, { verifyOnly: true }), /Primary project area/u);
tables.get('roofing_projects').find(row => row.field === 'service_area').schema.is_nullable = false;
const mapRelation = relations.find(row => row.collection === 'roofing_projects' && row.field === 'neighborhood');
mapRelation.schema.on_delete = 'SET NULL';
await assert.rejects(setupLocationSchema(request, { verifyOnly: true }), /Deletion drift/u);
mapRelation.schema.on_delete = 'RESTRICT';
assert.ok(!Object.keys(locationSchema).includes('location_landing_pages'));
assert.ok(!Object.keys(locationSchema).includes('website_pages'));
assert.ok(!publicProjectFields.some(name => ['job_id', 'zip'].includes(name)));

const availableFields = Object.fromEntries(Object.entries(publicLocationFields).map(([name, fields]) => [name, fields]));
const initial = [{ id: 'synthetic-permission-1', policy: 'synthetic-reader', collection: 'roofing_projects', action: 'read', fields: ['*'], permissions: null }];
const config = { clientId: 'synthetic-client', policyIds: ['synthetic-reader'], availableFields, policyScopeVerifiedExclusive: true };
const tighten = planPermissions(initial, config);
assert.equal(tighten.length, 1);
assert.ok(!tighten[0].data.fields.includes('*'));
assert.ok(!JSON.stringify(tighten[0].data.fields).includes('job_id'));
assert.equal(planPermissions([{ ...initial[0], ...tighten[0].data }], config).length, 0, 'Permission rerun must be empty.');
assert.equal(planPermissions([{ ...initial[0], fields: ['id', 'title'] }], config).length, 0, 'Tightening must preserve an existing narrow field grant.');
assert.deepEqual(planPermissions([{ ...initial[0], fields: ['id', 'title', 'job_id'] }], config)[0].data.fields, ['id', 'title']);
assert.throws(() => planPermissions([{ ...initial[0], fields: [] }], config), /scope is unavailable/u);
const strictInitial = [{ ...initial[0], permissions: { title: { _starts_with: 'Allowed' } } }];
assert.deepEqual(planPermissions(strictInitial, config)[0].data.permissions, strictInitial[0].permissions, 'Tightening preserves prior row scope.');
assert.deepEqual(planPermissions(strictInitial, { ...config, phase: 'extend' })[0].data.permissions._and[0], strictInitial[0].permissions, 'Extension keeps narrower prior rules.');
assert.throws(() => planPermissions(initial, { ...config, phase: 'extend', policyScopeVerifiedExclusive: false }), /exclusive/u);
assert.ok(!JSON.stringify(rowScope('service_area_sections', 'synthetic-client')).includes('status'));
assert.ok(JSON.stringify(rowScope('roofing_service_area_neighbors', 'synthetic-client')).includes('approved'));
assertReaderProjection({ roofing_projects: { read: { access: 'partial', fields: publicProjectFields } } });
assertReaderProjection({}, { requireProjectAccess: false });
for (const fields of [['*'], ['id', 'job_id'], ['id', 'zip'], ['id', 'project.*']]) assert.throws(() => assertReaderProjection({ roofing_projects: { read: { access: 'partial', fields } } }), /Unsafe/u);
assert.throws(() => assertReaderProjection({}), /missing/u);

let record = structuredClone(initial[0]);
const recovery = [];
await applyPermissionPlan(async (route, method = 'GET', data) => {
  if (method === 'PATCH') record = { ...record, ...data };
  return structuredClone(record);
}, tighten, async (index, value) => recovery.push({ index, value }));
assert.equal(recovery.length, 2, 'Before and verified after images required.');
assert.equal(recovery[0].value.before.fields[0], '*');
assert.deepEqual(recovery[1].value.after.fields, publicProjectFields);
let conflictWrites = 0;
await assert.rejects(applyPermissionPlan(async (route, method = 'GET') => {
  if (method !== 'GET') conflictWrites++;
  return { ...initial[0], fields: ['id'] };
}, tighten, async () => {}), /changed since planning/u);
assert.equal(conflictWrites, 0, 'Preserve intervening policy edits.');
assert.ok(planPermissions(initial, { ...config, phase: 'extend' }).length > 1);
const privateRoot = await mkdtemp(join(tmpdir(), 'location-recovery-paths-'));
try {
  const repository = join(privateRoot, 'repository');
  await mkdir(join(repository, '.git'), { recursive: true, mode: 0o700 });
  await mkdir(join(repository, 'private'), { mode: 0o700 });
  await symlink(join(repository, 'private'), join(privateRoot, 'alias'));
  await assert.rejects(prepareRecoveryDirectory(repository, repository), /outside Git/u);
  await assert.rejects(prepareRecoveryDirectory(join(repository, 'private'), repository), /outside Git/u);
  await assert.rejects(prepareRecoveryDirectory(join(privateRoot, 'alias', 'new'), repository), /outside Git/u);
  await assert.rejects(prepareRecoveryDirectory(join(repository, 'private'), privateRoot + '/alias'), /outside Git/u);
  const safe = await prepareRecoveryDirectory(join(privateRoot, 'recovery'), repository);
  assert.ok(safe.endsWith('/recovery'));
} finally { await rm(privateRoot, { recursive: true, force: true }); }
console.log('PASS: location schema dry-run/apply gate/rerun/drift, reader allowlist, tenant scopes, permission recovery and editorial conflict checks (synthetic).');
