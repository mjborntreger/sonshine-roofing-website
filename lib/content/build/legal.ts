import { sanitizeDirectusHtml } from '../directus-html.ts';
import type { LegalCopy } from '../editorial-types';
export const DIRECTUS_COLLECTION = 'legal_copy';

export type DirectusConfig = {
  url: string;
  clientSlug: string;
  token: string;
};

export type DirectusLegalCopyItem = {
  privacy_policy?: unknown;
  terms_of_use?: unknown;
};

export const LEGAL_COPY_FIELDS = ['privacy_policy', 'terms_of_use'] as const;

export function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function sanitizeRequiredLegalHtml(
  value: unknown,
  field: 'privacy_policy' | 'terms_of_use',
  config: DirectusConfig,
): string {
  const html = readString(value);
  if (!html) {
    throw new Error(
      `[directus-legal-copy] ${DIRECTUS_COLLECTION}.${field} is required for "${config.clientSlug}".`,
    );
  }

  if (/<h1\b/i.test(html)) {
    throw new Error(
      `[directus-legal-copy] ${DIRECTUS_COLLECTION}.${field} for "${config.clientSlug}" must not contain an h1; the page shell owns the primary heading.`,
    );
  }

  const sanitizedHtml = sanitizeDirectusHtml(html, {
    assetBaseUrl: config.url,
  }).trim();
  if (!sanitizedHtml) {
    throw new Error(
      `[directus-legal-copy] ${DIRECTUS_COLLECTION}.${field} for "${config.clientSlug}" is empty after HTML sanitization.`,
    );
  }

  return sanitizedHtml;
}

export function normalizeLegalCopy(
  items: DirectusLegalCopyItem[],
  config: DirectusConfig,
): LegalCopy {
  if (items.length !== 1) throw new Error('Expected exactly one legal_copy record.');
  return {
    privacyPolicyHtml: sanitizeRequiredLegalHtml(items[0].privacy_policy, 'privacy_policy', config),
    termsOfUseHtml: sanitizeRequiredLegalHtml(items[0].terms_of_use, 'terms_of_use', config),
  };
}
