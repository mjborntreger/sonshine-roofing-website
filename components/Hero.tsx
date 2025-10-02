"use client";

import { useEffect, useState } from "react";
import { ArrowDown, Phone, Zap } from "lucide-react"
import SmartLink from "./SmartLink";

export default function Hero() {
  const [shouldAnimateArrow, setShouldAnimateArrow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShouldAnimateArrow(true), 800);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <section className="relative isolate text-white min-h-[50svh] lg:min-h-[80svh] h-auto">
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
          bg-gradient-to-t from-black/80 via-black/70 to-black/50
        "
        />

        {/* Content */}
        <div className="mx-auto max-w-7xl px-6 md:px-8 py-16 md:py-36 not-prose">
          <div className="max-w-7xl text-center">
            <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold text-white">
              Your Trusted Local Roofing Contractor in Sarasota, Manatee, and Charlotte Counties for 38+ Years
            </h1>

            <p className="mt-5 text-white text-md md:text-2xl max-w-7xl">
              We prioritize extending the lifespan of your current roof.<br></br>
              Call us today to find out more.
            </p>

            <div className="mt-16 flex flex-wrap gap-3 justify-center">

              <SmartLink
                href="#get-started"
                aria-label="Get started"
                className="inline-flex btn btn-brand-orange btn-lg md:btn-hero items-center"
                data-icon-affordance="down"
              >
                Get Started
                <span
                  className={`ml-2 inline-flex hero-arrow transition-transform ${shouldAnimateArrow ? "hero-arrow-animate" : ""}`}
                  aria-hidden="true"
                >
                  <ArrowDown className="icon-affordance h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
                </span>
              </SmartLink>

            </div>
          </div>
        </div>
      </section>
      <div className="h-1.5 w-full bg-gradient-to-r from-[#0045d7] via-[#00e3fe] to-[#0045d7]" />
    </>
  );
}
