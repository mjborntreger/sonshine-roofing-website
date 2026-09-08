import nextEnv from '@next/env';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { fetchDirectusProjectSnapshot } from '../lib/content/directus-projects.mjs';

nextEnv.loadEnvConfig(process.cwd());
const directory = new URL('../.generated/', import.meta.url);
const destination = new URL('projects.json', directory);
const temporary = new URL('projects.json.tmp', directory);
// A failed refresh must never let a later build silently reuse an older dataset.
await rm(destination, { force: true });
try {
  const snapshot = await fetchDirectusProjectSnapshot();
  await mkdir(directory, { recursive: true });
  await writeFile(temporary, JSON.stringify(snapshot));
  await rename(temporary, destination);
  console.log(`Generated build-only Directus project snapshot: ${snapshot.projects.length} projects, ${snapshot.projects.reduce((total, project) => total + project.projectImages.length, 0)} gallery images.`);
} catch (error) {
  await rm(temporary, { force: true });
  throw error;
}
