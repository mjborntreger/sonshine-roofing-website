import sanitizeHtml from 'sanitize-html';

type SanitizeOptions = NonNullable<Parameters<typeof sanitizeHtml>[1]>;

function normalizeLinkAttributes(attributes: Record<string, string>): Record<string, string> {
  const href = attributes.href?.trim() ?? '';
  if (!/^(?:https?|mailto|tel):/i.test(href)) return {};

  return {
    ...attributes,
    href,
    ...(attributes.target === '_blank' ? { rel: 'noopener noreferrer' } : {}),
  };
}

const sponsorSanitizeOptions: SanitizeOptions = {
  allowedTags: ['p', 'a', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'b', 'i'],
  allowedAttributes: {
    a: ['href', 'rel', 'target', 'title'],
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

export function sanitizeSponsorHtml(html: string): string {
  return sanitizeHtml(html, sponsorSanitizeOptions).trim();
}
