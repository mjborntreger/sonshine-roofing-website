import Section from "@/components/layout/Section";
import { AboutVideo } from "./AboutVideo";
import { listPersons, listPersonsBySlugs } from '@/lib/wp';
import PersonGrid from "./PersonGrid";
import SocialMediaProfiles from "@/components/SocialMediaProfiles";
import { HoursAndInformation } from "./HoursAndInformation";
import { UserRoundSearch, CloudRainWind, ChevronDown, BadgeCheck, ShieldCheck, ExternalLink, ChevronRight } from "lucide-react";
import type { Metadata } from 'next';

// ===== STATIC SEO FOR /about-sonshine-roofing (EDIT HERE) =====
const SEO_TITLE_ABOUT = 'About SonShine Roofing | Sarasota Roofing Company';
const SEO_DESCRIPTION_ABOUT = 'Family-owned roofing contractor in Sarasota serving Sarasota, Manatee, and Charlotte Counties since 1987. Meet the team, our values, and what sets us apart.';
const SEO_KEYWORDS_ABOUT = [
  'about sonshine roofing',
  'sarasota roofing company',
  'roofing contractor',
  'our team',
  'roof repair',
  'roof replacement',
  'roof maintenance',
  'sarasota',
  'manatee county',
  'charlotte county',
];
const SEO_CANONICAL_ABOUT = '/about-sonshine-roofing';
const SEO_OG_IMAGE_DEFAULT = '/og-default.jpg';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: SEO_TITLE_ABOUT,
    description: SEO_DESCRIPTION_ABOUT,
    keywords: SEO_KEYWORDS_ABOUT,
    alternates: { canonical: SEO_CANONICAL_ABOUT },
    openGraph: {
      type: 'website',
      title: SEO_TITLE_ABOUT,
      description: SEO_DESCRIPTION_ABOUT,
      url: SEO_CANONICAL_ABOUT,
      images: [{ url: SEO_OG_IMAGE_DEFAULT, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: SEO_TITLE_ABOUT,
      description: SEO_DESCRIPTION_ABOUT,
      images: [SEO_OG_IMAGE_DEFAULT],
    },
  };
}

const ORDER: string[] = [
  'nathan-borntreger',
  'angela',
  'bob',
  'dean',
  'adam',
  'josh',
  'tony',
  'jb',
  'jeremy-k',
  'tara',
  'robert',
  'matthew',
  'mina',
  'steve',
  'michael',
  'erick',
  'antonio',
  'martinez',
  'jose-sergio',
  'jose'
];

const detailsStyles = "group not-prose rounded-xl border border-slate-400 bg-white mb-4";
const summaryStyles = "flex items-center justify-between cursor-pointer select-none p-4";

export default async function Page() {
  const people = ORDER.length
    ? await listPersonsBySlugs(ORDER)
    : await listPersons(20);

  // JSON-LD: Breadcrumbs + WebPage (About page)
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://sonshineroofing.com';
  const pageUrl = `${base}${SEO_CANONICAL_ABOUT}`;

  const breadcrumbsLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
      { '@type': 'ListItem', position: 2, name: 'About SonShine Roofing', item: pageUrl },
    ],
  } as const;

  const webPageLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: SEO_TITLE_ABOUT,
    description: SEO_DESCRIPTION_ABOUT,
    url: pageUrl,
    primaryImageOfPage: { '@type': 'ImageObject', url: `${base}${SEO_OG_IMAGE_DEFAULT}` },
    isPartOf: { '@type': 'WebSite', name: 'SonShine Roofing', url: base },
  } as const;

  return (
    <>
      <Section>
        <div className="px-2">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">

            {/* About us */}
            <div className="py-4 prose w-full">
              <h1>About SonShine Roofing</h1>

              {/* JSON-LD: Breadcrumbs + WebPage */}
              <script
                type="application/ld+json"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }}
              />
              <script
                type="application/ld+json"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }}
              />

              {/* Credentials pill strip */}
              <div className="not-prose mt-2 mb-4 flex flex-wrap items-center gap-2">
                <a
                  href="https://www.myfloridalicense.com/LicenseDetail.asp?SID=&id=601EB27C16D2369E36FD9B81C20A0755"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View Florida contractor license #CCC1331483 on myfloridalicense.com (opens in a new tab)"
                  className="btn btn-outline btn-sm bg-[#fb9216]/10 inline-flex items-center"
                >
                  <BadgeCheck className="mr-1 inline h-4 w-4 align-[-0.125em] text-[--brand-blue]" aria-hidden="true" />
                  <span>License #CCC1331483</span>
                  <ExternalLink className="ml-1 inline h-3 w-3 align-[-0.125em]" aria-hidden="true" />
                </a>
              </div>

              <details open className={detailsStyles}>
                <summary className={summaryStyles}>
                  <span className="flex items-center gap-2">
                    <UserRoundSearch className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                    <h2 className="m-0 text-lg font-semibold">Who we are</h2>
                  </span>
                  <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="px-4 pb-4">
                  <p>
                    SonShine Roofing is a family-owned roofing company based in Sarasota, Florida,
                    serving Sarasota, Manatee, and Charlotte County residents with 38+ years of experience.
                    We specialize in residential roofing services, including roof repair, roof replacement,
                    inspections, and our Roof Care Club, which is our preventative maintenance program designed
                    for the unique weather conditions of Southwest Florida.
                    <br /><br />
                    We’ve learned that superior customer service and honesty with clients are the only way to
                    stay in business. When you ask us to inspect your roof, we’ll tell you the flat-out truth
                    and give you our best recommendation based on our 38+ years of professional experience.
                    We’d be more than pleased to have you look through our client referrals.
                  </p>
                </div>
              </details>

              <details className={detailsStyles}>
                <summary className={summaryStyles}>
                  <span className="flex items-center gap-2">
                    <CloudRainWind className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                    <h2 className="m-0 text-lg font-semibold">Built for Florida&apos;s Weather</h2>
                  </span>
                  <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="px-4 pb-4">
                  <p className="prose">
                    Unlike storm-chasing contractors, SonShine Roofing is rooted in the Sarasota community.
                    Since we are keenly attuned to unpredictable nature of hurricane season, we focus on
                    quality over quick fixes, offering durable, Florida-ready roofing solutions backed by
                    manufacturer warranties and our own workmanship 30-year Leak Free Guarantee.
                    <br /><br />
                    When you choose SonShine Roofing, you are showing that you value honesty,
                    integrity, reliable service, and unbeatable quality. We trust that you’ll make the
                    right choice.
                  </p>
                </div>
              </details>

              <AboutVideo />

              <HoursAndInformation />

            </div>

            <div className="sticky hidden lg:block lg:top-24 self-start min-w-0">
              <SocialMediaProfiles />
            </div>

          </div>
        </div>
      </Section>

      <Section>
        <h2 id="meet-our-team" className="text-center mb-8 meet-our-team scroll-mt-8 text-3xl lg:text-5xl">Meet Our Team</h2>
        <div className="gradient-divider my-4" />
        <PersonGrid people={people} />
      </Section>
    </>
  );
}
