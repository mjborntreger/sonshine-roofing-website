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
        className="relative isolate h-auto min-h-[99svh] supports-[height:99svh]:min-h-[99svh] text-white">
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
          pointer-events-none absolute inset-0 -z-10
          bg-gradient-to-b from-black/80 via-black/70 to-black/50
        "
        />

        {/* Content */}
        <div className="text-white max-w-7xl mx-auto px-4 text-center not-prose py-16 md:py-36">
          <h1 className="text-4xl pt-16 md:pt-0 md:text-[4rem] lg:text-[5.4rem] font-bold leading-[3.4rem] md:leading-[6rem] lg:leading-[7.2rem] text-white">
            Your Trusted Local Roofing Contractor in Sarasota, Manatee, and Charlotte Counties for 38+ Years
          </h1>

          <p className="mt-8 text-slate-100 text-md md:text-2xl max-w-7xl">
            We prioritize extending the lifespan of your roof.
            <br />
            Follow the 4-step process below to find out more.
          </p>

          <div className="mt-4 flex justify-center mx-auto">
            <SmartLink
              href="#get-started"
              onKeyDown={handleCtaKeyDown}
              aria-label="Scroll to the quick roofing quiz"
              role="button"
              className="backdrop-blur transition duration-300 ease-out hover:scale-105 w-full focus-visible:scale-105 border border-white/15 bg-white/10 px-6 py-3 group/card mx-auto pointer-events-auto absolute bottom-0 left-0 flex flex-col items-center justify-center"
            >
              <ShinyText
                text="Step 1: Let's get you squared away"
                disabled={false}
                speed={2.5}
                className="text-sm uppercase tracking-wider text-white/70 font-accent custom-class"
                aria-hidden="true"
              >
              </ShinyText>
              <p className="text-2xl md:text-5xl mt-3 font-semibold text-white">
                Ready for a tailored roofing plan?
              </p>
              <p className="mt-6 text-2xl text-white/75">
                Takes less than a minute. No commitment.
              </p>
              <span className="sr-only">Scroll to the quick roofing quiz below</span>
              <ChevronDown
                className="h-8 w-8 mt-12 text-white/80 motion-safe:animate-hero-cue"
                aria-hidden="true"
              />
            </SmartLink>
          </div>

        </div>
      </section>
      <div className="h-1.5 w-full bg-gradient-to-r from-[#0045d7] via-[#00e3fe] to-[#0045d7]" />
    </>
  );
}
