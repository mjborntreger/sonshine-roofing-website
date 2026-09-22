import 'server-only';
import { deployedEditorial } from './editorial';
import { isSpecialOfferIndexable } from '@/lib/seo/special-offer-indexing';
import { isSpecialOfferExpired, parseSpecialOfferDate } from '@/lib/lead-capture/specialOfferDates';
import type { SpecialOffer } from './editorial-types';
export type { SpecialOffer, SpecialOfferImage } from './editorial-types';
function compareFeaturedOffers(a: SpecialOffer, b: SpecialOffer): number {
  const aDate = a.expirationDate ? parseSpecialOfferDate(a.expirationDate) : null;
  const bDate = b.expirationDate ? parseSpecialOfferDate(b.expirationDate) : null;
  const aTime = aDate ? aDate.getTime() : Number.POSITIVE_INFINITY;
  const bTime = bDate ? bDate.getTime() : Number.POSITIVE_INFINITY;
  if (aTime !== bTime) return aTime - bTime;
  return a.slug.localeCompare(b.slug);
}

export async function listSpecialOfferSlugs(limit?: number): Promise<string[]> {
  return deployedEditorial()
    .offers.slice(0, limit)
    .map((offer) => offer.slug);
}
export async function getSpecialOfferBySlug(slug: string): Promise<SpecialOffer | null> {
  return deployedEditorial().offers.find((offer) => offer.slug === slug.trim()) ?? null;
}
export async function getFeaturedSpecialOffer(): Promise<SpecialOffer | null> {
  return (
    deployedEditorial()
      .offers.filter((offer) => offer.featured && !isSpecialOfferExpired(offer.expirationDate))
      .sort(compareFeaturedOffers)[0] ?? null
  );
}
export async function listSpecialOfferSitemapEntries(): Promise<
  Array<{ uri: string; modified: string | null }>
> {
  return deployedEditorial()
    .offers.filter(isSpecialOfferIndexable)
    .map((offer) => ({ uri: '/special-offers/' + offer.slug, modified: offer.dateUpdated }));
}
