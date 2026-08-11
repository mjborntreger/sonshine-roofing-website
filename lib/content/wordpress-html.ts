import { sanitizeDirectusHtml } from '@/lib/content/directus-html';

/**
 * Keep WordPress HTML behind the same conservative CMS boundary used for
 * Directus content while retaining a source-specific adapter entry point.
 */
export function sanitizeWordPressHtml(html: string): string {
  return sanitizeDirectusHtml(html);
}
