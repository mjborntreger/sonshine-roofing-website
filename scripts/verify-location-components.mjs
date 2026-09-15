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
const { renderToStaticMarkup } = require('react-dom/server');
const modules = new Map();

// Compile the actual location, card, video facade, FAQ and sanitizer code. Only
// Next's image/link/font boundary and the unchanged settings/lead-form hero are replaced.
function loadSource(filename) {
  if (modules.has(filename)) return modules.get(filename).exports;
  const loaded = { exports: {} };
  modules.set(filename, loaded);
  const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: filename,
  }).outputText;
  const localRequire = (id) => {
    if (id === 'next/image') return function FixtureImage(props) {
      const attributes = { ...props }; delete attributes.fill; delete attributes.priority;
      return React.createElement('img', attributes);
    };
    if (id === 'next/link') return function FixtureLink(props) {
      const attributes = { ...props }; delete attributes.prefetch;
      return React.createElement('a', attributes);
    };
    if (id === '@/lib/ui/allura-font') return { allura: { variable: 'fixture-font' } };
    if (id === '@/components/marketing/landing-page/LandingHero') return function FixtureHero({ title }) {
      return React.createElement('header', null, React.createElement('h1', null, title));
    };
    if (id === 'server-only' || id.includes('directus-site') || id.includes('directus-faqs')) throw new Error(`Unexpected server data import: ${id}`);
    if (id.startsWith('@/') || id.startsWith('.')) {
      const base = id.startsWith('@/') ? resolve(root, id.slice(2)) : resolve(dirname(filename), id);
      const candidate = [base, `${base}.ts`, `${base}.tsx`].find((path) => existsSync(path));
      assert.ok(candidate, `Module exists: ${id}`);
      return loadSource(candidate);
    }
    return require(id);
  };
  new Function('require', 'module', 'exports', source)(localRequire, loaded, loaded.exports);
  return loaded.exports;
}
const Hub = loadSource(resolve(root, 'components/location/LocationHub.tsx')).default;
const Coverage = loadSource(resolve(root, 'components/location/ServiceAreaSection.tsx')).default;
const page = { id: 'area-local', name: 'Fixture City', slug: 'fixture-city', clientSlug: 'fixture-client', title: 'Roofing in Fixture City', introduction: 'Roofing services for Fixture City.', overviewHtml: null, mapImage: null };
const emptyGroups = () => ({ local: [], nearby: [] });
const baseProps = () => ({ page, projects: emptyGroups(), reviews: emptyGroups(), sponsors: emptyGroups(), neighborhoods: [], faqs: [], services: [] });
const project = (id, overrides = {}) => ({ id, status: 'published', clientSlug: 'fixture-client', serviceAreaIds: ['area-local'], project: {
  id, title: `Project ${id}`, slug: id, uri: `/project/${id}`, heroImage: null, projectDescription: 'A verified project.', materialTypes: [], roofColors: [],
  serviceAreas: [{ name: 'Fixture City', slug: 'fixture-city' }], neighborhood: null, video: null, ...overrides,
} });
const neighborhood = (overrides = {}) => ({ id: 'neighborhood-one', name: 'Fixture Neighborhood', slug: 'fixture-neighborhood', serviceAreaId: 'area-local', description: null, landmarks: null, image: null, mapImage: null, sort: 0, ...overrides });
const render = (Component, props) => new JSDOM(renderToStaticMarkup(React.createElement(Component, props))).window.document;
let checks = 0;
function check(name, callback) {
  try { callback(); checks++; } catch (error) { error.message = `${name}: ${error.message}`; throw error; }
}

check('empty optional sections leave no headings, maps, reviews or placeholders', () => {
  const doc = render(Hub, baseProps());
  assert.equal(doc.querySelector('h1').textContent, page.title);
  assert.equal(doc.querySelectorAll('[data-location-hub] section').length, 0);
  assert.equal(doc.querySelectorAll('[data-location-hub] h2, [data-location-hub] img, [data-location-hub] details, [data-location-hub] [data-project-neighborhood]').length, 0);
  assert.doesNotMatch(doc.body.textContent, /No .+ yet|not provided|Neighborhood \d|39 years/);
});
check('a null neighborhood removes its entire label and wrapper', () => {
  const props = baseProps(); props.projects.local = [project('no-neighborhood')];
  const doc = render(Hub, props);
  assert.equal(doc.querySelectorAll('[data-project-neighborhood]').length, 0);
  assert.doesNotMatch(doc.body.textContent, /Neighborhood:/);
});
check('verified project neighborhood renders exactly one label; unpublished video removes its full player', () => {
  const props = baseProps(); props.projects.local = [project('named', { neighborhood: { id: 'n', name: 'Verified Neighborhood', slug: 'verified' } })];
  const doc = render(Hub, props);
  assert.equal(doc.querySelector('[data-project-neighborhood]').textContent, 'Neighborhood: Verified Neighborhood');
  assert.equal(doc.querySelectorAll('button[aria-label^="Play video"]').length, 0);
  assert.doesNotMatch(doc.body.textContent, /Drone Video|Tap to watch/);
  assert.ok(doc.querySelector('a[href="/project/named"]'));
});
check('published video retains the existing accessible facade and no eager iframe', () => {
  const props = baseProps(); props.projects.local = [project('with-video', { video: { title: 'Fixture roof video', youtubeId: 'fixture0001', thumbnailUrl: 'https://example.com/video.jpg' } })];
  const doc = render(Hub, props);
  assert.ok(doc.querySelector('button[aria-label="Play video: Fixture roof video"]'));
  assert.equal(doc.querySelectorAll('iframe').length, 0);
});
check('coverage records need a real name and omit every absent detail', () => {
  const doc = render(Coverage, { areaId: page.id, locationName: page.name, mapImage: null, neighborhoods: [neighborhood(), neighborhood({ id: 'blank', name: ' ' }), neighborhood({ id: 'other-area', name: 'Other place', serviceAreaId: 'other' })], projects: [] });
  assert.deepEqual([...doc.querySelectorAll('h3')].map((node) => node.textContent), ['Fixture Neighborhood']);
  assert.equal(doc.querySelectorAll('img, details, ul, figcaption').length, 0);
  assert.doesNotMatch(doc.body.textContent, /ZIP|landmarks|No map|No description|Other place|Neighborhood 2/);
});
check('coverage links only verified published project matches, including projects outside recent six', () => {
  const matching = project('older-match', { neighborhood: { id: 'neighborhood-one', name: 'Fixture Neighborhood', slug: 'fixture-neighborhood' } });
  const props = baseProps(); props.neighborhoods = [neighborhood()];
  props.neighborhoodProjects = [matching, { ...project('draft', matching.project), id: 'draft', status: 'draft' }, project('no-match')];
  const doc = render(Hub, props);
  const links = [...doc.querySelectorAll('[aria-labelledby="location-coverage"] a')].map((node) => node.getAttribute('href'));
  assert.deepEqual(links, ['/project/older-match']);
  assert.equal(doc.querySelectorAll('a[href^="/neighborhood"]').length, 0);
});
check('coverage maps preserve verified descriptions and never add customer pins', () => {
  const doc = render(Coverage, { areaId: page.id, locationName: page.name, mapImage: { url: 'https://example.com/coverage.png', altText: 'Verified coverage outline for Fixture City' }, neighborhoods: [neighborhood({ mapImage: { url: 'https://example.com/neighborhood.png', altText: 'Verified neighborhood coverage outline' } })], projects: [] });
  assert.deepEqual([...doc.querySelectorAll('img')].map((node) => node.alt), ['Verified coverage outline for Fixture City', 'Verified neighborhood coverage outline']);
  assert.equal(doc.querySelectorAll('iframe, [data-latitude], [data-longitude]').length, 0);
  assert.match(doc.querySelector('figcaption').textContent, /service coverage map/);
});
check('neighborhood photos render separately from optional coverage maps', () => {
  const doc = render(Coverage, { areaId: page.id, locationName: page.name, mapImage: null, neighborhoods: [neighborhood({ image: { url: 'https://example.com/entrance.png', altText: 'Synthetic neighborhood entrance sign' } })], projects: [] });
  assert.equal(doc.querySelector('img').alt, 'Synthetic neighborhood entrance sign');
  assert.equal(doc.querySelectorAll('figcaption').length, 0);
});
check('section order and regional labels remain accurate and no business rating markup is emitted', () => {
  const props = baseProps();
  props.projects.local = [project('local')];
  props.projects.nearby = [{ ...project('regional', { serviceAreas: [{ name: 'Nearby Town', slug: 'nearby-town' }] }), serviceAreaIds: ['area-nearby'] }];
  const review = (id, areaName) => ({ id, authorName: 'Fixture Reviewer', text: 'Synthetic review.', rating: 5, areaName, date: null, url: null });
  props.reviews = { local: [review('local-review', page.name)], nearby: [review('nearby-review', 'Nearby Town')] };
  props.services = [{ slug: 'roof-repair', href: '/roof-repair', navLabel: 'Roof repair', intro: 'Repair service.' }];
  props.neighborhoods = [neighborhood()];
  props.sponsors.local = [{ id: 'sponsor-local', areaNames: [page.name], feature: { title: 'Fixture local partner', links: null, contentHtml: null, featuredImage: null } }];
  props.sponsors.nearby = [{ id: 'sponsor-nearby', areaNames: ['Nearby Town'], feature: { title: 'Fixture nearby partner', links: null, contentHtml: null, featuredImage: null } }];
  props.faqs = [{ id: 'faq-one', title: 'Fixture question?', contentHtml: '<p>Verified &amp; safe answer.</p>' }];
  const doc = render(Hub, props);
  assert.deepEqual([...doc.querySelectorAll('[data-location-hub] h2')].map((node) => node.textContent), [
    'Recent roofing projects in Fixture City', 'Roofing projects in nearby areas', 'Reviews from Fixture City', 'Reviews from nearby areas',
    'Roofing services', 'Roofing coverage in Fixture City', 'Partnerships in Fixture City', 'Partnerships in nearby areas', 'Roofing questions and answers',
  ]);
  assert.match(doc.querySelector('[aria-label="Roofing projects in nearby areas"]').textContent, /Nearby Town/);
  assert.match(doc.querySelector('[aria-label="Reviews from nearby areas"]').textContent, /Nearby Town/);
  assert.match(doc.querySelector('[aria-label="Partnerships in nearby areas"]').textContent, /Nearby Town/);
  assert.equal(doc.querySelectorAll('time').length, 0);
  const schema = JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent);
  assert.equal(schema['@type'], 'FAQPage');
  assert.equal(schema.mainEntity[0].acceptedAnswer.text, 'Verified & safe answer.');
  assert.doesNotMatch(JSON.stringify(schema), /AggregateRating|RoofingContractor|"Review"/);
});
check('CMS HTML remains sanitized and review text is escaped', () => {
  const props = baseProps();
  props.page = { ...page, overviewHtml: '<p>Overview</p><img src="private"><script>unsafeOverview()</script>' };
  props.faqs = [{ id: 'faq', title: 'Safe question', contentHtml: '<p>Answer<a href="javascript:alert(1)">link</a></p><script>unsafeFaq()</script>' }];
  props.reviews.local = [{ id: 'review', authorName: 'Fixture', areaName: page.name, rating: 5, text: '<img src=x onerror=unsafeReview()>', url: null, date: 'invalid' }];
  props.sponsors.local = [{ id: 'sponsor', areaNames: [page.name], feature: { title: 'Fixture partner', links: null, featuredImage: null, contentHtml: '<p>Partner</p><script>unsafeSponsor()</script>' } }];
  const doc = render(Hub, props);
  assert.equal(doc.querySelectorAll('[data-location-hub] img, a[href^="javascript:"], script:not([type="application/ld+json"])').length, 0);
  assert.doesNotMatch(doc.querySelector('[data-location-hub]').innerHTML, /unsafeOverview|unsafeFaq|unsafeSponsor/);
  assert.match(doc.querySelector('blockquote').textContent, /<img src=x onerror=unsafeReview\(\)>/);
});
process.stdout.write(`${checks} location component fixtures passed.\n`);
