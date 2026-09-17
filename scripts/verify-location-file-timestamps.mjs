import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { stableId } from './location-migration/core.mjs';
import { prepareFileTimestampRestore, restoreFileTimestamps } from './location-migration/file-timestamps.mjs';

let checks = 0;
function fixture() {
  const sha256 = 'a'.repeat(64), id = stableId(`media-bytes:${sha256}`);
  const data = { id, title: "Synthetic O'Brien \\ roof", description: "Quoted '); DROP TABLE directus_files; -- synthetic text", filename_download: 'synthetic.webp',
    uploaded_on: '2024-01-02T03:04:05.000Z', modified_on: '2024-02-03T04:05:06.000Z' };
  const op = { key: 'synthetic-media', collection: 'directus_files', action: 'create', targetId: id, identity: { id }, sha256, data };
  const current = { ...data, uploaded_on: '2026-09-15T12:00:00.000Z', modified_on: '2026-09-15T12:00:01.000Z' };
  const { id: ignored, ...proposedAfter } = data;
  void ignored;
  return { op, current, creationReceipt: { key: op.key, collection: op.collection, action: 'create', targetId: id, identity: { id }, before: null, dateUpdated: null, proposedAfter } };
}
function check(condition) { assert.ok(condition); checks++; }
async function rejects(fn, pattern) { await assert.rejects(fn, pattern); checks++; }
const prepared = prepareFileTimestampRestore(fixture());
check(prepared.sql.includes('UPDATE public.directus_files') && prepared.sql.includes('SELECT count(*)::integer AS updated_count'));
check(prepared.sql.includes("E'Synthetic O''Brien \\\\ roof'") && prepared.sql.includes("E'Quoted ''); DROP TABLE directus_files; -- synthetic text'"));
check(['id', 'uploaded_on', 'modified_on', 'title', 'description', 'filename_download'].every(field => prepared.sql.includes(`${field} IS NOT DISTINCT FROM`)));
check(!prepared.sql.split('SET ')[1].split('\n  WHERE')[0].includes('title'));
for (const change of [
  f => { f.op.action = 'update'; }, f => { f.op.collection = 'reviews'; },
  f => { f.current.id = 'wrong-record'; }, f => { f.op.identity.id = 'wrong-record'; },
  f => { f.op.sha256 = 'b'.repeat(64); }, f => { f.current.title = 'Later editorial title'; },
  f => { f.op.data.uploaded_on = '2024-02-30T00:00:00Z'; }, f => { f.op.data.modified_on = 'not-a-date'; },
  f => { f.current.modified_on = '2024-01-01T24:00:00Z'; },
  f => { f.creationReceipt.before = {}; }, f => { delete f.creationReceipt.before; },
  f => { f.creationReceipt.key = 'another-create'; }, f => { f.creationReceipt.proposedAfter.title = 'different-intent'; },
  f => { f.op.data.unreviewed_field = 'unexpected'; }, f => { delete f.op.data.uploaded_on; delete f.op.data.modified_on; },
  f => { f.current.unreviewed_field = 'unexpected'; },
]) { const f = fixture(); change(f); assert.throws(() => prepareFileTimestampRestore(f), /Private values suppressed/); checks++; }
const f = fixture(), events = [];
const result = await restoreFileTimestamps({ ...f, receipt: async phase => { events.push(phase); }, executeSql: async () => { events.push('sql'); return 1; }, readback: async id => { assert.equal(id, f.op.data.id); events.push('readback'); return { ...f.op.data }; } });
assert.deepEqual(events, ['before', 'sql', 'readback', 'after']); check(result.updated === 1);
await rejects(() => restoreFileTimestamps({ ...fixture(), receipt: async () => {}, executeSql: async () => 0, readback: async () => assert.fail('No readback after failed precondition') }), /concurrent_change/);
await rejects(() => restoreFileTimestamps({ ...fixture(), receipt: async () => {}, executeSql: async () => 2, readback: async () => assert.fail('No readback after invalid count') }), /invalid_row_count/);
await rejects(() => restoreFileTimestamps({ ...fixture(), receipt: async () => { throw new Error('SYNTHETIC_PRIVATE'); }, executeSql: async () => assert.fail('No SQL without durable receipt'), readback: async () => {} }), /before_receipt_failed/);
await rejects(() => restoreFileTimestamps({ ...fixture(), receipt: async () => {}, executeSql: async () => { throw new Error('SYNTHETIC_PRIVATE'); }, readback: async () => {} }), error => error.message.includes('sql_failed') && !error.message.includes('SYNTHETIC_PRIVATE'));
await rejects(() => restoreFileTimestamps({ ...fixture(), receipt: async () => {}, executeSql: async () => 1, readback: async () => fixture().current }), /timestamp_readback_mismatch/);
const correct = fixture(); correct.current = { ...correct.op.data, uploaded_on: '2024-01-02T03:04:05', modified_on: '2024-02-03T05:05:06+01:00' };
const matchEvents = [];
check((await restoreFileTimestamps({ ...correct, receipt: async (phase, value) => { assert.equal(value.updated, 0); matchEvents.push(phase); },
  executeSql: async () => assert.fail('No-op SQL'), readback: async () => { matchEvents.push('readback'); return { ...correct.current }; } })).updated === 0);
assert.deepEqual(matchEvents, ['readback', 'match']); checks++;
for (const mutate of [row => { row.title = 'Later editorial title'; }, row => { row.modified_on = '2026-09-15T15:00:00Z'; }]) {
  const actual = { ...correct.current }; mutate(actual);
  await rejects(() => restoreFileTimestamps({ ...correct, receipt: async () => assert.fail('No receipt for stale input'),
    executeSql: async () => assert.fail('No SQL for stale matched input'), readback: async () => actual }), /file_metadata_changed|timestamp_readback_mismatch/);
}
await rejects(() => restoreFileTimestamps({ ...correct, receipt: async () => { throw new Error('SYNTHETIC_PRIVATE'); },
  executeSql: async () => assert.fail('No-op SQL'), readback: async () => ({ ...correct.current }) }),
error => error.message.includes('match_receipt_failed') && !error.message.includes('SYNTHETIC_PRIVATE'));
correct.current.modified_on = '2024-02-03T04:05:06.000001Z'; check(prepareFileTimestampRestore(correct).disposition === 'restore');
const partial = fixture(); delete partial.op.data.modified_on; delete partial.creationReceipt.proposedAfter.modified_on;
check(!prepareFileTimestampRestore(partial).sql.split('SET ')[1].split('\n  WHERE')[0].includes('modified_on'));
await rejects(() => restoreFileTimestamps({ ...partial, receipt: async () => {}, executeSql: async () => 1,
  readback: async () => ({ ...partial.current, uploaded_on: partial.op.data.uploaded_on, modified_on: '2026-09-15T15:00:00Z' }) }), /timestamp_readback_mismatch/);
const interrupted = fixture(); let recoveredWrites = 0;
await rejects(() => restoreFileTimestamps({ ...interrupted,
  receipt: async phase => { if (phase === 'after') throw new Error('SYNTHETIC_PRIVATE'); },
  executeSql: async () => { recoveredWrites++; return 1; }, readback: async () => ({ ...interrupted.op.data }) }),
error => error.message.includes('after_receipt_failed') && !error.message.includes('SYNTHETIC_PRIVATE'));
const recovered = await restoreFileTimestamps({ ...interrupted, current: { ...interrupted.op.data },
  receipt: async (phase, value) => { assert.equal(phase, 'match'); assert.equal(value.updated, 0); assert.equal(value.after.modified_on, interrupted.op.data.modified_on); },
  executeSql: async () => { recoveredWrites++; return 0; }, readback: async () => ({ ...interrupted.op.data }) });
check(recovered.updated === 0 && recoveredWrites === 1);

// Optional actual PostgreSQL execution in a fresh local in-memory engine only.
if (process.env.LOCATION_PGLITE_PATH) {
  const { PGlite } = await import(pathToFileURL(process.env.LOCATION_PGLITE_PATH).href);
  const db = new PGlite();
  try {
    await db.exec('CREATE TABLE directus_files(id uuid PRIMARY KEY,title text,description text,filename_download text,uploaded_on timestamptz,modified_on timestamptz);');
    const sample = fixture(), columns = Object.keys(sample.current);
    await db.query(`INSERT INTO directus_files(${columns.join(',')}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(',')})`, columns.map(k => sample.current[k]));
    const statement = prepareFileTimestampRestore(sample).sql;
    check((await db.query(statement)).rows[0].updated_count === 1);
    const row = (await db.query('SELECT * FROM directus_files')).rows[0];
    check(row.title === sample.op.data.title && row.description === sample.op.data.description);
    check(new Date(row.uploaded_on).toISOString() === sample.op.data.uploaded_on && new Date(row.modified_on).toISOString() === sample.op.data.modified_on);
    check((await db.query(statement)).rows[0].updated_count === 0);
    await db.query('UPDATE directus_files SET uploaded_on=$1,modified_on=$2,title=$3', [sample.current.uploaded_on,sample.current.modified_on,'Later editorial title']);
    check((await db.query(statement)).rows[0].updated_count === 0);
  } finally { await db.close(); }
}
console.log(`PASS: ${checks} synthetic file timestamp guards, receipts, readback, no-op and SQL checks${process.env.LOCATION_PGLITE_PATH ? ' including local PostgreSQL execution' : ''}; no external mutations.`);
