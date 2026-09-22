import { readFile, access, rm } from 'node:fs/promises';
import { join } from 'node:path';
import {
  SNAPSHOT_FILES,
  snapshotHash,
  verifyDeploymentSnapshot,
} from '../lib/content/deployment-snapshot.mjs';
import { writeContentSnapshot } from '../lib/content/write-content-snapshot.mjs';

const root = process.cwd();
await access(join(root, '.generated/capture-complete.json'));
const files = {};
for (const name of [
  ...SNAPSHOT_FILES.map((name) => `.generated/${name}`),
  'public/__sitemaps/static-routes.json',
  'public/llms.txt',
]) {
  try {
    files[name] = snapshotHash(await readFile(join(root, name)));
  } catch (error) {
    if (name === 'public/llms.txt' && error.code === 'ENOENT') files[name] = null;
    else throw error;
  }
}
const manifest = {
  version: 1,
  clientSlug: 'sonshine-roofing',
  files,
  digest: snapshotHash(JSON.stringify(files)),
};
await writeContentSnapshot(join(root, '.generated/content-manifest.json'), async () => manifest);
await rm(join(root, '.generated/capture-complete.json'));
verifyDeploymentSnapshot(root);
console.log(`Sealed deployment content bundle ${manifest.digest}.`);
