import { sanitizeFaqHtml } from './directus-faq-html.ts';
import { stripHtml } from './html-text.ts';

/** Offer details share the restricted paragraph/list/link contract used by FAQs. */
export function sanitizeOfferHtml(value: string): string {
  return sanitizeFaqHtml(value);
}

export function offerHtmlToPlainText(value: string): string {
  return stripHtml(sanitizeOfferHtml(value));
}
