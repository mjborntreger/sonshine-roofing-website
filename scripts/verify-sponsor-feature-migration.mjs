import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const REPO_ROOT = new URL('../', import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL('../sponsor-feature-migration-manifest.json', import.meta.url), 'utf8'),
);

function readEnvLine(line) {
  const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!match) return null;
  let value = match[2];
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1);
  }
  return [match[1], value];
}

for (const filename of ['.env', '.env.local']) {
  try {
    const source = await readFile(new URL(filename, REPO_ROOT), 'utf8');
    for (const line of source.split(/\r?\n/)) {
      const entry = readEnvLine(line);
      if (entry && process.env[entry[0]] === undefined) process.env[entry[0]] = entry[1];
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

assert.equal(manifest.schema_version, '1.0.0');
assert.equal(manifest.source.total, 6);
assert.equal(
  Object.values(manifest.source.counts).reduce((total, count) => total + count, 0),
  6,
);
assert.equal(manifest.source.counts.publish, 6);
assert.deepEqual(
  manifest.sponsors.map((entry) => entry.directus.sort),
  [1, 2, 3, 4, 5, 6],
);
assert.equal(new Set(manifest.sponsors.map((entry) => entry.source.database_id)).size, 6);
assert.equal(new Set(manifest.sponsors.map((entry) => entry.directus.item_id)).size, 6);
assert.equal(new Set(manifest.sponsors.map((entry) => entry.directus.asset_id)).size, 6);

const baseUrl = process.env.DIRECTUS_URL?.trim().replace(/\/+$/, '');
const token = (process.env.DIRECTUS_TOKEN ?? process.env.DIRECTUS_STATIC_TOKEN)?.trim();
assert.ok(baseUrl, 'DIRECTUS_URL is required');
assert.ok(token, 'DIRECTUS_TOKEN or DIRECTUS_STATIC_TOKEN is required');

const url = new URL('/items/sponsor_features', baseUrl);
url.searchParams.set(
  'fields',
  [
    'id',
    'client.id',
    'client.slug',
    'status',
    'sort',
    'title',
    'slug',
    'description',
    'website_url',
    'facebook_url',
    'instagram_url',
    'service_area_slugs',
    'external_id',
    'published_at',
    'source_updated_at',
    'logo.id',
    'logo.title',
    'logo.description',
    'logo.tags',
    'logo.focal_point_x',
    'logo.focal_point_y',
    'logo.type',
    'logo.folder',
    'logo.metadata',
  ].join(','),
);
url.searchParams.set(
  'filter',
  JSON.stringify({ client: { slug: { _eq: manifest.destination.client_slug } } }),
);
url.searchParams.set('sort', 'sort');
url.searchParams.set('limit', '100');

const response = await fetch(url, {
  headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
});
assert.equal(response.status, 200, `Directus HTTP ${response.status}`);
const payload = await response.json();
assert.equal(payload.errors, undefined, JSON.stringify(payload.errors));
assert.equal(payload.data.length, manifest.sponsors.length, 'Directus sponsor count drift');

const scalarFields = [
  'item_id',
  'status',
  'sort',
  'title',
  'slug',
  'description',
  'website_url',
  'facebook_url',
  'instagram_url',
  'service_area_slugs',
  'external_id',
  'published_at',
  'source_updated_at',
];

for (const [index, entry] of manifest.sponsors.entries()) {
  const actual = payload.data[index];
  const expected = entry.directus;
  assert.equal(actual.client.id, manifest.destination.client_id, `${expected.slug}: client ID`);
  assert.equal(
    actual.client.slug,
    manifest.destination.client_slug,
    `${expected.slug}: client slug`,
  );
  for (const field of scalarFields) {
    const actualValue = field === 'item_id' ? actual.id : actual[field];
    assert.deepEqual(actualValue ?? null, expected[field] ?? null, `${expected.slug}: ${field}`);
  }

  assert.equal(actual.logo.id, expected.asset_id, `${expected.slug}: asset ID`);
  assert.equal(
    actual.logo.folder,
    manifest.destination.asset_folder_id,
    `${expected.slug}: folder`,
  );
  assert.equal(actual.logo.type, 'image/webp', `${expected.slug}: image type`);
  assert.ok(actual.logo.title?.trim(), `${expected.slug}: generated image title`);
  assert.ok(actual.logo.description?.trim(), `${expected.slug}: generated image description`);
  assert.ok(actual.logo.tags?.includes('ai-generated-metadata'), `${expected.slug}: AI tag`);
  assert.ok(Number.isFinite(actual.logo.focal_point_x), `${expected.slug}: focal point x`);
  assert.ok(Number.isFinite(actual.logo.focal_point_y), `${expected.slug}: focal point y`);
  assert.equal(
    actual.logo.metadata?.migration_source?.source_sha256,
    entry.source.image_sha256,
    `${expected.slug}: source image hash provenance`,
  );
  assert.ok(
    actual.logo.metadata?.automation_history?.some(
      (event) => event.type === 'image_metadata' && event.status === 'success',
    ),
    `${expected.slug}: successful metadata automation provenance`,
  );
}

const localFor = (slug) =>
  manifest.sponsors.filter((entry) => entry.directus.service_area_slugs.includes(slug));
assert.deepEqual(
  localFor('north-port').map((entry) => entry.directus.sort),
  [2, 3, 4, 5, 6],
);
assert.deepEqual(
  localFor('port-charlotte').map((entry) => entry.directus.sort),
  [1],
);
assert.deepEqual(localFor('sarasota'), []);

process.stdout.write('Sponsor feature migration manifest and Directus reconciliation passed.\n');
