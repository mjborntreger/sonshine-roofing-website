import { createHash } from 'node:crypto';

// PRIVATE artifacts only. Never import this module into application content code.
export const VERSION = 'location-enrichment-v1';
export const CLIENT = 'sonshine-roofing';
export const FIELDS = ['job_id', 'zip', 'service_area', 'neighborhood'];
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
export const digest = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
export function requireSafe(condition, code) { if (!condition) throw new Error(`Enrichment stopped: ${code}. Private values suppressed.`); }
const id = value => value && typeof value === 'object' ? value.id : value;
const hasControl = value => [...value].some(character => character.codePointAt(0) < 32 || character.codePointAt(0) === 127);
const validId = value => typeof value === 'string' && value.length > 0 && value.length <= 255 && !/\s/u.test(value) && !hasControl(value);
const date = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT/u.test(value) && Number.isFinite(Date.parse(value));
export function normalizeReference(value) {
  if (value == null) return null;
  if (typeof value !== 'string') return undefined;
  const result = value.trim();
  return result === '' ? null : result.length <= 255 && !hasControl(result) ? result : undefined;
}
export function normalizeZip(value) {
  if (value == null) return null;
  if (typeof value !== 'string') return undefined; // Numeric ZIPs can lose leading zeroes.
  const result = value.trim();
  if (!result) return null;
  if (/^\d{9}$/u.test(result)) return `${result.slice(0, 5)}-${result.slice(5)}`;
  return /^\d{5}(-\d{4})?$/u.test(result) ? result : undefined;
}
const labelsValid = values => Array.isArray(values) && values.length > 0 && values.every(value => typeof value === 'string' && /^[a-z0-9][a-z0-9_.:/-]{0,119}$/iu.test(value));
const same = (a, b) => digest(a) === digest(b);
const own = (value, field) => Object.hasOwn(value, field);
const select = (value, fields) => Object.fromEntries(fields.filter(field => own(value, field)).map(field => [field, value[field]]));
function mappingInput(row) {
  requireSafe(row && typeof row === 'object' && !Array.isArray(row), 'invalid_mapping_row');
  const result = select(row, ['project_id', 'job_id', 'zip', 'service_area_id', 'neighborhood_id', 'owner_match_verified', 'authenticated_job_verified', 'zip_verified', 'service_area_verified', 'neighborhood_verified', 'evidence_labels', 'verified_at']);
  if (row.geography_correction != null) result.geography_correction = select(row.geography_correction, ['fields', 'independently_verified', 'evidence_labels', 'verified_at']);
  return structuredClone(result);
}
export function projectState(row, schemaReady = true) {
  requireSafe(row && typeof row === 'object', 'invalid_project');
  if (schemaReady) requireSafe(FIELDS.every(field => own(row, field)), 'project_schema_projection_missing');
  requireSafe(own(row, 'date_updated') && (row.date_updated == null || date(row.date_updated)), 'project_modification_state_missing');
  return { id: id(row.id), client: id(row.client), date_updated: row.date_updated ?? null,
    job_id: row.job_id ?? null, zip: row.zip ?? null, service_area: id(row.service_area) ?? null, neighborhood: id(row.neighborhood) ?? null };
}
const projection = row => Object.fromEntries(FIELDS.map(field => [field, row[field]]));
function inventoryInput(value) {
  requireSafe(value?.version === VERSION && value.client?.slug === CLIENT && validId(value.client.id), 'invalid_inventory_tenant_or_version');
  requireSafe(/^[a-f0-9]{64}$/u.test(value.endpointHash ?? '') && date(value.asOf), 'invalid_inventory_proof');
  requireSafe(['schemaReady', 'privacyVerified', 'inventoryComplete'].every(key => typeof value[key] === 'boolean'), 'inventory_gates_missing');
  requireSafe(['projects', 'areas', 'neighborhoods'].every(key => Array.isArray(value[key])), 'inventory_collections_missing');
  return { version: VERSION, client: { id: value.client.id, slug: CLIENT }, endpointHash: value.endpointHash,
    schemaReady: value.schemaReady, privacyVerified: value.privacyVerified, inventoryComplete: value.inventoryComplete, asOf: value.asOf,
    projects: value.projects.map(row => projectState(row, value.schemaReady)),
    areas: value.areas.map(row => ({ id: id(row.id), client: id(row.client) })),
    neighborhoods: value.neighborhoods.map(row => ({ id: id(row.id), client: id(row.client), service_area: id(row.service_area) })) };
}
const duplicates = values => new Set(values.filter((value, index) => values.indexOf(value) !== index));

export function planEnrichment(inventory, mappings, { createdAt = new Date().toISOString() } = {}) {
  requireSafe(Array.isArray(mappings) && date(createdAt), 'invalid_plan_input');
  const target = inventoryInput(inventory), source = mappings.map(mappingInput);
  const blockers = [], outcomes = [], sources = [], operations = [];
  if (!target.schemaReady) blockers.push('schema_not_ready');
  if (!target.privacyVerified) blockers.push('privacy_not_verified');
  if (!target.inventoryComplete) blockers.push('inventory_incomplete');
  if (!target.projects.length) blockers.push('empty_project_inventory');
  const duplicateTargets = duplicates(target.projects.map(row => row.id));
  const duplicateSources = duplicates(source.map(row => row.project_id));
  const duplicateJobs = duplicates(source.map(row => normalizeReference(row.job_id)).filter(Boolean));
  const targetJobs = target.projects.map(row => normalizeReference(row.job_id)).filter(Boolean);
  const duplicateTargetJobs = duplicates(targetJobs);
  const areas = new Map(target.areas.map(row => [row.id, row]));
  const neighborhoods = new Map(target.neighborhoods.map(row => [row.id, row]));
  if (areas.size !== target.areas.length || neighborhoods.size !== target.neighborhoods.length) blockers.push('duplicate_geography_identity');
  if ([...target.areas, ...target.neighborhoods].some(row => !validId(row.id) || row.client !== target.client.id)) blockers.push('invalid_geography_tenant');
  if (target.neighborhoods.some(row => !areas.has(row.service_area))) blockers.push('invalid_neighborhood_area');
  const projectIds = new Set(target.projects.map(row => row.id));
  for (const [index, row] of source.entries()) {
    const reasons = [];
    if (!validId(row.project_id)) reasons.push('missing_project_identity');
    else if (!projectIds.has(row.project_id)) reasons.push('unknown_project');
    if (duplicateSources.has(row.project_id)) reasons.push('duplicate_project_mapping');
    sources.push({ index, project_id: row.project_id ?? null, disposition: reasons.length ? 'conflict' : 'accounted', reasons });
  }
  for (const [index, current] of target.projects.entries()) {
    const reasons = [], rows = source.filter(row => row.project_id === current.id);
    const row = rows[0];
    if (!validId(current.id)) reasons.push('missing_target_identity');
    if (duplicateTargets.has(current.id)) reasons.push('duplicate_target_identity');
    if (current.client !== target.client.id) reasons.push('cross_client_project');
    if (!validId(current.service_area) || !areas.has(current.service_area)) reasons.push('primary_area_missing_or_unknown');
    if (!rows.length) reasons.push('missing_mapping');
    if (rows.length > 1) reasons.push('duplicate_project_mapping');
    const existingJob = normalizeReference(current.job_id);
    if (existingJob === undefined || duplicateTargetJobs.has(existingJob)) reasons.push('invalid_or_duplicate_existing_job');
    const desired = { ...projection(current) };
    if (row) {
      const job = normalizeReference(row.job_id), zip = normalizeZip(row.zip);
      if (!job) reasons.push('missing_or_invalid_job');
      if (!zip) reasons.push('missing_or_invalid_zip');
      if (duplicateJobs.has(job)) reasons.push('duplicate_job_mapping');
      if (['owner_match_verified', 'authenticated_job_verified', 'zip_verified', 'service_area_verified'].some(field => row[field] !== true)) reasons.push('unverified_required_fields');
      if (!labelsValid(row.evidence_labels) || !date(row.verified_at)) reasons.push('verification_evidence_missing');
      if (!validId(row.service_area_id) || !areas.has(row.service_area_id)) reasons.push('unknown_service_area');
      if (existingJob && existingJob !== job) reasons.push('existing_job_conflict');
      if (job && target.projects.some(other => other.id !== current.id && normalizeReference(other.job_id) === job)) reasons.push('job_owned_by_other_project');
      desired.job_id = job ?? null;
      desired.zip = zip ?? null;
      desired.service_area = row.service_area_id ?? null;
      const suppliedNeighborhood = own(row, 'neighborhood_id') && row.neighborhood_id != null && row.neighborhood_id !== '';
      if (suppliedNeighborhood) {
        if (row.neighborhood_verified !== true) reasons.push('unverified_neighborhood');
        if (!validId(row.neighborhood_id) || !neighborhoods.has(row.neighborhood_id)) reasons.push('unknown_neighborhood');
        desired.neighborhood = row.neighborhood_id;
      }
      // Omitted assignment preserves an existing neighborhood. ZIP never determines it.
      if (desired.neighborhood != null && (!neighborhoods.has(desired.neighborhood) || neighborhoods.get(desired.neighborhood).service_area !== desired.service_area)) reasons.push('neighborhood_area_mismatch');
      for (const field of ['zip', 'service_area', 'neighborhood']) {
        const before = field === 'zip' ? normalizeZip(current.zip) : current[field];
        if (before === undefined) reasons.push('invalid_existing_zip');
        if (before != null && before !== desired[field]) {
          const correction = row.geography_correction;
          if (!(correction?.independently_verified === true && Array.isArray(correction.fields) && correction.fields.includes(field)
            && correction.fields.every(name => ['zip', 'service_area', 'neighborhood'].includes(name))
            && labelsValid(correction.evidence_labels) && date(correction.verified_at))) reasons.push(`existing_${field}_conflict`);
        }
      }
    }
    const uniqueReasons = [...new Set(reasons)];
    const disposition = uniqueReasons.length ? (uniqueReasons.every(reason => ['missing_mapping', 'missing_or_invalid_job', 'missing_or_invalid_zip', 'unverified_required_fields', 'verification_evidence_missing', 'unverified_neighborhood'].includes(reason)) ? 'held' : 'conflict')
      : same(projection(current), desired) ? 'match' : 'update';
    outcomes.push({ index, project_id: current.id ?? null, disposition, reasons: uniqueReasons });
    if (disposition === 'update') operations.push({ project_id: current.id, before: projection(current), after: desired, expectedDateUpdated: current.date_updated });
  }
  const counts = { projects: outcomes.length, mappings: sources.length, updates: operations.length,
    matches: outcomes.filter(row => row.disposition === 'match').length, held: outcomes.filter(row => row.disposition === 'held').length,
    conflicts: outcomes.filter(row => row.disposition === 'conflict').length, sourceConflicts: sources.filter(row => row.disposition === 'conflict').length };
  const eligible = counts.projects > 0 && counts.held + counts.conflicts + counts.sourceConflicts === 0;
  const plan = { version: VERSION, createdAt, input: { inventory: target, mappings: source }, endpointHash: target.endpointHash,
    client: target.client, outcomes, sources, operations, blockers, counts, complete: eligible,
    readyForApply: eligible && blockers.length === 0, requiredConstraintMayRun: false };
  return { ...plan, planHash: digest(plan) };
}
export function verifyPlan(plan, expectedHash) {
  requireSafe(plan?.version === VERSION && /^[a-f0-9]{64}$/u.test(expectedHash ?? ''), 'invalid_plan_version_or_hash');
  const { planHash, ...content } = plan;
  requireSafe(planHash === expectedHash && digest(content) === expectedHash, 'plan_hash_mismatch');
  const rebuilt = planEnrichment(plan.input.inventory, plan.input.mappings, { createdAt: plan.createdAt });
  requireSafe(rebuilt.planHash === expectedHash, 'plan_contract_mismatch');
  return plan;
}
export function publicSummary(plan) {
  return { version: VERSION, planHash: plan.planHash, createdAt: plan.createdAt, ...plan.counts,
    complete: plan.complete, readyForApply: plan.readyForApply, blockers: [...plan.blockers], requiredConstraintMayRun: false };
}
export function validateApproval(plan, approval, endpointHash) {
  verifyPlan(plan, approval?.planHash);
  requireSafe(plan.readyForApply, 'incomplete_or_unready_plan');
  requireSafe(approval.endpointHash === plan.endpointHash && endpointHash === plan.endpointHash, 'endpoint_mismatch');
  requireSafe(['productionApplyAuthorized', 'exclusiveWriter', 'editorialChangesPaused', 'schemaPermissionsVerified', 'recoveryLocationApproved'].every(key => approval[key] === true), 'exact_apply_authorization_missing');
}
/** Directus REST has no atomic compare-and-swap; an exclusive edit window is required. */
export async function applyEnrichmentPlan({ plan, approval, api, receipt }) {
  validateApproval(plan, approval, api.endpointHash);
  requireSafe(typeof receipt === 'function', 'durable_private_recovery_required');
  const fresh = await api.inventory();
  const replan = planEnrichment(fresh, plan.input.mappings, { createdAt: plan.createdAt });
  requireSafe(replan.readyForApply, 'fresh_inventory_not_ready');
  requireSafe(fresh.endpointHash === plan.endpointHash && fresh.client.id === plan.client.id, 'fresh_inventory_target_changed');
  requireSafe(same(fresh.projects.map(row => row.id).sort(), plan.input.inventory.projects.map(row => row.id).sort()), 'project_inventory_changed');
  const expected = new Map(plan.input.inventory.projects.map(row => [row.id, row]));
  const ops = new Map(plan.operations.map(row => [row.project_id, row]));
  const assertCurrent = raw => {
    const current = projectState(raw);
    requireSafe(current.client === plan.client.id && expected.has(current.id), 'project_identity_or_tenant_changed');
    const original = expected.get(current.id), op = ops.get(current.id);
    if (same(projection(current), op?.after ?? projection(original))) return { current, matched: true };
    requireSafe(op && current.date_updated === op.expectedDateUpdated && same(projection(current), op.before), 'later_editorial_change');
    return { current, matched: false };
  };
  // Preflight the entire set before any writes, including projects already matched.
  for (const row of fresh.projects) assertCurrent(row);
  const results = [];
  for (const [index, op] of plan.operations.entries()) {
    const found = assertCurrent(await api.getProject(op.project_id));
    requireSafe(found.current.id === op.project_id, 'read_identity_mismatch');
    if (found.matched) {
      await receipt(index, 'match', { version: VERSION, planHash: plan.planHash, project_id: op.project_id,
        after: projection(found.current), date_updated: found.current.date_updated, afterHash: digest(projection(found.current)) });
      results.push({ index, disposition: 'match' }); continue;
    }
    await receipt(index, 'before', { version: VERSION, planHash: plan.planHash, project_id: op.project_id, client: plan.client.id,
      before: op.before, proposedAfter: op.after, date_updated: found.current.date_updated });
    const immediate = assertCurrent(await api.getProject(op.project_id));
    requireSafe(immediate.current.id === op.project_id && !immediate.matched, 'target_changed_before_patch');
    await api.updateProject(op.project_id, op.after);
    const after = projectState(await api.getProject(op.project_id));
    requireSafe(after.id === op.project_id && after.client === plan.client.id && same(projection(after), op.after), 'written_field_readback_failed');
    await receipt(index, 'after', { version: VERSION, planHash: plan.planHash, project_id: op.project_id, client: plan.client.id,
      after: projection(after), date_updated: after.date_updated, afterHash: digest(projection(after)) });
    results.push({ index, disposition: 'applied' });
  }
  const final = planEnrichment(await api.inventory(), plan.input.mappings);
  requireSafe(final.readyForApply && final.counts.updates === 0 && final.client.id === plan.client.id && final.endpointHash === plan.endpointHash
    && same(final.input.inventory.projects.map(row => row.id).sort(), plan.input.inventory.projects.map(row => row.id).sort()), 'full_backfill_readback_failed');
  const result = { version: VERSION, planHash: plan.planHash, applied: results.filter(row => row.disposition === 'applied').length,
    matched: plan.counts.matches + results.filter(row => row.disposition === 'match').length, verifiedProjects: final.counts.projects,
    backfillVerified: true, requiredConstraintMayRun: false };
  await receipt(plan.operations.length, 'complete', result);
  return result;
}
