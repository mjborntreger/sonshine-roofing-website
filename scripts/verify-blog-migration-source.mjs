import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { DomUtils, parseDocument } from 'htmlparser2';
import { sanitizeDirectusHtml } from '../lib/content/directus-html.ts';

const WORDPRESS_GRAPHQL = 'https://wp.sonshineroofing.com/graphql';
const PUBLIC_HOST = 'https://sonshineroofing.com';
const WORDPRESS_HOST = 'https://wp.sonshineroofing.com';
const WORDPRESS_HTTP_HOST = 'http://wp.sonshineroofing.com';
const MANIFEST_PATH = new URL('../blog-topic-migration-manifest.json', import.meta.url);
const REPORT_PATH = new URL('../blog-migration-source-verification.json', import.meta.url);
const EXPECTED_HASH = 'f5e17569da2f1644ef3b643931e8f4faaeb5d247286e7b95df4eb56d0dd7a30e';
const EXPECTED_VERSION = '1.1.0';
const EXCLUDED_SLUGS = new Set(['grouper-tacos', 'lead-safe-certified']);
const RESPONSIVE_ATTRIBUTES = /\s(?:srcset|sizes|data-src|data-srcset|data-lazy-src|data-original)=(['"])[\s\S]*?\1/gi;
const DIRECTUS_ASSET_PATTERN = /^\/assets\/[0-9a-f]{8}-[0-9a-f-]{27}$/i;
const TAGS_TO_INVENTORY = [
  'blockquote',
  'div',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'iframe',
  'img',
  'ol',
  'script',
  'span',
  'table',
  'ul',
];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeText(html) {
  return DomUtils.textContent(parseDocument(html))
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeRendered(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(parseInt(number, 10)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function gmtIso(value) {
  const raw = String(value ?? '').trim();
  const stamped = /(?:Z|[+-]\d\d:\d\d)$/.test(raw) ? raw : `${raw}Z`;
  const date = new Date(stamped);
  assert.ok(raw && Number.isFinite(date.getTime()), `Invalid GMT date: ${value}`);
  return date.toISOString();
}

function parseJsonList(value, label) {
  if (Array.isArray(value)) return value.map(String);
  const parsed = JSON.parse(String(value ?? '[]'));
  assert.ok(Array.isArray(parsed), `${label} must be a JSON array`);
  return parsed.map(String);
}

function normalizeUrlAliases(value) {
  const aliases = new Set([value]);
  try {
    aliases.add(decodeURI(value));
  } catch {}
  for (const alias of [...aliases]) {
    try {
      aliases.add(encodeURI(alias));
    } catch {}
  }
  return [...aliases].filter(Boolean);
}

function isAllowedYouTubeEmbed(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      ['youtube.com', 'www.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(
        url.hostname.toLowerCase(),
      ) &&
      /^\/embed\/[A-Za-z0-9_-]{6,}$/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

function elements(html, tagName) {
  return DomUtils.findAll(
    (node) => node.type === 'tag' && node.name === tagName,
    parseDocument(html).children,
  );
}

function tagCounts(html) {
  return Object.fromEntries(TAGS_TO_INVENTORY.map((tag) => [tag, elements(html, tag).length]));
}

function buildMediaMap(rows, slug) {
  const relevant = rows.filter((row) => parseJsonList(row.post_slugs, 'post_slugs').includes(slug));
  const aliases = new Map();
  const sourceRows = new Map();

  for (const row of relevant) {
    assert.ok(['verified', 'verified_existing'].includes(row.status), `${slug}: unverified media row`);
    assert.match(row.directus_file_id, /^[0-9a-f]{8}-[0-9a-f-]{27}$/i, `${slug}: invalid file id`);
    assert.ok(parseJsonList(row.roles, 'roles').some((role) => ['featured', 'inline'].includes(role)));

    for (const alias of normalizeUrlAliases(String(row.source_url ?? ''))) {
      const existing = aliases.get(alias);
      assert.ok(!existing || existing === row.directus_file_id, `${slug}: media alias conflict`);
      aliases.set(alias, row.directus_file_id);
      sourceRows.set(alias, row);
    }

    for (const mediaId of parseJsonList(row.wordpress_media_ids, 'wordpress_media_ids')) {
      aliases.set(`wp-id:${mediaId}`, row.directus_file_id);
    }
  }

  return { aliases, relevant, sourceRows };
}

function transformBody(post, mediaMap) {
  let body = post.content;
  for (const [sourceUrl, fileId] of mediaMap.aliases) {
    if (sourceUrl.startsWith('wp-id:')) continue;
    body = body.split(sourceUrl).join(`/assets/${fileId}`);
  }
  body = body.replace(/<img\b[^>]*>/gi, (tag) => {
    const srcMatch = tag.match(/\bsrc=(['"])(.*?)\1/i);
    if (!srcMatch || DIRECTUS_ASSET_PATTERN.test(srcMatch[2])) return tag;
    const mediaId =
      tag.match(/\bdata-id=(['"])(\d+)\1/i)?.[2] ??
      tag.match(/\bwp-image-(\d+)\b/i)?.[1];
    const fileId = mediaId ? mediaMap.aliases.get(`wp-id:${mediaId}`) : null;
    return fileId
      ? tag.replace(srcMatch[0], `src=${srcMatch[1]}/assets/${fileId}${srcMatch[1]}`)
      : tag;
  });
  body = body.replace(RESPONSIVE_ATTRIBUTES, '');
  body = body.split(WORDPRESS_HOST).join(PUBLIC_HOST);
  body = body.split(WORDPRESS_HTTP_HOST).join(PUBLIC_HOST);
  return body;
}

async function readStdinJson() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  assert.ok(input.trim(), 'Expected the read-only n8n media-map JSON on stdin');
  const parsed = JSON.parse(input);
  assert.ok(Array.isArray(parsed), 'Media-map input must be a JSON array');
  return parsed;
}

async function fetchAllPosts() {
  const query = `
    query MigrationSource($first: Int!, $after: String) {
      posts(first: $first, after: $after, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
        pageInfo { hasNextPage endCursor }
        nodes {
          databaseId slug uri status title date modified
          excerpt(format: RENDERED) content(format: RENDERED)
          author { node { databaseId name slug } }
          featuredImage { node { databaseId sourceUrl altText mediaItemUrl } }
          categories(first: 100) { nodes { databaseId name slug } }
          seo {
            title description canonicalUrl
            openGraph { title description type image { url secureUrl width height type } }
          }
        }
      }
    }
  `;
  const posts = [];
  let after = null;

  do {
    const response = await fetch(WORDPRESS_GRAPHQL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { first: 100, after } }),
    });
    assert.equal(response.status, 200, `WPGraphQL HTTP ${response.status}`);
    const payload = await response.json();
    assert.deepEqual(payload.errors, undefined, `WPGraphQL errors: ${JSON.stringify(payload.errors)}`);
    posts.push(...payload.data.posts.nodes);
    after = payload.data.posts.pageInfo.hasNextPage
      ? payload.data.posts.pageInfo.endCursor
      : null;
  } while (after);

  return posts;
}

async function fetchPostBySlug(slug) {
  const query = `
    query MigrationPost($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        databaseId slug uri status title date dateGmt modified modifiedGmt
        excerpt(format: RENDERED) content(format: RENDERED)
        author { node { databaseId name slug } }
        featuredImage { node { databaseId sourceUrl altText mediaItemUrl } }
        categories(first: 100) { nodes { databaseId name slug } }
        seo {
          title description canonicalUrl
          openGraph { title description type image { url secureUrl width height type } }
        }
      }
    }
  `;
  const response = await fetch(WORDPRESS_GRAPHQL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { slug } }),
  });
  assert.equal(response.status, 200, `${slug}: WPGraphQL HTTP ${response.status}`);
  const payload = await response.json();
  assert.deepEqual(
    payload.errors,
    undefined,
    `${slug}: WPGraphQL errors: ${JSON.stringify(payload.errors)}`,
  );
  assert.ok(payload.data?.post, `${slug}: singular source post missing`);
  return payload.data.post;
}

const [manifestRaw, mediaRows, sourcePosts] = await Promise.all([
  readFile(MANIFEST_PATH, 'utf8'),
  readStdinJson(),
  fetchAllPosts(),
]);
const manifest = JSON.parse(manifestRaw);
assert.equal(sha256(manifestRaw), EXPECTED_HASH, 'Manifest hash drift');
assert.equal(manifest.schema_version, EXPECTED_VERSION, 'Manifest schema-version drift');
assert.equal(manifest.posts.length, 108, 'Manifest post count');
assert.equal(sourcePosts.length, 108, 'Published WordPress post count');

const manifestSlugs = new Set(manifest.posts.map((post) => post.slug));
const sourceBySlug = new Map(sourcePosts.map((post) => [post.slug, post]));
assert.equal(sourceBySlug.size, 108, 'Unique WordPress slug count');
assert.deepEqual([...sourceBySlug.keys()].filter((slug) => !manifestSlugs.has(slug)), []);
assert.deepEqual([...manifestSlugs].filter((slug) => !sourceBySlug.has(slug)), []);

const reports = [];
for (const decision of manifest.posts) {
  if (EXCLUDED_SLUGS.has(decision.slug)) continue;
  const indexedPost = sourceBySlug.get(decision.slug);
  const post = await fetchPostBySlug(decision.slug);
  assert.equal(post.databaseId, indexedPost.databaseId, `${post.slug}: index database id drift`);
  assert.equal(post.slug, indexedPost.slug, `${post.slug}: index slug drift`);
  assert.equal(post.modified, indexedPost.modified, `${post.slug}: index modified drift`);
  const mediaMap = buildMediaMap(mediaRows, decision.slug);
  const beforeImages = elements(post.content, 'img');
  const body = transformBody(post, mediaMap);
  const afterImages = elements(body, 'img');
  const iframes = elements(body, 'iframe');
  const sanitized = sanitizeDirectusHtml(body, { assetBaseUrl: 'https://directus.invalid' });
  const sanitizedIframes = elements(sanitized, 'iframe');
  const directusImageSources = afterImages.map((image) => image.attribs.src ?? '');

  assert.ok(post.databaseId > 0, `${post.slug}: database id`);
  assert.equal(post.status, 'publish', `${post.slug}: source status`);
  assert.ok(post.title.trim(), `${post.slug}: title`);
  assert.ok(post.content.trim(), `${post.slug}: body`);
  assert.ok(Number.isFinite(Date.parse(post.date)), `${post.slug}: publication date`);
  assert.ok(Number.isFinite(Date.parse(post.modified)), `${post.slug}: modified date`);
  assert.ok(decision.proposed_topic_slugs.length >= 1, `${post.slug}: topics`);
  assert.ok(decision.proposed_topic_slugs.length <= 3, `${post.slug}: topic maximum`);
  assert.equal(new Set(decision.proposed_topic_slugs).size, decision.proposed_topic_slugs.length);
  assert.equal(beforeImages.length, afterImages.length, `${post.slug}: image count changed`);
  assert.ok(
    directusImageSources.every((src) => DIRECTUS_ASSET_PATTERN.test(src)),
    `${post.slug}: unmapped inline image`,
  );
  assert.ok(
    !body.includes('wp.sonshineroofing.com/wp-content/uploads') &&
      !body.includes('sonshineroofing.com/wp-content/uploads'),
    `${post.slug}: SonShine WordPress upload remains`,
  );
  assert.ok(!body.includes(WORDPRESS_HOST), `${post.slug}: backend hostname remains`);
  assert.equal(elements(body, 'script').length, 0, `${post.slug}: script remains`);
  assert.ok(iframes.every((frame) => isAllowedYouTubeEmbed(frame.attribs.src)));
  assert.equal(sanitizedIframes.length, iframes.length, `${post.slug}: YouTube embed was dropped`);
  assert.equal(normalizeText(sanitized), normalizeText(post.content), `${post.slug}: text-content drift`);

  const featured = post.featuredImage?.node;
  let featuredFileId = null;
  if (featured) {
    featuredFileId =
      mediaMap.aliases.get(featured.sourceUrl) ??
      mediaMap.aliases.get(`wp-id:${featured.databaseId}`) ??
      null;
    assert.ok(featuredFileId, `${post.slug}: featured-image mapping missing`);
  }

  reports.push({
    slug: post.slug,
    database_id: post.databaseId,
    author: post.author?.node?.name ?? null,
    topics: decision.proposed_topic_slugs,
    title: decodeRendered(post.title),
    excerpt: decodeRendered(post.excerpt),
    published_at: gmtIso(post.dateGmt),
    source_updated_at: gmtIso(post.modifiedGmt),
    meta_title: decodeRendered(post.seo?.title),
    meta_description: decodeRendered(post.seo?.description),
    featured: (post.categories?.nodes ?? []).some((category) => category.slug === 'featured'),
    featured_file_id: featuredFileId,
    source_body_sha256: sha256(post.content),
    transformed_body_sha256: sha256(body),
    sanitized_body_sha256: sha256(sanitized),
    source_text_sha256: sha256(normalizeText(post.content)),
    sanitized_text_sha256: sha256(normalizeText(sanitized)),
    source_tag_counts: tagCounts(post.content),
    sanitized_tag_counts: tagCounts(sanitized),
    mapped_media_rows: mediaMap.relevant.length,
    inline_images: beforeImages.length,
    youtube_embeds: iframes.length,
  });
}

assert.equal(reports.length, 106, 'Candidate verification count');
const summary = {
  generated_at: new Date().toISOString(),
  manifest: { schema_version: EXPECTED_VERSION, sha256: EXPECTED_HASH },
  source_posts: 108,
  candidates_verified: reports.length,
  excluded_slugs: [...EXCLUDED_SLUGS],
  author_counts: Object.fromEntries(
    [...new Set(reports.map((post) => post.author))]
      .sort()
      .map((author) => [author, reports.filter((post) => post.author === author).length]),
  ),
  source_markup_post_counts: Object.fromEntries(
    TAGS_TO_INVENTORY.map((tag) => [
      tag,
      reports.filter((post) => post.source_tag_counts[tag] > 0).length,
    ]),
  ),
  inline_image_posts: reports.filter((post) => post.inline_images > 0).length,
  inline_images: reports.reduce((total, post) => total + post.inline_images, 0),
  featured_image_posts: reports.filter((post) => post.featured_file_id).length,
  youtube_embed_posts: reports.filter((post) => post.youtube_embeds > 0).map((post) => post.slug),
  text_hash_mismatches: reports.filter(
    (post) => post.source_text_sha256 !== post.sanitized_text_sha256,
  ).map((post) => post.slug),
  remaining_sonshine_wordpress_backend_urls: 0,
  remaining_sonshine_wordpress_upload_urls: 0,
};

await writeFile(REPORT_PATH, `${JSON.stringify({ summary, posts: reports }, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
