"use client";

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronDown, HelpCircle } from "lucide-react";
import UiLink from "./UiLink";

const lessFatCta = "btn btn-brand-blue btn-lg w-full sm:w-auto";

type Item = {
  slug: string;
  title: string;
  contentHtml: string;
};

export type FaqInlineListClientItem = Item;

type Props = {
  heading: string;
  seeMoreHref: string;
  items: Item[];
};

export default function FaqInlineListClient({ heading, seeMoreHref, items }: Props) {
  const detailRefs = useRef<Array<HTMLDetailsElement | null>>([]);
  const [allOpen, setAllOpen] = useState(false);

  const safeItems = useMemo(() => items ?? [], [items]);

  useEffect(() => {
    detailRefs.current = detailRefs.current.slice(0, safeItems.length);
  }, [safeItems.length]);

  const syncAllOpenState = useCallback(() => {
    const nodes = detailRefs.current.filter(Boolean);
    if (nodes.length === 0) {
      setAllOpen(false);
      return;
    }
    setAllOpen(nodes.every((node) => node?.open));
  }, []);

  useEffect(() => {
    const nodes = detailRefs.current.filter(Boolean);
    nodes.forEach((node) => node?.addEventListener("toggle", syncAllOpenState));
    syncAllOpenState();
    return () => {
      nodes.forEach((node) => node?.removeEventListener("toggle", syncAllOpenState));
    };
  }, [safeItems, syncAllOpenState]);

  const handleToggleAll = () => {
    const next = !allOpen;
    detailRefs.current.forEach((node) => {
      if (!node) return;
      if (next) {
        node.setAttribute("open", "");
      } else {
        node.removeAttribute("open");
      }
    });
    setAllOpen(next);
  };

  const assignRef = useCallback((index: number) => (node: HTMLDetailsElement | null) => {
    detailRefs.current[index] = node;
  }, []);

  if (!safeItems.length) return null;

  return (
    <div className="mt-40 mb-8 px-2" data-toc-exclude>
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-center text-3xl font-semibold text-slate-800 sm:text-left md:text-4xl">
          <HelpCircle
            className="mr-1 inline h-7 w-7 text-[--brand-blue] md:h-9 md:w-9"
            aria-hidden="true"
          />
          {heading}
        </h2>
        <button
          type="button"
          onClick={handleToggleAll}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[--brand-blue] bg-white px-4 py-2 text-sm font-semibold text-[--brand-blue] transition hover:bg-[--brand-blue]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--brand-blue] focus-visible:ring-offset-2 sm:w-auto"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          {safeItems.filter((_, idx) => idx % 2 === 0).map((faq, idx) => (
            <FaqItem
              key={faq.slug}
              ref={assignRef(idx * 2)}
              title={faq.title}
              contentHtml={faq.contentHtml}
            />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          {safeItems.filter((_, idx) => idx % 2 === 1).map((faq, idx) => (
            <FaqItem
              key={faq.slug}
              ref={assignRef(idx * 2 + 1)}
              title={faq.title}
              contentHtml={faq.contentHtml}
            />
          ))}
        </div>
      </div>
      <div className="mt-12 text-center md:text-right">
        <UiLink href="/blog" className={lessFatCta} title="See All FAQs">
          See All FAQs
          <ArrowRight className="h-4 w-4 inline ml-2" />
        </UiLink>
      </div>
    </div>
  );
}

type FaqItemProps = {
  title: string;
  contentHtml: string;
};

const FaqItem = forwardRef<HTMLDetailsElement, FaqItemProps>(function FaqItem(
  { title, contentHtml },
  ref,
) {
  return (
    <details
      ref={ref}
      className="group not-prose w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors duration-200 ease-out group-open:border-[--brand-blue] group-open:bg-[--brand-blue]/5 group-open:shadow-md"
    >
      <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3 transition-colors duration-200 ease-out hover:bg-slate-50">
        <span className="flex items-center gap-2 text-left text-base font-medium text-slate-900">
          {title}
        </span>
        <ChevronDown
          className="h-5 w-5 transform transition-transform duration-200 ease-out group-open:rotate-180 group-open:scale-110"
          aria-hidden="true"
        />
      </summary>
      <div
        className="accordion-motion prose prose-sm px-4 pb-4 pt-0 text-slate-700"
        dangerouslySetInnerHTML={{ __html: contentHtml || "" }}
      />
    </details>
  );
});
