import assert from 'node:assert/strict';
import { parseDocument } from 'htmlparser2';
import {
  FAQ_ALLOWED_LINK_ATTRIBUTES,
  FAQ_ALLOWED_TAGS,
  faqHtmlToPlainText,
  isAllowedFaqHref,
  sanitizeFaqHtml,
} from '../lib/content/directus-faq-html.ts';

const fixtures = [
  {
    name: 'plaintext',
    input: 'Plain AT&T answer.',
    html: 'Plain AT&amp;T answer.',
    text: 'Plain AT&T answer.',
  },
  {
    name: 'paragraphs',
    input: '<p>First paragraph.</p><p>Second paragraph.</p>',
    html: '<p>First paragraph.</p><p>Second paragraph.</p>',
    text: 'First paragraph.\n\nSecond paragraph.',
  },
  {
    name: 'bold and italic',
    input: '<p><b>Bold</b> and <i>italic</i>.</p>',
    html: '<p><strong>Bold</strong> and <em>italic</em>.</p>',
    text: 'Bold and italic.',
  },
  {
    name: 'relative link',
    input: '<p><a href="/services/seo" title="SEO">SEO services</a></p>',
    html: '<p><a href="/services/seo" title="SEO">SEO services</a></p>',
    text: 'SEO services',
  },
  {
    name: 'page fragment',
    input: '<p><a href="#details">Details</a></p>',
    html: '<p><a href="#details">Details</a></p>',
    text: 'Details',
  },
  {
    name: 'external link',
    input: '<p><a href="https://example.com/path" target="_blank" rel="nofollow">Example</a></p>',
    html: '<p><a href="https://example.com/path" target="_blank" rel="noopener noreferrer">Example</a></p>',
    text: 'Example',
  },
  {
    name: 'ordered and unordered lists',
    input: '<ul><li>One</li><li>Two</li></ul><ol><li>First</li><li>Second</li></ol>',
    html: '<ul><li>One</li><li>Two</li></ul><ol><li>First</li><li>Second</li></ol>',
    text: 'One\nTwo\n\nFirst\nSecond',
  },
  {
    name: 'line break and entities',
    input: '<p>AT&amp;T&nbsp;&lt;care&gt;<br>Next line</p>',
    html: '<p>AT&amp;T\u00a0&lt;care&gt;<br />Next line</p>',
    text: 'AT&T <care>\nNext line',
  },
  {
    name: 'empty paragraphs',
    input: '<p> </p><p>&nbsp;</p><p>Keep me.</p>',
    html: '<p>Keep me.</p>',
    text: 'Keep me.',
  },
  {
    name: 'classes and styles',
    input: '<p class="editor" id="answer" style="color:red">Clean</p>',
    html: '<p>Clean</p>',
    text: 'Clean',
  },
  {
    name: 'script tags',
    input: '<p>Before</p><script>alert(1)</script><p>After</p>',
    html: '<p>Before</p><p>After</p>',
    text: 'Before\n\nAfter',
  },
  {
    name: 'javascript link',
    input: '<p><a href="javascript:alert(1)" target="_blank">Unsafe</a></p>',
    html: '<p><a>Unsafe</a></p>',
    text: 'Unsafe',
  },
  {
    name: 'protocol-relative link',
    input: '<p><a href="//example.com/path">Unsafe</a></p>',
    html: '<p><a>Unsafe</a></p>',
    text: 'Unsafe',
  },
  {
    name: 'backslash protocol-relative link',
    input: '<p><a href="/\\\\example.com/path">Unsafe</a></p>',
    html: '<p><a>Unsafe</a></p>',
    text: 'Unsafe',
  },
  {
    name: 'mailto and telephone links',
    input:
      '<p><a href="mailto:hello@example.com">Email</a> or <a href="tel:+15551234567">call</a>.</p>',
    html: '<p><a href="mailto:hello@example.com">Email</a> or <a href="tel:+15551234567">call</a>.</p>',
    text: 'Email or call.',
  },
];

const allowedTags = new Set(FAQ_ALLOWED_TAGS);
const allowedLinkAttributes = new Set(FAQ_ALLOWED_LINK_ATTRIBUTES);

function assertContract(html, fixtureName) {
  const document = parseDocument(html, { decodeEntities: true });
  const pending = [...document.children];

  while (pending.length) {
    const node = pending.pop();
    if (!node) continue;
    pending.push(...(node.children ?? []));

    if (node.type !== 'tag') continue;
    assert.ok(allowedTags.has(node.name), `${fixtureName}: disallowed <${node.name}>`);

    for (const attribute of Object.keys(node.attribs ?? {})) {
      assert.ok(
        node.name === 'a' && allowedLinkAttributes.has(attribute),
        `${fixtureName}: disallowed ${attribute} attribute`,
      );
    }

    if (node.name === 'a' && node.attribs.href) {
      assert.ok(isAllowedFaqHref(node.attribs.href), `${fixtureName}: disallowed href`);
    }

    if (node.name === 'a' && node.attribs.target === '_blank') {
      assert.equal(node.attribs.rel, 'noopener noreferrer', `${fixtureName}: unsafe _blank link`);
    }
  }
}

for (const fixture of fixtures) {
  const sanitized = sanitizeFaqHtml(fixture.input);
  assert.equal(sanitized, fixture.html, `${fixture.name}: sanitized HTML`);
  assert.equal(faqHtmlToPlainText(sanitized), fixture.text, `${fixture.name}: plain text`);
  assert.equal(sanitizeFaqHtml(sanitized), sanitized, `${fixture.name}: idempotence`);
  assertContract(sanitized, fixture.name);
}

process.stdout.write(`${fixtures.length} FAQ HTML fixtures passed.\n`);
