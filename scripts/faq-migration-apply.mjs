import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const mode = process.argv[2];
const indexPath = process.argv[3] || '/private/tmp/sonshine-faq-migration-index.json';
const directusUrl = process.env.DIRECTUS_URL?.trim().replace(/\/+$/, '');
const directusToken =
  process.env.DIRECTUS_ACCESS_TOKEN?.trim() || process.env.DIRECTUS_TOKEN?.trim();

if (!directusUrl || !directusToken) {
  throw new Error('DIRECTUS_URL and DIRECTUS_ACCESS_TOKEN or DIRECTUS_TOKEN are required.');
}
if (
  ![
    'backfill-existing',
    'verify-existing',
    'import-drafts',
    'verify-drafts',
    'publish-sonshine',
    'verify-published',
  ].includes(mode)
) {
  throw new Error(`Unsupported migration mode: ${mode}`);
}

const BATCH_SIZE = 5;
const REQUEST_DELAY_MS = 1_000;
const MAX_RETRIES = 5;
const REQUEST_TIMEOUT_MS = 30_000;
let lastDirectusRequestAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttleDirectusRequest() {
  const elapsed = Date.now() - lastDirectusRequestAt;
  if (elapsed < REQUEST_DELAY_MS) {
    await sleep(REQUEST_DELAY_MS - elapsed);
  }
  lastDirectusRequestAt = Date.now();
}

function checksum(question, answerHtml) {
  return createHash('sha256')
    .update(`${String(question).trim()}\n${String(answerHtml).trim().replace(/\r\n/g, '\n')}`)
    .digest('hex');
}

function deterministicFaqId(wordpressId) {
  const hex = createHash('sha256')
    .update(`sonshine-roofing:wordpress-faq:${wordpressId}`)
    .digest('hex')
    .slice(0, 32)
    .split('');
  hex[12] = '5';
  hex[16] = ['8', '9', 'a', 'b'][Number.parseInt(hex[16], 16) % 4];
  const value = hex.join('');
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function chunks(items, size) {
  const output = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

async function directusRequest(path, { method = 'GET', body } = {}) {
  const url = new URL(path.replace(/^\//, ''), `${directusUrl}/`);
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    let response;
    try {
      await throttleDirectusRequest();
      response = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${directusToken}`,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      lastError = error;
      if (method === 'POST' || attempt === MAX_RETRIES) throw error;
      await sleep(2 ** attempt * 1_000);
      continue;
    }

    if (response.ok) {
      return response.status === 204 ? null : response.json();
    }

    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || method === 'POST' || attempt === MAX_RETRIES) {
      throw new Error(
        `Directus ${method} ${url.pathname} returned ${response.status} ${response.statusText}.`,
      );
    }

    const retryAfter = Number(response.headers.get('retry-after'));
    const delay =
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1_000 : 2 ** attempt * 1_000;
    await sleep(delay);
  }

  throw lastError ?? new Error('Directus request failed.');
}

async function listFaqs() {
  const url = new URL('items/faqs', `${directusUrl}/`);
  url.searchParams.set(
    'fields',
    'id,client.id,client.slug,question,answer,page_key,service_slug,website_page.id,website_page.path,website_page.nav_label,website_page.status,website_page.client.slug,sort_order,is_published,status',
  );
  url.searchParams.set('limit', '500');
  const payload = await directusRequest(`${url.pathname}${url.search}`);
  return payload?.data ?? [];
}

async function saveIndex(index) {
  index.last_updated_at = new Date().toISOString();
  await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
}

function validateExistingMappings(index, currentFaqs) {
  const currentById = new Map(currentFaqs.map((faq) => [faq.id, faq]));
  const errors = [];

  for (const expected of index.existing_directus_faqs) {
    const actual = currentById.get(expected.directus_id);
    if (!actual) {
      errors.push(`Missing existing FAQ ${expected.directus_id}.`);
      continue;
    }
    if (actual.client?.slug !== expected.client_slug) {
      errors.push(
        `Existing FAQ ${expected.directus_id} client mismatch: ${actual.client?.slug} != ${expected.client_slug}.`,
      );
    }
    const expectedPage = expected.website_page?.id ?? null;
    const actualPage = actual.website_page?.id ?? null;
    if (actualPage !== expectedPage) {
      errors.push(
        `Existing FAQ ${expected.directus_id} page mismatch: ${actualPage} != ${expectedPage}.`,
      );
    }
    if (actual.website_page) {
      if (actual.website_page.status !== 'published') {
        errors.push(`Existing FAQ ${expected.directus_id} links to an unpublished page.`);
      }
      if (actual.website_page.client?.slug !== expected.client_slug) {
        errors.push(`Existing FAQ ${expected.directus_id} links to another client's page.`);
      }
    }
    if (checksum(actual.question, actual.answer) !== expected.checksum) {
      errors.push(`Existing FAQ ${expected.directus_id} content changed.`);
    }
  }
  return errors;
}

function validateSonshine(index, currentFaqs, expectedStatus) {
  const allowedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  const sonshineFaqs = currentFaqs.filter((faq) => faq.client?.slug === 'sonshine-roofing');
  const byChecksum = new Map();
  for (const faq of sonshineFaqs) {
    const key = checksum(faq.question, faq.answer);
    const values = byChecksum.get(key) ?? [];
    values.push(faq);
    byChecksum.set(key, values);
  }

  const errors = [];
  for (const expected of index.sonshine_wordpress_faqs) {
    const matches = byChecksum.get(expected.checksum) ?? [];
    if (matches.length !== 1) {
      errors.push(
        `SonShine FAQ ${expected.wordpress_id} expected one match; found ${matches.length}.`,
      );
      continue;
    }
    const actual = matches[0];
    const expectedPage = expected.website_page?.id ?? null;
    const actualPage = actual.website_page?.id ?? null;
    if (actualPage !== expectedPage) {
      errors.push(
        `SonShine FAQ ${expected.wordpress_id} page mismatch: ${actualPage} != ${expectedPage}.`,
      );
    }
    if (actual.website_page) {
      if (actual.website_page.status !== 'published') {
        errors.push(`SonShine FAQ ${expected.wordpress_id} links to an unpublished page.`);
      }
      if (actual.website_page.client?.slug !== 'sonshine-roofing') {
        errors.push(`SonShine FAQ ${expected.wordpress_id} links to another client's page.`);
      }
    }
    if (actual.sort_order !== expected.sort_order) {
      errors.push(
        `SonShine FAQ ${expected.wordpress_id} sort mismatch: ${actual.sort_order} != ${expected.sort_order}.`,
      );
    }
    if (!allowedStatuses.includes(actual.status)) {
      errors.push(
        `SonShine FAQ ${expected.wordpress_id} status ${actual.status} is not one of ${allowedStatuses.join(', ')}.`,
      );
    }
    const expectedPublished = actual.status === 'published';
    if (Boolean(actual.is_published) !== expectedPublished) {
      errors.push(`SonShine FAQ ${expected.wordpress_id} legacy publish flag is incorrect.`);
    }
    expected.directus_id = actual.id;
  }

  if (sonshineFaqs.length !== index.sonshine_wordpress_faqs.length) {
    errors.push(
      `Expected ${index.sonshine_wordpress_faqs.length} SonShine FAQs; found ${sonshineFaqs.length}.`,
    );
  }
  return errors;
}

const index = JSON.parse(await readFile(indexPath, 'utf8'));

if (mode === 'backfill-existing') {
  const updates = index.existing_directus_faqs
    .filter((faq) => faq.website_page)
    .map((faq) => ({
      id: faq.directus_id,
      website_page: faq.website_page.id,
    }));

  for (const [batchIndex, batch] of chunks(updates, BATCH_SIZE).entries()) {
    await directusRequest('items/faqs', { method: 'PATCH', body: batch });
    const appliedIds = new Set(batch.map((entry) => entry.id));
    for (const faq of index.existing_directus_faqs) {
      if (appliedIds.has(faq.directus_id)) {
        faq.relation_applied_at = new Date().toISOString();
      }
    }
    await saveIndex(index);
    console.log(JSON.stringify({ mode, batch: batchIndex + 1, updated: batch.length }));
    await sleep(REQUEST_DELAY_MS);
  }

  const currentFaqs = await listFaqs();
  const errors = validateExistingMappings(index, currentFaqs);
  if (errors.length) throw new Error(errors.join('\n'));
  index.existing_backfill_verified_at = new Date().toISOString();
  await saveIndex(index);
  console.log(JSON.stringify({ mode, verified: updates.length }));
}

if (mode === 'verify-existing') {
  const currentFaqs = await listFaqs();
  const errors = validateExistingMappings(index, currentFaqs);
  if (errors.length) throw new Error(errors.join('\n'));
  index.existing_backfill_verified_at = new Date().toISOString();
  await saveIndex(index);
  console.log(JSON.stringify({ mode, verified: index.existing_directus_faqs.length }));
}

if (mode === 'import-drafts') {
  let currentFaqs = await listFaqs();
  const existingErrors = validateExistingMappings(index, currentFaqs);
  if (existingErrors.length) throw new Error(existingErrors.join('\n'));

  const currentSonshineByChecksum = new Map(
    currentFaqs
      .filter((faq) => faq.client?.slug === 'sonshine-roofing')
      .map((faq) => [checksum(faq.question, faq.answer), faq]),
  );
  const pending = [];
  for (const faq of index.sonshine_wordpress_faqs) {
    faq.draft_payload.id ??= deterministicFaqId(faq.wordpress_id);
    const existing = currentSonshineByChecksum.get(faq.checksum);
    if (existing) {
      faq.directus_id = existing.id;
      continue;
    }
    pending.push(faq);
  }
  await saveIndex(index);

  for (const [batchIndex, batch] of chunks(pending, BATCH_SIZE).entries()) {
    let payload;
    try {
      payload = await directusRequest('items/faqs', {
        method: 'POST',
        body: batch.map((faq) => faq.draft_payload),
      });
    } catch (error) {
      await sleep(REQUEST_DELAY_MS);
      const afterAmbiguousCreate = await listFaqs();
      const reconciled = batch.map((faq) =>
        afterAmbiguousCreate.find(
          (item) =>
            item.id === faq.draft_payload.id &&
            checksum(item.question, item.answer) === faq.checksum,
        ),
      );
      if (reconciled.some((item) => !item)) throw error;
      payload = { data: reconciled };
    }
    const created = payload?.data ?? [];
    if (created.length !== batch.length) {
      throw new Error(
        `Draft batch ${batchIndex + 1} created ${created.length}/${batch.length} records.`,
      );
    }
    for (let itemIndex = 0; itemIndex < batch.length; itemIndex += 1) {
      batch[itemIndex].directus_id = created[itemIndex].id;
      batch[itemIndex].created_at = new Date().toISOString();
    }
    await saveIndex(index);
    console.log(JSON.stringify({ mode, batch: batchIndex + 1, created: batch.length }));
    await sleep(REQUEST_DELAY_MS);
  }

  currentFaqs = await listFaqs();
  const errors = validateSonshine(index, currentFaqs, ['draft', 'published']);
  if (errors.length) throw new Error(errors.join('\n'));
  index.sonshine_drafts_verified_at = new Date().toISOString();
  await saveIndex(index);
  console.log(JSON.stringify({ mode, verified: index.sonshine_wordpress_faqs.length }));
}

if (mode === 'verify-drafts' || mode === 'verify-published') {
  const currentFaqs = await listFaqs();
  const errors = [
    ...validateExistingMappings(index, currentFaqs),
    ...validateSonshine(index, currentFaqs, mode === 'verify-drafts' ? 'draft' : 'published'),
  ];
  if (errors.length) throw new Error(errors.join('\n'));
  await saveIndex(index);
  console.log(
    JSON.stringify({
      mode,
      existing_verified: index.existing_directus_faqs.length,
      sonshine_verified: index.sonshine_wordpress_faqs.length,
    }),
  );
}

if (mode === 'publish-sonshine') {
  const currentFaqs = await listFaqs();
  const draftErrors = validateSonshine(index, currentFaqs, ['draft', 'published']);
  if (draftErrors.length) throw new Error(draftErrors.join('\n'));

  const currentById = new Map(currentFaqs.map((faq) => [faq.id, faq]));
  const updates = index.sonshine_wordpress_faqs
    .filter((faq) => currentById.get(faq.directus_id)?.status !== 'published')
    .map((faq) => ({
      id: faq.directus_id,
      status: 'published',
      is_published: true,
    }));
  for (const [batchIndex, batch] of chunks(updates, BATCH_SIZE).entries()) {
    await directusRequest('items/faqs', { method: 'PATCH', body: batch });
    console.log(JSON.stringify({ mode, batch: batchIndex + 1, published: batch.length }));
    await sleep(REQUEST_DELAY_MS);
  }

  const publishedFaqs = await listFaqs();
  const errors = validateSonshine(index, publishedFaqs, 'published');
  if (errors.length) throw new Error(errors.join('\n'));
  index.sonshine_published_verified_at = new Date().toISOString();
  await saveIndex(index);
  console.log(JSON.stringify({ mode, verified: index.sonshine_wordpress_faqs.length }));
}
