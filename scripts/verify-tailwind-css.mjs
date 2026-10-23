import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { twMerge } from 'tailwind-merge';

const source = await readFile('app/globals.css', 'utf8');
const result = await postcss([tailwind({ optimize: false })]).process(source + '\n@source inline("dark:bg-background bg-blue-10 bg-orange-10 font-display shadow-xs outline-hidden text-(--brand-blue) motion-reduce:translate-none");', { from: 'app/globals.css' });
const rules = [];
result.root.walkRules(rule => rules.push(rule));
function rule(selector) {
  const value = rules.find(node => node.selector === selector);
  assert.ok(value, `Missing generated CSS for ${selector}`);
  return value;
}
function declaration(node, prop) { return node.nodes.find(item => item.type === 'decl' && item.prop === prop)?.value; }
for (const kind of ['blog', 'project']) {
  const card = rule(`.${kind}-preview-card-min-h`);
  assert.equal(declaration(card, 'min-height'), `var(--${kind}-preview-card-min-h-mobile)`);
  const desktop = card.nodes.find(node => node.type === 'atrule' && node.name === 'media' && node.params === '(min-width: 768px)');
  assert.ok(desktop, 'Desktop minimum height must remain behind its breakpoint');
  assert.equal(declaration(desktop, 'min-height'), `var(--${kind}-preview-card-min-h-desktop)`);
}
const prose = rule('.prose');
const paragraph = prose.nodes.find(node => node.type === 'rule' && node.selector.startsWith(':where(p)'));
assert.equal(declaration(paragraph, 'font-size'), '1.2rem');
assert.equal(declaration(paragraph, 'line-height'), '1.85rem');
assert.match(rule('.dark\\:bg-background:is(.dark *)').toString(), /hsl\(var\(--background\)\)/);
assert.match(rule('.outline-hidden').toString(), /forced-colors: active/);
assert.match(rule('.shadow-xs').toString(), /0 1px 2px/);
assert.equal(declaration(rule('.text-\\(--brand-blue\\)'), 'color'), 'var(--brand-blue)');
assert.match(rule('.font-display').toString(), /--font-candara/);
rule('.bg-blue-10'); rule('.bg-orange-10');
assert.equal(twMerge('shadow-xs shadow-lg'), 'shadow-lg');
assert.equal(twMerge('text-(--brand-blue) text-white'), 'text-white');
assert.equal(twMerge('motion-reduce:translate-y-1 motion-reduce:translate-y-2'), 'motion-reduce:translate-y-2');
console.log('Verified generated v4 theme, prose, responsive card heights, focus fallback and class merging.');
