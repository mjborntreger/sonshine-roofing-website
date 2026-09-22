import { stableId } from '../lib/stable-id.mjs';

const VERSION = 'location-file-timestamps-v1';
const TIME_FIELDS = ['uploaded_on', 'modified_on'];
const METADATA_FIELDS = ['title', 'description', 'filename_download'];
const own = (value, field) => Object.hasOwn(value, field);
function requireSafe(condition, code) {
  if (!condition) throw new Error(`File timestamp restore stopped: ${code}. Private values suppressed.`);
}
function timestamp(value, nullable = false) {
  if (value === null && nullable) return null;
  requireSafe(typeof value === 'string', 'invalid_timestamp');
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})?$/u.exec(value);
  requireSafe(match && Number(match[2]) < 24 && Number(match[3]) < 60 && Number(match[4]) < 60, 'invalid_timestamp');
  const calendar = new Date(`${match[1]}T00:00:00Z`);
  requireSafe(Number.isFinite(calendar.valueOf()) && calendar.toISOString().slice(0, 10) === match[1], 'invalid_timestamp');
  // Directus can omit the suffix for UTC timestamp columns. Preserve microseconds
  // in comparisons so a sub-millisecond later modification never becomes a match.
  const parsed = new Date(match[6] ? value : `${value}Z`);
  requireSafe(Number.isFinite(parsed.valueOf()), 'invalid_timestamp');
  return `${parsed.toISOString().slice(0, -1)}${(match[5] || '').padEnd(6, '0').slice(3)}Z`;
}
function literal(value) {
  if (value === null) return 'NULL';
  requireSafe(typeof value === 'string' && !value.includes('\0'), 'invalid_sql_value');
  // Explicit escape strings work independently of standard_conforming_strings.
  return `E'${value.replaceAll('\\', '\\\\').replaceAll("'", "''")}'`;
}

/** Only a newly created migration file with its original absent-before receipt qualifies.
 * The returned SQL and receipt projections are private artifacts, never log output.
 */
export function prepareFileTimestampRestore({ op, current, creationReceipt }) {
  requireSafe(op?.action === 'create' && op.collection === 'directus_files', 'not_migration_file_create');
  requireSafe(op.data && current && creationReceipt, 'missing_restore_evidence');
  requireSafe(typeof op.key === 'string' && /^[a-f0-9]{64}$/u.test(op.sha256 || ''), 'invalid_migration_identity');
  const id = stableId(`media-bytes:${op.sha256}`);
  requireSafe(op.data.id === id && op.identity?.id === id && op.targetId === id && current.id === id, 'file_identity_mismatch');
  requireSafe(Object.keys(op.data).every(field => ['id', ...METADATA_FIELDS, ...TIME_FIELDS].includes(field)), 'unexpected_planned_field');
  requireSafe(own(current, 'id') && Object.keys(current).every(field => ['id', ...METADATA_FIELDS, ...TIME_FIELDS].includes(field)), 'unexpected_current_field');
  requireSafe(METADATA_FIELDS.every(field => own(op.data, field) && own(current, field)
    && (typeof op.data[field] === 'string' || op.data[field] === null)
    && current[field] === op.data[field]), 'file_metadata_changed');
  const supplied = TIME_FIELDS.filter(field => own(op.data, field));
  requireSafe(supplied.length > 0 && TIME_FIELDS.every(field => own(current, field)), 'missing_timestamp_fields');
  for (const field of supplied) timestamp(op.data[field]);
  for (const field of TIME_FIELDS) timestamp(current[field], true);
  requireSafe(creationReceipt.key === op.key && creationReceipt.collection === op.collection
    && creationReceipt.action === 'create' && creationReceipt.targetId === id
    && creationReceipt.identity?.id === id && own(creationReceipt, 'before') && creationReceipt.before === null
    && creationReceipt.dateUpdated === null, 'missing_absent_before_receipt');
  const plannedFields = Object.keys(op.data).filter(field => field !== 'id');
  requireSafe(creationReceipt.proposedAfter && plannedFields.every(field => own(creationReceipt.proposedAfter, field)
    && creationReceipt.proposedAfter[field] === op.data[field]), 'creation_intent_mismatch');
  const before = Object.fromEntries([...METADATA_FIELDS, ...TIME_FIELDS].map(field => [field, current[field]]));
  const after = { ...before, ...Object.fromEntries(supplied.map(field => [field, op.data[field]])) };
  const match = supplied.every(field => timestamp(current[field], true) === timestamp(op.data[field]));
  const conditions = [`id IS NOT DISTINCT FROM ${literal(id)}::uuid`,
    ...[...TIME_FIELDS, ...METADATA_FIELDS].map(field => `${field} IS NOT DISTINCT FROM ${literal(TIME_FIELDS.includes(field) ? timestamp(before[field], true) : before[field])}`)];
  const sql = match ? null : `WITH restored AS (\n  UPDATE public.directus_files\n  SET ${supplied.map(field => `${field} = ${literal(timestamp(after[field]))}`).join(', ')}\n  WHERE ${conditions.join('\n    AND ')}\n  RETURNING id\n) SELECT count(*)::integer AS updated_count FROM restored;`;
  return { version: VERSION, id, key: op.key, disposition: match ? 'match' : 'restore', before, after, sql };
}

/** executeSql(sql) returns the numeric updated_count; readback(id) reads Directus.
 * receipt(phase, value) must durably flush a new private artifact before resolving.
 * The coordinator owns the authorized connection, edit pause and original receipt.
 */
export async function restoreFileTimestamps({ op, current, creationReceipt, executeSql, readback, receipt }) {
  const prepared = prepareFileTimestampRestore({ op, current, creationReceipt });
  requireSafe([executeSql, readback, receipt].every(value => typeof value === 'function'), 'missing_guarded_callback');
  const evidence = { version: VERSION, collection: 'directus_files', key: prepared.key, targetId: prepared.id,
    fields: TIME_FIELDS.filter(field => own(op.data, field)), before: prepared.before, proposedAfter: prepared.after };
  async function verifiedReadback() {
    let actual;
    try { actual = await readback(prepared.id); }
    catch { throw new Error('File timestamp restore stopped: readback_failed. Inspect private recovery receipts.'); }
    const verified = prepareFileTimestampRestore({ op, current: actual, creationReceipt });
    requireSafe(verified.disposition === 'match' && TIME_FIELDS.every(field => timestamp(actual[field], true) === timestamp(prepared.after[field], true)), 'timestamp_readback_mismatch');
    return verified;
  }
  if (prepared.disposition === 'match') {
    // A prior SQL update may have completed before its after-receipt failed.
    // Re-read and preserve durable evidence even when no update remains necessary.
    const verified = await verifiedReadback();
    try { await receipt('match', { ...evidence, after: verified.before, updated: 0 }); }
    catch { throw new Error('File timestamp restore stopped: match_receipt_failed. Inspect private recovery receipts.'); }
    return { disposition: 'match', updated: 0 };
  }
  try { await receipt('before', evidence); }
  catch { throw new Error('File timestamp restore stopped: before_receipt_failed. Private values suppressed.'); }
  let updated;
  try { updated = await executeSql(prepared.sql); }
  catch { throw new Error('File timestamp restore stopped: sql_failed. Inspect private recovery receipts.'); }
  requireSafe(updated === 1, 'concurrent_change_or_invalid_row_count');
  const verified = await verifiedReadback();
  try { await receipt('after', { ...evidence, after: verified.before, updated: 1 }); }
  catch { throw new Error('File timestamp restore stopped: after_receipt_failed. Inspect private recovery receipts.'); }
  return { disposition: 'restored', updated: 1 };
}
