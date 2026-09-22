import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { JSDOM } from 'jsdom';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const { renderToStaticMarkup } = require('react-dom/server');
const dom = new JSDOM('<div id="root"></div>', { url: 'https://review.test/', pretendToBeVisual: true });
for (const key of ['window', 'document', 'Node', 'HTMLElement', 'Event', 'MouseEvent', 'KeyboardEvent', 'FocusEvent']) globalThis[key] = dom.window[key];
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.requestAnimationFrame = callback => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = clearTimeout;
window.scrollTo = () => {};
let reducedMotion = false;
const mediaListeners = new Set();
window.matchMedia = () => ({
  get matches() { return reducedMotion; },
  addEventListener(_event, listener) { mediaListeners.add(listener); },
  removeEventListener(_event, listener) { mediaListeners.delete(listener); },
});

// Mock only browser-layout/Next/CMS boundaries; render actual view, lazy loader, slider, and links.
let overflow = true;
let failSliderImport = false;
let failCarouselInit = false;
const carousels = [];
const plugins = [];
const requests = [];
globalThis.fetch = async (...args) => { requests.push(args); throw new Error('Unexpected network request'); };
const cmsCalls = [];
const googleReviews = [
  { author_name: 'Synthetic older', text: 'Old Google fixture.', rating: 5, time: 1000 },
  { author_name: 'Synthetic newest', text: 'New Google fixture.', rating: 5, time: 2000 },
];
function autoScroll(options) {
  const plugin = { options, plays: 0, stops: 0, playing: false,
    play() { this.plays++; this.playing = true; }, stop() { this.stops++; this.playing = false; } };
  plugins.push(plugin);
  return plugin;
}
function embla(_viewport, options) {
  if (failCarouselInit) throw new Error('Synthetic layout failure');
  const listeners = new Map();
  const api = { options, destroyed: false, next: [], previous: [],
    canScrollNext: () => overflow, canScrollPrev: () => overflow,
    on(event, callback) { listeners.set(event, callback); return api; },
    emit(event) { listeners.get(event)?.(); },
    scrollNext(jump) { this.next.push(jump); }, scrollPrev(jump) { this.previous.push(jump); },
    destroy() { this.destroyed = true; },
  };
  carousels.push(api);
  return api;
}
const modules = new Map();
function loadSource(filename) {
  if (modules.has(filename)) return modules.get(filename).exports;
  const loaded = { exports: {} };
  modules.set(filename, loaded);
  const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true }, fileName: filename,
  }).outputText;
  const localRequire = id => {
    if (id === 'next/image') return function FixtureImage(props) {
      const attributes = { ...props }; delete attributes.fill; delete attributes.priority;
      return React.createElement('img', attributes);
    };
    if (id === 'next/link') return function FixtureLink(props) {
      const attributes = { ...props }; delete attributes.prefetch;
      return React.createElement('a', attributes);
    };
    if (id === 'embla-carousel') return embla;
    if (id === 'embla-carousel-auto-scroll') return autoScroll;
    if (id === '@/lib/content/static-media') return {
      staticImage: () => ({ url: 'https://images.test/google-logo', description: 'Google logo', type: 'image/webp', width: 40, height: 40, focalPoint: null }),
    };
    if (id === '@/lib/content/directus-reviews') return {
      DEFAULT_GOOGLE_BUSINESS_PROFILE_URL: 'https://google.test/profile',
      getGoogleReviews: async () => { cmsCalls.push('reviews'); return googleReviews; },
      getReviewsCarouselSettings: async () => { cmsCalls.push('settings'); return { limit: 20, gbpProfileLink: 'https://google.test/profile' }; },
    };
    if (id === './ReviewsSlider' && failSliderImport) throw new Error('Synthetic chunk unavailable');
    if (id === 'server-only' || id.includes('directus-')) throw new Error(`Unexpected server import: ${id}`);
    if (id.startsWith('@/') || id.startsWith('.')) {
      const base = id.startsWith('@/') ? resolve(root, id.slice(2)) : resolve(dirname(filename), id);
      const candidate = [base, `${base}.ts`, `${base}.tsx`].find(existsSync);
      assert.ok(candidate, `Module exists: ${id}`);
      return loadSource(candidate);
    }
    return require(id);
  };
  new Function('require', 'module', 'exports', source)(localRequire, loaded, loaded.exports);
  return loaded.exports;
}
const LocationCarousel = loadSource(resolve(root, 'components/reviews-widget/LocationReviewsCarousel.tsx')).default;
const GoogleCarousel = loadSource(resolve(root, 'components/reviews-widget/ReviewsCarousel.tsx')).default;
const Slider = loadSource(resolve(root, 'components/reviews-widget/ReviewsSlider.tsx')).default;
const { reviewDate, safeReviewUrl } = loadSource(resolve(root, 'components/reviews-widget/review-presentation.ts'));
const locationReview = (id, changes = {}) => ({ id, authorName: `Synthetic ${id}`, areaName: 'Fixture City', text: `Review ${id}.`, rating: 5, date: '2026-09-17', url: `https://source.test/${id}`, ...changes });
const displayReview = (id, changes = {}) => ({ id, authorName: `Synthetic ${id}`, areaName: 'Fixture City', text: `Review ${id}.`, rating: 5, ...reviewDate('2026-09-17'), sourceUrl: `https://source.test/${id}`, sourceLabel: 'Read original review', ...changes });
const staticDocument = element => new JSDOM(renderToStaticMarkup(element)).window.document;
const element = React.createElement;
let checks = 0;
async function check(name, callback) {
  try { await callback(); checks++; } catch (error) { error.message = `${name}: ${error.message}`; throw error; }
}
let reactRoot;
async function mount(component, props) {
  await cleanup();
  reactRoot = createRoot(document.getElementById('root'));
  await act(async () => { reactRoot.render(element(component, props)); });
}
async function cleanup() {
  if (reactRoot) await act(async () => { reactRoot.unmount(); });
  reactRoot = null;
  document.body.innerHTML = '<div id="root"></div>';
}
const click = async node => {
  assert.ok(node, 'Click target exists');
  await act(async () => { node.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
};
const key = async (value, options = {}) => {
  const event = new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...options });
  await act(async () => { document.activeElement.dispatchEvent(event); });
  return event;
};
const button = label => document.querySelector(`button[aria-label="${label}"]`);

try {
  await check('location rendering preserves all supplied records and order without network, Google claims, or nearby categories', () => {
    const reviews = Array.from({ length: 9 }, (_, index) => locationReview(`review-${8 - index}`, { areaName: index === 8 ? 'Second City' : 'Fixture City' }));
    const doc = staticDocument(element(LocationCarousel, { reviews }));
    assert.deepEqual([...doc.querySelectorAll('h3')].map(node => node.textContent), reviews.map(review => review.authorName));
    assert.equal(doc.querySelectorAll('article').length, 9);
    assert.equal(doc.querySelectorAll('[data-reviews-carousel]').length, 1);
    assert.match(doc.body.textContent, /Second City/);
    assert.doesNotMatch(doc.body.textContent, /Google|automatically|nearby/i);
    assert.equal(doc.querySelectorAll('img, script[type="application/ld+json"]').length, 0);
    assert.equal(cmsCalls.length, 0);
    assert.equal(requests.length, 0);
  });
  await check('empty location reviews stay absent and never fall back to Google', () => {
    const doc = staticDocument(element(LocationCarousel, { reviews: [] }));
    assert.equal(doc.body.textContent, '');
    assert.equal(doc.querySelector('[data-reviews-carousel]'), null);
    assert.equal(cmsCalls.length, 0);
  });
  await check('source URLs, unknown dates and plain review text retain safe, truthful display', () => {
    const doc = staticDocument(element(LocationCarousel, { reviews: [
      locationReview('unknown', { date: null, url: null, text: '<img src=x onerror=unsafe()>' }),
      locationReview('invalid', { date: 'invalid', url: 'javascript:alert(1)' }),
      locationReview('valid'),
    ] }));
    assert.equal(doc.querySelectorAll('time').length, 1);
    assert.equal(doc.querySelector('time').textContent, 'September 17, 2026');
    assert.equal(doc.querySelector('time').getAttribute('datetime'), '2026-09-17T00:00:00.000Z');
    assert.deepEqual([...doc.querySelectorAll('a')].map(node => node.href), ['https://source.test/valid']);
    assert.equal(doc.querySelectorAll('img').length, 0);
    assert.equal(doc.querySelector('blockquote').textContent, '<img src=x onerror=unsafe()>');
    assert.equal(safeReviewUrl('data:text/html,unsafe'), null);
    assert.equal(safeReviewUrl('//source.test/path'), null);
  });
  await check('date rendering is stable in non-UTC environments and never manufactures a missing date', () => {
    const previousTZ = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';
    try {
      assert.equal(reviewDate('2026-09-17').dateLabel, 'September 17, 2026');
      assert.deepEqual(reviewDate(null), { dateTime: null, dateLabel: null });
      assert.deepEqual(reviewDate('invalid'), { dateTime: null, dateLabel: null });
    } finally {
      if (previousTZ === undefined) delete process.env.TZ; else process.env.TZ = previousTZ;
    }
  });
  await check('several rendered review views have unique fallback targets', () => {
    const doc = staticDocument(element('div', null,
      element(LocationCarousel, { reviews: [locationReview('one')] }),
      element(LocationCarousel, { reviews: [locationReview('two')] })));
    const ids = [...doc.querySelectorAll('[data-reviews-fallback]')].map(node => node.id);
    assert.equal(new Set(ids).size, 2);
  });
  await check('Google wrapper preserves its feed, newest-first order, limit and Google attribution', async () => {
    const doc = staticDocument(await GoogleCarousel({ limit: 1 }));
    assert.deepEqual(cmsCalls, ['settings', 'reviews']);
    assert.equal(doc.querySelectorAll('article').length, 1);
    assert.match(doc.querySelector('h3').textContent, /Synthetic newest/);
    assert.match(doc.body.textContent, /official API/);
    assert.ok(doc.querySelector('img[alt="Google logo"]'));
    const before = cmsCalls.length;
    assert.equal(await GoogleCarousel({ reviews: [] }), null);
    assert.deepEqual(cmsCalls.slice(before), ['settings']);
  });
  await check('lazy import failure leaves readable server fallback and source links', async () => {
    failSliderImport = true;
    await mount(LocationCarousel, { reviews: [locationReview('fallback')] });
    await act(async () => { window.dispatchEvent(new Event('scroll')); });
    const fallback = document.querySelector('[data-reviews-fallback]');
    assert.equal(fallback.hidden, false);
    assert.ok(fallback.querySelector('a'));
    assert.equal(document.querySelector('[data-review-viewport]'), null);
    failSliderImport = false;
  });
  await check('carousel initialization failure also retains the fallback', async () => {
    failCarouselInit = true;
    await mount(LocationCarousel, { reviews: [locationReview('fallback')] });
    await act(async () => { window.dispatchEvent(new Event('scroll')); });
    assert.equal(document.querySelector('[data-reviews-fallback]').hidden, false);
    assert.equal(document.querySelector('[data-review-viewport]'), null);
    failCarouselInit = false;
  });
  await check('successful lazy enhancement hides fallback only once ready', async () => {
    await mount(LocationCarousel, { reviews: [locationReview('ready')] });
    assert.equal(document.querySelector('[data-reviews-fallback]').hidden, false);
    assert.equal(document.querySelector('[data-review-viewport]'), null);
    await act(async () => { window.dispatchEvent(new Event('scroll')); });
    assert.equal(document.querySelector('[data-reviews-fallback]').hidden, true);
    assert.ok(document.querySelector('[data-review-viewport]'));
  });
  await check('enhancement does not hide a fallback link while the reader is using it', async () => {
    await mount(LocationCarousel, { reviews: [locationReview('focused')] });
    const fallback = document.querySelector('[data-reviews-fallback]');
    const link = fallback.querySelector('a');
    await act(async () => { link.focus(); window.dispatchEvent(new Event('scroll')); });
    assert.equal(fallback.hidden, false);
    assert.equal(document.activeElement, link);
    await act(async () => { link.blur(); await new Promise(resolve => setTimeout(resolve, 5)); });
    assert.equal(fallback.hidden, true);
  });
  await check('one card or a non-overflowing group stays stationary without cloned cards or empty controls', async () => {
    overflow = false;
    await mount(Slider, { reviews: [displayReview('one')] });
    assert.equal(document.querySelectorAll('[aria-roledescription="slide"]').length, 1);
    assert.equal(document.querySelector('[aria-label="Review carousel controls"]'), null);
    assert.equal(plugins.at(-1).plays, 0);
    assert.equal(carousels.at(-1).options.loop, false);
    await mount(Slider, { reviews: [displayReview('one'), displayReview('two')] });
    assert.equal(document.querySelectorAll('[aria-roledescription="slide"]').length, 2);
    assert.equal(plugins.at(-1).plays, 0);
    overflow = true;
  });
  await check('reduced motion disables autoplay and makes manual carousel movement immediate', async () => {
    reducedMotion = true;
    await mount(Slider, { reviews: [displayReview('one'), displayReview('two')] });
    assert.equal(plugins.at(-1).plays, 0);
    assert.equal(button('Pause automatic scrolling'), null);
    await click(button('Next reviews'));
    assert.deepEqual(carousels.at(-1).next, [true]);
    reducedMotion = false;
  });
  await check('autoplay can be paused deliberately, pauses for hover/focus, and follows live motion preference changes', async () => {
    await mount(Slider, { reviews: [displayReview('one'), displayReview('two')] });
    const plugin = plugins.at(-1);
    assert.equal(plugin.playing, true);
    await click(button('Pause automatic scrolling'));
    assert.equal(plugin.playing, false);
    await click(button('Resume automatic scrolling'));
    assert.equal(plugin.playing, true);
    await act(async () => { plugin.stop(); carousels.at(-1).emit('reInit'); });
    assert.equal(plugin.playing, true, 'Resize resumes automatic motion only when still enabled');
    const region = document.querySelector('[aria-roledescription="carousel"]');
    await act(async () => { region.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, relatedTarget: document.body })); });
    assert.equal(plugin.playing, false);
    await act(async () => { region.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body })); });
    assert.equal(plugin.playing, true);
    await act(async () => { button('Next reviews').focus(); });
    assert.equal(plugin.playing, false);
    await act(async () => { button('Next reviews').blur(); });
    assert.equal(plugin.playing, true);
    await act(async () => { reducedMotion = true; mediaListeners.forEach(listener => listener()); });
    assert.equal(plugin.playing, false);
    await act(async () => { carousels.at(-1).emit('reInit'); });
    assert.equal(plugin.playing, false, 'Resize cannot override the reduced-motion preference');
    reducedMotion = false;
  });
  await check('explicit Resume works while its button retains focus and the next focus entry pauses again', async () => {
    await mount(Slider, { reviews: [displayReview('one'), displayReview('two')] });
    const plugin = plugins.at(-1);
    const control = button('Pause automatic scrolling');
    await act(async () => { control.focus(); });
    assert.equal(plugin.playing, false, 'Receiving focus pauses automatic scrolling');
    await click(control);
    assert.equal(control, button('Resume automatic scrolling'));
    await click(control);
    assert.equal(document.activeElement, control, 'Resume must not blur or move keyboard focus');
    assert.equal(plugin.playing, true, 'Explicit Resume overrides the current focus pause');
    await act(async () => { button('Next reviews').focus(); });
    assert.equal(plugin.playing, false, 'Moving focus to another carousel control pauses again');
    await act(async () => { button('Next reviews').blur(); });
    assert.equal(plugin.playing, true);
    await act(async () => { control.focus(); });
    assert.equal(plugin.playing, false, 'Returning focus to the rotation control creates a fresh pause');
  });
  await check('full review modal contains keyboard focus, supports navigation, and restores trigger focus/body state', async () => {
    document.body.style.overflow = 'clip';
    await mount(Slider, { reviews: [displayReview('one', { text: 'Full review '.repeat(40) }), displayReview('two')] });
    const trigger = button('Open full review by Synthetic one');
    await act(async () => { trigger.focus(); });
    await click(trigger);
    const dialog = document.querySelector('[role="dialog"]');
    assert.ok(dialog);
    assert.equal(document.activeElement, button('Close review'));
    assert.equal(dialog.querySelector('blockquote').textContent, 'Full review '.repeat(40));
    assert.equal(plugins.at(-1).playing, false);
    assert.equal(document.body.style.overflow, 'hidden');
    await act(async () => { button('Next review').focus(); });
    assert.equal((await key('Tab')).defaultPrevented, true);
    assert.equal(document.activeElement, button('Close review'));
    assert.equal((await key('Tab', { shiftKey: true })).defaultPrevented, true);
    assert.equal(document.activeElement, button('Next review'));
    await key('ArrowRight');
    assert.match(dialog.querySelector('h3').textContent, /Synthetic two/);
    await key('Escape');
    assert.equal(document.querySelector('[role="dialog"]'), null);
    assert.equal(document.activeElement, trigger);
    assert.equal(document.body.style.overflow, 'clip');
    document.body.style.overflow = '';
  });
  assert.equal(requests.length, 0, 'No carousel test makes a network request');
  process.stdout.write(`${checks} review carousel fixtures passed.\n`);
} finally {
  await cleanup();
  dom.window.close();
}
