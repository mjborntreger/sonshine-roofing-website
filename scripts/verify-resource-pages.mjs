import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import ts from 'typescript';
import { JSDOM } from 'jsdom';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const dom = new JSDOM('<div id="root"></div>', {
  url: 'https://resources.test/faq',
  pretendToBeVisual: true,
});
for (const key of [
  'window',
  'document',
  'HTMLElement',
  'HTMLInputElement',
  'HTMLButtonElement',
  'HTMLDetailsElement',
  'Element',
  'Event',
  'MouseEvent',
  'CustomEvent',
])
  globalThis[key] = dom.window[key];
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator });
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
window.matchMedia = () => ({ matches: true });
HTMLElement.prototype.scrollIntoView = function () {};
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const { renderToString } = require('react-dom/server');
const modules = new Map();
function loadSource(filename) {
  if (modules.has(filename)) return modules.get(filename).exports;
  const loadedModule = { exports: {} };
  modules.set(filename, loadedModule);
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
    if (id === 'next/link')
      return {
        default: ({ children, ...props }) => {
          for (const key of ['prefetch', 'replace', 'scroll', 'shallow', 'locale'])
            delete props[key];
          return React.createElement('a', props, children);
        },
        __esModule: true,
      };
    if (id.startsWith('@/') || id.startsWith('.')) {
      const base = id.startsWith('@/')
        ? resolve(root, id.slice(2))
        : resolve(dirname(filename), id);
      return loadSource([base, `${base}.ts`, `${base}.tsx`].find((path) => existsSync(path)));
    }
    return require(id);
  };
  new Function('require', 'module', 'exports', compiled)(
    localRequire,
    loadedModule,
    loadedModule.exports,
  );
  return loadedModule.exports;
}
const { mountFaqSearch } = loadSource(
  resolve(root, 'components/dynamic-content/faq/faq-search-runtime.ts'),
);
const { mountFaqBulkToggle } = loadSource(
  resolve(root, 'components/dynamic-content/faq/FaqBulkToggleClient.tsx'),
);
const Glossary = loadSource(
  resolve(root, 'components/dynamic-content/roofing-glossary/GlossaryQuickSearch.tsx'),
).default;
let cleanup = () => {};
function mountFaq(url = '/faq') {
  cleanup();
  window.history.replaceState(null, '', url);
  document.getElementById('root').innerHTML = `
    <input id="faq-search" disabled><button id="faq-clear-search" hidden>Clear</button>
    <span id="faq-result-count">3</span><button id="faq-toggle-all"><span data-faq-toggle-label></span></button>
    <div id="faq-no-results" class="hidden"><span id="faq-query"></span><div id="faq-suggestions"><ul id="faq-suggestion-list"></ul></div></div>
    <div id="faq-topics">
      <section class="faq-topic"><span class="faq-count">2</span>
        <details class="faq-item" id="faq-one" data-title="Roof repair cost" data-topic="Repairs" open><summary>Roof repair cost</summary><p>First answer</p></details>
        <details class="faq-item" id="faq-two" data-title="Tile roof care" data-topic="Repairs"><summary>Tile roof care</summary><p>Second answer</p></details>
      </section>
      <section class="faq-topic"><span class="faq-count">1</span>
        <details class="faq-item" id="faq-three" data-title="Storm warning" data-topic="Weather"><summary>Storm warning</summary><p>Third answer</p></details>
      </section>
    </div>`;
  const bulk = mountFaqBulkToggle();
  const search = mountFaqSearch({
    ids: { query: '#faq-search', noResults: '#faq-no-results', resultCount: '#faq-result-count' },
    minQueryLen: 2,
  });
  cleanup = () => {
    search();
    bulk();
  };
}
function searchFaq(value) {
  const input = document.getElementById('faq-search');
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
const answer = (id) => document.getElementById(`faq-${id}`);
const bulk = () => document.getElementById('faq-toggle-all');

test('FAQ filters titles/topics, counts groups, and toggles only visible answers', () => {
  mountFaq();
  assert.equal(document.getElementById('faq-search').disabled, false);
  searchFaq('r');
  assert.equal(document.getElementById('faq-result-count').textContent, '3');
  searchFaq('repairs');
  assert.equal(document.getElementById('faq-result-count').textContent, '2');
  assert.equal(answer('three').closest('section').hidden, true);
  bulk().click();
  assert.equal(answer('one').open, true);
  assert.equal(answer('two').open, true);
  assert.equal(answer('three').open, false);
  assert.equal(bulk().getAttribute('aria-expanded'), 'true');
  bulk().click();
  assert.equal(answer('one').open, false);
  assert.equal(answer('two').open, false);
  answer('one').open = true;
  answer('two').open = true;
  answer('two').dispatchEvent(new Event('toggle'));
  assert.equal(bulk().getAttribute('aria-expanded'), 'true');
  searchFaq('nothing matches');
  assert.equal(bulk().disabled, true);
  assert.equal(document.getElementById('faq-no-results').classList.contains('hidden'), false);
  document.getElementById('faq-clear-search').click();
  assert.equal(document.getElementById('faq-result-count').textContent, '3');
  assert.equal(document.getElementById('faq-clear-search').hidden, true);
  assert.equal(window.location.search, '');
  assert.equal(bulk().disabled, false);
});

test('FAQ initial queries, conflicting deep links, history, and malformed hashes remain usable', () => {
  mountFaq('/faq?q=tile');
  assert.equal(answer('one').hidden, true);
  assert.equal(answer('two').hidden, false);
  mountFaq('/faq?q=tile#faq-three');
  assert.equal(answer('three').open, true);
  assert.equal(answer('three').hidden, false);
  assert.equal(answer('one').open, false);
  assert.equal(window.location.search, '');
  window.history.replaceState(null, '', '/faq?q=storm');
  window.dispatchEvent(new Event('popstate'));
  assert.equal(document.getElementById('faq-result-count').textContent, '1');
  window.history.replaceState(null, '', '/faq#faq-two');
  window.dispatchEvent(new Event('hashchange'));
  assert.equal(answer('two').open, true);
  assert.equal(answer('two').hidden, false);
  window.history.replaceState(null, '', '/faq#faq-%E0%A4%A');
  window.dispatchEvent(new Event('hashchange'));
});

test('FAQ suggestions open a hidden answer, restore the full list, and clean up listeners', () => {
  mountFaq();
  searchFaq('roof unknown');
  const link = document.querySelector('#faq-suggestion-list a');
  assert.ok(link);
  link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  assert.equal(window.location.hash, '#faq-one');
  assert.equal(answer('one').hidden, false);
  assert.equal(answer('one').open, true);
  assert.equal(document.getElementById('faq-result-count').textContent, '3');
  cleanup();
  searchFaq('storm');
  assert.equal(document.getElementById('faq-result-count').textContent, '3');
});

const terms = [
  ...Array.from({ length: 61 }, (_, i) => ({ title: `Roof term ${i}`, slug: `roof-term-${i}` })),
  { title: 'Tile', slug: 'tile' },
  { title: '3-tab shingle', slug: '3-tab-shingle' },
];
test('glossary server rendering includes every term and stable alphabet anchors without JavaScript', () => {
  const html = renderToString(React.createElement(Glossary, { terms }));
  const page = new JSDOM(html).window.document;
  assert.equal(page.querySelectorAll('#glossary-groups a').length, terms.length);
  for (const link of page.querySelectorAll('#glossary-groups a'))
    assert.equal(link.getAttribute('aria-label'), link.textContent);
  assert.ok(page.getElementById('glossary-R'));
  assert.ok(page.getElementById('glossary-num'));
  assert.equal(page.querySelectorAll('nav [aria-disabled="true"]').length, 24);
});

test('glossary filters one grouped list without a 50-result cap, suggests, clears and restores anchors', async () => {
  cleanup();
  document.getElementById('root').innerHTML = '';
  const app = createRoot(document.getElementById('root'));
  await act(async () => app.render(React.createElement(Glossary, { terms })));
  async function type(value) {
    await act(async () => {
      const input = document.getElementById('glossary-search');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
  await type('roof');
  assert.equal(document.querySelectorAll('#glossary-groups a').length, 61);
  assert.equal(document.querySelector('[role="status"]').textContent, 'Showing 61 of 63 terms');
  assert.equal(document.getElementById('glossary-T'), null);
  await type('ttile');
  assert.equal(document.querySelectorAll('#glossary-groups section').length, 0);
  assert.ok(document.querySelector('#glossary-groups a[href="/roofing-glossary/tile"]'));
  await act(async () => document.querySelector('[aria-label="Clear glossary search"]').click());
  assert.equal(document.querySelectorAll('#glossary-groups section a').length, terms.length);
  assert.ok(document.getElementById('glossary-num'));
  assert.equal(document.activeElement.id, 'glossary-search');
  await act(async () => app.unmount());
});
