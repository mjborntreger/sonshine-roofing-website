"use client";

import SmartLink from "@/components/SmartLink";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { NavMenu } from "./NavMenu";
import { cn } from "@/lib/utils";

const HEADER_COLLAPSE_THRESHOLD = 140; // tweak this to adjust when the header compresses
const HEADER_EXPAND_THRESHOLD = 60; // below this scroll position the header expands again
const UTILITY_BREAKPOINT_CLASS = "flex"; // tweak this Tailwind breakpoint for the utility strip visibility

export default function Header() {
  const ref = useRef<HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const setVar = () => {
      const headerHeight = el.offsetHeight;
      const anchorPadding = Math.max(headerHeight - 12, 0);
      root.style.setProperty("--header-h", `${headerHeight}px`);
      root.style.setProperty("--sticky-offset", `${anchorPadding}px`);
    };
    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      setCollapsed((prev) => {
        if (prev) {
          return scrollY <= HEADER_EXPAND_THRESHOLD ? false : true;
        }
        return scrollY >= HEADER_COLLAPSE_THRESHOLD ? true : false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={ref}
      className={cn(
        "sticky top-0 z-50 border-b border-slate-300 bg-neutral-50 transition-all duration-200",
        collapsed ? "shadow-md" : "shadow-none"
      )}
      data-collapsed={collapsed}
    >
      <div
        className={cn(
          "hidden w-full",
          UTILITY_BREAKPOINT_CLASS
        )}
      >
      </div>
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 transition-all duration-200",
          collapsed ? "py-[0.125rem]" : "py-4"
        )}
      >
        <SmartLink
          href="/"
          className={cn(
            "flex items-center gap-2 transition-transform duration-200 ease-out",
            collapsed ? "scale-[0.7]" : "scale-100"
          )}
        >
          <Image
            src="https://next.sonshineroofing.com/wp-content/uploads/sonshine-logo-Small-1.webp"
            alt="SonShine Roofing Logo"
            aria-label="SonShine Roofing Logo"
            width={120}
            height={50}
            sizes="(max-width: 120px) 20vw, 768px"
            loading="eager"
            priority
            fetchPriority="high"
          />
        </SmartLink>
        <NavMenu />
      </div>
    </header>
  );
}
