import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { JSDOM } from 'jsdom';

// Exercise the real browser storage/event contract without sending a lead or tag.
const require = createRequire(import.meta.url);
const root = resolve(new URL('../', import.meta.url).pathname);
const dom = new JSDOM('', { url: 'https://example.test/landing/financing' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const cache = new Map();
function load(filename) {
  filename = resolve(root, filename);
  if (cache.has(filename)) return cache.get(filename).exports;
  const mod = { exports: {} };
  cache.set(filename, mod);
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  function localRequire(id) {
    if (id.startsWith('@/') || id.startsWith('.')) {
      const base = id.startsWith('@/') ? resolve(root, id.slice(2)) : resolve(dirname(filename), id);
      const path = [base, `${base}.ts`, `${base}.tsx`].find(existsSync);
      assert.ok(path, `Missing module ${id}`);
      return load(path);
    }
    return require(id);
  }
  new Function('require', 'module', 'exports', code)(localRequire, mod, mod.exports);
  return mod.exports;
}
const thankYou = load('lib/lead-capture/thank-you.ts');
const attribution = load('lib/lead-capture/attribution.ts');
const fixtures = [
  ['/landing/roof-replacement', 'retail', '20-plus-years', 'shingle', 2500, 'roof_replacement'],
  ['/landing/roof-repair', 'repair', '10-15-years', 'tile', 1100, 'roof_repair'],
  ['/landing/financing', 'retail', '20-plus-years', 'tile', 3000, 'roof_replacement'],
  ['/landing/roof-replacement', 'retail', undefined, undefined, 1500, 'roof_replacement'],
  ['/landing/roof-repair', 'repair', undefined, undefined, 300, 'roof_repair'],
  ['/landing/financing', 'retail', undefined, undefined, 1500, 'roof_replacement'],
];
for (const [index, [page, projectType, roofAge, roofType, value, leadType]] of fixtures.entries()) {
  window.history.replaceState({}, '', `${page}?gclid=synthetic-click&utm_source=google&utm_medium=cpc&utm_campaign=synthetic`);
  attribution.captureLeadAttributionFromCurrentUrl();
  const stored = attribution.getLeadAttributionForSubmit();
  assert.equal(stored.gclid, 'synthetic-click');
  assert.equal(stored.utm_campaign, 'synthetic');
  const payload = {
    sri_lead_id: `sri_landing_synthetic_${index}`,
    formType: 'contact-lead',
    submittedAt: new Date().toISOString(),
    source: { ...stored, page },
    address: { city: 'Sarasota', zip: '34240' },
    details: { projectType, roofAge, roofType },
  };
  thankYou.persistThankYouContext(payload);
  const context = thankYou.readThankYouContext(payload.sri_lead_id);
  assert.equal(context.source.page, page);
  assert.equal(context.source.gclid, 'synthetic-click');
  assert.equal(context.source.utm_campaign, 'synthetic');
  const event = thankYou.fireAdsLeadSubmitOnce(context);
  assert.equal(event.form_location, page);
  assert.equal(event.conversion_value, value);
  assert.equal(event.currency, 'USD');
  assert.equal(event.lead_type, leadType);
  assert.equal(event.lead_id, payload.sri_lead_id);
  assert.equal(event.city, 'Sarasota');
  assert.equal(event.zip, '34240');
  assert.equal(thankYou.fireAdsLeadSubmitOnce(context), null, 'Refresh must not duplicate a lead');
}
assert.equal(window.__gtmQueue.length, fixtures.length);
assert.equal(thankYou.readThankYouContext('sri_missing_context'), null);
const baseContext = {
  sri_lead_id: 'sri_organic_synthetic',
  formType: 'financing-calculator',
  submittedAt: new Date().toISOString(),
  source: { page: '/financing' },
  details: { projectType: 'retail', roofAge: '20-plus-years', roofType: 'tile' },
};
assert.equal(thankYou.buildAdsLeadDataLayerEvent(baseContext).conversion_value, 1500);
for (const formType of ['special-offer', 'feedback']) {
  assert.equal(thankYou.buildAdsLeadDataLayerEvent({ ...baseContext, formType }), null);
}
assert.equal(thankYou.buildAdsLeadDataLayerEvent({
  ...baseContext, formType: 'contact-lead', source: { page: '/roof-inspection' },
  details: { projectType: 'other', roofAge: '10-15-years', roofType: 'metal' },
}).conversion_value, 1100);
console.log('Verified landing source/attribution, six value cases, once-per-lead events and organic conversion exceptions. No network requests.');
