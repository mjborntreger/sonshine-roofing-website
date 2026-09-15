import assert from 'node:assert/strict';
import { mkdir, open, unlink } from 'node:fs/promises';
import { planMigration, hash } from './location-migration/core.mjs';
import { argsFor, readPrivate, writePrivate, checkedPath } from './location-migration/io.mjs';
import { directusApi, executePlan, privateReceipt } from './location-migration/api.mjs';
import { inventoryWordPress, inventoryDirectus } from './location-migration/inventory.mjs';

const args = argsFor(process.argv.slice(2));
assert.ok(['inventory', 'plan', 'apply'].includes(args.mode), 'Use --mode inventory, plan, or apply');
if (args.mode === 'inventory') {
  assert.ok(['pending', 'ready'].includes(args['schema-state']), 'Explicit --schema-state pending or ready required');
  const source = await inventoryWordPress(undefined, 2);
  const approvals = args.approvals ? await readPrivate(args.approvals) : {};
  const targets = await inventoryDirectus(directusApi(), args['schema-state'] === 'ready', approvals);
  await writePrivate(args.source, source);
  await writePrivate(args.targets, targets);
  console.log(JSON.stringify({ mode: 'inventory', sourcePages: source.nodes.length, sourceHash: hash(source), targetsHash: hash(targets),
    collectionCounts: Object.fromEntries(Object.entries(targets.collections).map(([key, rows]) => [key, rows.length])) }, null, 2));
} else if (args.mode === 'plan') {
  const source = await readPrivate(args.source), targets = await readPrivate(args.targets);
  const approvals = args.approvals ? await readPrivate(args.approvals) : {};
  const previous = args.previous ? await readPrivate(args.previous) : {};
  const plan = planMigration({ source, targets, approvals, previous, createdAt: new Date().toISOString() });
  await writePrivate(args.plan, plan);
  console.log(JSON.stringify({ mode: 'dry-run', version: plan.version, planHash: plan.planHash, schemaReady: plan.schemaReady,
    operations: plan.operations.length, summary: plan.summary, blockers: plan.blockers }, null, 2));
} else {
  const plan = await readPrivate(args.plan), approval = await readPrivate(args.authorization);
  assert.ok(args['plan-hash'], 'Apply requires --plan-hash of the exact reviewed private plan');
  await mkdir(args.recovery, { mode: 0o700 });
  await checkedPath(`${args.recovery}/lock`, false);
  const lockPath = `${args.recovery}/lock`, lock = await open(lockPath, 'wx', 0o600);
  try {
    const results = await executePlan({ plan, expectedHash: args['plan-hash'], approval, api: directusApi(), receipt: privateReceipt(args.recovery) });
    await writePrivate(`${args.recovery}/result.json`, { planHash: plan.planHash, results });
    console.log(JSON.stringify({ mode: 'apply', planHash: plan.planHash, applied: results.filter(r => r.disposition === 'applied').length,
      matched: results.filter(r => r.disposition === 'match').length }));
  } finally { await lock.close(); await unlink(lockPath); }
}
