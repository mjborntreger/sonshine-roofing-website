import { ensureAbsoluteUrl, SITE_ORIGIN } from "./site";

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
    const entity: SchemaInit = {
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answerHtml },
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

export type ServiceSchemaInput = {
  name: string;
  description?: string;
  url: string;
  provider?: SchemaInit | string;
  areaServed?: string[];
  offers?: SchemaInit[];
  serviceType?: string;
  id?: string;
  origin?: string;
  withContext?: boolean;
};

export function serviceSchema({
  name,
  description,
  url,
  provider,
  areaServed,
  offers,
  serviceType,
  id,
  origin = SITE_ORIGIN,
  withContext = true,
}: ServiceSchemaInput) {
  const schema: SchemaInit = {
    "@type": "Service",
    name,
    url: ensureAbsoluteUrl(url, origin),
  };

  if (description) schema.description = description;
  if (id) schema["@id"] = ensureAbsoluteUrl(id, origin);
  if (serviceType) schema.serviceType = serviceType;
  if (provider) {
    schema.provider =
      typeof provider === "string"
        ? { "@id": ensureAbsoluteUrl(provider, origin) }
        : provider;
  }
  if (areaServed?.length) {
    schema.areaServed = areaServed.map((name) => ({
      "@type": "AdministrativeArea",
      name,
    }));
  }
  if (offers?.length) schema.hasOfferCatalog = { "@type": "OfferCatalog", itemListElement: offers };

  return applyContext(schema, withContext);
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

export type CreativeWorkSchemaInput = {
  name: string;
  description?: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  inLanguage?: string;
  material?: string[];
  about?: string[];
  areaServed?: string[];
  isPartOf?: SchemaInit | string;
  publisher?: SchemaInit;
  origin?: string;
  withContext?: boolean;
  additionalProperties?: SchemaInit;
};

export function creativeWorkSchema({
  name,
  description,
  url,
  image,
  datePublished,
  dateModified,
  inLanguage,
  material,
  about,
  areaServed,
  isPartOf,
  publisher,
  origin = SITE_ORIGIN,
  withContext = true,
  additionalProperties,
}: CreativeWorkSchemaInput) {
  const schema: SchemaInit = {
    "@type": "CreativeWork",
    name,
    url: ensureAbsoluteUrl(url, origin),
  };

  if (description) schema.description = description;
  if (image) {
    const absoluteImage = ensureAbsoluteUrl(image, origin);
    schema.image = absoluteImage;
    schema.thumbnailUrl = absoluteImage;
  }
  if (datePublished) schema.datePublished = datePublished;
  if (dateModified) schema.dateModified = dateModified;
  if (inLanguage) schema.inLanguage = inLanguage;
  if (material?.length) schema.material = material;
  if (about?.length) schema.about = about;
  if (areaServed?.length) {
    schema.areaServed = areaServed.map((name) => ({
      "@type": "AdministrativeArea",
      name,
    }));
  }
  if (isPartOf) {
    schema.isPartOf =
      typeof isPartOf === "string" ? ensureAbsoluteUrl(isPartOf, origin) : isPartOf;
  }
  if (publisher) schema.publisher = publisher;
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
