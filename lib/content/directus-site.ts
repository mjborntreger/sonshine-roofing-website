import 'server-only';
import { deployedEditorial } from './editorial';

import type { Metadata } from 'next';
import { cache } from 'react';
import { deployedLocations } from './locations';
import type { NavItem } from '@/lib/routes';
import { buildBasicMetadata, type BasicMetadataInput, type OgImageInput } from '@/lib/seo/meta';
import {
  normalizeWebsitePath,
} from './site-path';
export { normalizeWebsitePath } from './site-path';

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

export const getSiteSettings = cache(async (): Promise<SiteSettings | null> => {
  return deployedLocations().siteShell.settings;
});

export const getWebsitePages = cache(async (): Promise<WebsitePage[]> => deployedEditorial().websitePages);

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
