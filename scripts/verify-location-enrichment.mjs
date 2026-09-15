import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, mkdir, symlink, rm } from 'node:fs/promises';
import { VERSION, FIELDS, planEnrichment, verifyPlan, publicSummary, normalizeReference, normalizeZip, applyEnrichmentPlan } from './location-enrichment/core.mjs';
import { enrichmentApi, endpointFingerprint } from './location-enrichment/cli.mjs';
import { mapDirectusProject } from '../lib/content/directus-projects.mjs';

// Entirely synthetic: no credentials, AccuLynx reads, private inputs, or real API requests.
const time = '2020-01-01T00:00:00Z', later = '2020-01-02T00:00:00Z';
const endpoint = 'https://cms.example.test';
const inventory = () => ({ version: VERSION, client: { id: 'client', slug: 'sonshine-roofing' }, endpointHash: endpointFingerprint(endpoint),
  schemaReady: true, privacyVerified: true, inventoryComplete: true, asOf: time,
  projects: ['project-one', 'project-two'].map(id => ({ id, client: 'client', date_updated: time, job_id: null, zip: null, service_area: 'area', neighborhood: null, title: 'Keep editorial title', status: 'draft' })),
  areas: [{ id: 'area', client: 'client' }, { id: 'nearby', client: 'client' }],
  neighborhoods: [{ id: 'hood', client: 'client', service_area: 'area' }, { id: 'nearby-hood', client: 'client', service_area: 'nearby' }] });
const mappings = () => ['project-one', 'project-two'].map((project_id, index) => ({ project_id, job_id: `synthetic-private-job-${index}`, zip: '34200', service_area_id: 'area',
  owner_match_verified: true, authenticated_job_verified: true, zip_verified: true, service_area_verified: true,
  evidence_labels: ['synthetic-owner-map', 'synthetic-authenticated-job'], verified_at: time }));
const make = (target = inventory(), rows = mappings()) => planEnrichment(target, rows, { createdAt: time });
let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks++; };
const approvalFor = plan => ({ planHash: plan.planHash, endpointHash: plan.endpointHash, productionApplyAuthorized: true,
  exclusiveWriter: true, editorialChangesPaused: true, schemaPermissionsVerified: true, recoveryLocationApproved: true });
const model = (state = inventory()) => {
  let writes = 0, reads = 0;
  return { state, get writes() { return writes; }, get reads() { return reads; },
    endpointHash: state.endpointHash,
    async inventory() { return structuredClone(state); },
    async getProject(id) { reads++; return structuredClone(state.projects.find(row => row.id === id)); },
    async updateProject(id, data) { assert.deepEqual(Object.keys(data).sort(), [...FIELDS].sort()); writes++; Object.assign(state.projects.find(row => row.id === id), data, { date_updated: later }); },
  };
};
const plan = make();
check(plan.readyForApply && plan.counts.updates === 2 && plan.outcomes.length === 2 && plan.sources.length === 2, 'Every target and source accounted');
verifyPlan(JSON.parse(JSON.stringify(plan)), plan.planHash); checks++;
check(!JSON.stringify(plan).includes('Keep editorial title'), 'Private artifact retains only narrow target fields');
check(!JSON.stringify(publicSummary(plan)).includes('synthetic-private-job') && !JSON.stringify(publicSummary(plan)).includes('34200') && !JSON.stringify(publicSummary(plan)).includes('project-one'), 'Public summary excludes private references and row identities');
assert.equal(normalizeReference(' \t\n '), null); assert.equal(normalizeReference(' synthetic-job '), 'synthetic-job');
assert.equal(normalizeZip(' 012345678 '), '01234-5678'); assert.equal(normalizeZip(1234), undefined); assert.equal(normalizeZip('34 200'), undefined); checks++;
const uuid = 'abcdef12-3456-4789-abcd-ef1234567890';
check(normalizeReference(uuid.toUpperCase()) === uuid, 'UUID references use canonical lowercase');
const duplicateUuid = mappings(); duplicateUuid[0].job_id = uuid; duplicateUuid[1].job_id = uuid.toUpperCase();
check(make(inventory(), duplicateUuid).counts.conflicts === 2 && !make(inventory(), duplicateUuid).readyForApply, 'UUID case variants cannot map one job to two projects');
const existingUuid = inventory(); existingUuid.projects[1].job_id = uuid.toUpperCase();
const assignedUuid = mappings(); assignedUuid[0].job_id = uuid;
check(make(existingUuid, assignedUuid).outcomes[0].reasons.includes('job_owned_by_other_project'), 'Existing UUID ownership is also case invariant');

for (const [change, expected] of [
  [data => { data.schemaReady = false; for (const row of data.projects) { delete row.job_id; delete row.zip; delete row.neighborhood; } }, 'schema_not_ready'],
  [data => { data.privacyVerified = false; }, 'privacy_not_verified'],
  [data => { data.inventoryComplete = false; }, 'inventory_incomplete'],
]) {
  const data = inventory(); change(data); const proposed = make(data);
  check(proposed.complete && !proposed.readyForApply && proposed.blockers.includes(expected), expected);
  await assert.rejects(applyEnrichmentPlan({ plan: proposed, approval: approvalFor(proposed), api: model(data), receipt: async () => {} }), /incomplete_or_unready/u); checks++;
}
for (const [changeTarget, changeRows, reason] of [
  [() => {}, rows => rows.pop(), 'missing_mapping'],
  [() => {}, rows => { rows[0].job_id = ' \t\n '; }, 'missing_or_invalid_job'],
  [() => {}, rows => { rows[0].zip = 34200; }, 'missing_or_invalid_zip'],
  [() => {}, rows => { rows[0].job_id = rows[1].job_id; }, 'duplicate_job_mapping'],
  [() => {}, rows => rows.push(structuredClone(rows[0])), 'duplicate_project_mapping'],
  [data => data.projects.push(structuredClone(data.projects[0])), () => {}, 'duplicate_target_identity'],
  [data => { data.projects[0].client = 'other-client'; }, () => {}, 'cross_client_project'],
  [data => { data.projects[0].job_id = 'synthetic-preserve-job'; }, () => {}, 'existing_job_conflict'],
  [data => { data.projects[0].job_id = 'synthetic-private-job-1'; }, () => {}, 'job_owned_by_other_project'],
  [data => { data.projects[0].service_area = null; }, () => {}, 'primary_area_missing_or_unknown'],
  [() => {}, rows => { rows[0].authenticated_job_verified = false; }, 'unverified_required_fields'],
  [() => {}, rows => { rows[0].evidence_labels = []; }, 'verification_evidence_missing'],
  [() => {}, rows => { rows[0].service_area_id = 'unknown'; }, 'unknown_service_area'],
  [() => {}, rows => { rows[0].neighborhood_id = 'hood'; }, 'unverified_neighborhood'],
  [() => {}, rows => { rows[0].neighborhood_id = 'nearby-hood'; rows[0].neighborhood_verified = true; }, 'neighborhood_area_mismatch'],
  [data => { data.projects[0].zip = '99999'; }, () => {}, 'existing_zip_conflict'],
  [() => {}, rows => { rows[0].service_area_id = 'nearby'; }, 'existing_service_area_conflict'],
  [data => { data.projects[0].neighborhood = 'hood'; }, rows => { rows[0].neighborhood_id = 'nearby-hood'; rows[0].neighborhood_verified = true; }, 'existing_neighborhood_conflict'],
]) {
  const data = inventory(), rows = mappings(); changeTarget(data); changeRows(rows); const proposed = make(data, rows);
  check(!proposed.complete && !proposed.readyForApply && proposed.outcomes.some(row => row.reasons.includes(reason)), reason);
}
const unknown = mappings(); unknown.push({ ...unknown[0], project_id: 'unknown-project', job_id: 'synthetic-unknown-job' });
check(make(inventory(), unknown).sources.some(row => row.reasons.includes('unknown_project')), 'Unknown sources are accounted and block apply');
const wrongArea = inventory(); wrongArea.areas[0].client = 'other-client';
check(make(wrongArea).blockers.includes('invalid_geography_tenant'), 'Canonical geography must belong to the same tenant');
const keptHood = inventory(); keptHood.projects[0].neighborhood = 'hood';
check(make(keptHood).operations[0].after.neighborhood === 'hood', 'Omitted neighborhood preserves an existing relation');
const correction = { fields: ['zip', 'service_area', 'neighborhood'], independently_verified: true, evidence_labels: ['synthetic-independent-geography'], verified_at: time };
const corrected = mappings(); corrected[0] = { ...corrected[0], service_area_id: 'nearby', geography_correction: correction };
check(make().operations[0].after.neighborhood === null, 'No neighborhood is inferred from ZIP');
check(!make(keptHood, corrected).readyForApply, 'Area correction cannot retain an incompatible neighborhood');
corrected[0].neighborhood_id = 'nearby-hood'; corrected[0].neighborhood_verified = true;
check(make(keptHood, corrected).readyForApply, 'Independently documented geography correction is accepted');
keptHood.projects[0].job_id = 'synthetic-preserve-job';
check(!make(keptHood, corrected).readyForApply, 'Geography correction never permits replacing a job identity');

const api = model(), receipts = [];
const result = await applyEnrichmentPlan({ plan, approval: approvalFor(plan), api, receipt: async (index, phase, value) => { receipts.push({ index, phase, value: structuredClone(value) }); } });
check(api.writes === 2 && result.backfillVerified && result.verifiedProjects === 2 && !result.requiredConstraintMayRun, 'Full readback succeeds without enabling the separate required constraint');
check(api.state.projects.every(row => row.title === 'Keep editorial title' && row.status === 'draft'), 'Only enrichment-owned fields change');
check(receipts.filter(row => row.phase === 'before').length === 2 && receipts.filter(row => row.phase === 'after').length === 2, 'Every mutation has narrow before/after recovery');
check(make(api.state).counts.updates === 0 && make(api.state).counts.matches === 2, 'New plan rerun is idempotent');
const rerun = await applyEnrichmentPlan({ plan, approval: approvalFor(plan), api, receipt: async () => {} });
check(rerun.applied === 0 && api.writes === 2, 'Same exact plan resumes without duplicate writes');
const edited = model(); edited.state.projects[0].date_updated = later;
await assert.rejects(applyEnrichmentPlan({ plan, approval: approvalFor(plan), api: edited, receipt: async () => {} }), /later_editorial_change/u);
check(edited.writes === 0, 'Initial modification-state conflict prevents every write');
const race = model();
await assert.rejects(applyEnrichmentPlan({ plan, approval: approvalFor(plan), api: race, receipt: async (_index, phase) => { if (phase === 'before') race.state.projects[0].date_updated = later; } }), /later_editorial_change/u);
check(race.writes === 0, 'Immediate reread preserves editorial change after before-image');
const failedRecovery = model();
await assert.rejects(applyEnrichmentPlan({ plan, approval: approvalFor(plan), api: failedRecovery, receipt: async () => { throw new Error('Synthetic disk failure'); } }));
check(failedRecovery.writes === 0, 'Recovery must be durable before a write');
const incomplete = make(inventory(), mappings().slice(0, 1)), partialApi = model();
await assert.rejects(applyEnrichmentPlan({ plan: incomplete, approval: approvalFor(incomplete), api: partialApi, receipt: async () => {} }), /incomplete_or_unready/u);
check(partialApi.writes === 0, 'Partial plans cannot apply');
const addedProject = model(); addedProject.state.projects.push({ ...inventory().projects[0], id: 'new-project' });
await assert.rejects(applyEnrichmentPlan({ plan, approval: approvalFor(plan), api: addedProject, receipt: async () => {} }), /fresh_inventory_not_ready/u);
check(addedProject.writes === 0, 'New targets invalidate a previously complete reviewed plan');
const badReadback = model(); badReadback.updateProject = async () => {};
await assert.rejects(applyEnrichmentPlan({ plan, approval: approvalFor(plan), api: badReadback, receipt: async () => {} }), /written_field_readback_failed/u); checks++;
const interrupted = model(); let attempted = 0;
const originalUpdate = interrupted.updateProject;
interrupted.updateProject = async (id, data) => { if (++attempted === 2) throw new Error('Synthetic interruption'); return originalUpdate(id, data); };
await assert.rejects(applyEnrichmentPlan({ plan, approval: approvalFor(plan), api: interrupted, receipt: async () => {} }), /Synthetic interruption/u);
interrupted.updateProject = originalUpdate;
const resumed = await applyEnrichmentPlan({ plan, approval: approvalFor(plan), api: interrupted, receipt: async () => {} });
check(resumed.applied === 1 && resumed.matched === 1 && interrupted.writes === 2, 'Partially executed exact plan resumes safely');
const tampered = structuredClone(plan); tampered.operations[0].after.job_id = 'synthetic-secret-tamper';
await assert.rejects(applyEnrichmentPlan({ plan: tampered, approval: approvalFor(plan), api: model(), receipt: async () => {} }), error => !error.message.includes('synthetic-secret-tamper') && error.message.includes('plan_hash_mismatch')); checks++;

let networkCalls = 0;
assert.throws(() => enrichmentApi({ endpoint, token: 'synthetic-admin', plan, approval: { ...approvalFor(plan), productionApplyAuthorized: false }, fetcher: async () => { networkCalls++; } }), /authorization_missing/u);
check(networkCalls === 0, 'Authorization is checked before network access');
const badApi = enrichmentApi({ endpoint, token: 'synthetic-admin', plan, approval: approvalFor(plan), fetcher: async () => { throw new Error('synthetic-private-job-0'); } });
await assert.rejects(badApi.getProject('project-one'), error => !error.message.includes('synthetic-private-job-0')); checks++;
const requests = [];
const queryApi = enrichmentApi({ endpoint, token: 'synthetic-admin', plan, approval: approvalFor(plan), fetcher: async (url, options) => {
  requests.push({ url, options }); return { ok: true, json: async () => ({ data: [inventory().projects[0]] }) };
} });
await queryApi.getProject('project-one');
const query = JSON.parse(requests[0].url.searchParams.get('filter'));
check(query.client._eq === 'client' && query.id._eq === 'project-one' && requests[0].options.redirect === 'error', 'Private reads are tenant scoped and cannot redirect credentials');

const term = { id: 'area', client: { slug: 'sonshine-roofing' }, status: 'published', name: 'Synthetic area', slug: 'area' };
const publicProject = mapDirectusProject({ ...inventory().projects[0], client: term.client, status: 'published', scope_key: 'sonshine-roofing:synthetic', slug: 'synthetic', title: 'Synthetic roof', description: 'Synthetic work.', published_at: time,
  featured_image: { id: 'synthetic-image', description: 'Synthetic roof.', type: 'image/webp' }, og_image_override: null, gallery: [], material_type: term, service_area: term,
  neighborhood: null, roof_color: null, noindex: true, job_id: 'synthetic-private-job-0', zip: '34200' }, { clientSlug: 'sonshine-roofing', url: endpoint });
check(!('job_id' in publicProject) && !('zip' in publicProject) && !JSON.stringify(publicProject).includes('synthetic-private-job'), 'Public project projection discards private enrichment fields');
for (const path of ['../lib/content/directus-projects.mjs', '../lib/content/directus-locations.mjs', '../lib/content/location-data.ts']) {
  check(!(await readFile(new URL(path, import.meta.url), 'utf8')).includes('location-enrichment/'), 'Website snapshot code never imports private tooling');
}
// The approved recovery root can be durable storage, but can never be a Git path.
const temp = await mkdtemp('/private/tmp/location-private-io-test-');
const priorRoot = process.env.LOCATION_MIGRATION_PRIVATE_ROOT;
let sequence = 0;
async function privateIo(root) {
  process.env.LOCATION_MIGRATION_PRIVATE_ROOT = root;
  return import(`./location-migration/io.mjs?private-root-test=${sequence++}`);
}
try {
  const safe = `${temp}/durable-root`, repo = `${temp}/repository`;
  await mkdir(safe, { mode: 0o700 }); await mkdir(repo, { mode: 0o700 });
  await mkdir(`${repo}/.git`); await mkdir(`${repo}/child`, { mode: 0o700 });
  const io = await privateIo(safe);
  await io.writePrivate(`${safe}/synthetic.json`, { fixture: 'synthetic-private-value' });
  check((await io.readPrivate(`${safe}/synthetic.json`)).fixture === 'synthetic-private-value', 'Configured private root supports artifact write/read');
  await assert.rejects(io.writePrivate(`${safe}/synthetic.json`, {})); checks++;
  await assert.rejects(io.checkedPath(`${temp}/outside.json`, false)); checks++;
  const nested = `${safe}/nested-repository`;
  await mkdir(nested, { mode: 0o700 }); await mkdir(`${nested}/.git`);
  await writeFile(`${nested}/synthetic.json`, '{}', { mode: 0o600 });
  await assert.rejects(io.writePrivate(`${nested}/new.json`, {}), /outside every Git/u); checks++;
  await assert.rejects(io.readPrivate(`${nested}/synthetic.json`), /outside every Git/u); checks++;
  await assert.rejects(io.readPrivateBytes(`${nested}/synthetic.json`), /outside every Git/u); checks++;
  await writeFile(`${safe}/malformed.json`, 'synthetic-private-malformed-value', { mode: 0o600 });
  await assert.rejects(io.readPrivate(`${safe}/malformed.json`), error => error.message.includes('contents suppressed') && !error.message.includes('synthetic-private-malformed-value')); checks++;
  for (const root of [repo, `${repo}/child`]) {
    const unsafe = await privateIo(root);
    await assert.rejects(unsafe.checkedPath(`${root}/synthetic.json`, false), /outside every Git/u); checks++;
  }
  await symlink(safe, `${temp}/alias`);
  const alias = await privateIo(`${temp}/alias`);
  await assert.rejects(alias.checkedPath(`${temp}/alias/synthetic.json`), /canonical private artifact root/u); checks++;
  const relative = await privateIo('relative-root');
  await assert.rejects(relative.checkedPath(`${safe}/synthetic.json`), /must be absolute/u); checks++;
} finally {
  if (priorRoot === undefined) delete process.env.LOCATION_MIGRATION_PRIVATE_ROOT;
  else process.env.LOCATION_MIGRATION_PRIVATE_ROOT = priorRoot;
  await rm(temp, { recursive: true });
}
console.log(`PASS: ${checks} synthetic enrichment planning, verification, correction, tenant, privacy, idempotency, recovery, and guarded apply checks; no real API calls.`);
