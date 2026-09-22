import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { createServer } from 'node:net';
import { pathToFileURL } from 'node:url';
import { verifyPrerenderContract } from './verify-deployment-contract.mjs';
import { resolveLegacyMediaRedirect } from '../lib/content/legacy-media-redirects.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export async function verifyRuntime(root = process.cwd(), { revision } = {}) {
  const { routes, digest } = verifyPrerenderContract(root);
  const sandbox = await mkdtemp(join(tmpdir(), 'sonshine-runtime-'));
  const runtime = join(sandbox, 'app');
  // Local Next builds can trace .env files; Docker excludes them. Do not let
  // either Next startup or a loader restore CMS credentials in this test.
  await cp(join(root, '.next/standalone'), runtime, {
    recursive: true,
    filter: (source) => !basename(source).startsWith('.env'),
  });
  await cp(join(root, 'public'), join(runtime, 'public'), { recursive: true });
  await mkdir(join(runtime, '.next'), { recursive: true });
  await cp(join(root, '.next/static'), join(runtime, '.next/static'), { recursive: true });
  await cp(join(root, '.generated'), join(runtime, '.generated'), { recursive: true });
  const editorial = JSON.parse(await readFile(join(runtime, '.generated/editorial.json'), 'utf8'));
  const prerender = JSON.parse(await readFile(join(root, '.next/prerender-manifest.json'), 'utf8'));
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    HOSTNAME: '127.0.0.1',
    REVALIDATE_SECRET: 'synthetic-runtime-only',
  };
  for (const key of Object.keys(env)) if (/DIRECTUS|YOUTUBE_API_KEY/.test(key)) delete env[key];
  const audit = join(sandbox, 'network-audit.txt');
  env.CONTENT_NETWORK_AUDIT = audit;
  env.NODE_OPTIONS = `--require ${resolve(root, 'scripts/deny-runtime-network.cjs')}`;
  let child,
    output = '';
  async function start() {
    const listener = createServer();
    await new Promise((resolve) => listener.listen(0, '127.0.0.1', resolve));
    env.PORT = String(listener.address().port);
    await new Promise((resolve) => listener.close(resolve));
    child = spawn(process.execPath, ['server.js'], {
      cwd: runtime,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', (chunk) => {
      output += chunk;
    });
    child.stderr.on('data', (chunk) => {
      output += chunk;
    });
    const base = `http://127.0.0.1:${env.PORT}`;
    for (let i = 0; i < 150; i++) {
      if (child.exitCode !== null)
        throw new Error(`Standalone server exited: ${output.slice(-2000)}`);
      try {
        const response = await fetch(base + '/blog');
        if (response.status === 200) return base;
      } catch {
        /* Wait for readiness. */
      }
      await sleep(100);
    }
    throw new Error(`Standalone server did not become ready: ${output.slice(-2000)}`);
  }
  async function stop() {
    if (!child || child.exitCode !== null) return;
    const closed = new Promise((resolve) => child.once('exit', resolve));
    child.kill('SIGTERM');
    await closed;
  }
  async function check(base, thorough) {
    const paths = thorough
      ? Object.keys(prerender.routes).filter((path) => !path.startsWith('/_'))
      : ['/blog', '/' + editorial.posts[0].slug, '/sitemap_index/blog', '/sitemap_index/static'];
    for (const path of paths) {
      const response = await fetch(base + path);
      assert.equal(
        response.status,
        200,
        `${path}: ${await response.text().then((text) => text.slice(0, 80))}`,
      );
    }
    const blog = await fetch(base + '/api/resources/blog', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ first: 50 }),
    });
    assert.equal(blog.status, 200);
    const result = await blog.json();
    assert.equal(result.total, editorial.posts.length);
    assert.deepEqual(
      result.items.map((post) => post.slug),
      editorial.posts.slice(0, 50).map((post) => post.slug),
    );
    const search = await fetch(base + '/api/resources/blog', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ filters: { q: editorial.posts[0].title } }),
    });
    assert.ok((await search.json()).items.some((post) => post.slug === editorial.posts[0].slug));
    const rsc = await fetch(base + '/' + editorial.posts[0].slug, { headers: { RSC: '1' } });
    assert.equal(rsc.status, 200);
    for (const path of [
      '/new-runtime-only-slug',
      '/person/new-runtime-only-slug',
      '/roofing-glossary/new-runtime-only-slug',
      '/project/new-runtime-only-slug',
      '/locations/new-runtime-only-slug',
      '/special-offers/new-runtime-only-slug',
    ])
      assert.equal((await fetch(base + path)).status, 404, path);
    for (const method of ['GET', 'POST']) {
      const response = await fetch(base + '/api/revalidate?path=/blog&tag=sitemap', {
        method,
        headers: { 'x-revalidate-secret': 'synthetic-runtime-only' },
      });
      assert.equal(response.status, 410);
    }
    assert.equal((await fetch(base + '/api/revalidate')).status, 401);
    // Relative media redirects stay in native Next routing. In particular,
    // Proxy's standalone adapter rejects relative Location headers at runtime.
    for (const rule of editorial.redirects.filter((row) => row.source.startsWith('/wp-content/'))) {
      for (const method of ['GET', 'HEAD']) {
        const response = await fetch(base + rule.source + '?ver=1&x=one&x=two', {
          method,
          redirect: 'manual',
        });
        assert.equal(response.status, rule.statusCode, `${method} ${rule.source}`);
        const expected = new URL(rule.destination, base);
        expected.search = '?ver=1&x=one&x=two';
        assert.equal(new URL(response.headers.get('location'), base).href, expected.href);
      }
    }
    for (const rule of editorial.legacyMediaRedirects) {
      const path = rule.wildcard
        ? rule.sourcePath.replaceAll('*', 'uploads/runtime-check.html')
        : rule.sourcePath;
      for (const method of ['GET', 'HEAD']) {
        const url = base + path + '?key=unknown&download=true&width=40&v=1';
        const expected = resolveLegacyMediaRedirect(url, editorial.legacyMediaRedirects);
        const response = await fetch(url, { method, redirect: 'manual' });
        assert.equal(response.status, expected.statusCode, `${method} ${path}`);
        assert.equal(response.headers.get('location'), expected.destination, path);
        if (!rule.preserveQuery) assert.equal(new URL(expected.destination).search, '');
      }
    }
    if (revision) {
      for (const method of ['GET', 'HEAD']) {
        const relative = await fetch(base + '/wp-content/uploads/fixture-relative.jpg?ver=1', {
          method,
          redirect: 'manual',
        });
        assert.equal(relative.status, 308);
        assert.equal(
          new URL(relative.headers.get('location'), base).href,
          base + (revision === 'B' ? '/blog' : '/') + '?ver=1',
        );
      }
      const html = await (await fetch(base + '/' + editorial.posts[0].slug)).text();
      assert.ok(html.includes(`Deployment ${revision}`));
      assert.equal((await fetch(base + '/new-after-build')).status, revision === 'B' ? 200 : 404);
      assert.equal((await fetch(base + '/fixture-post-1')).status, revision === 'B' ? 404 : 200);
      const media = await fetch(base + '/wp-content/uploads/fixture-direct.jpg?key=unknown', {
        redirect: 'manual',
      });
      assert.equal(media.status, 308);
      assert.ok(
        media.headers
          .get('location')
          .endsWith(
            `/assets/${revision === 'B' ? '22222222' : '11111111'}-1111-1111-1111-111111111111`,
          ),
      );
      const uppercase = await fetch(base + '/WP-CONTENT/uploads/FIXTURE-DIRECT.JPG?download=true', {
        redirect: 'manual',
      });
      assert.equal(uppercase.headers.get('location'), media.headers.get('location'));
      for (const path of [
        '/wp-content/uploads/unknown.html',
        '/wp-content/uploads/page/2',
        '/wp-content/wp-sitemap.xml',
        '/wp-content/uploads/Foo%20Bar.jpg',
        '/wp-content/uploads/foo%2Fbar.jpg',
        '/wp-content/uploads/foo%252Fbar.jpg',
      ]) {
        const response = await fetch(base + path + '?x=one&x=two', { redirect: 'manual' });
        assert.equal(response.status, 308, path);
        assert.equal(
          response.headers.get('location'),
          'https://legacy.example.test' + path + '?x=one&x=two',
          path,
        );
      }
    }
    assert.equal(existsSync(audit), false, 'Runtime tried to access the network');
  }
  try {
    await check(await start(), true);
    await stop();
    await rm(join(runtime, '.next/cache'), { recursive: true, force: true });
    await check(await start(), false);
    await stop();
    assert.doesNotMatch(
      output,
      /Runtime network access is forbidden|Deployment content bundle is missing/,
    );
    console.log(
      `Verified ${routes} production routes, resource search, RSC, closed inventories, retired revalidation and cold restart without CMS access (${digest}).`,
    );
  } finally {
    await stop();
    await rm(sandbox, { recursive: true, force: true });
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  await verifyRuntime();
