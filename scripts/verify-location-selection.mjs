import assert from 'node:assert/strict';
import { selectLocationContent } from '../lib/content/location-selection.ts';

const options = { areaId: 'area-local', nearbyAreaIds: ['area-nearby'], clientSlug: 'fixture-client', kind: 'projects' };
const record = (id, overrides = {}) => ({
  id, clientSlug: 'fixture-client', status: 'published', serviceAreaIds: ['area-local'],
  date: '2026-01-01T00:00:00Z', ...overrides,
});
const nearby = (id, overrides = {}) => record(id, { serviceAreaIds: ['area-nearby'], ...overrides });
const ids = (groups) => ({ local: groups.local.map((item) => item.id), nearby: groups.nearby.map((item) => item.id) });
let checks = 0;
function check(name, callback) {
  try { callback(); checks++; } catch (error) { error.message = `${name}: ${error.message}`; throw error; }
}

for (const kind of ['projects', 'reviews', 'sponsors']) {
  check(`${kind}: empty pool`, () => assert.deepEqual(selectLocationContent([], { ...options, kind }), { local: [], nearby: [] }));
}
check('thin pool preserves local priority over a newer nearby record', () => {
  const pool = [nearby('new-nearby', { date: '2026-03-01' }), record('old-local', { date: '2025-01-01' })];
  assert.deepEqual(ids(selectLocationContent(pool, options)), { local: ['old-local'], nearby: ['new-nearby'] });
});
check('full local pool uses no nearby items', () => {
  const pool = [nearby('new-nearby', { date: '2027-01-01' }), ...Array.from({ length: 6 }, (_, i) => record(`local-${i}`))];
  assert.deepEqual(ids(selectLocationContent(pool, options)), { local: Array.from({ length: 6 }, (_, i) => `local-${i}`), nearby: [] });
});
check('over-limit local pool sorts by date and caps at six', () => {
  const pool = Array.from({ length: 9 }, (_, i) => record(`local-${i}`, { date: `2026-01-0${i + 1}` }));
  assert.deepEqual(ids(selectLocationContent(pool, options)), { local: ['local-8', 'local-7', 'local-6', 'local-5', 'local-4', 'local-3'], nearby: [] });
});
check('nearby fills only remaining capacity', () => {
  const pool = [record('local'), ...Array.from({ length: 9 }, (_, i) => nearby(`nearby-${i}`))];
  assert.deepEqual(ids(selectLocationContent(pool, options)), { local: ['local'], nearby: ['nearby-0', 'nearby-1', 'nearby-2', 'nearby-3', 'nearby-4'] });
});
check('dated records precede missing/invalid dates and ties use canonical ID', () => {
  const pool = [record('z', { date: null }), record('b'), record('a'), record('c', { date: 'invalid' }), record('d', { date: '' })];
  assert.deepEqual(ids(selectLocationContent(pool, options)).local, ['a', 'b', 'c', 'd', 'z']);
  assert.deepEqual(ids(selectLocationContent(pool.toReversed(), options)).local, ['a', 'b', 'c', 'd', 'z']);
});
check('unassigned, cross-client, unpublished and unrelated records never backfill', () => {
  const pool = [record('valid'), nearby('other-client', { clientSlug: 'other' }), nearby('draft', { status: 'draft' }),
    nearby('archived', { status: 'archived' }), nearby('unassigned', { serviceAreaIds: [] }),
    nearby('unapproved', { serviceAreaIds: ['area-unapproved'] }), record('', {}), nearby('indirect', { serviceAreaIds: ['area-two-hops-away'] })];
  assert.deepEqual(ids(selectLocationContent(pool, options)), { local: ['valid'], nearby: [] });
});
check('no approved adjacency means no regional selection', () => {
  assert.deepEqual(ids(selectLocationContent([record('local'), nearby('nearby')], { ...options, nearbyAreaIds: [] })), { local: ['local'], nearby: [] });
});
check('taxonomy-only approved neighbor can supply content without a route', () => {
  assert.deepEqual(ids(selectLocationContent([nearby('neighbor', { areaPageStatus: 'taxonomy_only', areaHref: null })], options)), { local: [], nearby: ['neighbor'] });
});
check('reviews use actual five stars and editorial publication without Google identity/feed requirements', () => {
  const pool = [record('imported', { rating: 5, externalId: null, latestFeedMember: false }),
    nearby('nearby-review', { rating: 5 }), record('four', { rating: 4 }), record('unknown-rating'),
    record('string-rating', { rating: '5' }), record('unpublished', { rating: 5, status: 'draft', latestFeedMember: true })];
  assert.deepEqual(ids(selectLocationContent(pool, { ...options, kind: 'reviews' })), { local: ['imported'], nearby: ['nearby-review'] });
});
check('review rollover preserves the approved older local review', () => {
  const before = record('old-local-review', { rating: 5, latestFeedMember: true });
  const after = { ...before, latestFeedMember: false, latestFeedOrder: null };
  assert.deepEqual(ids(selectLocationContent([before], { ...options, kind: 'reviews' })), ids(selectLocationContent([after], { ...options, kind: 'reviews' })));
});
check('reviews cap at six by review date', () => {
  const pool = Array.from({ length: 8 }, (_, i) => record(`review-${i}`, { rating: 5, date: `2026-02-0${i + 1}` }));
  assert.deepEqual(ids(selectLocationContent(pool, { ...options, kind: 'reviews' })).local, ['review-7', 'review-6', 'review-5', 'review-4', 'review-3', 'review-2']);
});
check('sponsors retain all local records in CMS order, even above three', () => {
  const pool = [nearby('nearby', { sort: -1 }), ...Array.from({ length: 5 }, (_, i) => record(`sponsor-${i}`, { sort: 4 - i }))];
  assert.deepEqual(ids(selectLocationContent(pool, { ...options, kind: 'sponsors' })), { local: ['sponsor-4', 'sponsor-3', 'sponsor-2', 'sponsor-1', 'sponsor-0'], nearby: [] });
});
check('duplicate sponsor relations prefer local and cannot consume capacity twice', () => {
  const pool = [nearby('both', { sort: 0 }), record('both', { sort: 0, serviceAreaIds: ['area-nearby', 'area-local'] }),
    nearby('regional-b', { sort: 1 }), nearby('regional-a', { sort: 1 }), nearby('regional-a', { sort: 1 }), nearby('regional-c', { sort: 2 })];
  assert.deepEqual(ids(selectLocationContent(pool, { ...options, kind: 'sponsors' })), { local: ['both'], nearby: ['regional-a', 'regional-b'] });
});
check('sponsor shortages show fewer without unassigned fallback', () => {
  const pool = [record('local', { sort: 1 }), nearby('unassigned', { serviceAreaIds: [], sort: 0 })];
  assert.deepEqual(ids(selectLocationContent(pool, { ...options, kind: 'sponsors' })), { local: ['local'], nearby: [] });
});
check('input arrays and records remain unchanged', () => {
  const pool = Object.freeze([Object.freeze(nearby('nearby')), Object.freeze(record('local'))]);
  selectLocationContent(pool, options);
  assert.deepEqual(pool.map((item) => item.id), ['nearby', 'local']);
});
process.stdout.write(`${checks} location selection fixtures passed.\n`);
