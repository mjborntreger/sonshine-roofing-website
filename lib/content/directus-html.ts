import sanitizeHtml from 'sanitize-html';

export type DirectusHtmlOptions = {
  assetBaseUrl?: string;
};

type SanitizeOptions = NonNullable<Parameters<typeof sanitizeHtml>[1]>;

const YOUTUBE_EMBED_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

function isAllowedYouTubeEmbedSrc(src: string | undefined): boolean {
  if (!src) return false;

  try {
    const url = new URL(src);
    return (
      url.protocol === 'https:' &&
      YOUTUBE_EMBED_HOSTS.has(url.hostname.toLowerCase()) &&
      /^\/embed\/[A-Za-z0-9_-]{6,}$/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

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
      'iframe',
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
      iframe: [
        'allow',
        'allowfullscreen',
        'frameborder',
        'height',
        'loading',
        'referrerpolicy',
        'src',
        'title',
        'width',
      ],
      img: ['alt', 'decoding', 'height', 'loading', 'src', 'title', 'width'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      iframe: ['https'],
      img: ['http', 'https'],
    },
    allowProtocolRelative: false,
    exclusiveFilter: (frame) =>
      (frame.tag === 'img' && !frame.attribs.src) ||
      (frame.tag === 'iframe' && !isAllowedYouTubeEmbedSrc(frame.attribs.src)),
    parseStyleAttributes: false,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: attribs.target === '_blank' ? { ...attribs, rel: 'noopener noreferrer' } : attribs,
      }),
      iframe: (tagName, attribs) => ({
        tagName,
        attribs: {
          src: attribs.src,
          title: attribs.title ?? 'YouTube video player',
          width: attribs.width,
          height: attribs.height,
          loading: 'lazy',
          frameborder: '0',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
          allowfullscreen: '',
          referrerpolicy: 'strict-origin-when-cross-origin',
        },
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
