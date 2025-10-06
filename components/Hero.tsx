"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { ChevronDown } from "lucide-react";
import SmartLink from "./SmartLink";
import ShinyText from "./ShinyText";
import { scrollToAnchor } from "@/lib/scroll-to-anchor";

export default function Hero() {
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
        className="overflow-hidden relative isolate h-auto min-h-[98svh] text-white">
        {/* Background video */}
        <video
          className="absolute inset-0 -z-10 h-full w-full object-cover pointer-events-none motion-safe:opacity-100 motion-reduce:hidden"
          src="https://next.sonshineroofing.com/wp-content/uploads/website-background-video-hero-optimized-new.webm"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        // poster="/fallback.jpg" // optional: add a poster for faster first paint
        />

        {/* Transparent gradient overlay for legibility */}
        <div
          className="
          pointer-events-none absolute bottom-8 rounded-t-[192px] inset-x-0 h-[125%] top-[-180px] overflow-hidden bottom-8 -z-10
          bg-gradient-to-b from-black/95 via-black/60 to-black/10"
        />

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-neutral-50 via-neutral-50/30 to-transparent -z-10"
        />

        {/* Content */}
        <div className="text-white max-w-8xl mx-auto px-4 text-center not-prose py-16">

          <ShinyText
            text="Since 1987 we've got you covered"
            className="mt-6 mb-16 lg:mb-24 font-script text-2xl md:text-3xl lg:text-4xl"
            disabled={false}
            speed={2.5}
          >
          </ShinyText>

          <h1 className="max-w-6xl mx-auto text-4xl md:text-5xl lg:text-6xl justify-center font-bold md:leading-[5rem] lg:leading-[5rem] mb-4 text-white">
            Your Trusted Local Roofing Contractor in Sarasota, Manatee, and Charlotte Counties for Over 38 Years
          </h1>
          <p className="text-[--brand-cyan]">
            We extend the lifespan of your roof above all else.
          </p>

          <SmartLink
            className="hero-cta-glow relative bounce mt-16 md:mt-32 lg:mt-32 mb-8 mx-auto flex w-fit flex-col items-center rounded-3xl border border-white/80 bg-[--brand-blue] py-4 md:py-8 px-6 md:px-12 text-center shadow-lg no-underline transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--brand-cyan] md:p-6"
            href="#get-started"
            onKeyDown={handleCtaKeyDown}
            aria-label="Scroll to the quick roofing quiz"
          >
            <div className="mb-3 px-6 text-sm uppercase tracking-tight text-slate-300 md:text-md">
              Step 1: Let's get you squared away
            </div>
            <div className="shadow-sm py-2 text-4xl font-bold md:text-6xl">
              Get Started
            </div>
            <div className="mt-4 text-md text-[--brand-cyan] md:text-lg">
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
        </div>
      </section>
    </>
  );
}
