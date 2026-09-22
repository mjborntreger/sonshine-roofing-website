import { createHash, randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { argsFor, readPrivate, writePrivate } from '../lib/private-artifacts.mjs';
import { prepareRecoveryDirectory } from '../location-model/permissions.mjs';
import { VERSION, CLIENT, FIELDS, requireSafe, planEnrichment, publicSummary, validateApproval, applyEnrichmentPlan } from './core.mjs';

export function endpointFingerprint(endpoint) {
  const base = new URL(endpoint);
  requireSafe(base.protocol === 'https:' && !base.username && !base.password && !base.search && !base.hash, 'invalid_https_endpoint');
  requireSafe(base.pathname === '/' || base.pathname === '', 'endpoint_must_be_cms_origin');
  return createHash('sha256').update(base.origin).digest('hex');
}

/** Construct only after authorization is checked. No AccuLynx access or automation. */
export function enrichmentApi({ endpoint, token, plan, approval, fetcher = fetch }) {
  const endpointHash = endpointFingerprint(endpoint);
  validateApproval(plan, approval, endpointHash);
  requireSafe(typeof token === 'string' && token.length > 0, 'admin_token_required');
  const base = new URL(endpoint).origin;
  async function request(resource, { method = 'GET', query = {}, data } = {}) {
    try {
      const url = new URL(resource, `${base}/`);
      for (const [key, value] of Object.entries(query)) url.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      const response = await fetcher(url, { method, redirect: 'error', signal: AbortSignal.timeout(30000),
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
      requireSafe(response.ok, 'directus_request_failed');
      const body = await response.json();
      requireSafe(!body.errors && body.data !== undefined, 'directus_response_invalid');
      return body.data;
    } catch { throw new Error('Enrichment stopped: Directus request failed. URL, body and private values suppressed.'); }
  }
  async function all(collection, fields, filter) {
    const result = [], seen = new Set();
    for (let page = 1; page <= 10000; page++) {
      const batch = await request(`items/${collection}`, { query: { fields: fields.join(','), filter, sort: 'id', limit: 100, page } });
      requireSafe(Array.isArray(batch) && batch.length <= 100, 'invalid_paginated_response');
      for (const row of batch) { requireSafe(row.id != null && !seen.has(row.id), 'duplicate_paginated_identity'); seen.add(row.id); result.push(row); }
      if (batch.length < 100) return result;
    }
    requireSafe(false, 'pagination_boundary_exceeded');
  }
  const fields = ['id', 'client', 'date_updated', ...FIELDS];
  return { endpointHash,
    async inventory() {
      const clients = await all('clients', ['id', 'slug', 'is_active'], { slug: { _eq: CLIENT }, is_active: { _eq: true } });
      requireSafe(clients.length === 1 && clients[0].id === plan.client.id, 'live_client_identity_mismatch');
      const schema = await request('fields/roofing_projects');
      requireSafe(Array.isArray(schema) && fields.every(field => schema.some(row => row.field === field)), 'live_project_schema_missing');
      requireSafe(schema.some(row => row.field === 'service_area' && row.schema?.is_nullable === false), 'primary_area_not_required');
      const filter = { client: { _eq: plan.client.id } };
      // Privacy is an independently verified release attestation, never inferred from admin access.
      return { version: VERSION, client: plan.client, endpointHash, asOf: new Date().toISOString(), schemaReady: true,
        privacyVerified: approval.schemaPermissionsVerified === true, inventoryComplete: true,
        projects: await all('roofing_projects', fields, filter), areas: await all('roofing_service_areas', ['id', 'client'], filter),
        neighborhoods: await all('roofing_neighborhoods', ['id', 'client', 'service_area'], filter) };
    },
    async getProject(projectId) {
      const rows = await all('roofing_projects', fields, { id: { _eq: projectId }, client: { _eq: plan.client.id } });
      requireSafe(rows.length === 1, 'project_read_count_mismatch');
      return rows[0];
    },
    async updateProject(projectId, data) {
      requireSafe(Object.keys(data).length === FIELDS.length && FIELDS.every(field => Object.hasOwn(data, field)), 'unexpected_write_fields');
      await request(`items/roofing_projects/${encodeURIComponent(projectId)}`, { method: 'PATCH', data });
    },
  };
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  const args = argsFor(argv), mode = args.mode ?? 'plan';
  requireSafe(['plan', 'apply'].includes(mode), 'invalid_mode');
  const allowed = mode === 'plan' ? ['mode', 'inventory', 'mappings', 'out'] : ['mode', 'plan', 'approval', 'recovery-dir'];
  requireSafe(Object.keys(args).every(key => allowed.includes(key)), 'unknown_argument');
  if (mode === 'plan') {
    requireSafe(args.inventory && args.mappings && args.out, 'private_plan_paths_required');
    const plan = planEnrichment(await readPrivate(args.inventory), await readPrivate(args.mappings));
    await writePrivate(args.out, plan);
    return publicSummary(plan);
  }
  requireSafe(args.plan && args.approval && args['recovery-dir'], 'private_apply_paths_required');
  const plan = await readPrivate(args.plan), approval = await readPrivate(args.approval);
  // Bind exact private approval before consulting the admin credential or contacting any endpoint.
  const endpointHash = endpointFingerprint(env.DIRECTUS_URL);
  validateApproval(plan, approval, endpointHash);
  const recovery = await prepareRecoveryDirectory(args['recovery-dir']);
  const directory = join(recovery, `enrichment-${Date.now()}-${randomUUID()}`);
  await mkdir(directory, { mode: 0o700 });
  const api = enrichmentApi({ endpoint: env.DIRECTUS_URL, token: env.LOCATION_DIRECTUS_ADMIN_TOKEN, plan, approval });
  // writePrivate additionally restricts output to the approved private root and fsyncs each file.
  const receipt = (index, phase, value) => writePrivate(join(directory, `${String(index).padStart(4, '0')}-${phase}.json`), value);
  await receipt(0, 'authorization', { version: VERSION, planHash: plan.planHash, endpointHash, approval });
  return applyEnrichmentPlan({ plan, approval, api, receipt });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(await main(), null, 2)); }
  catch { console.error('Enrichment stopped. No private values logged; inspect the private plan and recovery receipts.'); process.exitCode = 1; }
}
