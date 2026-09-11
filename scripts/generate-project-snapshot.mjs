import nextEnv from '@next/env';
import { fileURLToPath } from 'node:url';
import { fetchDirectusContentSnapshot } from '../lib/content/directus-videos.mjs';
import { writeContentSnapshot } from '../lib/content/write-content-snapshot.mjs';

nextEnv.loadEnvConfig(process.cwd());
const destination = fileURLToPath(new URL('../.generated/projects.json', import.meta.url));
// Both inventories live in a single artifact and become visible together.
const snapshot = await writeContentSnapshot(destination, () => fetchDirectusContentSnapshot());
console.log(`Generated build-only Directus content snapshot: ${snapshot.projects.length} projects, ${snapshot.videos.length} videos, ${snapshot.projects.reduce((total, project) => total + project.projectImages.length, 0)} gallery images.`);
