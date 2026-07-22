import { sanitizeDirectusHtml } from '@/lib/content/directus-html';

const DIRECTUS_COLLECTION = 'legal_copy';

type DirectusConfig = {
  url: string;
  clientSlug: string;
  token: string;
};

type DirectusLegalCopyItem = {
  privacy_policy?: unknown;
  terms_of_use?: unknown;
};

type DirectusListResponse<T> = {
  data?: T[];
  errors?: Array<{ message?: string }>;
};

export type LegalCopy = {
  privacyPolicyHtml: string;
  termsOfUseHtml: string;
};

const LEGAL_COPY_FIELDS = ['privacy_policy', 'terms_of_use'] as const;

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function getDirectusConfig(): DirectusConfig {
  const url = readString(process.env.DIRECTUS_URL);
  const clientSlug = readString(process.env.DIRECTUS_CLIENT_SLUG);
  const token = readString(process.env.DIRECTUS_TOKEN);

  if (!url || !clientSlug || !token) {
    throw new Error(
      '[directus-legal-copy] Missing DIRECTUS_URL, DIRECTUS_CLIENT_SLUG, or DIRECTUS_TOKEN.',
    );
  }

  return {
    url: trimTrailingSlash(url),
    clientSlug,
    token,
  };
}

function sanitizeRequiredLegalHtml(
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

export async function getLegalCopy(): Promise<LegalCopy> {
  const config = getDirectusConfig();
  const url = new URL(`items/${DIRECTUS_COLLECTION}`, `${config.url}/`);
  url.searchParams.set('fields', LEGAL_COPY_FIELDS.join(','));
  url.searchParams.set(
    'filter',
    JSON.stringify({
      client: { slug: { _eq: config.clientSlug } },
    }),
  );
  url.searchParams.set('limit', '2');

  const response = await fetch(url, {
    cache: 'force-cache',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${config.token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `[directus-legal-copy] Directus ${DIRECTUS_COLLECTION} HTTP ${response.status} ${response.statusText}`,
    );
  }

  const json = (await response.json()) as DirectusListResponse<DirectusLegalCopyItem>;
  if (json.errors?.length) {
    throw new Error(
      json.errors
        .map((error) => error.message)
        .filter(Boolean)
        .join('; ') || `[directus-legal-copy] Directus ${DIRECTUS_COLLECTION} request failed.`,
    );
  }

  const items = json.data ?? [];
  if (items.length !== 1) {
    throw new Error(
      `[directus-legal-copy] Expected exactly one ${DIRECTUS_COLLECTION} record for "${config.clientSlug}"; found ${items.length}.`,
    );
  }

  const item = items[0];
  return {
    privacyPolicyHtml: sanitizeRequiredLegalHtml(item.privacy_policy, 'privacy_policy', config),
    termsOfUseHtml: sanitizeRequiredLegalHtml(item.terms_of_use, 'terms_of_use', config),
  };
}
