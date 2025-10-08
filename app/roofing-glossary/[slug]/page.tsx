import Section from '@/components/layout/Section';
import Link from 'next/link';
import SmartLink from '@/components/SmartLink';
import { createElement, Fragment, ReactNode } from 'react';
import { headers } from 'next/headers';
import { getGlossaryTerm, listGlossaryIndex, stripHtml } from '@/lib/wp';
import { suggest } from '@/lib/fuzzy';
import type { Metadata } from 'next';
import { buildBasicMetadata } from '@/lib/seo/meta';
import { JsonLd } from '@/lib/seo/json-ld';
import { breadcrumbSchema, definedTermSchema } from '@/lib/seo/schema';
import { resolveSiteOrigin } from '@/lib/seo/site';

// Escapes a string for safe use inside a RegExp
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Auto-link occurrences of glossary terms in an HTML string.
 * - Skips the current term
 * - Avoids replacing inside <a>, <code>, or <pre>
 * - Links the first occurrence of each term (longest titles matched first)
 * - Word-boundary aware (letters/digits/underscore/hyphen)
 */
function autoLinkGlossary(
  html: string,
  index: { slug: string; title: string }[],
  currentSlug: string
): string {
  if (!html || !Array.isArray(index)) return html;

  // Build candidate list (exclude current term)
  const candidates = index
    .filter((t) => t && t.slug !== currentSlug && t.title)
    // Sort longest first so multi-word terms win before single words
    .sort((a, b) => b.title.length - a.title.length);

  if (!candidates.length) return html;

  // Build quick lookup by lowercase title for replacement callback
  const byTitle = new Map<string, string>(); // titleLower -> slug
  for (const t of candidates) byTitle.set(t.title.toLowerCase(), t.slug);

  // Build a single alternation regex of escaped titles
  // Use custom word boundaries to avoid partial matches (allow hyphens)
  const pattern = candidates
    .map((t) => escapeRegExp(t.title))
    .join("|");
  if (!pattern) return html;
  const re = new RegExp(
    `(?<![\\w-])(${pattern})(?![\\w-])`,
    "gi"
  );

  // Tokenize by tags so we only replace in text nodes, and track when inside <a>, <code>, <pre>
  const tokens = html.split(/(<[^>]+>)/g);
  let inAnchor = false;
  let inCodeLike = false;
  const linkedOnce = new Set<string>(); // slug -> linked?
  let linkBudget = 40; // avoid overlinking

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (!tok) continue;

    if (tok.startsWith("<")) {
      const isOpenA = /^<a\b/i.test(tok);
      const isCloseA = /^<\/a\b/i.test(tok);
      const isOpenCode = /^<(code|pre)\b/i.test(tok);
      const isCloseCode = /^<\/(code|pre)\b/i.test(tok);
      if (isOpenA) inAnchor = true;
      else if (isCloseA) inAnchor = false;
      if (isOpenCode) inCodeLike = true;
      else if (isCloseCode) inCodeLike = false;
      continue; // tags unchanged
    }

    // Text node
    if (!inAnchor && !inCodeLike && linkBudget > 0) {
      tokens[i] = tok.replace(re, (match) => {
        if (linkBudget <= 0) return match;
        const key = match.toLowerCase();
        const slug = byTitle.get(key);
        if (!slug || linkedOnce.has(slug)) return match;
        linkedOnce.add(slug);
        linkBudget--;
        return `<a href="/roofing-glossary/${slug}" class="underline decoration-dotted hover:decoration-solid">${match}</a>`;
      });
    }
  }

  return tokens.join("");
}

type TextNode = { type: 'text'; content: string };
type ElementNode = { type: 'element'; tag: string; attrs: Record<string, string>; children: HtmlNode[] };
type HtmlNode = TextNode | ElementNode;

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

const BOOLEAN_ATTRIBUTES = new Set([
  'allowfullscreen', 'allowpaymentrequest', 'async', 'autofocus', 'autoplay', 'checked', 'controls', 'default',
  'defer', 'disabled', 'formnovalidate', 'hidden', 'loop', 'multiple', 'muted', 'nomodule', 'novalidate', 'open',
  'playsinline', 'readonly', 'required', 'reversed', 'scoped', 'seamless', 'selected'
]);

function parseAttributes(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /([\w:-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'`=<>]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(raw))) {
    const name = match[1];
    const value = match[3] ?? match[4] ?? match[5] ?? '';
    attrs[name] = value;
  }
  return attrs;
}

function parseHtmlToTree(html: string): HtmlNode[] {
  if (!html) return [];
  const root: ElementNode = { type: 'element', tag: '__root__', attrs: {}, children: [] };
  const stack: ElementNode[] = [root];
  const tokens = html.split(/(<[^>]+>)/g);

  for (const token of tokens) {
    if (!token) continue;
    if (token.startsWith('<')) {
      if (/^<!/.test(token)) continue; // skip comments/doctypes
      const closing = /^<\//.test(token);
      if (closing) {
        const closeMatch = token.match(/^<\/([\w:-]+)>/);
        if (!closeMatch) continue;
        const tag = closeMatch[1].toLowerCase();
        for (let i = stack.length - 1; i >= 0; i -= 1) {
          const node = stack[i];
          if (node.type === 'element' && node.tag === tag) {
            stack.length = i;
            break;
          }
        }
        continue;
      }

      const openMatch = token.match(/^<([\w:-]+)([\s\S]*?)(\/?)>$/);
      if (!openMatch) {
        // treat malformed tag as text
        const parent = stack[stack.length - 1];
        if (parent && parent.type === 'element') {
          parent.children.push({ type: 'text', content: token });
        }
        continue;
      }

      const tag = openMatch[1].toLowerCase();
      const attrString = openMatch[2] || '';
      const selfClosing = Boolean(openMatch[3]) || VOID_ELEMENTS.has(tag);
      const attrs = parseAttributes(attrString);
      const elementNode: ElementNode = { type: 'element', tag, attrs, children: [] };
      const parent = stack[stack.length - 1];
      parent.children.push(elementNode);
      if (!selfClosing) {
        stack.push(elementNode);
      }
      continue;
    }

    const parent = stack[stack.length - 1];
    parent.children.push({ type: 'text', content: token });
  }

  return root.children;
}

const dashedToCamel = (prop: string) => prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

function parseStyle(value: string) {
  const style: Record<string, string> = {};
  value
    .split(';')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .forEach((segment) => {
      const [prop, rawVal] = segment.split(':');
      if (!prop) return;
      const formattedProp = dashedToCamel(prop.trim());
      const val = (rawVal ?? '').trim();
      if (formattedProp) style[formattedProp] = val;
    });
  return style;
}

const ATTRIBUTE_RENAME: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
};

function attributeNameToProp(name: string) {
  if (ATTRIBUTE_RENAME[name]) return ATTRIBUTE_RENAME[name];
  if (name.startsWith('data-') || name.startsWith('aria-')) return name;
  return dashedToCamel(name);
}

function attributesToProps(attrs: Record<string, string>) {
  const props: Record<string, unknown> = {};
  for (const [name, rawValue] of Object.entries(attrs)) {
    const propName = attributeNameToProp(name);
    if (propName === 'style') {
      props.style = parseStyle(rawValue);
      continue;
    }
    if (BOOLEAN_ATTRIBUTES.has(name.toLowerCase()) && rawValue === '') {
      props[propName] = true;
      continue;
    }
    props[propName] = rawValue;
  }
  return props;
}

function isInternalHref(href: string): boolean {
  if (!href) return false;
  return (
    href.startsWith('/') ||
    href.startsWith('#') ||
    href.startsWith('./') ||
    href.startsWith('../')
  );
}

function renderNodes(nodes: HtmlNode[], keyPrefix = 'glossary'):
  ReactNode[] {
  return nodes.map((node, idx) => renderNode(node, `${keyPrefix}-${idx}`));
}

function renderNode(node: HtmlNode, key: string): ReactNode {
  if (node.type === 'text') {
    return createElement(Fragment, { key }, node.content);
  }

  const props = attributesToProps(node.attrs);
  const children = node.children.length ? renderNodes(node.children, key) : [];

  if (node.tag === 'a') {
    const { href, ...rest } = props;
    if (typeof href === 'string' && isInternalHref(href)) {
      return createElement(
        SmartLink,
        { key, href, ...rest },
        ...children
      );
    }
    return createElement('a', { key, href, ...rest }, ...children);
  }

  if (VOID_ELEMENTS.has(node.tag)) {
    return createElement(node.tag, { key, ...props });
  }

  return createElement(node.tag, { key, ...props }, ...children);
}

function renderGlossaryHtml(
  html: string,
  index: { slug: string; title: string }[],
  currentSlug: string
): ReactNode {
  if (!html) return null;
  const linked = autoLinkGlossary(html, index, currentSlug);
  const nodes = parseHtmlToTree(linked);
  return renderNodes(nodes);
}

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  // Defaults if a term is missing (EDIT if you want different fallbacks)
  const fallbackTitle = 'Roofing Glossary | SonShine Roofing';
  const fallbackDesc = 'Plain-English definitions of common roofing terms used across Sarasota, Manatee, and Charlotte Counties.';

  const { slug } = await params;
  const fallbackMetadata = buildBasicMetadata({
    title: fallbackTitle,
    description: fallbackDesc,
    path: '/roofing-glossary',
    image: { url: '/og-default.png', width: 1200, height: 630 },
  });
  fallbackMetadata.robots = { index: true, follow: true };

  try {
    const term = await getGlossaryTerm(slug);
    if (!term) return fallbackMetadata;

    const title = `${term.title} | Roofing Glossary`;
    const description = stripHtml(term.contentHtml || '').slice(0, 160);

    const metadata = buildBasicMetadata({
      title,
      description,
      path: `/roofing-glossary/${term.slug}`,
      image: { url: '/og-default.png', width: 1200, height: 630 },
    });
    metadata.robots = { index: true, follow: true };
    return metadata;
  } catch {
    return fallbackMetadata;
  }
}

// (Optional) Prebuild many static pages:
export async function generateStaticParams() {
  const index = await listGlossaryIndex(1000).catch(() => []);
  return index.map((t) => ({ slug: t.slug }));
}

export default async function GlossaryTermPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [index, term] = await Promise.all([
    listGlossaryIndex(1000).catch(() => []),
    getGlossaryTerm(slug),
  ]);

  // If not found, show a friendly suggestion list ("Did you mean …")
  if (!term) {
    const q = slug || '';
    const scored = suggest(q, index, 5).map((t) => ({ t }));

    return (
      <Section>
        <div className="container-edge py-12">
          <nav className="mb-6 text-sm text-slate-600">
            <Link href="/roofing-glossary" className="text-sm font-semibold text-slate-600 underline-offset-2 hover:underline">← Back to Glossary</Link>
          </nav>

          <h1 className="text-2xl font-semibold">We couldn’t find that term</h1>
          <p className="mt-2 text-slate-700">
            No glossary entry for <span className="font-semibold">“{decodeURIComponent(q)}”</span>.
          </p>

          {scored.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-slate-600">Did you mean:</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {scored.map(({ t }) => (
                  <li key={t.slug}>
                    <Link
                      href={`/roofing-glossary/${t.slug}`}
                      className="inline-flex min-w-0 max-w-full items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm hover:bg-slate-50"
                    >
                      <span className="block max-w-full truncate">{t.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Section>
    );
  }

  // Compute prev/next from the index
  const pos = index.findIndex((t) => t.slug === slug);
  const hasPos = pos >= 0;
  const prev = hasPos && pos > 0 ? index[pos - 1] : hasPos ? index[index.length - 1] : null;
  const next = hasPos && pos < index.length - 1 ? index[pos + 1] : hasPos ? index[0] : null;

  const origin = resolveSiteOrigin(await headers());
  const termPath = `/roofing-glossary/${term.slug}`;

  const definedTermLd = definedTermSchema({
    name: term.title,
    description: stripHtml(term.contentHtml || '').slice(0, 300),
    url: termPath,
    inDefinedTermSet: '/roofing-glossary',
    origin,
  });

  const breadcrumbsLd = breadcrumbSchema(
    [
      { name: 'Home', item: '/' },
      { name: 'Roofing Glossary', item: '/roofing-glossary' },
      { name: term.title, item: termPath },
    ],
    { origin },
  );

  return (
    <Section>
      <div className="container-edge py-8">
        <nav className="mb-4 text-sm text-slate-600">
          <Link href="/roofing-glossary" className="text-sm font-semibold text-slate-600 underline-offset-2 hover:underline">← Back to Glossary</Link>
        </nav>

        <article className="prose max-w-none">
          <h1>{term.title}</h1>
          {/* JSON-LD: DefinedTerm + Breadcrumbs */}
          <JsonLd data={definedTermLd} />
          <JsonLd data={breadcrumbsLd} />
          {/* definition body from WordPress */}
          <div>
            {renderGlossaryHtml(term.contentHtml || '', index, term.slug)}
          </div>
        </article>

        {/* Prev / Next navigation */}
        {hasPos && (
          <nav className="mt-10 flex items-center justify-between gap-4" aria-label="Term navigation">
            {prev ? (
              <Link
                href={`/roofing-glossary/${prev.slug}`}
                rel="prev"
                className="group inline-flex max-w-[48%] items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                aria-label={`Previous term: ${prev.title}`}
              >
                <span aria-hidden>←</span>
                <span className="truncate">{prev.title}</span>
              </Link>
            ) : <span />}

            {next ? (
              <Link
                href={`/roofing-glossary/${next.slug}`}
                rel="next"
                className="group inline-flex max-w-[48%] items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                aria-label={`Next term: ${next.title}`}
              >
                <span className="truncate">{next.title}</span>
                <span aria-hidden>→</span>
              </Link>
            ) : <span />}
          </nav>
        )}
      </div>
    </Section>
  );
}
