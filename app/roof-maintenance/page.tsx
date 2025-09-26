import Section from "@/components/layout/Section";
import Image from "next/image";
import { listRecentPostsPool, listFaqsWithContent, faqItemsToJsonLd } from "@/lib/wp";
import FaqInlineList from "@/components/FaqInlineList";
import YouMayAlsoLike from "@/components/YouMayAlsoLike";
import RoofCareClub from "@/components/RoofCareClub";
import type { Metadata } from 'next';
import FinancingBand from "@/components/FinancingBand";
import ServicesAside from "@/components/ServicesAside";

// ===== STATIC SEO FOR /roof-maintenance (EDIT HERE) =====
const SEO_TITLE_ROOF_MAINT = 'Roof Maintenance in Sarasota, Manatee & Charlotte Counties | SonShine Roofing';
const SEO_DESCRIPTION_ROOF_MAINT = 'Prevent leaks, catch issues early, and extend roof life with scheduled inspections and upkeep. Serving Southwest Florida since 1987.';
const SEO_KEYWORDS_ROOF_MAINT = [
  'roof maintenance',
  'roof upkeep',
  'roof inspection',
  'preventative roof maintenance',
  'roof care club',
  'Sarasota roofing',
  'North Port Roofing',
  'Venice Roofing',
  'Manatee County roofing',
  'Charlotte County roofing'
];
const SEO_CANONICAL_ROOF_MAINT = '/roof-maintenance';
const SEO_OG_IMAGE_DEFAULT = '/og-default.png';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: SEO_TITLE_ROOF_MAINT,
    description: SEO_DESCRIPTION_ROOF_MAINT,
    keywords: SEO_KEYWORDS_ROOF_MAINT,
    alternates: { canonical: SEO_CANONICAL_ROOF_MAINT },
    openGraph: {
      type: 'website',
      title: SEO_TITLE_ROOF_MAINT,
      description: SEO_DESCRIPTION_ROOF_MAINT,
      url: SEO_CANONICAL_ROOF_MAINT,
      images: [{ url: SEO_OG_IMAGE_DEFAULT, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: SEO_TITLE_ROOF_MAINT,
      description: SEO_DESCRIPTION_ROOF_MAINT,
      images: [SEO_OG_IMAGE_DEFAULT],
    },
  };
}

const scrollGuard = "scroll-mt-24";

export default async function Page() {
  const pool = await listRecentPostsPool(36);
  const faqs = await listFaqsWithContent(8, "roof-maintenance").catch(() => []);

  // JSON-LD: WebPage + BreadcrumbList (page-specific Service will live in RoofCareClub component)
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://sonshineroofing.com';
  const pageUrl = `${base}${SEO_CANONICAL_ROOF_MAINT}`;

  const webPageLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: SEO_TITLE_ROOF_MAINT,
    description: SEO_DESCRIPTION_ROOF_MAINT,
    url: pageUrl,
    primaryImageOfPage: { '@type': 'ImageObject', url: `${base}${SEO_OG_IMAGE_DEFAULT}` },
    isPartOf: { '@type': 'WebSite', name: 'SonShine Roofing', url: base },
  } as const;
  const faqLd = faqItemsToJsonLd(
    faqs.map((f) => ({ question: f.title, answerHtml: f.contentHtml, url: `${base}/faq/${f.slug}` })),
    pageUrl
  );

  const breadcrumbsLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
      { '@type': 'ListItem', position: 2, name: 'Roof Maintenance', item: pageUrl },
    ],
  } as const;

  return (
    <Section>
      <div className="grid px-2 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">
        <div id="article-root" className="prose min-w-0">
          <h1>Roof Maintenance</h1>
          {/* JSON-LD: WebPage + BreadcrumbList */}
          <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }}
          />
          <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }}
          />
          <h2 className={scrollGuard}>
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

          <RoofCareClub />

        </div>

        <ServicesAside />
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

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
    </Section>
  );
}
