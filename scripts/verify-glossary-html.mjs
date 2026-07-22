import assert from 'node:assert/strict';

import {
  glossaryHtmlToPlainText,
  prepareGlossaryDefinitionHtml,
} from '../lib/content/directus-glossary-html.ts';

const basic = prepareGlossaryDefinitionHtml('<p>A <strong>roofing</strong> definition.</p>');
assert.deepEqual(basic, {
  html: '<p>A <strong>roofing</strong> definition.</p>',
  text: 'A roofing definition.',
});

const unsafe = prepareGlossaryDefinitionHtml(
  '<script>alert(1)</script><p style="color:red" onclick="bad()">Keep <img src="x">this.</p>',
);
assert.equal(unsafe?.html, '<p>Keep this.</p>');
assert.equal(unsafe?.text, 'Keep this.');

const links = prepareGlossaryDefinitionHtml(
  '<p><a href="javascript:bad()">Bad</a> <a href="/roofing-glossary/deck" target="_blank">Deck</a></p>',
);
assert.equal(
  links?.html,
  '<p><a>Bad</a> <a href="/roofing-glossary/deck" target="_blank" rel="noopener noreferrer">Deck</a></p>',
);
assert.equal(glossaryHtmlToPlainText(links?.html ?? ''), 'Bad Deck');

const inline = prepareGlossaryDefinitionHtml('R-value uses H<sub>2</sub>O and x<sup>2</sup>.');
assert.equal(inline?.html, '<p>R-value uses H<sub>2</sub>O and x<sup>2</sup>.</p>');

assert.equal(prepareGlossaryDefinitionHtml(''), null);

console.log('Glossary HTML fixtures passed.');
