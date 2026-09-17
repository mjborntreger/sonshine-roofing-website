import assert from 'node:assert/strict';
import { CLIENT, SLUGS, DRAFT_NEIGHBORS, FIELDS, hash, plain, slugify, stableId } from './core.mjs';
import { readAll } from './api.mjs';

export const WORDPRESS_ENDPOINT = 'https://wp.sonshineroofing.com/graphql';
export const LOCATION_QUERY = `query($after:String,$first:Int!){locations(first:$first,after:$after,where:{status:PUBLISH,orderby:{field:DATE,order:ASC}}){pageInfo{hasNextPage endCursor} nodes{id databaseId slug title date dateGmt modified modifiedGmt renderedContent:content(format:RENDERED) locationAttributes{locationName nearbyLandmarks{landmark} map{node{databaseId sourceUrl altText date dateGmt modified modifiedGmt mimeType mediaDetails{width height}}} featuredReviews{reviewAuthor review reviewUrl reviewDate ownerReply} neighborhoodsServed{neighborhood neighborhoodDescription zipCodes{zipCode} neighborhoodImage{node{databaseId sourceUrl altText date dateGmt modified modifiedGmt mimeType mediaDetails{width height}}}}} seo{title description canonicalUrl openGraph{title description image{url}}}}}}`;
export async function inventoryWordPress(fetchPage = async variables => {
  const response = await fetch(WORDPRESS_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: LOCATION_QUERY, variables }) });
  assert.ok(response.ok, `WordPress inventory failed (HTTP ${response.status})`);
  const result = await response.json();
  assert.ok(!result.errors && result.data?.locations, 'WordPress query/schema failure; response suppressed');
  return result.data.locations;
}, first = 25) {
  const nodes = [], cursors = new Set(), ids = new Set();
  let after = null, pages = 0;
  let more = true;
  while (more) {
    const result = await fetchPage({ first, after });
    assert.ok(Array.isArray(result.nodes) && result.pageInfo && typeof result.pageInfo.hasNextPage === 'boolean', 'Incomplete WordPress connection');
    for (const node of result.nodes) {
      assert.ok(node.databaseId && !ids.has(node.databaseId), 'Duplicate/missing WordPress source ID');
      assert.equal(typeof node.renderedContent, 'string', 'WordPress rendered content unavailable; export is incomplete');
      ids.add(node.databaseId);
      nodes.push({ ...node, contentAvailability: node.renderedContent.trim() ? 'available' : 'available-empty' });
    }
    pages++;
    more = result.pageInfo.hasNextPage;
    if (!more) break;
    after = result.pageInfo.endCursor;
    assert.ok(after && !cursors.has(after), 'Repeated/missing WordPress cursor'); cursors.add(after);
    assert.ok(pages < 10000, 'WordPress pagination safety limit');
  }
  return { version: 'wordpress-location-source-v2', contentFormat: 'rendered-html', capturedAt: new Date().toISOString(), complete: true, pages, nodes };
}
export async function inventoryDirectus(api, schemaReady, approvals = {}) {
  const clients = await api.request('items/clients', { query: { fields: 'id,slug', filter: { slug: { _eq: CLIENT } }, limit: 2 } });
  assert.equal(clients.length, 1, 'Exactly one intended client is required');
  const clientId = clients[0].id, collections = {};
  const fields = {
    roofing_service_areas: ['id', 'client', 'status', 'name', 'slug', 'external_id', 'scope_key', 'date_updated'],
    roofing_projects: ['id', 'client', 'status', 'slug', 'service_area', 'date_updated'],
    reviews: ['id', 'client', 'status', 'author_name', 'rating', 'review_text', 'owner_reply', 'review_date', 'source', 'sort_order', 'url', 'external_id', 'source_created_at', 'source_updated_at', 'date_updated'],
    sponsor_features: ['id', 'client', 'slug', 'status', 'service_area_slugs', 'sort', 'date_updated'],
    service_area_sections: ['id', 'client', 'service_areas', 'path_overrides'],
  };
  if (schemaReady) {
    fields.roofing_service_areas.push('page_status', ...FIELDS.roofing_service_areas);
    fields.reviews.push('service_area', 'wordpress_provenance');
    fields.roofing_neighborhoods = ['status', 'date_updated', ...FIELDS.roofing_neighborhoods];
  }
  for (const [collection, columns] of Object.entries(fields)) collections[collection] = await readAll((page, limit) => api.request(`items/${collection}`, { query: {
    fields: [...new Set(columns)].join(','), filter: { client: { _eq: clientId } }, sort: 'id', page, limit,
  } }));
  const navigation = await readAll((page, limit) => api.request('items/navigation_items', { query: {
    fields: ['id', 'menu.client', 'url', 'link_type', 'label', 'sort', 'status', 'date_updated', ...(schemaReady ? ['service_area'] : [])].join(','), filter: { menu: { client: { _eq: clientId } } }, sort: 'id', page, limit,
  } }));
  if (schemaReady) {
    const filters = {
      sponsor_service_areas: { sponsor: { client: { _eq: clientId } } },
      roofing_service_area_neighbors: { service_area: { client: { _eq: clientId } } },
      service_area_section_areas: { section: { client: { _eq: clientId } } },
    };
    for (const [collection, filter] of Object.entries(filters)) collections[collection] = await readAll((page, limit) => api.request(`items/${collection}`, { query: { fields: ['date_updated', ...FIELDS[collection]].join(','), filter, sort: 'id', page, limit } }));
    // Inventory only deterministic file IDs in this reviewed private migration.
    const ids = [...new Set(Object.values(approvals.media || {}).filter(item => /^[a-f0-9]{64}$/u.test(item.sha256 || '')).map(item => stableId(`media-bytes:${item.sha256}`)))];
    collections.directus_files = ids.length ? await readAll((page, limit) => api.request('files', { query: {
      fields: FIELDS.directus_files.join(','), filter: { id: { _in: ids } }, sort: 'id', page, limit,
    } })) : [];
    for (const file of collections.directus_files) {
      const actualHash = await api.fileHash(file.id);
      file.migration_verified_sha256 = actualHash;
    }
  }
  const areas = collections.roofing_service_areas;
  const canonical = value => {
    const text = plain(value).toLowerCase().replace(/,?\s+fl(?:orida)?$/u, '');
    return areas.find(area => area.slug === text || area.name.toLowerCase() === text)?.slug || (slugify(text) === 'parrish' ? 'parrish' : null);
  };
  const coverageSources = [];
  for (const section of collections.service_area_sections) for (const [index, item] of (section.service_areas || []).entries()) {
    const name = typeof item === 'string' ? item : item.service_area || item.name || item.label;
    coverageSources.push({ section: section.id, index, slug: canonical(name) || null });
  }
  const navigationSources = navigation.filter(row => /^\/locations\/[^/?#]+\/?$/u.test(row.url || ''))
    .map(row => ({ ...row, slug: row.url.split('/')[2] }));
  return { version: 'directus-location-target-v1', capturedAt: new Date().toISOString(), schemaReady, endpointHash: api.endpointHash,
    clientSlug: CLIENT, clientId, collections, coverageSources, navigationSources,
    expectedInitialRoutes: SLUGS, draftNeighborsHash: hash(DRAFT_NEIGHBORS) };
}
