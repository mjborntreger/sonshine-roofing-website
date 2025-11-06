import type { WpImage } from '@/lib/content/wp';
import { xmlEscape, trimTo } from '../utils';

export const IMAGE_ALT_MAX = 200;
export const MAX_IMAGES_PER_ENTRY = 100;

export type ImageSitemapEntry = {
  loc: string;
  lastmod?: string | null;
  images: WpImage[];
};

export const sanitizeAltText = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimTo(trimmed, IMAGE_ALT_MAX);
};

export const dedupeImages = (
  images: ReadonlyArray<WpImage | null | undefined>,
  limit = MAX_IMAGES_PER_ENTRY
): WpImage[] => {
  const seen = new Set<string>();
  const result: WpImage[] = [];
  for (const img of images) {
    if (!img) continue;
    const url = img.url.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    result.push({ ...img, url });
    if (result.length >= limit) break;
  }
  return result;
};

export const serializeImageEntry = (
  baseUrl: string,
  entry: ImageSitemapEntry
): string | null => {
  const images = dedupeImages(entry.images);
  if (!images.length) return null;

  const imageXml = images
    .map((image) => {
      const title = sanitizeAltText(image.altText);
      const pieces = [
        `<image:loc>${xmlEscape(image.url)}</image:loc>`,
        title ? `<image:title>${xmlEscape(title)}</image:title>` : '',
      ].join('');
      return `<image:image>${pieces}</image:image>`;
    })
    .join('');

  const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : '';
  return `<url><loc>${baseUrl}${entry.loc}</loc>${lastmod}${imageXml}</url>`;
};
