import type { Metadata } from "next";
import { Calculator, Home, ShieldCheck, Zap } from "lucide-react";
import FaqInlineList from "@/components/dynamic-content/faq/FaqInlineList";
import ResourcesAside from "@/components/global-nav/static-pages/ResourcesAside";
import Section from "@/components/layout/Section";
import YouMayAlsoLike from "@/components/engagement/YouMayAlsoLike";
import QuickQuoteWebForm from "@/components/lead-capture/quickquote/QuickQuoteWebForm";
import Hero from "@/components/ui/Hero";
import { JsonLd } from "@/lib/seo/json-ld";
import { buildBasicMetadata } from "@/lib/seo/meta";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { SITE_ORIGIN } from "@/lib/seo/site";
import { listFaqsWithContent, listRecentPostsPool } from "@/lib/content/wp";

export const revalidate = 900;

const PAGE_PATH = "/instant-quote";
const PAGE_TITLE = "Instant Roof Quote | SonShine Roofing";
const PAGE_DESCRIPTION =
  "Get a fast instant roof replacement estimate from SonShine Roofing using QuickQuote satellite measurements.";

export async function generateMetadata(): Promise<Metadata> {
  return buildBasicMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    keywords: [
      "instant roof quote",
      "roof replacement estimate",
      "roofing quote Sarasota",
      "QuickQuote roofing",
      "SonShine Roofing estimate",
    ],
    image: { url: "/og-default.png", width: 1200, height: 630 },
  });
}

export default async function InstantQuotePage() {
  const [pool, faqs] = await Promise.all([
    listRecentPostsPool(36).catch(() => []),
    listFaqsWithContent(8).catch(() => []),
  ]);

  const origin = SITE_ORIGIN;
  const webPageLd = webPageSchema({
    name: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_PATH,
    origin,
    primaryImage: "/og-default.png",
    isPartOf: { "@type": "WebSite", name: "SonShine Roofing", url: origin },
  });
  const breadcrumbsLd = breadcrumbSchema(
    [
      { name: "Home", item: "/" },
      { name: "Instant Quote", item: PAGE_PATH },
    ],
    { origin },
  );

  return (
    <>
      <Hero
        title="Instant Roof Quote"
        eyelash="Roof Replacement Estimates"
        subtitle="Use our instant quote tool to request a fast roof replacement estimate with satellite measurements and local SonShine Roofing follow-up."
        badges={[
          { icon: Zap, label: "Fast Estimate" },
          { icon: Calculator, label: "Satellite Measurements" },
          { icon: Home, label: "Residential Roofing" },
          { icon: ShieldCheck, label: "Local Follow-up" },
        ]}
      />

      <Section>
        <JsonLd data={webPageLd} />
        <JsonLd data={breadcrumbsLd} />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">
          <div className="min-w-0">
            <div className="rounded-md border border-blue-100 bg-white p-3 shadow-sm sm:p-5">
              <QuickQuoteWebForm />
            </div>
          </div>

          <ResourcesAside activePath={PAGE_PATH} />
        </div>

        <div data-toc-exclude>
          <YouMayAlsoLike
            posts={pool}
            heading="Learn More Before Your Roofing Estimate"
          />
        </div>

        <FaqInlineList
          heading="Roofing FAQs"
          limit={8}
          initialItems={faqs}
          seeMoreHref="/faq"
        />
      </Section>
    </>
  );
}
