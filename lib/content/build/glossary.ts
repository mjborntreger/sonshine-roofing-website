import {
  glossaryHtmlToPlainText,
  prepareGlossaryDefinitionHtml,
} from '../directus-glossary-html.ts';
import { mapGlossarySeoFields, requireGlossarySlug } from '../directus-glossary-policy.ts';
import type { GlossaryTerm, GlossaryImage } from '../editorial-types';
export const DIRECTUS_COLLECTION = 'roofing_glossary_terms';

export type UnknownRecord = Record<string, unknown>;

export type DirectusConfig = {
  url: string;
  clientSlug: string;
  token: string;
};

export type DirectusGlossaryItem = {
  client?: unknown;
  status?: unknown;
  slug?: unknown;
  title?: unknown;
  definition?: unknown;
  noindex?: unknown;
  meta_title?: unknown;
  meta_description?: unknown;
  primary_focus_keyword?: unknown;
  focus_keywords?: unknown;
  og_title?: unknown;
  og_description?: unknown;
  og_image_override?: unknown;
  date_updated?: unknown;
};

export const DIRECTUS_FIELDS = [
  'client.slug',
  'status',
  'slug',
  'title',
  'definition',
  'noindex',
  'meta_title',
  'meta_description',
  'primary_focus_keyword',
  'focus_keywords',
  'og_title',
  'og_description',
  'og_image_override.id',
  'og_image_override.description',
  'og_image_override.width',
  'og_image_override.height',
  'date_updated',
] as const;

export function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

export function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function requiredString(value: unknown, field: string, slug?: string): string {
  const parsed = readString(value);
  if (parsed) return parsed;
  throw new Error(
    `[directus-glossary] ${DIRECTUS_COLLECTION}.${field} is required${slug ? ` for ${slug}` : ''}.`,
  );
}

export function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function mapImage(value: unknown, config: DirectusConfig): GlossaryImage | null {
  const record = asRecord(value);
  if (!record) return null;
  const id = readString(record.id);
  if (!id) return null;
  const altText = readString(record.description);
  if (!altText) {
    throw new Error(`[directus-glossary] Directus OG image ${id} is missing its description.`);
  }
  return {
    url: `${config.url}/assets/${encodeURIComponent(id)}`,
    altText,
    width: readNumber(record.width),
    height: readNumber(record.height),
  };
}

export function mapGlossaryTerm(item: DirectusGlossaryItem, config: DirectusConfig): GlossaryTerm {
  const slug = requireGlossarySlug(item.slug);
  const title = requiredString(item.title, 'title', slug);
  const definition = prepareGlossaryDefinitionHtml(
    requiredString(item.definition, 'definition', slug),
  );
  if (!definition) {
    throw new Error(`[directus-glossary] definition is empty after sanitization for ${slug}.`);
  }

  const seo = mapGlossarySeoFields({
    slug,
    noindex: item.noindex,
    metaTitle: item.meta_title,
    metaDescription: item.meta_description,
    primaryFocusKeyword: item.primary_focus_keyword,
    focusKeywords: item.focus_keywords,
    ogTitle: item.og_title,
    ogDescription: item.og_description,
  });

  return {
    slug,
    title,
    contentHtml: definition.html,
    contentPlain: glossaryHtmlToPlainText(definition.html),
    ...seo,
    ogImageOverride: mapImage(item.og_image_override, config),
    modified: readString(item.date_updated),
  };
}
