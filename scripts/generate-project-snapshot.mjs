import nextEnv from '@next/env';
import { fileURLToPath } from 'node:url';
import { fetchDirectusContentSnapshot } from '../lib/content/directus-videos.mjs';
import { writeContentSnapshot } from '../lib/content/write-content-snapshot.mjs';
import { fetchDirectusLocationSnapshot } from '../lib/content/directus-locations.mjs';
import { rm } from 'node:fs/promises';

nextEnv.loadEnvConfig(process.cwd());
const destination = fileURLToPath(new URL('../.generated/projects.json', import.meta.url));
const locationsDestination = fileURLToPath(new URL('../.generated/locations.json', import.meta.url));
await rm(locationsDestination, { force: true });
// Both inventories live in a single artifact and become visible together.
const snapshot = await writeContentSnapshot(destination, async () => {
  const projects = await fetchDirectusContentSnapshot();
  const locations = await fetchDirectusLocationSnapshot(projects);
  await writeContentSnapshot(locationsDestination, async () => locations);
  return projects;
});
console.log(`Generated build-only Directus content snapshot: ${snapshot.projects.length} projects, ${snapshot.videos.length} videos, ${snapshot.projects.reduce((total, project) => total + project.projectImages.length, 0)} gallery images.`);
