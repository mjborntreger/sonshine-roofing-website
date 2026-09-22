import { directusBuildConfig, readDirectusCollection } from '../directus-projects.mjs';
import { DIRECTUS_POST_FIELDS, mapDirectusPost } from './blog.ts';
import { DIRECTUS_FIELDS as PERSON_FIELDS, mapDirectusPerson } from './persons.ts';
import { ACTIVE_PERSON_SLUGS } from '../person-policy.ts';
import { DIRECTUS_FIELDS as GLOSSARY_FIELDS, mapGlossaryTerm } from './glossary.ts';
import { DIRECTUS_FIELDS as SPONSOR_FIELDS, mapSponsorFeature } from './sponsors.ts';
import { SPECIAL_OFFER_FIELDS, mapSpecialOffer } from './offers.ts';
import { LEGAL_COPY_FIELDS, normalizeLegalCopy } from './legal.ts';
import { REVIEW_FIELDS, CAROUSEL_FIELDS, mapReview, normalizeCarousel } from './reviews.ts';
import { WEBSITE_PAGE_FIELDS, normalizeWebsitePages } from './pages.ts';

const fail = (message) => {
  throw new Error(`[editorial snapshot] ${message}`);
};
const bySlug = (a, b) => a.slug.localeCompare(b.slug, 'en-US');
const required = (value, label) =>
  typeof value === 'string' && value.trim() ? value.trim() : fail(`${label} is required.`);

/** Complete public projections; raw source rows are used only within this build. */
export async function fetchEditorialSnapshot(env = process.env, fetcher = fetch) {
  const config = directusBuildConfig(env);
  const scope = { client: { slug: { _eq: config.clientSlug } }, status: { _eq: 'published' } };
  const owners = {};
  async function read(collection, fields, { published = true, owner = false, filter = {} } = {}) {
    const rows = await readDirectusCollection(
      config,
      fetcher,
      collection,
      [
        ...new Set([
          'client.slug',
          ...(published ? ['status'] : []),
          ...(owner ? ['scope_key'] : []),
          ...fields,
        ]),
      ],
      {
        filter: { ...(published ? scope : { client: scope.client }), ...filter },
        ...(collection === 'blog_posts' ? { deep: { topics: { _limit: -1 } } } : {}),
      },
    );
    for (const row of rows) {
      if (row.client?.slug !== config.clientSlug || (published && row.status !== 'published'))
        fail(`${collection} escaped client/publication scope.`);
    }
    if (owner) owners[collection] = rows;
    return rows;
  }
  const postRows = await read('blog_posts', DIRECTUS_POST_FIELDS, { owner: true });
  const topicRows = await read('blog_topics', ['name', 'slug', 'sort']);
  const people = await read('persons', [...PERSON_FIELDS, 'sort'], {
    owner: true,
    filter: { slug: { _in: [...ACTIVE_PERSON_SLUGS] } },
  });
  if (people.some((row) => !ACTIVE_PERSON_SLUGS.includes(row.slug)))
    fail('Person escaped the approved roster.');
  const terms = await read('roofing_glossary_terms', GLOSSARY_FIELDS, { owner: true });
  const pages = await read('website_pages', WEBSITE_PAGE_FIELDS, { owner: true });
  const offers = await read('special_offers', [...SPECIAL_OFFER_FIELDS, 'featured_image.type'], {
    owner: true,
  });
  const sponsors = await read('sponsor_features', [...SPONSOR_FIELDS, 'logo.type']);
  const { rows: reviewRows, reviews } = await fetchReviewSnapshot(config, fetcher);
  const carousels = await read('reviews_carousels', CAROUSEL_FIELDS, { published: false });
  const legal = await read('legal_copy', LEGAL_COPY_FIELDS, { published: false });
  const editorial = {
    version: 1,
    clientSlug: config.clientSlug,
    posts: postRows
      .sort(
        (a, b) =>
          String(b.published_at).localeCompare(String(a.published_at)) ||
          String(b.date_created || '').localeCompare(String(a.date_created || '')) ||
          bySlug(a, b),
      )
      .map((row) => mapDirectusPost(row, config)),
    topics: topicRows
      .sort(
        (a, b) =>
          (Number(a.sort) || 0) - (Number(b.sort) || 0) ||
          String(a.name).localeCompare(String(b.name)),
      )
      .map((row) => ({
        name: required(row.name, 'Topic name'),
        slug: required(row.slug, 'Topic slug'),
      })),
    persons: people
      .sort(
        (a, b) =>
          (Number(a.sort) || 0) - (Number(b.sort) || 0) ||
          String(a.display_name || a.first_name).localeCompare(
            String(b.display_name || b.first_name),
          ),
      )
      .map((row) => mapDirectusPerson(row, config)),
    glossary: terms
      .map((row) => mapGlossaryTerm(row, config))
      .sort((a, b) => a.title.localeCompare(b.title) || bySlug(a, b)),
    websitePages: normalizeWebsitePages(pages, config).sort((a, b) => a.path.localeCompare(b.path)),
    offers: offers
      .map(
        (row) =>
          mapSpecialOffer(row, config) || fail('Published offer is missing required content.'),
      )
      .sort(bySlug),
    sponsors: sponsors
      .sort(
        (a, b) =>
          (Number(a.sort) || 0) - (Number(b.sort) || 0) ||
          String(a.title).localeCompare(String(b.title)),
      )
      .map((row) => mapSponsorFeature(row, config)),
    reviews,
    reviewsCarousel: normalizeCarousel(carousels),
    legalCopy: normalizeLegalCopy(legal, config),
  };
  for (const key of ['posts', 'topics', 'persons', 'glossary', 'offers', 'sponsors']) {
    const slugs = editorial[key].map((row) => row.slug);
    if (new Set(slugs).size !== slugs.length) fail(`Duplicate ${key} slug.`);
  }
  return { editorial, owners, shared: { sponsors, offers, reviews: reviewRows } };
}

/** Shared location/sitewide capture; Google membership remains a separate filter. */
export async function fetchReviewSnapshot(config, fetcher = fetch) {
  const rows = await readDirectusCollection(
    config,
    fetcher,
    'reviews',
    [
      'client.slug',
      'status',
      ...REVIEW_FIELDS,
      'service_area',
      'source',
      'external_id',
      'sort_order',
    ],
    {
      filter: {
        client: { slug: { _eq: config.clientSlug } },
        status: { _eq: 'published' },
        rating: { _eq: 5 },
        review_text: { _nnull: true },
        author_name: { _nnull: true },
      },
    },
  );
  for (const row of rows) {
    if (row.client?.slug !== config.clientSlug || row.status !== 'published' || row.rating !== 5)
      fail('Review escaped published client/five-star scope.');
  }
  const reviews = rows
    .filter(
      (row) =>
        row.source === 'Google' && typeof row.external_id === 'string' && row.external_id.trim(),
    )
    .sort(
      (a, b) =>
        (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) ||
        String(b.source_created_at || '').localeCompare(String(a.source_created_at || '')) ||
        String(b.review_date || '').localeCompare(String(a.review_date || '')) ||
        String(a.id).localeCompare(String(b.id)),
    )
    .map(mapReview)
    .filter(Boolean);
  return { rows, reviews };
}
