import Section from "@/components/layout/Section";
import TocFromHeadings from "@/components/TocFromHeadings";
import ServicesQuickLinks from "@/components/ServicesQuickLinks";
import UiLink from "@/components/UiLink";
import Image from "next/image";
import { listRecentPostsPool, listFaqsWithContent, faqItemsToJsonLd } from "@/lib/wp";
import FaqInlineList from "@/components/FaqInlineList";
import YouMayAlsoLike from "@/components/YouMayAlsoLike";
import TipTopRoofCheckup from "@/components/TipTopRoofCheckup";
import type { Metadata } from 'next';

const scrollGuard = "scroll-mt-24";

// ===== STATIC SEO FOR /roof-inspection (EDIT HERE) =====
const SEO_TITLE_ROOF_INSPECTION = 'Roof Inspection in Sarasota, Manatee & Charlotte Counties | SonShine Roofing';
const SEO_DESCRIPTION_ROOF_INSPECTION = 'Licensed roof inspections to catch hidden leaks and extend roof life. Serving Southwest Florida since 1987.';
const SEO_KEYWORDS_ROOF_INSPECTION = [
  'roof inspection',
  'roof evaluation',
  'leak detection',
  'roof checkup',
  'Sarasota roofing',
  'Manatee County roofing',
  'Charlotte County roofing'
];
const SEO_CANONICAL_ROOF_INSPECTION = '/roof-inspection';
const SEO_OG_IMAGE_DEFAULT = '/og-default.png';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: SEO_TITLE_ROOF_INSPECTION,
    description: SEO_DESCRIPTION_ROOF_INSPECTION,
    keywords: SEO_KEYWORDS_ROOF_INSPECTION,
    alternates: { canonical: SEO_CANONICAL_ROOF_INSPECTION },
    openGraph: {
      type: 'website',
      title: SEO_TITLE_ROOF_INSPECTION,
      description: SEO_DESCRIPTION_ROOF_INSPECTION,
      url: SEO_CANONICAL_ROOF_INSPECTION,
      images: [{ url: SEO_OG_IMAGE_DEFAULT, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: SEO_TITLE_ROOF_INSPECTION,
      description: SEO_DESCRIPTION_ROOF_INSPECTION,
      images: [SEO_OG_IMAGE_DEFAULT],
    },
  };
}

export default async function Page() {
  const pool = await listRecentPostsPool(36);
  const faqs = await listFaqsWithContent(8, "roof-inspection").catch(() => []);

  // JSON-LD: WebPage + BreadcrumbList (HowTo will live in TipTopRoofCheckup component)
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://sonshineroofing.com';
  const pageUrl = `${base}${SEO_CANONICAL_ROOF_INSPECTION}`;

  const webPageLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: SEO_TITLE_ROOF_INSPECTION,
    description: SEO_DESCRIPTION_ROOF_INSPECTION,
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
      { '@type': 'ListItem', position: 2, name: 'Roof Inspection', item: pageUrl },
    ],
  } as const;

  return (
    <Section>
      <div className="grid gap-4 px-2 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">
        <div id="article-root" className="prose min-w-0">
          <span id="page-top" className="sr-only" />
          <h1>Roof Inspection</h1>
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

          <h2 className={scrollGuard}>Why Do I Need a Roof Inspection?</h2>
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

          <TipTopRoofCheckup />

          <h2 className={scrollGuard}>Roofs Can Leak for Years Before You See Evidence</h2>
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
              <strong>Nathan Borntreger</strong> — Owner of SonShine Roofing • Insured • LIC: #CCC1331483 | <a className="text-[--brand-blue]" href="/person/nathan-borntreger">See full bio</a>
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
            Comprehensive roof inspections become even more critical during tough economic times,
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
          <div className="mt-6">
            <a href="#page-top" className="text-sm text-slate-600 hover:text-[#0045d7]">Back to top ↑</a>
          </div>
        </div>

        <aside className="sticky top-24 self-start h-fit lg:w-[320px]">
          <ServicesQuickLinks />

          <TocFromHeadings
            root="#article-root"
            offset={128}
            className="hidden lg:block" />
          
          <div className="mt-4 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm not-prose">
            <div className="mb-2 text-sm font-semibold text-slate-900 text-center">Ready to get started?</div>
            <UiLink
              href="/contact-us#book-an-appointment"
              className="btn btn-brand-blue btn-press w-full h-11"
              aria-label="Schedule an Inspection">
              Schedule an Inspection
            </UiLink>
            <UiLink
              href="tel:19418664320"
              className="h-11 mt-2 rounded-xl border border-slate-200 grid place-items-center hover:bg-slate-50"
              aria-label="Call SonShine Roofing">
              (941) 866-4320
            </UiLink>
          </div>

        </aside>
      </div>

      <div data-toc-exclude>
        <YouMayAlsoLike
          posts={pool}
          category="roof-inspection"
          excludeSlug={''}
        />
      </div>

      {/* FAQs (dynamic) */}
      <FaqInlineList heading="Roof Inspection FAQs" items={faqs} seeMoreHref="/faq" />

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
    </Section>
  );
}
