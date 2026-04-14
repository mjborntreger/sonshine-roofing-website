"use client";

import Head from "next/head";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Phone, ShieldCheck } from "lucide-react";
import SmartLink from "@/components/utils/SmartLink";
import Image from "next/image";
import LeadForm from "@/components/lead-capture/lead-form/LeadForm";
import { LeadFormFallback } from "@/components/lead-capture/lead-form/Fallback";
import { restoreLeadSuccessState, type LeadSuccessRestore } from "@/components/lead-capture/lead-form/config";

const VIDEO_SRC = "https://next.sonshineroofing.com/wp-content/uploads/Landing-Page-Hero-Spin-Effect-2025.webm";
const POSTER_SRC = "https://next.sonshineroofing.com/wp-content/uploads/landing-hero-fallback.webp";

type HeroProps = {
  title?: string
};

export default function Hero({ title = "The BEST Roofing Company in Sarasota, Manatee, and Charlotte Counties for Over 39 Years" }: HeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [shouldShowVideo, setShouldShowVideo] = useState(false);
  const restoredSuccess = useMemo<LeadSuccessRestore | null>(() => restoreLeadSuccessState(), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const target = sectionRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldShowVideo(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldShowVideo) return;
    const el = videoRef.current;
    if (!el) return;
    if (!el.src) {
      el.src = VIDEO_SRC;
      el.load();
    }
    el.play().catch(() => {
      /* ignore autoplay failures */
    });
  }, [shouldShowVideo]);

  return (
    <>
      <Head>
        <link rel="preload" as="image" href={POSTER_SRC} />
      </Head>

      <section
        ref={sectionRef}
        className="relative h-auto overflow-hidden text-white isolate">
        {/* Fallback image (paints immediately; video swaps in after intersection) */}
        <Image
          src={POSTER_SRC}
          alt="Landing Page Hero Poster Fallback"
          aria-hidden="true"
          className="absolute inset-0 object-cover w-full h-full -z-10"
          width={1280}
          height={720}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />

        {/* Background video (lazy-loaded via IntersectionObserver) */}
        <video
          ref={videoRef}
          className="absolute inset-0 object-cover w-full h-full pointer-events-none -z-10"
          autoPlay
          muted
          loop
          preload="none"
          playsInline
          aria-hidden="true"
          poster={POSTER_SRC}
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 -z-[5] bg-black/45"
        />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-[1440px] px-4 pb-32 pt-24 md:pt-32 not-prose">
          <div className="grid gap-10 items-center lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)]">
            <div className="max-w-3xl text-center lg:pb-8 lg:text-left">
              <div>
                <p className="font-display sm:mt-16 text-2xl font-semibold text-[--brand-cyan] sm:text-4xl">
                  Since 1987, we&apos;ve got you covered.
                </p>
                <SmartLink
                  href="https://www.myfloridalicense.com/LicenseDetail.asp?SID=&id=601EB27C16D2369E36FD9B81C20A0755"
                  showExternalIcon
                  className="mt-4 font-semibold text-xs md:text-sm tracking-wider text-green-300">
                  <ShieldCheck className="mr-1 inline h-3 w-3 text-[--brand-cyan]" />
                  INSURED | LICENSE #CCC1331483
                </SmartLink>
              </div>

              <h1 className="my-8 text-3xl sm:4xl leading-[3rem] text-blue-50 md:leading-[5rem] md:text-7xl lg:leading-[7rem]">
                {title}
              </h1>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                <SmartLink
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-100/50 bg-[--brand-blue] px-8 py-4 text-xl sm:text-3xl font-semibold tracking-wide text-white transition hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 phone-affordance"
                  href="/contact-us"
                  title="Contact SonShine Roofing"
                  aria-label="Contact SonShine Roofing"
                >
                  <Phone className="h-4 w-4 sm:h-6 sm:w-6 inline mr-1 phone-affordance-icon" />
                  Contact Us
                </SmartLink>
                <SmartLink
                  className="backdrop-blur-sm inline-flex items-center gap-2 rounded-xl border border-white/40 px-8 py-4 text-xl sm:text-3xl font-semibold tracking-wide text-white transition hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 phone-affordance"
                  href="/about-sonshine-roofing"
                  title="About SonShine Roofing"
                  aria-label="About SonShine Roofing"
                  data-icon-affordance="right"
                >
                  Learn More
                  <ArrowRight className="h-4 w-4 sm:h-6 sm:w-6 inline ml-1 icon-affordance" />
                </SmartLink>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[520px] lg:mx-0 lg:justify-self-end">
              <Suspense fallback={<LeadFormFallback />}>
                <LeadForm restoredSuccess={restoredSuccess} variant="heroEmbedded" />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
