export type LandingPageHero = {
  headline: string;
  subhead: string;
  offer: string;
  primaryCta: string;
  secondaryCta: string;
  heroImage: string;
};

export type LandingPageSeo = {
  title: string;
  description: string;
  canonicalPath: string;
};

export type LandingPageConfig = {
  slug: string;
  city: string;
  serviceArea: string;
  hero: LandingPageHero;
  gallery: string[];
  seo: LandingPageSeo;
};

export const LANDING_PAGE_SLUGS = [
  "sarasota",
  "bradenton",
  "palmetto",
  "lakewood-ranch",
  "venice",
  "north-port",
  "port-charlotte",
  "punta-gorda",
] as const;

export type LandingPageSlug = (typeof LANDING_PAGE_SLUGS)[number];

const TEAM_IMAGE = "https://next.sonshineroofing.com/wp-content/uploads/Nathan-Jeremy-JB-ezgif.com-optiwebp.webp";
const LOGO_IMAGE = "https://next.sonshineroofing.com/wp-content/uploads/sonshine-logo-3.webp";
const VENICE_PROJECT_IMAGE = "https://next.sonshineroofing.com/wp-content/uploads/3-Innisbrook-Court-Venice-FL-Roof-Replacement.webp";
const NORTH_PORT_PROJECT_IMAGE = "https://next.sonshineroofing.com/wp-content/uploads/3-Brewster-Rd-North-Port-FL-Roof-Replacement.webp";
const SARASOTA_PROJECT_IMAGE = "https://next.sonshineroofing.com/wp-content/uploads/3-Old-Stone-Rd-Sarasota-FL-Roof-Replacement.webp";

export const LANDING_PAGES_CONFIG: Record<LandingPageSlug, LandingPageConfig> = {
  sarasota: {
    slug: "sarasota",
    city: "Sarasota",
    serviceArea: "Serving Sarasota, Siesta Key, and Gulf Gate",
    hero: {
      headline: "Residential Roofing Experts in Sarasota",
      subhead: "Local repairs, replacements, and inspections by in-house crews—since 1987.",
      offer: "Free Roofing Estimate",
      primaryCta: "Get My Free Estimate",
      secondaryCta: "Or call (941) 866-4320",
      heroImage: SARASOTA_PROJECT_IMAGE,
    },
    gallery: [SARASOTA_PROJECT_IMAGE, VENICE_PROJECT_IMAGE, NORTH_PORT_PROJECT_IMAGE],
    seo: {
      title: "Sarasota Roofing | Free Roofing Estimate | SonShine Roofing",
      description: "Book a free roofing estimate in Sarasota. Shingle, metal, and tile experts trusted since 1987. Licensed, insured, and warranty-backed.",
      canonicalPath: "/landing-pages/sarasota",
    },
  },
  bradenton: {
    slug: "bradenton",
    city: "Bradenton",
    serviceArea: "Serving Bradenton, West Bradenton, and Cortez",
    hero: {
      headline: "Residential Roofing Experts in Bradenton",
      subhead: "Fast, local roofing help—repairs, replacements, and inspections backed by 38+ years.",
      offer: "Free Roofing Estimate",
      primaryCta: "Get My Free Estimate",
      secondaryCta: "Or call (941) 866-4320",
      heroImage: VENICE_PROJECT_IMAGE,
    },
    gallery: [VENICE_PROJECT_IMAGE, NORTH_PORT_PROJECT_IMAGE, TEAM_IMAGE],
    seo: {
      title: "Bradenton Roofing | Free Roofing Estimate | SonShine Roofing",
      description: "Schedule a free roofing estimate in Bradenton. Shingle, metal, and tile specialists—licensed, insured, and warranty-backed.",
      canonicalPath: "/landing-pages/bradenton",
    },
  },
  palmetto: {
    slug: "palmetto",
    city: "Palmetto",
    serviceArea: "Serving Palmetto, Ellenton, and Terra Ceia",
    hero: {
      headline: "Residential Roofing Experts in Palmetto",
      subhead: "Trusted local crews for inspections, repairs, and full replacements—no subcontractors.",
      offer: "Free Roofing Estimate",
      primaryCta: "Get My Free Estimate",
      secondaryCta: "Or call (941) 866-4320",
      heroImage: NORTH_PORT_PROJECT_IMAGE,
    },
    gallery: [NORTH_PORT_PROJECT_IMAGE, SARASOTA_PROJECT_IMAGE, LOGO_IMAGE],
    seo: {
      title: "Palmetto Roofing | Free Roofing Estimate | SonShine Roofing",
      description: "Book a free roofing estimate in Palmetto. Veteran team for shingle, metal, and tile roofs. Licensed, insured, and warranty-backed.",
      canonicalPath: "/landing-pages/palmetto",
    },
  },
  "lakewood-ranch": {
    slug: "lakewood-ranch",
    city: "Lakewood Ranch",
    serviceArea: "Serving Lakewood Ranch, University Park, and Waterside",
    hero: {
      headline: "Residential Roofing Experts in Lakewood Ranch",
      subhead: "Premium roof repairs and replacements with in-house crews and fast scheduling.",
      offer: "Free Roofing Estimate",
      primaryCta: "Get My Free Estimate",
      secondaryCta: "Or call (941) 866-4320",
      heroImage: SARASOTA_PROJECT_IMAGE,
    },
    gallery: [SARASOTA_PROJECT_IMAGE, VENICE_PROJECT_IMAGE, TEAM_IMAGE],
    seo: {
      title: "Lakewood Ranch Roofing | Free Roofing Estimate | SonShine Roofing",
      description: "Free roofing estimate in Lakewood Ranch. Shingle, metal, and tile specialists serving Manatee and Sarasota counties.",
      canonicalPath: "/landing-pages/lakewood-ranch",
    },
  },
  venice: {
    slug: "venice",
    city: "Venice",
    serviceArea: "Serving Venice, Nokomis, and Osprey",
    hero: {
      headline: "Residential Roofing Experts in Venice",
      subhead: "Local Venice roof inspections, repairs, and replacements backed by 38+ years.",
      offer: "Free Roofing Estimate",
      primaryCta: "Get My Free Estimate",
      secondaryCta: "Or call (941) 866-4320",
      heroImage: VENICE_PROJECT_IMAGE,
    },
    gallery: [VENICE_PROJECT_IMAGE, NORTH_PORT_PROJECT_IMAGE, SARASOTA_PROJECT_IMAGE],
    seo: {
      title: "Venice Roofing | Free Roofing Estimate | SonShine Roofing",
      description: "Request a free roofing estimate in Venice. Shingle, metal, and tile pros—licensed, insured, and warranty-backed.",
      canonicalPath: "/landing-pages/venice",
    },
  },
  "north-port": {
    slug: "north-port",
    city: "North Port",
    serviceArea: "Serving North Port, Warm Mineral Springs, and Toledo Blade",
    hero: {
      headline: "Residential Roofing Experts in North Port",
      subhead: "Expert inspections, repairs, and replacements—local crews ready to help fast.",
      offer: "Free Roofing Estimate",
      primaryCta: "Get My Free Estimate",
      secondaryCta: "Or call (941) 866-4320",
      heroImage: NORTH_PORT_PROJECT_IMAGE,
    },
    gallery: [NORTH_PORT_PROJECT_IMAGE, VENICE_PROJECT_IMAGE, TEAM_IMAGE],
    seo: {
      title: "North Port Roofing | Free Roofing Estimate | SonShine Roofing",
      description: "Get a free roofing estimate in North Port. Trusted shingle, metal, and tile specialists—licensed and insured.",
      canonicalPath: "/landing-pages/north-port",
    },
  },
  "port-charlotte": {
    slug: "port-charlotte",
    city: "Port Charlotte",
    serviceArea: "Serving Port Charlotte, Deep Creek, and Murdock",
    hero: {
      headline: "Residential Roofing Experts in Port Charlotte",
      subhead: "Rapid-response roofing for repairs and replacements—since 1987.",
      offer: "Free Roofing Estimate",
      primaryCta: "Get My Free Estimate",
      secondaryCta: "Or call (941) 866-4320",
      heroImage: NORTH_PORT_PROJECT_IMAGE,
    },
    gallery: [NORTH_PORT_PROJECT_IMAGE, SARASOTA_PROJECT_IMAGE, LOGO_IMAGE],
    seo: {
      title: "Port Charlotte Roofing | Free Roofing Estimate | SonShine Roofing",
      description: "Free roofing estimate in Port Charlotte. Shingle, metal, and tile experts—licensed, insured, and warranty-backed.",
      canonicalPath: "/landing-pages/port-charlotte",
    },
  },
  "punta-gorda": {
    slug: "punta-gorda",
    city: "Punta Gorda",
    serviceArea: "Serving Punta Gorda, Punta Gorda Isles, and Burnt Store",
    hero: {
      headline: "Residential Roofing Experts in Punta Gorda",
      subhead: "Licensed, insured, and local—repairs, replacements, and inspections done right.",
      offer: "Free Roofing Estimate",
      primaryCta: "Get My Free Estimate",
      secondaryCta: "Or call (941) 866-4320",
      heroImage: VENICE_PROJECT_IMAGE,
    },
    gallery: [VENICE_PROJECT_IMAGE, NORTH_PORT_PROJECT_IMAGE, TEAM_IMAGE],
    seo: {
      title: "Punta Gorda Roofing | Free Roofing Estimate | SonShine Roofing",
      description: "Schedule a free roofing estimate in Punta Gorda. Veteran shingle, metal, and tile crews with warranties included.",
      canonicalPath: "/landing-pages/punta-gorda",
    },
  },
};

export function getLandingPageConfig(slug: string): LandingPageConfig | null {
  const key = slug as LandingPageSlug;
  return LANDING_PAGES_CONFIG[key] || null;
}
