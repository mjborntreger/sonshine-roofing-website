import sanitizeHtml from 'sanitize-html';

export type DirectusHtmlOptions = {
  assetBaseUrl?: string;
};

type SanitizeOptions = NonNullable<Parameters<typeof sanitizeHtml>[1]>;

function normalizeDirectusAssetSrc(
  src: string | undefined,
  assetBaseUrl: string | undefined,
): string {
  const trimmedSrc = src?.trim() ?? '';

  if (!trimmedSrc || !assetBaseUrl || !trimmedSrc.startsWith('/assets/')) {
    return trimmedSrc;
  }

  try {
    return new URL(trimmedSrc, assetBaseUrl).toString();
  } catch {
    return trimmedSrc;
  }
}

function directusHtmlSanitizeOptions(assetBaseUrl: string | undefined): SanitizeOptions {
  return {
    allowedTags: [
      'a',
      'address',
      'b',
      'blockquote',
      'br',
      'code',
      'del',
      'em',
      'figcaption',
      'figure',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'i',
      'img',
      'li',
      'ol',
      'p',
      'pre',
      's',
      'strong',
      'sub',
      'sup',
      'table',
      'tbody',
      'td',
      'th',
      'thead',
      'tr',
      'ul',
    ],
    allowedAttributes: {
      a: ['href', 'rel', 'target', 'title'],
      img: ['alt', 'decoding', 'height', 'loading', 'src', 'title', 'width'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['http', 'https'],
    },
    allowProtocolRelative: false,
    exclusiveFilter: (frame) => frame.tag === 'img' && !frame.attribs.src,
    parseStyleAttributes: false,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: attribs.target === '_blank' ? { ...attribs, rel: 'noopener noreferrer' } : attribs,
      }),
      img: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          src: normalizeDirectusAssetSrc(attribs.src, assetBaseUrl),
          loading: attribs.loading === 'eager' ? 'eager' : 'lazy',
          decoding: 'async',
        },
      }),
    },
  };
}

export function sanitizeDirectusHtml(html: string, options: DirectusHtmlOptions = {}): string {
  return sanitizeHtml(html, directusHtmlSanitizeOptions(options.assetBaseUrl));
}
