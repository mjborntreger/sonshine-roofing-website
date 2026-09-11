import { randomUUID } from 'node:crypto';
import { dirname } from 'node:path';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';

/** A failed refresh invalidates the candidate artifact; there is no stale fallback. */
export async function writeContentSnapshot(destination, loadSnapshot) {
  const temporary = `${destination}.${randomUUID()}.tmp`;
  await rm(destination, { force: true });
  try {
    const snapshot = await loadSnapshot();
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(temporary, JSON.stringify(snapshot));
    await rename(temporary, destination);
    return snapshot;
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}
