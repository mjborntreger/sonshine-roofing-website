import 'server-only';

import { preparePersonBioHtml } from '@/lib/content/directus-person-html';
import { calculatePersonSeo, type PersonSeo } from '@/lib/content/person-seo';

const DIRECTUS_COLLECTION = 'persons';
const DIRECTUS_REVALIDATE_SECONDS = 900;
const DIRECTUS_LIMIT = 100;

export const ACTIVE_PERSON_SLUGS = [
  'nathan-borntreger',
  'bob',
  'josh',
  'jb',
  'jeremy-k',
  'tara',
  'mina',
  'michael',
  'erick',
  'jose',
] as const;

export const EXCLUDED_PERSON_SLUGS = [
  'antonio',
  'tony',
  'angela',
  'dean',
  'steve',
  'matthew',
] as const;

const activeSlugSet = new Set<string>(ACTIVE_PERSON_SLUGS);

type UnknownRecord = Record<string, unknown>;
type DirectusConfig = { url: string; clientSlug: string; token: string };
type DirectusListResponse<T> = {
  data?: T[];
  errors?: Array<{ message?: string }>;
};

export type PersonImage = {
  url: string;
  altText: string;
  width: number | null;
  height: number | null;
};

export type Person = {
  slug: string;
  title: string;
  contentHtml: string;
  contentPlain: string;
  featuredImage: PersonImage | null;
  positionTitle: string | null;
  showOnTeam: boolean;
  seoIndexable: boolean;
  sourceUpdatedAt: string | null;
  seo: PersonSeo;
};

export type PersonNavItem = Pick<Person, 'slug' | 'title' | 'positionTitle'>;
export type PersonSitemapEntry = {
  uri: string;
  modified: string | null;
  featuredImage: PersonImage | null;
};

const DIRECTUS_FIELDS = [
  'client.slug',
  'status',
  'slug',
  'display_name',
  'first_name',
  'last_name',
  'title',
  'bio',
  'profile_image.id',
  'profile_image.description',
  'profile_image.width',
  'profile_image.height',
  'sort',
  'show_on_team',
  'seo_indexable',
  'external_id',
  'source_updated_at',
  'date_updated',
] as const;

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text || null;
}

function readBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const text = readString(value)?.toLowerCase();
  if (text === 'true' || text === '1' || text === 'yes') return true;
  if (text === 'false' || text === '0' || text === 'no') return false;
  return fallback;
}

function withCalculatedSeo(person: Omit<Person, 'seo'>): Person {
  return { ...person, seo: calculatePersonSeo(person) };
}

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function directusConfig(): DirectusConfig {
  const url = readString(process.env.DIRECTUS_URL)?.replace(/\/+$/, '');
  const clientSlug = readString(process.env.DIRECTUS_CLIENT_SLUG);
  const token =
    readString(process.env.DIRECTUS_TOKEN) ?? readString(process.env.DIRECTUS_STATIC_TOKEN);
  if (!url || !clientSlug || !token) {
    throw new Error(
      '[persons] Directus persons require DIRECTUS_URL, DIRECTUS_CLIENT_SLUG, and DIRECTUS_TOKEN or DIRECTUS_STATIC_TOKEN.',
    );
  }
  return { url, clientSlug, token };
}

function directusImage(value: unknown, config: DirectusConfig): PersonImage | null {
  const image = asRecord(value);
  const id = readString(image?.id);
  if (!id) return null;
  const description = readString(image?.description);
  if (!description) {
    throw new Error(`[persons] Directus profile image ${id} is missing its required description.`);
  }
  const width = typeof image?.width === 'number' ? image.width : null;
  const height = typeof image?.height === 'number' ? image.height : null;
  return {
    url: `${config.url}/assets/${encodeURIComponent(id)}`,
    altText: description,
    width,
    height,
  };
}

function mapDirectusPerson(item: UnknownRecord, config: DirectusConfig): Person {
  const slug = readString(item.slug);
  if (!slug || !activeSlugSet.has(slug)) {
    throw new Error(`[persons] Directus returned unsupported active person slug "${slug ?? ''}".`);
  }
  const firstName = readString(item.first_name) ?? '';
  const lastName = readString(item.last_name) ?? '';
  const title = readString(item.display_name) ?? `${firstName} ${lastName}`.trim();
  if (!title) throw new Error(`[persons] Directus person ${slug} has no displayable name.`);
  const biography = preparePersonBioHtml(readString(item.bio));
  if (!biography) throw new Error(`[persons] Directus person ${slug} has no biography text.`);
  return withCalculatedSeo({
    slug,
    title,
    contentHtml: biography.html,
    contentPlain: biography.text,
    featuredImage: directusImage(item.profile_image, config),
    positionTitle: readString(item.title),
    showOnTeam: readBoolean(item.show_on_team),
    seoIndexable: readBoolean(item.seo_indexable),
    sourceUpdatedAt: readString(item.source_updated_at) ?? readString(item.date_updated),
  });
}

async function fetchDirectusPeople(
  options: {
    filter?: UnknownRecord;
    sort?: readonly string[];
    limit?: number;
  } = {},
): Promise<Person[]> {
  const config = directusConfig();
  const url = new URL(`items/${DIRECTUS_COLLECTION}`, `${config.url}/`);
  url.searchParams.set('fields', DIRECTUS_FIELDS.join(','));
  url.searchParams.set(
    'filter',
    JSON.stringify({
      client: { slug: { _eq: config.clientSlug } },
      status: { _eq: 'published' },
      slug: { _in: [...ACTIVE_PERSON_SLUGS] },
      ...(options.filter ?? {}),
    }),
  );
  url.searchParams.set('limit', String(options.limit ?? DIRECTUS_LIMIT));
  if (options.sort?.length) url.searchParams.set('sort', options.sort.join(','));
  const response = await fetch(url, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${config.token}` },
    next: {
      revalidate: DIRECTUS_REVALIDATE_SECONDS,
      tags: [`directus:persons:${config.clientSlug}`],
    },
  });
  if (!response.ok) {
    throw new Error(`[persons] Directus HTTP ${response.status} ${response.statusText}.`);
  }
  const payload = (await response.json()) as DirectusListResponse<UnknownRecord>;
  if (payload.errors?.length) {
    throw new Error(
      payload.errors
        .map((error) => error.message)
        .filter(Boolean)
        .join('; '),
    );
  }
  return (payload.data ?? []).map((item) => mapDirectusPerson(item, config));
}

export async function listTeamPersons(): Promise<Person[]> {
  return fetchDirectusPeople({
    filter: { show_on_team: { _eq: true } },
    sort: ['sort', 'display_name', 'first_name'],
  });
}

export async function listPersonNav(limit = DIRECTUS_LIMIT): Promise<PersonNavItem[]> {
  return (await fetchDirectusPeople({ sort: ['sort', 'display_name', 'first_name'], limit })).map(
    ({ slug, title, positionTitle }) => ({ slug, title, positionTitle }),
  );
}

export async function listPersonsBySlug(slug: string): Promise<Person | null> {
  if (!activeSlugSet.has(slug)) return null;
  return (await fetchDirectusPeople({ filter: { slug: { _eq: slug } }, limit: 1 }))[0] ?? null;
}

export async function listPersonSitemapEntries(): Promise<PersonSitemapEntry[]> {
  const people = await fetchDirectusPeople({
    filter: { seo_indexable: { _eq: true } },
    sort: ['sort', 'display_name', 'first_name'],
  });
  return people
    .filter((person) => person.seoIndexable)
    .map((person) => ({
      uri: `/person/${person.slug}`,
      modified: person.sourceUpdatedAt,
      featuredImage: person.featuredImage,
    }));
}

export async function getPersonProfileImage(slug: string): Promise<PersonImage> {
  const person = await listPersonsBySlug(slug);
  if (!person?.featuredImage) {
    throw new Error(`[persons] Published Directus person "${slug}" has no profile image.`);
  }
  return person.featuredImage;
}
