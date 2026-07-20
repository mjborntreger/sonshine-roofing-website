import assert from 'node:assert/strict';
import { calculatePersonSeo } from '../lib/content/person-seo.ts';

const image = {
  url: 'https://directus.example/assets/person-id',
  altText: 'Nathan Borntreger, Owner of SonShine Roofing',
  width: 1167,
  height: 773,
};

const seo = calculatePersonSeo({
  title: 'Nathan Borntreger',
  positionTitle: 'Owner',
  contentPlain:
    'Nathan has served Sarasota homeowners for decades with a commitment to clear recommendations and dependable roofing work. '.repeat(
      3,
    ),
  featuredImage: image,
});

assert.equal(seo.meta_title, 'Nathan Borntreger, Owner | SonShine Roofing');
assert.equal(seo.og_title, seo.meta_title);
assert.equal(seo.og_description, seo.meta_description);
assert.ok(seo.meta_description.length <= 160);
assert.equal(seo.og_image, image);

const placeholder = calculatePersonSeo({
  title: 'Erick',
  positionTitle: 'Installation Crew Leader',
  contentPlain: 'Description coming soon!',
  featuredImage: null,
});
assert.equal(
  placeholder.meta_description,
  'Meet Erick, Installation Crew Leader at SonShine Roofing, serving Sarasota, Manatee, and Charlotte Counties.',
);
assert.equal(placeholder.og_image, null);

process.stdout.write('SonShine person SEO fixtures passed.\n');
