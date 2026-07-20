import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { DomUtils, parseDocument } from 'htmlparser2';
import { preparePersonBioHtml } from '../lib/content/directus-person-html.ts';

const REPO_ROOT = new URL('../', import.meta.url);
const MANIFEST_URL = new URL('../person-migration-manifest.json', import.meta.url);
const APPLY = process.argv.includes('--apply');
const EMIT_PAYLOAD = process.argv.includes('--emit-payload');
const DRY_RUN = process.argv.includes('--dry-run') || (!APPLY && !EMIT_PAYLOAD);

assert.ok(
  Number(APPLY) + Number(EMIT_PAYLOAD) + Number(process.argv.includes('--dry-run')) <= 1,
  'Choose one migration mode',
);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function normalizedText(html) {
  return DomUtils.textContent(parseDocument(html))
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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

async function loadLocalEnv() {
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
}

async function fetchWordPressPersons(endpoint) {
  const query = `
    query PersonMigrationSource {
      persons(first: 100, where: { status: PUBLISH }) {
        nodes {
          databaseId
          slug
          title
          modifiedGmt
          content(format: RENDERED)
          personAttributes { positionTitle }
          featuredImage {
            node { databaseId sourceUrl altText title }
          }
        }
      }
    }
  `;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  assert.equal(response.status, 200, `WPGraphQL HTTP ${response.status}`);
  const payload = await response.json();
  assert.equal(payload.errors, undefined, `WPGraphQL errors: ${JSON.stringify(payload.errors)}`);
  return payload.data.persons.nodes;
}

function validateAndMapSource(manifest, sourceRows) {
  assert.equal(manifest.schema_version, '1.0.0', 'Unexpected manifest schema version');
  assert.equal(manifest.persons.length, 10, 'Migration manifest must contain exactly 10 people');
  assert.equal(
    new Set(manifest.persons.map((person) => person.slug)).size,
    10,
    'Duplicate manifest slug',
  );
  assert.equal(
    new Set(manifest.persons.map((person) => person.sort)).size,
    10,
    'Duplicate sort value',
  );
  assert.deepEqual(
    manifest.persons.map((person) => person.sort),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    'Manifest sort order must be contiguous',
  );
  assert.deepEqual(
    manifest.excluded_slugs,
    ['antonio', 'tony', 'angela', 'dean', 'steve', 'matthew'],
    'Former-person denylist drift',
  );
  const selectedSlugs = new Set(manifest.persons.map((person) => person.slug));
  assert.ok(
    manifest.excluded_slugs.every((slug) => !selectedSlugs.has(slug)),
    'Excluded person appears in migration manifest',
  );

  const sourceBySlug = new Map(sourceRows.map((person) => [person.slug, person]));
  return manifest.persons.map((decision) => {
    const source = sourceBySlug.get(decision.slug);
    assert.ok(source, `${decision.slug}: missing published WordPress person`);
    assert.equal(
      source.databaseId,
      decision.source_database_id,
      `${decision.slug}: source ID drift`,
    );
    assert.equal(source.title, decision.source_title, `${decision.slug}: title drift`);
    assert.equal(
      source.personAttributes?.positionTitle,
      decision.source_position,
      `${decision.slug}: role drift`,
    );
    assert.equal(
      source.modifiedGmt,
      decision.source_modified_gmt,
      `${decision.slug}: modified timestamp drift`,
    );
    assert.equal(
      sha256(source.content ?? ''),
      decision.source_content_sha256,
      `${decision.slug}: biography drift`,
    );
    assert.equal(
      source.featuredImage?.node?.databaseId,
      decision.image.source_database_id,
      `${decision.slug}: image ID drift`,
    );
    assert.equal(
      source.featuredImage?.node?.sourceUrl,
      decision.image.source_url,
      `${decision.slug}: image URL drift`,
    );

    const biography = preparePersonBioHtml(source.content);
    assert.ok(biography, `${decision.slug}: empty biography after sanitization`);
    assert.equal(
      biography.text.replace(/\s+/g, ''),
      normalizedText(source.content).replace(/\s+/g, ''),
      `${decision.slug}: biography wording changed during sanitization`,
    );
    assert.ok(!/<(?:img|video|audio|iframe|table|pre|code|script|style)\b/i.test(biography.html));

    return {
      decision,
      source,
      biography,
      externalId: `wordpress:sonshine-roofing:${source.databaseId}`,
      sourceUpdatedAt: `${source.modifiedGmt}Z`,
      mediaTag: `wordpress-person-media:${decision.image.source_database_id}`,
    };
  });
}

function createDirectusClient(baseUrl, token) {
  async function request(path, options = {}) {
    const response = await fetch(new URL(path, `${baseUrl}/`), {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.errors?.length) {
      const message = payload?.errors
        ?.map((entry) => entry.message)
        .filter(Boolean)
        .join('; ');
      throw new Error(
        `Directus ${options.method ?? 'GET'} ${path}: ${response.status}${message ? ` ${message}` : ''}`,
      );
    }
    return payload?.data;
  }

  async function list(pathname, { fields, filter, limit = 500 } = {}) {
    const url = new URL(pathname, `${baseUrl}/`);
    if (fields?.length) url.searchParams.set('fields', fields.join(','));
    if (filter) url.searchParams.set('filter', JSON.stringify(filter));
    url.searchParams.set('limit', String(limit));
    return (await request(`${url.pathname}${url.search}`)) ?? [];
  }

  return { request, list };
}

function scalarPayload(row, clientId, imageId, status) {
  const { decision, biography, externalId, sourceUpdatedAt } = row;
  return {
    client: clientId,
    status,
    slug: decision.slug,
    display_name: decision.display_name,
    first_name: decision.first_name,
    last_name: decision.last_name,
    title: decision.source_position,
    bio: biography.html,
    profile_image: imageId,
    sort: decision.sort,
    show_on_team: true,
    seo_indexable: true,
    external_id: externalId,
    source_updated_at: sourceUpdatedAt,
  };
}

function fileTags(row) {
  return [
    'sonshine-roofing',
    'person-profile',
    'migration-source:wordpress',
    `wordpress-person-id:${row.source.databaseId}`,
    row.mediaTag,
  ];
}

function assertExistingPerson(existing, expected, slug) {
  const fields = [
    'client',
    'status',
    'slug',
    'display_name',
    'first_name',
    'last_name',
    'title',
    'bio',
    'profile_image',
    'sort',
    'show_on_team',
    'seo_indexable',
    'external_id',
    'source_updated_at',
  ];
  for (const field of fields) {
    const actual =
      field === 'profile_image' && typeof existing[field] === 'object'
        ? existing[field]?.id
        : existing[field];
    if (field === 'source_updated_at') {
      assert.equal(
        Date.parse(actual),
        Date.parse(expected[field]),
        `${slug}: Directus ${field} drift`,
      );
    } else {
      assert.deepEqual(actual ?? null, expected[field] ?? null, `${slug}: Directus ${field} drift`);
    }
  }
}

async function main() {
  await loadLocalEnv();
  const manifest = JSON.parse(await readFile(MANIFEST_URL, 'utf8'));
  const directusUrl = process.env.DIRECTUS_URL?.trim().replace(/\/+$/, '');
  const directusToken = (process.env.DIRECTUS_TOKEN ?? process.env.DIRECTUS_STATIC_TOKEN)?.trim();
  assert.ok(directusUrl, 'Missing DIRECTUS_URL');
  assert.ok(directusToken, 'Missing DIRECTUS_TOKEN or DIRECTUS_STATIC_TOKEN');
  assert.equal(
    process.env.DIRECTUS_CLIENT_SLUG?.trim() ?? manifest.target.client_slug,
    manifest.target.client_slug,
    'DIRECTUS_CLIENT_SLUG does not match the manifest',
  );

  const sourceRows = await fetchWordPressPersons(manifest.source.graphql_url);
  const rows = validateAndMapSource(manifest, sourceRows);
  const directus = createDirectusClient(directusUrl, directusToken);
  const clients = await directus.list('items/clients', {
    fields: ['id', 'slug'],
    filter: { slug: { _eq: manifest.target.client_slug } },
    limit: 2,
  });
  assert.equal(clients.length, 1, 'Expected exactly one SonShine Directus client');
  const clientId = clients[0].id;

  const existingPeople = await directus.list('items/persons', {
    fields: [
      'id',
      'client',
      'status',
      'slug',
      'display_name',
      'first_name',
      'last_name',
      'title',
      'bio',
      'profile_image.id',
      'sort',
      'show_on_team',
      'seo_indexable',
      'external_id',
      'source_updated_at',
    ],
    filter: { client: { _eq: clientId } },
  });
  const existingByExternalId = new Map(
    existingPeople
      .filter((person) => person.external_id)
      .map((person) => [person.external_id, person]),
  );
  const existingBySlug = new Map(existingPeople.map((person) => [person.slug, person]));
  assert.ok(
    manifest.excluded_slugs.every((slug) => !existingBySlug.has(slug)),
    'An excluded former person already exists in the SonShine Directus scope',
  );

  const roots = await directus.list('folders', {
    fields: ['id', 'name', 'parent'],
    filter: { name: { _eq: 'sonshine_roofing' } },
    limit: 2,
  });
  assert.equal(roots.length, 1, 'Expected exactly one sonshine_roofing file folder');
  const folders = await directus.list('folders', {
    fields: ['id', 'name', 'parent'],
    filter: { name: { _eq: manifest.target.folder_name }, parent: { _eq: roots[0].id } },
    limit: 2,
  });
  assert.ok(folders.length <= 1, 'Duplicate SonShine persons folders');

  if (EMIT_PAYLOAD) {
    assert.ok(
      folders[0]?.id,
      'The SonShine persons file folder must exist before payload generation',
    );
    const files = await directus.list('files', {
      fields: ['id', 'title', 'description', 'tags', 'folder'],
      filter: { folder: { _eq: folders[0].id } },
    });
    const payloads = rows.map((row) => {
      assert.ok(
        !existingByExternalId.has(row.externalId),
        `${row.decision.slug}: already migrated`,
      );
      assert.ok(
        !existingBySlug.has(row.decision.slug),
        `${row.decision.slug}: client-scoped slug conflict`,
      );
      const file = files.find(
        (candidate) => Array.isArray(candidate.tags) && candidate.tags.includes(row.mediaTag),
      );
      assert.ok(file?.id, `${row.decision.slug}: verified imported profile image not found`);
      assert.ok(
        file.description?.trim(),
        `${row.decision.slug}: imported profile image has no description`,
      );
      return scalarPayload(row, clientId, file.id, manifest.target.status);
    });
    console.log(JSON.stringify(payloads));
    return;
  }

  if (DRY_RUN) {
    const conflicts = rows.filter(
      (row) => existingBySlug.has(row.decision.slug) && !existingByExternalId.has(row.externalId),
    );
    assert.deepEqual(conflicts, [], 'Client-scoped slug conflict');
    console.log(
      JSON.stringify(
        {
          mode: 'dry-run',
          source_count: rows.length,
          excluded_slugs: manifest.excluded_slugs,
          existing_verified: rows.filter((row) => existingByExternalId.has(row.externalId)).length,
          would_create: rows
            .filter((row) => !existingByExternalId.has(row.externalId))
            .map((row) => row.decision.slug),
          folder_action: folders[0] ? 'reuse' : 'create',
          target_status: manifest.target.status,
          show_on_team: true,
          seo_indexable: true,
        },
        null,
        2,
      ),
    );
    return;
  }

  let folderId = folders[0]?.id;
  if (!folderId) {
    const folder = await directus.request('folders', {
      method: 'POST',
      body: { name: manifest.target.folder_name, parent: roots[0].id },
    });
    folderId = folder.id;
  }

  const folderFiles = await directus.list('files', {
    fields: ['id', 'title', 'description', 'tags', 'folder'],
    filter: { folder: { _eq: folderId } },
  });
  const created = [];
  const verified = [];

  for (const row of rows) {
    const prior = existingByExternalId.get(row.externalId);
    if (prior) {
      const expected = scalarPayload(
        row,
        clientId,
        prior.profile_image?.id ?? prior.profile_image,
        manifest.target.status,
      );
      assertExistingPerson(prior, expected, row.decision.slug);
      verified.push(row.decision.slug);
      continue;
    }
    assert.ok(
      !existingBySlug.has(row.decision.slug),
      `${row.decision.slug}: client-scoped slug conflict`,
    );

    let file = folderFiles.find(
      (candidate) => Array.isArray(candidate.tags) && candidate.tags.includes(row.mediaTag),
    );
    if (!file) {
      file = await directus.request('files/import', {
        method: 'POST',
        body: {
          url: row.decision.image.source_url,
          data: {
            folder: folderId,
            title: row.decision.image.title,
            description: row.decision.image.description,
            tags: fileTags(row),
          },
        },
      });
      folderFiles.push(file);
    }
    assert.ok(file?.id, `${row.decision.slug}: Directus image import returned no ID`);
    assert.ok(file.description?.trim(), `${row.decision.slug}: Directus image has no description`);

    const payload = scalarPayload(row, clientId, file.id, manifest.target.status);
    const person = await directus.request('items/persons', { method: 'POST', body: payload });
    assert.ok(person?.id, `${row.decision.slug}: Directus create returned no ID`);
    created.push(row.decision.slug);
  }

  const finalPeople = await directus.list('items/persons', {
    fields: ['id', 'slug', 'external_id', 'status', 'show_on_team', 'seo_indexable'],
    filter: { client: { _eq: clientId }, external_id: { _in: rows.map((row) => row.externalId) } },
  });
  assert.equal(finalPeople.length, 10, 'Final Directus person count');
  assert.ok(
    finalPeople.every((person) => person.status === manifest.target.status),
    `Every migrated person must be ${manifest.target.status}`,
  );
  assert.ok(
    finalPeople.every((person) => person.show_on_team === true),
    'show_on_team mismatch',
  );
  assert.ok(
    finalPeople.every((person) => person.seo_indexable === true),
    'seo_indexable mismatch',
  );

  console.log(
    JSON.stringify(
      {
        mode: 'apply',
        created,
        verified,
        final_count: finalPeople.length,
        target_status: manifest.target.status,
        excluded_slugs: manifest.excluded_slugs,
      },
      null,
      2,
    ),
  );
}

await main();
