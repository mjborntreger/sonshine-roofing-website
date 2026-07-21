import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import Header from '@/components/global-nav/header/Header';
import Footer from '@/components/global-nav/footer/Footer';
import AnalyticsScripts from '@/lib/telemetry/analytics';
import LeadAttributionCapture from '@/components/lead-capture/LeadAttributionCapture';
import SpecialOfferPopup, {
  type SpecialOfferPopupOffer,
} from '@/components/lead-capture/special-offer/SpecialOfferPopup';
import { getFeaturedSpecialOffer } from '@/lib/content/directus-special-offers';
import { formatSpecialOfferExpiration } from '@/lib/lead-capture/specialOfferDates';
import { SITE_ORIGIN } from '@/lib/seo/site';
import { OFFICE_OPENING_HOURS_SPEC, PHONE_OPENING_HOURS_SPEC } from '@/lib/contact-hours';
import {
  getSiteBundle,
  getSiteSettings,
  getWebsitePage,
  type SiteSettings,
} from '@/lib/content/directus-site';
import { SiteSettingsProvider } from '@/lib/content/site-settings-context';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const homePage = await getWebsitePage('/');
  const title =
    homePage?.metaTitle ?? 'SonShine Roofing – Expert Roofer in Sarasota, Manatee & Charlotte';
  const description =
    homePage?.metaDescription ??
    settings?.brandDescription ??
    "SonShine Roofing is Sarasota's trusted expert roofing contractor with 39+ years of experience in roof repair, replacement, and maintenance. Call us today!";
  const ogImage = homePage?.ogImageOverride ?? settings?.defaultOgImage;
  const favicon = settings?.favicon;

  return {
    metadataBase: new URL(settings?.siteUrl ?? SITE_ORIGIN),
    openGraph: {
      type: 'website',
      siteName: settings?.brandName ?? 'SonShine Roofing',
      title: homePage?.ogTitle ?? title,
      description: homePage?.ogDescription ?? description,
      images: [
        ogImage
          ? {
              url: ogImage.url,
              width: ogImage.width ?? undefined,
              height: ogImage.height ?? undefined,
              alt: ogImage.description,
            }
          : {
              url: 'https://wp.sonshineroofing.com/wp-content/uploads/Open-Graph-Default.png',
              width: 1200,
              height: 630,
              alt: 'SonShine Roofing, Sarasota, FL',
            },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      creator: settings?.socials.xTwitter
        ? `@${new URL(settings.socials.xTwitter).pathname.split('/').filter(Boolean)[0]}`
        : undefined,
    },
    alternates: { canonical: './' },
    title,
    description,
    manifest: '/site.webmanifest',
    icons: {
      icon: [
        ...(favicon
          ? [
              {
                url: favicon.url,
                sizes:
                  favicon.width && favicon.height
                    ? `${favicon.width}x${favicon.height}`
                    : undefined,
                type: favicon.type ?? undefined,
              },
            ]
          : []),
        { url: '/favicon.ico' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
        { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
      shortcut: favicon?.url ?? '/favicon.ico',
    },
  };
}

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#0045d7' }],
};

const BASE_URL = SITE_ORIGIN;
const LOGO_URL_512 = 'https://sonshineroofing.com/wp-content/uploads/cropped-GBP-logo.png'; // 512×512
const AGG_RATING_VALUE = 4.8;
const AGG_RATING_COUNT = 211;

function getGlobalSchema(settings: SiteSettings | null) {
  const baseUrl = settings?.siteUrl ?? BASE_URL;
  const providerId = `${baseUrl}/#roofingcontractor`;
  const configuredSocials = settings
    ? Object.values(settings.socials).filter((url): url is string => Boolean(url))
    : [];
  const configuredAssociations =
    settings?.associations.flatMap((association) => (association.href ? [association.href] : [])) ??
    [];
  const configuredLanguages = settings?.languagesServed.length
    ? settings.languagesServed
    : ['English'];
  const configuredPaymentMethods = settings?.paymentMethods.map((method) => method.label) ?? [];
  const configuredServices = settings?.services ?? [];

  const roofingContractor = {
    '@type': settings?.schemaType ?? 'RoofingContractor',
    '@id': providerId,
    name: settings?.brandName ?? 'SonShine Roofing',
    legalName: settings?.brandLegalName,
    description: settings?.brandDescription,
    email: settings?.email,
    url: `${baseUrl}/`,
    logo: {
      '@type': 'ImageObject',
      url: settings?.logo.url ?? LOGO_URL_512,
      width: settings?.logo.width ?? 512,
      height: settings?.logo.height ?? 512,
    },
    foundingDate: settings?.foundingDate,
    priceRange: settings?.priceRange ?? '$$',
    currenciesAccepted: 'USD',
    paymentAccepted: configuredPaymentMethods,
    telephone: settings?.phoneHref.replace(/^tel:/, ''),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        telephone: settings?.phoneHref.replace(/^tel:/, ''),
        availableLanguage: configuredLanguages,
        areaServed: [
          { '@type': 'AdministrativeArea', name: 'Sarasota County, FL' },
          { '@type': 'AdministrativeArea', name: 'Manatee County, FL' },
          { '@type': 'AdministrativeArea', name: 'Charlotte County, FL' },
        ],
        hoursAvailable: PHONE_OPENING_HOURS_SPEC,
      },
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        telephone: settings?.phoneHref.replace(/^tel:/, ''),
        availableLanguage: configuredLanguages,
        areaServed: [
          { '@type': 'AdministrativeArea', name: 'Sarasota County, FL' },
          { '@type': 'AdministrativeArea', name: 'Manatee County, FL' },
          { '@type': 'AdministrativeArea', name: 'Charlotte County, FL' },
        ],
        hoursAvailable: PHONE_OPENING_HOURS_SPEC,
      },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings?.address.street,
      addressLocality: settings?.address.city,
      addressRegion: settings?.address.region,
      postalCode: settings?.address.postalCode,
      addressCountry: settings?.address.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: 27.310763334560175, longitude: -82.44696100279685 },
    openingHoursSpecification: [OFFICE_OPENING_HOURS_SPEC],
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Sarasota County, FL' },
      { '@type': 'AdministrativeArea', name: 'Manatee County, FL' },
      { '@type': 'AdministrativeArea', name: 'Charlotte County, FL' },
      { '@type': 'Place', name: 'Sarasota' },
      { '@type': 'Place', name: 'Bradenton' },
      { '@type': 'Place', name: 'Venice' },
      { '@type': 'Place', name: 'North Port' },
      { '@type': 'Place', name: 'Port Charlotte' },
      { '@type': 'Place', name: 'Punta Gorda' },
      { '@type': 'Place', name: 'Palmetto' },
      { '@type': 'Place', name: 'Myakka City' },
      { '@type': 'Place', name: 'Osprey' },
      { '@type': 'Place', name: 'Siesta Key' },
      { '@type': 'Place', name: 'Englewood' },
      { '@type': 'Place', name: 'Ellenton' },
      { '@type': 'Place', name: 'Lakewood Ranch' },
      { '@type': 'Place', name: 'Parrish' },
      { '@type': 'Place', name: 'Nokomis' },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: AGG_RATING_VALUE,
      bestRating: '5',
      worstRating: '4',
      ratingCount: AGG_RATING_COUNT,
    },
    makesOffer: configuredServices.map((service, index) => ({
      '@type': 'Offer',
      itemOffered: { '@id': `${baseUrl}/#service-${index + 1}` },
      ...(service.href ? { url: new URL(service.href, `${baseUrl}/`).toString() } : {}),
    })),
    sameAs: Array.from(new Set([...configuredSocials, ...configuredAssociations])),
    hasCredential:
      settings?.licenseNumber && settings.licenseUrl
        ? {
            '@type': 'EducationalOccupationalCredential',
            credentialCategory: "Florida Roofing Contractor's License",
            identifier: settings.licenseNumber,
            url: settings.licenseUrl,
          }
        : undefined,
    brand: settings?.brandsUsed.map((brand) => ({
      '@type': 'Brand',
      name: brand.label,
      ...(brand.href ? { url: brand.href } : {}),
    })),
  } as const;

  const services = configuredServices.map((service, index) => ({
    '@type': 'Service',
    '@id': `${baseUrl}/#service-${index + 1}`,
    name: service.label,
    serviceType: service.label,
    ...(service.href ? { url: new URL(service.href, `${baseUrl}/`).toString() } : {}),
    provider: { '@id': providerId },
  }));

  return {
    '@context': 'https://schema.org',
    '@graph': [roofingContractor, ...services],
  } as const;
}

async function getFeaturedOfferPopup(): Promise<SpecialOfferPopupOffer | null> {
  try {
    const offer = await getFeaturedSpecialOffer();
    if (!offer) return null;

    return {
      slug: offer.slug,
      title: offer.title,
      href: `/special-offers/${offer.slug}`,
      description: offer.description,
      discount: offer.discount,
      expirationLabel: formatSpecialOfferExpiration(offer.expirationDate),
      legalDisclaimer: offer.legalDisclaimer,
      featuredImage: offer.featuredImage
        ? {
            url: offer.featuredImage.url,
            altText: offer.featuredImage.altText,
            width: offer.featuredImage.width,
            height: offer.featuredImage.height,
          }
        : null,
    };
  } catch (error) {
    console.error('[directus] Unable to load featured special offer.', error);
    return null;
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const siteBundle = await getSiteBundle();
  const featuredOfferPopup = await getFeaturedOfferPopup();
  const { settings, services, navigation } = siteBundle;
  const publicSettings = {
    brandName: settings?.brandName ?? 'SonShine Roofing',
    phone: settings?.phone ?? '(941) 866-4320',
    phoneHref: settings?.phoneHref ?? 'tel:+19418664320',
    email: settings?.email ?? 'messages@sonshineroofing.com',
    licenseNumber: settings?.licenseNumber ?? '',
    licenseUrl: settings?.licenseUrl ?? '',
  };

  return (
    <SiteSettingsProvider value={publicSettings}>
      <div
        id="page-top"
        className="
        min-h-svh flex flex-col
        bg-cyan-50 text-slate-900 antialiased
        selection:bg-[#0045d7] selection:text-white
      "
      >
        <AnalyticsScripts enabled={settings?.enableSiteAnalytics ?? false} />
        <Suspense fallback={null}>
          <LeadAttributionCapture />
        </Suspense>
        {featuredOfferPopup ? <SpecialOfferPopup offer={featuredOfferPopup} /> : null}
        <Header
          navigation={navigation}
          brandName={settings?.brandName}
          phoneDisplay={settings?.phone}
          phoneHref={settings?.phoneHref}
          expandedLogoSrc={settings?.logo.url}
          collapsedLogoSrc={settings?.logoInverted.url}
          expandedLogoAlt={settings?.logo.description}
          collapsedLogoAlt={settings?.logoInverted.description}
        />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} services={services} navigation={navigation} />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getGlobalSchema(settings)) }}
        />
      </div>
    </SiteSettingsProvider>
  );
}
