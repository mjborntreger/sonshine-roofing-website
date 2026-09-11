import assert from 'node:assert/strict';
import { prepareVideoMigration, migrateVideos, readAll } from './migrate-wordpress-videos.mjs';

const clone = value => structuredClone(value);
const originalDate = '2024-06-01T09:00:00.000Z';
const fixture = () => ({
  version: 1, client: { id: 'client-one', slug: 'sonshine-roofing' }, expectedCounts: { wordpress: 2, projects: 1 },
  wordpress: [
    { databaseId: 1, id: 'dmlkZW8x', slug: 'legacy-📸', title: 'Roof explainer', dateGmt: '2024-05-01T09:00:00', modifiedGmt: originalDate,
      videoLibraryMetadata: { youtubeUrl: 'https://youtu.be/abcdefghijk', description: 'Verified plain text.' }, videoCategories: { nodes: [{ slug: 'explainers' }, { slug: 'in-the-field' }] } },
    { databaseId: 2, id: 'dmlkZW8y', slug: 'commercial', title: 'Commercial', dateGmt: '2024-05-02T09:00:00', modifiedGmt: originalDate,
      videoLibraryMetadata: { youtubeUrl: 'https://www.youtube.com/watch?v=ABCDEFGHIJK', description: 'Second description.' }, videoCategories: { nodes: [{ slug: 'commercials' }] } },
  ],
  projects: [{ id: 'project-one', client: 'client-one', status: 'published', slug: 'example-project', title: 'Example project', description: 'Project description.',
    youtube_url: 'https://www.youtube.com/shorts/01234567890', published_at: '2024-05-03T09:00:00.000Z', date_updated: originalDate }],
});

function fakeApi(source) {
  const data = { clients: [clone(source.client)], roofing_projects: clone(source.projects), videos: [], video_categories: [], video_category_assignments: [] };
  const writes = [];
  let failure;
  const request = async (route, method = 'GET', payload, query = {}) => {
    const [collection, id] = route.split('/');
    if (method === 'GET') {
      const list = data[collection];
      const limit = Number(query.limit || 100);
      return clone(list.slice((Number(query.page || 1) - 1) * limit, Number(query.page || 1) * limit));
    }
    if (failure?.(route, method, payload)) throw new Error('Simulated connection interruption.');
    writes.push({ route, method, payload: clone(payload) });
    if (method === 'POST') {
      assert.ok(!data[collection].some(row => row.id === payload.id), 'Duplicate create attempted.');
      const row = clone(payload);
      if (collection === 'videos') {
        row.youtube_id = new URL(row.youtube_url).searchParams.get('v');
        row.date_updated = row.source_updated_at;
      }
      if (row.slug) row.scope_key = `${source.client.slug}:${row.slug}`;
      data[collection].push(row);
      return clone(row);
    }
    assert.equal(method, 'PATCH');
    const row = data[collection].find(row => row.id === id);
    assert.ok(row);
    Object.assign(row, clone(payload));
    return clone(row);
  };
  return { data, writes, request, failWhen: predicate => { failure = predicate; } };
}

const source = fixture();
const plan = prepareVideoMigration(source);
assert.equal(plan.videos.length, 3);
assert.equal(plan.assignments.length, 3);
assert.equal(plan.videos[0].slug, 'legacy-📸');
assert.deepEqual(plan.videos[2].legacy_ids, ['project-example-project']);
assert.equal(plan.videos[0].youtube_url, 'https://www.youtube.com/watch?v=abcdefghijk');
assert.equal(plan.videos[0].published_at, '2024-05-01T09:00:00.000Z');
assert.equal(plan.videos[2].source_updated_at, originalDate);
const api = fakeApi(source);
let checkpoint = {};
const saveCheckpoint = async value => { checkpoint = clone(value); };
const dry = await migrateVideos(plan, api.request);
assert.deepEqual(dry.create, { categories: 3, videos: 3, assignments: 3 });
assert.equal(api.writes.length, 0, 'Dry-run must not mutate.');
await assert.rejects(migrateVideos(plan, api.request, { mode: 'verify-only' }), /Complete content/u);
await assert.rejects(migrateVideos(plan, api.request, { mode: 'apply', publish: true }), /Complete content/u);

let interrupted = false;
api.failWhen(route => {
  if (!interrupted && route === 'video_category_assignments') { interrupted = true; return true; }
  return false;
});
await assert.rejects(migrateVideos(plan, api.request, { mode: 'apply', checkpoint, saveCheckpoint }), /interruption/u);
assert.equal(api.data.videos.length, 1, 'Interruption happens after one successful video create.');
api.failWhen(undefined);
await migrateVideos(plan, api.request, { mode: 'apply', checkpoint, saveCheckpoint });
assert.equal(api.data.videos.length, 3);
assert.equal(api.data.video_category_assignments.length, 3);
const firstWrites = api.writes.length;
await migrateVideos(plan, api.request, { mode: 'apply', checkpoint, saveCheckpoint });
assert.equal(api.writes.length, firstWrites, 'Repeated import creates and updates nothing.');
assert.ok(api.data.videos.every(row => row.status === 'draft' && row.date_updated === originalDate));

const preserved = clone(api.data);
api.data.videos[0].title = 'New editorial copy';
await assert.rejects(migrateVideos(plan, api.request, { mode: 'apply', checkpoint, saveCheckpoint }), /editorial edits/u);
assert.equal(api.writes.length, firstWrites, 'Conflict is detected before any write.');
Object.assign(api.data, clone(preserved));
api.data.videos[0].date_updated = '2026-09-11T10:00:00.000Z';
await assert.rejects(migrateVideos(plan, api.request, { mode: 'apply', checkpoint }), /edited/u);
Object.assign(api.data, clone(preserved));
api.data.video_category_assignments.pop();
await assert.rejects(migrateVideos(plan, api.request, { mode: 'apply', checkpoint }), /categories were removed/u);
Object.assign(api.data, clone(preserved));
api.data.roofing_projects[0].description = 'Changed at source';
await assert.rejects(migrateVideos(plan, api.request, { mode: 'apply', checkpoint }), /description changed/u);
Object.assign(api.data, clone(preserved));
const changedSource = fixture(); changedSource.wordpress[0].title = 'Source changed';
await assert.rejects(migrateVideos(prepareVideoMigration(changedSource), api.request, { mode: 'apply', checkpoint }), /Source changed/u);

await migrateVideos(plan, api.request, { mode: 'apply', publish: true, checkpoint, saveCheckpoint });
assert.ok(api.data.videos.every(row => row.status === 'published' && row.date_updated === originalDate));
const publishedWrites = api.writes.length;
await migrateVideos(plan, api.request, { mode: 'apply', publish: true, checkpoint, saveCheckpoint });
assert.equal(api.writes.length, publishedWrites, 'Repeated publication changes nothing.');
await migrateVideos(plan, api.request, { mode: 'verify-only', publish: true, checkpoint });

for (const mutation of [
  source => { source.wordpress[1].videoLibraryMetadata.youtubeUrl = source.wordpress[0].videoLibraryMetadata.youtubeUrl; },
  source => { source.wordpress[0].videoLibraryMetadata.youtubeUrl = 'https://youtube.com.attacker.invalid/watch?v=abcdefghijk'; },
  source => { source.wordpress[0].videoCategories.nodes = [{ slug: 'roofing-project' }]; },
  source => { source.wordpress[0].slug = '../bad'; },
  source => { source.wordpress[0].dateGmt = 'unknown'; },
  source => { source.projects[0].client = 'other-client'; },
  source => { source.wordpress[0].id = source.wordpress[1].slug; },
]) {
  const invalid = fixture(); mutation(invalid);
  assert.throws(() => prepareVideoMigration(invalid));
}

const many = Array.from({ length: 251 }, (_, index) => ({ id: String(index) }));
let pageReads = 0;
const paged = await readAll(async (_collection, _method, _payload, query) => {
  pageReads += 1;
  return many.slice((query.page - 1) * query.limit, query.page * query.limit);
}, 'videos', ['id'], {});
assert.equal(paged.length, 251);
assert.equal(pageReads, 3);
await assert.rejects(readAll(async () => many.slice(0, 100), 'videos', ['id'], {}), /Repeated source page/u);
console.log('Video migration verification passed: source parity, legacy aliases, >200 pagination, resume, no-op replay, publication, and conflict preservation.');
