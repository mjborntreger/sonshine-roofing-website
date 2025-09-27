import { listFaqsWithContent } from "@/lib/wp";
import FaqInlineListClient, { type FaqInlineListClientItem } from "./FaqInlineListClient";

type FaqInlineItem = {
  slug: string;
  title: string;
  contentHtml: string;
  date?: string | null;
};

type Props = {
  heading?: string;
  seeMoreHref?: string;
  /** Optional FAQ topic slug to load from WordPress (e.g., "roof-repair"). */
  topicSlug?: string;
  /** Maximum number of FAQs to display. Defaults to 8. */
  limit?: number;
  /** Preloaded FAQs (e.g., reused server data fetched for JSON-LD). */
  initialItems?: FaqInlineItem[];
};

const parseDate = (value?: string | null): number => {
  if (!value) return 0;
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
};

export default async function FaqInlineList({
  heading = "FAQs",
  seeMoreHref = "/faq",
  topicSlug,
  limit = 8,
  initialItems,
}: Props) {
  let records = initialItems;

  if (!records || records.length === 0) {
    records = await listFaqsWithContent(limit, topicSlug).catch(() => []);
  }

  if (!records || records.length === 0) return null;

  const items: FaqInlineListClientItem[] = [...records]
    .sort((a, b) => parseDate(b.date) - parseDate(a.date))
    .slice(0, limit)
    .map((faq) => ({
      slug: faq.slug,
      title: faq.title,
      contentHtml: faq.contentHtml,
    }));

  return (
    <FaqInlineListClient
      heading={heading}
      seeMoreHref={seeMoreHref}
      items={items}
    />
  );
}
