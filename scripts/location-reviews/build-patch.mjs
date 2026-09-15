import { buildWorkflowPatch } from './patch.mjs';
import { argumentsFor, readPrivateJson, writePrivateJson } from './private-files.mjs';

try {
  const args = argumentsFor(process.argv.slice(2));
  if (Object.keys(args).some((key) => !['recovery', 'out'].includes(key)) || !args.recovery || !args.out) throw new Error('Usage: build-patch.mjs --recovery PRIVATE_JSON --out NEW_PRIVATE_JSON');
  const patch = buildWorkflowPatch(await readPrivateJson(args.recovery));
  await writePrivateJson(args.out, patch);
  console.log(JSON.stringify({ prepared: true, applied: false, contract: patch.contractVersion,
    sourceGraphSha256: patch.sourceGraphSha256, candidateGraphSha256: patch.candidateGraphSha256, operationCount: patch.operations.length }));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
