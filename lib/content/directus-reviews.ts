import 'server-only';
import { deployedEditorial } from './editorial';
import type { Review } from '@/components/reviews-widget/types';
import type { ReviewsCarouselSettings } from './editorial-types';
export type { ReviewsCarouselSettings } from './editorial-types';
export const DEFAULT_GOOGLE_BUSINESS_PROFILE_URL =
  'https://www.google.com/maps/place/SonShine+Roofing/data=!4m2!3m1!1s0x0:0x5318594fb175e958';
export async function getGoogleReviews(): Promise<Review[]> {
  return deployedEditorial().reviews;
}
export async function getReviewsCarouselSettings(): Promise<ReviewsCarouselSettings> {
  return deployedEditorial().reviewsCarousel;
}
