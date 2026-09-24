import assert from 'node:assert/strict';
import {
  hasProjectReview,
  selectPostCategoryPreviews,
  selectProjectCategoryPreviews,
  selectRelatedPostPreviews,
  selectRelatedProjectPreviews,
} from '../lib/content/preview-selection.ts';

const terms = (...slugs) => slugs.map(slug => ({ slug }));
const post = (slug, topics = [], date = '2026-01-01') => ({ slug, categoryTerms: terms(...topics), date });
const project = (slug, overrides = {}) => ({
  slug, date: '2026-01-01', materialTypes: terms('metal'), serviceAreas: terms('local'),
  reviewSnippet: null, ...overrides,
});
const slugs = items => items.map(item => item.slug);
let checks = 0;
function check(name, callback) {
  try { callback(); checks++; } catch (error) { error.message = `${name}: ${error.message}`; throw error; }
}

check('homepage finds six category posts beyond the newest sixty and stays category-specific', () => {
  const unrelated = Array.from({ length: 70 }, (_, i) => post(`other-${i}`, ['other'], '2026-01-01'));
  const energy = Array.from({ length: 8 }, (_, i) => post(`energy-${i}`, ['energy'], `2025-01-0${i + 1}`));
  const pool = selectPostCategoryPreviews([...unrelated, ...energy], ['energy']);
  assert.deepEqual(slugs(pool), ['energy-7', 'energy-6', 'energy-5', 'energy-4', 'energy-3', 'energy-2']);
});

check('overlapping homepage categories each get six while the serialized pool is deduplicated', () => {
  const shared = post('shared', ['repair', 'storm'], '2026-03-01');
  const posts = [shared, shared, ...['repair', 'storm'].flatMap(topic =>
    Array.from({ length: 6 }, (_, i) => post(`${topic}-${i}`, [topic], `2026-01-0${i + 1}`)))];
  const pool = selectPostCategoryPreviews(posts, ['repair', 'storm']);
  assert.equal(pool.length, 11);
  for (const topic of ['repair', 'storm']) {
    assert.equal(pool.filter(item => item.categoryTerms.some(term => term.slug === topic)).length, 6);
  }
});

check('related articles rank shared topics before recency, then backfill without duplicates or self', () => {
  const shared = post('two-topics', ['repair', 'storm'], '2020-01-01');
  const posts = [post('current', ['repair', 'storm']), post('recent-general', [], '2026-04-01'),
    post('one-topic', ['repair', 'repair'], '2026-03-01'), shared, shared,
    post('older-general', [], '2026-02-01')];
  assert.deepEqual(slugs(selectRelatedPostPreviews(posts, {
    categorySlugs: [' REPAIR ', 'storm', 'storm'], excludeSlug: 'current',
  })), ['two-topics', 'one-topic', 'recent-general', 'older-general']);
});

check('topic-free and unmatched recommendations use recent articles with stable date ties', () => {
  const posts = [post('invalid', [], 'invalid'), post('b'), post('new', [], '2026-02-01'), post('a')];
  assert.deepEqual(slugs(selectRelatedPostPreviews(posts)), ['new', 'a', 'b', 'invalid']);
  assert.deepEqual(selectRelatedPostPreviews(posts, { categorySlugs: ['missing'] }), selectRelatedPostPreviews(posts));
});

check('metal uses its two reviews then all four unreviewed projects, excluding other materials', () => {
  const metal = Array.from({ length: 6 }, (_, i) => project(`metal-${i}`, {
    date: `2026-01-0${i + 1}`, reviewSnippet: i < 2 ? 'Synthetic testimonial' : null,
  }));
  const pool = selectProjectCategoryPreviews([
    project('tile', { materialTypes: terms('tile'), reviewSnippet: 'Synthetic testimonial' }), ...metal, metal[0],
  ], ['metal']);
  assert.deepEqual(slugs(pool), ['metal-1', 'metal-0', 'metal-5', 'metal-4', 'metal-3', 'metal-2']);
});

check('reviewed projects beyond the newest thirty-six are eligible before limiting', () => {
  const recent = Array.from({ length: 40 }, (_, i) => project(`new-${i}`));
  const reviewed = project('old-reviewed', { date: '2020-01-01', reviewSnippet: 'Synthetic testimonial' });
  const result = selectRelatedProjectPreviews([...recent, reviewed]);
  assert.equal(result.length, 6);
  assert.equal(result[0].slug, 'old-reviewed');
});

check('related projects prioritize all local projects before regional review tiers', () => {
  const localReview = project('local-reviewed', { date: '2020-01-01', reviewSnippet: 'Synthetic testimonial' });
  const regionalReview = project('regional-reviewed', { serviceAreas: terms('regional'), reviewSnippet: 'Synthetic testimonial' });
  const regionalPlain = project('regional-plain', { serviceAreas: terms('regional'), date: '2026-04-01' });
  const result = selectRelatedProjectPreviews([
    regionalPlain, regionalReview, project('local-plain'), localReview, localReview, project('current'),
  ], { serviceAreaSlugs: [' LOCAL '], excludeSlug: 'current' });
  assert.deepEqual(slugs(result), ['local-reviewed', 'local-plain', 'regional-reviewed', 'regional-plain']);
});

check('excluding the sole local review retains local unreviewed alternatives and fills regionally', () => {
  const current = project('current', { reviewSnippet: 'Synthetic testimonial' });
  const other = project('regional', { serviceAreas: terms('elsewhere'), reviewSnippet: 'Synthetic testimonial' });
  assert.deepEqual(slugs(selectRelatedProjectPreviews([current, other, project('local')], {
    serviceAreaSlugs: ['local'], excludeSlug: 'current',
  })), ['local', 'regional']);
  assert.deepEqual(slugs(selectRelatedProjectPreviews([current, other], {
    serviceAreaSlugs: ['local'], excludeSlug: 'current',
  })), ['regional']);
});

check('review eligibility uses testimonial text, not an author or source URL', () => {
  assert.equal(hasProjectReview({ reviewSnippet: ' Synthetic testimonial ' }), true);
  assert.equal(hasProjectReview({ reviewSnippet: '  ', reviewUrl: 'https://example.test/review' }), false);
  assert.equal(hasProjectReview({ reviewAuthorName: 'Synthetic author' }), false);
});

check('empty and zero-limit results are empty, and selectors do not mutate snapshot order', () => {
  assert.deepEqual(selectRelatedPostPreviews([]), []);
  assert.deepEqual(selectRelatedProjectPreviews([]), []);
  const projects = Object.freeze([Object.freeze(project('b')), Object.freeze(project('a'))]);
  assert.deepEqual(selectRelatedProjectPreviews(projects, { limit: 0 }), []);
  assert.deepEqual(slugs(selectRelatedProjectPreviews(projects)), ['a', 'b']);
  assert.deepEqual(slugs(projects), ['b', 'a']);
});

console.log(`${checks} content preview fixtures passed.`);
