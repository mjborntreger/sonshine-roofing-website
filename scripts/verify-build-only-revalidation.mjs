import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../app/api/revalidate/route.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const route = { exports: {} };
new Function('require', 'module', 'exports', compiled)(id => {
  assert.notEqual(id, 'next/cache', 'Retired endpoint must not import cache writers');
  return require(id);
}, route, route.exports);
const previousSecret = process.env.REVALIDATE_SECRET;
process.env.REVALIDATE_SECRET = 'synthetic-test-only';
try {
  const headers = { 'x-revalidate-secret': 'synthetic-test-only', 'content-type': 'application/json' };
  for (const path of ['/', '/blog', '/published-post', '/person/michael', '/roofing-glossary/example', '/api/resources/blog', '/sitemap_index/image', '/layout', '/(site)/layout', '/%6cocations/city', '/new-path', '/bad%ZZ']) {
    for (const method of ['GET', 'POST']) {
      const response = await route.exports[method](new Request(`https://example.test/api/revalidate?path=${encodeURIComponent(path)}&tag=sitemap`, {
        method, headers, ...(method === 'POST' ? { body: JSON.stringify({ paths: [path], tags: ['post:123', 'sitemap', '_N_T_/layout'] }) } : {}),
      }));
      assert.equal(response.status, 410);
      assert.match((await response.json()).error, /deployment-only/);
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
  }
  for (const method of ['GET','POST']) {
    assert.equal((await route.exports[method](new Request('https://example.test/api/revalidate', { method }))).status, 401);
    assert.equal((await route.exports[method](new Request('https://example.test/api/revalidate', { method, headers: { 'x-revalidate-secret': 'incorrect' } }))).status, 401);
  }
  delete process.env.REVALIDATE_SECRET;
  assert.equal((await route.exports.GET(new Request('https://example.test/api/revalidate', { headers }))).status, 401);
} finally {
  if (previousSecret === undefined) delete process.env.REVALIDATE_SECRET;
  else process.env.REVALIDATE_SECRET = previousSecret;
}
console.log('Verified authenticated retirement of both revalidation methods with no cache writer dependency.');
