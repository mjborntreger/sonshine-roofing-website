import { Suspense } from "react";
import Section from "@/components/layout/Section";
import SimpleLeadForm from "@/components/lead-capture/lead-form/SimpleLeadForm";
import SmartLink from "@/components/utils/SmartLink";
import { Phone, ShieldCheck, BadgeCheck, Banknote, Star, ArrowUpRight } from "lucide-react";
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

const contactInfoPillBase = "btn btn-md mt-4 shadow-md btn-brand-blue not-prose px-3 py-2 justify-start px-4 phone-affordance w-fit";
const contactInfoIconStyles = "h-5 w-5 inline mr-2 shrink-0 text-blue-50 h-6 w-6 phone-affordance-icon";
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
            <div className="mt-6 not-prose rounded-3xl border border-blue-200 bg-white p-6 shadow-sm max-w-full">
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
                  <SmartLink
                    href="tel:+19418664320"
                    className={contactInfoPillBase}
                    title="Call SonShine Roofing"
                    proseGuard
                  >
                    <Phone className={contactInfoIconStyles} aria-hidden="true" />
                    <p className="font-semibold">(941) 866-4320</p>
                  </SmartLink>
                </div>
              </div>
              <div className="my-8 flex flex-wrap gap-3">
                {/* Address */}
                <SmartLink
                  href="https://www.google.com/maps/place/?q=place_id:ChIJIyB9mBBHw4gRWOl1sU9ZGFM"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in Google Maps"
                  proseGuard
                  className="hover:text-slate-600 transition-colors"
                >
                  <p
                    className="font-semibold"
                  >
                    2555 Porter Lake Dr STE 109, Sarasota, Florida 34240
                    <ArrowUpRight className="h-4 w-4 inline ml-1" />
                  </p>
                </SmartLink>
              </div>

              <h2 className={h2Styles}>Whatever you need, we&rsquo;ve got you covered.</h2>
              <p className={pStyles}>Whether you want to schedule an appointment with one our expert Roofing Specialists or if you just have a few questions, we&rsquo;re here to help! Give us a call or complete the form below to contact our office.</p>
            </div>

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
              <FinancingBand />
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
