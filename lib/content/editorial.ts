import 'server-only';
import { deploymentBundle } from './deployment-snapshot.mjs';
import type {
  NormalizedBlogPost,
  Person,
  GlossaryTerm,
  DirectusSponsorFeature,
  SpecialOffer,
  LegalCopy,
  ReviewsCarouselSettings,
} from './editorial-types';
import type { TermLite } from './wp';
import type { WebsitePage } from './directus-site';
import type { Review } from '@/components/reviews-widget/types';

export type EditorialSnapshot = {
  version: 1;
  clientSlug: string;
  posts: NormalizedBlogPost[];
  topics: TermLite[];
  persons: Person[];
  glossary: GlossaryTerm[];
  websitePages: WebsitePage[];
  sponsors: DirectusSponsorFeature[];
  offers: SpecialOffer[];
  legalCopy: LegalCopy;
  reviews: Review[];
  reviewsCarousel: ReviewsCarouselSettings;
};

export function deployedEditorial(): EditorialSnapshot {
  return deploymentBundle().snapshots['editorial.json'] as EditorialSnapshot;
}
