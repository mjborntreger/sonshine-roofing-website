import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync, chmodSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Local visual preparation only. No CMS reads, real customer records, or app routes.
const root = fileURLToPath(new URL('../', import.meta.url));
const output = '/private/tmp/sonshine-location-migration-20260915/visual-preview';
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const modules = new Map();
let currentSlug = 'sarasota';
globalThis.fetch = async () => { throw new Error('Visual fixtures cannot make network requests.'); };

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
      const attributes = { ...props };
      delete attributes.fill; delete attributes.priority; delete attributes.quality;
      if (props.fill) {
        attributes.style = { position: 'absolute', inset: 0, width: '100%', height: '100%', ...props.style };
      }
      return React.createElement('img', attributes);
    };
    if (id === 'next/link') return function FixtureLink(props) {
      const attributes = { ...props };
      for (const key of ['prefetch', 'replace', 'scroll', 'shallow', 'locale']) delete attributes[key];
      return React.createElement('a', attributes);
    };
    if (id === 'next/navigation') return {
      usePathname: () => `/locations/${currentSlug}`,
      useSearchParams: () => new URLSearchParams(),
      useRouter: () => ({ push() {}, replace() {} }),
    };
    if (id === 'next/dynamic') return function fixtureDynamic() {
      return function DeferredBrowserBoundary() { return null; };
    };
    if (id === '@/lib/ui/allura-font') return { allura: { variable: 'fixture-font' } };
    // The imported lead-form Suspense fallback is not rendered by these fixtures.
    if (id.endsWith('.module.css')) return {};
    if (id === 'server-only' || id.includes('directus-site') || id.includes('directus-faqs')) {
      throw new Error(`Unexpected server data import: ${id}`);
    }
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

function save(path, content) {
  writeFileSync(join(output, path), content, { mode: 0o600 });
  chmodSync(join(output, path), 0o600);
}
mkdirSync(join(output, 'assets'), { recursive: true, mode: 0o700 });
chmodSync(output, 0o700);
chmodSync(join(output, 'assets'), 0o700);

const cssFiles = readdirSync(join(root, '.next/static/chunks')).filter((name) => name.endsWith('.css')).sort();
assert.ok(cssFiles.length, 'An existing baseline build must provide the real site CSS.');
for (const name of cssFiles) {
  const css = readFileSync(join(root, '.next/static/chunks', name), 'utf8').replaceAll('../media/', './');
  save(`assets/${name}`, css);
}
for (const name of readdirSync(join(root, '.next/static/media')).filter((name) => name.endsWith('.woff2'))) {
  copyFileSync(join(root, '.next/static/media', name), join(output, 'assets', name));
  chmodSync(join(output, 'assets', name), 0o600);
}
// Preserve the actual baseline font CSS and generate current utilities without
// running Next prebuild, fetching content, or touching a generated app snapshot.
const tailwind = spawnSync(process.execPath, [require.resolve('tailwindcss/lib/cli.js'),
  '-i', join(root, 'app/globals.css'), '-o', join(output, 'assets/current-site.css'), '--minify'],
{ cwd: root, encoding: 'utf8' });
assert.equal(tailwind.status, 0, `Current site CSS compilation failed: ${tailwind.stderr}`);
chmodSync(join(output, 'assets/current-site.css'), 0o600);
cssFiles.push('current-site.css');

const svg = (width, height, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
const roofArtwork = (roofColor, label) => svg(1200, 750, `
  <defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#bce8f6"/><stop offset="1" stop-color="#e9f4e9"/></linearGradient></defs>
  <rect width="1200" height="750" fill="url(#sky)"/><circle cx="975" cy="132" r="74" fill="#fff1b8"/>
  <path d="M0 570Q160 445 350 570T740 555T1200 535V750H0" fill="#678f77"/>
  <path d="M212 392H988V636H212Z" fill="#f9f4e9"/><path d="M130 396L373 165H840L1071 396Z" fill="${roofColor}"/>
  <g stroke="#ffffff" stroke-opacity=".2" stroke-width="5"><path d="M254 280H949M218 320H991M176 360H1030"/><path d="M431 166L330 395M535 166L485 395M644 166V395M744 166L806 395"/></g>
  <rect x="524" y="469" width="123" height="167" fill="#436776"/><g fill="#aedce2" stroke="#608595" stroke-width="10"><rect x="295" y="448" width="125" height="96"/><rect x="765" y="448" width="125" height="96"/></g>
  <path d="M0 668H1200V750H0" fill="#c6d9be"/><text x="35" y="718" fill="#264553" font-family="sans-serif" font-size="28">${label} · synthetic illustration</text>`);
save('assets/roof-blue.svg', roofArtwork('#506a86', 'Roofing project fixture'));
save('assets/roof-tile.svg', roofArtwork('#ad6a4c', 'Tile roofing fixture'));
save('assets/roof-metal.svg', roofArtwork('#747e85', 'Metal roofing fixture'));
save('assets/coverage.svg', svg(1080, 700, `
  <rect width="1080" height="700" fill="#eaf1df"/><path d="M0 0H280L334 174L220 334L292 540L205 700H0Z" fill="#8ccedf"/>
  <g fill="none" stroke="#fff" stroke-width="22"><path d="M320 80L995 610M400 0L525 700M750 0L865 700M240 300L1080 285M276 470L1080 462"/></g>
  <path d="M415 165L840 132L962 484L552 587L351 404Z" fill="#0045d7" fill-opacity=".09" stroke="#0045d7" stroke-width="9" stroke-dasharray="20 12"/>
  <rect x="325" y="39" width="702" height="76" rx="16" fill="#fff"/><text x="358" y="85" font-family="sans-serif" font-size="27" fill="#29496e">Illustrative coverage only — no actual geography</text>
  <text x="400" y="655" font-family="sans-serif" font-size="27" fill="#29496e">Synthetic fixture · no customer pins</text>`));
save('assets/partner.svg', svg(160, 160, '<rect width="160" height="160" rx="35" fill="#dcefff"/><path d="M80 26L97 63L137 68L107 96L115 137L80 117L45 137L53 96L23 68L63 63Z" fill="#0045d7"/><text x="80" y="156" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#334155">FIXTURE PARTNER</text>'));

const Hub = loadSource(join(root, 'components/location/LocationHub.tsx')).default;
const { SiteSettingsProvider } = loadSource(join(root, 'lib/content/site-settings-context.tsx'));
const { selectLocationContent } = loadSource(join(root, 'lib/content/location-selection.ts'));
const settings = {
  brandName: 'SonShine Roofing', phone: '(555) 555-0100', phoneHref: 'tel:+15555550100', email: 'fixture@example.com',
  licenseNumber: '', licenseUrl: '',
  heroImage: { url: './assets/roof-blue.svg', description: 'Synthetic roofing illustration for layout review', width: 1200, height: 750, type: 'image/svg+xml' },
  heroVideo: null,
};
const areas = [
  { slug: 'sarasota', name: 'Sarasota', localCount: 4 },
  { slug: 'bradenton', name: 'Bradenton', localCount: 2 },
  { slug: 'lakewood-ranch', name: 'Lakewood Ranch', localCount: 1 },
  { slug: 'venice', name: 'Venice', localCount: 6 },
  { slug: 'north-port', name: 'North Port', localCount: 0 },
];
const clientSlug = 'synthetic-fixture-client';
const neighborhoodNames = ['Sample Canopy', 'Example Harbor', 'Illustrative Grove'];
const blankGroups = () => ({ local: [], nearby: [] });
const image = (file, description) => ({ url: `./assets/${file}`, altText: description, width: 1200, height: 750 });
function projectRecord(area, index) {
  const id = `${area.slug}-project-${index}`;
  const material = ['Shingle', 'Tile', 'Metal'][index % 3];
  const file = ['roof-blue.svg', 'roof-tile.svg', 'roof-metal.svg'][index % 3];
  return {
    id, clientSlug, status: 'published', serviceAreaIds: [area.slug], date: `2026-08-${String(28 - index).padStart(2, '0')}T12:00:00Z`,
    project: { id, title: `${material} roof example in ${area.name}`, slug: id, uri: `/project/${id}`, year: 2026,
      heroImage: image(file, `${material} roof illustration for layout review`),
      projectDescription: 'Synthetic project copy demonstrates card spacing, material labels, and the link to the project story. This is not a completed customer job.',
      materialTypes: [{ name: material, slug: material.toLowerCase() }], roofColors: [{ name: 'Sample finish', slug: 'sample-finish' }],
      serviceAreas: [{ name: area.name, slug: area.slug }],
      neighborhood: index === 1 ? null : { id: `${area.slug}-neighborhood-${index % 3}`, name: neighborhoodNames[index % 3], slug: `${area.slug}-example-${index % 3}` },
      video: index === 0 ? { title: `${area.name} fixture project video`, youtubeId: 'fixture0001', thumbnailUrl: `./assets/${file}` } : null,
    },
  };
}
const projectPool = areas.flatMap((area) => Array.from({ length: area.localCount }, (_, index) => projectRecord(area, index)));
const reviewPool = areas.flatMap((area, areaIndex) => Array.from({ length: areaIndex === 4 ? 0 : 3 }, (_, index) => ({
  id: `${area.slug}-review-${index}`, clientSlug, status: 'published', serviceAreaIds: [area.slug], rating: 5,
  authorName: `Fixture Reviewer ${String.fromCharCode(65 + areaIndex * 3 + index)}`, areaName: area.name,
  text: index === 1 ? 'Synthetic review copy with a little more detail. The crew explained the work and kept the process clear. This example exists only to inspect the review-card layout.' : 'Synthetic review for layout inspection. This is not a real customer testimonial.',
  date: index === 2 ? null : `2026-07-${String(20 - index).padStart(2, '0')}T12:00:00Z`, url: null,
})));
const sponsorPool = areas.flatMap((area, areaIndex) => Array.from({ length: areaIndex === 0 ? 4 : areaIndex === 4 ? 0 : 1 }, (_, index) => ({
  id: `${area.slug}-partner-${index}`, clientSlug, status: 'published', serviceAreaIds: [area.slug], sort: index, areaNames: [area.name],
  feature: { id: `${area.slug}-partner-${index}`, slug: `${area.slug}-partner-${index}`, title: `Example Community Partner ${index + 1}`,
    contentHtml: '<p>Synthetic partnership description. Actual local relationships require verified CMS assignments.</p>',
    links: { websiteUrl: 'https://example.com' }, featuredImage: image('partner.svg', 'Synthetic partner logo') },
})));
const services = [
  { slug: 'roof-repair', href: '/roof-repair', navLabel: 'Roof repair', intro: 'Example service summary for diagnosing and repairing roofing problems.' },
  { slug: 'roof-replacement', href: '/roof-replacement', navLabel: 'Roof replacement', intro: 'Example service summary for planning a roof replacement.' },
  { slug: 'roof-inspection', href: '/roof-inspection', navLabel: 'Roof inspection', intro: 'Example service summary for understanding the condition of a roof.' },
  { slug: 'roof-maintenance', href: '/roof-maintenance', navLabel: 'Roof maintenance', intro: 'Example service summary for ongoing care.' },
];
function makeFixture(area, empty = false) {
  const areaIndex = areas.findIndex((item) => item.slug === area.slug);
  const neighbors = [areas[(areaIndex + 1) % areas.length].slug, areas[(areaIndex + 2) % areas.length].slug];
  const selection = { areaId: area.slug, nearbyAreaIds: neighbors, clientSlug };
  return {
    page: { id: area.slug, name: area.name, slug: area.slug, clientSlug, title: `Roofing services in ${area.name}`,
      introduction: `This synthetic ${area.name} introduction demonstrates concise local copy. The page brings together projects, reviews, services, and neighborhood coverage from a deployment snapshot.`,
      overviewHtml: empty ? null : '<p>Every project, review, neighborhood, partner, and map below is an illustrative fixture for layout review. No local claim or relationship on this preview has been approved for publication.</p>',
      mapImage: empty || areaIndex === 2 ? null : { url: './assets/coverage.svg', altText: 'Synthetic service coverage diagram with no customer-home pins', width: 1080, height: 700 } },
    projects: empty ? { local: [projectRecord(area, 1)], nearby: [] } : selectLocationContent(projectPool, { ...selection, kind: 'projects' }),
    reviews: empty ? blankGroups() : selectLocationContent(reviewPool, { ...selection, kind: 'reviews' }),
    sponsors: empty ? blankGroups() : selectLocationContent(sponsorPool, { ...selection, kind: 'sponsors' }),
    neighborhoodProjects: empty ? [] : projectPool.filter((record) => record.serviceAreaIds.includes(area.slug)),
    neighborhoods: empty ? [] : neighborhoodNames.map((name, index) => ({ id: `${area.slug}-neighborhood-${index}`, name, slug: `${area.slug}-example-${index}`, serviceAreaId: area.slug,
      description: index === 1 ? null : 'Illustrative coverage copy describes service availability without implying a completed project.',
      landmarks: index === 2 ? 'Illustrative park only' : null, image: index === 0 ? { url: './assets/roof-blue.svg', altText: 'Synthetic neighborhood photo placeholder', width: 1000, height: 680 } : null, mapImage: null, sort: index })),
    services: empty ? [] : services,
    faqs: empty ? [] : [
      { id: 'fixture-global', title: 'How does a roofing consultation begin?', contentHtml: '<p>This synthetic answer demonstrates the shared FAQ layout. A production answer uses the approved company process.</p>' },
      { id: `${area.slug}-faq`, title: `How do I check coverage in ${area.name}?`, contentHtml: '<p>This fixture demonstrates a local FAQ. Production copy should describe verified coverage and link to the relevant service information.</p>' },
    ],
  };
}

const cssLinks = cssFiles.map((name) => `<link rel="stylesheet" href="./assets/${name}">`).join('');
const previewStyle = `<style>
:root{--font-inter:inter;--font-candara:candara;--font-allura:allura}
.fixture-banner{font:14px/1.5 system-ui,sans-serif;background:#fff6d5;border-bottom:2px solid #c98912;color:#493208;padding:12px 20px}
.fixture-banner strong{font-weight:750}.fixture-banner a{text-decoration:underline;margin-left:12px}
.fixture-index{max-width:1100px;margin:40px auto;padding:24px;font:16px/1.6 system-ui,sans-serif}
.fixture-index h1{font-size:34px;margin:0 0 20px}.fixture-index h2{font-size:24px;margin:25px 0 10px}
.fixture-index li{margin:12px 0}.fixture-index a{color:#0045d7;text-decoration:underline}
.fixture-device{margin:24px auto;width:max-content}.fixture-device iframe{border:1px solid #bac8da;background:white;display:block}
</style>`;
const shell = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title} — synthetic location preview</title>${cssLinks}${previewStyle}</head><body>${body}</body></html>`;
const pages = [];
for (const area of [...areas, { ...areas[0], empty: true }]) {
  currentSlug = area.slug;
  const slug = area.empty ? 'empty-null-neighborhood' : area.slug;
  const fixture = makeFixture(area, area.empty);
  const body = renderToStaticMarkup(React.createElement(SiteSettingsProvider, { value: settings }, React.createElement(Hub, fixture)));
  assert.ok(!body.includes('data-msg='), 'Suspense must not hide a component render failure.');
  const banner = `<aside class="fixture-banner"><strong>FIXTURE ONLY — ${area.empty ? 'Empty sections and null neighborhood' : area.name}.</strong> Synthetic copy, projects, reviews, neighborhoods, partners and media. No actual migrated content has been accepted. Static preview; forms and players are inactive.<a href="./index.html">Preview index</a></aside>`;
  // Disable the genuine form's native submission in this noninteractive preview.
  save(`${slug}.html`, shell(area.name, banner + body.replaceAll('<form ', '<form inert ')));
  for (const [device, width, height] of [['desktop', 1440, 1100], ['mobile', 390, 844]]) {
    save(`${slug}-${device}.html`, shell(`${area.name} ${device}`, `<aside class="fixture-banner"><strong>Fixture viewport: ${width} × ${height}</strong><a href="./index.html">Preview index</a><a href="./${slug}.html">Open responsive page</a></aside><div class="fixture-device"><iframe src="./${slug}.html" title="${area.name} fixture at ${width} pixels" width="${width}" height="${height}"></iframe></div>`));
  }
  pages.push({ slug, name: area.empty ? 'Empty sections / null neighborhood' : area.name,
    projects: { local: fixture.projects.local.length, nearby: fixture.projects.nearby.length },
    reviews: { local: fixture.reviews.local.length, nearby: fixture.reviews.nearby.length },
    sponsors: { local: fixture.sponsors.local.length, nearby: fixture.sponsors.nearby.length } });
}
const links = pages.map((page) => `<li><strong>${page.name}</strong> — <a href="./${page.slug}.html">responsive page</a> · <a href="./${page.slug}-desktop.html">desktop 1440</a> · <a href="./${page.slug}-mobile.html">mobile 390</a><br>Projects ${page.projects.local} local / ${page.projects.nearby} nearby; reviews ${page.reviews.local} / ${page.reviews.nearby}; partners ${page.sponsors.local} / ${page.sponsors.nearby}.</li>`).join('');
save('index.html', shell('Preview index', `<main class="fixture-index"><h1>Location hub visual fixtures</h1><p><strong>Fixture only. These are not migrated or accepted location pages.</strong></p><p>The real LocationHub, coverage section, LandingHero, lead form shell, project cards, video facade, sponsor cards, FAQ components, sanitizers and selectors are server-rendered with synthetic data. Baseline font CSS and local fonts are preserved; current site CSS is generated with the existing Tailwind configuration.</p><ul>${links}</ul><h2>Limits</h2><p>Next image/link/font and browser navigation boundaries are mocked. Deferred Turnstile and success components are omitted as in server output; unused Suspense fallback CSS modules are mocked. No hydration, submission, video playback, hero motion, production header/footer, SEO route metadata or actual map geography is tested here. These fixtures require final visual verification against the credentialed candidate build.</p></main>`));
const ownedSources = ['components/location/LocationHub.tsx', 'components/location/ServiceAreaSection.tsx', 'lib/content/location-selection.ts', 'scripts/preview-location-components.mjs'];
save('manifest.json', `${JSON.stringify({ fixtureOnly: true, pages, viewports: { desktop: [1440, 1100], mobile: [390, 844] }, cssFiles,
  sourceHashes: Object.fromEntries(ownedSources.map((path) => [path, createHash('sha256').update(readFileSync(join(root, path))).digest('hex')])),
  limits: ['Synthetic content and illustrations only', 'Static SSR without hydration or playback', 'Next image/link/font/navigation mocked; deferred browser components and unused fallback CSS omitted', 'Baseline font CSS and current Tailwind CSS; verify with credentialed candidate', 'No actual migrated-page or editorial acceptance'],
}, null, 2)}\n`);
process.stdout.write(`Generated ${pages.length} synthetic visual scenarios at ${output}/index.html\n`);
