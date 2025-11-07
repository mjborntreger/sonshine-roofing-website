"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { ChevronDown } from "lucide-react";
import SmartLink from "../../utils/SmartLink";
import ShinyText from "./ShinyText";
import { scrollToAnchor } from "@/lib/ui/scroll-to-anchor";

type HeroProps = {
  title?: string
};

export default function Hero({ title = "The Best Roofing Company in Sarasota, Manatee, and Charlotte Counties for Over 38 Years" }: HeroProps) {
  const [shouldAnimateArrow, setShouldAnimateArrow] = useState(false);

  const handleCtaKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key !== " ") return;
    event.preventDefault();
    scrollToAnchor("get-started");
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setShouldAnimateArrow(true), 400);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <section
        className="relative h-auto overflow-hidden text-white isolate">
        {/* Background video */}
        <video
          className="absolute inset-0 object-cover w-full h-full pointer-events-none -z-10 motion-safe:opacity-100 motion-reduce:hidden"
          src="https://next.sonshineroofing.com/wp-content/uploads/website-background-video-hero-optimized-new.webm"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        // poster="/fallback.jpg" // optional: add a poster for faster first paint
        />

        {/* Transparent gradient overlay for legibility */}
        <div className="pointer-events-none absolute rounded-t-[192px] inset-x-0 h-[125%] top-[-180px] overflow-hidden bottom-8 -z-10 bg-gradient-to-b from-black/95 via-black/70 to-black/40" />



        {/* Content */}
        <div className="px-4 pt-16 mx-auto text-center text-white max-w-8xl not-prose">

          <ShinyText
            text="Since 1987 we've got you covered"
            className="mt-16 mb-16 text-3xl lg:mb-24 font-script md:text-3xl lg:text-7xl"
            disabled={false}
            speed={2.5}
          >
          </ShinyText>

          <h1 className="max-w-6xl mx-auto text-4xl md:text-5xl lg:text-7xl justify-center font-display font-bold md:leading-[5rem] lg:leading-[6rem] mb-4 text-white">
            {title}
          </h1>
        </div>
        <SmartLink
          className="hero-cta-glow relative mt-16 md:mt-32 lg:mt-32 flex w-full flex-col items-center bg-[--brand-blue] py-4 md:py-8 px-6 md:px-12 text-center shadow-sm no-underline transition-colors duration-700 hover:shadow-lg hover:bg-[#003EC1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--brand-cyan] md:p-6"
          href="#get-started"
          onKeyDown={handleCtaKeyDown}
          aria-label="Scroll to the quick roofing quiz"
        >
          <h2 className="py-2 text-3xl text-white md:text-6xl">
            Get Started
          </h2>
          <div className="mt-4 text-sm text-slate-200 md:text-lg">
            Just takes one minute. No commitment required.
          </div>
          <div className="mt-2">
            <span className="sr-only">Scroll to the quick roofing quiz below</span>
            <ChevronDown
              className={`h-8 w-8 text-white md:h-12 md:w-12 ${shouldAnimateArrow ? "chevron-bob" : ""}`}
              aria-hidden="true"
            />
          </div>
        </SmartLink>
      </section>
    </>
  );
}
