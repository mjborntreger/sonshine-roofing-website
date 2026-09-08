import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

// Run against private source exports only. Never commit exports or credentials.
// The caller must separately authorize --apply and manage the image workflow.
const apply = process.argv.includes('--apply');
const verifyOnly = process.argv.includes('--verify-only');
assert.ok(!(apply && verifyOnly), 'Choose --apply or --verify-only.');
const vocabularyOnly = process.argv.includes('--vocabulary-only');
const sourceArg = process.argv.indexOf('--source-dir');
assert.ok(sourceArg >= 0 && process.argv[sourceArg + 1], 'Supply --source-dir with a private export directory.');
const sourceDir = await realpath(process.argv[sourceArg + 1]);
const repository = await realpath(fileURLToPath(new URL('../', import.meta.url)));
assert.ok(sourceDir !== repository && !sourceDir.startsWith(`${repository}${path.sep}`), 'CMS exports must be outside the repository.');
const json = async (name) => JSON.parse(await readFile(path.join(sourceDir, name), 'utf8'));
const clientSlug = process.env.DIRECTUS_CLIENT_SLUG;
const endpoint = process.env.DIRECTUS_URL?.replace(/\/+$/u, '');
const token = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_STATIC_TOKEN;
assert.equal(clientSlug, 'sonshine-roofing', 'This migration is scoped to SonShine Roofing.');
assert.ok(endpoint && token, 'Directus URL and a task-authorized token are required.');

async function request(collection, method = 'GET', data, query = {}) {
  const url = new URL(`items/${collection}`, `${endpoint}/`);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  });
  const payload = await response.json();
  // Do not echo API payloads: imported testimonials can contain client PII.
  const errorTypes = (payload.errors || []).map((error) => [error.extensions?.code, error.extensions?.field].filter(Boolean).join(':')).join(',');
  assert.ok(response.ok && !payload.errors, `${collection} ${method}: HTTP ${response.status} ${errorTypes}`);
  return payload.data;
}

const stableId = (value) => {
  const hash = createHash('sha256').update(`sonshine-project-migration:${value}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
};
const sourceIdentity = (id) => `wordpress:${clientSlug}:${id}`;
const clients = await request('clients', 'GET', undefined, { fields: 'id,slug', filter: { slug: { _eq: clientSlug } }, limit: 2 });
assert.equal(clients.length, 1, 'Exactly one scoped client is required.');
const client = clients[0].id;
const taxonomies = [
  ['material_type', 'roofing_material_types', 3],
  ['roof_color', 'roofing_roof_colors', 34],
  ['service_area', 'roofing_service_areas', 13],
];
const maps = {};
const summary = { mode: apply ? 'apply' : verifyOnly ? 'verify-only' : 'dry-run', vocabularies: {}, projects: 0, galleries: 0, testimonials: 0, seoDescriptionFallbacks: 0 };
for (const [sourceName, collection, expected] of taxonomies) {
  const sourceRows = await json(`wordpress-${sourceName}.json`);
  assert.equal(sourceRows.length, expected, `${sourceName}: source inventory changed; review before proceeding.`);
  const existing = await request(collection, 'GET', undefined, { fields: 'id,external_id,client,status,name,slug,sort,scope_key', filter: { client: { _eq: client } }, limit: -1 });
  const byExternal = new Map(existing.map((row) => [row.external_id, row]));
  const bySlug = new Map(existing.map((row) => [row.slug, row]));
  maps[sourceName] = new Map();
  for (const [index, row] of sourceRows.entries()) {
    const external_id = `wordpress:${clientSlug}:${sourceName}:${row.id}`;
    const prior = byExternal.get(external_id);
    assert.ok(!bySlug.has(row.slug) || bySlug.get(row.slug).id === prior?.id, `${sourceName}: competing destination slug.`);
    const mapped = { id: prior?.id || stableId(`${sourceName}:${row.id}`), client, status: 'published', name: row.name, slug: row.slug, external_id, sort: index + 1 };
    if (verifyOnly) {
      assert.ok(prior && Object.entries(mapped).every(([field, value]) => isDeepStrictEqual(prior[field], value)), `${sourceName}: destination vocabulary parity failed.`);
      assert.equal(prior.scope_key, `${clientSlug}:${row.slug}`, `${sourceName}: scope guard failed.`);
    }
    maps[sourceName].set(row.id, mapped.id);
    if (apply) await request(collection, prior ? 'PATCH' : 'POST', prior ? [mapped] : mapped, { fields: 'id' });
  }
  summary.vocabularies[collection] = sourceRows.length;
}
if (vocabularyOnly) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

const source = (await json('wordpress-projects-graphql.json')).data.projects;
const rest = await json('wordpress-projects-rest.json');
const media = await json('media-manifest.json');
assert.equal(media.images.length, 355, 'Unique image inventory changed; review before proceeding.');
for (const image of media.images) {
  assert.ok(image.destinationVerified && image.destinationSha256 === image.sha256,
    'Every project image must be imported and hash-verified before linking records.');
}
const restById = new Map(rest.map((row) => [row.id, row]));
assert.equal(source.pageInfo.hasNextPage, false, 'Source project query is incomplete.');
assert.equal(source.nodes.length, 53, 'Published inventory changed; review before proceeding.');
assert.equal(rest.length, source.nodes.length, 'REST and GraphQL inventory mismatch.');
assert.equal(new Set(source.nodes.map((row) => row.databaseId)).size, source.nodes.length);
const imageById = new Map(media.images.filter((image) => image.wpMediaId != null).map((image) => [Number(image.wpMediaId), image.directusId]));
const imageByUrl = new Map();
for (const image of [...media.images, ...(media.extras || [])]) {
  if (!image.directusId) continue;
  for (const url of [image.originalUrl, ...(image.aliases || [])].filter(Boolean)) imageByUrl.set(url, image.directusId);
}
const imageId = (node) => {
  const id = imageById.get(Number(node.databaseId)) || imageByUrl.get(node.sourceUrl);
  assert.ok(id, 'Source image is missing a verified destination mapping.');
  return id;
};
const utc = (value) => {
  assert.ok(typeof value === 'string' && value, 'Source editorial date missing.');
  const result = new Date(/[Z+-]\d*$/u.test(value) ? value : `${value}Z`).toISOString();
  return result;
};
const reviewDate = (value) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/u.test(value)) return value;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/u.exec(value);
  assert.ok(match, 'Unexpected source testimonial date.');
  return `${match[3]}-${match[2]}-${match[1]}`;
};
const existing = await request('roofing_projects', 'GET', undefined, {
  fields: 'id,external_id,slug,gallery.id,gallery.sort,gallery.directus_files_id', filter: { client: { _eq: client } }, limit: -1,
  deep: { gallery: { _limit: -1 } },
});
const byExternal = new Map(existing.map((row) => [row.external_id, row]));
const bySlug = new Map(existing.map((row) => [row.slug, row]));
const payloads = [];
for (const row of source.nodes) {
  const original = restById.get(row.databaseId);
  assert.equal(original?.status, 'publish', 'Unpublished or mismatched source record.');
  assert.equal(original.slug, row.slug, 'Source slugs disagree.');
  const prior = byExternal.get(sourceIdentity(row.databaseId));
  assert.ok(!bySlug.has(row.slug) || bySlug.get(row.slug).id === prior?.id, 'Competing destination project slug.');
  const id = prior?.id || stableId(`project:${row.databaseId}`);
  const details = row.projectDetails;
  const galleryNodes = details.projectImages.nodes;
  assert.deepEqual(galleryNodes.map((image) => image.databaseId), original.acf.project_images.map((image) => image.ID), 'Source gallery order differs between REST and GraphQL.');
  const gallery = galleryNodes.map((node, index) => ({
    id: stableId(`gallery:${row.databaseId}:${index + 1}:${node.databaseId}`),
    directus_files_id: imageId(node), sort: index + 1,
  }));
  const select = (field, required = true) => {
    const ids = original[field] || [];
    assert.ok(ids.length <= 1 && (!required || ids.length === 1), `Expected a single ${field} selection.`);
    const id = ids.length ? maps[field].get(ids[0]) : null;
    assert.ok(!ids.length || id, `Missing ${field} vocabulary mapping.`);
    return id;
  };
  const testimonial = original.acf.customer_testimonial || {};
  const hasTestimonial = Boolean(testimonial.customer_review?.trim());
  const seo = row.seo || {};
  const og = seo.openGraph || {};
  const ogUrl = og.image?.secureUrl || og.image?.url;
  const ogImage = ogUrl ? imageByUrl.get(ogUrl) : null;
  assert.ok(!ogUrl || ogImage, 'Social image is missing a verified destination mapping.');
  const published_at = utc(row.dateGmt);
  const source_updated_at = utc(row.modifiedGmt);
  const mapped = {
    id, client, status: 'published', title: row.title, slug: row.slug,
    description: details.projectDescription,
    featured_image: imageId(row.featuredImage.node),
    product_links: (details.productLinks || []).map((link) => ({ label: link.productName, href: link.productLink })),
    youtube_url: row.projectVideoInfo?.youtubeUrl || null,
    material_type: select('material_type'), roof_color: select('roof_color', false), service_area: select('service_area'),
    client_testimonial: hasTestimonial ? testimonial.customer_review : null,
    client_testimonial_name: hasTestimonial ? testimonial.customer_name || null : null,
    client_testimonial_date: hasTestimonial ? reviewDate(testimonial.review_date) : null,
    review_source: hasTestimonial ? testimonial.review_type || 'Google' : null,
    review_url: hasTestimonial ? testimonial.review_url || null : null,
    external_id: sourceIdentity(row.databaseId), published_at, source_updated_at,
    date_created: published_at, date_updated: source_updated_at,
    noindex: false, meta_title: seo.title || og.title || row.title,
    meta_description: seo.description || (og.description || details.projectDescription || '').trim().slice(0, 160),
    primary_focus_keyword: null, focus_keywords: [],
    og_title: og.title || null, og_description: og.description || null, og_image_override: ogImage || null,
    gallery,
  };
  summary.projects += 1;
  summary.galleries += gallery.length;
  summary.testimonials += Number(hasTestimonial);
  summary.seoDescriptionFallbacks += Number(!seo.description);
  payloads.push({ mapped, prior });
}
assert.equal(summary.galleries, 333, 'Complete gallery inventory changed; review before proceeding.');
if (apply) {
  for (const { mapped, prior } of payloads) {
    if (prior) {
      const desired = new Set(mapped.gallery.map((entry) => entry.id));
      const current = new Set(prior.gallery.map((entry) => entry.id));
      mapped.gallery = {
        create: mapped.gallery.filter((entry) => !current.has(entry.id)),
        update: mapped.gallery.filter((entry) => current.has(entry.id)),
        delete: prior.gallery.filter((entry) => !desired.has(entry.id)).map((entry) => entry.id),
      };
    }
    await request('roofing_projects', prior ? 'PATCH' : 'POST', prior ? [mapped] : mapped, { fields: 'id' });
  }
}
if (apply || verifyOnly) {
  const verified = await request('roofing_projects', 'GET', undefined, {
    fields: [...Object.keys(payloads[0].mapped).filter((field) => field !== 'gallery'), 'gallery.id', 'gallery.sort', 'gallery.directus_files_id'].join(','),
    filter: { client: { _eq: client } }, limit: -1, deep: { gallery: { _limit: -1, _sort: ['sort'] } },
  });
  assert.equal(verified.length, payloads.length, 'Destination inventory mismatch.');
  for (const row of verified) {
    const expected = payloads.find(({ mapped }) => mapped.id === row.id)?.mapped;
    assert.ok(expected, 'Unexpected destination record.');
    assert.equal(row.status, 'published');
    assert.equal(row.slug, expected.slug);
    for (const field of Object.keys(expected).filter((field) => !['gallery', 'published_at', 'source_updated_at', 'date_created', 'date_updated'].includes(field))) {
      assert.ok(isDeepStrictEqual(row[field], expected[field]), `Destination content parity failed for ${field}.`);
    }
    for (const field of ['published_at', 'source_updated_at', 'date_created', 'date_updated']) {
      assert.equal(Date.parse(row[field]), Date.parse(expected[field]), `Editorial date preservation failed for ${field}.`);
    }
    const sourceRow = source.nodes.find((item) => sourceIdentity(item.databaseId) === row.external_id);
    assert.deepEqual(row.gallery.map((entry) => entry.sort), sourceRow.projectDetails.projectImages.nodes.map((_, index) => index + 1));
    assert.deepEqual(row.gallery.map((entry) => entry.directus_files_id), sourceRow.projectDetails.projectImages.nodes.map(imageId));
  }
  summary.verified = true;
}
console.log(JSON.stringify(summary, null, 2));
