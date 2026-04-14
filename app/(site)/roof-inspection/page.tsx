import Section from "@/components/layout/Section";
import Image from "next/image";
import SmartLink from "@/components/utils/SmartLink";
import { listRecentPostsPool, listFaqsWithContent } from "@/lib/content/wp";
import FaqInlineList from "@/components/dynamic-content/faq/FaqInlineList";
import YouMayAlsoLike from "@/components/engagement/YouMayAlsoLike";
import TipTopRoofCheckup from "@/components/marketing/service-pages/TipTopRoofCheckup";
import type { Metadata } from 'next';
import ServicesAside from "@/components/global-nav/static-pages/ServicesAside";
import { buildBasicMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { getServicePageConfig } from "@/lib/seo/service-pages";
import { SITE_ORIGIN } from "@/lib/seo/site";
import Hero from "@/components/ui/Hero";
import { ArrowRight, HandCoins, HardHat, HelpCircle, MapPin, Smartphone, ShieldCheck, Zap } from "lucide-react";
import { STRIPE_PAYMENT_LINK } from "@/components/marketing/service-pages/TipTopRoofCheckup";
import { Suspense } from "react";
import EvenSimplerLeadForm from "@/components/lead-capture/lead-form/EvenSimplerLeadForm";

const SERVICE_PATH = "/roof-inspection";
const SERVICE_CONFIG = getServicePageConfig(SERVICE_PATH);

export async function generateMetadata(): Promise<Metadata> {
  const config = SERVICE_CONFIG;

  if (!config) {
    return buildBasicMetadata({
      title: "Residential Roof Inspection | SonShine Roofing",
      description: "Roof inspections with ZERO hassle | Fast, Friendly, Professional | (941) 866-4320 | Call Us Today!",
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

export default async function Page() {
  const [pool, faqs] = await Promise.all([
    listRecentPostsPool(36),
    listFaqsWithContent(8, "roof-inspection").catch(() => []),
  ]);

  const origin = SITE_ORIGIN;
  const config = SERVICE_CONFIG;
  const breadcrumbsConfig =
    config?.breadcrumbs ?? [
      { name: "Home", path: "/" },
      { name: "Roof Inspection", path: SERVICE_PATH },
    ];

  const webPageLd = webPageSchema({
    name: config?.title ?? "Roof Inspection",
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
      <Hero
        title="Roof Inspection"
        eyelash="Residential Roof Inspection Services in Sarasota, FL and Surrounding Areas"
        subtitle="Our 18-point Tip Top Roof Check-up goes beyond your typical roof inspection because, just like you, we live right here in Sarasota. We understand the challenges homeowners face when dealing with insurance claims, hurricane season, and that dreaded AC bill. Whether you need to find hidden damage, gather documentation for real estate / insurance purposes, or just want some peace of mind next hurricane season, give us a call and we'll get you on the schedule."
        badges={[
          { icon: MapPin, label: "Local & Trusted" },
          { icon: HandCoins, label: "Affordable" },
          { icon: HardHat, label: "Expert Opinion" },
          { icon: Zap, label: "Hurricane Preparation" },
        ]}
        imageSrc="https://next.sonshineroofing.com/wp-content/uploads/Roof-Inspection-Hero-Image.webp"
      >
        <div className="bg-slate-600 h-[1px] my-8" />
        <div className="flex-col gap-y-6 max-w-5xl text-center mx-auto">
          <h2 className="text-4xl sm:text-5xl font-semibold my-4 text-white">
            Book a <span className="text-[--brand-cyan]">Tip Top Roof Check-up</span> Today
          </h2>
          <div>
            <p className="text-slate-300 mt-2 text-xl sm:text-3xl">Just <span className="text-slate-500 line-through">$249</span><span className="text-[--brand-cyan]"> $209.00</span></p>
          </div>
          <div className="flex flex-row flex-wrap mx-auto mt-8 justify-center gap-4">
            <SmartLink className="text-white phone-affordance hover:bg-slate-600 flex-row flex-nowrap gap-x-1 not-prose py-4 btn btn-lg sm:btn-xl btn-outline h-[60px]" href={STRIPE_PAYMENT_LINK} target="_blank" rel="noopener noreferrer">
              <Smartphone className="phone-affordance-icon h-4 w-4 sm:h-5 sm:w-5 inline mr-2" />
              Call (941) 866-4320
            </SmartLink>
            <div>
              <SmartLink className="flex-row flex-nowrap not-prose py-4 btn btn-lg sm:btn-xl btn-brand-blue h-[60px]" href={STRIPE_PAYMENT_LINK} data-icon-affordance="right" target="_blank" rel="noopener noreferrer">
                <span>Schedule with</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 55 30" fillRule="evenodd" fill="#FFFFFF"><path d="M 50.7735 15.47 c 0 -2.9425 -1.425 -5.265 -4.15 -5.265 -2.735 0 -4.391 2.322 -4.391 5.2415 0 3.46 1.954 5.207 4.7585 5.207 1.368 0 2.4025 -0.31 3.184 -0.747 v -2.299 c -0.7815 0.391 -1.678 0.632 -2.816 0.632 -1.115 0 -2.1035 -0.391 -2.23 -1.747 h 5.62 c 0 -0.15 0.023 -0.747 0.023 -1.023 z M 45.1 14.3785 c 0 -1.299 0.793 -1.839 1.5175 -1.839 0.701 0 1.4485 0.54 1.4485 1.839 z m -7.2985 -4.1725 c -1.1265 0 -1.85 0.5285 -2.253 0.8965 l -0.15 -0.7125 H 32.865 v 13.4025 l 2.8735 -0.609 0.0115 -3.253 c 0.414 0.299 1.023 0.724 2.035 0.724 2.0575 0 3.931 -1.65 3.931 -5.299 -0.0115 -3.3335 -1.908 -5.15 -3.92 -5.15 z m -0.69 7.92 c -0.678 0 -1.08 -0.2415 -1.3565 -0.54 l -0.0115 -4.265 c 0.299 -0.3335 0.7125 -0.563 1.368 -0.563 1.046 0 1.77 1.1725 1.77 2.678 0 1.54 -0.7125 2.69 -1.77 2.69 z m -8.2 -8.598 l 2.885 -0.62 V 6.575 l -2.885 0.609 z m 0 0.8735 h 2.885 v 10.0575 h -2.885 z m -3.0925 0.85 l -0.184 -0.85 h -2.483 V 20.46 h 2.8735 V 13.643 c 0.678 -0.885 1.8275 -0.724 2.184 -0.5975 v -2.6435 c -0.368 -0.138 -1.7125 -0.391 -2.391 0.85 z m -5.747 -3.35 L 17.2675 8.5 l -0.0115 9.207 c 0 1.701 1.276 2.954 2.977 2.954 0.9425 0 1.632 -0.1725 2.0115 -0.38 v -2.3335 c -0.368 0.15 -2.184 0.678 -2.184 -1.023 V 12.85 h 2.184 v -2.4485 h -2.185 z m -7.77 5.414 c 0 -0.4485 0.368 -0.62 0.977 -0.62 a 6.425 6.425 0 0 1 2.85 0.735 V 10.735 c -0.954 -0.38 -1.8965 -0.5285 -2.85 -0.5285 -2.3335 0 -3.885 1.2185 -3.885 3.253 0 3.1725 4.368 2.6665 4.368 4.035 0 0.5285 -0.46 0.701 -1.1035 0.701 -0.954 0 -2.1725 -0.391 -3.138 -0.92 v 2.735 c 1.069 0.46 2.15 0.65 3.138 0.65 2.391 0 4.035 -1.184 4.035 -3.2415 -0.0115 -3.425 -4.391 -2.816 -4.391 -4.1035 z" /></svg>
                <ArrowRight className="icon-affordance h-4 w-4 sm:h-5 sm:w-5 inline ml-2" />
              </SmartLink>
              <p className="mt-2 text-xs sm:text-sm text-slate-400">
                Takes you to a secure checkout page
                <ShieldCheck className="h-4 w-4 text-green-600 ml-1 inline align-middle" />
              </p>
            </div>
          </div>

        </div>

      </Hero>
      <Section>
        <div className="grid gap-4 px-2 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">
          <div id="article-root" className="prose min-w-0">
            {/* JSON-LD: WebPage + BreadcrumbList */}
            <JsonLd data={webPageLd} />
            <JsonLd data={breadcrumbsLd} />

            <TipTopRoofCheckup origin={origin} />

            <div className="bg-slate-200 h-[1px] my-8" />

            <Suspense fallback={null}>
              <EvenSimplerLeadForm
                projectType="maintenance"
                page="/roof-inspection"
                title="Book a Roof Inspection Today"
                titleHighlight="Roof Inspection"
              />
            </Suspense>

            <div className="mt-16 not-prose flex flex-row justify-between">
              <h3 className="mb-3 text-xl text-slate-700 md:text-2xl">
                <HelpCircle className="text-[--brand-blue] h-5 w-5 inline mr-2" aria-hidden="true" />
                Why Do I Need a Roof Inspection?
              </h3>
            </div>
            <div className="text-lg prose">
              <p>
                A roof can protect your home for 20 years, but
                only if someone is paying attention.
                <br /><br />
                Small leaks and worn flashing rarely announce themselves.
                They work quietly. By the time water stains appear inside,
                decking may already be rotting, insulation compromised,
                and framing weakened.
                <br /><br />
                A professional inspection catches these issues early (when
                they’re <strong>inexpensive to fix</strong>). The National Roofing Contractors
                Association <SmartLink href="https://www.nrca.net">(nrca.net)</SmartLink> recommends
                two inspections per year to prevent premature roof failure.
              </p>
              <figure className="not-prose mt-4">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                  <Image
                    src="https://next.sonshineroofing.com/wp-content/uploads/Nathan-Borntreger-Owner-President-Sonshine-Roofing.webp"
                    alt="Nathan Borntreger, owner of SonShine Roofing, Roof Inspection Expert"
                    fill
                    className="object-cover mb-2"
                    sizes="(max-width: 768px) 100vw, 800px"
                    loading="lazy"
                  />
                </div>
                <figcaption className="mt-2 text-sm text-slate-600">
                  <strong>Nathan Borntreger</strong> — Owner of SonShine Roofing • Insured • LIC: #CCC1331483 | <SmartLink className="text-[--brand-blue]" href="/person/nathan-borntreger">See full bio</SmartLink>
                </figcaption>
              </figure>
              {/* Inline callout (#6) */}
              <div className="shadow-sm my-4 rounded-xl border border-[#fb9216/5] bg-amber-50/50 p-4" role="note" aria-label="Important">
                <p className="m-0 italic text-slate-700">
                  &quot;Your roof could be leaking right now and you wouldn’t know it. Some leaks go years before they show up inside the house.&quot;
                </p>
                <div className="text-right">
                  -Nathan Borntreger
                </div>
              </div>
              <p>
                You can spot obvious damage from the ground. But a trained
                roofer can safely walk the roof, identify hidden entry points,
                and prioritize repairs before they become major problems.
                <br></br><br></br>
                That’s why we built the <SmartLink href="/roof-maintenance">Roof Care Club</SmartLink> — a simple, consistent
                maintenance plan designed to maximize the value of your
                homeowner&rsquo;s insurance claims, extend the life of your roof, and
                protect your home year after year.
              </p>
            </div>
            <div className="bg-slate-200 h-[1px] my-8" />
            <div className="text-center text-lg sm:text-2xl font-semibold my-4">
              Book Your <span className="text-[--brand-blue]">Roof Inspection</span> Today
            </div>
            <div>
              <SmartLink className="flex-row flex-nowrap gap-1 not-prose w-full py-4 btn btn-md btn-brand-blue" href={STRIPE_PAYMENT_LINK} data-icon-affordance="right" target="_blank" rel="noopener noreferrer">
                <span>Pay Securely with</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="55" height="30" fillRule="evenodd" fill="#FFFFFF"><path d="M 50.7735 15.47 c 0 -2.9425 -1.425 -5.265 -4.15 -5.265 -2.735 0 -4.391 2.322 -4.391 5.2415 0 3.46 1.954 5.207 4.7585 5.207 1.368 0 2.4025 -0.31 3.184 -0.747 v -2.299 c -0.7815 0.391 -1.678 0.632 -2.816 0.632 -1.115 0 -2.1035 -0.391 -2.23 -1.747 h 5.62 c 0 -0.15 0.023 -0.747 0.023 -1.023 z M 45.1 14.3785 c 0 -1.299 0.793 -1.839 1.5175 -1.839 0.701 0 1.4485 0.54 1.4485 1.839 z m -7.2985 -4.1725 c -1.1265 0 -1.85 0.5285 -2.253 0.8965 l -0.15 -0.7125 H 32.865 v 13.4025 l 2.8735 -0.609 0.0115 -3.253 c 0.414 0.299 1.023 0.724 2.035 0.724 2.0575 0 3.931 -1.65 3.931 -5.299 -0.0115 -3.3335 -1.908 -5.15 -3.92 -5.15 z m -0.69 7.92 c -0.678 0 -1.08 -0.2415 -1.3565 -0.54 l -0.0115 -4.265 c 0.299 -0.3335 0.7125 -0.563 1.368 -0.563 1.046 0 1.77 1.1725 1.77 2.678 0 1.54 -0.7125 2.69 -1.77 2.69 z m -8.2 -8.598 l 2.885 -0.62 V 6.575 l -2.885 0.609 z m 0 0.8735 h 2.885 v 10.0575 h -2.885 z m -3.0925 0.85 l -0.184 -0.85 h -2.483 V 20.46 h 2.8735 V 13.643 c 0.678 -0.885 1.8275 -0.724 2.184 -0.5975 v -2.6435 c -0.368 -0.138 -1.7125 -0.391 -2.391 0.85 z m -5.747 -3.35 L 17.2675 8.5 l -0.0115 9.207 c 0 1.701 1.276 2.954 2.977 2.954 0.9425 0 1.632 -0.1725 2.0115 -0.38 v -2.3335 c -0.368 0.15 -2.184 0.678 -2.184 -1.023 V 12.85 h 2.184 v -2.4485 h -2.185 z m -7.77 5.414 c 0 -0.4485 0.368 -0.62 0.977 -0.62 a 6.425 6.425 0 0 1 2.85 0.735 V 10.735 c -0.954 -0.38 -1.8965 -0.5285 -2.85 -0.5285 -2.3335 0 -3.885 1.2185 -3.885 3.253 0 3.1725 4.368 2.6665 4.368 4.035 0 0.5285 -0.46 0.701 -1.1035 0.701 -0.954 0 -2.1725 -0.391 -3.138 -0.92 v 2.735 c 1.069 0.46 2.15 0.65 3.138 0.65 2.391 0 4.035 -1.184 4.035 -3.2415 -0.0115 -3.425 -4.391 -2.816 -4.391 -4.1035 z" /></svg>
                <ArrowRight className="icon-affordance h-4 w-4 inline ml-2" />
              </SmartLink>
              <p className="mt-2 text-xs sm:text-sm text-center">
                Takes you to a secure checkout page
                <ShieldCheck className="h-4 w-4 text-green-600 ml-1 inline align-middle" />
              </p>
            </div>
            <div className="my-6 rounded-xl border border-[#fb9216/5] bg-amber-50/50 p-4 shadow-sm" role="note" aria-label="Advisory">
              <strong className="uppercase text-[1rem] font-display block text-slate-800 mb-1">
                <HandCoins className="text-[--brand-blue] h-4 w-4 mr-2 inline" />
                Want it free instead?
              </strong>
              <div className="m-0 text-slate-700">
                <span className="text-slate-600">Give us a call and mention you would like to join
                  the <SmartLink href="/roof-maintenance">Roof Care Club.</SmartLink>
                </span>
                <SmartLink className="phone-affordance mt-4 w-full not-prose" href="tel:+19418664320">
                  <div className="btn btn-md btn-outline w-full">
                    <Smartphone className="phone-affordance-icon inline h-4 w-4 mr-2" />
                    Call (941) 866-4320
                  </div>
                </SmartLink>
              </div>
            </div>
            <div className="bg-slate-200 h-[1px] my-8" />
          </div>

          <ServicesAside activePath={SERVICE_PATH} />
        </div>

        <div data-toc-exclude>
          <YouMayAlsoLike
            posts={pool}
            category="roof-inspection"
            excludeSlug={''}
            heading="Learn More About Roof Inspection Services"
          />
        </div>

        {/* FAQs (dynamic) */}
        <FaqInlineList
          heading="Roof Inspection FAQs"
          topicSlug="roof-inspection"
          limit={8}
          initialItems={faqs}
          seeMoreHref="/faq"
        />
      </Section>
    </>
  );
}
