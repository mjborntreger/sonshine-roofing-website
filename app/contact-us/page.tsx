import { Suspense } from "react";
import Section from "@/components/layout/Section";
import SimpleLeadForm from "@/components/lead-capture/lead-form/SimpleLeadForm";
import SmartLink from "@/components/utils/SmartLink";
import { Phone, MapPin, ShieldCheck, BadgeCheck, Banknote, Star } from "lucide-react";
import Image from 'next/image';
import SocialMediaProfiles from "@/components/global-nav/static-pages/SocialMediaProfiles";
import type { Metadata } from 'next';
import LiteMap from "@/components/utils/LiteMap";
import { renderHighlight } from "@/components/utils/renderHighlight";
import OpenOrClosed from "@/components/utils/OpenOrClosed";
import ResourcesQuickLinks from "@/components/global-nav/static-pages/ResourcesQuickLinks";
import FinancingBand from "@/components/cta/FinancingBand";
import { buildBasicMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { getServicePageConfig } from "@/lib/seo/service-pages";
import { SITE_ORIGIN } from "@/lib/seo/site";

const SERVICE_PATH = "/contact-us";
const SERVICE_CONFIG = getServicePageConfig(SERVICE_PATH);

export async function generateMetadata(): Promise<Metadata> {
  const config = SERVICE_CONFIG;

  if (!config) {
    return buildBasicMetadata({
      title: "Contact SonShine Roofing",
      description: "Get in touch with SonShine Roofing.",
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

const contactInfoPillStyles = "not-prose inline-flex w-full sm:w-auto max-w-full items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm text-left text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 whitespace-normal break-words overflow-hidden";
const contactInfoIconStyles = "h-5 w-5 shrink-0 text-[--brand-blue]";
const h1Styles = "text-3xl md:text-5xl text-slate-900";
const h2Styles = "text-xl md:text-2xl text-slate-800";
const pStyles = "text-md py-2 text-slate-700";
const badgeStyles = "badge badge--accent inline-flex items-center gap-2";

export default async function Page() {
  const origin = SITE_ORIGIN;
  const config = SERVICE_CONFIG;
  const breadcrumbsConfig =
    config?.breadcrumbs ?? [
      { name: "Home", path: "/" },
      { name: "Contact", path: SERVICE_PATH },
    ];

  const webPageLd = webPageSchema({
    name: config?.title ?? "Contact SonShine Roofing",
    description: config?.description,
    url: SERVICE_PATH,
    origin,
    primaryImage: config?.image?.url ?? "/og-default.png",
    isPartOf: { "@type": "WebSite", name: "SonShine Roofing", url: origin },
  });

  const breadcrumbsLd = breadcrumbSchema(
    breadcrumbsConfig.map((crumb) => ({ name: crumb.name, item: crumb.path })),
    { origin },
  );

  return (
    <Section>
      <div className="py-4">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] items-start max-w-full">
          {/* Main content */}
          <div className="prose max-w-full min-w-0">
            <h1 className={h1Styles}>Contact Us</h1>
            <JsonLd data={webPageLd} />
            <JsonLd data={breadcrumbsLd} />
            {/* Trust strip */}
            <div className="mt-4 not-prose items-center">
              <div className="flex flex-wrap items-center justify-start gap-2 text-sm font-medium text-slate-700">
                <span className={badgeStyles}>
                  <ShieldCheck className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
                  Licensed &amp; Insured
                </span>
                <span className={badgeStyles}>
                  <BadgeCheck className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
                  Warranty
                </span>
                <span className={badgeStyles}>
                  <Banknote className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
                  Financing
                </span>
                <span className={badgeStyles}>
                  <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  4.8 on Google
                </span>
              </div>
            </div>

            {/* “You'll talk to…” human tile */}
            <div className="mt-6 not-prose rounded-3xl border border-slate-200 bg-white p-6 shadow-sm max-w-full">
              <OpenOrClosed />
              <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] mt-8 gap-4 items-center min-w-0">
                <Image
                  src="https://next.sonshineroofing.com/wp-content/uploads/Tara-Project-Support.webp"
                  alt="Tara – Project Support Specialist"
                  width={150}
                  height={429}
                  sizes="(max-width: 150px) 20vw, 300px"
                  className="mb-2 block h-24 w-auto rounded-full object-cover"
                />
                <div>
                  <p className="text-md font-semibold text-slate-900">
                    You’ll likely talk to <span className="inline text-[--brand-blue]">Tara</span>
                  </p>
                  <p className="text-md text-slate-600">She’s friendly, fast, and hates leaks.</p>
                </div>
              </div>
              {/* Phone */}
              <div className="my-8 flex flex-wrap gap-3">
                <SmartLink
                  href="tel:+19418664320"
                  className={`${contactInfoPillStyles} w-full phone-affordance`}
                  title="Call SonShine Roofing"
                  proseGuard
                >
                  <Phone className={`${contactInfoIconStyles} phone-affordance-icon`} aria-hidden="true" />
                  <span className="font-semibold min-w-0 break-words">(941) 866-4320</span>
                </SmartLink>

                {/* Address */}
                <SmartLink
                  href="https://www.google.com/maps/place/?q=place_id:ChIJIyB9mBBHw4gRWOl1sU9ZGFM"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${contactInfoPillStyles} w-full`}
                  title="Open in Google Maps"
                  proseGuard
                >
                  <MapPin className={contactInfoIconStyles} aria-hidden="true" />
                  <span className="font-semibold min-w-0 break-words">2555 Porter Lake Dr STE 109, Sarasota, Florida 34240</span>
                </SmartLink>
              </div>

              <h2 className={h2Styles}>Whatever you need, we&rsquo;ve got you covered.</h2>
              <p className={pStyles}>Whether you need to schedule an appointment with one our
                expert Roofing Specialists to come to your home, or if you
                just have a few questions, we&rsquo;re here to help! Give us a call
                or complete the form below to contact our office.
              </p>
            </div>

            <FinancingBand />

            <div className="mt-8">
              <Suspense
                fallback={
                  <div className="mx-auto w-full max-w-3xl rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
                    <div className="h-6 w-32 animate-pulse rounded-full bg-slate-200" />
                    <div className="mt-4 space-y-3">
                      <div className="h-4 animate-pulse rounded-full bg-slate-200" />
                      <div className="h-4 animate-pulse rounded-full bg-slate-200" />
                      <div className="h-4 animate-pulse rounded-full bg-slate-200" />
                    </div>
                  </div>
                }
              >
                <SimpleLeadForm />
              </Suspense>
            </div>
          </div>

          {/* Floating/sticky */}
          <aside className="lg:sticky top-16 self-start lg:h-fit">
            <SocialMediaProfiles />
            <ResourcesQuickLinks activePath={SERVICE_PATH} />
          </aside>

        </div>
        <div className="my-24">
          <h2 className="text-2xl md:text-5xl mb-16 text-center flex items-center justify-center gap-3">
            <span>{renderHighlight("Find Us on Google Maps", "Find Us")}</span>
            <Image
              src="https://next.sonshineroofing.com/wp-content/uploads/Maps_Pin_FullColor-x1000-1.webp"
              alt="SonShine Roofing map pin"
              width={48}
              height={48}
              className="inline h-6 w-6 md:h-12 md:w-12"
            />
          </h2>
          <LiteMap />
        </div>

      </div>
    </Section>
  );
}
