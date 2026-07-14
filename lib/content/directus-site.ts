import 'server-only';

import type { Metadata } from 'next';
import { cache } from 'react';
import type { NavItem } from '@/lib/routes';
import { buildBasicMetadata, type BasicMetadataInput, type OgImageInput } from '@/lib/seo/meta';

const DIRECTUS_REVALIDATE_SECONDS = 3600;

type UnknownRecord = Record<string, unknown>;

type DirectusConfig = {
  url: string;
  clientSlug: string;
  token: string;
};

type DirectusListResponse<T> = {
  data?: T[];
  errors?: Array<{ message?: string }>;
};

type DirectusFileValue =
  | string
  | {
      id?: unknown;
      description?: unknown;
      width?: unknown;
      height?: unknown;
      type?: unknown;
    }
  | null;

type DirectusSiteSettingsItem = {
  brand_name?: unknown;
  brand_legal_name?: unknown;
  brand_slogan?: unknown;
  brand_description?: unknown;
  phone?: unknown;
  email?: unknown;
  site_url?: unknown;
  logo?: DirectusFileValue;
  logo_inverted?: DirectusFileValue;
  favicon?: DirectusFileValue;
  default_og_image?: DirectusFileValue;
  address_street?: unknown;
  address_city?: unknown;
  address_region?: unknown;
  address_postal_code?: unknown;
  address_country?: unknown;
  facebook?: unknown;
  instagram?: unknown;
  youtube?: unknown;
  schema_type?: unknown;
  price_range?: unknown;
  opening_hours?: unknown;
  footer_include_legal?: unknown;
  footer_include_socials?: unknown;
  footer_include_services?: unknown;
  enable_site_analytics?: unknown;
};

type DirectusWebsitePageItem = {
  path?: unknown;
  title?: unknown;
  description?: unknown;
  image?: DirectusFileValue;
  noindex?: unknown;
  og_title?: unknown;
  og_description?: unknown;
  canonical_path?: unknown;
  nav_label?: unknown;
  include_in_sitemap?: unknown;
  sitemap_priority?: unknown;
  sitemap_changefreq?: unknown;
  page_type?: unknown;
};

type DirectusServiceItem = {
  slug?: unknown;
  nav_label?: unknown;
  intro?: unknown;
  lucide_icon?: unknown;
  sort_order?: unknown;
};

type DirectusNavigationItem = {
  id?: unknown;
  parent?: { id?: unknown } | string | null;
  label?: unknown;
  link_type?: unknown;
  page?: { path?: unknown } | string | null;
  url?: unknown;
  anchor?: unknown;
  sort?: unknown;
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
  };
  schemaType: string;
  priceRange: string;
  openingHours: string[];
  footerIncludeLegal: boolean;
  footerIncludeSocials: boolean;
  footerIncludeServices: boolean;
  enableSiteAnalytics: boolean;
};

export type WebsitePage = {
  path: string;
  title: string;
  description: string;
  image: DirectusAsset | null;
  noindex: boolean;
  ogTitle: string | null;
  ogDescription: string | null;
  canonicalPath: string | null;
  navLabel: string | null;
  includeInSitemap: boolean;
  sitemapPriority: number | null;
  sitemapChangefreq: string | null;
  pageType: string;
};

export type ServiceSummary = {
  slug: string;
  href: string;
  navLabel: string;
  intro: string;
  lucideIcon: string;
  sortOrder: number;
};

export type SiteBundle = {
  settings: SiteSettings | null;
  pages: WebsitePage[];
  services: ServiceSummary[];
  navigation: NavItem[];
};

let warnedForMissingConfig = false;

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function requiredString(value: unknown, collection: string, field: string): string {
  const parsed = readString(value);
  if (!parsed) {
    throw new Error(`[directus-site] ${collection}.${field} is required.`);
  }
  return parsed;
}

function readBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }
  return fallback;
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function normalizeWebsitePath(value: string): string {
  const withoutQuery = value.split(/[?#]/, 1)[0] || '/';
  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, '') : '/';
}

function getDirectusConfig(): DirectusConfig | null {
  const url = readString(process.env.DIRECTUS_URL);
  const clientSlug = readString(process.env.DIRECTUS_CLIENT_SLUG);
  const token = readString(process.env.DIRECTUS_TOKEN);

  if (!url || !clientSlug || !token) {
    if (!warnedForMissingConfig && process.env.NODE_ENV === 'production') {
      console.error(
        '[directus-site] Missing DIRECTUS_URL, DIRECTUS_CLIENT_SLUG, or DIRECTUS_TOKEN.',
      );
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
    next: {
      revalidate: DIRECTUS_REVALIDATE_SECONDS,
      tags: [`directus:${collection}:${config.clientSlug}`],
    },
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

  return json.data ?? [];
}

function getAssetUrl(config: DirectusConfig, id: string): string {
  return `${config.url}/assets/${encodeURIComponent(id)}`;
}

function mapAsset(
  value: DirectusFileValue,
  config: DirectusConfig,
  collection: string,
  field: string,
  required = false,
): DirectusAsset | null {
  if (!value) {
    if (required) throw new Error(`[directus-site] ${collection}.${field} is required.`);
    return null;
  }

  if (typeof value === 'string') {
    throw new Error(
      `[directus-site] ${collection}.${field} must include directus_files.description.`,
    );
  }

  const id = requiredString(value.id, collection, `${field}.id`);
  const description = requiredString(value.description, collection, `${field}.description`);

  return {
    id,
    url: getAssetUrl(config, id),
    description,
    width: readNumber(value.width),
    height: readNumber(value.height),
    type: readString(value.type),
  };
}

function phoneHref(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `tel:+${digits}`;
  return `tel:${value.replace(/\s+/g, '')}`;
}

function mapOpeningHours(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) =>
      entry && typeof entry === 'object'
        ? readString((entry as UnknownRecord).opening_hours)
        : null,
    )
    .filter((entry): entry is string => Boolean(entry));
}

export const getSiteSettings = cache(async (): Promise<SiteSettings | null> => {
  const config = getDirectusConfig();
  if (!config) return null;

  const items = await fetchCollection<DirectusSiteSettingsItem>(
    config,
    'site_settings',
    [
      'brand_name',
      'brand_legal_name',
      'brand_slogan',
      'brand_description',
      'phone',
      'email',
      'site_url',
      'logo.id',
      'logo.description',
      'logo.width',
      'logo.height',
      'logo.type',
      'logo_inverted.id',
      'logo_inverted.description',
      'logo_inverted.width',
      'logo_inverted.height',
      'logo_inverted.type',
      'favicon.id',
      'favicon.description',
      'favicon.width',
      'favicon.height',
      'favicon.type',
      'default_og_image.id',
      'default_og_image.description',
      'default_og_image.width',
      'default_og_image.height',
      'default_og_image.type',
      'address_street',
      'address_city',
      'address_region',
      'address_postal_code',
      'address_country',
      'facebook',
      'instagram',
      'youtube',
      'schema_type',
      'price_range',
      'opening_hours',
      'footer_include_legal',
      'footer_include_socials',
      'footer_include_services',
      'enable_site_analytics',
    ],
    { client: { slug: { _eq: config.clientSlug } } },
    { limit: 2 },
  );

  if (items.length !== 1) {
    throw new Error(
      `[directus-site] Expected exactly one site_settings record for "${config.clientSlug}"; found ${items.length}.`,
    );
  }

  const item = items[0];
  const phone = requiredString(item.phone, 'site_settings', 'phone');

  return {
    brandName: requiredString(item.brand_name, 'site_settings', 'brand_name'),
    brandLegalName: requiredString(item.brand_legal_name, 'site_settings', 'brand_legal_name'),
    brandSlogan: requiredString(item.brand_slogan, 'site_settings', 'brand_slogan'),
    brandDescription: requiredString(item.brand_description, 'site_settings', 'brand_description'),
    phone,
    phoneHref: phoneHref(phone),
    email: requiredString(item.email, 'site_settings', 'email'),
    siteUrl: trimTrailingSlash(requiredString(item.site_url, 'site_settings', 'site_url')),
    logo: mapAsset(item.logo ?? null, config, 'site_settings', 'logo', true)!,
    logoInverted: mapAsset(
      item.logo_inverted ?? null,
      config,
      'site_settings',
      'logo_inverted',
      true,
    )!,
    favicon: mapAsset(item.favicon ?? null, config, 'site_settings', 'favicon', true)!,
    defaultOgImage: mapAsset(
      item.default_og_image ?? null,
      config,
      'site_settings',
      'default_og_image',
      true,
    )!,
    address: {
      street: requiredString(item.address_street, 'site_settings', 'address_street'),
      city: requiredString(item.address_city, 'site_settings', 'address_city'),
      region: requiredString(item.address_region, 'site_settings', 'address_region'),
      postalCode: requiredString(item.address_postal_code, 'site_settings', 'address_postal_code'),
      country: requiredString(item.address_country, 'site_settings', 'address_country'),
    },
    socials: {
      facebook: readString(item.facebook),
      instagram: readString(item.instagram),
      youtube: readString(item.youtube),
    },
    schemaType: requiredString(item.schema_type, 'site_settings', 'schema_type'),
    priceRange: requiredString(item.price_range, 'site_settings', 'price_range'),
    openingHours: mapOpeningHours(item.opening_hours),
    footerIncludeLegal: readBoolean(item.footer_include_legal, true),
    footerIncludeSocials: readBoolean(item.footer_include_socials, true),
    footerIncludeServices: readBoolean(item.footer_include_services, true),
    enableSiteAnalytics: readBoolean(item.enable_site_analytics, false),
  };
});

export const getWebsitePages = cache(async (): Promise<WebsitePage[]> => {
  const config = getDirectusConfig();
  if (!config) return [];

  const items = await fetchCollection<DirectusWebsitePageItem>(
    config,
    'website_pages',
    [
      'path',
      'title',
      'description',
      'image.id',
      'image.description',
      'image.width',
      'image.height',
      'image.type',
      'noindex',
      'og_title',
      'og_description',
      'canonical_path',
      'nav_label',
      'include_in_sitemap',
      'sitemap_priority',
      'sitemap_changefreq',
      'page_type',
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

    return {
      path,
      title: requiredString(item.title, 'website_pages', 'title'),
      description: requiredString(item.description, 'website_pages', 'description'),
      image: mapAsset(item.image ?? null, config, 'website_pages', 'image'),
      noindex: readBoolean(item.noindex, false),
      ogTitle: readString(item.og_title),
      ogDescription: readString(item.og_description),
      canonicalPath: readString(item.canonical_path),
      navLabel: readString(item.nav_label),
      includeInSitemap: readBoolean(item.include_in_sitemap, true),
      sitemapPriority: readNumber(item.sitemap_priority),
      sitemapChangefreq: readString(item.sitemap_changefreq),
      pageType: requiredString(item.page_type, 'website_pages', 'page_type'),
    };
  });
});

export async function getWebsitePage(path: string): Promise<WebsitePage | null> {
  const normalized = normalizeWebsitePath(path);
  const pages = await getWebsitePages();
  return pages.find((page) => page.path === normalized) ?? null;
}

export const getServices = cache(async (): Promise<ServiceSummary[]> => {
  const config = getDirectusConfig();
  if (!config) return [];

  const items = await fetchCollection<DirectusServiceItem>(
    config,
    'services',
    ['slug', 'nav_label', 'intro', 'lucide_icon', 'sort_order'],
    {
      client: { slug: { _eq: config.clientSlug } },
      status: { _eq: 'published' },
    },
    { sort: ['sort_order', 'slug'], limit: 100 },
  );

  return items.map((item) => {
    const slug = requiredString(item.slug, 'services', 'slug');
    return {
      slug,
      href: `/${slug}`,
      navLabel: requiredString(item.nav_label, 'services', 'nav_label'),
      intro: requiredString(item.intro, 'services', 'intro'),
      lucideIcon: requiredString(item.lucide_icon, 'services', 'lucide_icon'),
      sortOrder: readNumber(item.sort_order) ?? 0,
    };
  });
});

function navigationHref(item: DirectusNavigationItem): string | undefined {
  const linkType = readString(item.link_type);
  if (linkType === 'page' && item.page && typeof item.page === 'object') {
    const path = readString(item.page.path);
    return path ? normalizeWebsitePath(path) : undefined;
  }
  if (linkType === 'external_url') return readString(item.url) ?? undefined;
  if (linkType === 'anchor') return readString(item.anchor) ?? undefined;
  return undefined;
}

export const getHeaderNavigation = cache(async (): Promise<NavItem[]> => {
  const config = getDirectusConfig();
  if (!config) return [];

  const items = await fetchCollection<DirectusNavigationItem>(
    config,
    'navigation_items',
    ['id', 'parent.id', 'label', 'link_type', 'page.path', 'url', 'anchor', 'sort'],
    {
      menu: {
        client: { slug: { _eq: config.clientSlug } },
        key: { _eq: 'header' },
        status: { _eq: 'published' },
      },
      status: { _eq: 'published' },
    },
    { sort: ['sort', 'label'], limit: 100 },
  );

  const nodes = items.map((item) => ({
    id: requiredString(item.id, 'navigation_items', 'id'),
    parentId:
      item.parent && typeof item.parent === 'object'
        ? readString(item.parent.id)
        : readString(item.parent),
    label: requiredString(item.label, 'navigation_items', 'label'),
    href: navigationHref(item),
    sort: readNumber(item.sort) ?? 0,
  }));

  return nodes
    .filter((node) => !node.parentId)
    .sort((left, right) => left.sort - right.sort)
    .map((node) => {
      const children = nodes
        .filter((candidate) => candidate.parentId === node.id)
        .sort((left, right) => left.sort - right.sort)
        .map((child) => ({ label: child.label, href: child.href }));

      return {
        label: node.label,
        ...(node.href && node.href !== '#' ? { href: node.href } : {}),
        ...(children.length ? { children } : {}),
      };
    });
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
  const image = page.image
    ? assetToOgImage(page.image)
    : settings
      ? assetToOgImage(settings.defaultOgImage)
      : fallback.image;
  const robots = page.noindex
    ? {
        ...(fallback.robots && typeof fallback.robots === 'object' ? fallback.robots : {}),
        index: false,
      }
    : fallback.robots;
  const metadata = buildBasicMetadata({
    ...fallback,
    title: page.title,
    description: page.description,
    path: page.canonicalPath ?? page.path,
    image,
    robots,
  });

  if (!includeCanonical) delete metadata.alternates;

  const socialTitle = page.ogTitle ?? page.title;
  const socialDescription = page.ogDescription ?? page.description;
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
