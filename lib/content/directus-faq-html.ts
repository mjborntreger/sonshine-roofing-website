import { parseDocument } from 'htmlparser2';
import sanitizeHtml from 'sanitize-html';

type SanitizeOptions = NonNullable<Parameters<typeof sanitizeHtml>[1]>;

type HtmlNode = {
  type?: string;
  name?: string;
  data?: string;
  children?: HtmlNode[];
};

export const FAQ_ALLOWED_TAGS = ['p', 'a', 'strong', 'em', 'ul', 'ol', 'li', 'br'] as const;

export const FAQ_ALLOWED_LINK_ATTRIBUTES = ['href', 'rel', 'target', 'title'] as const;

export function isAllowedFaqHref(href: string): boolean {
  const normalized = href.trim();

  if (!normalized) return false;
  if (normalized.startsWith('/')) return !/^\/[\\/]/.test(normalized);
  if (normalized.startsWith('#')) return true;

  return /^(?:https?|mailto|tel):/i.test(normalized);
}

function normalizeLinkAttributes(attributes: Record<string, string>): Record<string, string> {
  const href = attributes.href?.trim() ?? '';

  if (!isAllowedFaqHref(href)) return {};

  const normalized: Record<string, string> = { ...attributes, href };
  if (normalized.target === '_blank') {
    normalized.rel = 'noopener noreferrer';
  }

  return normalized;
}

const faqSanitizeOptions: SanitizeOptions = {
  allowedTags: [...FAQ_ALLOWED_TAGS, 'b', 'i'],
  allowedAttributes: {
    a: [...FAQ_ALLOWED_LINK_ATTRIBUTES],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,
  parseStyleAttributes: false,
  transformTags: {
    a: (tagName, attributes) => ({
      tagName,
      attribs: normalizeLinkAttributes(attributes),
    }),
    b: 'strong',
    i: 'em',
  },
  exclusiveFilter: (frame) =>
    ['p', 'ul', 'ol', 'li'].includes(frame.tag) && !frame.text.replace(/\u00a0/g, ' ').trim(),
};

export function sanitizeFaqHtml(html: string): string {
  return sanitizeHtml(html, faqSanitizeOptions).trim();
}

function appendPlainText(node: HtmlNode, output: string[]): void {
  if (node.type === 'text') {
    output.push((node.data ?? '').replace(/\s+/g, ' '));
    return;
  }

  if (node.name === 'br') {
    output.push('\n');
    return;
  }

  for (const child of node.children ?? []) {
    appendPlainText(child, output);
  }

  if (node.name === 'p' || node.name === 'ul' || node.name === 'ol') {
    output.push('\n\n');
  } else if (node.name === 'li') {
    output.push('\n');
  }
}

export function faqHtmlToPlainText(html: string): string {
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
