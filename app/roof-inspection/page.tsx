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
import { HandCoins, HardHat, MapPin, Zap } from "lucide-react";

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
            <p className="text-blue-400 mt-2 text-4xl"><span className="line-through text-slate-400 items-start text-lg mr-1">$199 </span>$169</p>
          </div>
          <div>
            <p className="italic text-sm text-slate-300">Real-estate Inspection</p>
            <p className="text-blue-100 mt-2 text-4xl">$199+</p>
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

            <h2>Why Do I Need a Roof Inspection?</h2>
            <p>
              Believe it or not, the average roof protects your home for about 20
              years—but only if you stay on top of regular maintenance and address
              minor damage early. Ignoring small issues today can lead to major expenses
              tomorrow.
              <br></br><br></br>
              For most homeowners, spotting those early warning signs is difficult without
              training. That’s why scheduling a professional roof inspection is one of the
              smartest things you can do to protect your home and investment.
              <br></br><br></br>
              The cost of a roof evaluation is minimal compared to the cost of extensive roof
              repairs or a full replacement. Wouldn’t you rather detect a hidden leak or
              structural issue before it turns into an expensive problem?
            </p>

            <h2>Roofs Can Leak for Years Before You See Evidence</h2>
            <p>
              To add years of life to your roof, the National Roofing Contractors Association
              (NRCA) recommends two roof inspections each year by a licensed roofing
              professional to avoid premature roof failure. Studies show that small leaks are
              the most damaging kind—when undetected, they can silently erode your home’s
              structure, much like an undetected illness.
            </p>
            <figure className="not-prose">
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
            <div className="my-4 rounded-xl border border-[#fb9216]/30 bg-[#fb9216]/5 p-4" role="note" aria-label="Important">
              <p className="m-0 italic text-slate-700">
                “Your roof could be leaking right now, and you don’t even know it…
                roofs can leak for up to 13 years before you see evidence on the
                inside of the house.”
              </p>
              <div className="text-right">
                -Nathan Borntreger
              </div>
            </div>

            <p>
              Comprehensive residential roof inspections become even more critical during tough economic times,
              helping you maximize your roof’s service life and avoid premature roof replacement.
              As we like to say: the only people who can afford to ignore their roof are those who
              can afford to buy a new one.
              <br></br><br></br>
              While you can perform a preliminary inspection yourself—checking for shingles that are
              curling, blistering, or missing; signs of wear around chimneys, pipes, and penetrations;
              or broken and missing tiles—nothing compares to a professional inspection. A qualified
              roofer knows how to walk your roof safely, identify hidden issues, and locate the kinds
              of small leaks that lead to costly repairs if left unchecked. For optimal peace of mind,
              pair this with a consistent roof maintenance routine by signing up for our Roof Care Club
            </p>
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
