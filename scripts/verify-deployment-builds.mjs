import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cp, mkdtemp, readdir, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyDeploymentSnapshot, snapshotHash } from '../lib/content/deployment-snapshot.mjs';
import { verifyRuntime } from './verify-deployment-runtime.mjs';

// Build and run isolated synthetic releases; never replace a developer's capture.
const source = process.cwd(),
  root = await mkdtemp(join(tmpdir(), 'sonshine-build-contract-'));
const env = {
  ...process.env,
  NODE_ENV: 'production',
  NEXT_PUBLIC_ENV: 'production',
  NEXT_PUBLIC_BASE_URL: 'https://example.test',
  NEXT_PUBLIC_SITE_URL: 'https://example.test',
  DEPLOYMENT_FIXTURE: '1',
  NEXT_TELEMETRY_DISABLED: '1',
};
for (const key of Object.keys(env)) if (/DIRECTUS|YOUTUBE_API_KEY/.test(key)) delete env[key];
async function run(args) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk;
    });
    child.stderr.on('data', (chunk) => {
      output += chunk;
    });
    child.once('error', reject);
    child.once('exit', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${args.join(' ')} failed:\n${output.slice(-5000)}`)),
    );
  });
}
try {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (
      entry.name.startsWith('.env') ||
      ['node_modules', '.next', '.generated', '.git'].includes(entry.name)
    )
      continue;
    await cp(join(source, entry.name), join(root, entry.name), { recursive: true });
  }
  await cp(join(source, 'node_modules'), join(root, 'node_modules'), { recursive: true });
  let firstDigest;
  for (const revision of ['A', 'B']) {
    await run(['scripts/create-deployment-fixture.mjs', revision]);
    await run(['scripts/make-static-sitemap.mjs']);
    await run(['scripts/generate-llms-txt.mjs']);
    await run(['scripts/seal-content-snapshot.mjs']);
    const { manifest } = verifyDeploymentSnapshot(root);
    if (revision === 'A') firstDigest = manifest.digest;
    else assert.notEqual(manifest.digest, firstDigest);
    // Reuse build caches deliberately: cached editorial content must not survive a new capture.
    await run(['node_modules/next/dist/bin/next', 'build', '--webpack']);
    await verifyRuntime(root, { revision });
    console.log(`Synthetic deployment ${revision} build and runtime checks passed.`);
  }
  const file = join(root, '.generated/editorial.json'),
    original = await readFile(file);
  await rm(file);
  assert.throws(() => verifyDeploymentSnapshot(root), /missing, corrupt, or incompatible/);
  await writeFile(file, '{}');
  assert.throws(() => verifyDeploymentSnapshot(root), /missing, corrupt, or incompatible/);
  await writeFile(file, original);
  const manifestPath = join(root, '.generated/content-manifest.json'),
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const corrupted = JSON.parse(original);
  corrupted.clientSlug = 'other-client';
  const bytes = JSON.stringify(corrupted);
  await writeFile(file, bytes);
  manifest.files['.generated/editorial.json'] = snapshotHash(bytes);
  manifest.digest = snapshotHash(JSON.stringify(manifest.files));
  await writeFile(manifestPath, JSON.stringify(manifest));
  assert.throws(() => verifyDeploymentSnapshot(root), /missing, corrupt, or incompatible/);
  console.log('Verified missing, corrupted and cross-client content bundles fail closed.');
} finally {
  await rm(root, { recursive: true, force: true });
}
