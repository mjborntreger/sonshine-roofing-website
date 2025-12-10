import { ensureAbsoluteUrl, SITE_ORIGIN } from "./site";
import { DEFAULT_REVIEW_PLATFORM, getReviewPlatformMeta, type ReviewPlatform } from "@/lib/reviews/platforms";

type MaybeString = string | null | undefined;

const SCHEMA_CONTEXT = "https://schema.org";

type SchemaInit = Record<string, unknown>;

function applyContext<T extends SchemaInit>(schema: T, includeContext: boolean) {
  if (!includeContext) return schema;
  return { "@context": SCHEMA_CONTEXT, ...schema };
}

function compact<T>(value: T | null | undefined): value is T {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function uniqueStrings(values: MaybeString[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (!value) continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    const normalized = trimmed.toLowerCase().startsWith("http")
      ? trimFragment(trimmed)
      : trimmed;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(trimmed);
  }
  return out;
}

function trimFragment(value: string): string {
  return value.replace(/#.*$/, "");
}

const DEFAULT_POSTAL_ADDRESS = {
  streetAddress: "2555 Porter Lake Dr STE 109",
  addressLocality: "Sarasota",
  addressRegion: "FL",
  postalCode: "34240",
  addressCountry: "US",
} as const;

const DEFAULT_BUSINESS_PHONE = "+1-941-866-4320";
const DEFAULT_BUSINESS_NAME = "SonShine Roofing";
const DEFAULT_BUSINESS_TYPE = "RoofingContractor";
const DEFAULT_MAX_REVIEWS = 40;
const DEFAULT_BEST_RATING = 5;
const DEFAULT_WORST_RATING = 1;

type MaybeNumber = number | string | null | undefined;

const trimOrNull = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toFiniteNumber = (value: MaybeNumber): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toPositiveInteger = (value: MaybeNumber): number | null => {
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

const toIsoDateString = (value?: string | null): string | null => {
  const trimmed = trimOrNull(value ?? null);
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const stripToPlainText = (html: string | null | undefined): string | null => {
  if (!html) return null;
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
  return text.length ? text : null;
};

const normalizeRelativeUrl = (value: string | null | undefined, origin: string): string | null => {
  const trimmed = trimOrNull(value);
  if (!trimmed) return null;
  if (trimmed.startsWith("//")) {
    return ensureAbsoluteUrl(`https:${trimmed}`, origin);
  }
  return ensureAbsoluteUrl(trimmed, origin);
};

export type FaqSchemaItem = {
  question: string;
  answerHtml: string;
  url?: string;
};

export type FaqSchemaOptions = {
  origin?: string;
  url?: string;
  withContext?: boolean;
};

export function faqSchema(
  items: FaqSchemaItem[],
  { origin = SITE_ORIGIN, url, withContext = true }: FaqSchemaOptions = {},
) {
  const mainEntity = items.map((item) => {
    const answerText = stripToPlainText(item.answerHtml) ?? "";
    const entity: SchemaInit = {
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: answerText },
    };
    if (item.url) entity.url = ensureAbsoluteUrl(item.url, origin);
    return entity;
  });

  const schema: SchemaInit = {
    "@type": "FAQPage",
    mainEntity,
  };

  if (url) schema.url = ensureAbsoluteUrl(url, origin);

  return applyContext(schema, withContext);
}

export type BreadcrumbSchemaItem = {
  name: string;
  item: string;
};

export type BreadcrumbSchemaOptions = {
  origin?: string;
  withContext?: boolean;
};

export function breadcrumbSchema(
  breadcrumbs: BreadcrumbSchemaItem[],
  { origin = SITE_ORIGIN, withContext = true }: BreadcrumbSchemaOptions = {},
) {
  const itemListElement = breadcrumbs.map((crumb, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: crumb.name,
    item: ensureAbsoluteUrl(crumb.item, origin),
  }));

  const schema: SchemaInit = {
    "@type": "BreadcrumbList",
    itemListElement,
  };

  return applyContext(schema, withContext);
}

export type WebPageSchemaInput = {
  name: string;
  description?: string;
  url: string;
  origin?: string;
  primaryImage?: string;
  isPartOf?: SchemaInit;
  withContext?: boolean;
};

export function webPageSchema({
  name,
  description,
  url,
  origin = SITE_ORIGIN,
  primaryImage,
  isPartOf,
  withContext = true,
}: WebPageSchemaInput) {
  const schema: SchemaInit = {
    "@type": "WebPage",
    name,
    url: ensureAbsoluteUrl(url, origin),
  };

  if (description) schema.description = description;
  if (primaryImage)
    schema.primaryImageOfPage = {
      "@type": "ImageObject",
      url: ensureAbsoluteUrl(primaryImage, origin),
    };
  if (isPartOf) schema.isPartOf = isPartOf;

  return applyContext(schema, withContext);
}

export type CollectionPageSchemaInput = WebPageSchemaInput & {
  itemList?: SchemaInit;
};

export function collectionPageSchema({
  itemList,
  ...rest
}: CollectionPageSchemaInput) {
  const base = webPageSchema(rest);

  if (Array.isArray(base["@type"])) {
    base["@type"] = Array.from(new Set(["CollectionPage", ...base["@type"]]));
  } else if (base["@type"]) {
    base["@type"] = ["WebPage", "CollectionPage"];
  }

  if (itemList && compact(itemList)) {
    base.hasPart = itemList;
  }

  return base;
}

export type HowToStep = {
  name: string;
  text?: string;
};

export type HowToSectionInput = {
  name: string;
  steps: HowToStep[];
};

export type HowToSchemaInput = {
  name: string;
  description?: string;
  steps?: HowToStep[];
  sections?: HowToSectionInput[];
  url?: string;
  origin?: string;
  withContext?: boolean;
};

export function howToSchema({
  name,
  description,
  steps,
  sections,
  url,
  origin = SITE_ORIGIN,
  withContext = true,
}: HowToSchemaInput) {
  const schema: SchemaInit = {
    "@type": "HowTo",
    name,
  };

  const sectionEntities =
    sections?.map((section) => ({
      "@type": "HowToSection",
      name: section.name,
      itemListElement: section.steps.map((step) => ({
        "@type": "HowToStep",
        name: step.name,
        ...(step.text ? { text: step.text } : {}),
      })),
    })) ?? [];

  const stepEntities =
    steps?.map((step) => ({
      "@type": "HowToStep",
      name: step.name,
      ...(step.text ? { text: step.text } : {}),
    })) ?? [];

  if (sectionEntities.length) {
    schema.step = sectionEntities;
  } else if (stepEntities.length) {
    schema.step = stepEntities;
  }

  if (description) schema.description = description;
  if (url) schema.url = ensureAbsoluteUrl(url, origin);

  return applyContext(schema, withContext);
}

export type ServiceSchemaInput = {
  name: string;
  description?: string;
  url: string;
  image?: string | SchemaInit | Array<string | SchemaInit>;
  serviceType?: string;
  areaServed?: string[];
  material?: string[];
  about?: string[];
  provider?: SchemaInit | string;
  subjectOf?: SchemaInit | SchemaInit[];
  offers?: SchemaInit[];
  id?: string;
  origin?: string;
  withContext?: boolean;
  additionalProperties?: SchemaInit;
};

export function serviceSchema({
  name,
  description,
  url,
  image,
  serviceType,
  areaServed,
  material,
  about,
  provider,
  subjectOf,
  offers,
  id,
  origin = SITE_ORIGIN,
  withContext = true,
  additionalProperties,
}: ServiceSchemaInput) {
  const schema: SchemaInit = {
    "@type": "Service",
    name,
    url: ensureAbsoluteUrl(url, origin),
  };

  if (description) schema.description = description;
  if (id) schema["@id"] = ensureAbsoluteUrl(id, origin);

  const normalizeImage = (value: string | SchemaInit | null | undefined) => {
    if (!value) return null;
    if (typeof value === "string") return ensureAbsoluteUrl(value, origin);
    return value;
  };

  if (Array.isArray(image)) {
    const images = image.map((value) => normalizeImage(value)).filter(compact);
    if (images.length) schema.image = images;
  } else {
    const normalized = normalizeImage(image);
    if (normalized) schema.image = normalized;
  }

  if (serviceType) schema.serviceType = serviceType;
  if (material?.length) schema.material = material;
  if (about?.length) schema.about = about;
  if (areaServed?.length) {
    schema.areaServed = areaServed.map((name) => ({
      "@type": "AdministrativeArea",
      name,
    }));
  }

  const resolvedProvider: SchemaInit =
    typeof provider === "string"
      ? { "@id": ensureAbsoluteUrl(provider, origin) }
      : provider ?? {
        "@type": DEFAULT_BUSINESS_TYPE,
        name: DEFAULT_BUSINESS_NAME,
        url: origin,
      };
  schema.provider = resolvedProvider;

  if (subjectOf) schema.subjectOf = subjectOf;
  if (offers?.length) schema.hasOfferCatalog = { "@type": "OfferCatalog", itemListElement: offers };
  if (additionalProperties) {
    Object.assign(schema, additionalProperties);
  }

  return applyContext(schema, withContext);
}

export type BlogPostingSchemaInput = {
  headline: string;
  description?: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: SchemaInit;
  publisher?: SchemaInit;
  origin?: string;
  withContext?: boolean;
};

export function blogPostingSchema({
  headline,
  description,
  url,
  image,
  datePublished,
  dateModified,
  author,
  publisher,
  origin = SITE_ORIGIN,
  withContext = true,
}: BlogPostingSchemaInput) {
  const schema: SchemaInit = {
    "@type": "BlogPosting",
    headline,
    url: ensureAbsoluteUrl(url, origin),
  };

  if (description) schema.description = description;
  if (image) schema.image = ensureAbsoluteUrl(image, origin);
  if (datePublished) schema.datePublished = datePublished;
  if (dateModified) schema.dateModified = dateModified;
  if (author) schema.author = author;
  if (publisher) schema.publisher = publisher;

  return applyContext(schema, withContext);
}

export type VideoObjectSchemaInput = {
  name?: string | null;
  description?: string | null;
  canonicalUrl?: string | null;
  contentUrl?: string | null;
  embedUrl?: string | null;
  uploadDate?: string | null;
  thumbnailUrls?: MaybeString[];
  origin?: string;
  withContext?: boolean;
  publisherName?: string;
  potentialAction?: SchemaInit;
  isFamilyFriendly?: boolean;
};

export function videoObjectSchema({
  name,
  description,
  canonicalUrl,
  contentUrl,
  embedUrl,
  uploadDate,
  thumbnailUrls = [],
  origin = SITE_ORIGIN,
  withContext = true,
  publisherName = "SonShine Roofing",
  potentialAction,
  isFamilyFriendly,
}: VideoObjectSchemaInput) {
  const schema: SchemaInit = {
    "@type": "VideoObject",
  };

  if (name) schema.name = name.trim();
  if (description) schema.description = description.trim();
  if (canonicalUrl) schema.url = ensureAbsoluteUrl(canonicalUrl, origin);
  if (contentUrl) schema.contentUrl = contentUrl;
  if (embedUrl) schema.embedUrl = embedUrl;
  if (isFamilyFriendly !== undefined) schema.isFamilyFriendly = isFamilyFriendly;

  const uniqueThumbnails = uniqueStrings(thumbnailUrls);
  if (uniqueThumbnails.length) schema.thumbnailUrl = uniqueThumbnails;

  if (uploadDate && !Number.isNaN(Date.parse(uploadDate))) {
    schema.uploadDate = new Date(uploadDate).toISOString();
  }

  if (publisherName) {
    schema.publisher = {
      "@type": "Organization",
      name: publisherName,
    };
  }

  if (potentialAction) schema.potentialAction = potentialAction;

  return applyContext(schema, withContext);
}

export type DefinedTermSchemaInput = {
  name: string;
  description?: string;
  url: string;
  inDefinedTermSet?: string;
  origin?: string;
  withContext?: boolean;
};

export function definedTermSchema({
  name,
  description,
  url,
  inDefinedTermSet,
  origin = SITE_ORIGIN,
  withContext = true,
}: DefinedTermSchemaInput) {
  const schema: SchemaInit = {
    "@type": "DefinedTerm",
    name,
    url: ensureAbsoluteUrl(url, origin),
  };

  if (description) schema.description = description;
  if (inDefinedTermSet) {
    schema.inDefinedTermSet = ensureAbsoluteUrl(inDefinedTermSet, origin);
  }

  return applyContext(schema, withContext);
}

export type PersonSchemaInput = {
  name: string;
  url: string;
  description?: string;
  image?: string;
  jobTitle?: string;
  worksFor?: SchemaInit | string;
  sameAs?: string[];
  origin?: string;
  withContext?: boolean;
};

export function personSchema({
  name,
  url,
  description,
  image,
  jobTitle,
  worksFor,
  sameAs,
  origin = SITE_ORIGIN,
  withContext = true,
}: PersonSchemaInput) {
  const schema: SchemaInit = {
    "@type": "Person",
    name,
    url: ensureAbsoluteUrl(url, origin),
  };

  if (description) schema.description = description;
  if (image) schema.image = ensureAbsoluteUrl(image, origin);
  if (jobTitle) schema.jobTitle = jobTitle;
  if (worksFor) {
    schema.worksFor =
      typeof worksFor === "string"
        ? { "@id": ensureAbsoluteUrl(worksFor, origin) }
        : worksFor;
  }
  if (sameAs?.length) schema.sameAs = sameAs;

  return applyContext(schema, withContext);
}

export type OfferSchemaInput = {
  name: string;
  description?: string;
  url: string;
  price?: string | number;
  priceCurrency?: string;
  availability?: string;
  validFrom?: string;
  validThrough?: string | null;
  seller?: SchemaInit | string;
  itemOffered?: SchemaInit | string;
  origin?: string;
  withContext?: boolean;
};

export function offerSchema({
  name,
  description,
  url,
  price,
  priceCurrency,
  availability,
  validFrom,
  validThrough,
  seller,
  itemOffered,
  origin = SITE_ORIGIN,
  withContext = true,
}: OfferSchemaInput) {
  const schema: SchemaInit = {
    "@type": "Offer",
    name,
    url: ensureAbsoluteUrl(url, origin),
  };

  if (description) schema.description = description;
  if (price !== undefined && price !== null) schema.price = price;
  if (priceCurrency) schema.priceCurrency = priceCurrency;
  if (availability) schema.availability = availability;
  if (validFrom) schema.validFrom = validFrom;
  if (validThrough) schema.validThrough = validThrough;
  if (seller) {
    schema.seller =
      typeof seller === "string"
        ? { "@id": ensureAbsoluteUrl(seller, origin) }
        : seller;
  }
  if (itemOffered) {
    schema.itemOffered =
      typeof itemOffered === "string"
        ? { "@id": ensureAbsoluteUrl(itemOffered, origin) }
        : itemOffered;
  }

  return applyContext(schema, withContext);
}

export type ReviewForSchema = {
  author_name?: string;
  author_url?: string | null;
  rating?: number | null;
  text?: string;
  time?: number | null;
  ownerReply?: string | null;
};

export type ReviewSchemaOptions = {
  businessName?: string | null;
  businessUrl?: string | null;
  businessType?: string | null;
  bestRating?: MaybeNumber;
  worstRating?: MaybeNumber;
  sameAs?: (string | null | undefined)[] | null;
  providerUrl?: string | null;
  maxReviews?: number | null;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  } | null;
  telephone?: string | null;
  geo?: {
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  origin?: string;
  id?: string | null;
  additionalTypes?: string[];
  withContext?: boolean;
};

export type BuildReviewSchemaArgs = {
  reviews: ReviewForSchema[];
  averageRating?: MaybeNumber;
  reviewCount?: MaybeNumber;
  ratingCount?: MaybeNumber;
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

  const safeOptions = options ?? {};
  const origin = trimOrNull(safeOptions.origin) ?? SITE_ORIGIN;

  const bestRating = toFiniteNumber(safeOptions.bestRating) ?? DEFAULT_BEST_RATING;
  const worstRating = toFiniteNumber(safeOptions.worstRating) ?? DEFAULT_WORST_RATING;

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

  const providerUrl = normalizeRelativeUrl(safeOptions.providerUrl, origin);
  const businessName =
    trimOrNull(safeOptions.businessName) ?? DEFAULT_BUSINESS_NAME;
  const businessType = trimOrNull(safeOptions.businessType) ?? DEFAULT_BUSINESS_TYPE;
  const businessUrlInput =
    trimOrNull(safeOptions.businessUrl) ?? SITE_ORIGIN;
  const businessUrl = ensureAbsoluteUrl(businessUrlInput, origin);
  const maxReviews =
    toPositiveInteger(safeOptions.maxReviews) ?? DEFAULT_MAX_REVIEWS;
  const telephone = trimOrNull(safeOptions.telephone) ?? DEFAULT_BUSINESS_PHONE;

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

  const resolvedAddress = {
    ...DEFAULT_POSTAL_ADDRESS,
    ...(safeOptions.address ?? {}),
  };

  const baseTypes = Array.from(
    new Set(["LocalBusiness", businessType, ...(safeOptions.additionalTypes ?? [])]),
  );

  const schema: SchemaInit = {
    "@type": baseTypes,
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
    address: {
      "@type": "PostalAddress",
      ...resolvedAddress,
    },
  };

  if (safeOptions.id) schema["@id"] = ensureAbsoluteUrl(safeOptions.id, origin);
  if (telephone) schema.telephone = telephone;
  if (sameAs.length > 0) schema.sameAs = Array.from(new Set(sameAs));
  if (limitedReviews.length > 0) schema.review = limitedReviews;

  const latitude = safeOptions.geo?.latitude ?? null;
  const longitude = safeOptions.geo?.longitude ?? null;
  if (latitude !== null && longitude !== null) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude,
      longitude,
    };
  }

  const includeContext = safeOptions.withContext ?? true;
  return includeContext ? { "@context": SCHEMA_CONTEXT, ...schema } : schema;
};

export type ProjectReviewSchemaInput = {
  testimonial: {
    customerName?: string;
    customerReview: string;
    ownerReply?: string;
    reviewUrl?: string;
    reviewDate?: string;
    reviewPlatform?: ReviewPlatform;
  };
  projectName: string;
  projectUrl: string;
  projectImage?: string | null;
  origin?: string;
  withContext?: boolean;
};

export function projectReviewSchema({
  testimonial,
  projectName,
  projectUrl,
  projectImage,
  origin = SITE_ORIGIN,
  withContext = true,
}: ProjectReviewSchemaInput) {
  const reviewBody = trimOrNull(testimonial.customerReview);
  if (!reviewBody) return null;

  const authorName = trimOrNull(testimonial.customerName) || "SonShine Roofing Homeowner";
  const canonicalProjectUrl = ensureAbsoluteUrl(projectUrl, origin);
  const reviewUrl = testimonial.reviewUrl
    ? ensureAbsoluteUrl(testimonial.reviewUrl, origin)
    : canonicalProjectUrl;

  const itemReviewed: SchemaInit = {
    "@type": "LocalBusiness",
    name: projectName,
    url: canonicalProjectUrl,
    provider: {
      "@type": DEFAULT_BUSINESS_TYPE,
      name: DEFAULT_BUSINESS_NAME,
      url: origin,
    },
    serviceType: "Roof Replacement",
  };

  if (projectImage) {
    itemReviewed.image = ensureAbsoluteUrl(projectImage, origin);
  }

  const resolvedPlatform = testimonial.reviewPlatform ?? DEFAULT_REVIEW_PLATFORM;
  const platformMeta = getReviewPlatformMeta(resolvedPlatform);
  const reviewIsExternal = Boolean(testimonial.reviewUrl);

  const publisher: SchemaInit = reviewIsExternal
    ? {
        "@type": "Organization",
        name: platformMeta.publisherName,
        url: platformMeta.publisherUrl,
        sameAs: [reviewUrl],
      }
    : {
        "@type": "Organization",
        name: DEFAULT_BUSINESS_NAME,
        url: origin,
      };

  const schema: SchemaInit = {
    "@type": "Review",
    url: reviewUrl,
    reviewBody,
    author: {
      "@type": "Person",
      name: authorName,
    },
    itemReviewed,
    publisher,
    reviewRating: {
      "@type": "Rating",
      ratingValue: DEFAULT_BEST_RATING,
      bestRating: DEFAULT_BEST_RATING,
      worstRating: DEFAULT_WORST_RATING,
    },
  };

  const isoDate = toIsoDateString(testimonial.reviewDate);
  if (isoDate) schema.datePublished = isoDate;

  const ownerReply = trimOrNull(testimonial.ownerReply);
  if (ownerReply) {
    schema.comment = {
      "@type": "Comment",
      text: ownerReply,
      author: {
        "@type": "Organization",
        name: DEFAULT_BUSINESS_NAME,
      },
    };
  }

  return applyContext(schema, withContext);
}

export type SponsorFeatureForSchema = {
  title?: string | null;
  contentHtml?: string | null;
  links?: {
    facebookUrl?: string | null;
    instagramUrl?: string | null;
    websiteUrl?: string | null;
  } | null;
  featuredImage?: {
    url?: string | null;
    altText?: string | null;
  } | null;
};

export type SponsorItemListSchemaInput = {
  features: SponsorFeatureForSchema[];
  name: string;
  description?: string | null;
  origin?: string;
  providerId?: string | null;
  id?: string | null;
  withContext?: boolean;
};

export const sponsorFeaturesItemListSchema = ({
  features,
  name,
  description,
  origin = SITE_ORIGIN,
  providerId,
  id,
  withContext = true,
}: SponsorItemListSchemaInput): Record<string, unknown> | null => {
  if (!Array.isArray(features) || features.length === 0) return null;

  const itemListElement = features
    .map((feature, index) => {
      const title = trimOrNull(feature.title) || `Sponsor ${index + 1}`;
      const websiteUrl = normalizeRelativeUrl(feature.links?.websiteUrl, origin);
      const sameAs = uniqueStrings([
        normalizeRelativeUrl(feature.links?.facebookUrl, origin),
        normalizeRelativeUrl(feature.links?.instagramUrl, origin),
      ]);
      const descriptionText = stripToPlainText(feature.contentHtml);
      const logoUrl = normalizeRelativeUrl(feature.featuredImage?.url, origin);

      const organization: SchemaInit = {
        "@type": "Organization",
        name: title,
      };

      if (websiteUrl) organization.url = websiteUrl;
      if (descriptionText) organization.description = descriptionText;
      if (logoUrl) {
        organization.logo = {
          "@type": "ImageObject",
          url: logoUrl,
          ...(feature.featuredImage?.altText ? { caption: feature.featuredImage.altText } : {}),
        };
      }
      if (sameAs.length) organization.sameAs = sameAs;

      const listItem: SchemaInit = {
        "@type": "ListItem",
        position: index + 1,
        name: title,
        item: organization,
      };

      if (websiteUrl) listItem.url = websiteUrl;

      return listItem;
    })
    .filter(compact);

  if (itemListElement.length === 0) return null;

  const schema: SchemaInit = {
    "@type": "ItemList",
    name,
    numberOfItems: itemListElement.length,
    itemListElement,
  };

  if (description) schema.description = description;
  if (providerId) schema.provider = { "@id": ensureAbsoluteUrl(providerId, origin) };
  if (id) schema["@id"] = ensureAbsoluteUrl(id, origin);

  return applyContext(schema, withContext);
};

export type GraphSchemaInput = {
  items: SchemaInit[];
  origin?: string;
};

export function graphSchema({ items }: GraphSchemaInput) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@graph": items,
  };
}
