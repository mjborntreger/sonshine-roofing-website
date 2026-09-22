import nextEnv from '@next/env';
import { fileURLToPath } from 'node:url';
import { fetchStaticMediaSnapshot } from '../lib/content/directus-static-media.mjs';
import { writeContentSnapshot } from '../lib/content/write-content-snapshot.mjs';
nextEnv.loadEnvConfig(process.cwd());
const snapshot = await writeContentSnapshot(fileURLToPath(new URL('../.generated/static-media.json', import.meta.url)), () => fetchStaticMediaSnapshot());
console.log(`Generated private static image snapshot: ${Object.keys(snapshot.images).length} selections.`);
