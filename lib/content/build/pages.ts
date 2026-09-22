import {
  readString,
  requiredString,
  readBoolean,
  readFocusKeywords,
  normalizeWebsitePath,
  mapAsset,
  type DirectusConfig,
  type DirectusFileValue,
} from '../directus-site-shell.ts';
import type { WebsitePage } from '../directus-site';
type DirectusWebsitePageItem = {
  path?: unknown;
  meta_title?: unknown;
  meta_description?: unknown;
  og_image_override?: DirectusFileValue;
  noindex?: unknown;
  og_title?: unknown;
  og_description?: unknown;
  nav_label?: unknown;
  page_type?: unknown;
  primary_focus_keyword?: unknown;
  focus_keywords?: unknown;
};

export const WEBSITE_PAGE_FIELDS = [
  'path',
  'meta_title',
  'meta_description',
  'og_image_override.id',
  'og_image_override.description',
  'og_image_override.width',
  'og_image_override.height',
  'og_image_override.type',
  'noindex',
  'og_title',
  'og_description',
  'nav_label',
  'page_type',
  'primary_focus_keyword',
  'focus_keywords',
] as const;
export function normalizeWebsitePages(
  items: DirectusWebsitePageItem[],
  config: DirectusConfig,
): WebsitePage[] {
  const seen = new Set<string>();
  return items.map((item) => {
    const path = normalizeWebsitePath(requiredString(item.path, 'website_pages', 'path'));
    if (seen.has(path)) {
      throw new Error(`[directus-site] Duplicate website_pages path "${path}".`);
    }
    seen.add(path);
    const noindex = readBoolean(item.noindex, false);
    const focusKeywordMetadata = noindex
      ? { primaryFocusKeyword: null, focusKeywords: [] }
      : readFocusKeywords(item.primary_focus_keyword, item.focus_keywords, 'website_pages', path);

    return {
      path,
      metaTitle: noindex
        ? readString(item.meta_title)
        : requiredString(item.meta_title, 'website_pages', 'meta_title'),
      metaDescription: noindex
        ? readString(item.meta_description)
        : requiredString(item.meta_description, 'website_pages', 'meta_description'),
      ogImageOverride: mapAsset(
        item.og_image_override ?? null,
        config,
        'website_pages',
        'og_image_override',
      ),
      noindex,
      ogTitle: readString(item.og_title),
      ogDescription: readString(item.og_description),
      navLabel: readString(item.nav_label),
      pageType: requiredString(item.page_type, 'website_pages', 'page_type'),
      ...focusKeywordMetadata,
    };
  });
}
