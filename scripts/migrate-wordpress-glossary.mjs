import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import {
  glossaryHtmlToPlainText,
  prepareGlossaryDefinitionHtml,
} from '../lib/content/directus-glossary-html.ts';

const EXPECTED_SOURCE_COUNT = 239;
const CLIENT_SLUG = 'sonshine-roofing';
const COLLECTION = 'roofing_glossary_terms';
const WORDPRESS_GRAPHQL = 'https://wp.sonshineroofing.com/graphql';
const APPLY_DRAFTS = process.argv.includes('--apply-drafts');
const PUBLISH = process.argv.includes('--publish');
const EXPLICIT_DRY_RUN = process.argv.includes('--dry-run');
const DRY_RUN = EXPLICIT_DRY_RUN || (!APPLY_DRAFTS && !PUBLISH);

assert.ok(
  Number(APPLY_DRAFTS) + Number(PUBLISH) + Number(EXPLICIT_DRY_RUN) <= 1,
  'Choose exactly one migration mode.',
);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
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
  const repoRoot = new URL('../', import.meta.url);
  for (const filename of ['.env', '.env.local']) {
    try {
      const source = await readFile(new URL(filename, repoRoot), 'utf8');
      for (const line of source.split(/\r?\n/)) {
        const entry = readEnvLine(line);
        if (entry && process.env[entry[0]] === undefined) process.env[entry[0]] = entry[1];
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
}

async function fetchWordPressTerms() {
  const query = `
    query GlossaryMigrationSource($first: Int!, $after: String) {
      glossaryTerms(
        first: $first
        after: $after
        where: { status: PUBLISH, orderby: { field: TITLE, order: ASC } }
      ) {
        nodes {
          databaseId
          slug
          title
          modifiedGmt
          content(format: RENDERED)
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  const rows = [];
  let after = null;
  do {
    const response = await fetch(WORDPRESS_GRAPHQL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { first: 100, after } }),
    });
    assert.equal(response.status, 200, `WPGraphQL HTTP ${response.status}`);
    const payload = await response.json();
    assert.ok(!payload.errors?.length, `WPGraphQL errors: ${JSON.stringify(payload.errors)}`);
    const page = payload.data?.glossaryTerms;
    assert.ok(Array.isArray(page?.nodes), 'WPGraphQL glossary response is missing nodes.');
    rows.push(...page.nodes);
    after = page.pageInfo?.hasNextPage ? page.pageInfo.endCursor : null;
    assert.ok(!page.pageInfo?.hasNextPage || after, 'WPGraphQL pagination cursor is missing.');
  } while (after);

  return rows;
}

function normalizeSourceRows(sourceRows) {
  assert.equal(sourceRows.length, EXPECTED_SOURCE_COUNT, 'Published WordPress glossary count drift.');

  const slugs = new Set();
  const titles = new Set();
  const externalIds = new Set();
  const normalized = sourceRows.map((source) => {
    assert.ok(Number.isInteger(source.databaseId), 'Glossary source databaseId is required.');
    assert.match(source.slug ?? '', /^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid glossary slug.');
    assert.ok(source.title?.trim(), `${source.slug}: title is required.`);
    assert.ok(source.modifiedGmt, `${source.slug}: modifiedGmt is required.`);
    assert.ok(!slugs.has(source.slug), `${source.slug}: duplicate source slug.`);
    slugs.add(source.slug);

    const foldedTitle = source.title.trim().toLocaleLowerCase('en-US');
    assert.ok(!titles.has(foldedTitle), `${source.slug}: duplicate case-insensitive source title.`);
    titles.add(foldedTitle);

    const prepared = prepareGlossaryDefinitionHtml(source.content);
    assert.ok(prepared, `${source.slug}: definition is empty after sanitization.`);
    assert.equal(
      prepared.text,
      glossaryHtmlToPlainText(source.content ?? ''),
      `${source.slug}: definition wording changed during sanitization.`,
    );
    assert.ok(
      !/<(?:img|video|audio|iframe|table|pre|script|style)\b/i.test(prepared.html),
      `${source.slug}: unsupported definition markup remains.`,
    );

    const externalId = `wordpress:${CLIENT_SLUG}:${source.databaseId}`;
    assert.ok(!externalIds.has(externalId), `${source.slug}: duplicate external_id.`);
    externalIds.add(externalId);

    return {
      source,
      externalId,
      sourceUpdatedAt: `${source.modifiedGmt.replace(/Z$/u, '')}Z`,
      definition: prepared.html,
      definitionText: prepared.text,
      contentSha256: sha256(source.content ?? ''),
    };
  });

  return normalized;
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

  async function list(pathname, { fields, filter, limit = 500, sort } = {}) {
    const url = new URL(pathname, `${baseUrl}/`);
    if (fields?.length) url.searchParams.set('fields', fields.join(','));
    if (filter) url.searchParams.set('filter', JSON.stringify(filter));
    if (sort?.length) url.searchParams.set('sort', sort.join(','));
    url.searchParams.set('limit', String(limit));
    return (await request(`${url.pathname}${url.search}`)) ?? [];
  }

  return { request, list };
}

function expectedPayload(row, clientId, status = 'draft') {
  return {
    client: clientId,
    status,
    title: row.source.title.trim(),
    slug: row.source.slug,
    definition: row.definition,
    external_id: row.externalId,
    source_updated_at: row.sourceUpdatedAt,
    noindex: true,
  };
}

function relationId(value) {
  return value && typeof value === 'object' ? value.id : value;
}

function assertExistingTerm(existing, row, clientId, allowedStatuses) {
  assert.equal(relationId(existing.client), clientId, `${row.source.slug}: client drift.`);
  assert.ok(allowedStatuses.includes(existing.status), `${row.source.slug}: status drift.`);
  assert.equal(existing.title, row.source.title.trim(), `${row.source.slug}: title drift.`);
  assert.equal(existing.slug, row.source.slug, `${row.source.slug}: slug drift.`);
  assert.equal(existing.definition, row.definition, `${row.source.slug}: definition drift.`);
  assert.equal(existing.external_id, row.externalId, `${row.source.slug}: external_id drift.`);
  assert.equal(
    Date.parse(existing.source_updated_at),
    Date.parse(row.sourceUpdatedAt),
    `${row.source.slug}: source_updated_at drift.`,
  );
  assert.equal(existing.noindex, true, `${row.source.slug}: noindex must remain true.`);
  assert.equal(existing.scope_key, `${CLIENT_SLUG}:${row.source.slug}`, `${row.source.slug}: scope_key drift.`);
}

function chunked(values, size = 50) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function readContext(directus, rows) {
  const clients = await directus.list('items/clients', {
    fields: ['id', 'slug'],
    filter: { slug: { _eq: CLIENT_SLUG } },
    limit: 2,
  });
  assert.equal(clients.length, 1, 'Expected exactly one SonShine Directus client.');

  const existing = await directus.list(`items/${COLLECTION}`, {
    fields: [
      'id',
      'client',
      'status',
      'title',
      'slug',
      'definition',
      'external_id',
      'source_updated_at',
      'noindex',
      'scope_key',
    ],
    filter: { client: { _eq: clients[0].id } },
    limit: 500,
    sort: ['title'],
  });

  const expectedExternalIds = new Set(rows.map((row) => row.externalId));
  const unexpected = existing.filter((term) => !expectedExternalIds.has(term.external_id));
  assert.deepEqual(
    unexpected.map((term) => term.slug),
    [],
    'Unexpected SonShine Directus glossary record(s).',
  );

  return { clientId: clients[0].id, existing };
}

async function main() {
  await loadLocalEnv();
  const directusUrl = process.env.DIRECTUS_URL?.trim().replace(/\/+$/u, '');
  const directusToken = (process.env.DIRECTUS_TOKEN ?? process.env.DIRECTUS_STATIC_TOKEN)?.trim();
  assert.ok(directusUrl, 'Missing DIRECTUS_URL.');
  assert.ok(directusToken, 'Missing DIRECTUS_TOKEN or DIRECTUS_STATIC_TOKEN.');
  assert.equal(
    process.env.DIRECTUS_CLIENT_SLUG?.trim() ?? CLIENT_SLUG,
    CLIENT_SLUG,
    'DIRECTUS_CLIENT_SLUG does not match SonShine.',
  );

  const rows = normalizeSourceRows(await fetchWordPressTerms());
  const directus = createDirectusClient(directusUrl, directusToken);
  let { clientId, existing } = await readContext(directus, rows);
  const existingByExternalId = new Map(existing.map((term) => [term.external_id, term]));
  const existingBySlug = new Map(existing.map((term) => [term.slug, term]));

  if (DRY_RUN) {
    for (const row of rows) {
      const prior = existingByExternalId.get(row.externalId);
      if (prior) assertExistingTerm(prior, row, clientId, ['draft', 'published']);
      assert.ok(
        !existingBySlug.has(row.source.slug) || prior?.id === existingBySlug.get(row.source.slug)?.id,
        `${row.source.slug}: client-scoped slug conflict.`,
      );
    }
    console.log(
      JSON.stringify(
        {
          mode: 'dry-run',
          source_count: rows.length,
          source_digest: sha256(JSON.stringify(rows.map((row) => row.contentSha256))),
          existing_verified: existingByExternalId.size,
          would_create: rows.length - existingByExternalId.size,
          target_status: 'draft',
          noindex: true,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (APPLY_DRAFTS) {
    const createPayloads = [];
    for (const row of rows) {
      const prior = existingByExternalId.get(row.externalId);
      if (prior) {
        assertExistingTerm(prior, row, clientId, ['draft']);
        continue;
      }
      assert.ok(!existingBySlug.has(row.source.slug), `${row.source.slug}: client-scoped slug conflict.`);
      createPayloads.push(expectedPayload(row, clientId, 'draft'));
    }

    for (const payloads of chunked(createPayloads)) {
      await directus.request(`items/${COLLECTION}`, { method: 'POST', body: payloads });
    }

    ({ existing } = await readContext(directus, rows));
    assert.equal(existing.length, rows.length, 'Final Directus draft glossary count.');
    const finalByExternalId = new Map(existing.map((term) => [term.external_id, term]));
    for (const row of rows) {
      assertExistingTerm(finalByExternalId.get(row.externalId), row, clientId, ['draft']);
    }
    console.log(
      JSON.stringify(
        {
          mode: 'apply-drafts',
          created: createPayloads.length,
          verified_existing: rows.length - createPayloads.length,
          final_count: existing.length,
          target_status: 'draft',
          noindex: true,
        },
        null,
        2,
      ),
    );
    return;
  }

  assert.ok(PUBLISH, 'Unexpected migration mode.');
  assert.equal(existing.length, rows.length, 'Publish requires the complete Directus glossary.');
  for (const row of rows) {
    const prior = existingByExternalId.get(row.externalId);
    assert.ok(prior, `${row.source.slug}: Directus record is missing before publish.`);
    assertExistingTerm(prior, row, clientId, ['draft', 'published']);
  }

  const drafts = existing.filter((term) => term.status === 'draft');
  for (const terms of chunked(drafts)) {
    await directus.request(`items/${COLLECTION}`, {
      method: 'PATCH',
      body: terms.map((term) => ({ id: term.id, status: 'published' })),
    });
  }

  ({ existing } = await readContext(directus, rows));
  assert.equal(existing.length, rows.length, 'Final Directus published glossary count.');
  const finalByExternalId = new Map(existing.map((term) => [term.external_id, term]));
  for (const row of rows) {
    assertExistingTerm(finalByExternalId.get(row.externalId), row, clientId, ['published']);
  }
  console.log(
    JSON.stringify(
      {
        mode: 'publish',
        published_now: drafts.length,
        already_published: rows.length - drafts.length,
        final_count: existing.length,
        target_status: 'published',
        noindex: true,
      },
      null,
      2,
    ),
  );
}

await main();
