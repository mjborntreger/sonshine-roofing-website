import 'server-only';

import type { Metadata } from 'next';
import { cache } from 'react';
import { deployedLocations } from './locations';
import type { NavItem } from '@/lib/routes';
import { buildBasicMetadata, type BasicMetadataInput, type OgImageInput } from '@/lib/seo/meta';
import {
  readString, requiredString, readBoolean, readFocusKeywords, normalizeWebsitePath,
  trimTrailingSlash, mapAsset, type DirectusConfig, type DirectusFileValue,
} from './directus-site-shell';
export { normalizeWebsitePath } from './directus-site-shell';

type UnknownRecord = Record<string, unknown>;
type DirectusListResponse<T> = { data?: T[]; errors?: Array<{ message?: string }> };

type DirectusWebsitePageItem = {
  path?: unknown;
  meta_title?: unknown;
  meta_description?: unknown;
  og_image_override?: DirectusFileValue;
  noindex?: unknown;
  og_title?: unknown;
  og_description?: unknown;
  nav_label?: unknown;
  page_type?: unknown;
  primary_focus_keyword?: unknown;
  focus_keywords?: unknown;
};

export type DirectusAsset = {
  id: string;
  url: string;
  description: string;
  width: number | null;
  height: number | null;
  type: string | null;
};

export type SiteSettings = {
  brandName: string;
  brandLegalName: string;
  brandSlogan: string;
  brandDescription: string;
  phone: string;
  phoneHref: string;
  email: string;
  siteUrl: string;
  logo: DirectusAsset;
  logoInverted: DirectusAsset;
  favicon: DirectusAsset;
  defaultOgImage: DirectusAsset;
  heroImage: DirectusAsset;
  heroVideo: DirectusAsset;
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  socials: {
    facebook: string | null;
    instagram: string | null;
    youtube: string | null;
    nextdoor: string | null;
    yelp: string | null;
    pinterest: string | null;
    xTwitter: string | null;
    googleBusinessProfile: string | null;
  };
  schemaType: string;
  priceRange: string;
  openingHours: string[];
  robotsDisallow: string[];
  contentSecurityPolicy: string;
  footerIncludeLegal: boolean;
  footerIncludeSocials: boolean;
  footerIncludeServices: boolean;
  enableSiteAnalytics: boolean;
  publicLocation: string | null;
  foundingDate: string;
  licenseNumber: string;
  licenseUrl: string;
  paymentMethods: SiteSettingsLink[];
  languagesServed: string[];
  timezone: string;
  brandsUsed: SiteSettingsLink[];
  discounts: SiteSettingsLink[];
  services: SiteSettingsLink[];
  associations: SiteSettingsLink[];
  llmsTxt: string;
  badges: FooterBadge[];
};

export type SiteSettingsLink = {
  label: string;
  href: string | null;
};

export type FooterBadge = {
  id: string;
  image: DirectusAsset;
  href: string | null;
  sortOrder: number;
};

export type WebsitePage = {
  path: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageOverride: DirectusAsset | null;
  noindex: boolean;
  ogTitle: string | null;
  ogDescription: string | null;
  navLabel: string | null;
  pageType: string;
  primaryFocusKeyword: string | null;
  focusKeywords: string[];
};

export type ServiceSummary = {
  slug: string;
  href: string;
  navLabel: string;
  intro: string;
  lucideIcon: string;
  sortOrder: number;
  noindex: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageOverride: DirectusAsset | null;
  primaryFocusKeyword: string | null;
  focusKeywords: string[];
};

export type SiteBundle = {
  settings: SiteSettings | null;
  pages: WebsitePage[];
  services: ServiceSummary[];
  navigation: NavItem[];
};

let warnedForMissingConfig = false;

function getDirectusConfig(): DirectusConfig | null {
  const url = readString(process.env.DIRECTUS_URL);
  const clientSlug = readString(process.env.DIRECTUS_CLIENT_SLUG);
  const token = readString(process.env.DIRECTUS_TOKEN);

  if (!url || !clientSlug || !token) {
    const message =
      '[directus-site] Missing DIRECTUS_URL, DIRECTUS_CLIENT_SLUG, or DIRECTUS_TOKEN.';
    if (process.env.NODE_ENV === 'production') {
      throw new Error(message);
    }
    if (!warnedForMissingConfig) {
      console.warn(message);
      warnedForMissingConfig = true;
    }
    return null;
  }

  return { url: trimTrailingSlash(url), clientSlug, token };
}

async function fetchCollection<T>(
  config: DirectusConfig,
  collection: string,
  fields: readonly string[],
  filter: UnknownRecord,
  options: { sort?: readonly string[]; limit?: number } = {},
): Promise<T[]> {
  const url = new URL(`items/${collection}`, `${config.url}/`);
  url.searchParams.set('fields', fields.join(','));
  url.searchParams.set('filter', JSON.stringify(filter));
  url.searchParams.set('limit', String(options.limit ?? 100));
  if (options.sort?.length) url.searchParams.set('sort', options.sort.join(','));

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${config.token}`,
    },
    cache: 'force-cache',
  });

  if (!response.ok) {
    throw new Error(
      `[directus-site] Directus ${collection} HTTP ${response.status} ${response.statusText}`,
    );
  }

  const json = (await response.json()) as DirectusListResponse<T>;
  if (json.errors?.length) {
    throw new Error(
      json.errors
        .map((error) => error.message)
        .filter(Boolean)
        .join('; ') || `[directus-site] Directus ${collection} request failed.`,
    );
  }

  if (!Array.isArray(json.data)) {
    throw new Error(`[directus-site] Directus ${collection} returned an invalid collection response.`);
  }
  return json.data;
}

export const getSiteSettings = cache(async (): Promise<SiteSettings | null> => {
  return deployedLocations().siteShell.settings;
});

export const getWebsitePages = cache(async (): Promise<WebsitePage[]> => {
  const config = getDirectusConfig();
  if (!config) return [];

  const items = await fetchCollection<DirectusWebsitePageItem>(
    config,
    'website_pages',
    [
      'path',
      'meta_title',
      'meta_description',
      'og_image_override.id',
      'og_image_override.description',
      'og_image_override.width',
      'og_image_override.height',
      'og_image_override.type',
      'noindex',
      'og_title',
      'og_description',
      'nav_label',
      'page_type',
      'primary_focus_keyword',
      'focus_keywords',
    ],
    {
      client: { slug: { _eq: config.clientSlug } },
      status: { _eq: 'published' },
    },
    { sort: ['path'], limit: 500 },
  );

  const seen = new Set<string>();
  return items.map((item) => {
    const path = normalizeWebsitePath(requiredString(item.path, 'website_pages', 'path'));
    if (seen.has(path)) {
      throw new Error(`[directus-site] Duplicate website_pages path "${path}".`);
    }
    seen.add(path);
    const noindex = readBoolean(item.noindex, false);
    const focusKeywordMetadata = noindex
      ? { primaryFocusKeyword: null, focusKeywords: [] }
      : readFocusKeywords(
          item.primary_focus_keyword,
          item.focus_keywords,
          'website_pages',
          path,
        );

    return {
      path,
      metaTitle: noindex
        ? readString(item.meta_title)
        : requiredString(item.meta_title, 'website_pages', 'meta_title'),
      metaDescription: noindex
        ? readString(item.meta_description)
        : requiredString(item.meta_description, 'website_pages', 'meta_description'),
      ogImageOverride: mapAsset(
        item.og_image_override ?? null,
        config,
        'website_pages',
        'og_image_override',
      ),
      noindex,
      ogTitle: readString(item.og_title),
      ogDescription: readString(item.og_description),
      navLabel: readString(item.nav_label),
      pageType: requiredString(item.page_type, 'website_pages', 'page_type'),
      ...focusKeywordMetadata,
    };
  });
});

export async function getWebsitePage(path: string): Promise<WebsitePage | null> {
  const normalized = normalizeWebsitePath(path);
  const pages = await getWebsitePages();
  return pages.find((page) => page.path === normalized) ?? null;
}

export const getServices = cache(async (): Promise<ServiceSummary[]> => {
  return deployedLocations().siteShell.services;
});

export const getHeaderNavigation = cache(async (): Promise<NavItem[]> => {
  return deployedLocations().navigation;
});

export const getSiteBundle = cache(async (): Promise<SiteBundle> => {
  // Keep these reads sequential so a build does not burst the Directus API.
  const settings = await getSiteSettings();
  const pages = await getWebsitePages();
  const services = await getServices();
  const navigation = await getHeaderNavigation();
  return { settings, pages, services, navigation };
});

export type WebsitePageMetadataInput = BasicMetadataInput & {
  path: string;
  includeCanonical?: boolean;
};

function assetToOgImage(asset: DirectusAsset): OgImageInput {
  return {
    url: asset.url,
    width: asset.width ?? undefined,
    height: asset.height ?? undefined,
    alt: asset.description,
  };
}

export async function getWebsitePageMetadata({
  includeCanonical = true,
  ...fallback
}: WebsitePageMetadataInput): Promise<Metadata> {
  const page = await getWebsitePage(fallback.path);
  if (!page) {
    const metadata = buildBasicMetadata(fallback);
    if (!includeCanonical) delete metadata.alternates;
    return metadata;
  }

  const settings = await getSiteSettings();
  const image = page.ogImageOverride
    ? assetToOgImage(page.ogImageOverride)
    : settings
      ? assetToOgImage(settings.defaultOgImage)
      : fallback.image;
  const robots = page.noindex
    ? {
        ...(fallback.robots && typeof fallback.robots === 'object' ? fallback.robots : {}),
        index: false,
      }
    : fallback.robots;
  const title = page.metaTitle ?? fallback.title;
  const description = page.metaDescription ?? fallback.description;
  const metadata = buildBasicMetadata({
    ...fallback,
    title,
    description,
    path: page.path,
    image,
    robots,
    keywords: page.focusKeywords,
  });

  if (!includeCanonical) delete metadata.alternates;

  const socialTitle = page.ogTitle ?? title;
  const socialDescription = page.ogDescription ?? description;
  if (metadata.openGraph && typeof metadata.openGraph === 'object') {
    metadata.openGraph.title = socialTitle;
    metadata.openGraph.description = socialDescription;
  }
  if (metadata.twitter && typeof metadata.twitter === 'object') {
    metadata.twitter.title = socialTitle;
    metadata.twitter.description = socialDescription;
  }

  return metadata;
}

export type ServiceMetadataInput = BasicMetadataInput & {
  slug: string;
  includeCanonical?: boolean;
};

export async function getServiceMetadata({
  slug,
  includeCanonical = true,
  ...fallback
}: ServiceMetadataInput): Promise<Metadata> {
  const service = (await getServices()).find((entry) => entry.slug === slug);
  if (!service) {
    const metadata = buildBasicMetadata(fallback);
    if (!includeCanonical) delete metadata.alternates;
    return metadata;
  }

  const settings = await getSiteSettings();
  const image = service.ogImageOverride
    ? assetToOgImage(service.ogImageOverride)
    : settings
      ? assetToOgImage(settings.defaultOgImage)
      : fallback.image;
  const robots = service.noindex
    ? {
        ...(fallback.robots && typeof fallback.robots === 'object' ? fallback.robots : {}),
        index: false,
      }
    : fallback.robots;
  const title = service.metaTitle ?? fallback.title;
  const description = service.metaDescription ?? fallback.description;
  const metadata = buildBasicMetadata({
    ...fallback,
    title,
    description,
    path: service.href,
    image,
    robots,
    keywords: service.focusKeywords,
  });

  if (!includeCanonical) delete metadata.alternates;

  const socialTitle = service.ogTitle ?? title;
  const socialDescription = service.ogDescription ?? description;
  if (metadata.openGraph && typeof metadata.openGraph === 'object') {
    metadata.openGraph.title = socialTitle;
    metadata.openGraph.description = socialDescription;
  }
  if (metadata.twitter && typeof metadata.twitter === 'object') {
    metadata.twitter.title = socialTitle;
    metadata.twitter.description = socialDescription;
  }

  return metadata;
}
