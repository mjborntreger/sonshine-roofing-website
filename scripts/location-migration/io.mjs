import assert from 'node:assert/strict';
import { mkdir, realpath, lstat, open, readFile } from 'node:fs/promises';
import path from 'node:path';
import { constants } from 'node:fs';

export const PRIVATE_ROOT = process.env.LOCATION_MIGRATION_PRIVATE_ROOT || '/private/tmp/sonshine-location-migration-20260915';
async function checkPrivateRoot() {
  assert.ok(path.isAbsolute(PRIVATE_ROOT), 'Private artifact root must be absolute');
  assert.equal(await realpath(PRIVATE_ROOT), PRIVATE_ROOT, 'Use the canonical private artifact root, not a symlink');
  assert.equal((await lstat(PRIVATE_ROOT)).mode & 0o077, 0, 'Private artifact root must have mode 0700');
  for (let ancestor = PRIVATE_ROOT; ; ancestor = path.dirname(ancestor)) {
    try { await lstat(path.join(ancestor, '.git')); assert.fail('Private artifacts must remain outside every Git worktree'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (path.dirname(ancestor) === ancestor) break;
  }
}
export async function checkedPath(filename, existing = true) {
  await checkPrivateRoot();
  assert.ok(path.isAbsolute(filename) && filename.startsWith(`${PRIVATE_ROOT}/`), 'Use the approved private recovery directory');
  const directory = await realpath(path.dirname(filename));
  assert.ok(directory === PRIVATE_ROOT || directory.startsWith(`${PRIVATE_ROOT}/`), 'Private path escapes approved storage');
  assert.equal((await lstat(directory)).mode & 0o077, 0, 'Private directory must have mode 0700');
  if (existing) {
    const stat = await lstat(filename);
    assert.ok(stat.isFile() && !stat.isSymbolicLink(), 'Private artifact must be a regular file');
    assert.equal(stat.mode & 0o077, 0, 'Private artifact must have mode 0600');
  }
  return filename;
}
export async function readPrivate(filename) {
  await checkedPath(filename);
  const handle = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
  try { return JSON.parse(await handle.readFile('utf8')); } finally { await handle.close(); }
}
export async function writePrivate(filename, value) {
  assert.ok(path.isAbsolute(PRIVATE_ROOT), 'Private artifact root must be absolute');
  await mkdir(PRIVATE_ROOT, { mode: 0o700, recursive: true });
  await checkedPath(filename, false);
  const handle = await open(filename, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
  try { await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`); await handle.sync(); } finally { await handle.close(); }
}
export async function readPrivateBytes(filename) { return readFile(await checkedPath(filename)); }
export function argsFor(argv) {
  assert.equal(argv.length % 2, 0, 'Arguments use --key value pairs');
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    assert.ok(/^--[a-z-]+$/u.test(argv[i]) && args[argv[i].slice(2)] === undefined, 'Invalid or duplicate argument');
    args[argv[i].slice(2)] = argv[i + 1];
  }
  return args;
}
