import Section from "@/components/layout/Section";
import { AboutVideo } from "../../components/marketing/about-page/AboutVideo";
import { listPersons, listPersonsBySlugs } from '@/lib/content/wp';
import PersonGrid from "../../components/dynamic-content/person/PersonGrid";
import SocialMediaProfiles from "@/components/global-nav/static-pages/SocialMediaProfiles";
import { HoursAndInformation } from "../../components/marketing/about-page/HoursAndInformation";
import { Accordion } from "@/components/ui/Accordion";
import { UserRoundSearch, CloudRainWind, BadgeCheck, ExternalLink } from "lucide-react";
import type { Metadata } from 'next';
import ResourcesQuickLinks from "@/components/global-nav/static-pages/ResourcesQuickLinks";
import { buildBasicMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { getServicePageConfig } from "@/lib/seo/service-pages";
import { SITE_ORIGIN } from "@/lib/seo/site";
import Image from "next/image";

const SERVICE_PATH = "/about-sonshine-roofing";
const SERVICE_CONFIG = getServicePageConfig(SERVICE_PATH);

export async function generateMetadata(): Promise<Metadata> {
  const config = SERVICE_CONFIG;

  if (!config) {
    return buildBasicMetadata({
      title: "About SonShine Roofing",
      description: "Learn about the SonShine Roofing team.",
      path: SERVICE_PATH,
    });
  }

  return buildBasicMetadata({
    title: config.title,
    description: config.description,
    path: SERVICE_PATH,
    keywords: config.keywords,
    image: config.image,
  });
}

const ORDER: string[] = [
  'nathan-borntreger',
  'angela',
  'bob',
  'dean',
  'josh',
  'jb',
  'jeremy-k',
  'tara',
  'matthew',
  'mina',
  'steve',
  'michael',
  'erick',
  'jose'
];

export default async function Page() {
  const people = ORDER.length
    ? await listPersonsBySlugs(ORDER)
    : await listPersons(20);
  const origin = SITE_ORIGIN;
  const config = SERVICE_CONFIG;

  const breadcrumbsConfig =
    config?.breadcrumbs ?? [
      { name: "Home", path: "/" },
      { name: "About SonShine Roofing", path: SERVICE_PATH },
    ];

  const webPageLd = webPageSchema({
    name: config?.title ?? "About SonShine Roofing",
    description: config?.description,
    url: SERVICE_PATH,
    origin,
    primaryImage: config?.image?.url ?? "/og-default.png",
    isPartOf: { "@type": "WebSite", name: "SonShine Roofing", url: origin },
  });

  const breadcrumbsLd = breadcrumbSchema(
    breadcrumbsConfig.map((crumb) => ({
      name: crumb.name,
      item: crumb.path,
    })),
    { origin },
  );

  return (
    <>
      <Section>
        <div className="py-4">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] items-start max-w-full">

            {/* About us */}
            <div className="prose max-w-full min-w-0">
              <h1>About SonShine Roofing</h1>

              {/* JSON-LD: Breadcrumbs + WebPage */}
              <JsonLd data={breadcrumbsLd} />
              <JsonLd data={webPageLd} />

              {/* Credentials pill strip */}
              <div className="not-prose mt-2 mb-4 flex flex-wrap items-center gap-2">
                <a
                  href="https://www.myfloridalicense.com/LicenseDetail.asp?SID=&id=601EB27C16D2369E36FD9B81C20A0755"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View Florida contractor license #CCC1331483 on myfloridalicense.com (opens in a new tab)"
                  className="btn btn-outline btn-sm hover:bg-[#fb9216]/10 inline-flex items-center"
                >
                  <BadgeCheck className="mr-1 inline h-4 w-4 align-[-0.125em] text-[--brand-blue]" aria-hidden="true" />
                  <span>License #CCC1331483</span>
                  <ExternalLink className="ml-1 inline h-3 w-3 align-[-0.125em]" aria-hidden="true" />
                </a>
              </div>

              <div className="flex items-center justify-self-center">
                <Image
                  src="https://next.sonshineroofing.com/wp-content/uploads/About-Us-Collage-new.png"
                  alt="Team collage for SonShine Roofing, the best roofing company in Sarasota"
                  title="SonShine Roofing Team"
                  width={800}
                  height={225}
                  className="my-6"
                />
              </div>

              <Accordion
                icon={<UserRoundSearch className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />}
                summary={<h2 className="text-lg">Who we are</h2>}
                className="mb-4"
                radius="2xl"
                proseBody={false}
                defaultOpen
              >
                <p>
                  SonShine Roofing is a family-owned roofing company based in Sarasota, Florida,
                  serving Sarasota, Manatee, and Charlotte County residents with 38+ years of experience.
                  We specialize in residential roofing services, including roof repair, roof replacement,
                  inspections, and our Roof Care Club, which is our preventative maintenance program designed
                  for the unique weather conditions of Southwest Florida.
                  <br /><br />
                  We’ve learned that superior customer service and honesty with clients are the only way to
                  stay in business. When you ask us to inspect your roof, we’ll tell you the flat-out truth
                  and give you our best recommendation based on our 38+ years of professional experience.
                  We’d be more than pleased to have you look through our client referrals.
                </p>
              </Accordion>

              <Accordion
                icon={<CloudRainWind className="h-5 w-5" aria-hidden="true" />}
                summary={<h2 className="text-lg">Built for Florida&apos;s Weather</h2>}
                className="mb-4"
                radius="2xl"
                proseBody={false}
              >
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
              </Accordion>

              <HoursAndInformation />

              <AboutVideo />

            </div>

            <aside className="lg:sticky top-16 self-start lg:h-fit">
              <SocialMediaProfiles />
              <ResourcesQuickLinks activePath={SERVICE_PATH} />
            </aside>

          </div>
        </div>
      </Section>

      <Section>
        <h2 id="meet-our-team" className="text-center mb-8 meet-our-team text-3xl lg:text-5xl">Meet Our Team</h2>
        <div className="gradient-divider my-4" />
        <PersonGrid people={people} />
      </Section>
    </>
  );
}
