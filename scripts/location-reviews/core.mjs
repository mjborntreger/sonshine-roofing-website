// This factory is embedded verbatim into n8n Code nodes and tested locally.
// It has no network, filesystem, credentials, or workflow-environment dependency.
export function reviewSyncRuntime() {
  const sourceFields = ['author_name', 'rating', 'review_text', 'review_date', 'source', 'external_id', 'source_created_at', 'source_updated_at', 'latest_feed_member', 'latest_feed_order'];
  const fail = (reason) => { throw new Error(`Review synchronization stopped: ${reason}`); };
  const text = (value) => typeof value === 'string' ? value.trim() : '';
  const identity = (value) => /^accounts\/[^/\s]+\/locations\/[^/\s]+\/reviews\/[^/\s]+$/.test(text(value));
  const clientId = (value) => value && typeof value === 'object' ? value.id : value;
  const timestamp = (value) => {
    if (!text(value) || !Number.isFinite(Date.parse(value))) fail('missing or invalid source timestamp');
    return new Date(value).toISOString();
  };
  const equal = (field, current, desired) => {
    if (field === 'source_created_at' || field === 'source_updated_at') return timestamp(current) === timestamp(desired);
    return JSON.stringify(current ?? null) === JSON.stringify(desired ?? null);
  };
  function normalize(sourceRows) {
    if (!Array.isArray(sourceRows)) fail('source response must be an array');
    // The configured source node stops on errors. alwaysOutputData represents
    // a successful empty response only; mixed empty/malformed rows fail below.
    if (sourceRows.length === 1 && sourceRows[0] && Object.keys(sourceRows[0]).length === 0) sourceRows = [];
    const unique = new Map();
    for (const row of sourceRows) {
      if (!row || typeof row !== 'object' || !['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'].includes(row.starRating) || !identity(row.name)) fail('malformed source review');
      if (row.starRating !== 'FIVE' || !text(row.comment)) continue;
      const name = text(row.reviewer?.displayName).toLocaleLowerCase('en-US')
        .replace(/(^|[\s'’-])(\p{L})/gu, (_, prefix, letter) => prefix + letter.toLocaleUpperCase('en-US'))
        .replace(/\s+(Jr\.?|Sr\.?|II|III|IV|V)$/iu, '').trim().split(/\s+/u).filter(Boolean);
      if (!name.length) fail('missing source attribution');
      const created = timestamp(row.createTime);
      const normalized = {
        external_id: text(row.name),
        author_name: name.length === 1 ? name[0] : `${name[0]} ${Array.from(name.at(-1))[0]}.`,
        rating: 5,
        review_text: row.comment.replace(/\b(?:son\s*shine|sun\s*shine)\s+roofing\b/gi, 'SonShine Roofing').replace(/\bsonshine\b(?!\s+roofing\b)/gi, 'SonShine'),
        review_date: created.slice(0, 10),
        source_created_at: created,
        source_updated_at: timestamp(row.updateTime || row.createTime),
      };
      const previous = unique.get(normalized.external_id);
      if (previous && JSON.stringify(previous) !== JSON.stringify(normalized)) fail('conflicting duplicate source identity');
      unique.set(normalized.external_id, normalized);
    }
    const eligible = [...unique.values()].sort((a, b) => Date.parse(b.source_created_at) - Date.parse(a.source_created_at) || a.external_id.localeCompare(b.external_id));
    return { clientSlug: 'sonshine-roofing', retrievedLimit: 40, eligibleCount: eligible.length,
      targetReviews: eligible.slice(0, 20).map((row, index) => ({ ...row, latest_feed_member: true, latest_feed_order: index + 1 })) };
  }
  function validateContext(context) {
    if (!context || !context.clientId || context.clientSlug !== 'sonshine-roofing' || !Array.isArray(context.targetReviews) || context.targetReviews.length > 20) fail('invalid client or target selection');
    const seen = new Set();
    context.targetReviews.forEach((row, index) => {
      if (!identity(row.external_id) || seen.has(row.external_id) || row.rating !== 5 || !text(row.author_name) || !text(row.review_text) || row.latest_feed_member !== true || row.latest_feed_order !== index + 1) fail('invalid or duplicate target selection');
      if (row.review_date !== timestamp(row.source_created_at).slice(0, 10)) fail('review date disagrees with source creation');
      timestamp(row.source_updated_at);
      seen.add(row.external_id);
    });
  }
  function rowsForClient(input, context) {
    validateContext(context);
    if (!Array.isArray(input)) fail('target readback must be an array');
    if (input.length === 1 && input[0] && Object.keys(input[0]).length === 0) return [];
    const ids = new Set();
    const externalIds = new Set();
    for (const row of input) {
      if (!row || row.id === undefined || row.id === null || clientId(row.client) !== context.clientId || ids.has(String(row.id))) fail('invalid, duplicated or cross-client target row');
      ids.add(String(row.id));
      if (text(row.external_id)) {
        if (!identity(row.external_id) || row.source !== 'Google' || externalIds.has(row.external_id)) fail('invalid or duplicated managed identity');
        externalIds.add(row.external_id);
      }
      if (row.latest_feed_member === true && !identity(row.external_id)) fail('feed member lacks verified identity');
    }
    return input;
  }
  function sourcePayload(review) {
    const payload = { ...review, source: 'Google' };
    return Object.fromEntries(sourceFields.map((field) => [field, payload[field]]));
  }
  function planUpserts(input, context) {
    const rows = rowsForClient(input, context);
    const byExternal = new Map(rows.filter((row) => text(row.external_id)).map((row) => [row.external_id, row]));
    const actions = context.targetReviews.map((review) => {
      const payload = sourcePayload(review);
      const current = byExternal.get(review.external_id);
      if (!current) return { action: 'create', payload: { client: context.clientId, status: 'published', ...payload } };
      // Do not even include editorial or migration-owned fields in update data.
      const changed = sourceFields.some((field) => {
        if ((field === 'source_created_at' || field === 'source_updated_at') && !text(current[field])) return true;
        return !equal(field, current[field], payload[field]);
      });
      return { action: changed ? 'update' : 'noop', itemId: current.id, payload };
    });
    return actions.length ? actions : [{ action: 'noop', emptySelection: true }];
  }
  function assertTargets(rows, context) {
    const byExternal = new Map(rows.filter((row) => text(row.external_id)).map((row) => [row.external_id, row]));
    for (const review of context.targetReviews) {
      const row = byExternal.get(review.external_id);
      if (!row) fail('selected review absent from readback');
      const expected = sourcePayload(review);
      for (const field of sourceFields) if (!equal(field, row[field], expected[field])) fail(`readback mismatch in ${field}`);
    }
  }
  function planDeparture(input, context) {
    const rows = rowsForClient(input, context);
    assertTargets(rows, context);
    const target = new Set(context.targetReviews.map((row) => row.external_id));
    const stale = rows.filter((row) => !target.has(row.external_id) && (row.latest_feed_member === true || row.latest_feed_order != null));
    return stale.length ? stale.map((row) => ({ action: 'clear-membership', itemId: row.id, payload: { latest_feed_member: false, latest_feed_order: null } })) : [{ action: 'membership-noop' }];
  }
  function verifyMembership(input, context) {
    const rows = rowsForClient(input, context);
    if (rows.length !== context.targetReviews.length || rows.length > 20 || rows.some((row) => row.latest_feed_member !== true)) fail('final membership count or membership set differs');
    assertTargets(rows, context);
    return { success: true, clientSlug: context.clientSlug, eligibleCount: context.eligibleCount,
      selectedCount: rows.length, deploymentRequiredForLocations: true, cacheTag: 'directus:reviews:sonshine-roofing' };
  }
  function seedMembership(input, selectedIds, client) {
    if (!Array.isArray(selectedIds) || selectedIds.length > 20 || new Set(selectedIds).size !== selectedIds.length || selectedIds.some((id) => !identity(id))) fail('seed requires exact verified selected identities in order');
    const context = { clientSlug: 'sonshine-roofing', clientId: client, targetReviews: [] };
    const rows = rowsForClient(input, context);
    const byExternal = new Map(rows.filter((row) => text(row.external_id)).map((row) => [row.external_id, row]));
    if (selectedIds.some((id) => !byExternal.has(id))) fail('seed identity has no confirmed target match');
    return rows.flatMap((row) => {
      const index = selectedIds.indexOf(row.external_id);
      const payload = { latest_feed_member: index >= 0, latest_feed_order: index >= 0 ? index + 1 : null };
      return row.latest_feed_member === payload.latest_feed_member && (row.latest_feed_order ?? null) === payload.latest_feed_order ? [] : [{ itemId: row.id, payload }];
    });
  }
  function planRollback(beforeImages, currentRows) {
    if (!Array.isArray(beforeImages) || !Array.isArray(currentRows)) fail('invalid rollback input');
    const seen = new Set();
    for (const image of beforeImages) {
      if (!image || image.id == null || !image.client || !image.before || !Object.keys(image.before).length || !image.after || seen.has(String(image.id))) fail('invalid or duplicated rollback before-image');
      seen.add(String(image.id));
    }
    const current = new Map(currentRows.map((row) => [String(row.id), row]));
    return beforeImages.map((image) => {
      const row = current.get(String(image.id));
      if (!row || !image.after || !text(image.after.date_updated) || row.date_updated !== image.after.date_updated || clientId(row.client) !== image.client) return { disposition: 'conflict', reason: 'missing record or later modification' };
      const fields = Object.keys(image.before ?? {});
      if (fields.some((field) => ![...sourceFields, 'status', 'service_area', 'url', 'owner_reply', 'wordpress_provenance', 'sort_order'].includes(field))) fail('rollback includes undesignated fields');
      if (fields.some((field) => JSON.stringify(row[field] ?? null) !== JSON.stringify(image.after[field] ?? null))) return { disposition: 'conflict', reason: 'record differs from verified after-image' };
      return { disposition: 'restore', itemId: image.id, payload: { ...image.before } };
    });
  }
  return { normalize, validateContext, rowsForClient, planUpserts, planDeparture, verifyMembership, seedMembership, planRollback };
}

export const reviewSync = reviewSyncRuntime();
