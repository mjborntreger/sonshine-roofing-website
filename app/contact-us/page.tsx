import { Suspense } from "react";
import Section from "@/components/layout/Section";
import SimpleLeadForm from "@/components/lead-capture/lead-form/SimpleLeadForm";
import SmartLink from "@/components/utils/SmartLink";
import { Phone, ShieldCheck, BadgeCheck, Star, HandCoins } from "lucide-react";
import Image from 'next/image';
import SocialMediaProfiles from "@/components/global-nav/static-pages/SocialMediaProfiles";
import type { Metadata } from 'next';
import LiteMap from "@/components/utils/LiteMap";
import OpenOrClosed from "@/components/utils/OpenOrClosed";
import ResourcesQuickLinks from "@/components/global-nav/static-pages/ResourcesQuickLinks";
import { buildBasicMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { getServicePageConfig } from "@/lib/seo/service-pages";
import { SITE_ORIGIN } from "@/lib/seo/site";
import Hero from "@/components/ui/Hero";
import CopyPhoneButton from "@/components/utils/CopyPhoneButton";

const SERVICE_PATH = "/contact-us";
const SERVICE_CONFIG = getServicePageConfig(SERVICE_PATH);
const PHONE_E164 = "+19418664320";
const PHONE_DISPLAY = "(941) 866-4320";

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

const contactInfoPillBase = "btn btn-lg mb-2 rounded-xl btn-brand-blue not-prose px-3 py-2 justify-start phone-affordance w-fit";
const contactInfoIconStyles = "h-5 w-5 inline mr-2 text-blue-50 h-6 w-6 phone-affordance-icon";

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
    <>
      <Hero
        title="Contact Us"
        eyelash="Whatever you need, we've got you covered"
        subtitle="Whether you want to schedule an appointment with one our expert Roofing Specialists or if you just have a few questions, we’re here to help! Give us a call or complete the form below to contact our office."
        badges={[
          { icon: ShieldCheck, label: "Licensed & Insured" },
          { icon: Star, label: "4.8 on Google" },
          { icon: HandCoins, label: "Flexible Financing" },
          { icon: BadgeCheck, label: "25-year Warranty" },
        ]}
      >

      </Hero>
      <Section>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] items-start max-w-full">
          {/* Main content */}
          <div className="prose max-w-full min-w-0">
            <JsonLd data={webPageLd} />
            <JsonLd data={breadcrumbsLd} />

            {/* “You'll talk to…” human tile */}
            <div className="not-prose rounded-3xl border border-blue-200 bg-white p-6 shadow-sm max-w-full">
              <OpenOrClosed />
              <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] mt-8 gap-4 items-center min-w-0">
                <Image
                  src="https://next.sonshineroofing.com/wp-content/uploads/Tara-Project-Support.webp"
                  alt="Tara – Project Support Specialist"
                  width={75}
                  height={107.25}
                  className="mb-2 block h-[107.25px] w-auto rounded-full object-cover"
                />
                <div>
                  <p className="text-xl font-semibold text-slate-900">
                    You’ll likely talk to <span className="text-[--brand-blue]">Tara</span>
                  </p>
                  <p className="text-md text-slate-600 mb-2">Fast, friendly & reliable.</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <SmartLink
                      href={`tel:${PHONE_E164}`}
                      className={contactInfoPillBase}
                      title="Call SonShine Roofing"
                      proseGuard
                    >
                      <Phone className={contactInfoIconStyles} aria-hidden="true" />
                      <p className="font-semibold">{PHONE_DISPLAY}</p>
                    </SmartLink>
                    <CopyPhoneButton number={PHONE_DISPLAY} />
                  </div>
                  <p className="lg:hidden text-xs md:text-sm text-slate-500">Tap to call</p>
                </div>
              </div>
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
            </div>
            <div className="mt-8">
              <LiteMap />
            </div>
            
          </div>

          {/* Floating/sticky */}
          <aside className="lg:sticky top-16 self-start lg:h-fit">
            <SocialMediaProfiles />
            <ResourcesQuickLinks activePath={SERVICE_PATH} />
          </aside>
        </div>
      </Section>
    </>
  );
}
