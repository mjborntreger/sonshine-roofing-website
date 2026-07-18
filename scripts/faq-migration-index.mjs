import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

const outputPath = process.argv[2] || '/private/tmp/sonshine-faq-migration-index.json';
const directusUrl = process.env.DIRECTUS_URL?.trim().replace(/\/+$/, '');
const directusToken =
  process.env.DIRECTUS_ACCESS_TOKEN?.trim() || process.env.DIRECTUS_TOKEN?.trim();

if (!directusUrl || !directusToken) {
  throw new Error('DIRECTUS_URL and DIRECTUS_TOKEN are required.');
}

const WP_REST_URL = 'https://wp.sonshineroofing.com/wp-json/wp/v2';
const SONSHINE_CLIENT_SLUG = 'sonshine-roofing';
const REQUEST_DELAY_MS = 1_000;

const approvedSonshinePages = {
  financing: '/financing',
  referral: '/homeowner-referral-program',
  inspection: '/roof-inspection',
  maintenance: '/roof-maintenance',
  repair: '/roof-repair',
  replacement: '/roof-replacement-sarasota-fl',
};

const approvedExceptionPages = {
  'can-clogged-gutters-really-cause-interior-leaks': approvedSonshinePages.maintenance,
  'do-you-offer-financing-or-detailed-estimates': approvedSonshinePages.financing,
  'how-can-i-extend-my-roofs-lifespan': approvedSonshinePages.maintenance,
  'how-do-i-decide-between-roof-repair-and-full-replacement': approvedSonshinePages.repair,
  'how-do-the-main-roofing-materials-compare-in-sarasotas-climate':
    approvedSonshinePages.replacement,
  'what-should-i-do-after-a-big-storm-to-protect-my-roofs-life': approvedSonshinePages.inspection,
  'what-visible-signs-suggest-repair-vs-replacement': approvedSonshinePages.repair,
  'whats-my-next-step-if-im-unsure': approvedSonshinePages.repair,
  'whats-the-best-roof-type-for-florida-homes': approvedSonshinePages.replacement,
};

const approvedUntaggedReferralSlugs = new Set([
  'is-there-a-limit-to-how-many-rewards-i-can-earn',
  'what-happens-if-more-than-one-person-claims-the-same-referral',
]);

const topicPagePaths = {
  'financing-payment': approvedSonshinePages.financing,
  'referral-program': approvedSonshinePages.referral,
  'roof-inspection': approvedSonshinePages.inspection,
  'roof-maintenance': approvedSonshinePages.maintenance,
  'roof-repair': approvedSonshinePages.repair,
  'roof-replacement': approvedSonshinePages.replacement,
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }
  return response.json();
}

function directusHeaders() {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${directusToken}`,
  };
}

async function listDirectus(collection, fields) {
  const url = new URL(`items/${collection}`, `${directusUrl}/`);
  url.searchParams.set('fields', fields.join(','));
  url.searchParams.set('limit', '500');
  const payload = await fetchJson(url, { headers: directusHeaders() });
  return payload.data ?? [];
}

function decodeHtmlEntities(value) {
  const named = {
    amp: '&',
    apos: "'",
    hellip: '…',
    ldquo: '“',
    lsquo: '‘',
    mdash: '—',
    nbsp: ' ',
    ndash: '–',
    quot: '"',
    rdquo: '”',
    rsquo: '’',
  };

  return String(value ?? '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, token) => {
    if (token.startsWith('#x') || token.startsWith('#X')) {
      return String.fromCodePoint(Number.parseInt(token.slice(2), 16));
    }
    if (token.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(token.slice(1), 10));
    }
    return named[token.toLowerCase()] ?? entity;
  });
}

function checksum(question, answerHtml) {
  return createHash('sha256')
    .update(`${question.trim()}\n${answerHtml.trim().replace(/\r\n/g, '\n')}`)
    .digest('hex');
}

function deterministicFaqId(wordpressId) {
  const hex = createHash('sha256')
    .update(`sonshine-roofing:wordpress-faq:${wordpressId}`)
    .digest('hex')
    .slice(0, 32)
    .split('');
  hex[12] = '5';
  hex[16] = ['8', '9', 'a', 'b'][Number.parseInt(hex[16], 16) % 4];
  const value = hex.join('');
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function nonBlank(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function pageLookupKey(clientSlug, value) {
  return `${clientSlug}::${value}`;
}

function normalizedPageKeyCandidates(pageKey) {
  const value = nonBlank(pageKey);
  if (!value) return [];

  const withoutPrefix = value.replace(/^services?\./, '');
  const candidates = new Set([value, withoutPrefix]);
  for (const candidate of [...candidates]) {
    candidates.add(candidate.startsWith('/') ? candidate : `/${candidate}`);
    candidates.add(`/services/${candidate.replace(/^\//, '')}`);
  }
  if (value === 'home') candidates.add('/');
  return [...candidates];
}

function validateRelatedPage(page, clientSlug, label) {
  if (!page) throw new Error(`${label} links to a missing website page.`);
  if (page.client?.slug !== clientSlug) {
    throw new Error(`${label} links to another client's website page.`);
  }
  if (page.status !== 'published') {
    throw new Error(`${label} links to an unpublished website page.`);
  }
  return page;
}

function resolveExistingFaqPage(faq, pagesByPath, pagesByService, pagesById) {
  const clientSlug = faq.client?.slug;
  if (faq.website_page?.id) {
    return validateRelatedPage(
      pagesById.get(faq.website_page.id),
      clientSlug,
      `Existing FAQ ${faq.id}`,
    );
  }
  const pageKey = nonBlank(faq.page_key);
  const serviceSlug = nonBlank(faq.service_slug);
  if (!pageKey && !serviceSlug) return null;

  const matches = new Map();
  if (serviceSlug) {
    const servicePage = pagesByService.get(pageLookupKey(clientSlug, serviceSlug));
    if (servicePage) matches.set(servicePage.id, servicePage);
  }
  if (pageKey) {
    for (const candidate of normalizedPageKeyCandidates(pageKey)) {
      const page = pagesByPath.get(pageLookupKey(clientSlug, candidate));
      if (page) matches.set(page.id, page);
    }
  }

  if (matches.size !== 1) {
    throw new Error(`Expected one website page for existing FAQ ${faq.id}; found ${matches.size}.`);
  }
  return validateRelatedPage([...matches.values()][0], clientSlug, `Existing FAQ ${faq.id}`);
}

function resolveSonshinePagePath(faq, topicSlugs) {
  if (topicSlugs.includes('energy-efficiency') || topicSlugs.includes('insurance')) {
    return null;
  }
  if (approvedUntaggedReferralSlugs.has(faq.slug)) {
    return approvedSonshinePages.referral;
  }
  if (approvedExceptionPages[faq.slug]) {
    return approvedExceptionPages[faq.slug];
  }
  if (topicSlugs.length === 0) {
    throw new Error(`Untagged FAQ requires a mapping: ${faq.slug}`);
  }
  if (topicSlugs.length === 1 && topicSlugs[0] === 'general') {
    return null;
  }

  const mappedPaths = new Set(topicSlugs.map((slug) => topicPagePaths[slug]).filter(Boolean));
  if (mappedPaths.size !== 1) {
    throw new Error(`FAQ ${faq.slug} requires one approved page; found ${mappedPaths.size}.`);
  }
  return [...mappedPaths][0];
}

const wpFaqUrl = new URL(`${WP_REST_URL}/faq`);
wpFaqUrl.searchParams.set('status', 'publish');
wpFaqUrl.searchParams.set('per_page', '100');
wpFaqUrl.searchParams.set('orderby', 'date');
wpFaqUrl.searchParams.set('order', 'desc');
wpFaqUrl.searchParams.set('_fields', 'id,slug,title,content,faq_topic,date,modified');

const wpTopicUrl = new URL(`${WP_REST_URL}/faq_topic`);
wpTopicUrl.searchParams.set('per_page', '100');
wpTopicUrl.searchParams.set('hide_empty', 'false');
wpTopicUrl.searchParams.set('_fields', 'id,slug,name,count');

const wpFaqs = await fetchJson(wpFaqUrl);
await sleep(REQUEST_DELAY_MS);
const wpTopics = await fetchJson(wpTopicUrl);
await sleep(REQUEST_DELAY_MS);

const directusFaqs = await listDirectus('faqs', [
  'id',
  'client.id',
  'client.slug',
  'question',
  'answer',
  'page_key',
  'service_slug',
  'website_page.id',
  'website_page.path',
  'website_page.client.slug',
  'website_page.status',
  'sort_order',
  'is_published',
  'status',
]);
await sleep(REQUEST_DELAY_MS);
const websitePages = await listDirectus('website_pages', [
  'id',
  'client.id',
  'client.slug',
  'path',
  'nav_label',
  'status',
  'service.slug',
]);

const topicById = new Map(wpTopics.map((topic) => [topic.id, topic]));
const pagesByPath = new Map();
const pagesByService = new Map();
const pagesById = new Map();
for (const page of websitePages) {
  pagesById.set(page.id, page);
  pagesByPath.set(pageLookupKey(page.client?.slug, page.path), page);
  const serviceSlug = page.service?.slug;
  if (serviceSlug) {
    pagesByService.set(pageLookupKey(page.client?.slug, serviceSlug), page);
  }
}

const existingFaqIndex = directusFaqs.map((faq) => {
  const page = resolveExistingFaqPage(faq, pagesByPath, pagesByService, pagesById);
  return {
    source: 'directus',
    directus_id: faq.id,
    client_id: faq.client?.id,
    client_slug: faq.client?.slug,
    question: faq.question,
    legacy_page_key: faq.page_key,
    legacy_service_slug: faq.service_slug,
    website_page: page
      ? {
          id: page.id,
          path: page.path,
          nav_label: page.nav_label,
          status: page.status,
        }
      : null,
    global: page === null,
    status: faq.status,
    sort_order: faq.sort_order,
    checksum: checksum(faq.question, faq.answer),
    mapping_status: 'approved',
  };
});

const sonshineClient = websitePages.find(
  (page) => page.client?.slug === SONSHINE_CLIENT_SLUG,
)?.client;
if (!sonshineClient?.id) {
  throw new Error('SonShine Directus client could not be resolved.');
}

const sonshineFaqIndex = wpFaqs.map((faq, index) => {
  const topics = (faq.faq_topic ?? []).map((topicId) => {
    const topic = topicById.get(topicId);
    if (!topic) throw new Error(`Unknown FAQ topic ID ${topicId}.`);
    return { id: topic.id, slug: topic.slug, name: decodeHtmlEntities(topic.name) };
  });
  const topicSlugs = topics.map((topic) => topic.slug);
  const pagePath = resolveSonshinePagePath(faq, topicSlugs);
  const page = pagePath ? pagesByPath.get(pageLookupKey(SONSHINE_CLIENT_SLUG, pagePath)) : null;
  if (pagePath && !page) {
    throw new Error(`Missing SonShine website page for ${pagePath}.`);
  }
  if (page) {
    validateRelatedPage(page, SONSHINE_CLIENT_SLUG, `WordPress FAQ ${faq.id}`);
  }

  const question = decodeHtmlEntities(faq.title?.rendered).trim();
  const answerHtml = String(faq.content?.rendered ?? '').trim();
  if (!question || !answerHtml) {
    throw new Error(`FAQ ${faq.id} has a blank question or answer.`);
  }

  return {
    source: 'wordpress',
    wordpress_id: faq.id,
    wordpress_slug: faq.slug,
    wordpress_date: faq.date,
    wordpress_modified: faq.modified,
    client_id: sonshineClient.id,
    client_slug: SONSHINE_CLIENT_SLUG,
    question,
    answer_html: answerHtml,
    legacy_topics: topics,
    website_page: page
      ? {
          id: page.id,
          path: page.path,
          nav_label: page.nav_label,
          status: page.status,
        }
      : null,
    global: page === null,
    sort_order: (index + 1) * 10,
    draft_payload: {
      id: deterministicFaqId(faq.id),
      client: sonshineClient.id,
      question,
      answer: answerHtml,
      website_page: page?.id ?? null,
      sort_order: (index + 1) * 10,
      status: 'draft',
      is_published: false,
    },
    checksum: checksum(question, answerHtml),
    mapping_status: 'approved',
    directus_id: null,
  };
});

const groupCounts = sonshineFaqIndex.reduce((counts, faq) => {
  const label = faq.website_page?.nav_label ?? 'General';
  counts[label] = (counts[label] ?? 0) + 1;
  return counts;
}, {});

const index = {
  version: 1,
  generated_at: new Date().toISOString(),
  read_only_generation: true,
  source_counts: {
    wordpress_sonshine_faqs: wpFaqs.length,
    wordpress_topics: wpTopics.length,
    existing_directus_faqs: directusFaqs.length,
    website_pages: websitePages.length,
  },
  expected_counts: {
    wordpress_sonshine_faqs: 45,
  },
  sonshine_group_counts: groupCounts,
  existing_directus_faqs: existingFaqIndex,
  sonshine_wordpress_faqs: sonshineFaqIndex,
};

if (index.source_counts.wordpress_sonshine_faqs !== index.expected_counts.wordpress_sonshine_faqs) {
  throw new Error(`Source counts changed: ${JSON.stringify(index.source_counts)}.`);
}

await writeFile(outputPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
console.log(
  JSON.stringify({
    output: outputPath,
    source_counts: index.source_counts,
    sonshine_group_counts: index.sonshine_group_counts,
  }),
);
