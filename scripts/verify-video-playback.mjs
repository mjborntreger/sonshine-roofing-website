import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, test } from 'node:test';
import ts from 'typescript';
import { JSDOM } from 'jsdom';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
// Use the same React build as the App Router to catch its client-rendered script warning.
const React = require('next/dist/compiled/react');
const { act } = React;
const ReactDOM = require('next/dist/compiled/react-dom');
const { createRoot } = require('next/dist/compiled/react-dom/client');
const dom = new JSDOM('<div id="root"></div>', {
  url: 'https://video.test/video-library',
  pretendToBeVisual: true,
});
for (const key of [
  'window',
  'document',
  'HTMLElement',
  'HTMLInputElement',
  'Event',
  'MouseEvent',
  'KeyboardEvent',
])
  globalThis[key] = dom.window[key];
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
window.scrollTo = () => {};
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
const observers = new Set();
globalThis.IntersectionObserver = class {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    observers.add(this);
  }
  disconnect() {
    observers.delete(this);
  }
};

const navigationListeners = new Set();
const writes = [];
for (const method of ['pushState', 'replaceState']) {
  const original = window.history[method].bind(window.history);
  window.history[method] = (...args) => {
    original(...args);
    writes.push({ method, url: window.location.href });
    navigationListeners.forEach((listener) => listener());
  };
}
window.addEventListener('popstate', () => navigationListeners.forEach((listener) => listener()));
const navigation = {
  useSearchParams() {
    const query = React.useSyncExternalStore(
      (listener) => {
        navigationListeners.add(listener);
        return () => navigationListeners.delete(listener);
      },
      () => window.location.search,
    );
    return React.useMemo(() => new URLSearchParams(query), [query]);
  },
};
const video = (slug, source = 'project') => ({
  id: `${source}-${slug}`,
  slug,
  title: `Video ${slug}`,
  youtubeId: `youtube-${slug}`,
  source,
  excerpt: '',
  categories: [],
  materialTypes: [],
  serviceAreas: [],
});
const alpha = video('alpha');
const beta = video('beta');
const later = video('later');
const entry = { ...video('entry', 'video_entry'), id: 'video-entry' };
const allVideos = [alpha, beta, later, entry];
const page = (items, hasNextPage = false) => ({
  items,
  total: allVideos.length,
  pageInfo: { hasNextPage, endCursor: hasNextPage ? '2' : null },
});
const initial = page([alpha, beta], true);
const requests = [];
globalThis.fetch = async (url, init) => {
  const body = JSON.parse(init.body);
  if (body.query) {
    assert.match(body.query, /query ListVideoEntries/);
    return {
      ok: true,
      json: async () => ({
        data: {
          videoEntries: {
            nodes: [
              {
                id: entry.id,
                slug: entry.slug,
                title: entry.title,
                videoCategories: { nodes: [] },
                videoLibraryMetadata: {
                  youtubeUrl: `https://www.youtube.com/watch?v=${entry.youtubeId}`,
                },
              },
            ],
          },
        },
      }),
    };
  }
  requests.push(body);
  return {
    ok: true,
    json: async () =>
      body.filters?.q === 'no matches'
        ? { ...page([]), total: 0 }
        : body.after
          ? page([later, entry])
          : initial,
  };
};

const element = (tag) =>
  function Element({ children, ...props }) {
    return React.createElement(tag, props, children);
  };
const motionDiv = React.forwardRef(function MotionDiv({ children, ...props }, ref) {
  const domProps = Object.fromEntries(
    Object.entries(props).filter(
      ([key]) => !['initial', 'animate', 'exit', 'transition'].includes(key),
    ),
  );
  return React.createElement('div', { ...domProps, ref }, children);
});
const mocks = {
  react: React,
  'react/jsx-runtime': require('next/dist/compiled/react/jsx-runtime'),
  'react-dom': ReactDOM,
  'next/navigation': navigation,
  'next/dynamic': () =>
    loadSource(resolve(root, 'components/dynamic-content/video/VideoModal.tsx')).default,
  'framer-motion': { AnimatePresence: ({ children }) => children, motion: { div: motionDiv } },
  'next/image': () => null,
  'lucide-react': new Proxy({}, { get: () => () => null }),
  '@/components/utils/SmartLink': element('a'),
  '@/components/dynamic-content/blog/BlogArchiveCard': () => null,
  '@/components/dynamic-content/project/ProjectArchiveCard': () => null,
  '@/components/layout/Section': element('section'),
  '@/components/ui/Hero': () => null,
  '@/components/global-nav/static-pages/ResourcesAside': () => null,
  '@/lib/content/projects': { listProjectVideos: async () => [alpha, beta, later] },
  '@/lib/content/videos': { listVideoItemsPaged: async () => initial },
  '@/lib/seo/json-ld': { JsonLd: () => null },
  '@/lib/seo/schema': { breadcrumbSchema: () => ({}), collectionPageSchema: () => ({}) },
  '@/lib/seo/site': { SITE_ORIGIN: 'https://video.test' },
  '@/lib/content/directus-site': { getWebsitePageMetadata: async () => ({}) },
};
const modules = new Map();
function loadSource(filename) {
  if (modules.has(filename)) return modules.get(filename).exports;
  const loaded = { exports: {} };
  modules.set(filename, loaded);
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  const localRequire = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id.endsWith('.css')) return {};
    if (id.startsWith('@/') || id.startsWith('.')) {
      const base = id.startsWith('@/')
        ? resolve(root, id.slice(2))
        : resolve(dirname(filename), id);
      return loadSource([base, `${base}.ts`, `${base}.tsx`].find((path) => existsSync(path)));
    }
    return require(id);
  };
  new Function('require', 'module', 'exports', compiled)(localRequire, loaded, loaded.exports);
  return loaded.exports;
}
const Page = loadSource(resolve(root, 'app/(site)/video-library/page.tsx')).default;
const { listRecentVideoEntries } = loadSource(resolve(root, 'lib/content/wp.ts'));
let mounted;
async function mount(query = '', strict = false) {
  await act(async () => {
    mounted?.unmount();
    window.history.replaceState(null, '', `/video-library${query}`);
  });
  writes.length = 0;
  requests.length = 0;
  const tree = await Page();
  mounted = createRoot(document.getElementById('root'));
  await act(async () =>
    mounted.render(strict ? React.createElement(React.StrictMode, null, tree) : tree),
  );
}
const selected = () => new URLSearchParams(window.location.search).get('v');
const dialog = () => document.querySelector('[role="dialog"]');
const button = (name) =>
  [...document.querySelectorAll('button')].find(
    (el) => (el.getAttribute('aria-label') || el.textContent).trim() === name,
  );
async function click(name) {
  const target = button(name);
  assert.ok(target, `button ${name} exists`);
  await act(async () => target.click());
}
async function travel(direction) {
  await act(async () => {
    await new Promise((resolveEvent) => {
      window.addEventListener('popstate', resolveEvent, { once: true });
      window.history[direction]();
    });
  });
}

test('client rendering the actual video route emits no executable-script warning', async () => {
  const errors = [];
  const original = console.error;
  console.error = (...args) => errors.push(args.map(String).join(' '));
  try {
    await mount();
  } finally {
    console.error = original;
  }
  assert.deepEqual(errors, []);
});

test('the WordPress video adapter preserves the slug used by playback links', async () => {
  const [mapped] = await listRecentVideoEntries();
  assert.equal(mapped.slug, entry.slug);
  assert.equal(mapped.id, entry.id, 'existing ID links remain available');
});

test('Play and Watch video each update sharing once, preserving filters and hash', async () => {
  await mount('?bk=roofing-project&utm_source=test#videos');
  writes.length = 0;
  requests.length = 0;
  await click('Play Video alpha');
  assert.equal(selected(), 'alpha');
  assert.equal(dialog()?.getAttribute('aria-label'), alpha.title);
  assert.equal(
    document.getElementById('video-share-url')?.value,
    'https://video.test/video-library?v=alpha',
  );
  assert.equal(writes.length, 1);
  assert.equal(requests.length, 0, 'opening a video does not requery the archive');
  assert.equal(new URLSearchParams(window.location.search).get('bk'), 'roofing-project');
  assert.equal(new URLSearchParams(window.location.search).get('utm_source'), 'test');
  assert.equal(window.location.hash, '#videos');
  await click('Play Video alpha');
  assert.equal(writes.length, 1, 'opening the same video is a no-op for history');
  await click('Close');
  assert.equal(selected(), null);
  assert.equal(dialog(), null);
  assert.equal(document.getElementById('video-share-url'), null);
  await click('Watch video');
  assert.equal(selected(), 'alpha');
  assert.equal(writes.length, 3);
});

test('slug and legacy ID links, including videos beyond page one, open without writing history', async () => {
  for (const value of [
    'alpha',
    'project-alpha',
    'later',
    'project-later',
    'entry',
    'video-entry',
  ]) {
    await mount(`?v=${value}`, true);
    assert.ok(dialog(), `opens ${value}`);
    assert.equal(writes.length, 0, 'URL restoration is read-only, including Strict Mode');
  }
  await mount('?v=missing-video');
  assert.equal(dialog(), null);
  assert.equal(writes.length, 0);
});

test('Back and Forward restore or close the modal without creating entries', async () => {
  await mount();
  await click('Play Video alpha');
  await click('Close');
  const count = writes.length;
  await travel('back');
  assert.equal(selected(), 'alpha');
  assert.ok(dialog());
  await travel('back');
  assert.equal(selected(), null);
  assert.equal(dialog(), null);
  await travel('forward');
  assert.equal(dialog()?.getAttribute('aria-label'), alpha.title);
  assert.equal(writes.length, count);
});

test('a shared video remains available when saved filters have no results', async () => {
  await mount('?v=later&q=no+matches');
  assert.equal(dialog()?.getAttribute('aria-label'), later.title);
  assert.equal(selected(), 'later');
  assert.equal(writes.length, 0);
  await click('Close');
  assert.match(document.body.textContent, /No results found/);
  assert.equal(selected(), null);
  await click('Clear all');
  assert.ok(button('Play Video alpha'));
  const count = writes.length;
  await travel('back');
  assert.equal(dialog(), null);
  await travel('back');
  assert.equal(dialog()?.getAttribute('aria-label'), later.title);
  assert.equal(writes.length, count);
});

test('Escape and backdrop close remove the video URL only once', async () => {
  await mount('?v=alpha');
  await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
  assert.equal(selected(), null);
  assert.equal(writes.length, 1);
  await click('Play Video beta');
  const backdrop = dialog().querySelector('.absolute.inset-0.flex');
  await act(async () => {
    backdrop.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    backdrop.click();
  });
  assert.equal(selected(), null);
  assert.equal(writes.length, 3, 'pointerdown and click do not duplicate the close entry');
});

test('later paginated videos share and survive Back/Forward', async () => {
  await mount();
  await act(async () =>
    observers.forEach((observer) => observer.callback([{ isIntersecting: true }])),
  );
  assert.ok(button('Play Video later'));
  await click('Play Video later');
  assert.equal(selected(), 'later');
  await click('Close');
  await travel('back');
  assert.equal(dialog()?.getAttribute('aria-label'), later.title);
});

test('Search, Clear all, and filter history remain independent of video selection', async () => {
  await mount('?utm_source=test');
  await click('Play Video alpha');
  await click('Close');
  await act(async () => {
    const bucket = document.getElementById('video-bucket');
    bucket.value = 'commercials';
    bucket.dispatchEvent(new Event('change', { bubbles: true }));
  });
  assert.equal(requests.length, 0, 'draft filter edits do not fetch');
  assert.equal(writes.length, 2);
  await click('Search');
  assert.equal(new URLSearchParams(window.location.search).get('bk'), 'commercials');
  assert.equal(dialog(), null, 'applying filters does not reopen the closed video');
  assert.equal(requests.length, 1);
  await click('Play Video beta');
  await click('Close');
  await click('Clear all');
  assert.equal(window.location.search, '?utm_source=test');
  assert.equal(document.getElementById('video-bucket').value, '');
  assert.equal(requests.length, 2);
  const count = writes.length;
  await travel('back');
  assert.equal(document.getElementById('video-bucket').value, 'commercials');
  assert.equal(dialog(), null);
  await travel('back');
  assert.equal(dialog()?.getAttribute('aria-label'), beta.title);
  assert.equal(writes.length, count, 'filter/video restoration never rewrites history');
});

test('Copy link uses the selected video and repeated route visits do not leak listeners', async () => {
  let copied;
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (value) => {
        copied = value;
      },
    },
  });
  for (let visit = 0; visit < 3; visit += 1) {
    await mount('', true);
    await click('Play Video alpha');
    await click('Close');
    assert.equal(writes.length, 2);
  }
  await click('Play Video beta');
  await click('Copy link');
  assert.equal(copied, 'https://video.test/video-library?v=beta');
  await act(async () => mounted.unmount());
  mounted = null;
  const count = writes.length;
  window.dispatchEvent(new dom.window.CustomEvent('video:open', { detail: { slug: 'alpha' } }));
  window.dispatchEvent(new Event('video:close'));
  assert.equal(writes.length, count, 'unmounted video controls cannot change another route');
  assert.equal(navigationListeners.size, 0);
});

after(async () => {
  await act(async () => mounted?.unmount());
  dom.window.close();
});
