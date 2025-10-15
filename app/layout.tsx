import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/global-nav/header/Header";
import Footer from "@/components/global-nav/footer/Footer";
import AnalyticsScripts from "@/lib/telemetry/analytics";
import { inter, allura, candara } from "@/lib/ui/fonts";
import { Suspense } from "react";
import GtmRouteChange from "@/lib/telemetry/gtm-route-change";
import ChatConsentGate from "@/components/lead-capture/tawk-chatbot/ChatConsentGate";
import { SITE_ORIGIN } from "@/lib/seo/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  openGraph: {
    type: "website",
    siteName: "SonShine Roofing",
    title: "SonShine Roofing – Expert Roofer in Sarasota, Manatee & Charlotte",
    description: "SonShine Roofing is Sarasota's trusted expert roofing contractor with 38+ years of experience in roof repair, replacement, and maintenance. Call us today!",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "SonShine Roofing" }],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@ssroofinginc",
  },
  alternates: { canonical: "./" },
  title: "SonShine Roofing – Expert Roofer in Sarasota, Manatee & Charlotte",
  description:
    "SonShine Roofing is Sarasota's trusted expert roofing contractor with 38+ years of experience in roof repair, replacement, and maintenance. Call us today!",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#0045d7" }],
};

// ——— Global JSON-LD (EDIT HERE) ———
const BASE_URL = SITE_ORIGIN;
const PHONE_E164 = '+1-941-866-4320';
const LOGO_URL_512 = 'https://sonshineroofing.com/wp-content/uploads/cropped-GBP-logo.png'; // 512×512
// Aggregate rating (editable constants)
const AGG_RATING_VALUE = 4.8;
const AGG_RATING_COUNT = 202;

function getGlobalSchema() {
  const providerId = `${BASE_URL}/#roofingcontractor`;

  const roofingContractor = {
    '@type': 'RoofingContractor',
    '@id': providerId,
    name: 'SonShine Roofing',
    url: `${BASE_URL}/`,
    logo: { '@type': 'ImageObject', url: LOGO_URL_512, width: 512, height: 512 },
    foundingDate: '1987',
    priceRange: '$$',
    currenciesAccepted: 'USD',
    paymentAccepted: ['Cash', 'Check', 'Credit Card', 'Debit Card', 'Financing', 'Insurance'],
    telephone: PHONE_E164,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        telephone: PHONE_E164,
        availableLanguage: ['en'],
        areaServed: [
          { '@type': 'AdministrativeArea', name: 'Sarasota County, FL' },
          { '@type': 'AdministrativeArea', name: 'Manatee County, FL' },
          { '@type': 'AdministrativeArea', name: 'Charlotte County, FL' }
        ],
        hoursAvailable: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '07:00',
          closes: '17:30',
        },
      },
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        telephone: PHONE_E164,
        availableLanguage: ['en'],
        areaServed: [
          { '@type': 'AdministrativeArea', name: 'Sarasota County, FL' },
          { '@type': 'AdministrativeArea', name: 'Manatee County, FL' },
          { '@type': 'AdministrativeArea', name: 'Charlotte County, FL' }
        ],
        hoursAvailable: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '07:00',
          closes: '17:30',
        },
      }
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '2555 Porter Lake Dr STE 109',
      addressLocality: 'Sarasota',
      addressRegion: 'FL',
      postalCode: '34240',
      addressCountry: 'US',
    },
    geo: { '@type': 'GeoCoordinates', latitude: 27.310763334560175, longitude: -82.44696100279685 },
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '07:00', closes: '17:30' }
    ],
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
      { '@type': 'Place', name: 'Nokomis' }
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: AGG_RATING_VALUE,
      bestRating: '5',
      worstRating: '1',
      ratingCount: AGG_RATING_COUNT,
    },
    makesOffer: [
      { '@type': 'Offer', itemOffered: { '@id': `${BASE_URL}/#roof-replacement` } },
      { '@type': 'Offer', itemOffered: { '@id': `${BASE_URL}/#roof-repair` } },
      { '@type': 'Offer', itemOffered: { '@id': `${BASE_URL}/#roof-maintenance` } },
      { '@type': 'Offer', itemOffered: { '@id': `${BASE_URL}/#roof-checkup` } },
      { '@type': 'Offer', itemOffered: { '@id': `${BASE_URL}/#roof-care-club` } },
    ],
    sameAs: [
      'https://www.facebook.com/sonshineroofing',
      'https://x.com/SSRoofingInc',
      'https://www.youtube.com/@sonshineroofing',
      'https://www.pinterest.com/sonshine-roofing/',
      'https://www.instagram.com/sonshineroofing/',
      'https://nextdoor.com/pages/sonshine-roofing-sarasota-fl/',
      'https://www.yelp.com/biz/sonshine-roofing-sarasota/',
      'https://www.floridaroof.com/SONSHINE-ROOFING-INC-10-1104.html',
      'https://www.bbb.org/us/fl/sarasota/profile/roofing-contractors/sonshine-roofing-0653-6096353',
      'https://www.angi.com/companylist/us/fl/sarasota/sonshine-roofing-reviews-7970755.htm',
      'https://www.guildquality.com/pro/sonshine-roofing',
      'https://www.gaf.com/en-us/roofing-contractors/residential/usa/fl/sarasota/sonshine-roofing-inc-1104247',
      'https://business.sarasotachamber.com/active-member-directory/Details/sonshine-roofing-3821919',
      'https://business.manateechamber.com/list/member/sonshine-roofing-37287',
      'https://www.northportareachamber.com/list/member/sonshine-roofing-4041',
      'https://www.chamberofcommerce.com/business-directory/florida/sarasota/roofing-contractor/2028411929-sonshine-roofing',
      'https://www.houzz.com/pro/sonshine-roofing/sonshine-roofing',
      'https://www.showmelocal.com/profile.aspx?bid=23924289',
      'https://www.hotfrog.com/company/e1e370a496bfe1cf0deb0af1da069b6b/sonshine-roofing/sarasota/roofs-ceilings',
      'https://www.alignable.com/fruitville-fl/sonshine-roofing-2',
      'https://www.brownbook.net/business/54112480/sonshine-roofing/',
      'https://www.tupalo.co/sarasota-florida/sonshine-roofing',
      'https://www.trustpilot.com/review/sonshineroofing.com',
      'https://www.google.com/maps/place/?q=place_id:ChIJIyB9mBBHw4gRWOl1sU9ZGFM',
      'https://www.linkedin.com/company/sonshineroofing/'
    ],
  } as const;

  const services = [
    { id: 'roof-replacement', name: 'Roof Replacement', type: 'Residential Roof Replacement', url: `${BASE_URL}/roof-replacement-sarasota-fl/` },
    { id: 'roof-repair', name: 'Roof Repair', type: 'Residential Roof Repair', url: `${BASE_URL}/roof-repair/` },
    { id: 'roof-maintenance', name: 'Roof Maintenance', type: 'Ongoing Roof Maintenance', url: `${BASE_URL}/roof-maintenance/` },
    { id: 'roof-checkup', name: 'Tip Top Roof Checkup', type: 'Detailed Roof Inspection', url: `${BASE_URL}/roof-inspection/` },
    { id: 'roof-care-club', name: 'Roof Care Club', type: 'Membership Maintenance Plan', url: `${BASE_URL}/roof-maintenance/` },
  ].map((s) => ({
    '@type': 'Service',
    '@id': `${BASE_URL}/#${s.id}`,
    name: s.name,
    serviceType: s.type,
    url: s.url,
    provider: { '@id': providerId },
  }));

  return {
    '@context': 'https://schema.org',
    '@graph': [roofingContractor, ...services],
  } as const;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${allura.variable} ${candara.variable}`}
    >
      <head>
        {/* Preconnects for faster YouTube thumbs & embeds */}
        <link rel="preconnect" href="https://i.ytimg.com" crossOrigin="" />
        <link rel="preconnect" href="https://www.youtube-nocookie.com" crossOrigin="" />

        {/* Facebook Share Button Attribution */}
        <meta property="fb:app_id" content="1087269253041713" />

        {/* Google Site Verification */}
        <meta name="google-site-verification" content="HHGHDsk0P2Er4L1Eqvt7NEY2cTVzyN5AFU7-6GM2RvI" />
        <meta name="google-site-verification" content="H4_BoeJKqYS63iOodQ_piibvjFV9ofOcA_PYyFYTERc" />

      </head>
      <body
        id="page-top"
        className="
          min-h-svh flex flex-col
          bg-neutral-100 text-slate-900 antialiased
          selection:bg-[#0045d7] selection:text-white
        "
      >
        <AnalyticsScripts />
        <Suspense fallback={null}>
          <GtmRouteChange />
        </Suspense>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        {/* Global JSON-LD (RoofingContractor + Services) */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getGlobalSchema()) }}
        />
        <ChatConsentGate />
      </body>
    </html>
  );
}
