import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

// Schema only. Permissions and docs/video-model-invariants.sql are separate,
// reviewable release steps; this command never imports or publishes content.
const field = (name, type, options = {}) => ({
  field: name, type, schema: type === 'alias' ? null : { is_nullable: true, ...options.schema },
  meta: { interface: 'input', ...options.meta },
});
const id = () => field('id', 'uuid', { schema: { is_nullable: false, is_primary_key: true }, meta: { special: ['uuid'], hidden: true, readonly: true } });
const client = () => field('client', 'uuid', { schema: { is_nullable: false }, meta: { interface: 'select-dropdown-m2o', special: ['m2o'], required: true } });
const status = () => field('status', 'string', { schema: { is_nullable: false, default_value: 'draft' }, meta: { interface: 'select-dropdown', options: { choices: ['draft', 'published', 'archived'].map(value => ({ text: value[0].toUpperCase() + value.slice(1), value })) } } });
const text = (name, required = true) => field(name, 'string', { schema: { is_nullable: !required }, meta: { required } });
const hidden = (name, type = 'string') => field(name, type, { meta: { hidden: true, readonly: true } });
export const videoSchema = {
  videos: [
    client(), status(), text('title'), text('slug'),
    field('description', 'text', { schema: { is_nullable: false }, meta: { interface: 'input-multiline', required: true, note: 'Plain-text video description. This copy is independent of project and YouTube edits.' } }),
    field('youtube_url', 'string', { schema: { is_nullable: false }, meta: { required: true, note: 'Paste a YouTube link. The database normalizes it and derives the video ID.' } }),
    hidden('youtube_id'), field('published_at', 'timestamp', { schema: { is_nullable: false }, meta: { interface: 'datetime', required: true, note: 'Website publication date; not the YouTube upload date. Changes go live after deployment.' } }),
    field('project', 'uuid', { meta: { interface: 'select-dropdown-m2o', special: ['m2o'], note: 'Optional. Each project and video may have only one relationship.' } }),
    field('categories', 'alias', { meta: { interface: 'list-m2m', special: ['m2m'], options: { template: '{{category.name}}' } } }),
    hidden('source_updated_at', 'timestamp'), hidden('external_id'), hidden('scope_key'),
    field('legacy_ids', 'json', { schema: { default_value: '[]', is_nullable: false }, meta: { interface: 'input-code', special: ['cast-json'], hidden: true, readonly: true } }),
  ],
  video_categories: [id(), client(), status(), text('name'), text('slug'),
    field('sort', 'integer', { schema: { is_nullable: false, default_value: 0 } }), hidden('scope_key')],
  video_category_assignments: [id(),
    field('video', 'uuid', { schema: { is_nullable: false }, meta: { interface: 'select-dropdown-m2o', special: ['m2o'] } }),
    field('category', 'uuid', { schema: { is_nullable: false }, meta: { interface: 'select-dropdown-m2o', special: ['m2o'] } })],
};
export const videoRelations = [
  { collection: 'videos', field: 'client', related_collection: 'clients' },
  { collection: 'videos', field: 'project', related_collection: 'roofing_projects' },
  { collection: 'video_categories', field: 'client', related_collection: 'clients' },
  { collection: 'video_category_assignments', field: 'video', related_collection: 'videos', meta: { one_field: 'categories', junction_field: 'category' } },
  { collection: 'video_category_assignments', field: 'category', related_collection: 'video_categories', meta: { junction_field: 'video' } },
].map(relation => ({ ...relation, schema: { on_delete: 'RESTRICT' } }));

export async function setupVideoSchema(request, { apply = false, verifyOnly = false } = {}) {
  const collections = new Set((await request('collections')).map(row => row.collection));
  const actions = [];
  assert.ok(collections.has('videos') && collections.has('roofing_projects') && collections.has('clients'), 'Expected existing base collections.');
  for (const [collection, fields] of Object.entries(videoSchema)) {
    if (!collections.has(collection)) {
      assert.ok(!verifyOnly, `Missing collection ${collection}.`);
      actions.push(`create collection ${collection}`);
      if (apply) await request('collections', 'POST', { collection, schema: {}, meta: { hidden: collection.endsWith('_assignments'), icon: collection === 'video_categories' ? 'category' : 'video_library', ...(collection === 'video_categories' ? { sort_field: 'sort' } : {}) }, fields });
      continue;
    }
    const existing = new Map((await request(`fields/${collection}`)).map(row => [row.field, row]));
    for (const desired of fields) {
      const prior = existing.get(desired.field);
      if (prior) {
        assert.equal(prior.type, desired.type, `${collection}.${desired.field}: existing type conflicts.`);
        continue;
      }
      assert.ok(!verifyOnly, `Missing field ${collection}.${desired.field}.`);
      actions.push(`create field ${collection}.${desired.field}`);
      if (apply) await request(`fields/${collection}`, 'POST', desired);
    }
  }
  const relations = await request('relations');
  for (const desired of videoRelations) {
    const prior = relations.find(row => row.collection === desired.collection && row.field === desired.field);
    if (prior) {
      assert.equal(prior.related_collection, desired.related_collection, `${desired.collection}.${desired.field}: competing relation.`);
      if (desired.meta?.one_field) assert.equal(prior.meta?.one_field, desired.meta.one_field, 'Competing reverse relation.');
      continue;
    }
    assert.ok(!verifyOnly, `Missing relation ${desired.collection}.${desired.field}.`);
    actions.push(`create relation ${desired.collection}.${desired.field}`);
    if (apply) await request('relations', 'POST', desired);
  }
  return { mode: apply ? 'apply' : verifyOnly ? 'verify-only' : 'dry-run', actions, next: 'Apply and verify docs/video-model-invariants.sql, then configure scoped role permissions before importing content.' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const modes = ['--apply', '--verify-only', '--dry-run'].filter(mode => process.argv.includes(mode));
  assert.ok(modes.length <= 1, 'Choose one mode.');
  const endpoint = process.env.DIRECTUS_URL?.replace(/\/+$/u, '');
  const token = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_STATIC_TOKEN;
  assert.ok(endpoint && token, 'A task-authorized Directus URL and token are required.');
  const request = async (route, method = 'GET', body) => {
    const response = await fetch(`${endpoint}/${route}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const payload = await response.json();
    assert.ok(response.ok && !payload.errors, `${method} ${route}: HTTP ${response.status}; schema operation failed.`);
    return payload.data;
  };
  console.log(JSON.stringify(await setupVideoSchema(request, { apply: modes[0] === '--apply', verifyOnly: modes[0] === '--verify-only' }), null, 2));
}
