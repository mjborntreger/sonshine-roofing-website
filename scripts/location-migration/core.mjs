import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Parser } from 'htmlparser2';

export const VERSION = 'location-migration-v1';
export const CLIENT = 'sonshine-roofing';
export const SLUGS = ['sarasota', 'bradenton', 'lakewood-ranch', 'venice', 'north-port'];
export const DRAFT_NEIGHBORS = {
  sarasota: ['bradenton', 'lakewood-ranch', 'siesta-key', 'osprey'],
  bradenton: ['palmetto', 'lakewood-ranch', 'sarasota'],
  'lakewood-ranch': ['bradenton', 'sarasota', 'myakka-city'],
  venice: ['nokomis', 'osprey', 'north-port', 'englewood'],
  'north-port': ['venice', 'englewood', 'port-charlotte'],
};
// These source rows contain an observed duplicate or conflicting location label.
// Ordinary, unambiguous WordPress coverage assignments need no new approval.
export const GEOGRAPHY_CONFLICTS = new Set(['plantation', 'university park / west of trail area', 'arroyo / crestline / village park', 'desoto lakes', 'bay isles', 'the lake club', 'the concession']);
const sorted = value => Array.isArray(value) ? value.map(sorted) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])])) : value;
export const hash = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(sorted(value))).digest('hex');
export function stableId(key) {
  const h = hash(`${VERSION}:${key}`);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
export function plain(value) {
  const out = [];
  const parser = new Parser({ ontext: text => out.push(text), onclosetag: () => out.push(' ') }, { decodeEntities: true });
  parser.end(typeof value === 'string' ? value : '');
  return out.join('').normalize('NFKC').replace(/\s+/gu, ' ').trim();
}
export const normalized = value => plain(value).toLowerCase();
export const slugify = value => normalized(value).replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '');
export const idOf = value => value && typeof value === 'object' ? value.id : value;
export const valueAt = (row, key) => key.split('.').reduce((value, part) => value?.[part], row);
export function reviewDate(value) {
  if (!value) return null;
  let raw = String(value).trim();
  // WPGraphQL exposes this ACF date as an ISO timestamp. Keep the source's
  // calendar date (and retain its exact original in provenance), not import time.
  const timestamp = /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.exec(raw);
  if (timestamp) {
    if (Number.isNaN(Date.parse(raw))) return undefined;
    raw = timestamp[1];
  }
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/u.exec(raw);
  const date = match ? `${match[3]}-${match[1]}-${match[2]}` : raw;
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) return undefined;
  return date;
}
export function sourceTime(value) {
  if (!value) return null;
  // WordPress GMT fields are used for writes. Local timestamps are preserved in
  // the private source export only; never silently reinterpret them as UTC.
  const date = new Date(/Z$|[+-]\d{2}:\d{2}$/u.test(value) ? value : `${value}Z`);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}
export function safeUrl(value) {
  try { const url = new URL(String(value).trim()); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}
export const sourceKey = (kind, identity) => `wordpress:${CLIENT}:${kind}:${identity}`;
export const reviewKey = (page, row) => sourceKey('review', `${page.databaseId}:${hash(safeUrl(row.reviewUrl) || { author: normalized(row.reviewAuthor), text: normalized(row.review) }).slice(0, 32)}`);
export const neighborhoodKey = (page, row) => sourceKey('neighborhood', `${page.databaseId}:${slugify(row.neighborhood)}`);

function importedReviewUrl(review, approval) {
  const original = safeUrl(review.reviewUrl);
  const correction = ['correctedUrl', 'urlVerified', 'urlEvidence'].some(field => Object.hasOwn(approval ?? {}, field));
  if (!correction) return original ? review.reviewUrl : null;
  // Repair malformed source links only; never silently replace a valid source URL.
  if (original || approval.urlVerified !== true || typeof approval.urlEvidence !== 'string' || !approval.urlEvidence.trim()
    || typeof approval.correctedUrl !== 'string') return null;
  return safeUrl(approval.correctedUrl);
}

export const FIELDS = {
  roofing_service_areas: ['page_title', 'introduction', 'overview', 'overview_map', 'wordpress_location_id', 'source_updated_at', 'meta_title', 'meta_description', 'og_title', 'og_description'],
  roofing_neighborhoods: ['id', 'client', 'name', 'slug', 'service_area', 'description', 'landmarks', 'image', 'coverage_map', 'wordpress_id', 'source_updated_at', 'sort'],
  reviews: ['client', 'author_name', 'rating', 'review_text', 'owner_reply', 'review_date', 'source', 'sort_order', 'url', 'wordpress_provenance', 'service_area'],
  sponsor_service_areas: ['id', 'sponsor', 'service_area'],
  roofing_service_area_neighbors: ['id', 'service_area', 'nearby_area', 'approved', 'sort'],
  service_area_section_areas: ['id', 'section', 'service_area', 'sort'],
  navigation_items: ['service_area', 'link_type'],
  directus_files: ['id', 'title', 'description', 'filename_download', 'uploaded_on', 'modified_on'],
};
export function assertFields(op) {
  assert.ok(FIELDS[op.collection], 'Unsupported migration collection');
  const allowed = new Set(FIELDS[op.collection]);
  if (op.collection === 'roofing_service_areas' && op.action === 'create') {
    assert.ok(op.taxonomyOnly && op.data.slug === 'parrish' && op.data.page_status === 'taxonomy_only' && op.data.status === 'published', 'Only the approved Parrish coverage taxonomy may be created');
    for (const field of ['id', 'client', 'status', 'page_status', 'name', 'slug']) allowed.add(field);
    assert.deepEqual(Object.keys(op.data).sort(), ['id', 'client', 'status', 'page_status', 'name', 'slug'].sort(), 'Taxonomy create must contain no landing-page content/provenance');
  }
  if (op.action === 'create') {
    if (op.collection === 'roofing_neighborhoods' || op.collection === 'reviews') allowed.add('status');
  }
  if (op.collection === 'roofing_service_areas' && op.initialDraft) allowed.add('page_status');
  if (op.collection === 'reviews' && op.action === 'update') {
    for (const field of Object.keys(op.data)) {
      assert.ok(['wordpress_provenance', 'url', 'owner_reply', 'review_date', 'service_area'].includes(field), 'Existing review facts/publication are preserved');
      if (field !== 'wordpress_provenance') assert.ok(op.before[field] == null || op.before[field] === '', 'Only verified empty review fields may be initialized');
    }
    if (Object.keys(op.data).some(field => ['url', 'owner_reply', 'review_date'].includes(field))) assert.ok(op.verifiedFill, 'Source verification required to fill missing review facts');
  }
  if (op.collection === 'reviews' && op.data.service_area != null) assert.ok(op.verifiedInitialGeography, 'Explicit verified editorial geography required');
  for (const field of Object.keys(op.data)) assert.ok(allowed.has(field), 'Operation contains a field outside migration ownership');
  if (op.data.status !== undefined && !op.taxonomyOnly) assert.equal(op.data.status, 'draft', 'Migration creates drafts only');
  if (op.data.page_status !== undefined && !op.taxonomyOnly) assert.equal(op.data.page_status, 'draft', 'Migration initializes draft pages only');
}
export function summaryFor(entries) {
  const totals = {};
  for (const entry of entries) {
    totals[entry.kind] ||= { total: 0, create: 0, update: 0, match: 0, conflict: 0, held: 0, excluded: 0 };
    totals[entry.kind].total++;
    totals[entry.kind][entry.disposition]++;
  }
  return totals;
}

/** Pure planner. approval inputs are private, explicit editorial attestations. */
export function planMigration({ source, targets, approvals = {}, previous = {}, createdAt }) {
  assert.equal(targets.clientSlug, CLIENT, 'Wrong migration client');
  assert.ok(targets.clientId, 'Client identity required');
  const allPages = source.nodes;
  assert.ok(Array.isArray(allPages) && source.complete === true, 'Source pagination must be complete');
  assert.equal(new Set(allPages.map(p => p.databaseId)).size, allPages.length, 'Duplicate source page identity');
  const pages = allPages.filter(p => SLUGS.includes(p.slug));
  assert.deepEqual([...pages.map(p => p.slug)].sort(), [...SLUGS].sort(), 'All five preserved source pages are required');
  const rows = collection => targets.collections?.[collection] || [];
  for (const collection of ['roofing_service_areas', 'roofing_projects', 'reviews', 'sponsor_features', 'roofing_neighborhoods', 'service_area_sections']) {
    for (const row of rows(collection)) {
      const identity = idOf(row.client);
      assert.ok(identity != null ? identity === targets.clientId && (!row.client?.slug || row.client.slug === CLIENT) : row.client?.slug === CLIENT, 'Cross-client target record');
    }
  }
  const areas = new Map(rows('roofing_service_areas').map(a => [a.slug, a]));
  const areaIds = new Set(rows('roofing_service_areas').map(row => row.id));
  for (const neighborhood of rows('roofing_neighborhoods')) assert.ok(areaIds.has(idOf(neighborhood.service_area)), 'Neighborhood primary area is outside the client');
  for (const project of rows('roofing_projects')) assert.ok(areaIds.has(idOf(project.service_area)), 'Required project primary area is missing/outside the client');
  const sponsorIds = new Set(rows('sponsor_features').map(row => row.id));
  for (const row of rows('sponsor_service_areas')) assert.ok(sponsorIds.has(idOf(row.sponsor)) && areaIds.has(idOf(row.service_area)), 'Sponsor relationship crosses the client boundary');
  for (const row of rows('roofing_service_area_neighbors')) assert.ok(areaIds.has(idOf(row.service_area)) && areaIds.has(idOf(row.nearby_area)) && idOf(row.service_area) !== idOf(row.nearby_area), 'Invalid/cross-client nearby relationship');
  const sourceNeighborhoodKeys = new Set(pages.flatMap(page => (page.locationAttributes.neighborhoodsServed || []).map(hood => {
    const canonicalPage = normalized(hood.neighborhood) === 'longboat key' ? pages.find(p => p.slug === 'sarasota') : page;
    return neighborhoodKey(canonicalPage, hood);
  })));
  const entries = [], operations = [], planned = new Map(), media = new Map(), mediaLinks = [];
  const add = (kind, key, disposition, reason, extra = {}) => { const entry = { kind, key, disposition, reason, ...extra }; entries.push(entry); return entry; };
  function operation(kind, key, collection, identity, desired, existing, options = {}) {
    if (planned.has(key)) return add(kind, key, 'match', 'Duplicate source occurrence shares a canonical operation', { targetId: planned.get(key) });
    const targetId = existing?.id || desired.id;
    if (existing) {
      // Draft is a creation default, never an update to editorial publication.
      if (collection !== 'roofing_service_areas') delete desired.status;
      const fields = Object.keys(desired).filter(field => field !== 'id' && field !== 'client');
      const current = Object.fromEntries(fields.map(field => [field, existing[field] ?? null]));
      const next = Object.fromEntries(fields.map(field => [field, desired[field] ?? null]));
      if (hash(current) === hash(next)) { planned.set(key, targetId); return add(kind, key, 'match', 'Target fields already match', { targetId }); }
      const prior = previous[key];
      const recordedAfterHash = prior?.after ? hash(Object.fromEntries(fields.map(field => [field, prior.after[field] ?? null]))) : prior?.afterHash;
      if (!options.initialDraft && !options.initialNavigation && !options.appendProvenance && (!prior || hash(current) !== recordedAfterHash)) return add(kind, key, 'conflict', 'Target fields differ from recorded migration after-image', { targetId });
      if (options.initialDraft && (existing.wordpress_location_id || existing.page_title || existing.introduction || existing.overview || (existing.page_status && existing.page_status !== 'taxonomy_only'))) return add(kind, key, 'conflict', 'Existing page content/publication requires editorial review', { targetId });
      const op = { key, collection, action: 'update', identity, targetId, data: next,
        before: current, expectedDateUpdated: existing.date_updated ?? null, beforeHash: hash(current), ...options };
      assertFields(op); operations.push(op); planned.set(key, targetId);
      return add(kind, key, 'update', 'Narrow update with modification precondition', { targetId });
    }
    const op = { key, collection, action: 'create', identity, targetId, data: desired, ...options };
    assertFields(op); operations.push(op); planned.set(key, targetId);
    return add(kind, key, 'create', 'Create with stable identity and duplicate readback', { targetId });
  }
  if ((targets.coverageSources || []).some(row => row.slug === 'parrish')) {
    const existing = areas.get('parrish'), key = 'coverage-taxonomy:parrish';
    if (existing) {
      assert.ok(existing.scope_key === `${CLIENT}:parrish`, 'Parrish canonical scope conflict');
      add('taxonomy', key, 'match', 'Existing canonical coverage taxonomy retained', { targetId: existing.id });
    } else {
      const area = { id: stableId(key), client: targets.clientId, name: 'Parrish', slug: 'parrish', status: 'published', page_status: 'taxonomy_only' };
      operation('taxonomy', key, 'roofing_service_areas', { client: targets.clientId, slug: 'parrish' }, area, null, { taxonomyOnly: true, expectedScopeKey: `${CLIENT}:parrish` });
      areas.set('parrish', area);
    }
  }
  for (const page of allPages.filter(p => !SLUGS.includes(p.slug))) add('pages', sourceKey('location', page.databaseId), 'excluded', 'Additional location pages are outside this release');
  for (const page of pages) {
    const area = areas.get(page.slug);
    assert.ok(area && area.status === 'published', 'Preserved route has no published canonical taxonomy owner');
    const key = sourceKey('location', page.databaseId);
    const mapped = { page_title: `Roofing in ${area.name || page.locationAttributes.locationName || page.slug}`,
      introduction: `Explore roofing services, coverage, and published projects in ${area.name || page.locationAttributes.locationName || page.slug}.`,
      wordpress_location_id: String(page.databaseId), source_updated_at: sourceTime(page.modifiedGmt),
      page_status: 'draft' };
    // Page copy and indexing are reviewed independently; preserve the original SEO
    // privately and do not transfer stale relative dates or unsupported claims.
    if (area.wordpress_location_id && area.wordpress_location_id !== String(page.databaseId)) add('pages', key, 'conflict', 'Canonical area already has another WordPress page identity');
    else {
      const initialDraft = !area.wordpress_location_id;
      if (!initialDraft) delete mapped.page_status;
      operation('pages', key, 'roofing_service_areas', { client: targets.clientId, id: area.id }, mapped, area, { initialDraft });
    }
    const attrs = page.locationAttributes;
    const images = [{ node: attrs.map?.node, ownerKey: key, field: 'overview_map', ownerId: area.id, collection: 'roofing_service_areas' }];
    for (const [index, hood] of (attrs.neighborhoodsServed || []).entries()) {
      const rawKey = neighborhoodKey(page, hood), sourceName = plain(hood.neighborhood);
      const longboat = normalized(sourceName) === 'longboat key';
      const canonicalPage = longboat ? pages.find(p => p.slug === 'sarasota') : page;
      const canonicalKey = longboat ? neighborhoodKey(canonicalPage, hood) : rawKey;
      const approval = approvals.neighborhoods?.[rawKey];
      // Correct a verified display name without changing the stable source identity.
      const name = approval?.nameVerified && approval.geographyVerified && approval.evidence ? plain(approval.name) : sourceName;
      const hasConflict = GEOGRAPHY_CONFLICTS.has(normalized(sourceName));
      const ownerSlug = longboat ? 'sarasota' : approval?.serviceAreaSlug || (!hasConflict ? page.slug : null);
      const owner = areas.get(ownerSlug);
      let result;
      if (!sourceName || !name) result = add('neighborhoods', rawKey, 'held', 'Real neighborhood name is required');
      else if (!longboat && (!owner || (hasConflict && (!approval?.geographyVerified || !approval?.evidence)))) result = add('neighborhoods', rawKey, 'held', 'Conflicting source geography requires verification');
      else {
        const existing = rows('roofing_neighborhoods').filter(row => row.wordpress_id === canonicalKey || (row.slug === slugify(name) && idOf(row.client) === targets.clientId));
        const retiredSourceNames = rows('roofing_neighborhoods').some(row => row.wordpress_id?.startsWith(sourceKey('neighborhood', `${canonicalPage.databaseId}:`)) && !sourceNeighborhoodKeys.has(row.wordpress_id));
        if (!existing.length && retiredSourceNames) result = add('neighborhoods', rawKey, 'conflict', 'Possible source rename: prior name disappeared; stable identity must be reconciled before create');
        else if (existing.length > 1 || (existing[0] && existing[0].wordpress_id !== canonicalKey)) result = add('neighborhoods', rawKey, 'conflict', 'Competing neighborhood name/source identity');
        else result = operation('neighborhoods', canonicalKey, 'roofing_neighborhoods', { client: targets.clientId, wordpress_id: canonicalKey }, {
          id: existing[0]?.id || stableId(canonicalKey), client: targets.clientId, status: 'draft', name, slug: slugify(name),
          service_area: owner.id, description: approval?.descriptionVerified ? plain(approval.description) || null : existing[0]?.description ?? null,
          wordpress_id: canonicalKey, source_updated_at: sourceTime(canonicalPage.modifiedGmt), sort: index,
        }, existing[0]);
      }
      add('relationships', `${rawKey}:primary-area`, result.disposition === 'held' || result.disposition === 'conflict' ? result.disposition : 'match', 'Primary area is part of its neighborhood operation');
      images.push({ node: hood.neighborhoodImage?.node, ownerKey: canonicalKey, occurrenceKey: rawKey, field: 'image', ownerId: result.targetId, collection: 'roofing_neighborhoods',
        ...(longboat && page.slug !== 'sarasota' ? { excludeReason: 'Duplicate Longboat owner photo retained only in WordPress; canonical Sarasota photo is used' } : {}) });
    }
    for (const image of images) {
      if (!image.node) continue;
      const key = sourceKey('media', image.node.databaseId);
      if (!media.has(key)) media.set(key, { ...image.node, key, used: !image.excludeReason });
      else if (!image.excludeReason) media.get(key).used = true;
      mediaLinks.push({ ...image, mediaKey: key });
    }
    for (const review of attrs.featuredReviews || []) {
      const key = reviewKey(page, review), approval = approvals.reviews?.[key];
      const url = importedReviewUrl(review, approval);
      const candidates = rows('reviews').filter(row => (row.wordpress_provenance || []).some(p => p.key === key));
      const explicitTarget = approval?.targetId != null;
      const matched = explicitTarget ? rows('reviews').filter(row => row.id === approval.targetId) : candidates;
      let result, scoped = false;
      if (explicitTarget && (matched.length !== 1 || candidates.some(row => row.id !== matched[0].id))) result = add('reviews', key, 'conflict', 'Explicit review target is missing or disagrees with canonical provenance');
      else if (matched.length > 1) result = add('reviews', key, 'conflict', 'More than one canonical review match');
      else if (matched[0] && (!Object.hasOwn(matched[0], 'external_id') || matched[0].external_id !== null)) result = add('reviews', key, 'conflict', 'Static location import cannot modify a Google-managed or incomplete review identity');
      else if (!approval?.sourceVerified || !approval?.evidence || !Number.isInteger(approval.rating) || approval.rating < 1 || approval.rating > 5 || !url || reviewDate(review.reviewDate) === undefined) result = add('reviews', key, 'held', 'Verified rating/source/link/date facts required; absent date remains null');
      else {
        const provenance = { key, location_post_id: String(page.databaseId), source_url: review.reviewUrl, source_review_date: review.reviewDate || null };
        const geography = approval.geographyVerified && approval.geographyEvidence && approval.serviceAreaSlug ? areas.get(approval.serviceAreaSlug) : null;
        const geographyConflict = approval.serviceAreaSlug && (!geography || geography.status !== 'published');
        if (matched[0]) {
          const prior = matched[0];
          const sourceFills = { url, owner_reply: plain(review.ownerReply) || null, review_date: reviewDate(review.reviewDate) };
          const differing = Object.entries(sourceFills).some(([field, value]) => value != null && prior[field] != null && prior[field] !== '' && prior[field] !== value);
          const assignedElsewhere = geography && idOf(prior.service_area) != null && idOf(prior.service_area) !== geography.id;
          if (prior.rating !== approval.rating || !approval.matchVerified || geographyConflict || differing || assignedElsewhere) result = add('reviews', key, 'conflict', 'Review match, existing source facts, or editorial geography conflicts with import');
          else {
            const existing = prior.wordpress_provenance || [];
            const fills = Object.fromEntries(Object.entries(sourceFills).filter(([field, value]) => value != null && (prior[field] == null || prior[field] === '')));
            if (geography && idOf(prior.service_area) == null) fills.service_area = geography.id;
            scoped = Boolean(geography);
            result = operation('reviews', key, 'reviews', { client: targets.clientId, id: prior.id }, {
              wordpress_provenance: existing.some(p => p.key === key) ? existing : [...existing, provenance],
              ...fills,
            }, prior, { appendProvenance: true, verifiedFill: true, verifiedInitialGeography: Boolean(geography) });
          }
        } else if (geographyConflict) result = add('reviews', key, 'conflict', 'Requested initial review geography is not verified');
        else {
          scoped = Boolean(geography);
          result = operation('reviews', key, 'reviews', { client: targets.clientId, provenanceKey: key }, {
            client: targets.clientId, status: 'draft', author_name: plain(review.reviewAuthor), rating: approval.rating,
            review_text: plain(review.review), owner_reply: plain(review.ownerReply) || null,
            review_date: reviewDate(review.reviewDate), source: 'Google', sort_order: 0,
            url, wordpress_provenance: [provenance],
            ...(geography ? { service_area: geography.id } : {}),
          }, null, { verifiedInitialGeography: Boolean(geography) });
        }
      }
      add('relationships', `${key}:service-area`, scoped && result.disposition !== 'conflict' ? 'match' : 'held', scoped ? 'Verified initial editorial geography is included in review operation' : 'Editors own review geography; source/rating or explicit assignment verification remains pending');
    }
  }
  const mediaDestinations = new Map(), bytesPlanned = new Map();
  for (const image of media.values()) {
    if (!image.used) { add('media', image.key, 'excluded', 'Source asset belongs only to an excluded duplicate owner presentation; original retained'); continue; }
    const approval = approvals.media?.[image.key];
    if (!approval?.descriptionVerified || !plain(approval.description) || !approval?.coverageNoCustomerPins || !approval?.sha256 || !approval?.localPath) {
      add('media', image.key, 'held', 'Byte hash, described image, map privacy, and local-file review required'); continue;
    }
    assert.match(approval.sha256, /^[a-f0-9]{64}$/u, 'Invalid media byte digest');
    const id = stableId(`media-bytes:${approval.sha256}`), prior = rows('directus_files').find(row => row.id === id);
    if (bytesPlanned.has(approval.sha256)) { mediaDestinations.set(image.key, id); add('media', image.key, 'match', 'Duplicate source bytes reuse the immutable canonical file', { targetId: id }); continue; }
    if (prior && prior.migration_verified_sha256 !== approval.sha256) { add('media', image.key, 'conflict', 'Existing file needs destination-byte verification'); continue; }
    mediaDestinations.set(image.key, id);
    if (prior) { add('media', image.key, 'match', 'Existing immutable file hash verified', { targetId: id }); bytesPlanned.set(approval.sha256, id); continue; }
    operation('media', image.key, 'directus_files', { id }, {
      id, title: plain(approval.description), description: plain(approval.description), filename_download: `${image.databaseId}-${slugify(approval.description).slice(0, 50)}.${approval.extension || 'webp'}`,
      ...(sourceTime(image.dateGmt) ? { uploaded_on: sourceTime(image.dateGmt) } : {}),
      ...(sourceTime(image.modifiedGmt) ? { modified_on: sourceTime(image.modifiedGmt) } : {}),
    }, null, { localPath: approval.localPath, sha256: approval.sha256, mimeType: `image/${approval.extension || 'webp'}` });
    bytesPlanned.set(approval.sha256, id);
  }
  for (const link of mediaLinks) {
    const key = `${link.occurrenceKey || link.ownerKey}:${link.field}`, fileId = mediaDestinations.get(link.mediaKey);
    if (link.excludeReason) { add('relationships', key, 'excluded', link.excludeReason); continue; }
    if (!fileId || !link.ownerId) { add('relationships', key, 'held', 'Reviewed media and resolved canonical owner required'); continue; }
    const ownerOp = operations.find(op => op.key === link.ownerKey);
    const existing = rows(link.collection).find(row => row.id === link.ownerId);
    if (ownerOp) {
      if (ownerOp.data[link.field] && ownerOp.data[link.field] !== fileId) { add('relationships', key, 'held', 'Multiple source photos compete for one canonical neighborhood image'); continue; }
      if (existing?.[link.field] && idOf(existing[link.field]) !== fileId) { add('relationships', key, 'conflict', 'Existing editorial image relation is preserved'); continue; }
      ownerOp.data[link.field] = fileId;
      if (ownerOp.action === 'update') {
        ownerOp.before[link.field] = idOf(existing?.[link.field]) ?? null;
        ownerOp.beforeHash = hash(ownerOp.before);
      }
      add('relationships', key, 'update', 'Reviewed media relation is included in canonical owner operation');
    } else if (idOf(existing?.[link.field]) === fileId) add('relationships', key, 'match', 'Canonical media relation already matches');
    else add('relationships', key, 'held', 'A separate editorial image update requires reviewed before-image');
  }
  const junction = (collection, key, fields, row) => {
    const existing = rows(collection).filter(item => Object.entries(fields).every(([field, value]) => idOf(item[field]) === value));
    if (existing.length > 1) return add('relationships', key, 'conflict', 'Duplicate canonical relationship pair');
    if (existing.length) return add('relationships', key, 'match', 'Canonical relationship already exists', { targetId: existing[0].id });
    return operation('relationships', key, collection, fields, { id: stableId(key), ...fields, ...row }, null);
  };
  for (const sponsor of rows('sponsor_features')) for (const [index, slug] of (sponsor.service_area_slugs || []).entries()) {
    const key = `sponsor:${sponsor.id}:area:${slug}`, area = areas.get(slug);
    if (!area) { add('relationships', key, 'held', 'Legacy sponsor area has no canonical match'); continue; }
    if ((sponsor.service_area_slugs || []).indexOf(slug) !== index) { add('relationships', key, 'match', 'Duplicate source sponsor association'); continue; }
    junction('sponsor_service_areas', key, { sponsor: sponsor.id, service_area: area.id }, {});
  }
  for (const [slug, neighbors] of Object.entries(DRAFT_NEIGHBORS)) for (const [sort, nearby] of neighbors.entries()) {
    const key = `nearby:${slug}:${nearby}`;
    if (!approvals.neighbors?.[key]?.approved || !approvals.neighbors[key].evidence) { add('relationships', key, 'held', 'Owner approval required for direct nearby eligibility'); continue; }
    assert.ok(slug !== nearby && areas.has(slug) && areas.has(nearby), 'Invalid nearby relationship');
    junction('roofing_service_area_neighbors', key, { service_area: areas.get(slug).id, nearby_area: areas.get(nearby).id }, { approved: true, sort });
  }
  for (const project of rows('roofing_projects')) add('enrichment', `project:${project.id}`, 'held', 'Project enrichment is tracked in a separate private artifact and is not applied by the location import');
  for (const record of targets.coverageSources || []) {
    const area = areas.get(record.slug), key = `coverage:${record.section}:${record.index}`;
    if (!area) add('relationships', key, 'held', 'Coverage name/link has no verified canonical match');
    else junction('service_area_section_areas', key, { section: record.section, service_area: area.id }, { sort: record.index });
  }
  for (const record of targets.navigationSources || []) {
    const area = areas.get(record.slug), key = `navigation:${record.id}`;
    if (!area) add('relationships', key, 'held', 'Navigation link has no canonical service-area match');
    else operation('relationships', key, 'navigation_items', { id: record.id }, { service_area: area.id, link_type: 'service_area' }, record, { initialNavigation: true });
  }
  // File creation/readback precedes references in page/neighborhood mutations.
  operations.sort((a, b) => Number(b.collection === 'directus_files') - Number(a.collection === 'directus_files'));
  const plan = { version: VERSION, contract: 'v3', createdAt, sourceHash: hash(source), targetsHash: hash(targets), approvalsHash: hash(approvals),
    clientSlug: CLIENT, clientId: targets.clientId, endpointHash: targets.endpointHash, schemaReady: targets.schemaReady === true,
    blockers: [...(targets.schemaReady ? [] : ['Additive schema and permissions are not applied/verified']), 'AccuLynx enrichment and subsequent SonShine constraints incomplete'],
    entries, operations, summary: summaryFor(entries) };
  return { ...plan, planHash: hash(plan) };
}

export function verifyPlan(plan, expectedHash) {
  const { planHash, ...body } = plan;
  assert.equal(plan.version, VERSION, 'Incompatible migration artifact');
  assert.equal(plan.contract, 'v3', 'Incompatible shared contract');
  assert.equal(planHash, expectedHash, 'Exact approved plan hash required');
  assert.equal(hash(body), planHash, 'Plan contents changed');
  assert.equal(plan.clientSlug, CLIENT, 'Wrong client');
  assert.ok(plan.schemaReady, 'Additive schema/permission readback required before apply');
  for (const op of plan.operations) assertFields(op);
}
