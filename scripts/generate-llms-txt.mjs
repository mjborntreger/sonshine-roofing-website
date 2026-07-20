import { rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile('.env');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

process.env.NODE_ENV = 'production';

const { getDirectusBuildSettings } = await import('../lib/content/directus-build-settings.mjs');
const settings = await getDirectusBuildSettings();
const outputUrl = new URL('../public/llms.txt', import.meta.url);

if (!settings?.llmsTxt.trim()) {
  await rm(fileURLToPath(outputUrl), { force: true });
  console.info('[llms.txt] Directus field is empty; no file generated.');
} else {
  await writeFile(outputUrl, settings.llmsTxt, 'utf8');
  console.info('[llms.txt] Generated public/llms.txt from Directus site settings.');
}
