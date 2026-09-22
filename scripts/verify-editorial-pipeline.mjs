import assert from 'node:assert/strict';
import { fetchEditorialSnapshot } from '../lib/content/build/editorial.mjs';
import { editorialFixture, editorialFetcher } from './fixtures/editorial.mjs';
const env = {
  DIRECTUS_URL: 'https://cms.example.test',
  DIRECTUS_CLIENT_SLUG: 'sonshine-roofing',
  DIRECTUS_TOKEN: 'synthetic-token',
};
const fixture = editorialFixture(503);
const capture = (alter) => fetchEditorialSnapshot(env, editorialFetcher(fixture, alter));
const { editorial, shared, owners } = await capture();
for (const key of ['posts', 'glossary', 'offers']) assert.equal(editorial[key].length, 503);
assert.equal(editorial.persons.length, 10);
assert.equal(editorial.reviews.length, 1, 'Manual reviews must never enter the Google feed');
assert.equal(shared.reviews.length, 2);
assert.equal(owners.blog_posts.length, 503);
assert.doesNotMatch(
  JSON.stringify(editorial),
  /synthetic-token|synthetic-google-identity|scope_key|external_id/,
);
assert.equal(editorial.posts.filter((post) => post.noindex).length, 1);
fixture.blog_posts[1].date_created = '2026-01-02T12:00:00Z';
assert.equal((await capture()).editorial.posts[0].slug, 'fixture-post-1');
for (const [alter, error] of [
  [
    (payload, collection, page) =>
      collection === 'blog_posts' && page === 2 ? { ...payload, data: [] } : payload,
    /truncated/,
  ],
  [
    (payload, collection, page) =>
      collection === 'blog_posts' && page === 2
        ? { ...payload, data: [fixture.blog_posts[0]] }
        : payload,
    /identit/,
  ],
  [(payload) => ({ ...payload, meta: {} }), /count/],
  [(payload, collection, page) => ({ ...payload, meta: { filter_count: 502 + page } }), /changed/],
  [
    (payload) => ({
      ...payload,
      data: [{ ...payload.data[0], client: { slug: 'other' } }],
      meta: { filter_count: 1 },
    }),
    /scope/,
  ],
  [
    (payload) => ({
      ...payload,
      data: [{ ...payload.data[0], status: 'draft' }],
      meta: { filter_count: 1 },
    }),
    /scope/,
  ],
  [() => ({}), /invalid/],
  [() => ({ data: null }), /invalid/],
  [() => ({ data: {} }), /invalid/],
])
  await assert.rejects(capture(alter), error);
fixture.blog_posts[0].featured_image.description = '';
await assert.rejects(capture(), /description/);
fixture.blog_posts[0].featured_image.description = 'Synthetic image';
fixture.blog_posts[0].body = '<p>Allowed</p><script>unsafe()</script>';
assert.doesNotMatch(
  (await capture()).editorial.posts.find((post) => post.slug === 'fixture-post-0').contentHtml,
  /script|unsafe/,
);
console.log(
  'Verified complete editorial capture, scope, publication, sanitization, review isolation, and failed-build handling.',
);
