export const REVIEW_PLATFORM_META = {
  google: {
    label: "Google",
    logoSrc: "https://next.sonshineroofing.com/wp-content/uploads/google.webp",
    logoAlt: "Google logo",
    accentColor: "var(--brand-blue)",
    publisherName: "Google",
    publisherUrl: "https://www.google.com/",
  },
  facebook: {
    label: "Facebook",
    logoSrc: "https://next.sonshineroofing.com/wp-content/uploads/facebook-logo-for-reviews.webp",
    logoAlt: "Facebook logo",
    accentColor: "#1877F2",
    publisherName: "Facebook",
    publisherUrl: "https://www.facebook.com/",
  },
  yelp: {
    label: "Yelp",
    logoSrc: "https://next.sonshineroofing.com/wp-content/uploads/Yelp-Logo-Icon-for-Reviews.webp",
    logoAlt: "Yelp logo",
    accentColor: "#FF1A1A",
    publisherName: "Yelp",
    publisherUrl: "https://www.yelp.com/",
  },
  bbb: {
    label: "Better Business Bureau",
    logoSrc: "https://next.sonshineroofing.com/wp-content/uploads/BBB-Logo-Icon-for-Reviews.webp",
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
