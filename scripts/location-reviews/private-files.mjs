import { mkdir, readFile, writeFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';

export const PRIVATE_ROOT = '/private/tmp/sonshine-location-migration-20260915';
async function privatePath(filename, exists = true) {
  if (!path.isAbsolute(filename) || !filename.startsWith(`${PRIVATE_ROOT}/`)) throw new Error('Use the approved private recovery directory');
  const directory = await realpath(path.dirname(filename));
  if (directory !== PRIVATE_ROOT && !directory.startsWith(`${PRIVATE_ROOT}/`)) throw new Error('Private path resolves outside approved recovery storage');
  if ((await stat(directory)).mode & 0o077) throw new Error('Private recovery directory must have mode 0700');
  if (exists) {
    const resolved = await realpath(filename);
    const metadata = await stat(filename);
    if (resolved !== filename || !metadata.isFile() || (metadata.mode & 0o077)) throw new Error('Private artifact must be a mode-0600 regular file without symlink redirection');
  }
  return filename;
}
export async function readPrivateJson(filename) {
  const raw = await readFile(await privatePath(filename), 'utf8');
  try { return JSON.parse(raw); }
  catch { throw new Error('Private artifact is not valid JSON'); }
}
export async function writePrivateJson(filename, value) {
  await mkdir(PRIVATE_ROOT, { recursive: true, mode: 0o700 });
  await privatePath(filename, false);
  // Exclusive create prevents replacing prior recovery evidence or following a symlink.
  await writeFile(filename, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
}
export function argumentsFor(argv) {
  if (argv.length % 2) throw new Error('Arguments must be --name value pairs');
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    if (!argv[index].startsWith('--') || result[argv[index].slice(2)] !== undefined) throw new Error('Invalid or duplicate argument');
    result[argv[index].slice(2)] = argv[index + 1];
  }
  return result;
}
