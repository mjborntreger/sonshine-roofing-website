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
const PAGE_TITLE = "60-sec Roof Quote | SonShine Roofing";
const PAGE_DESCRIPTION =
  "Get a 60-sec roof replacement quote from SonShine Roofing using QuickQuote satellite measurements.";

export async function generateMetadata(): Promise<Metadata> {
  return buildBasicMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    keywords: [
      "60-sec roof quote",
      "roof replacement quote",
      "roofing quote",
      "roof replacement estimate",
      "free roofing estimate",
      "new roof estimate",
      "new roof quote",
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
      { name: "60-sec Roof Quote", item: PAGE_PATH },
    ],
    { origin },
  );

  return (
    <>
      <Hero
        title="60-sec Roof Quote"
        eyelash="Roof Replacement Estimates"
        subtitle="Use our 60-sec quote tool to request a roof replacement estimate with satellite measurements and quick follow-up."
        justifyStart={true}
        badges={[
          { icon: Zap, label: "Fast & Free" },
          { icon: Calculator, label: "Satellite Measurements" },
          { icon: Home, label: "Residential Roofing" },
          { icon: ShieldCheck, label: "Quick Follow-up" },
        ]}
      />

      <Section>
        <JsonLd data={webPageLd} />
        <JsonLd data={breadcrumbsLd} />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">
          <div className="min-w-0">
            <QuickQuoteWebForm />
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
