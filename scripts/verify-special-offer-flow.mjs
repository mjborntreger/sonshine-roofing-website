import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { JSDOM } from 'jsdom';
import { mapSpecialOffer, SPECIAL_OFFER_FIELDS } from '../lib/content/build/offers.ts';

const require = createRequire(import.meta.url);
const root = resolve(new URL('../', import.meta.url).pathname);
const dom = new JSDOM('<div id="root"></div>', {
  url: 'https://example.test/special-offers/fixture?utm_source=fixture',
});
for (const key of [
  'window',
  'document',
  'HTMLElement',
  'HTMLInputElement',
  'Event',
  'MouseEvent',
  'FormData',
])
  globalThis[key] = dom.window[key];
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
HTMLElement.prototype.scrollIntoView = function () {};
const intersections = [];
globalThis.IntersectionObserver = class {
  constructor(callback) {
    intersections.push(callback);
  }
  observe() {}
  disconnect() {}
};
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const { renderToStaticMarkup } = require('react-dom/server');
const link = ({ children, ...props }) => {
  delete props.proseGuard;
  return React.createElement('a', props, children);
};
function loader(overrides = {}) {
  const cache = new Map();
  function load(filename) {
    filename = resolve(root, filename);
    if (cache.has(filename)) return cache.get(filename).exports;
    const loadedModule = { exports: {} };
    cache.set(filename, loadedModule);
    const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
      fileName: filename,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText;
    function localRequire(id) {
      if (Object.hasOwn(overrides, id)) return overrides[id];
      if (id === 'server-only') return {};
      if (id === '@/components/utils/SmartLink') return { default: link, __esModule: true };
      if (id.startsWith('@/') || id.startsWith('.')) {
        const base = id.startsWith('@/')
          ? resolve(root, id.slice(2))
          : resolve(dirname(filename), id);
        const path = [base, `${base}.ts`, `${base}.tsx`, `${base}.mjs`].find(existsSync);
        assert.ok(path, `Missing module ${id}`);
        return load(path);
      }
      return require(id);
    }
    new Function('require', 'module', 'exports', code)(
      localRequire,
      loadedModule,
      loadedModule.exports,
    );
    return loadedModule.exports;
  }
  return load;
}

const config = {
  url: 'https://cms.example.test',
  clientSlug: 'sonshine-roofing',
  token: 'synthetic',
};
const introduction = 'A complete introduction without truncation. '.repeat(10);
const raw = {
  slug: 'fixture',
  title: 'Fixture offer',
  eyebrow: 'Fixture savings',
  introduction,
  description:
    '<p>Roof <b>savings</b> &amp; details.</p><ul><li>Residential only</li></ul><a href="https://example.test" target="_blank">Terms</a><img src=x onerror=alert(1)><script>unsafe()</script><a href="javascript:alert(1)">bad</a>',
  noindex: true,
  offer_code: 'SYNTHETIC',
  expiration_date: '2099-01-01',
  discount: '$10 off',
  featured_image: { id: 'fixture-image' },
};
const normalized = mapSpecialOffer(raw, config);
assert.equal(normalized.introduction, introduction.trim());
assert.match(normalized.descriptionHtml, /<strong>savings<\/strong>/);
assert.match(normalized.descriptionHtml, /<ul><li>Residential only<\/li><\/ul>/);
assert.match(normalized.descriptionHtml, /rel="noopener noreferrer"/);
assert.doesNotMatch(normalized.descriptionHtml, /script|unsafe\(|onerror|javascript:|<img/);
assert.doesNotMatch(normalized.description, /<\/?(?:p|strong|ul|li|a)\b|&amp;/);
for (const field of ['eyebrow', 'introduction']) {
  assert.ok(SPECIAL_OFFER_FIELDS.includes(field));
  for (const blank of [undefined, null, '', '  '])
    assert.throws(
      () => mapSpecialOffer({ ...raw, [field]: blank }, config),
      /hero copy is incomplete/,
    );
}

let currentOffer = normalized;
const settings = { phone: '555-0100', phoneHref: 'tel:+15550100' };
const routeLoad = loader({
  'next/navigation': {
    notFound: () => {
      throw new Error('NOT_FOUND');
    },
  },
  '@/lib/content/directus-special-offers': {
    getSpecialOfferBySlug: async () => currentOffer,
    listSpecialOfferSlugs: async () => ['fixture'],
  },
  '@/lib/content/directus-site': { getSiteSettings: async () => settings },
  '@/lib/seo/site': { SITE_ORIGIN: 'https://example.test' },
  '@/lib/seo/meta': { buildBasicMetadata: (value) => value },
  '@/lib/content/static-media': {},
  '@/components/lead-capture/special-offer/SpecialOfferTrust': {
    __esModule: true,
    default: () => React.createElement('aside', null, 'Trust fixture'),
  },
  '@/components/lead-capture/special-offer/SpecialOfferForm': {
    __esModule: true,
    default: () => React.createElement('form', null, 'Coupon form fixture'),
  },
});
const route = routeLoad('app/(site)/special-offers/[slug]/page.tsx');
const pageInput = { params: Promise.resolve({ slug: 'fixture' }) };
const pageHtml = renderToStaticMarkup(await route.default(pageInput));
const page = new JSDOM(pageHtml).window.document;
assert.ok(pageHtml.indexOf('Fixture savings') < pageHtml.indexOf('<h1'));
assert.ok(
  page.body.textContent.includes(introduction.trim()),
  'Hero must preserve more than 180 characters',
);
assert.ok(pageHtml.indexOf('Offer Details') < pageHtml.indexOf('id="claim-offer"'));
assert.ok(page.querySelector('article ul li'));
assert.ok(page.querySelector('a[href="#claim-offer"]')?.textContent.includes('Email Me My Coupon'));
assert.doesNotMatch(pageHtml, /ROOFING SERVICES|Limited-Time Offer/);
assert.doesNotMatch((await route.generateMetadata(pageInput)).description, /<p>|<strong>/);
for (const [change, label] of [
  [{ expirationDate: '2000-01-01' }, 'This offer has expired'],
  [{ offerCode: null }, 'This offer is unavailable'],
]) {
  currentOffer = { ...normalized, ...change };
  const html = renderToStaticMarkup(await route.default(pageInput));
  assert.ok(html.includes(label));
  assert.doesNotMatch(html, /Coupon form fixture|Email Me My Coupon/);
}

// The actual form/payload/validation/analytics run with a synthetic transport only.
const events = [];
const requests = [];
let response = { ok: false, status: 503, body: { ok: false, error: 'Synthetic failure' } };
let redirected = null;
let token = 'synthetic-token';
const query = new URLSearchParams('utm_source=fixture');
const overrides = {
  'next/navigation': { useSearchParams: () => query },
  '@/lib/telemetry/gtm': { pushToDataLayer: (value) => events.push(value) },
  '@/lib/telemetry/meta': { trackMetaPixel: () => {} },
  '@/components/lead-capture/Turnstile': {
    __esModule: true,
    default: () =>
      React.createElement('input', {
        type: 'hidden',
        name: 'cfToken',
        value: token,
        readOnly: true,
      }),
  },
  '@/components/ui/button': {
    Button: ({ children, ...props }) => {
      delete props.variant;
      delete props.size;
      return React.createElement('button', props, children);
    },
  },
};
const load = loader(overrides);
const thankYou = load('lib/lead-capture/thank-you.ts');
overrides['@/lib/lead-capture/thank-you'] = {
  ...thankYou,
  redirectToThankYou: (payload) => {
    redirected = payload;
  },
};
const Form = load('components/lead-capture/special-offer/SpecialOfferForm.tsx').default;
globalThis.fetch = async (url, options) => {
  assert.equal(url, '/api/lead', 'All network must stay inside the synthetic lead transport');
  requests.push(JSON.parse(options.body));
  return { ok: response.ok, status: response.status, json: async () => response.body };
};
let mounted;
const props = {
  offerCode: 'SYNTHETIC',
  offerSlug: 'fixture',
  offerTitle: 'Fixture offer',
  offerDiscount: '$10 off',
  offerExpiration: '2099-01-01',
};
async function mount(extra = {}) {
  await act(async () => {
    mounted?.unmount();
    mounted = createRoot(document.getElementById('root'));
    mounted.render(React.createElement(Form, { ...props, ...extra }));
  });
}
async function input(id, value) {
  const element = document.getElementById(id);
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function submit() {
  await act(async () =>
    document
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  );
}
await mount();
assert.equal(document.querySelectorAll('input[type=radio]:checked').length, 0);
assert.equal(document.body.textContent.match(/Messaging rates vary/g)?.length, 1);
await act(async () => {
  intersections.at(-1)([{ isIntersecting: true, intersectionRatio: 0.2 }]);
  intersections.at(-1)([{ isIntersecting: true, intersectionRatio: 0.2 }]);
});
assert.equal(events.filter((event) => event.event === 'special_offer_form_view').length, 1);
await submit();
assert.equal(document.activeElement.id, 'firstName');
assert.equal(requests.length, 0);
for (const [id, value] of [
  ['firstName', 'Synthetic'],
  ['lastName', 'Tester'],
  ['email', 'coupon@example.test'],
  ['phone', '9415550100'],
])
  await input(id, value);
await submit();
assert.equal(document.activeElement.name, 'smsProjectConsent');
assert.equal(requests.length, 0);
for (const name of ['smsProjectConsent', 'smsMarketingConsent'])
  await act(async () => document.querySelector(`input[name="${name}"][value="no"]`).click());
const verification = document.querySelector('input[name="cfToken"]');
verification.value = '';
await submit();
assert.equal(requests.length, 0);
assert.equal(document.activeElement.getAttribute('role'), 'alert');
assert.ok(events.some((event) => event.error_type === 'verification'));
verification.value = token;
await submit();
assert.equal(requests.length, 1);
assert.equal(document.activeElement.getAttribute('role'), 'alert');
assert.equal(document.getElementById('email').value, 'coupon@example.test');
assert.equal(requests[0].smsConsent.projectSms, 'no');
assert.equal(requests[0].smsConsent.marketingSms, 'no');
assert.equal(requests[0].details.offerCode, 'SYNTHETIC');
assert.equal(requests[0].source.utm_source, 'fixture');
assert.equal(redirected, null);
assert.equal(events.filter((event) => event.event === 'special_offer_claimed').length, 0);
response = { ok: true, status: 200, body: { ok: true } };
await submit();
assert.equal(redirected.formType, 'special-offer');
assert.equal(events.filter((event) => event.event === 'special_offer_form_start').length, 1);
assert.equal(events.filter((event) => event.event === 'special_offer_claimed').length, 1);
const context = thankYou.buildThankYouContext(redirected);
assert.equal(
  thankYou.fireAdsLeadSubmitOnce(context),
  null,
  'Coupon requests must not become qualified Ads leads',
);
assert.doesNotMatch(
  JSON.stringify(events),
  /coupon@example|Synthetic failure|9415550100|"firstName":"Synthetic"/,
);
assert.ok(events.some((event) => event.error_type === 'submission'));
await mount({ offerExpiration: '2000-01-01' });
const before = requests.length;
await submit();
assert.equal(requests.length, before);
assert.match(document.body.textContent, /This offer has expired/);
await act(async () => mounted.unmount());

// Render the actual coupon-specific thank-you view and automatic review choice.
const viewLoad = loader({
  ...overrides,
  '@/lib/lead-capture/thank-you': {
    readThankYouContext: () => context,
    fireAdsLeadSubmitOnce: () => null,
  },
  '@/lib/content/directus-reviews': {
    getGoogleReviews: async () => [
      { author_name: 'Older fixture', text: 'Older review', rating: 5, time: 100 },
      {
        author_name: 'Latest fixture',
        text: 'Newest review',
        rating: 5,
        time: 200,
        author_url: 'https://example.test/review',
      },
      { author_name: 'Ineligible fixture', text: 'Do not show', rating: 4, time: 300 },
    ],
    getReviewsCarouselSettings: async () => ({ gbpProfileLink: 'https://example.test/reviews' }),
  },
});
const confirmation = renderToStaticMarkup(
  React.createElement(viewLoad('components/lead-capture/thank-you/ThankYouClient.tsx').default),
);
assert.match(confirmation, /Your coupon is on the way/);
assert.match(confirmation, /check your spam or promotions folder/);
assert.doesNotMatch(confirmation, /SYNTHETIC|9415550100|coupon@example/);
const trust = renderToStaticMarkup(
  await viewLoad('components/lead-capture/special-offer/SpecialOfferTrust.tsx').default({
    settings: null,
  }),
);
assert.match(trust, /Newest review/);
assert.doesNotMatch(trust, /Older review|Do not show/);
console.log(
  'Verified offer content, mandatory hero fields, HTML safety, layout, unavailable states, review selection, synthetic form errors/success, consent, attribution, analytics privacy, and confirmation.',
);
