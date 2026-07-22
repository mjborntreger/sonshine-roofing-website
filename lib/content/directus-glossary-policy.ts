export const GLOSSARY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

type GlossarySeoInput = {
  slug: string;
  noindex: unknown;
  metaTitle: unknown;
  metaDescription: unknown;
  primaryFocusKeyword: unknown;
  focusKeywords: unknown;
  ogTitle: unknown;
  ogDescription: unknown;
};

export type GlossarySeoFields = {
  noindex: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  primaryFocusKeyword: string | null;
  focusKeywords: string[];
  ogTitle: string | null;
  ogDescription: string | null;
};

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function requiredString(value: unknown, field: string, slug: string): string {
  const parsed = readString(value);
  if (parsed) return parsed;
  throw new Error(`[directus-glossary] ${field} is required for indexable term ${slug}.`);
}

export function parseGlossarySlug(value: unknown): string | null {
  const slug = readString(value);
  return slug && GLOSSARY_SLUG_PATTERN.test(slug) ? slug : null;
}

export function requireGlossarySlug(value: unknown): string {
  const slug = parseGlossarySlug(value);
  if (slug) return slug;
  throw new Error(
    '[directus-glossary] slug must contain lowercase letters or numbers separated by single hyphens.',
  );
}

function readFocusKeywords(
  primaryValue: unknown,
  keywordsValue: unknown,
  slug: string,
): { primaryFocusKeyword: string | null; focusKeywords: string[] } {
  if (keywordsValue !== null && keywordsValue !== undefined && !Array.isArray(keywordsValue)) {
    throw new Error(
      `[directus-glossary] focus_keywords must be an array for indexable term ${slug}.`,
    );
  }

  const focusKeywords: string[] = [];
  const seen = new Set<string>();
  for (const value of Array.isArray(keywordsValue) ? keywordsValue : []) {
    const keyword = requiredString(value, 'focus_keywords', slug);
    const normalized = keyword.toLocaleLowerCase('en-US');
    if (!seen.has(normalized)) {
      seen.add(normalized);
      focusKeywords.push(keyword);
    }
  }

  const primaryFocusKeyword = readString(primaryValue);
  if (!primaryFocusKeyword) return { primaryFocusKeyword: null, focusKeywords };

  const normalizedPrimary = primaryFocusKeyword.toLocaleLowerCase('en-US');
  const matchedPrimary = focusKeywords.find(
    (keyword) => keyword.toLocaleLowerCase('en-US') === normalizedPrimary,
  );
  if (!matchedPrimary) {
    throw new Error(
      `[directus-glossary] primary_focus_keyword is missing from focus_keywords for ${slug}.`,
    );
  }

  return {
    primaryFocusKeyword: matchedPrimary,
    focusKeywords: [
      matchedPrimary,
      ...focusKeywords.filter(
        (keyword) => keyword.toLocaleLowerCase('en-US') !== normalizedPrimary,
      ),
    ],
  };
}

export function mapGlossarySeoFields(input: GlossarySeoInput): GlossarySeoFields {
  if (typeof input.noindex !== 'boolean') {
    throw new Error(`[directus-glossary] noindex must be a boolean for ${input.slug}.`);
  }

  const focusKeywordMetadata = input.noindex
    ? { primaryFocusKeyword: null, focusKeywords: [] }
    : readFocusKeywords(input.primaryFocusKeyword, input.focusKeywords, input.slug);

  return {
    noindex: input.noindex,
    metaTitle: input.noindex
      ? readString(input.metaTitle)
      : requiredString(input.metaTitle, 'meta_title', input.slug),
    metaDescription: input.noindex
      ? readString(input.metaDescription)
      : requiredString(input.metaDescription, 'meta_description', input.slug),
    ...focusKeywordMetadata,
    ogTitle: readString(input.ogTitle),
    ogDescription: readString(input.ogDescription),
  };
}
