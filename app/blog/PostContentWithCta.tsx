import * as React from "react";
import SmartLink from "@/components/SmartLink";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  html: string;
  injectAfter?: number; // default 3rd paragraph
};

export default function PostContentWithCta({ html, injectAfter = 3 }: Props) {
  // Robust split on closing </p>, case-insensitive & GLOBAL
  const rawParts = html.split(/<\/p>/ig);

  // Re-attach </p> to all but last and drop empty chunks
  const blocks = rawParts
    .map((part, i) => (i < rawParts.length - 1 ? part + "</p>" : part))
    .filter((s) => s && s.trim().length > 0);

  const children: React.ReactNode[] = [];

  function Cta() {
    return (
      <div className="my-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
        <span className="pointer-events-none absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#0045d7] to-[#00e3fe]" />
        <h3 className="m-0 text-xl font-semibold text-slate-900">Book a Free Estimate</h3>
        <p className="mt-2 text-slate-600">
          Since 1987 we’ve got you covered — schedule a fast, no-pressure visit.
        </p>
        <SmartLink
          href="/contact-us"
          className={cn(buttonVariants({ variant: "brandBlue" }), "mt-4")}
        >
          Get started
        </SmartLink>
      </div>
    );
  }

  blocks.forEach((chunk, i) => {
    children.push(
      <div
        key={`chunk-${i}`}
        // Browsers might normalize whitespace/entities differently; avoid hydration diffs
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: chunk }}
      />
    );
    if (i === injectAfter - 1) children.push(<Cta key="cta" />);
  });

  if (blocks.length < injectAfter) {
    children.push(<Cta key="cta-fallback" />);
  }

  return <article className="prose">{children}</article>;
}
