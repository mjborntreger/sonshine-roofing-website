import 'server-only';

import {
  glossaryHtmlToPlainText,
  prepareGlossaryDefinitionHtml,
} from '@/lib/content/directus-glossary-html';
import {
  mapGlossarySeoFields,
  parseGlossarySlug,
  requireGlossarySlug,
} from '@/lib/content/directus-glossary-policy';

const DIRECTUS_COLLECTION = 'roofing_glossary_terms';
const DIRECTUS_REVALIDATE_SECONDS = 900;
const MAX_GLOSSARY_TERMS = 500;

type UnknownRecord = Record<string, unknown>;
type DirectusListResponse<T> = {
  data?: T[];
  errors?: Array<{ message?: string }>;
};

type DirectusConfig = {
  url: string;
  clientSlug: string;
  token: string;
};

type DirectusGlossaryItem = {
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
  source_updated_at?: unknown;
  date_updated?: unknown;
};

export type GlossarySummary = {
  slug: string;
  title: string;
  excerpt: string;
};

export type GlossaryImage = {
  url: string;
  altText: string;
  width: number | null;
  height: number | null;
};

export type GlossaryTerm = {
  slug: string;
  title: string;
  contentHtml: string;
  contentPlain: string;
  noindex: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  primaryFocusKeyword: string | null;
  focusKeywords: string[];
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageOverride: GlossaryImage | null;
  modified: string | null;
};

export type GlossarySitemapEntry = {
  uri: string;
  modified: string | null;
};

const DIRECTUS_FIELDS = [
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
  'source_updated_at',
  'date_updated',
] as const;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function requiredString(value: unknown, field: string, slug?: string): string {
  const parsed = readString(value);
  if (parsed) return parsed;
  throw new Error(
    `[directus-glossary] ${DIRECTUS_COLLECTION}.${field} is required${slug ? ` for ${slug}` : ''}.`,
  );
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getDirectusConfig(): DirectusConfig {
  const url = readString(process.env.DIRECTUS_URL)?.replace(/\/+$/u, '');
  const clientSlug = readString(process.env.DIRECTUS_CLIENT_SLUG);
  const token =
    readString(process.env.DIRECTUS_TOKEN) ?? readString(process.env.DIRECTUS_STATIC_TOKEN);

  if (!url || !clientSlug || !token) {
    throw new Error(
      '[directus-glossary] DIRECTUS_URL, DIRECTUS_CLIENT_SLUG, and DIRECTUS_TOKEN or DIRECTUS_STATIC_TOKEN are required.',
    );
  }

  return { url, clientSlug, token };
}

function mapImage(value: unknown, config: DirectusConfig): GlossaryImage | null {
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

function mapGlossaryTerm(item: DirectusGlossaryItem, config: DirectusConfig): GlossaryTerm {
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
    modified: readString(item.source_updated_at) ?? readString(item.date_updated),
  };
}

async function fetchGlossaryItems(options: {
  filter?: UnknownRecord;
  limit?: number;
  sort?: string[];
} = {}): Promise<GlossaryTerm[]> {
  const config = getDirectusConfig();
  const url = new URL(`items/${DIRECTUS_COLLECTION}`, `${config.url}/`);
  url.searchParams.set('fields', DIRECTUS_FIELDS.join(','));
  url.searchParams.set(
    'filter',
    JSON.stringify({
      ...(options.filter ?? {}),
      client: { slug: { _eq: config.clientSlug } },
      status: { _eq: 'published' },
    }),
  );
  url.searchParams.set('limit', String(Math.max(1, Math.min(options.limit ?? 500, 500))));
  if (options.sort?.length) url.searchParams.set('sort', options.sort.join(','));

  const response = await fetch(url, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${config.token}` },
    next: {
      revalidate: DIRECTUS_REVALIDATE_SECONDS,
      tags: [`directus:${DIRECTUS_COLLECTION}:${config.clientSlug}`],
    },
  });
  if (!response.ok) {
    throw new Error(
      `[directus-glossary] Directus ${DIRECTUS_COLLECTION} HTTP ${response.status} ${response.statusText}.`,
    );
  }
  const payload = (await response.json()) as DirectusListResponse<DirectusGlossaryItem>;
  if (payload.errors?.length) {
    throw new Error(
      payload.errors.map((error) => error.message).filter(Boolean).join('; ') ||
        '[directus-glossary] Directus glossary request failed.',
    );
  }
  return (payload.data ?? []).map((item) => mapGlossaryTerm(item, config));
}

export async function listGlossaryIndex(limit = MAX_GLOSSARY_TERMS): Promise<GlossarySummary[]> {
  const terms = await fetchGlossaryItems({
    limit: Math.max(1, Math.min(limit, MAX_GLOSSARY_TERMS)),
    sort: ['title'],
  });
  return terms.map((term) => ({
    slug: term.slug,
    title: term.title,
    excerpt: term.contentPlain,
  }));
}

export async function getGlossaryTerm(slug: string): Promise<GlossaryTerm | null> {
  const normalizedSlug = parseGlossarySlug(slug);
  if (!normalizedSlug) return null;
  const terms = await fetchGlossaryItems({ filter: { slug: { _eq: normalizedSlug } }, limit: 1 });
  return terms[0] ?? null;
}

export async function listGlossarySitemapEntries(): Promise<GlossarySitemapEntry[]> {
  const terms = await fetchGlossaryItems({ limit: MAX_GLOSSARY_TERMS, sort: ['title'] });
  return terms
    .filter((term) => !term.noindex)
    .map((term) => ({
      uri: `/roofing-glossary/${term.slug}`,
      modified: term.modified,
    }));
}
