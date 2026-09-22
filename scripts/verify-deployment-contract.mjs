import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import fg from 'fast-glob';
import ts from 'typescript';
import { verifyDeploymentSnapshot } from '../lib/content/deployment-snapshot.mjs';

export function verifyPrerenderContract(root = process.cwd()) {
  const { snapshots, manifest: content } = verifyDeploymentSnapshot(root);
  const manifest = JSON.parse(readFileSync(resolve(root, '.next/prerender-manifest.json'), 'utf8'));
  for (const [path, route] of Object.entries(manifest.routes))
    assert.equal(route.initialRevalidateSeconds, false, `${path} must have no ISR`);
  for (const [path, route] of Object.entries(manifest.dynamicRoutes))
    assert.equal(route.fallback, false, `${path} must have no on-demand fallback`);
  const editorial = snapshots['editorial.json'];
  const inventories = [
    [editorial.posts, '/[slug]', '/'],
    [editorial.persons, '/person/[slug]', '/person/'],
    [editorial.glossary, '/roofing-glossary/[slug]', '/roofing-glossary/'],
    [editorial.offers, '/special-offers/[slug]', '/special-offers/'],
    [snapshots['projects.json'].projects, '/project/[slug]', '/project/'],
    [snapshots['locations.json'].pages, '/locations/[slug]', '/locations/'],
  ];
  for (const [rows, srcRoute, prefix] of inventories) {
    const expected = rows.map((row) => prefix + row.slug).sort();
    const actual = Object.entries(manifest.routes)
      .filter(([, route]) => route.srcRoute === srcRoute)
      .map(([path]) => path)
      .sort();
    assert.deepEqual(
      actual,
      expected,
      `${srcRoute} must contain the complete snapshot inventory, including noindex pages`,
    );
    if (rows.length) assert.equal(manifest.dynamicRoutes[srcRoute]?.fallback, false, srcRoute);
  }
  for (const path of [
    '/blog',
    '/',
    '/roofing-glossary',
    '/privacy-policy',
    '/sms-terms-and-conditions',
    '/sitemap_index',
    ...[
      'blog',
      'person',
      'roofing-glossary',
      'image',
      'static',
      'location',
      'project',
      'video',
      'special-offer',
    ].map((kind) => '/sitemap_index/' + kind),
  ]) {
    assert.ok(manifest.routes[path], `Missing prerendered content route ${path}`);
  }
  return { routes: Object.keys(manifest.routes).length, digest: content.digest };
}

export function verifySourceContract(root = process.cwd()) {
  const publicPages = fg.sync(['app/**/page.tsx', 'app/sitemap_index/**/route.ts'], { cwd: root });
  for (const path of publicPages) {
    const source = readFileSync(resolve(root, path), 'utf8');
    assert.match(source, /export const revalidate = false;/, `${path} must explicitly disable ISR`);
    assert.match(
      source,
      /export const dynamic = ['"]force-static['"];/,
      `${path} must render statically`,
    );
    if (path.includes('[slug]'))
      assert.match(
        source,
        /export const dynamicParams = false;/,
        `${path} must close its inventory`,
      );
  }
  // Walk actual runtime imports, ignoring erased type-only references. Build-only
  // readers and CMS credentials must never become dependencies of a public route.
  const visited = new Set();
  function visit(filename) {
    if (visited.has(filename)) return;
    visited.add(filename);
    assert.doesNotMatch(
      filename,
      /\/lib\/content\/(?:build\/|directus-(?:projects|videos|locations|static-media|redirects|site-shell)\.)/,
      'Runtime imported a CMS build reader',
    );
    const source = readFileSync(filename, 'utf8');
    assert.doesNotMatch(
      source,
      /process\.env\.DIRECTUS_(?:TOKEN|STATIC_TOKEN|URL)/,
      `${filename} reads runtime CMS credentials/config`,
    );
    assert.doesNotMatch(
      source,
      /\b(?:revalidatePath|revalidateTag|updateTag|unstable_cache)\s*\(/,
      `${filename} invalidates or regenerates content`,
    );
    const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
    for (const item of tree.statements) {
      if (!ts.isImportDeclaration(item) && !ts.isExportDeclaration(item)) continue;
      if (item.isTypeOnly || item.importClause?.isTypeOnly) continue;
      const bindings = item.importClause?.namedBindings || item.exportClause;
      if (
        bindings?.elements?.length &&
        bindings.elements.every((element) => element.isTypeOnly) &&
        !item.importClause?.name
      )
        continue;
      const id = item.moduleSpecifier?.text;
      if (!id || (!id.startsWith('.') && !id.startsWith('@/'))) continue;
      const base = id.startsWith('@/')
        ? resolve(root, id.slice(2))
        : resolve(dirname(filename), id);
      const target = [
        base,
        base + '.ts',
        base + '.tsx',
        base + '.mjs',
        base + '/index.ts',
        base + '/index.tsx',
      ].find((path) => existsSync(path) && /\.(?:ts|tsx|mjs)$/.test(path));
      if (target) visit(target);
    }
  }
  for (const file of fg.sync(['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'], { cwd: root }))
    visit(resolve(root, file));
  return { pages: publicPages.length, modules: visited.size };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log('Verified deployment source contract:', verifySourceContract());
  if (process.argv.includes('--build'))
    console.log('Verified production prerender contract:', verifyPrerenderContract());
}
