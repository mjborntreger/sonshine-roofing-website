export const REVIEW_PLATFORM_META = {
  google: {
    label: "Google",
    logoSrc: "https://directus.borntregerdigital.com/assets/0c0a8ad3-fec9-58dc-89c5-4894980ce0f2",
    logoAlt: "Google logo",
    accentColor: "var(--brand-blue)",
    publisherName: "Google",
    publisherUrl: "https://www.google.com/",
  },
  facebook: {
    label: "Facebook",
    logoSrc: "https://directus.borntregerdigital.com/assets/1c8df021-1e1a-5763-ac6b-90125f863b64",
    logoAlt: "Facebook logo",
    accentColor: "#1877F2",
    publisherName: "Facebook",
    publisherUrl: "https://www.facebook.com/",
  },
  yelp: {
    label: "Yelp",
    logoSrc: "https://directus.borntregerdigital.com/assets/638c7dad-6228-5390-bddb-8a248629a930",
    logoAlt: "Yelp logo",
    accentColor: "#FF1A1A",
    publisherName: "Yelp",
    publisherUrl: "https://www.yelp.com/",
  },
  bbb: {
    label: "Better Business Bureau",
    logoSrc: "https://directus.borntregerdigital.com/assets/fafbc009-9583-5b26-bd11-f7fa17b54771",
    logoAlt: "Better Business Bureau logo",
    accentColor: "#005F86",
    publisherName: "Better Business Bureau",
    publisherUrl: "https://www.bbb.org/",
  },
} as const;

export type ReviewPlatform = keyof typeof REVIEW_PLATFORM_META;

export type ReviewPlatformMeta = (typeof REVIEW_PLATFORM_META)[ReviewPlatform];

export const DEFAULT_REVIEW_PLATFORM: ReviewPlatform = "google";

const REVIEW_PLATFORM_ALIASES: Record<string, ReviewPlatform> = {
  google: "google",
  "google reviews": "google",
  facebook: "facebook",
  "facebook reviews": "facebook",
  yelp: "yelp",
  "yelp reviews": "yelp",
  bbb: "bbb",
  "better business bureau": "bbb",
};

export const normalizeReviewPlatform = (value?: string | null): ReviewPlatform | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return REVIEW_PLATFORM_ALIASES[normalized] ?? null;
};

export const getReviewPlatformMeta = (platform?: ReviewPlatform | null): ReviewPlatformMeta => {
  if (!platform) return REVIEW_PLATFORM_META[DEFAULT_REVIEW_PLATFORM];
  return REVIEW_PLATFORM_META[platform] ?? REVIEW_PLATFORM_META[DEFAULT_REVIEW_PLATFORM];
};
