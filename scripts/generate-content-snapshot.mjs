import nextEnv from '@next/env';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fetchEditorialSnapshot } from '../lib/content/build/editorial.mjs';
import { fetchDirectusContentSnapshot } from '../lib/content/directus-videos.mjs';
import { fetchDirectusLocationSnapshot } from '../lib/content/directus-locations.mjs';
import { fetchStaticMediaSnapshot } from '../lib/content/directus-static-media.mjs';
import { fetchDirectusRedirects } from '../lib/content/directus-redirects.mjs';
import { validateRouteOwners } from './validate-directus-routes.mjs';
import { writeContentSnapshot } from '../lib/content/write-content-snapshot.mjs';

nextEnv.loadEnvConfig(process.cwd());
const destination = join(process.cwd(), '.generated');
// The seal is written last. A partial refresh must never be a usable candidate.
await mkdir(destination, { recursive: true });
await rm(join(destination, 'content-manifest.json'), { force: true });
await rm(join(destination, 'capture-complete.json'), { force: true });
const { editorial, owners, shared } = await fetchEditorialSnapshot();
const projects = await fetchDirectusContentSnapshot();
const fetcher = async (url, options) => {
  const response = await fetch(url, options);
  if (new URL(url).pathname.endsWith('/items/services') && response.ok) {
    const payload = await response.clone().json();
    (owners.services ??= []).push(...(payload.data ?? []));
  }
  return response;
};
const locations = await fetchDirectusLocationSnapshot(projects, process.env, fetcher, shared);
const media = await fetchStaticMediaSnapshot();
editorial.redirects = await fetchDirectusRedirects();
editorial.routeOwners = await validateRouteOwners({
  clientSlug: editorial.clientSlug,
  readCollection: async (collection) => {
    if (!owners[collection]) throw new Error(`Missing captured route inventory: ${collection}`);
    return owners[collection];
  },
  snapshots: { projects, locations },
});
editorial.buildSettings = {
  contentSecurityPolicy: locations.siteShell.settings.contentSecurityPolicy,
  llmsTxt: locations.siteShell.settings.llmsTxt,
};
editorial.assetOrigin = new URL(process.env.DIRECTUS_URL).origin;
for (const [name, value] of Object.entries({
  projects,
  locations,
  'static-media': media,
  editorial,
})) {
  await writeContentSnapshot(join(destination, `${name}.json`), async () => value);
}
// No source records, request details, or credentials are packaged.
await writeFile(join(destination, 'capture-complete.json'), JSON.stringify({ version: 1 }), 'utf8');
console.log(
  `Captured deployment content: ${editorial.posts.length} posts, ${editorial.persons.length} people, ${editorial.glossary.length} terms, ${editorial.routeOwners.length} route owners.`,
);
