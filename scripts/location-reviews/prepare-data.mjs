import { reviewSync } from './core.mjs';
import { argumentsFor, readPrivateJson, writePrivateJson } from './private-files.mjs';

try {
  const args = argumentsFor(process.argv.slice(2));
  if (Object.keys(args).some((key) => !['mode', 'input', 'out'].includes(key)) || !['seed', 'rollback'].includes(args.mode) || !args.input || !args.out) throw new Error('Usage: prepare-data.mjs --mode seed|rollback --input PRIVATE_JSON --out NEW_PRIVATE_JSON');
  const input = await readPrivateJson(args.input);
  let actions;
  if (args.mode === 'seed') {
    if (input.selectionVerified !== true || !Number.isFinite(Date.parse(input.verifiedAt)) || !['google-source-selection', 'verified-current-feed-readback'].includes(input.verificationSource)) throw new Error('Seed requires a verified exact source selection and timestamp; never infer membership from publication alone');
    actions = reviewSync.seedMembership(input.reviews, input.selectedExternalIds, input.clientId);
  } else actions = reviewSync.planRollback(input.beforeImages, input.currentRows);
  await writePrivateJson(args.out, { format: `sonshine-review-${args.mode}-plan-v1`, applied: false, actions });
  console.log(JSON.stringify({ prepared: true, applied: false, mode: args.mode, actionCount: actions.length, conflicts: actions.filter((row) => row.disposition === 'conflict').length }));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
