import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const DIRECTUS_URL = process.env.DIRECTUS_URL?.replace(/\/$/, "");
const DIRECTUS_ACCESS_TOKEN = process.env.DIRECTUS_ACCESS_TOKEN;
const CLIENT_ID = "772d4bae-eaae-49c4-b136-864d22f520bd";
const MICHAEL_ID = "f028dafd-c2fb-4d59-a561-2be5e46ea318";
const EXCLUDED_SLUGS = new Set(["grouper-tacos", "lead-safe-certified"]);
const expectedStatusArgument = process.argv.find((argument) =>
  argument.startsWith("--expected-status="),
);
const EXPECTED_STATUS = expectedStatusArgument?.split("=", 2)[1] ?? "published";

if (!new Set(["draft", "published"]).has(EXPECTED_STATUS)) {
  throw new Error("--expected-status must be draft or published.");
}

if (!DIRECTUS_URL || !DIRECTUS_ACCESS_TOKEN) {
  throw new Error("DIRECTUS_URL and DIRECTUS_ACCESS_TOKEN are required.");
}

const sourceVerification = JSON.parse(
  await readFile(
    new URL("../blog-migration-source-verification.json", import.meta.url),
    "utf8",
  ),
);
const topicManifest = JSON.parse(
  await readFile(
    new URL("../blog-topic-migration-manifest.json", import.meta.url),
    "utf8",
  ),
);

async function readDirectus(path, params) {
  const url = new URL(path, DIRECTUS_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${DIRECTUS_ACCESS_TOKEN}` },
  });
  if (!response.ok) {
    throw new Error(`Directus ${response.status} for ${url.pathname}`);
  }
  return (await response.json()).data;
}

async function readStdinJson() {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  if (!input.trim()) throw new Error("Expected queue JSON on stdin.");
  return JSON.parse(input);
}

const [posts, topics] = await Promise.all([
  readDirectus("/items/blog_posts", {
    fields: [
      "id",
      "status",
      "noindex",
      "external_id",
      "slug",
      "title",
      "excerpt",
      "body",
      "client",
      "author",
      "featured",
      "featured_image",
      "published_at",
      "source_updated_at",
      "meta_title",
      "meta_description",
      "primary_focus_keyword",
      "focus_keywords",
      "topics.id",
      "topics.blog_topic.id",
      "topics.blog_topic.slug",
    ].join(","),
    "filter[client][_eq]": CLIENT_ID,
    limit: "-1",
  }),
  readDirectus("/items/blog_topics", {
    fields: "id,slug,status,client",
    "filter[client][_eq]": CLIENT_ID,
    limit: "-1",
    sort: "slug",
  }),
]);

const expectedBySlug = new Map(
  sourceVerification.posts.map((post) => [post.slug, post]),
);
const manifestBySlug = new Map(
  topicManifest.posts
    .filter((post) => !EXCLUDED_SLUGS.has(post.slug))
    .map((post) => [post.slug, post]),
);
const errors = [];
const queueRows = process.argv.includes("--queue-stdin")
  ? await readStdinJson()
  : null;
if (queueRows !== null && !Array.isArray(queueRows)) {
  throw new Error("Queue stdin must contain a JSON array.");
}
const sha256 = (value) =>
  createHash("sha256").update(String(value), "utf8").digest("hex");
const relationId = (value) => value?.id ?? value ?? null;
const sorted = (values) => [...values].sort();
const sameStrings = (left, right) =>
  JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));
const normalizedScalar = (value) => String(value ?? "");
const normalizedInstant = (value) => {
  const timestamp = Date.parse(String(value ?? ""));
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
};

if (posts.length !== 106) errors.push(`Expected 106 posts; found ${posts.length}.`);
if (expectedBySlug.size !== 106) {
  errors.push(`Source verification contains ${expectedBySlug.size} unique slugs.`);
}
if (manifestBySlug.size !== 106) {
  errors.push(`Migration manifest contains ${manifestBySlug.size} candidate slugs.`);
}

const postSlugs = posts.map((post) => post.slug);
const externalIds = posts.map((post) => post.external_id);
if (new Set(postSlugs).size !== posts.length) errors.push("Duplicate post slug found.");
if (new Set(externalIds).size !== posts.length) {
  errors.push("Duplicate external_id found.");
}
for (const slug of EXCLUDED_SLUGS) {
  if (postSlugs.includes(slug)) errors.push(`Excluded slug was imported: ${slug}.`);
}

let michaelAuthors = 0;
let organizationFallbacks = 0;
let featuredPosts = 0;
let junctions = 0;
const keywordValidation = {
  checked: 0,
  missing_primary: 0,
  primary_mismatches: 0,
  duplicate_phrases: 0,
  invalid_arrays: 0,
};
const workerPayloadHashes = new Map();

for (const post of posts) {
  const expected = expectedBySlug.get(post.slug);
  const manifestPost = manifestBySlug.get(post.slug);
  if (!expected || !manifestPost) {
    errors.push(`Unexpected Directus post: ${post.slug}.`);
    continue;
  }

  const expectedExternalId = `wordpress:sonshine-roofing:${expected.database_id}`;
  const expectedAuthor =
    expected.author === "Michael Borntreger" ? MICHAEL_ID : null;
  const actualAuthor = relationId(post.author);
  const actualTopics = (post.topics ?? [])
    .map((junction) => junction.blog_topic?.slug)
    .filter(Boolean);
  const topicIds = (post.topics ?? [])
    .map((junction) => ({
      id: relationId(junction.blog_topic),
      slug: junction.blog_topic?.slug,
    }))
    .filter((topic) => topic.id && topic.slug)
    .sort((left, right) => left.slug.localeCompare(right.slug))
    .map((topic) => topic.id);

  if (post.status !== EXPECTED_STATUS) {
    errors.push(`${post.slug}: status is not ${EXPECTED_STATUS}.`);
  }
  if (relationId(post.client) !== CLIENT_ID) {
    errors.push(`${post.slug}: client mismatch.`);
  }
  if (post.external_id !== expectedExternalId) {
    errors.push(`${post.slug}: external_id mismatch.`);
  }
  if (normalizedScalar(post.title) !== expected.title) {
    errors.push(`${post.slug}: title mismatch.`);
  }
  if (normalizedScalar(post.excerpt) !== expected.excerpt) {
    errors.push(`${post.slug}: excerpt mismatch.`);
  }
  if (normalizedInstant(post.published_at) !== expected.published_at) {
    errors.push(`${post.slug}: published_at mismatch.`);
  }
  if (normalizedInstant(post.source_updated_at) !== expected.source_updated_at) {
    errors.push(`${post.slug}: source_updated_at mismatch.`);
  }
  if (normalizedScalar(post.meta_title) !== expected.meta_title) {
    errors.push(`${post.slug}: meta_title mismatch.`);
  }
  if (normalizedScalar(post.meta_description) !== expected.meta_description) {
    errors.push(`${post.slug}: meta_description mismatch.`);
  }
  if (actualAuthor !== expectedAuthor) {
    errors.push(`${post.slug}: author mismatch.`);
  }
  if (!sameStrings(actualTopics, expected.topics)) {
    errors.push(`${post.slug}: topic mismatch.`);
  }
  if (!sameStrings(actualTopics, manifestPost.proposed_topic_slugs)) {
    errors.push(`${post.slug}: manifest topic mismatch.`);
  }
  if (
    actualTopics.length < 1 ||
    actualTopics.length > 3 ||
    new Set(actualTopics).size !== actualTopics.length
  ) {
    errors.push(`${post.slug}: invalid topic cardinality.`);
  }
  if (post.featured !== expected.featured) {
    errors.push(`${post.slug}: featured mismatch.`);
  }
  if (relationId(post.featured_image) !== expected.featured_file_id) {
    errors.push(`${post.slug}: featured image mismatch.`);
  }
  if (sha256(post.body) !== expected.transformed_body_sha256) {
    errors.push(`${post.slug}: transformed body hash mismatch.`);
  }
  const primaryFocusKeyword = normalizedScalar(
    post.primary_focus_keyword,
  ).trim();
  const focusKeywordsAreValid =
    Array.isArray(post.focus_keywords) &&
    post.focus_keywords.every(
      (keyword) => typeof keyword === "string" && keyword.trim().length > 0,
    );
  const focusKeywords = focusKeywordsAreValid
    ? post.focus_keywords.map((keyword) => keyword.trim())
    : [];
  const validateKeywords =
    post.noindex !== true ||
    primaryFocusKeyword.length > 0 ||
    focusKeywords.length > 0;

  if (validateKeywords) {
    keywordValidation.checked += 1;

    if (!primaryFocusKeyword) {
      keywordValidation.missing_primary += 1;
      errors.push(`${post.slug}: primary focus keyword is missing.`);
    }
    if (!focusKeywordsAreValid || focusKeywords.length === 0) {
      keywordValidation.invalid_arrays += 1;
      errors.push(`${post.slug}: focus keywords must be a nonempty string array.`);
    } else {
      if (focusKeywords[0] !== primaryFocusKeyword) {
        keywordValidation.primary_mismatches += 1;
        errors.push(`${post.slug}: primary focus keyword is not first in focus keywords.`);
      }
      const normalizedKeywords = focusKeywords.map((keyword) =>
        keyword.toLocaleLowerCase("en-US"),
      );
      if (new Set(normalizedKeywords).size !== normalizedKeywords.length) {
        keywordValidation.duplicate_phrases += 1;
        errors.push(`${post.slug}: focus keywords contain duplicate phrases.`);
      }
    }
  }
  if (/wp\.sonshineroofing\.com\/wp-content\/uploads/i.test(post.body)) {
    errors.push(`${post.slug}: WordPress media URL remains.`);
  }
  if (/\s(?:srcset|sizes|data-src|data-srcset|data-lazy-src|data-original)=/i.test(post.body)) {
    errors.push(`${post.slug}: obsolete responsive-image attribute remains.`);
  }
  if (/<script\b/i.test(post.body)) {
    errors.push(`${post.slug}: script element remains.`);
  }
  for (const match of post.body.matchAll(/<img\b[^>]*\bsrc=(["'])(.*?)\1/gi)) {
    if (!/^\/assets\/[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(match[2])) {
      errors.push(`${post.slug}: unmapped image source ${match[2]}.`);
    }
  }
  for (const match of post.body.matchAll(/<iframe[^>]+src=(["'])(.*?)\1/gi)) {
    if (
      !/^https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/[A-Za-z0-9_-]{6,}(?:\?[^#"'< >]*)?(?:#[^"'< >]*)?$/i.test(
        match[2],
      )
    ) {
      errors.push(`${post.slug}: unapproved iframe source ${match[2]}.`);
    }
  }

  workerPayloadHashes.set(
    post.slug,
    sha256(
      JSON.stringify({
        payload: {
          status: "draft",
          external_id: expectedExternalId,
          client: CLIENT_ID,
          title: expected.title,
          slug: post.slug,
          body: post.body,
          excerpt: expected.excerpt,
          published_at: expected.published_at,
          source_updated_at: expected.source_updated_at,
          featured: expected.featured,
          featured_image: expected.featured_file_id,
          author: expectedAuthor,
          meta_title: expected.meta_title,
          meta_description: expected.meta_description,
          // Preserve the original migration worker payload. SEO keywords were
          // intentionally populated in a later, separately verified backfill.
          primary_focus_keyword: null,
          focus_keywords: [],
        },
        topic_ids: topicIds,
      }),
    ),
  );

  if (expectedAuthor) michaelAuthors += 1;
  else organizationFallbacks += 1;
  if (post.featured) featuredPosts += 1;
  junctions += actualTopics.length;
}

const expectedTopicSlugs = sorted(
  topicManifest.proposed_topics.map((topic) => topic.slug),
);
const actualTopicSlugs = sorted(topics.map((topic) => topic.slug));
if (!sameStrings(actualTopicSlugs, expectedTopicSlugs)) {
  errors.push("The SonShine topic catalog does not match the approved 21 topics.");
}
if (
  topics.some(
    (topic) =>
      topic.status !== "published" || relationId(topic.client) !== CLIENT_ID,
  )
) {
  errors.push("A SonShine topic is not published or is assigned to another client.");
}
if (michaelAuthors !== 11 || organizationFallbacks !== 95) {
  errors.push(
    `Author totals mismatch: Michael=${michaelAuthors}, fallback=${organizationFallbacks}.`,
  );
}

let queueHashesVerified = null;
if (queueRows) {
  const postRows = queueRows.filter((row) => row.row_type === "post");
  const candidateRows = postRows.filter((row) => !EXCLUDED_SLUGS.has(row.source_slug));
  const excludedRows = postRows.filter((row) => EXCLUDED_SLUGS.has(row.source_slug));
  if (postRows.length !== 108 || candidateRows.length !== 106 || excludedRows.length !== 2) {
    errors.push("Queue does not contain the exact 106-candidate/two-exclusion post set.");
  }
  if (
    excludedRows.some(
      (row) => row.status !== "excluded" || row.payload_sha256 || row.directus_post_id,
    )
  ) {
    errors.push("An excluded queue row has an invalid terminal state.");
  }
  queueHashesVerified = 0;
  for (const row of candidateRows) {
    const post = posts.find((candidate) => candidate.slug === row.source_slug);
    const expectedHash = workerPayloadHashes.get(row.source_slug);
    if (!post || !expectedHash) {
      errors.push(`${row.source_slug}: queue row has no Directus/source match.`);
      continue;
    }
    if (row.status !== "verified") {
      errors.push(`${row.source_slug}: queue status is not verified.`);
    }
    if (row.directus_post_id !== post.id) {
      errors.push(`${row.source_slug}: queue Directus post ID mismatch.`);
    }
    if (row.payload_sha256 !== expectedHash) {
      errors.push(`${row.source_slug}: queue payload hash mismatch.`);
    } else {
      queueHashesVerified += 1;
    }
    if (!row.post_written_at || !row.relations_written_at || !row.verified_at) {
      errors.push(`${row.source_slug}: queue write/verification checkpoints are incomplete.`);
    }
    if (row.last_error_code || row.last_error_summary) {
      errors.push(`${row.source_slug}: queue row retains an error.`);
    }
  }
}

const summary = {
  posts: posts.length,
  drafts: posts.filter((post) => post.status === "draft").length,
  published: posts.filter((post) => post.status === "published").length,
  expected_status: EXPECTED_STATUS,
  matching_status: posts.filter((post) => post.status === EXPECTED_STATUS).length,
  unique_external_ids: new Set(externalIds).size,
  topics: topics.length,
  junctions,
  max_topics_per_post: Math.max(
    ...posts.map((post) => post.topics?.length ?? 0),
  ),
  michael_authors: michaelAuthors,
  organization_fallbacks: organizationFallbacks,
  featured_posts: featuredPosts,
  exclusions_absent: [...EXCLUDED_SLUGS].every(
    (slug) => !postSlugs.includes(slug),
  ),
  body_hashes_verified: posts.length,
  scalar_fields_verified: posts.length,
  keyword_validation: keywordValidation,
  queue_payload_hashes_verified: queueHashesVerified,
  errors,
};

console.log(JSON.stringify(summary, null, 2));
if (errors.length) process.exitCode = 1;
