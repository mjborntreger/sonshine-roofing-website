import { directusBuildConfig } from './directus-projects.mjs';
import { STATIC_IMAGE_FILES, STATIC_IMAGE_FOLDER } from './static-image-files.mjs';
const fail = message => { throw new Error(`[Static media] ${message}`); };
export function mapStaticImage(row, config) {
  if (row.folder !== STATIC_IMAGE_FOLDER || !/^image\/(webp|png|jpeg)$/u.test(row.type) || !row.description?.trim()) return fail('File must belong to the static folder and have an image MIME and description.');
  if (![row.width, row.height].every(value => Number.isSafeInteger(value) && value > 0)) return fail('Original image dimensions are required.');
  const focal = row.focal_point_x == null && row.focal_point_y == null ? null : { x: row.focal_point_x, y: row.focal_point_y };
  if (focal && (!Number.isFinite(focal.x) || !Number.isFinite(focal.y) || focal.x < 0 || focal.x >= row.width || focal.y < 0 || focal.y >= row.height)) return fail('Original-pixel focal coordinates are out of bounds.');
  return { url: new URL(`assets/${encodeURIComponent(row.id)}`, `${config.url}/`).href, description: row.description, type: row.type, width: row.width, height: row.height, focalPoint: focal };
}
export async function fetchStaticMediaSnapshot(env = process.env, fetcher = fetch) {
  const config = directusBuildConfig(env);
  if (config.clientSlug !== 'sonshine-roofing') return fail('Static image selections require the SonShine client.');
  const ids = Object.values(STATIC_IMAGE_FILES), rows = [];
  if (new Set(ids).size !== ids.length) return fail('Static image identities must be unique.');
  for (let start = 0; start < ids.length; start += 50) {
    const batch = ids.slice(start, start + 50), url = new URL('files', `${config.url}/`);
    url.search = new URLSearchParams({ fields: 'id,folder,description,type,width,height,focal_point_x,focal_point_y', filter: JSON.stringify({ id: { _in: batch }, folder: { _eq: STATIC_IMAGE_FOLDER } }), limit: '50' }).toString();
    const response = await fetcher(url, { headers: { Authorization: `Bearer ${config.token}` }, cache: 'no-store' });
    if (!response.ok) return fail(`Build file lookup failed with HTTP ${response.status}.`);
    const payload = await response.json();
    if (!Array.isArray(payload.data) || payload.data.length !== batch.length || payload.data.some(row => !batch.includes(row.id))) return fail('Build file lookup is incomplete or escaped the allowlist.');
    rows.push(...payload.data);
  }
  const byId = new Map(rows.map(row => [row.id, row]));
  if (byId.size !== ids.length) return fail('Build file lookup repeated an identity.');
  return { version: 1, clientSlug: config.clientSlug, images: Object.fromEntries(Object.entries(STATIC_IMAGE_FILES).map(([key, id]) => [key, mapStaticImage(byId.get(id), config)])) };
}
