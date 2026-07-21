import { sanitizeFaqHtml } from '@/lib/content/directus-faq-html';

const DIRECTUS_COLLECTION = 'faqs';
const DIRECTUS_REVALIDATE_SECONDS = 3_600;

type UnknownRecord = Record<string, unknown>;

type DirectusConfig = {
  url: string;
  clientSlug: string;
  token: string;
};

type DirectusListResponse<T> = {
  data?: T[];
  errors?: Array<{ message?: string }>;
};

type DirectusWebsitePage = {
  id?: unknown;
  path?: unknown;
  nav_label?: unknown;
  status?: unknown;
  client?: { slug?: unknown } | null;
};

type DirectusService = {
  id?: unknown;
  slug?: unknown;
  nav_label?: unknown;
  status?: unknown;
  client?: { slug?: unknown } | null;
};

type DirectusFaqItem = {
  id?: unknown;
  question?: unknown;
  answer?: unknown;
  website_page?: DirectusWebsitePage | string | null;
  service?: DirectusService | string | null;
  sort_order?: unknown;
  status?: unknown;
};

export type FaqWebsitePage = {
  id: string;
  path: string;
  navLabel: string;
};

export type FaqService = {
  id: string;
  path: string;
  navLabel: string;
};

export type DirectusFaq = {
  id: string;
  title: string;
  contentHtml: string;
  websitePage: FaqWebsitePage | null;
  service: FaqService | null;
  sortOrder: number;
};

export type DirectusFaqGroup = {
  key: string;
  title: string;
  path: string | null;
  items: DirectusFaq[];
};

type ListFaqsOptions = {
  pagePath?: string;
  serviceSlug?: string;
  limit?: number;
};

const FAQ_FIELDS = [
  'id',
  'question',
  'answer',
  'website_page.id',
  'website_page.path',
  'website_page.nav_label',
  'website_page.status',
  'website_page.client.slug',
  'service.id',
  'service.slug',
  'service.nav_label',
  'service.status',
  'service.client.slug',
  'sort_order',
  'status',
] as const;

let warnedForMissingConfig = false;

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function readNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function requiredString(value: unknown, field: string): string {
  const parsed = readString(value);
  if (!parsed) throw new Error(`[directus-faqs] ${DIRECTUS_COLLECTION}.${field} is required.`);
  return parsed;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function normalizePagePath(value: string): string {
  const withoutQuery = value.split(/[?#]/, 1)[0] || '/';
  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, '') : '/';
}

function getDirectusConfig(): DirectusConfig | null {
  const url = readString(process.env.DIRECTUS_URL);
  const clientSlug = readString(process.env.DIRECTUS_CLIENT_SLUG);
  const token = readString(process.env.DIRECTUS_TOKEN);

  if (!url || !clientSlug || !token) {
    if (!warnedForMissingConfig && process.env.NODE_ENV === 'production') {
      console.error(
        '[directus-faqs] Missing DIRECTUS_URL, DIRECTUS_CLIENT_SLUG, or DIRECTUS_TOKEN.',
      );
      warnedForMissingConfig = true;
    }
    return null;
  }

  return { url: trimTrailingSlash(url), clientSlug, token };
}

function mapWebsitePage(
  value: DirectusFaqItem['website_page'],
  expectedClientSlug: string,
): FaqWebsitePage | null {
  if (!value) return null;
  if (typeof value === 'string' || Array.isArray(value)) {
    throw new Error('[directus-faqs] website_page must include id, path, and nav_label.');
  }
  if (readString(value.client?.slug) !== expectedClientSlug) {
    throw new Error('[directus-faqs] website_page belongs to another client.');
  }

  return {
    id: requiredString(value.id, 'website_page.id'),
    path: normalizePagePath(requiredString(value.path, 'website_page.path')),
    navLabel: requiredString(value.nav_label, 'website_page.nav_label'),
  };
}

function mapService(
  value: DirectusFaqItem['service'],
  expectedClientSlug: string,
): FaqService | null {
  if (!value) return null;
  if (typeof value === 'string' || Array.isArray(value)) {
    throw new Error('[directus-faqs] service must include id, slug, and nav_label.');
  }
  if (readString(value.client?.slug) !== expectedClientSlug) {
    throw new Error('[directus-faqs] service belongs to another client.');
  }

  const slug = requiredString(value.slug, 'service.slug');
  return {
    id: requiredString(value.id, 'service.id'),
    path: `/${slug}`,
    navLabel: requiredString(value.nav_label, 'service.nav_label'),
  };
}

function mapFaq(item: DirectusFaqItem, config: DirectusConfig): DirectusFaq {
  const rawAnswer = requiredString(item.answer, 'answer');
  const contentHtml = sanitizeFaqHtml(rawAnswer);
  if (!contentHtml.trim()) {
    throw new Error('[directus-faqs] FAQ answer is empty after HTML sanitization.');
  }

  return {
    id: requiredString(item.id, 'id'),
    title: requiredString(item.question, 'question'),
    contentHtml,
    websitePage: mapWebsitePage(item.website_page, config.clientSlug),
    service: mapService(item.service, config.clientSlug),
    sortOrder: readNumber(item.sort_order),
  };
}

function faqFilter(config: DirectusConfig, pagePath?: string, serviceSlug?: string): UnknownRecord {
  const base = [{ client: { slug: { _eq: config.clientSlug } } }, { status: { _eq: 'published' } }];
  const globalScope = {
    _and: [{ website_page: { _null: true } }, { service: { _null: true } }],
  };

  if (serviceSlug) {
    return {
      _and: [
        ...base,
        {
          _or: [
            globalScope,
            {
              service: {
                slug: { _eq: serviceSlug },
                status: { _eq: 'published' },
                client: { slug: { _eq: config.clientSlug } },
              },
            },
          ],
        },
      ],
    };
  }

  if (pagePath) {
    const normalizedPath = normalizePagePath(pagePath);
    return {
      _and: [
        ...base,
        {
          _or: [
            globalScope,
            {
              website_page: {
                path: { _eq: normalizedPath },
                status: { _eq: 'published' },
                client: { slug: { _eq: config.clientSlug } },
              },
            },
          ],
        },
      ],
    };
  }

  return {
    _and: [...base, globalScope],
  };
}

function allFaqsFilter(config: DirectusConfig): UnknownRecord {
  return {
    _and: [
      { client: { slug: { _eq: config.clientSlug } } },
      { status: { _eq: 'published' } },
      {
        _or: [
          {
            _and: [{ website_page: { _null: true } }, { service: { _null: true } }],
          },
          {
            _and: [
              { service: { _null: true } },
              {
                website_page: {
                  status: { _eq: 'published' },
                  client: { slug: { _eq: config.clientSlug } },
                },
              },
            ],
          },
          {
            _and: [
              { website_page: { _null: true } },
              {
                service: {
                  status: { _eq: 'published' },
                  client: { slug: { _eq: config.clientSlug } },
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

async function fetchFaqs(filter: UnknownRecord, limit: number): Promise<DirectusFaq[]> {
  const config = getDirectusConfig();
  if (!config) return [];

  const url = new URL(`items/${DIRECTUS_COLLECTION}`, `${config.url}/`);
  url.searchParams.set('fields', FAQ_FIELDS.join(','));
  url.searchParams.set('filter', JSON.stringify(filter));
  url.searchParams.set('sort', 'sort_order,question');
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${config.token}`,
    },
    next: {
      revalidate: DIRECTUS_REVALIDATE_SECONDS,
      tags: [`directus:faqs:${config.clientSlug}`],
    },
  });

  if (!response.ok) {
    throw new Error(`[directus-faqs] Directus HTTP ${response.status} ${response.statusText}.`);
  }

  const payload = (await response.json()) as DirectusListResponse<DirectusFaqItem>;
  if (payload.errors?.length) {
    throw new Error(
      payload.errors
        .map((error) => error.message)
        .filter(Boolean)
        .join('; ') || '[directus-faqs] Directus request failed.',
    );
  }

  return (payload.data ?? [])
    .map((item) => mapFaq(item, config))
    .sort(
      (left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title),
    );
}

export async function listFaqs(options: ListFaqsOptions = {}): Promise<DirectusFaq[]> {
  const config = getDirectusConfig();
  if (!config) return [];
  const limit = Math.min(500, Math.max(1, options.limit ?? 8));
  const faqs = await fetchFaqs(faqFilter(config, options.pagePath, options.serviceSlug), 500);
  const normalizedPagePath = options.pagePath ? normalizePagePath(options.pagePath) : null;
  const normalizedServicePath = options.serviceSlug ? `/${options.serviceSlug}` : null;

  return faqs
    .sort((left, right) => {
      const leftIsPageSpecific =
        left.websitePage?.path === normalizedPagePath ||
        left.service?.path === normalizedServicePath;
      const rightIsPageSpecific =
        right.websitePage?.path === normalizedPagePath ||
        right.service?.path === normalizedServicePath;
      if (leftIsPageSpecific !== rightIsPageSpecific) {
        return leftIsPageSpecific ? -1 : 1;
      }
      return left.sortOrder - right.sortOrder || left.title.localeCompare(right.title);
    })
    .slice(0, limit);
}

export async function listAllFaqs(limit = 500): Promise<DirectusFaq[]> {
  const config = getDirectusConfig();
  if (!config) {
    throw new Error(
      '[directus-faqs] Cannot render the FAQ archive without Directus configuration.',
    );
  }
  return fetchFaqs(allFaqsFilter(config), Math.min(500, Math.max(1, limit)));
}

export function groupFaqsForArchive(faqs: DirectusFaq[]): DirectusFaqGroup[] {
  const groups = new Map<string, DirectusFaqGroup>();

  for (const faq of faqs) {
    const owner = faq.websitePage ?? faq.service;
    const key = owner?.id ?? 'global';
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(faq);
      continue;
    }
    groups.set(key, {
      key,
      title: owner?.navLabel ?? 'General',
      path: owner?.path ?? null,
      items: [faq],
    });
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      items: [...group.items].sort(
        (left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title),
      ),
    }))
    .sort((left, right) => {
      if (left.key === 'global') return -1;
      if (right.key === 'global') return 1;
      return left.title.localeCompare(right.title);
    });
}
