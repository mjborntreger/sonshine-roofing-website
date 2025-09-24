// components/FaqInlineList.tsx
// Server component: compact FAQ list using semantic <details>/<summary>.
// Styled to match service pages (blue icons + animated chevrons).
import { ArrowRight, HelpCircle, ChevronDown } from "lucide-react";
type Item = { title: string; contentHtml: string; slug?: string };

export default function FaqInlineList({
  items,
  heading = "FAQs",
  seeMoreHref = "/faq",
}: {
  items: Item[];
  heading?: string;
  seeMoreHref?: string;
}) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const renderItem = (f: Item, i: number) => (
    <details
      key={f.slug || i}
      className="group not-prose rounded-xl border border-slate-200 bg-white shadow-sm w-full"
    >
      <summary className="flex items-center justify-between cursor-pointer select-none p-4">
        <span className="flex items-center gap-2">
          <span className="m-0 font-medium text-slate-900">{f.title}</span>
        </span>
        <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div
        className="prose prose-sm px-4 pb-4 pt-0 text-slate-700"
        dangerouslySetInnerHTML={{ __html: f.contentHtml || "" }}
      />
    </details>
  );
  return (
    <div className="mt-40 mb-8 px-2" data-toc-exclude>
      <h2 className="text-3xl text-center md:text-4xl font-semibold text-slate-800 flex items-center justify-center gap-2">
        {/* Heading icon (tweak size/color here) */}
        <HelpCircle className="h-7 mr-1 inline w-7 md:h-9 md:w-9 text-[--brand-blue]" aria-hidden="true" />
        {heading}
      </h2>
      {/* Use two flex columns so each column's height is independent and items never jump columns */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          {items.filter((_, i) => i % 2 === 0).map((f, i) => renderItem(f, i))}
        </div>
        <div className="flex flex-col gap-4">
          {items.filter((_, i) => i % 2 === 1).map((f, i) => renderItem(f, i))}
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <a href={seeMoreHref} className="not-prose btn btn-brand-blue btn-press px-4 py-2" aria-label="See more FAQs">
          See more FAQs
          <ArrowRight className="h-4 w-4"/>
        </a>
      </div>
    </div>
  );
}
