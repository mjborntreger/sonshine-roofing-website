import assert from 'node:assert/strict';
import { planMigration, hash, reviewKey, neighborhoodKey, sourceKey, sourceTime, reviewDate, SLUGS, DRAFT_NEIGHBORS } from './location-migration/core.mjs';
import { readAll, executePlan } from './location-migration/api.mjs';
import { inventoryWordPress } from './location-migration/inventory.mjs';

let checks = 0;
async function test(name, fn) { await fn(); checks++; console.log(`PASS ${name}`); }
function fixture() {
  const source = { complete: true, nodes: SLUGS.map((slug, i) => ({ databaseId: i + 10, slug,
    modifiedGmt: '2025-01-02T10:00:00', locationAttributes: { locationName: slug,
      map: null, neighborhoodsServed: [{ neighborhood: `District ${i}`, neighborhoodDescription: '<p>Unverified long claims</p>', zipCodes: [{ zipCode: '00000' }] }],
      featuredReviews: [] } })) };
  const targets = { schemaReady: true, clientSlug: 'sonshine-roofing', clientId: 'synthetic-client', endpointHash: 'synthetic-endpoint', collections: {
    roofing_service_areas: SLUGS.map(slug => ({ id: `area-${slug}`, client: 'synthetic-client', slug, name: slug, status: 'published', page_status: 'taxonomy_only', date_updated: '2025-01-01T00:00:00Z' })),
    roofing_projects: [{ id: 'synthetic-project', client: 'synthetic-client', service_area: 'area-sarasota' }], reviews: [],
    sponsor_features: [{ id: 'synthetic-sponsor', client: 'synthetic-client', service_area_slugs: ['sarasota', 'sarasota', 'venice'] }],
  } };
  return { source, targets, createdAt: '2026-09-15T00:00:00Z' };
}
function applyFakePlan(plan, targets) {
  const result = structuredClone(targets);
  for (const op of plan.operations) {
    result.collections[op.collection] ||= [];
    if (op.action === 'create') result.collections[op.collection].push({ ...op.data, id: op.data.id || `new-${result.collections[op.collection].length}`, date_updated: '2026-09-15T00:00:00Z' });
    else Object.assign(result.collections[op.collection].find(row => row.id === op.targetId), op.data, { date_updated: '2026-09-15T00:00:00Z' });
  }
  return result;
}
function fakeApi(targets) {
  let writes = 0;
  const data = structuredClone(targets.collections);
  return { endpointHash: 'synthetic-endpoint', get writes() { return writes; }, data,
    async find(op) { return (data[op.collection] || []).filter(row => Object.entries(op.identity).every(([key, value]) => key === 'provenanceKey' ? row.wordpress_provenance?.some(p => p.key === value) : row[key] === value)); },
    async create(op) { writes++; data[op.collection] ||= []; const row = { ...op.data, id: op.data.id || `review-${writes}`, date_updated: '2026-09-15T00:00:00Z' }; data[op.collection].push(row); return row; },
    async update(op) { writes++; const row = data[op.collection].find(row => row.id === op.targetId); Object.assign(row, op.data, { date_updated: '2026-09-15T00:00:00Z' }); return row; },
  };
}
const authorization = plan => ({ planHash: plan.planHash, endpointHash: 'synthetic-endpoint', productionApplyAuthorized: true,
  exclusiveMigrationWriter: true, editorialChangesPaused: true, schemaPermissionsVerified: true, recoveryLocationApproved: true, feedRetentionCutoverReady: true });

await test('all source rows have dispositions; source reorder preserves stable neighborhood identities', () => {
  const f = fixture(), a = planMigration(f);
  f.source.nodes.reverse(); f.source.nodes[0].locationAttributes.neighborhoodsServed.reverse();
  const b = planMigration(f);
  assert.equal(a.summary.pages.total, 5); assert.equal(a.summary.neighborhoods.total, 5);
  assert.deepEqual(a.entries.filter(x => x.kind === 'neighborhoods').map(x => x.key).sort(), b.entries.filter(x => x.kind === 'neighborhoods').map(x => x.key).sort());
  assert.equal(a.summary.relationships.create, 2); // duplicate sponsor pair is accounted, not recreated
});
await test('second run creates no records or relationships and preserves editorial publication', () => {
  const f = fixture(), first = planMigration(f), migrated = applyFakePlan(first, f.targets);
  migrated.collections.roofing_neighborhoods[0].status = 'published';
  migrated.collections.roofing_service_areas[0].page_status = 'published';
  const second = planMigration({ ...f, targets: migrated });
  assert.equal(second.operations.length, 0);
  assert.equal(second.summary.neighborhoods.match, 5);
});
await test('later editorial changes produce conflicts instead of overwrites', () => {
  const f = fixture(), first = planMigration(f), targets = applyFakePlan(first, f.targets);
  targets.collections.roofing_neighborhoods[0].description = 'An editor supplied verified detail.';
  const next = planMigration({ ...f, targets });
  assert.equal(next.summary.neighborhoods.conflict, 1);
  assert.ok(!next.operations.some(op => op.targetId === targets.collections.roofing_neighborhoods[0].id));
});
await test('renamed repeater rows cannot silently create duplicate canonical neighborhoods', () => {
  const f = fixture(), first = planMigration(f), targets = applyFakePlan(first, f.targets);
  f.source.nodes[0].locationAttributes.neighborhoodsServed[0].neighborhood = 'Renamed District';
  const plan = planMigration({ ...f, targets });
  assert.equal(plan.summary.neighborhoods.conflict, 1);
  assert.equal(plan.summary.neighborhoods.create, 0);
});
await test('unverified reviews remain held; missing date stays null and replies/source URLs survive', () => {
  const f = fixture(), p = f.source.nodes[0], review = { reviewAuthor: 'Synthetic Reviewer', review: '<p>Verified sample text.</p>', ownerReply: 'Synthetic retained reply.', reviewUrl: 'https://example.test/review/1', reviewDate: null };
  p.locationAttributes.featuredReviews.push(review);
  assert.equal(planMigration(f).summary.reviews.held, 1);
  const approved = { reviews: { [reviewKey(p, review)]: { rating: 5, sourceVerified: true, evidence: 'synthetic verified source' } } };
  const plan = planMigration({ ...f, approvals: approved }), op = plan.operations.find(x => x.collection === 'reviews');
  assert.equal(op.data.review_date, null); assert.equal(op.data.owner_reply, review.ownerReply); assert.equal(op.data.url, review.reviewUrl);
  assert.equal(op.data.status, 'draft'); assert.equal(op.data.external_id, undefined); assert.equal(op.data.service_area, undefined);
  assert.equal(op.data.wordpress_provenance[0].key, reviewKey(p, review));
});
await test('confirmed archived review reuse appends provenance without changing owned fields', () => {
  const f = fixture(), p = f.source.nodes[0], review = { reviewAuthor: 'Synthetic Reviewer', review: 'Text', ownerReply: 'Reply', reviewUrl: 'https://example.test/review/2', reviewDate: '2024-12-01' };
  p.locationAttributes.featuredReviews.push(review);
  f.targets.collections.reviews.push({ id: 7, client: f.targets.clientId, rating: 5, status: 'archived', author_name: review.reviewAuthor, review_text: review.review, owner_reply: review.ownerReply, url: review.reviewUrl, review_date: review.reviewDate, wordpress_provenance: [], date_updated: '2025-01-01' });
  const approvals = { reviews: { [reviewKey(p, review)]: { rating: 5, sourceVerified: true, matchVerified: true, targetId: 7, evidence: 'synthetic source match' } } };
  const plan = planMigration({ ...f, approvals }), op = plan.operations.find(x => x.collection === 'reviews');
  assert.deepEqual(Object.keys(op.data), ['wordpress_provenance']); assert.equal(op.action, 'update');
});
await test('verified empty review facts and initial editorial geography may be filled, differing values are preserved', () => {
  const f = fixture(), p = f.source.nodes[0], review = { reviewAuthor: 'Synthetic Reviewer', review: 'Text', ownerReply: 'Verified reply', reviewUrl: 'https://example.test/review/3', reviewDate: '2024-12-01' };
  p.locationAttributes.featuredReviews.push(review);
  const prior = { id: 8, client: f.targets.clientId, rating: 5, status: 'archived', author_name: review.reviewAuthor, review_text: review.review, owner_reply: null, url: null, review_date: null, service_area: null, wordpress_provenance: [], date_updated: '2025-01-01' };
  f.targets.collections.reviews.push(prior);
  const approvals = { reviews: { [reviewKey(p, review)]: { rating: 5, sourceVerified: true, matchVerified: true, targetId: 8, evidence: 'synthetic source', geographyVerified: true, geographyEvidence: 'synthetic editorial approval', serviceAreaSlug: 'sarasota' } } };
  const plan = planMigration({ ...f, approvals }), op = plan.operations.find(row => row.collection === 'reviews');
  assert.equal(op.data.url, review.reviewUrl); assert.equal(op.data.owner_reply, review.ownerReply); assert.equal(op.data.review_date, review.reviewDate);
  assert.equal(op.data.service_area, 'area-sarasota'); assert.equal(op.data.status, undefined);
  prior.owner_reply = 'Newer authoritative reply';
  assert.equal(planMigration({ ...f, approvals }).summary.reviews.conflict, 1);
});
await test('Longboat duplicate maps to Sarasota and ambiguous geography stays held', () => {
  const f = fixture(), sarasota = f.source.nodes[0], bradenton = f.source.nodes[1];
  sarasota.locationAttributes.neighborhoodsServed = [{ neighborhood: 'Longboat Key' }];
  bradenton.locationAttributes.neighborhoodsServed = [{ neighborhood: 'Longboat Key' }, { neighborhood: 'Plantation' }];
  const plan = planMigration(f), key = neighborhoodKey(sarasota, { neighborhood: 'Longboat Key' });
  assert.equal(plan.operations.filter(op => op.key === key).length, 1);
  assert.equal(plan.operations.find(op => op.key === key).data.service_area, 'area-sarasota');
  assert.equal(plan.summary.neighborhoods.held, 1); assert.equal(plan.summary.neighborhoods.match, 1);
});
await test('approved direct neighbors create one pair; no approval gives held entries', () => {
  const f = fixture(), key = 'nearby:sarasota:bradenton';
  const a = planMigration(f), b = planMigration({ ...f, approvals: { neighbors: { [key]: { approved: true, evidence: 'synthetic owner approval' } } } });
  assert.equal(a.entries.find(x => x.key === key).disposition, 'held');
  assert.equal(b.operations.filter(x => x.collection === 'roofing_service_area_neighbors').length, 1);
  assert.equal(b.operations.find(x => x.key === key).data.approved, true);
  assert.equal(Object.values(DRAFT_NEIGHBORS).flat().length, 17);
});
await test('existing Parrish coverage creates taxonomy only and preserves it on rerun', () => {
  const f = fixture(); f.targets.coverageSources = [{ section: 'synthetic-section', index: 3, slug: 'parrish' }];
  const plan = planMigration(f), op = plan.operations.find(row => row.taxonomyOnly);
  assert.equal(op.data.page_status, 'taxonomy_only'); assert.equal(op.data.status, 'published'); assert.equal(op.data.wordpress_location_id, undefined);
  assert.equal(op.expectedScopeKey, 'sonshine-roofing:parrish');
  assert.ok(plan.operations.some(row => row.collection === 'service_area_section_areas' && row.data.service_area === op.data.id));
  const nextTargets = applyFakePlan(plan, f.targets);
  nextTargets.collections.roofing_service_areas.find(row => row.slug === 'parrish').scope_key = op.expectedScopeKey;
  const next = planMigration({ ...f, targets: nextTargets });
  assert.equal(next.summary.taxonomy.match, 1); assert.equal(next.operations.length, 0);
});
await test('media uses immutable byte identity, duplicate source files share one upload, photos remain separate from maps', () => {
  const f = fixture(), p = f.source.nodes[0], image = { databaseId: 901, sourceUrl: 'https://wp.sonshineroofing.com/example.webp', dateGmt: '2024-01-01T00:00:00', modifiedGmt: '2024-01-02T00:00:00' };
  p.locationAttributes.map = { node: image };
  p.locationAttributes.neighborhoodsServed[0].neighborhoodImage = { node: { ...image, databaseId: 902 } };
  const approval = { descriptionVerified: true, description: 'Synthetic satellite view.', coverageNoCustomerPins: true, localPath: '/private/tmp/sonshine-location-migration-20260915/synthetic.webp', sha256: 'a'.repeat(64) };
  const plan = planMigration({ ...f, approvals: { media: { [sourceKey('media', 901)]: approval, [sourceKey('media', 902)]: approval } } });
  assert.equal(plan.summary.media.create, 1); assert.equal(plan.summary.media.match, 1);
  assert.equal(plan.operations[0].collection, 'directus_files');
  const hood = plan.operations.find(x => x.collection === 'roofing_neighborhoods');
  assert.ok(hood.data.image); assert.equal(hood.data.coverage_map, undefined);
  assert.ok(plan.operations.find(x => x.collection === 'roofing_service_areas').data.overview_map);
});
await test('paginated Directus and WordPress inventories exhaust connections and reject repeated identities', async () => {
  const rows = await readAll(async page => page === 1 ? [{ id: 1 }, { id: 2 }] : [{ id: 3 }], 2);
  assert.equal(rows.length, 3);
  await assert.rejects(readAll(async () => [{ id: 1 }], 1), /Repeated/u);
  let reads = 0;
  const source = await inventoryWordPress(async ({ after }) => { reads++; return after ? { nodes: [{ databaseId: 2 }], pageInfo: { hasNextPage: false, endCursor: 'b' } } : { nodes: [{ databaseId: 1 }], pageInfo: { hasNextPage: true, endCursor: 'a' } }; }, 1);
  assert.equal(source.nodes.length, 2); assert.equal(reads, 2); assert.equal(source.complete, true);
});
await test('executor requires exact artifact authorization and stops before later editorial changes', async () => {
  const f = fixture(), plan = planMigration(f), api = fakeApi(f.targets), receipts = [];
  await assert.rejects(executePlan({ plan, expectedHash: 'wrong', api, receipt: async () => {}, approval: authorization(plan) }), /hash/u);
  api.data.roofing_service_areas[0].date_updated = 'later';
  await assert.rejects(executePlan({ plan, expectedHash: plan.planHash, api, receipt: async (...args) => receipts.push(args), approval: authorization(plan) }), /Later target modification/u);
  assert.equal(api.writes, 0); assert.equal(receipts.length, 0);
});
await test('executor rerun is idempotent and recovery writes precede every mutation', async () => {
  const f = fixture(), plan = planMigration(f), api = fakeApi(f.targets), receipts = [];
  const first = await executePlan({ plan, expectedHash: plan.planHash, api, receipt: async (i, phase) => { if (phase === 'before') assert.equal(api.writes, i); receipts.push(phase); }, approval: authorization(plan) });
  const count = api.writes;
  const second = await executePlan({ plan, expectedHash: plan.planHash, api, receipt: async () => assert.fail('No receipt needed for matching rerun'), approval: authorization(plan) });
  assert.ok(first.every(x => x.disposition === 'applied')); assert.ok(second.every(x => x.disposition === 'match')); assert.equal(api.writes, count);
  assert.equal(receipts.filter(x => x === 'before').length, count);
});
await test('cross-client rows, changed plans, invalid dates, and unprepared schema fail closed', async () => {
  const f = fixture(); f.targets.collections.roofing_projects[0].client = 'other-client';
  assert.throws(() => planMigration(f), /Cross-client/u);
  const safe = fixture(), plan = planMigration(safe); plan.operations[0].data.job_id = 'synthetic-only';
  await assert.rejects(executePlan({ plan, expectedHash: plan.planHash, api: fakeApi(safe.targets), receipt: async () => {}, approval: authorization(plan) }), /contents changed/u);
  assert.equal(reviewDate('2025-02-30'), undefined); assert.equal(reviewDate(null), null); assert.equal(sourceTime(null), null);
  assert.equal(reviewDate('2024-12-01T00:00:00+00:00'), '2024-12-01');
  const unready = planMigration({ ...safe, targets: { ...safe.targets, schemaReady: false } });
  await assert.rejects(executePlan({ plan: unready, expectedHash: unready.planHash, api: fakeApi(safe.targets), receipt: async () => {}, approval: authorization(unready) }), /schema/u);
  assert.equal(hash({ b: 2, a: 1 }), hash({ a: 1, b: 2 }));
});
console.log(`${checks} location migration checks passed; synthetic fixtures only.`);
