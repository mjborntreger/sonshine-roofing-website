import Section from "@/components/layout/Section";
import Image from "next/image";
import { listRecentPostsPool, listFaqsWithContent } from "@/lib/content/wp";
import FaqInlineList from "@/components/dynamic-content/faq/FaqInlineList";
import YouMayAlsoLike from "@/components/engagement/YouMayAlsoLike";
import RoofCareClub from "@/components/marketing/service-pages/RoofCareClub";
import type { Metadata } from 'next';
import FinancingBand from "@/components/cta/FinancingBand";
import ServicesAside from "@/components/global-nav/static-pages/ServicesAside";
import { buildBasicMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { getServicePageConfig } from "@/lib/seo/service-pages";
import { SITE_ORIGIN } from "@/lib/seo/site";

const SERVICE_PATH = "/roof-maintenance";
const SERVICE_CONFIG = getServicePageConfig(SERVICE_PATH);

export async function generateMetadata(): Promise<Metadata> {
  const config = SERVICE_CONFIG;

  if (!config) {
    return buildBasicMetadata({
      title: "Roof Maintenance | SonShine Roofing",
      description: "Roof maintenance services from SonShine Roofing.",
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
    listFaqsWithContent(8, "roof-maintenance").catch(() => []),
  ]);

  const origin = SITE_ORIGIN;
  const config = SERVICE_CONFIG;
  const breadcrumbsConfig =
    config?.breadcrumbs ?? [
      { name: "Home", path: "/" },
      { name: "Roof Maintenance", path: SERVICE_PATH },
    ];

  const webPageLd = webPageSchema({
    name: config?.title ?? "Roof Maintenance",
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
    <Section>
      <div className="grid px-2 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">
        <div id="article-root" className="prose min-w-0">
          <h1>Roof Maintenance</h1>
          {/* JSON-LD: WebPage + BreadcrumbList */}
          <JsonLd data={webPageLd} />
          <JsonLd data={breadcrumbsLd} />
          <h2>
            Undoubtedly, lack of maintenance is among the top reasons why roofs fail.
          </h2>
          <p>
            Whether it’s a large hole or a small leak, water that seeps below the top 
            layer of a roof can destroy everything in its path. Small leaks, in particular, 
            are dangerous because the damage often goes undetected for years. This hidden 
            moisture leads to rotting wood sheathing and trusses, increased utility costs, 
            and serious health risks due to mold and mildew growth. In fact, such damage can 
            silently erode your safety, comfort, and security—sometimes for as long as 13 years 
            before it becomes visible inside the home.
          </p>

          <figure className="not-prose">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image
                src="https://next.sonshineroofing.com/wp-content/uploads/taking-care-of-your-roof-maintenance-saves-moneybak.webp"
                alt="taking care of your roof maintenance saves you money"
                fill
                className="object-cover mb-2"
                sizes="(max-width: 768px) 100vw, 800px"
                loading="lazy"
              />
            </div>
          </figure>

          <p>
            While it may be tempting to ignore your roof’s maintenance needs, doing so can shorten 
            its lifespan and lead to major expenses down the road. Roofing materials are built to 
            last, but only when they’re properly maintained. That’s why Sonshine Roofing strongly 
            recommends following a roof maintenance schedule and sticking with it year after year.
            <br></br><br></br>
            Routine roof inspections are critical to catching these hidden problems early—before 
            they escalate into major roof repairs, structural rot, or indoor health hazards that 
            threaten your home and well-being.
          </p>

          <FinancingBand />

          <RoofCareClub origin={origin} />

        </div>

        <ServicesAside activePath={SERVICE_PATH} />
      </div>

      <div data-toc-exclude>
        <YouMayAlsoLike
          posts={pool}
          category="roof-maintenance-services"
          excludeSlug={''}
        />
      </div>

      {/* FAQs (dynamic) */}
      <FaqInlineList
        heading="Roof Maintenance FAQs"
        topicSlug="roof-maintenance"
        limit={8}
        initialItems={faqs}
        seeMoreHref="/faq"
      />
    </Section>
  );
}
