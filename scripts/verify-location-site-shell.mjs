import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import * as shellModule from '../lib/content/directus-site-shell.ts';
import { makeSiteShellFixture } from './fixtures/location-site-shell.mjs';

const { fetchDirectusSiteShellSnapshot } = shellModule;
const env = { DIRECTUS_URL: 'https://cms.example.com', DIRECTUS_TOKEN: 'synthetic-token', DIRECTUS_CLIENT_SLUG: 'fixture-client' };
let checks = 0;
async function check(name, callback) {
  try { await callback(); checks++; } catch (error) { error.message = `${name}: ${error.message}`; throw error; }
}
function fixtureReader(fixture, alter) {
  const calls = [];
  const fetcher = async (input, init) => {
    const url = new URL(input);
    const collection = url.pathname.split('/').at(-1);
    calls.push({ collection, url, init });
    const records = collection === 'site_settings' ? fixture.siteSettings : fixture.services;
    const page = Number(url.searchParams.get('page'));
    const payload = { data: records.slice((page - 1) * 100, page * 100), meta: { filter_count: records.length } };
    if (alter) return alter({ collection, page, payload });
    return { ok: true, status: 200, json: async () => payload };
  };
  return { fetcher, calls };
}
async function build(fixture = makeSiteShellFixture(), alter) {
  const reader = fixtureReader(fixture, alter);
  return { snapshot: await fetchDirectusSiteShellSnapshot(env, reader.fetcher), calls: reader.calls };
}

await check('explicit projection preserves existing normalized shell and service order', async () => {
  const fixture = makeSiteShellFixture();
  fixture.siteSettings[0].header_scripts = 'SYNTHETIC_PRIVATE_SENTINEL';
  fixture.siteSettings[0].unexpected_private_payload = 'SYNTHETIC_PRIVATE_SENTINEL';
  const { snapshot, calls } = await build(fixture);
  assert.equal(snapshot.settings.brandName, 'Fixture Roofing');
  assert.equal(snapshot.settings.siteUrl, 'https://example.com');
  assert.equal(snapshot.settings.phoneHref, 'tel:+15555550100');
  assert.equal(snapshot.settings.heroImage.url, 'https://cms.example.com/assets/hero-image');
  assert.equal(snapshot.settings.heroVideo.type, 'video/mp4');
  assert.equal(snapshot.settings.badges[0].image.description, 'Synthetic badge-image description');
  assert.equal(snapshot.settings.contentSecurityPolicy, "default-src 'self'; img-src 'self' https:;");
  assert.deepEqual(snapshot.services.map(service => service.slug), ['roof-replacement', 'roof-repair']);
  assert.deepEqual(snapshot.services[0].focusKeywords, ['roofing', 'Repair']);
  assert.doesNotMatch(JSON.stringify(snapshot), /SYNTHETIC_PRIVATE_SENTINEL|synthetic-token|client"|header_scripts|job_id/);
  assert.equal(calls.length, 2);
  for (const { collection, url, init } of calls) {
    assert.equal(init.cache, 'no-store');
    assert.equal(url.searchParams.get('meta'), 'filter_count');
    assert.equal(url.searchParams.get('limit'), '100');
    assert.equal(url.searchParams.get('page'), '1');
    assert.deepEqual(JSON.parse(url.searchParams.get('filter')), {
      client: { slug: { _eq: env.DIRECTUS_CLIENT_SLUG } }, ...(collection === 'services' ? { status: { _eq: 'published' } } : {}),
    });
    const fields = url.searchParams.get('fields').split(',');
    assert.ok(fields.includes('client.slug'));
    assert.ok(!fields.some(field => /\*|header_scripts|body_scripts|footer_scripts|job_id/.test(field)));
  }
  assert.deepEqual(JSON.parse(calls[0].url.searchParams.get('deep')), { badges: { _limit: -1 } });
});
await check('published services paginate completely and retain editorial order', async () => {
  const fixture = makeSiteShellFixture();
  fixture.services = Array.from({ length: 103 }, (_, i) => ({ ...fixture.services[0], id: `service-${i}`, slug: `service-${i}`, sort_order: 103 - i }));
  const { snapshot, calls } = await build(fixture);
  assert.equal(snapshot.services.length, 103);
  assert.equal(snapshot.services[0].slug, 'service-102');
  assert.equal(calls.filter(call => call.collection === 'services').length, 2);
});
for (const [name, alter, expected] of [
  ['HTTP failure', () => ({ ok: false, status: 503 }), /HTTP 503/],
  ['missing data', () => ({ ok: true, json: async () => ({ meta: { filter_count: 0 } }) }), /invalid collection response/],
  ['null data', () => ({ ok: true, json: async () => ({ data: null, meta: { filter_count: 0 } }) }), /invalid collection response/],
  ['API errors', () => ({ ok: true, json: async () => ({ data: [], errors: [{}], meta: { filter_count: 0 } }) }), /invalid collection response/],
  ['missing inventory count', ({ payload }) => ({ ok: true, json: async () => ({ data: payload.data }) }), /verified inventory count/],
  ['truncated inventory', ({ payload }) => ({ ok: true, json: async () => ({ ...payload, meta: { filter_count: 999 } }) }), /truncated/],
]) {
  await check(name, async () => assert.rejects(() => build(makeSiteShellFixture(), alter), expected));
}
await check('changing inventory count fails pagination', async () => {
  const fixture = makeSiteShellFixture();
  fixture.services = Array.from({ length: 101 }, (_, i) => ({ ...fixture.services[0], id: `service-${i}`, slug: `service-${i}` }));
  await assert.rejects(() => build(fixture, ({ collection, page, payload }) => ({ ok: true, json: async () => ({ ...payload,
    meta: { filter_count: collection === 'services' && page === 2 ? 102 : payload.meta.filter_count },
  }) })), /inventory changed/);
});
for (const [name, mutate, expected] of [
  ['no settings', fixture => { fixture.siteSettings = []; }, /exactly one/],
  ['multiple settings', fixture => { fixture.siteSettings.push({ ...fixture.siteSettings[0], id: 'settings-two' }); }, /exactly one/],
  ['cross-client settings', fixture => { fixture.siteSettings[0].client.slug = 'other'; }, /Site settings escaped client scope/],
  ['unexpanded settings tenant', fixture => { fixture.siteSettings[0].client = 'raw-id'; }, /Site settings escaped client scope/],
  ['missing required brand', fixture => { fixture.siteSettings[0].brand_name = ' '; }, /brand_name is required/],
  ['missing CSP', fixture => { fixture.siteSettings[0].content_security_policy = null; }, /content_security_policy is required/],
  ['missing hero', fixture => { fixture.siteSettings[0].hero_image = null; }, /hero_image is required/],
  ['undescribed hero', fixture => { fixture.siteSettings[0].hero_image.description = ''; }, /description is required/],
  ['wrong hero media kind', fixture => { fixture.siteSettings[0].hero_video.type = 'image/webp'; }, /hero_video must reference a video/],
  ['wrong logo media kind', fixture => { fixture.siteSettings[0].logo.type = 'video/mp4'; }, /logo must reference an image/],
  ['unexpanded logo', fixture => { fixture.siteSettings[0].logo = 'raw-file-id'; }, /must include directus_files.description/],
  ['unexpanded badges', fixture => { delete fixture.siteSettings[0].badges; }, /badges must be an expanded list/],
  ['cross-client badge', fixture => { fixture.siteSettings[0].badges[0].footer_badges_id.client.slug = 'other'; }, /Footer badge escaped client scope/],
  ['duplicate badge', fixture => { fixture.siteSettings[0].badges.push(structuredClone(fixture.siteSettings[0].badges[0])); }, /Duplicate footer badge/],
  ['non-image badge', fixture => { fixture.siteSettings[0].badges[0].footer_badges_id.badge.type = 'text/html'; }, /must reference an image/],
  ['draft service', fixture => { fixture.services[0].status = 'draft'; }, /Service escaped published client scope/],
  ['cross-client service', fixture => { fixture.services[0].client.slug = 'other'; }, /Service escaped published client scope/],
  ['unsafe service slug', fixture => { fixture.services[0].slug = '../other'; }, /Service slug is invalid/],
  ['duplicate service slug', fixture => { fixture.services[1].slug = fixture.services[0].slug; }, /Duplicate service slug/],
  ['missing service introduction', fixture => { fixture.services[0].intro = ''; }, /intro is required/],
  ['missing indexable service metadata', fixture => { fixture.services[0].meta_title = null; }, /meta_title is required/],
  ['keyword mismatch', fixture => { fixture.services[0].primary_focus_keyword = 'Missing'; }, /PRIMARY_FOCUS_KEYWORD_MISMATCH/],
]) {
  await check(name, async () => {
    const fixture = makeSiteShellFixture(); mutate(fixture);
    await assert.rejects(() => build(fixture), expected);
  });
}
await check('intentionally absent optional badges, socials and service image remain absent', async () => {
  const fixture = makeSiteShellFixture(); fixture.siteSettings[0].badges = null;
  const { snapshot } = await build(fixture);
  assert.deepEqual(snapshot.settings.badges, []);
  assert.equal(snapshot.settings.socials.instagram, null);
  assert.equal(snapshot.services[0].ogImageOverride, null);
});
await check('noindex services retain existing optional metadata behavior', async () => {
  const fixture = makeSiteShellFixture();
  Object.assign(fixture.services[0], { noindex: true, meta_title: null, meta_description: null, primary_focus_keyword: null, focus_keywords: null });
  const { snapshot } = await build(fixture);
  assert.equal(snapshot.services.find(service => service.noindex).metaTitle, null);
});

const require = createRequire(import.meta.url);
function loadRuntime(snapshot) {
  const source = ts.transpileModule(readFileSync(new URL('../lib/content/directus-site.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const loadedModule = { exports: {} };
  const runtimeRequire = (id) => {
    if (id === 'server-only') return {};
    if (id === 'react') return { cache: callback => callback };
    if (id === './locations') return { deployedLocations: () => snapshot };
    if (id === './site-path') return shellModule;
    if (id === './editorial') return { deployedEditorial: () => ({ websitePages: [{ path: '/other', noindex: true, pageType: 'fixed', metaTitle: 'Frozen other page' }] }) };
    if (id === '@/lib/seo/meta') return { buildBasicMetadata: value => ({ ...value }) };
    return require(id);
  };
  new Function('require', 'module', 'exports', source)(runtimeRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
await check('all shared content and page metadata remain frozen without runtime reads', async () => {
  const { snapshot: siteShell } = await build();
  const runtime = loadRuntime({ siteShell, navigation: [{ label: 'Frozen navigation', href: '/frozen' }] });
  const originalFetch = globalThis.fetch;
  const prior = { ...process.env };
  Object.assign(process.env, env);
  let liveRequests = 0;
  globalThis.fetch = async input => {
    const collection = new URL(input).pathname.split('/').at(-1);
    assert.equal(collection, 'website_pages', 'Runtime must never fetch settings or services.');
    liveRequests++;
    return { ok: true, json: async () => ({ data: [{ path: '/other', noindex: true, page_type: 'fixed', meta_title: 'Frozen other page', meta_description: null }] }) };
  };
  try {
    assert.equal((await runtime.getSiteSettings()).heroImage.url, siteShell.settings.heroImage.url);
    const bundle = await runtime.getSiteBundle();
    assert.equal(bundle.pages[0].metaTitle, 'Frozen other page');
    assert.deepEqual(bundle.settings, siteShell.settings);
    assert.deepEqual(bundle.services, siteShell.services);
    assert.equal(bundle.navigation[0].label, 'Frozen navigation');
    assert.equal(liveRequests, 0);
    assert.deepEqual(await runtime.getSiteSettings(), siteShell.settings);
    assert.deepEqual(await runtime.getServices(), siteShell.services);
    assert.equal(liveRequests, 0);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(env)) {
      if (prior[key] === undefined) delete process.env[key]; else process.env[key] = prior[key];
    }
  }
});
process.stdout.write(`${checks} location site-shell fixtures passed.\n`);
