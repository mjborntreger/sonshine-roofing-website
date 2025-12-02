"use client";

import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import ShinyText from "./ShinyText";
import SmartLink from "@/components/utils/SmartLink";
import Image from "next/image";

const VIDEO_SRC = "https://next.sonshineroofing.com/wp-content/uploads/Landing-Page-Hero-Spin-Effect-2025.webm";
const POSTER_SRC = "https://next.sonshineroofing.com/wp-content/uploads/landing-hero-fallback.webp";

type HeroProps = {
  title?: string
};

export default function Hero({ title = "The Best Roofing Company in Sarasota, Manatee, and Charlotte Counties for Over 38 Years" }: HeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [shouldShowVideo, setShouldShowVideo] = useState(false);

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

        {/* Content */}
        <div className="px-4 pt-8 mx-auto text-center text-white max-w-8xl not-prose">
          <div className="mt-4">
            <ShinyText
              text="SonShine Roofing"
              className="mt-8 text-5xl font-script lg:text-6xl"
              disabled={false}
              speed={2.5}
            >
            </ShinyText>
            <p className="font-display md:text-lg font-semibold text-blue-400">Since 1987, we&apos;ve got you covered</p>
          </div>

          <h1 className="my-8 max-w-6xl mx-auto text-4xl md:text-5xl lg:text-7xl justify-center md:leading-[5rem] lg:leading-[6rem] text-blue-50">
            {title}
          </h1>

          <SmartLink
            className="block hover:scale-[1.02] phone-affordance hover:bg-neutral-800/50 transition-all duration-300 py-3 md:py-6 px-6 md:px-10 w-fit border border-opacity-60 border-white mx-auto rounded-2xl bg-neutral-800/30 backdrop-blur z-10 mb-[11rem]"
            href="/contact-us"
            title="Contact SonShine Roofing"
            aria-label="Contact SonShine Roofing"
            data-icon-affordance="right"
          >

            <p className="items-center font-display mb-2 font-semibold text-3xl md:text-5xl tracking-wider text-blue-100 hover:scale-[1.02] transition-transform">
              
              Contact Us
              <ArrowRight className="icon-affordance items-center text-[--brand-cyan] h-6 w-6 md:h-8 md:w-8 inline ml-2" />
            </p>
            <p className="mb-1 font-extralight text-xs tracking-wider text-green-400">
              <ShieldCheck className="text-[--brand-cyan] h-3 w-3 inline mr-1" />
              INSURED | LICENSE #CCC1331483
            </p>
          </SmartLink>
        </div>
      </section>
    </>
  );
}
