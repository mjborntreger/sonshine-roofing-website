export const routes = [
  { href: "/", label: "Home" },
  { href: "/about-sonshine-roofing", label: "About" },

  // Core services
  { href: "/roof-replacement-sarasota-fl", label: "Roof Replacement" },
  { href: "/roof-repair", label: "Roof Repair" },
  { href: "/roof-inspection", label: "Roof Inspection" },
  { href: "/roof-maintenance", label: "Roof Maintenance" },

  // Resources
  { href: "/project", label: "Project Gallery" },
  { href: "/video-library", label: "Video Library" },
  { href: "/blog", label: "Blog" },
  { href: "/roofing-glossary", label: "Roofing Glossary" },
  { href: "/faq", label: "FAQ" },
  { href: "/financing", label: "Financing" },

  // Contact & legal
  { href: "/contact-us", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy Policy" },

  // Miscellaneous (developer/internal)
  // (design-system removed)

  // Additional pages that exist but are not typically navigational
  { href: "/reviews", label: "Reviews" },
  { href: "/tell-us-why", label: "Tell Us Why" },
] as const;

// Typed route constants for shared navigation
import type { Route } from 'next';

export const ROUTES = {
  home: '/' as Route,
  about: '/about-sonshine-roofing' as Route,
  roofReplacement: '/roof-replacement-sarasota-fl' as Route,
  roofRepair: '/roof-repair' as Route,
  roofInspection: '/roof-inspection' as Route,
  roofMaintenance: '/roof-maintenance' as Route,
  project: '/project' as Route,
  videoLibrary: '/video-library' as Route,
  blog: '/blog' as Route,
  roofingGlossary: '/roofing-glossary' as Route,
  faq: '/faq' as Route,
  financing: '/financing' as Route,
  contact: '/contact-us' as Route,
  privacyPolicy: '/privacy-policy' as Route,
  sitemapIndex: '/sitemap_index' as Route,
  // additional pages that exist but are not typically in primary nav
  reviews: '/reviews' as Route,
  tellUsWhy: '/tell-us-why' as Route,
} as const;

export type BuildServiceHrefOptions = {
  locationSlug?: string | null;
  preferLocation?: boolean;
};

export const SERVICE_ROUTE_DEFINITIONS = [
  {
    key: "roofReplacement",
    label: "Roof Replacement",
    baseHref: ROUTES.roofReplacement,
    locationSegment: "roof-replacement",
  },
  {
    key: "roofRepair",
    label: "Roof Repair",
    baseHref: ROUTES.roofRepair,
    locationSegment: "roof-repair",
  },
  {
    key: "roofInspection",
    label: "Roof Inspection",
    baseHref: ROUTES.roofInspection,
    locationSegment: "roof-inspection",
  },
  {
    key: "roofMaintenance",
    label: "Roof Maintenance",
    baseHref: ROUTES.roofMaintenance,
    locationSegment: "roof-maintenance",
  },
] as const;

type ServiceRouteDefinition = (typeof SERVICE_ROUTE_DEFINITIONS)[number];
export type ServiceRouteKey = ServiceRouteDefinition["key"];

const SERVICE_ROUTE_LOOKUP: Record<ServiceRouteKey, ServiceRouteDefinition> =
  SERVICE_ROUTE_DEFINITIONS.reduce((acc, def) => {
    acc[def.key] = def;
    return acc;
  }, {} as Record<ServiceRouteKey, ServiceRouteDefinition>);

const sanitizeLocationSlug = (value: string | null | undefined) => {
  if (!value) return null;
  const trimmed = value.trim().replace(/^\/+|\/+$/g, "");
  return trimmed || null;
};

export const buildServiceHref = (
  service: ServiceRouteKey,
  options?: BuildServiceHrefOptions
): string => {
  const definition = SERVICE_ROUTE_LOOKUP[service];
  if (!definition) return ROUTES.home;

  const slug = sanitizeLocationSlug(options?.locationSlug);
  if (options?.preferLocation && slug) {
    // When location-scoped service pages are launched, enabling preferLocation will flip links automatically.
    return `/locations/${slug}/${definition.locationSegment}`;
  }

  return definition.baseHref;
};

export const getServiceRouteDefinition = (service: ServiceRouteKey) =>
  SERVICE_ROUTE_LOOKUP[service];

export type NavItem = { label: string; href?: Route; children?: NavItem[] };

export const NAV_MAIN: ReadonlyArray<NavItem> = [
  { label: 'About', href: ROUTES.about },
  {
    label: 'Roofing Services',
    children: SERVICE_ROUTE_DEFINITIONS.map(({ label, key }) => ({
      label,
      href: buildServiceHref(key) as Route, // widen when enabling location-scoped service variants
    })),
  },
  {
    label: 'Our Work',
    children: [
      { label: 'Project Gallery', href: ROUTES.project },
      { label: 'Video Library', href: ROUTES.videoLibrary },
      { label: 'Blog', href: ROUTES.blog },
      { label: 'Roofing Glossary', href: ROUTES.roofingGlossary },
      { label: 'FAQ', href: ROUTES.faq },
    ],
  },
  { label: 'Financing', href: ROUTES.financing },
  { label: 'Contact', href: ROUTES.contact },
] as const;

export const NAV_COMPANY: ReadonlyArray<{ label: string; href: Route }> = [
  { label: 'Home', href: ROUTES.home },
  { label: 'About', href: ROUTES.about },
  { label: 'Contact', href: ROUTES.contact },
  { label: 'Financing', href: ROUTES.financing },
];

export const NAV_SERVICES: ReadonlyArray<{ label: string; href: Route }> = [
  ...SERVICE_ROUTE_DEFINITIONS.map(({ label, key }) => ({
    label,
    href: buildServiceHref(key) as Route, // widen when enabling location-scoped service variants
  })),
] as const;

export const NAV_RESOURCES: ReadonlyArray<{ label: string; href: Route }> = [
  { label: 'Project Gallery', href: ROUTES.project },
  { label: 'Video Library', href: ROUTES.videoLibrary },
  { label: 'Roofing Glossary', href: ROUTES.roofingGlossary },
  { label: 'Blog', href: ROUTES.blog },
  { label: 'FAQ', href: ROUTES.faq },
];

export const NAV_LOCATIONS: ReadonlyArray<{ label: string; href: Route }> = [
  { label: 'Sarasota, FL', href: '/locations/sarasota' as Route },
  { label: 'North Port, FL', href: '/locations/north-port' as Route },
  { label: 'Lakewood Ranch, FL', href: '/locations/lakewood-ranch' as Route },
  { label: 'Venice, FL', href: '/locations/venice' as Route },
  // add in more as location posts are created
];


export const normalizePathname = (input: string): string => {
  try {
    const url = new URL(input, "https://example.com");
    let pathname = url.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    return pathname;
  } catch {
    let pathname = input.split("?")[0].split("#")[0] || "/";
    if (!pathname.startsWith("/")) {
      pathname = `/${pathname}`;
    }
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    return pathname;
  }
};

type Primitive = string | number | boolean;
type QueryValue = Primitive | Primitive[] | null | undefined;

const APP_PATHS = {
  blogPost: "/",
  project: "/project",
  person: "/person",
  faq: "/faq",
  roofingGlossary: "/roofing-glossary",
  specialOffer: "/special-offers",
  tellUsWhy: "/tell-us-why",
};

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

const stripSearchAndHash = (value: string) => value.split(/[?#]/)[0] || "";

const lastSegment = (value: string) => {
  const trimmed = trimSlashes(stripSearchAndHash(value));
  if (!trimmed) return null;
  const segments = trimmed.split("/");
  return segments.pop() || null;
};

const normalizeSlug = (value: string | null | undefined) => {
  if (!value) return null;
  const slug = trimSlashes(stripSearchAndHash(String(value))).trim();
  return slug ? slug : null;
};

const serializeQuery = (query?: Record<string, QueryValue>) => {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, raw] of Object.entries(query)) {
    if (raw === null || raw === undefined) continue;
    const appendValue = (value: Primitive) => params.append(key, String(value));
    if (Array.isArray(raw)) {
      raw.forEach((value) => appendValue(value));
    } else {
      appendValue(raw);
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

const appendHash = (hash?: string) => {
  if (!hash) return "";
  return hash.startsWith("#") ? hash : `#${hash}`;
};

const buildPath = (segments: string[], suffix?: string) => {
  const leading = segments.map((segment) => trimSlashes(segment)).filter(Boolean);
  const path = `/${leading.join("/")}`;
  if (!suffix) return path;
  const normalized = trimSlashes(suffix);
  return `${path}/${normalized}`;
};

export const buildBlogPostHref = (slug: string | null | undefined): string | null => {
  const safe = normalizeSlug(slug);
  return safe ? buildPath([APP_PATHS.blogPost, safe]) : null;
};

export const buildProjectHref = (
  slug: string | null | undefined,
  options?: { hash?: string; query?: Record<string, QueryValue> }
): string | null => {
  const safe = normalizeSlug(slug);
  if (!safe) return null;
  const base = buildPath([APP_PATHS.project], safe);
  return `${base}${serializeQuery(options?.query)}${appendHash(options?.hash)}`;
};

export const buildProjectHrefFromUri = (
  uri: string | null | undefined,
  options?: { hash?: string; query?: Record<string, QueryValue> }
): string | null => {
  const slug = uri ? lastSegment(uri) : null;
  return buildProjectHref(slug, options);
};

export const buildPersonHref = (
  slug: string | null | undefined,
  options?: { hash?: string; query?: Record<string, QueryValue> }
): string | null => {
  const safe = normalizeSlug(slug);
  if (!safe) return null;
  const base = buildPath([APP_PATHS.person], safe);
  return `${base}${serializeQuery(options?.query)}${appendHash(options?.hash)}`;
};

export const buildFaqHref = (
  slug: string | null | undefined,
  options?: { hash?: string; query?: Record<string, QueryValue> }
): string | null => {
  const safe = normalizeSlug(slug);
  if (!safe) return null;
  const base = buildPath([APP_PATHS.faq], safe);
  return `${base}${serializeQuery(options?.query)}${appendHash(options?.hash)}`;
};

export const buildRoofingGlossaryHref = (
  slug: string | null | undefined,
  options?: { hash?: string; query?: Record<string, QueryValue> }
): string | null => {
  const safe = normalizeSlug(slug);
  if (!safe) return null;
  const base = buildPath([APP_PATHS.roofingGlossary], safe);
  return `${base}${serializeQuery(options?.query)}${appendHash(options?.hash)}`;
};

export const buildSpecialOfferHref = (
  slug: string | null | undefined,
  options?: { hash?: string; query?: Record<string, QueryValue> }
): string | null => {
  const safe = normalizeSlug(slug);
  if (!safe) return null;
  const base = buildPath([APP_PATHS.specialOffer], safe);
  return `${base}${serializeQuery(options?.query)}${appendHash(options?.hash)}`;
};

export const buildTellUsWhyRatingHref = (
  rating: number | string | null | undefined,
  options?: { hash?: string; query?: Record<string, QueryValue> }
): string => {
  const value = typeof rating === "number" ? rating : Number(rating);
  const normalized = Number.isFinite(value) && value > 0 ? String(value) : undefined;
  const base = buildPath([APP_PATHS.tellUsWhy]);
  const mergedQuery = {
    ...(options?.query ?? {}),
    ...(normalized ? { rating: normalized } : {}),
  };
  return `${base}${serializeQuery(mergedQuery)}${appendHash(options?.hash)}`;
};
