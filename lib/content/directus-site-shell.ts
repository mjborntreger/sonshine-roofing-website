import { directusBuildConfig, readDirectusCollection } from './directus-projects.mjs';
import type { DirectusAsset, SiteSettings, SiteSettingsLink, FooterBadge, ServiceSummary } from './directus-site';

type UnknownRecord = Record<string, unknown>;

export type DirectusConfig = {
  url: string;
  clientSlug: string;
  token: string;
};

export type DirectusFileValue =
  | string
  | {
      id?: unknown;
      description?: unknown;
      width?: unknown;
      height?: unknown;
      type?: unknown;
    }
  | null;

export type DirectusSiteSettingsItem = {
  id?: unknown;
  client?: { slug?: unknown } | null;
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
  hero_image?: DirectusFileValue;
  hero_video?: DirectusFileValue;
  address_street?: unknown;
  address_city?: unknown;
  address_region?: unknown;
  address_postal_code?: unknown;
  address_country?: unknown;
  facebook?: unknown;
  instagram?: unknown;
  youtube?: unknown;
  nextdoor?: unknown;
  yelp?: unknown;
  pinterest?: unknown;
  x_twitter?: unknown;
  google_business_profile?: unknown;
  schema_type?: unknown;
  price_range?: unknown;
  opening_hours?: unknown;
  robots_disallow?: unknown;
  content_security_policy?: unknown;
  footer_include_legal?: unknown;
  footer_include_socials?: unknown;
  footer_include_services?: unknown;
  enable_site_analytics?: unknown;
  public_location?: unknown;
  founding_date?: unknown;
  license_number?: unknown;
  license_url?: unknown;
  payment_methods?: unknown;
  languages_served?: unknown;
  timezone?: unknown;
  brands_used?: unknown;
  discounts?: unknown;
  services?: unknown;
  associations?: unknown;
  llms_txt?: unknown;
  badges?: Array<{
    footer_badges_id?: {
      client?: { slug?: unknown } | null;
      id?: unknown;
      badge?: DirectusFileValue;
      href?: unknown;
      sort_order?: unknown;
    } | null;
  }> | null;
};

export type DirectusServiceItem = {
  id?: unknown;
  status?: unknown;
  client?: { slug?: unknown } | null;
  slug?: unknown;
  nav_label?: unknown;
  intro?: unknown;
  lucide_icon?: unknown;
  sort_order?: unknown;
  noindex?: unknown;
  meta_title?: unknown;
  meta_description?: unknown;
  primary_focus_keyword?: unknown;
  focus_keywords?: unknown;
  og_title?: unknown;
  og_description?: unknown;
  og_image_override?: DirectusFileValue;
};

export function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function requiredString(value: unknown, collection: string, field: string): string {
  const parsed = readString(value);
  if (!parsed) {
    throw new Error(`[directus-site] ${collection}.${field} is required.`);
  }
  return parsed;
}

export function readBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }
  return fallback;
}

export function readFocusKeywords(
  primaryValue: unknown,
  keywordValue: unknown,
  collection: string,
  path: string,
): { primaryFocusKeyword: string | null; focusKeywords: string[] } {
  if (keywordValue !== null && keywordValue !== undefined && !Array.isArray(keywordValue)) {
    throw new Error(
      `[DIRECTUS_FOCUS_KEYWORDS_INVALID] ${collection}.focus_keywords for route "${path}" must be a JSON array of non-empty strings.`,
    );
  }

  const focusKeywords: string[] = [];
  const normalizedKeywords = new Set<string>();

  for (const item of Array.isArray(keywordValue) ? keywordValue : []) {
    const keyword = readString(item);
    if (!keyword) {
      throw new Error(
        `[DIRECTUS_FOCUS_KEYWORDS_INVALID] ${collection}.focus_keywords for route "${path}" must contain only non-empty strings.`,
      );
    }

    const normalizedKeyword = keyword.toLocaleLowerCase('en-US');
    if (!normalizedKeywords.has(normalizedKeyword)) {
      normalizedKeywords.add(normalizedKeyword);
      focusKeywords.push(keyword);
    }
  }

  const primaryFocusKeyword = readString(primaryValue);
  if (!primaryFocusKeyword) {
    return { primaryFocusKeyword: null, focusKeywords };
  }

  const normalizedPrimary = primaryFocusKeyword.toLocaleLowerCase('en-US');
  const matchedPrimary = focusKeywords.find(
    (keyword) => keyword.toLocaleLowerCase('en-US') === normalizedPrimary,
  );

  if (!matchedPrimary) {
    throw new Error(
      `[DIRECTUS_PRIMARY_FOCUS_KEYWORD_MISMATCH] ${collection} record for route "${path}" has primary focus keyword "${primaryFocusKeyword}", but that phrase is missing from focus_keywords. Add the exact phrase as a Focus Keywords tag or clear the primary field.`,
    );
  }

  return {
    primaryFocusKeyword: matchedPrimary,
    focusKeywords: [
      matchedPrimary,
      ...focusKeywords.filter(
        (keyword) => keyword.toLocaleLowerCase('en-US') !== normalizedPrimary,
      ),
    ],
  };
}

export function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export { normalizeWebsitePath } from './site-path.ts';

function getAssetUrl(config: DirectusConfig, id: string): string {
  return `${config.url}/assets/${encodeURIComponent(id)}`;
}

export function mapAsset(
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

function mapMediaAsset(
  value: DirectusFileValue,
  config: DirectusConfig,
  field: 'hero_image' | 'hero_video',
  mediaKind: 'image' | 'video',
): DirectusAsset {
  const asset = mapAsset(value, config, 'site_settings', field, true)!;
  if (!asset.type?.startsWith(`${mediaKind}/`)) {
    throw new Error(`[directus-site] site_settings.${field} must reference a ${mediaKind} file.`);
  }
  return asset;
}

function mapShellImage(
  value: DirectusFileValue,
  config: DirectusConfig,
  collection: string,
  field: string,
  required = false,
): DirectusAsset | null {
  const asset = mapAsset(value, config, collection, field, required);
  if (asset && !asset.type?.startsWith('image/')) {
    throw new Error(`[directus-site] ${collection}.${field} must reference an image file.`);
  }
  return asset;
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

function optionalAbsoluteUrl(value: unknown, field: string): string | null {
  const parsed = readString(value);
  if (!parsed) return null;

  let url: URL;
  try {
    url = new URL(parsed);
  } catch {
    throw new Error(`[directus-site] site_settings.${field} must be an absolute http(s) URL.`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`[directus-site] site_settings.${field} must be an absolute http(s) URL.`);
  }

  return url.toString();
}

function requiredAbsoluteUrl(value: unknown, field: string): string {
  return optionalAbsoluteUrl(value, field) ?? requiredString(value, 'site_settings', field);
}

function optionalSiteHref(value: unknown, field: string): string | null {
  const parsed = readString(value);
  if (!parsed) return null;

  if (parsed.startsWith('/') && !parsed.startsWith('//')) return parsed;
  return optionalAbsoluteUrl(parsed, field);
}

function mapStringList(value: unknown, itemField: string, field: string): string[] {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new Error(`[directus-site] site_settings.${field} must be a list.`);
  }

  return value.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`[directus-site] site_settings.${field}[${index}] must be an object.`);
    }
    return requiredString(
      (entry as UnknownRecord)[itemField],
      'site_settings',
      `${field}[${index}].${itemField}`,
    );
  });
}

function mapLinkList(value: unknown, itemField: string, field: string): SiteSettingsLink[] {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new Error(`[directus-site] site_settings.${field} must be a list.`);
  }

  return value.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`[directus-site] site_settings.${field}[${index}] must be an object.`);
    }
    const record = entry as UnknownRecord;
    return {
      label: requiredString(record[itemField], 'site_settings', `${field}[${index}].${itemField}`),
      href: optionalSiteHref(record.href, `${field}[${index}].href`),
    };
  });
}

function mapRobotsDisallow(value: unknown): string[] {
  return mapStringList(value, 'rule', 'robots_disallow').map((rule, index) => {
    if (!rule.startsWith('/')) {
      throw new Error(
        `[directus-site] site_settings.robots_disallow[${index}].rule must start with "/".`,
      );
    }
    return rule;
  });
}

function mapFooterBadges(
  value: DirectusSiteSettingsItem['badges'],
  config: DirectusConfig,
): FooterBadge[] {
  if (value === null) return [];
  if (!Array.isArray(value)) throw new Error('[directus-site] site_settings.badges must be an expanded list.');
  const seen = new Set<string>();

  return value
    .map((entry, index) => {
      const badge = entry.footer_badges_id;
      if (!badge) {
        throw new Error(
          `[directus-site] site_settings.badges[${index}] is missing its badge record.`,
        );
      }
      if (badge.client?.slug !== config.clientSlug) {
        throw new Error('[directus-site] Footer badge escaped client scope.');
      }
      const id = requiredString(badge.id, 'footer_badges', 'id');
      if (seen.has(id)) throw new Error('[directus-site] Duplicate footer badge relationship.');
      seen.add(id);

      return {
        id,
        image: mapShellImage(
          badge.badge ?? null,
          config,
          'footer_badges',
          `badges[${index}].badge`,
          true,
        )!,
        href: optionalAbsoluteUrl(badge.href, `badges[${index}].href`),
        sortOrder: readNumber(badge.sort_order) ?? index + 1,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export const SITE_SETTINGS_FIELDS = [
      'id',
      'client.slug',
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
      'hero_image.id',
      'hero_image.description',
      'hero_image.width',
      'hero_image.height',
      'hero_image.type',
      'hero_video.id',
      'hero_video.description',
      'hero_video.width',
      'hero_video.height',
      'hero_video.type',
      'address_street',
      'address_city',
      'address_region',
      'address_postal_code',
      'address_country',
      'facebook',
      'instagram',
      'youtube',
      'nextdoor',
      'yelp',
      'pinterest',
      'x_twitter',
      'google_business_profile',
      'schema_type',
      'price_range',
      'opening_hours',
      'robots_disallow',
      'content_security_policy',
      'footer_include_legal',
      'footer_include_socials',
      'footer_include_services',
      'enable_site_analytics',
      'public_location',
      'founding_date',
      'license_number',
      'license_url',
      'payment_methods',
      'languages_served',
      'timezone',
      'brands_used',
      'discounts',
      'services',
      'associations',
      'llms_txt',
      'badges.footer_badges_id.id',
      'badges.footer_badges_id.client.slug',
      'badges.footer_badges_id.badge.id',
      'badges.footer_badges_id.badge.description',
      'badges.footer_badges_id.badge.width',
      'badges.footer_badges_id.badge.height',
      'badges.footer_badges_id.badge.type',
      'badges.footer_badges_id.href',
      'badges.footer_badges_id.sort_order',
    ] as const;

export const SERVICE_SUMMARY_FIELDS = [
      'scope_key',
      'id',
      'client.slug',
      'status',
      'slug',
      'nav_label',
      'intro',
      'lucide_icon',
      'sort_order',
      'noindex',
      'meta_title',
      'meta_description',
      'primary_focus_keyword',
      'focus_keywords',
      'og_title',
      'og_description',
      'og_image_override.id',
      'og_image_override.description',
      'og_image_override.width',
      'og_image_override.height',
      'og_image_override.type',
    ] as const;

export function normalizeSiteSettings(item: DirectusSiteSettingsItem, config: DirectusConfig): SiteSettings {
  requiredString(item.id, 'site_settings', 'id');
  if (item.client?.slug !== config.clientSlug) {
    throw new Error('[directus-site] Site settings escaped client scope.');
  }
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
    logo: mapShellImage(item.logo ?? null, config, 'site_settings', 'logo', true)!,
    logoInverted: mapShellImage(
      item.logo_inverted ?? null,
      config,
      'site_settings',
      'logo_inverted',
      true,
    )!,
    favicon: mapShellImage(item.favicon ?? null, config, 'site_settings', 'favicon', true)!,
    defaultOgImage: mapShellImage(
      item.default_og_image ?? null,
      config,
      'site_settings',
      'default_og_image',
      true,
    )!,
    heroImage: mapMediaAsset(item.hero_image ?? null, config, 'hero_image', 'image'),
    heroVideo: mapMediaAsset(item.hero_video ?? null, config, 'hero_video', 'video'),
    address: {
      street: requiredString(item.address_street, 'site_settings', 'address_street'),
      city: requiredString(item.address_city, 'site_settings', 'address_city'),
      region: requiredString(item.address_region, 'site_settings', 'address_region'),
      postalCode: requiredString(item.address_postal_code, 'site_settings', 'address_postal_code'),
      country: requiredString(item.address_country, 'site_settings', 'address_country'),
    },
    socials: {
      facebook: optionalAbsoluteUrl(item.facebook, 'facebook'),
      instagram: optionalAbsoluteUrl(item.instagram, 'instagram'),
      youtube: optionalAbsoluteUrl(item.youtube, 'youtube'),
      nextdoor: optionalAbsoluteUrl(item.nextdoor, 'nextdoor'),
      yelp: optionalAbsoluteUrl(item.yelp, 'yelp'),
      pinterest: optionalAbsoluteUrl(item.pinterest, 'pinterest'),
      xTwitter: optionalAbsoluteUrl(item.x_twitter, 'x_twitter'),
      googleBusinessProfile: optionalAbsoluteUrl(
        item.google_business_profile,
        'google_business_profile',
      ),
    },
    schemaType: requiredString(item.schema_type, 'site_settings', 'schema_type'),
    priceRange: requiredString(item.price_range, 'site_settings', 'price_range'),
    openingHours: mapOpeningHours(item.opening_hours),
    robotsDisallow: mapRobotsDisallow(item.robots_disallow),
    contentSecurityPolicy: requiredString(
      item.content_security_policy,
      'site_settings',
      'content_security_policy',
    ).replace(/\s+/g, ' '),
    footerIncludeLegal: readBoolean(item.footer_include_legal, true),
    footerIncludeSocials: readBoolean(item.footer_include_socials, true),
    footerIncludeServices: readBoolean(item.footer_include_services, true),
    enableSiteAnalytics: readBoolean(item.enable_site_analytics, false),
    publicLocation: readString(item.public_location),
    foundingDate: requiredString(item.founding_date, 'site_settings', 'founding_date'),
    licenseNumber: requiredString(item.license_number, 'site_settings', 'license_number'),
    licenseUrl: requiredAbsoluteUrl(item.license_url, 'license_url'),
    paymentMethods: mapLinkList(item.payment_methods, 'payment_method', 'payment_methods'),
    languagesServed: mapStringList(item.languages_served, 'language', 'languages_served'),
    timezone: requiredString(item.timezone, 'site_settings', 'timezone'),
    brandsUsed: mapLinkList(item.brands_used, 'brand', 'brands_used'),
    discounts: mapLinkList(item.discounts, 'discount', 'discounts'),
    services: mapLinkList(item.services, 'service', 'services'),
    associations: mapLinkList(item.associations, 'association', 'associations'),
    llmsTxt: typeof item.llms_txt === 'string' && item.llms_txt.trim().length ? item.llms_txt : '',
    badges: mapFooterBadges(item.badges, config),
  };
}

export function normalizeServiceSummaries(items: DirectusServiceItem[], config: DirectusConfig): ServiceSummary[] {
  const seen = new Set<string>();
  return items.map((item) => {
    requiredString(item.id, 'services', 'id');
    if (item.client?.slug !== config.clientSlug || item.status !== 'published') {
      throw new Error('[directus-site] Service escaped published client scope.');
    }
    const slug = requiredString(item.slug, 'services', 'slug');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) {
      throw new Error('[directus-site] Service slug is invalid.');
    }
    if (seen.has(slug)) throw new Error('[directus-site] Duplicate service slug.');
    seen.add(slug);
    const href = `/${slug}`;
    const noindex = readBoolean(item.noindex, false);
    const focusKeywordMetadata = noindex
      ? { primaryFocusKeyword: null, focusKeywords: [] }
      : readFocusKeywords(
          item.primary_focus_keyword,
          item.focus_keywords,
          'services',
          href,
        );
    return {
      slug,
      href,
      navLabel: requiredString(item.nav_label, 'services', 'nav_label'),
      intro: requiredString(item.intro, 'services', 'intro'),
      lucideIcon: requiredString(item.lucide_icon, 'services', 'lucide_icon'),
      sortOrder: readNumber(item.sort_order) ?? 0,
      noindex,
      metaTitle: noindex
        ? readString(item.meta_title)
        : requiredString(item.meta_title, 'services', 'meta_title'),
      metaDescription: noindex
        ? readString(item.meta_description)
        : requiredString(item.meta_description, 'services', 'meta_description'),
      ogTitle: readString(item.og_title),
      ogDescription: readString(item.og_description),
      ogImageOverride: mapShellImage(
        item.og_image_override ?? null,
        config,
        'services',
        'og_image_override',
      ),
      ...focusKeywordMetadata,
    };
  }).sort((left, right) => left.sortOrder - right.sortOrder || left.slug.localeCompare(right.slug, 'en-US'));
}

export type DirectusSiteShellSnapshot = { settings: SiteSettings; services: ServiceSummary[] };

/** Fetch the explicit public shell once during prebuild, before writing the deployment snapshot. */
export async function fetchDirectusSiteShellSnapshot(
  env: Record<string, string | undefined> = process.env,
  fetcher: typeof fetch = fetch,
): Promise<DirectusSiteShellSnapshot> {
  const config = directusBuildConfig(env);
  const clientScope = { client: { slug: { _eq: config.clientSlug } } };
  // site_settings and footer_badges have no status field in the verified schema.
  const settings = await readDirectusCollection<DirectusSiteSettingsItem>(
    config, fetcher, 'site_settings', SITE_SETTINGS_FIELDS,
    { filter: clientScope, deep: { badges: { _limit: -1 } } },
  );
  if (settings.length !== 1) {
    throw new Error(`[directus-site] Expected exactly one site_settings record; found ${settings.length}.`);
  }
  const normalizedSettings = normalizeSiteSettings(settings[0], config);
  const services = await readDirectusCollection<DirectusServiceItem>(
    config, fetcher, 'services', SERVICE_SUMMARY_FIELDS,
    { filter: { ...clientScope, status: { _eq: 'published' } } },
  );
  return { settings: normalizedSettings, services: normalizeServiceSummaries(services, config) };
}
