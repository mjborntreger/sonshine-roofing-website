import { parseDocument } from 'htmlparser2';
import sanitizeHtml from 'sanitize-html';

type SanitizeOptions = NonNullable<Parameters<typeof sanitizeHtml>[1]>;
type HtmlNode = {
  type?: string;
  name?: string;
  data?: string;
  children?: HtmlNode[];
};

export const GLOSSARY_ALLOWED_TAGS = [
  'p',
  'a',
  'strong',
  'em',
  'code',
  'sup',
  'sub',
  'ul',
  'ol',
  'li',
  'br',
] as const;

const LINK_ATTRIBUTES = ['href', 'rel', 'target', 'title'] as const;

function allowedHref(value: string): boolean {
  const href = value.trim();
  if (!href) return false;
  if (href.startsWith('/')) return !/^\/[\\/]/.test(href);
  if (href.startsWith('#')) return true;
  return /^(?:https?|mailto|tel):/i.test(href);
}

const sanitizeOptions: SanitizeOptions = {
  allowedTags: [...GLOSSARY_ALLOWED_TAGS, 'b', 'i'],
  allowedAttributes: { a: [...LINK_ATTRIBUTES] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,
  parseStyleAttributes: false,
  transformTags: {
    a: (tagName, attributes) => {
      const href = attributes.href?.trim() ?? '';
      const next: Record<string, string> = allowedHref(href) ? { ...attributes, href } : {};
      if (next.target === '_blank') next.rel = 'noopener noreferrer';
      return { tagName, attribs: next };
    },
    b: 'strong',
    i: 'em',
  },
  exclusiveFilter: (frame) =>
    ['p', 'ul', 'ol', 'li'].includes(frame.tag) && !frame.text.replace(/\u00a0/g, ' ').trim(),
};

function appendPlainText(node: HtmlNode, output: string[]): void {
  if (node.type === 'text') {
    output.push((node.data ?? '').replace(/\s+/g, ' '));
    return;
  }

  if (node.name === 'br') {
    output.push('\n');
    return;
  }

  for (const child of node.children ?? []) appendPlainText(child, output);

  if (node.name === 'p' || node.name === 'ul' || node.name === 'ol') {
    output.push('\n\n');
  } else if (node.name === 'li') {
    output.push('\n');
  }
}

export function glossaryHtmlToPlainText(html: string): string {
  const document = parseDocument(html, { decodeEntities: true }) as HtmlNode;
  const output: string[] = [];
  appendPlainText(document, output);
  return output
    .join('')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ +([.,;:!?])/g, '$1')
    .trim();
}

export function prepareGlossaryDefinitionHtml(
  value: string | null | undefined,
): { html: string; text: string } | null {
  const source = value?.trim() ?? '';
  if (!source) return null;

  let html = sanitizeHtml(source, sanitizeOptions).trim();
  let text = glossaryHtmlToPlainText(html);
  if (!text) return null;

  if (!/^<(?:p|ul|ol)\b/i.test(html)) {
    html = sanitizeHtml(`<p>${html}</p>`, sanitizeOptions).trim();
    text = glossaryHtmlToPlainText(html);
  }

  return { html, text };
}
