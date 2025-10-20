import { SITE_ORIGIN } from "@/lib/seo/site";
import type { Review } from "./types";

const DEFAULT_BUSINESS_NAME = "SonShine Roofing";
const DEFAULT_BUSINESS_TYPE = "RoofingContractor";
const DEFAULT_MAX_REVIEWS = 40;
const DEFAULT_BEST_RATING = 5;
const DEFAULT_WORST_RATING = 5;

type NumericInput = number | string | null | undefined;

const toFiniteNumber = (value: NumericInput): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toPositiveInteger = (value: NumericInput): number | null => {
  const parsed = toFiniteNumber(value);
  if (parsed === null) return null;
  const integral = Math.trunc(parsed);
  return integral > 0 ? integral : null;
};

const toIsoDate = (unixSeconds?: number | null): string | null => {
  if (typeof unixSeconds !== "number" || !Number.isFinite(unixSeconds)) return null;
  if (unixSeconds <= 0) return null;
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const trimOrNull = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export type ReviewSchemaOptions = {
  businessName?: string | null;
  businessUrl?: string | null;
  businessType?: string | null;
  bestRating?: number | string | null;
  worstRating?: number | string | null;
  sameAs?: (string | null | undefined)[] | null;
  providerUrl?: string | null;
  maxReviews?: number | null;
};

export type BuildReviewSchemaArgs = {
  reviews: Review[];
  averageRating?: NumericInput;
  reviewCount?: NumericInput;
  ratingCount?: NumericInput;
  options?: ReviewSchemaOptions | null;
};

export const buildReviewSchema = ({
  reviews,
  averageRating,
  reviewCount,
  ratingCount,
  options,
}: BuildReviewSchemaArgs): Record<string, unknown> | null => {
  if (!Array.isArray(reviews) || reviews.length === 0) return null;

  const bestRating =
    toFiniteNumber(options?.bestRating) ?? DEFAULT_BEST_RATING;
  const worstRating =
    toFiniteNumber(options?.worstRating) ?? DEFAULT_WORST_RATING;

  const ratingValues = reviews
    .map((review) => toFiniteNumber(review.rating))
    .filter((value): value is number => value !== null);

  const derivedAverage =
    ratingValues.length > 0
      ? ratingValues.reduce((acc, value) => acc + value, 0) / ratingValues.length
      : null;

  const ratingValue =
    toFiniteNumber(averageRating) ??
    (derivedAverage !== null ? Number(derivedAverage.toFixed(2)) : null);

  if (ratingValue === null) return null;

  const effectiveReviewCount =
    toPositiveInteger(reviewCount) ??
    toPositiveInteger(ratingCount) ??
    (ratingValues.length > 0 ? ratingValues.length : reviews.length);

  const effectiveRatingCount =
    toPositiveInteger(ratingCount) ?? effectiveReviewCount;

  const safeOptions = options ?? {};
  const providerUrl = trimOrNull(safeOptions.providerUrl);
  const businessName =
    trimOrNull(safeOptions.businessName) ?? DEFAULT_BUSINESS_NAME;
  const businessType =
    trimOrNull(safeOptions.businessType) ?? DEFAULT_BUSINESS_TYPE;
  const businessUrl =
    trimOrNull(safeOptions.businessUrl) ?? SITE_ORIGIN;
  const maxReviews =
    toPositiveInteger(safeOptions.maxReviews) ?? DEFAULT_MAX_REVIEWS;

  const sameAs = (safeOptions.sameAs ?? [])
    .concat(providerUrl ? [providerUrl] : [])
    .map(trimOrNull)
    .filter((value): value is string => Boolean(value));

  const limitedReviews = reviews.slice(0, maxReviews).map((review, index) => {
    const authorName = trimOrNull(review.author_name) || `Reviewer ${index + 1}`;
    const reviewBody = trimOrNull(review.text) || "No review text provided.";
    const rating = toFiniteNumber(review.rating) ?? bestRating;
    const datePublished = toIsoDate(review.time);
    const reviewUrl = trimOrNull(review.author_url) ?? providerUrl ?? businessUrl;
    const ownerReply = trimOrNull(review.ownerReply);

    const result: Record<string, unknown> = {
      "@type": "Review",
      author: {
        "@type": "Person",
        name: authorName,
      },
      reviewBody,
      reviewRating: {
        "@type": "Rating",
        ratingValue: rating,
        bestRating,
        worstRating,
      },
      url: reviewUrl,
    };

    if (datePublished) result.datePublished = datePublished;
    if (ownerReply) {
      result.comment = {
        "@type": "Comment",
        text: ownerReply,
        author: {
          "@type": "Organization",
          name: businessName,
        },
      };
    }

    return result;
  });

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": businessType,
    name: businessName,
    url: businessUrl,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue,
      bestRating,
      worstRating,
      reviewCount: effectiveReviewCount,
      ratingCount: effectiveRatingCount,
    },
  };

  if (sameAs.length > 0) {
    schema.sameAs = Array.from(new Set(sameAs));
  }

  if (limitedReviews.length > 0) {
    schema.review = limitedReviews;
  }

  return schema;
};
