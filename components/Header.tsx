"use client";

import SmartLink from "@/components/SmartLink";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSelectedLayoutSegments } from "next/navigation";
import { NavMenu } from "./NavMenu";
import { cn } from "@/lib/utils";

const HEADER_COLLAPSE_THRESHOLD = 140; // tweak this to adjust when the header compresses
const HEADER_EXPAND_THRESHOLD = 60; // below this scroll position the header expands again
const UTILITY_BREAKPOINT_CLASS = "flex"; // tweak this Tailwind breakpoint for the utility strip visibility
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function Header() {
  const ref = useRef<HTMLElement>(null);
  const segments = useSelectedLayoutSegments();
  const initialLanding = segments.length === 0;
  const [scrollState, setScrollState] = useState(() => ({
    collapsed: false,
    progress: initialLanding ? 0 : 1,
  }));
  const stateRef = useRef(scrollState);
  const isLanding = segments.length === 0;

  useEffect(() => {
    stateRef.current = scrollState;
  }, [scrollState]);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const setVar = () => {
      const headerHeight = el.offsetHeight;
      const anchorPadding = Math.max(headerHeight - 24, 0);
      root.style.setProperty("--header-h", `${headerHeight}px`);
      root.style.setProperty("--sticky-offset", `${anchorPadding}px`);
    };
    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const getEffectiveScrollY = () => {
      const native = window.scrollY;
      if (native > 0) return native;

      const bodyStyleTop = document.body.style.top;
      if (document.body.style.position === "fixed" && bodyStyleTop) {
        const locked = Math.abs(parseFloat(bodyStyleTop));
        if (!Number.isNaN(locked)) return locked;
      }

      const computedBody = window.getComputedStyle(document.body);
      if (computedBody.position === "fixed") {
        const locked = Math.abs(parseFloat(computedBody.top || "0"));
        if (!Number.isNaN(locked)) return locked;
      }

      return native;
    };

    const handleScroll = () => {
      const scrollY = getEffectiveScrollY();
      const prev = stateRef.current;

      let nextCollapsed = prev.collapsed;
      if (prev.collapsed) {
        if (scrollY <= HEADER_EXPAND_THRESHOLD) {
          nextCollapsed = false;
        }
      } else if (scrollY >= HEADER_COLLAPSE_THRESHOLD) {
        nextCollapsed = true;
      }

      const nextProgress = isLanding ? (nextCollapsed ? 1 : 0) : 1;

      if (nextCollapsed !== prev.collapsed || nextProgress !== prev.progress) {
        const nextState = { collapsed: nextCollapsed, progress: nextProgress } as const;
        stateRef.current = nextState;
        setScrollState(nextState);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLanding]);

  const { collapsed, progress } = scrollState;
  const backgroundOpacity = isLanding ? progress : 1;
  const isTransparent = isLanding && backgroundOpacity === 0;
  const isOverlay = isLanding;
  const headerBackground = `rgba(245, 245, 245, ${backgroundOpacity})`;
  const headerBorder = `rgba(226, 232, 240, ${backgroundOpacity})`;
  const backdropBlur = backgroundOpacity > 0 ? `blur(${6 + backgroundOpacity * 6}px)` : "blur(0px)";
  const expandedLogo = "https://next.sonshineroofing.com/wp-content/uploads/sonshine-logo-final-1.webp";
  const collapsedLogo = "https://next.sonshineroofing.com/wp-content/uploads/sonshine-logo-2.webp";
  const logoSrc = !collapsed && isLanding
    ? collapsedLogo
    : expandedLogo;

  return (
    <header
      ref={ref}
      className={cn(
        "z-50 border-b w-full",
        isOverlay ? "fixed top-0 left-0" : "sticky top-0",
        ready
          ? "transition-[background-color,border-color,backdrop-filter,box-shadow] duration-200 ease-out"
          : "transition-none",
        collapsed ? "shadow-md" : "shadow-none"
      )}
      style={{
        backgroundColor: headerBackground,
        borderColor: headerBorder,
        backdropFilter: backdropBlur,
        WebkitBackdropFilter: backdropBlur,
      }}
      data-collapsed={collapsed}
      data-scroll-lock-aware="true"
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
            src={logoSrc}
            alt="SonShine Roofing Logo"
            aria-label="SonShine Roofing Logo"
            width={120}
            height={50}
            sizes="(max-width: 120px) 20vw, 768px"
            loading="eager"
            priority
            fetchPriority="high"
            className="h-[50px]"
          />
        </SmartLink>
        <NavMenu transparent={isTransparent} />
      </div>
    </header>
  );
}
