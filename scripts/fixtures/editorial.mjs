import { ACTIVE_PERSON_SLUGS } from '../../lib/content/person-policy.ts';

/** Synthetic editorial source records, suitable for pagination and publication tests. */
export function editorialFixture(count = 3, revision = 'A') {
  const client = { slug: 'sonshine-roofing' };
  const row = (id, extra) => ({
    id,
    client,
    status: 'published',
    scope_key: `sonshine-roofing:${id}`,
    ...extra,
  });
  const image = {
    id: 'synthetic-image',
    description: 'Synthetic roof image',
    type: 'image/webp',
    width: 1200,
    height: 800,
  };
  const topic = row('roofing', { name: 'Roofing', slug: 'roofing', sort: 1 });
  return {
    blog_posts: Array.from({ length: count }, (_, i) =>
      row(`fixture-post-${i}`, {
        slug: `fixture-post-${i}`,
        title: `Deployment ${revision} post ${i}`,
        body: `<p>Deployment ${revision} body.</p>`,
        noindex: i === count - 1,
        published_at: '2026-01-01T12:00:00Z',
        primary_focus_keyword: 'roofing',
        focus_keywords: ['roofing'],
        featured_image: image,
        author: null,
        topics: [{ blog_topic: topic }],
        meta_description: `Deployment ${revision} description`,
      }),
    ),
    blog_topics: [topic],
    persons: ACTIVE_PERSON_SLUGS.map((slug, sort) =>
      row(slug, {
        slug,
        display_name: `Fixture ${slug}`,
        title: 'Roofing specialist',
        bio: `<p>Deployment ${revision} biography.</p>`,
        noindex: sort !== 0,
        show_on_team: true,
        sort,
        primary_focus_keyword: 'roofing',
        focus_keywords: ['roofing'],
        profile_image: image,
      }),
    ),
    roofing_glossary_terms: Array.from({ length: count }, (_, i) =>
      row(`fixture-term-${i}`, {
        slug: `fixture-term-${i}`,
        title: `Term ${i}`,
        definition: `<p>Deployment ${revision} definition.</p>`,
        noindex: true,
      }),
    ),
    website_pages: [
      row('home', {
        path: '/',
        scope_key: 'sonshine-roofing:/',
        page_type: 'fixed',
        noindex: true,
        meta_title: `Deployment ${revision} home`,
      }),
    ],
    special_offers: Array.from({ length: count }, (_, i) =>
      row(`fixture-offer-${i}`, {
        slug: `fixture-offer-${i}`,
        title: `Deployment ${revision} offer ${i}`,
        description: 'Synthetic offer',
        noindex: i === count - 1,
        featured: false,
        primary_focus_keyword: 'roofing',
        focus_keywords: ['roofing'],
        expiration_date: '2099-01-01',
        featured_image: null,
      }),
    ),
    sponsor_features: [],
    reviews: [
      row('google', {
        source: 'Google',
        external_id: 'synthetic-google-identity',
        rating: 5,
        author_name: 'Fixture reviewer',
        review_text: `Deployment ${revision} review`,
        service_area: null,
      }),
      row('manual', {
        source: 'Manual',
        external_id: null,
        rating: 5,
        author_name: 'Fixture local reviewer',
        review_text: 'Manual local review',
        service_area: 'fixture-city',
      }),
    ],
    reviews_carousels: [
      row('carousel', { limit: 20, gbp_profile_link: 'https://example.test/reviews' }),
    ],
    legal_copy: [
      row('legal', {
        privacy_policy: `<p>Deployment ${revision} privacy.</p>`,
        terms_of_use: `<p>Deployment ${revision} terms.</p>`,
      }),
    ],
  };
}

export function editorialFetcher(fixture, alter) {
  return async (input, options) => {
    const url = new URL(input),
      collection = url.pathname.split('/').at(-1);
    if (options.cache !== 'no-store') throw new Error('Build capture must bypass caches');
    const rows = fixture[collection];
    if (!rows) throw new Error(`Unexpected fixture collection ${collection}`);
    const page = Number(url.searchParams.get('page')),
      size = Number(url.searchParams.get('limit'));
    const payload = {
      data: structuredClone(rows.slice((page - 1) * size, page * size)),
      meta: { filter_count: rows.length },
    };
    return {
      ok: true,
      json: async () => (alter ? alter(payload, collection, page, url) : payload),
    };
  };
}
