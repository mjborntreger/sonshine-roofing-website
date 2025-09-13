// components/FaqInlineList.tsx
// Server component: renders a compact FAQ list using <details>/<summary>.
// Keeps styles aligned with Financing + FAQ archive patterns.
import { ArrowRight } from "lucide-react";
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
  return (
    <div className="mb-8 px-2" data-toc-exclude>
      <h2 className="text-3xl text-center md:text-5xl font-semibold text-slate-900">{heading}</h2>
      <div className="mt-12 space-y-4 md:columns-2 md:gap-4 [column-fill:_balance]">
        {items.map((f, i) => (
          <details
            key={f.slug || i}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm w-full break-inside-avoid"
          >
            <summary className="cursor-pointer font-medium text-slate-900">
              {f.title}
            </summary>
            <div
              className="mt-2 text-slate-700 prose prose-sm"
              dangerouslySetInnerHTML={{ __html: f.contentHtml || "" }}
            />
          </details>
        ))}
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

