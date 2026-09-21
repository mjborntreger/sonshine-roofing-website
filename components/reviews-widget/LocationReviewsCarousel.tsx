import type { LocationReview } from '@/lib/content/location-types';
import ReviewsCarouselView from './ReviewsCarouselView';
import { reviewDate, safeReviewUrl } from './review-presentation';

/** Location selection and CMS access belong to the deployment snapshot, never this view. */
export default function LocationReviewsCarousel({ reviews }: { reviews: LocationReview[] }) {
  return <ReviewsCarouselView reviews={reviews.map(review => ({
    id: review.id,
    authorName: review.authorName,
    text: review.text,
    rating: review.rating,
    areaName: review.areaName,
    ...reviewDate(review.date),
    sourceUrl: safeReviewUrl(review.url),
    sourceLabel: 'Read original review',
  }))} />;
}
