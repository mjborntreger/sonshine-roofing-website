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
import { ArrowRight, HandCoins, HardHat, HelpCircle, MapPin, Zap } from "lucide-react";

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
        justifyStart
        badges={[
          { icon: MapPin, label: "Local & Trusted" },
          { icon: HandCoins, label: "Affordable" },
          { icon: HardHat, label: "Expert Opinion" },
          { icon: Zap, label: "Hurricane Preparation" },
        ]}
        imageSrc="https://next.sonshineroofing.com/wp-content/uploads/Roof-Inspection-Hero-Image.webp"
      >
        <div className="flex gap-6 flex-wrap max-w-3xl">
          <div>
            <p className="italic text-sm text-slate-300">Tip Top Roof Check-up</p>
            <p className="text-blue-400 mt-2 text-4xl"><span className="line-through text-slate-400 items-start text-lg mr-1">$249 </span>$209</p>
          </div>
          <div>
            <p className="italic text-sm text-slate-300">Real-estate Inspection</p>
            <p className="text-blue-100 mt-2 text-4xl">$249+</p>
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

            <div className="not-prose flex flex-row justify-between">
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
            <div className="my-6 flex flex-col gap-1">
              <h4 className="mt-0">Ready to get started?</h4>
              <SmartLink href="INSERT_STRIPE_LINK" className="font-normal text-lg font-sans align-bottom"> Book an inspection today
                <ArrowRight className="inline h-4 w-4" />
              </SmartLink>
            </div>
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
