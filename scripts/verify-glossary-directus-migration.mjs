import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  glossaryHtmlToPlainText,
  prepareGlossaryDefinitionHtml,
} from '../lib/content/directus-glossary-html.ts';

const EXPECTED_COUNT = 239;
const CLIENT_SLUG = 'sonshine-roofing';
const COLLECTION = 'roofing_glossary_terms';
const WORDPRESS_GRAPHQL = 'https://wp.sonshineroofing.com/graphql';
const GLOSSARY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const expectedStatusArgument = process.argv.find((argument) => argument.startsWith('--expected-status='));
const EXPECTED_STATUS = expectedStatusArgument?.split('=', 2)[1] ?? 'published';

assert.ok(['draft', 'published'].includes(EXPECTED_STATUS), '--expected-status must be draft or published.');

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

async function readJson(response, label) {
  const payload = await response.json().catch(() => null);
  assert.ok(response.ok, `${label} HTTP ${response.status}.`);
  assert.ok(!payload?.errors?.length, `${label}: ${JSON.stringify(payload?.errors)}`);
  return payload?.data;
}

async function fetchSource() {
  const query = `
    query VerifyGlossarySource($first: Int!, $after: String) {
      glossaryTerms(
        first: $first
        after: $after
        where: { status: PUBLISH, orderby: { field: TITLE, order: ASC } }
      ) {
        nodes { databaseId slug title modifiedGmt content(format: RENDERED) }
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
    const data = await readJson(response, 'WPGraphQL');
    const page = data?.glossaryTerms;
    assert.ok(Array.isArray(page?.nodes), 'WPGraphQL glossary nodes are missing.');
    rows.push(...page.nodes);
    after = page.pageInfo?.hasNextPage ? page.pageInfo.endCursor : null;
    assert.ok(!page.pageInfo?.hasNextPage || after, 'WPGraphQL cursor is missing.');
  } while (after);

  assert.equal(rows.length, EXPECTED_COUNT, 'Published WordPress glossary count drift.');
  return rows;
}

async function fetchDirectus(baseUrl, token, path, query = {}) {
  const url = new URL(path, `${baseUrl}/`);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  return readJson(
    await fetch(url, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
    `Directus ${url.pathname}`,
  );
}

function relationId(value) {
  return value && typeof value === 'object' ? value.id : value;
}

async function main() {
  await loadLocalEnv();
  const directusUrl = process.env.DIRECTUS_URL?.trim().replace(/\/+$/u, '');
  const directusToken = (process.env.DIRECTUS_TOKEN ?? process.env.DIRECTUS_STATIC_TOKEN)?.trim();
  assert.ok(directusUrl, 'Missing DIRECTUS_URL.');
  assert.ok(directusToken, 'Missing DIRECTUS_TOKEN or DIRECTUS_STATIC_TOKEN.');

  const sourceRows = await fetchSource();
  const clients = await fetchDirectus(directusUrl, directusToken, 'items/clients', {
    fields: 'id,slug',
    filter: JSON.stringify({ slug: { _eq: CLIENT_SLUG } }),
    limit: '2',
  });
  assert.equal(clients.length, 1, 'Expected exactly one SonShine Directus client.');
  const clientId = clients[0].id;

  const directusRows = await fetchDirectus(directusUrl, directusToken, `items/${COLLECTION}`, {
    fields: [
      'id',
      'client',
      'status',
      'title',
      'slug',
      'definition',
      'external_id',
      'source_updated_at',
      'date_created',
      'date_updated',
      'noindex',
      'meta_title',
      'meta_description',
      'primary_focus_keyword',
      'focus_keywords',
      'og_title',
      'og_description',
      'og_image_override',
      'scope_key',
    ].join(','),
    filter: JSON.stringify({ client: { _eq: clientId } }),
    limit: '500',
    sort: 'title',
  });
  assert.equal(directusRows.length, EXPECTED_COUNT, 'Directus glossary count mismatch.');

  const byExternalId = new Map(directusRows.map((row) => [row.external_id, row]));
  const slugSet = new Set();
  const titleSet = new Set();

  for (const source of sourceRows) {
    const externalId = `wordpress:${CLIENT_SLUG}:${source.databaseId}`;
    const target = byExternalId.get(externalId);
    assert.ok(target, `${source.slug}: Directus external_id match is missing.`);
    assert.equal(relationId(target.client), clientId, `${source.slug}: client mismatch.`);
    assert.equal(target.status, EXPECTED_STATUS, `${source.slug}: status mismatch.`);
    assert.equal(target.slug, source.slug, `${source.slug}: slug mismatch.`);
    assert.match(target.slug, GLOSSARY_SLUG_PATTERN, `${source.slug}: invalid target slug.`);
    assert.equal(target.title, source.title.trim(), `${source.slug}: title mismatch.`);
    assert.equal(target.noindex, true, `${source.slug}: noindex must be true.`);
    assert.equal(target.scope_key, `${CLIENT_SLUG}:${source.slug}`, `${source.slug}: scope_key mismatch.`);
    assert.equal(
      Date.parse(target.source_updated_at),
      Date.parse(`${source.modifiedGmt.replace(/Z$/u, '')}Z`),
      `${source.slug}: source_updated_at mismatch.`,
    );
    assert.ok(Number.isFinite(Date.parse(target.date_created)), `${source.slug}: date_created is invalid.`);
    assert.ok(
      target.date_updated === null || Number.isFinite(Date.parse(target.date_updated)),
      `${source.slug}: date_updated is invalid.`,
    );

    const prepared = prepareGlossaryDefinitionHtml(source.content);
    assert.ok(prepared, `${source.slug}: source definition is empty after sanitization.`);
    assert.equal(target.definition, prepared.html, `${source.slug}: definition HTML mismatch.`);
    assert.equal(
      glossaryHtmlToPlainText(target.definition),
      glossaryHtmlToPlainText(source.content ?? ''),
      `${source.slug}: visible definition text mismatch.`,
    );

    for (const field of [
      'meta_title',
      'meta_description',
      'primary_focus_keyword',
      'focus_keywords',
      'og_title',
      'og_description',
      'og_image_override',
    ]) {
      assert.equal(target[field], null, `${source.slug}: ${field} should remain empty while noindex.`);
    }

    assert.ok(!slugSet.has(target.slug), `${target.slug}: duplicate target slug.`);
    slugSet.add(target.slug);
    const foldedTitle = target.title.toLocaleLowerCase('en-US');
    assert.ok(!titleSet.has(foldedTitle), `${target.slug}: duplicate target title.`);
    titleSet.add(foldedTitle);
  }

  assert.equal(byExternalId.size, sourceRows.length, 'Unexpected or duplicate Directus external_id.');
  console.log(
    JSON.stringify(
      {
        verified: true,
        source_count: sourceRows.length,
        directus_count: directusRows.length,
        expected_status: EXPECTED_STATUS,
        noindex_count: directusRows.filter((row) => row.noindex === true).length,
        indexable_count: directusRows.filter((row) => row.noindex === false).length,
      },
      null,
      2,
    ),
  );
}

await main();
