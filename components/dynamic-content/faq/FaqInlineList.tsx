import { listFaqs } from "@/lib/content/directus-faqs";
import { JsonLd } from "@/lib/seo/json-ld";
import { faqSchema } from "@/lib/seo/schema";
import { SITE_ORIGIN } from "@/lib/seo/site";
import FaqInlineListClient, { type FaqInlineListClientItem } from "@/components/dynamic-content/faq/FaqInlineListClient";

type FaqInlineItem = {
  id: string;
  title: string;
  contentHtml: string;
};

type Props = {
  heading?: string;
  seeMoreHref?: string;
  /** Current page path. Directus returns global FAQs plus FAQs linked to this page. */
  pagePath?: string;
  /** Maximum number of FAQs to display. Defaults to 8. */
  limit?: number;
  /** Preloaded FAQs (e.g., reused server data fetched for JSON-LD). */
  initialItems?: FaqInlineItem[];
  /** Override the canonical origin when required (defaults to SITE_ORIGIN). */
  origin?: string;
};

export default async function FaqInlineList({
  heading = "FAQs",
  seeMoreHref = "/faq",
  pagePath,
  limit = 8,
  initialItems,
  origin: originOverride,
}: Props) {
  let records = initialItems;

  if (!records || records.length === 0) {
    records = await listFaqs({ pagePath, limit }).catch(() => []);
  }

  if (!records || records.length === 0) return null;

  const items: FaqInlineListClientItem[] = records.slice(0, limit).map((faq) => ({
    id: faq.id,
    title: faq.title,
    contentHtml: faq.contentHtml,
  }));

  const origin = originOverride ?? SITE_ORIGIN;
  const normalizedSeeMoreHref =
    seeMoreHref.length > 1 && seeMoreHref.endsWith("/") ? seeMoreHref.slice(0, -1) : seeMoreHref;

  const schemaData = faqSchema(
    items.map((faq) => ({
      question: faq.title,
      answerHtml: faq.contentHtml,
      url: `${normalizedSeeMoreHref}#faq-${faq.id}`,
    })),
    {
      origin,
      url: seeMoreHref,
    },
  );

  return (
    <>
      <FaqInlineListClient
        heading={heading}
        seeMoreHref={seeMoreHref}
        items={items}
      />
      <JsonLd data={schemaData} />
    </>
  );
}
