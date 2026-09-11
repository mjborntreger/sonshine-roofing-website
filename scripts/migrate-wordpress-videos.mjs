import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, rename, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { extractYouTubeId, youtubeWatchUrl } from '../lib/content/video-utils.mjs';

export const fingerprint = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const stableVideoId = value => {
  const hash = fingerprint(`sonshine-video-migration:${value}`);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
};
const utc = value => {
  assert.ok(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/u.test(value), 'Source timestamp is missing or malformed.');
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/iu.test(value) ? value : `${value}Z`;
  assert.ok(Number.isFinite(Date.parse(normalized)), 'Source timestamp is invalid.');
  return new Date(normalized).toISOString();
};
const text = value => typeof value === 'string' ? value.trim() : '';
const identity = value => typeof value === 'object' && value ? value.id : value;
const ordinary = [
  { slug: 'commercials', name: 'Commercials', sort: 10 },
  { slug: 'explainers', name: 'Explainers', sort: 20 },
  { slug: 'in-the-field', name: 'In the Field', sort: 40 },
];
const VIDEO_FIELDS = ['id', 'client', 'status', 'slug', 'title', 'description', 'youtube_url', 'youtube_id', 'published_at', 'source_updated_at', 'external_id', 'legacy_ids', 'project'];
const READ_VIDEO_FIELDS = [...VIDEO_FIELDS, 'scope_key', 'date_updated'];

export function prepareVideoMigration(source) {
  assert.equal(source.version, 1, 'Unsupported source manifest version.');
  assert.equal(source.client?.slug, 'sonshine-roofing', 'This migration only supports SonShine.');
  assert.ok(typeof source.client.id === 'string' && source.client.id, 'Verified client ID required.');
  assert.equal(source.wordpress.length, source.expectedCounts?.wordpress, 'WordPress inventory changed.');
  assert.equal(source.projects.length, source.expectedCounts?.projects, 'Project inventory changed.');
  const categories = ordinary.map(category => ({ id: stableVideoId(`category:${source.client.slug}:${category.slug}`), client: source.client.id, status: 'published', ...category }));
  const byCategory = new Map(categories.map(category => [category.slug, category]));
  const videos = [];
  const assignments = [];
  const add = (row, external_id, project, aliases, categorySlugs) => {
    const youtube_id = extractYouTubeId(row.youtube_url);
    assert.ok(youtube_id, 'Source contains an invalid YouTube URL.');
    const slug = text(row.slug);
    assert.ok(slug && !/[\\/?#&=%\s]/u.test(slug) && [...slug].every(character => character.codePointAt(0) >= 32 && character.codePointAt(0) !== 127), 'Source contains an invalid stable slug.');
    assert.ok(text(row.title) && text(row.description), 'Source title and description are required.');
    const record = {
      id: stableVideoId(external_id), client: source.client.id, status: 'draft',
      slug, title: row.title, description: row.description,
      youtube_url: youtubeWatchUrl(youtube_id), youtube_id,
      published_at: utc(row.published_at), source_updated_at: utc(row.source_updated_at),
      external_id, legacy_ids: [...new Set(aliases.filter(Boolean))].sort(), project,
    };
    videos.push(record);
    for (const categorySlug of [...new Set(categorySlugs)]) {
      const category = byCategory.get(categorySlug);
      assert.ok(category, 'Source contains an unexpected category; reconcile it before import.');
      assignments.push({ id: stableVideoId(`assignment:${record.id}:${category.id}`), video: record.id, category: category.id });
    }
  };
  for (const row of source.wordpress) {
    assert.ok(Number.isSafeInteger(row.databaseId) && row.databaseId > 0 && text(row.id), 'WordPress source identities are required.');
    assert.notEqual(row.videoCategories?.pageInfo?.hasNextPage, true, 'Source category connection is incomplete.');
    add({ ...row, youtube_url: row.videoLibraryMetadata?.youtubeUrl, description: row.videoLibraryMetadata?.description,
      published_at: row.dateGmt, source_updated_at: row.modifiedGmt },
    `wordpress:${source.client.slug}:${row.databaseId}`, null, [row.id], (row.videoCategories?.nodes ?? []).map(category => category.slug));
  }
  for (const row of source.projects) {
    assert.ok(text(row.id), 'Project identity required.');
    if (row.client != null) assert.equal(identity(row.client), source.client.id, 'Source project belongs to another client.');
    if (row.status != null) assert.equal(row.status, 'published', 'Only baseline published project videos are in scope.');
    add({ ...row, source_updated_at: row.date_updated || row.source_updated_at || row.published_at },
      `directus:${source.client.slug}:project:${row.id}`, row.id, [`project-${row.slug}`, ...(row.legacy_ids || [])], []);
  }
  for (const key of ['slug', 'youtube_id', 'external_id', 'id']) {
    assert.equal(new Set(videos.map(row => row[key])).size, videos.length, `Source has duplicate ${key}.`);
  }
  const allKeys = videos.flatMap(row => [row.slug, ...row.legacy_ids]);
  assert.equal(new Set(allKeys).size, allKeys.length, 'Source playback aliases collide.');
  return { client: source.client, categories, videos, assignments, sourceHash: fingerprint(source) };
}

export async function readAll(request, collection, fields, filter) {
  const rows = [];
  const seen = new Set();
  let page = 1;
  const limit = 100;
  while (true) {
    const batch = await request(collection, 'GET', undefined, { fields: fields.join(','), filter, limit, page, sort: 'id' });
    assert.ok(Array.isArray(batch) && batch.length <= limit, 'Unexpected pagination response.');
    for (const row of batch) {
      assert.ok(row.id && !seen.has(row.id), 'Repeated source page or duplicate destination identity.');
      seen.add(row.id);
      rows.push(row);
    }
    if (batch.length < limit) return rows;
    page += 1;
  }
}

function sameVideo(actual, expected) {
  for (const field of VIDEO_FIELDS.filter(field => field !== 'status')) {
    const value = ['project', 'client'].includes(field) ? identity(actual[field]) : actual[field];
    if (field.endsWith('_at')) assert.equal(Date.parse(value), Date.parse(expected[field]), `Destination ${field} differs from source.`);
    else assert.ok(isDeepStrictEqual(value, expected[field]), `Destination ${field} differs from source; preserve and reconcile editorial edits.`);
  }
  assert.ok(['draft', 'published'].includes(actual.status), 'Destination video is archived or has an unexpected state.');
  assert.equal(Date.parse(actual.date_updated), Date.parse(expected.source_updated_at), 'Destination was edited or source freshness was not preserved.');
}

export async function migrateVideos(plan, request, { mode = 'dry-run', publish = false, checkpoint = {}, saveCheckpoint = async () => {} } = {}) {
  assert.ok(['dry-run', 'apply', 'verify-only'].includes(mode), 'Unsupported migration mode.');
  assert.ok(!publish || mode !== 'dry-run', 'Publication requires --apply or --verify-only.');
  if (checkpoint.sourceHash) assert.equal(checkpoint.sourceHash, plan.sourceHash, 'Source changed since checkpoint; reconcile before resuming.');
  const state = { version: 1, sourceHash: plan.sourceHash, completedVideos: [], ...checkpoint };
  const filter = { client: { _eq: plan.client.id } };
  const clients = await request('clients', 'GET', undefined, { fields: 'id,slug', filter: { id: { _eq: plan.client.id } }, limit: 2 });
  assert.equal(clients.length, 1, 'Expected one verified client.');
  assert.equal(clients[0].slug, plan.client.slug, 'Client identity changed.');
  const [categories, videos, assignments, projects] = await Promise.all([
    readAll(request, 'video_categories', ['id', 'client', 'status', 'name', 'slug', 'sort', 'scope_key'], filter),
    readAll(request, 'videos', READ_VIDEO_FIELDS, filter),
    readAll(request, 'video_category_assignments', ['id', 'video', 'category'], { video: { client: { _eq: plan.client.id } } }),
    readAll(request, 'roofing_projects', ['id', 'client', 'slug', 'title', 'description', 'youtube_url', 'published_at', 'date_updated', 'source_updated_at', 'status'], filter),
  ]);
  const expectedVideos = new Map(plan.videos.map(row => [row.id, row]));
  const expectedCategories = new Map(plan.categories.map(row => [row.id, row]));
  const expectedAssignments = new Map(plan.assignments.map(row => [row.id, row]));
  assert.ok(videos.every(row => expectedVideos.has(row.id)), 'Unexpected destination videos; reconcile before import.');
  assert.ok(categories.every(row => expectedCategories.has(row.id)), 'Unexpected destination categories; reconcile before import.');
  assert.ok(assignments.every(row => expectedAssignments.has(row.id)), 'Unexpected destination category assignments.');
  for (const actual of videos) {
    const expected = expectedVideos.get(actual.id);
    sameVideo(actual, expected);
    assert.equal(actual.scope_key, `${plan.client.slug}:${expected.slug}`, 'Video scope guard failed.');
  }
  for (const actual of categories) {
    const expected = expectedCategories.get(actual.id);
    for (const key of Object.keys(expected)) assert.ok(isDeepStrictEqual(identity(actual[key]), expected[key]), `Category ${key} changed; reconcile before import.`);
    assert.equal(actual.scope_key, `${plan.client.slug}:${expected.slug}`, 'Category scope guard failed.');
  }
  for (const actual of assignments) {
    const expected = expectedAssignments.get(actual.id);
    assert.equal(identity(actual.video), expected.video, 'Category assignment video changed.');
    assert.equal(identity(actual.category), expected.category, 'Category assignment category changed.');
  }
  for (const video of plan.videos.filter(row => row.project)) {
    const project = projects.find(row => row.id === video.project);
    assert.ok(project && identity(project.client) === plan.client.id, 'Related project is missing or has moved clients.');
    assert.equal(project.status, 'published', 'Baseline project publication changed; reconcile before import.');
    assert.equal(project.slug, video.slug, 'Baseline project slug changed.');
    assert.equal(project.title, video.title, 'Baseline project title changed.');
    assert.equal(project.description, video.description, 'Baseline project description changed.');
    assert.equal(extractYouTubeId(project.youtube_url), video.youtube_id, 'Baseline project video changed.');
    assert.equal(Date.parse(project.published_at), Date.parse(video.published_at), 'Baseline project publication date changed.');
    assert.equal(Date.parse(project.date_updated || project.source_updated_at || project.published_at), Date.parse(video.source_updated_at), 'Baseline project modified date changed.');
  }
  const categoryIds = new Set(categories.map(row => row.id));
  const videoIds = new Set(videos.map(row => row.id));
  const assignmentIds = new Set(assignments.map(row => row.id));
  for (const completed of state.completedVideos) {
    assert.ok(videoIds.has(completed), 'Checkpointed video was removed.');
    assert.ok(plan.assignments.filter(row => row.video === completed).every(row => assignmentIds.has(row.id)), 'Checkpointed categories were removed; preserve editorial edits.');
  }
  const missing = {
    categories: plan.categories.filter(row => !categoryIds.has(row.id)),
    videos: plan.videos.filter(row => !videoIds.has(row.id)),
    assignments: plan.assignments.filter(row => !assignmentIds.has(row.id)),
  };
  if (mode === 'verify-only' || publish) {
    assert.equal(missing.categories.length + missing.videos.length + missing.assignments.length, 0, 'Complete content and categories must be imported before verification/publication.');
  }
  const report = { mode, sourceHash: plan.sourceHash, total: plan.videos.length, categories: plan.categories.length, assignments: plan.assignments.length,
    create: Object.fromEntries(Object.entries(missing).map(([key, rows]) => [key, rows.length])), published: videos.filter(row => row.status === 'published').length };
  if (mode === 'verify-only') {
    if (publish) assert.ok(videos.every(row => row.status === 'published'), 'Not all videos are published.');
    return { ...report, verified: true };
  }
  if (mode === 'dry-run') return report;
  await saveCheckpoint(state);
  if (publish) {
    // Preflight above verifies every draft and relationship before the first state change.
    for (const video of videos.filter(row => row.status === 'draft')) {
      await request(`videos/${video.id}`, 'PATCH', { status: 'published' });
      state.publishedVideos = [...new Set([...(state.publishedVideos || []), video.id])];
      await saveCheckpoint(state);
    }
  } else {
    for (const category of missing.categories) await request('video_categories', 'POST', category);
    for (const video of plan.videos) {
      if (!videoIds.has(video.id)) {
        // youtube_id and scope_key are database-derived, never editor authorities.
        const payload = { ...video };
        delete payload.youtube_id;
        await request('videos', 'POST', payload);
      }
      for (const assignment of missing.assignments.filter(row => row.video === video.id)) await request('video_category_assignments', 'POST', assignment);
      state.completedVideos = [...new Set([...state.completedVideos, video.id])];
      await saveCheckpoint(state);
    }
  }
  const verified = await migrateVideos(plan, request, { mode: 'verify-only', publish, checkpoint: state });
  return { ...report, published: verified.published, verified: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const modes = ['--dry-run', '--apply', '--verify-only'].filter(mode => process.argv.includes(mode));
  assert.ok(modes.length <= 1, 'Choose one migration mode.');
  const arg = name => { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1]; };
  assert.ok(arg('--source'), 'Supply --source /private/path/video-source.json.');
  const sourcePath = await realpath(arg('--source'));
  const repository = await realpath(fileURLToPath(new URL('../', import.meta.url)));
  assert.ok(!sourcePath.startsWith(`${repository}${path.sep}`), 'Keep source exports outside the repository.');
  const checkpointPath = path.resolve(arg('--checkpoint') || `${sourcePath}.checkpoint.json`);
  const checkpointParent = await realpath(path.dirname(checkpointPath));
  assert.ok(checkpointParent !== repository && !checkpointParent.startsWith(`${repository}${path.sep}`), 'Keep checkpoints outside the repository.');
  let checkpoint = {};
  try { checkpoint = JSON.parse(await readFile(checkpointPath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const plan = prepareVideoMigration(JSON.parse(await readFile(sourcePath, 'utf8')));
  const endpoint = process.env.DIRECTUS_URL?.replace(/\/+$/u, '');
  const token = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_STATIC_TOKEN;
  assert.ok(endpoint && token, 'A task-authorized Directus URL and token are required.');
  assert.equal(process.env.DIRECTUS_CLIENT_SLUG, plan.client.slug, 'Environment client must match verified source.');
  const request = async (collection, method = 'GET', body, query = {}) => {
    const url = new URL(`items/${collection}`, `${endpoint}/`);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    const response = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const payload = await response.json();
    assert.ok(response.ok && !payload.errors, `${method} ${collection.split('/')[0]}: HTTP ${response.status}; operation failed. Private payload omitted.`);
    return payload.data;
  };
  const saveCheckpoint = async state => {
    const temporary = `${checkpointPath}.${process.pid}.tmp`;
    await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
    await rename(temporary, checkpointPath);
  };
  console.log(JSON.stringify(await migrateVideos(plan, request, { mode: modes[0]?.slice(2) || 'dry-run', publish: process.argv.includes('--publish'), checkpoint, saveCheckpoint }), null, 2));
}
