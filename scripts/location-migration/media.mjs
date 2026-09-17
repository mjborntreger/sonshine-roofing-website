import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { argsFor, readPrivate, writePrivate, checkedPath } from './io.mjs';
import { sourceKey } from './core.mjs';

const args = argsFor(process.argv.slice(2));
const source = await readPrivate(args.source);
const byId = new Map();
for (const page of source.nodes) {
  for (const [index, node] of [page.locationAttributes.map?.node, ...(page.locationAttributes.neighborhoodsServed || []).map(row => row.neighborhoodImage?.node)].entries()) {
    if (!node) continue;
    assert.ok(node.databaseId, 'Source media identity is required');
    const previous = byId.get(node.databaseId);
    if (previous) { assert.equal(previous.sourceUrl, node.sourceUrl, 'Source attachment URL conflict'); previous.uses.push({ slug: page.slug, kind: index ? 'neighborhood' : 'overview', index }); }
    else byId.set(node.databaseId, { ...node, key: sourceKey('media', node.databaseId), uses: [{ slug: page.slug, kind: index ? 'neighborhood' : 'overview', index }] });
  }
}
await mkdir(args.directory, { mode: 0o700 });
await checkedPath(`${args.directory}/probe`, false);
const rows = [...byId.values()].sort((a, b) => a.databaseId - b.databaseId);
let cursor = 0;
const output = [];
async function worker() {
  while (cursor < rows.length) {
    const node = rows[cursor++];
    const url = new URL(node.sourceUrl);
    assert.equal(url.protocol, 'https:', 'Source media requires HTTPS');
    assert.equal(url.hostname, 'wp.sonshineroofing.com', 'Unexpected media source host');
    const response = await fetch(url, { redirect: 'error' });
    assert.ok(response.ok, `Media source fetch failed (HTTP ${response.status})`);
    const mime = response.headers.get('content-type')?.split(';')[0];
    assert.ok(mime?.startsWith('image/'), 'Source asset is not an image');
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.ok(bytes.length > 0 && bytes.length < 25 * 1024 * 1024, 'Image byte size outside allowed migration bounds');
    const metadata = await sharp(bytes).metadata();
    assert.ok(metadata.width && metadata.height && ['jpeg', 'png', 'webp', 'avif', 'gif'].includes(metadata.format), 'Unsupported/invalid raster image');
    const localPath = path.join(args.directory, `${node.databaseId}.${metadata.format}`);
    await writeFile(localPath, bytes, { mode: 0o600, flag: 'wx' });
    output.push({ ...node, localPath, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length,
      verifiedMime: mime, decodedFormat: metadata.format, width: metadata.width, height: metadata.height,
      sourceHttpLastModified: response.headers.get('last-modified'), visualReview: 'pending' });
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
output.sort((a, b) => a.databaseId - b.databaseId);
await writePrivate(args.manifest, { version: 'location-media-inventory-v1', sourceCount: rows.length, assets: output });
// Review aids contain only these public source images. They are never imported.
for (let start = 0; start < output.length; start += 24) {
  const group = output.slice(start, start + 24), width = 360, height = 265;
  const composites = [];
  for (const [i, row] of group.entries()) {
    const thumbnail = await sharp(row.localPath).resize(width, height - 25, { fit: 'inside', withoutEnlargement: true }).toBuffer();
    const label = Buffer.from(`<svg width="360" height="25"><rect width="360" height="25" fill="white"/><text x="8" y="18" font-size="14" fill="black">${start + i + 1} · ${row.uses[0].slug} · ${row.uses[0].kind}</text></svg>`);
    composites.push({ input: thumbnail, left: (i % 4) * width, top: Math.floor(i / 4) * height }, { input: label, left: (i % 4) * width, top: Math.floor(i / 4) * height + height - 25 });
  }
  const bytes = await sharp({ create: { width: 4 * width, height: Math.ceil(group.length / 4) * height, channels: 3, background: 'white' } }).composite(composites).png().toBuffer();
  await writeFile(`${args.directory}/contact-${start + 1}.png`, bytes, { mode: 0o600, flag: 'wx' });
}
console.log(JSON.stringify({ mediaAssets: output.length, bytes: output.reduce((total, row) => total + row.bytes, 0),
  sha256Verified: output.length, decodedImages: output.length, mimeTypes: [...new Set(output.map(row => row.verifiedMime))],
  sourceGmtDates: output.filter(row => row.dateGmt && row.modifiedGmt).length, visualReview: 'pending' }, null, 2));
