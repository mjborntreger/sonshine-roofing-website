"use client";

import SmartLink from "@/components/utils/SmartLink";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSelectedLayoutSegments } from "next/navigation";
import { NavMenu } from "./NavMenu";
import { cn } from "@/lib/utils";
import { Phone } from "lucide-react";

const HEADER_COLLAPSE_THRESHOLD = 140; // tweak this to adjust when the header compresses
const HEADER_EXPAND_THRESHOLD = 60; // below this scroll position the header expands again
const UTILITY_BREAKPOINT_CLASS = "flex"; // tweak this Tailwind breakpoint for the utility strip visibility
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function Header() {
  const ref = useRef<HTMLElement>(null);
  const segments = useSelectedLayoutSegments();
  const locationSlug =
    segments[0] === "locations" && typeof segments[1] === "string" ? segments[1] : null;
  // Keep the hero logo pointed at the active location so nested location routes stay scoped.
  const logoHref = locationSlug ? `/locations/${locationSlug}` : "/";
  const initialLanding = segments.length === 0;
  const [scrollState, setScrollState] = useState(() => ({
    collapsed: false,
    progress: initialLanding ? 0 : 1,
  }));
  const stateRef = useRef(scrollState);
  const isLanding =
    segments.length === 0 ||
    (segments[0] === "locations" && segments.length === 2);

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
  const headerBackground = `rgba(236, 254, 255, ${backgroundOpacity})`;
  const headerBorder = `rgba(191, 219, 254, ${backgroundOpacity})`;
  const backdropBlur = backgroundOpacity > 0 ? `blur(${6 + backgroundOpacity * 6}px)` : "blur(0px)";
  const expandedLogo = "https://next.sonshineroofing.com/wp-content/uploads/SonShine-Website-Logo-Blue.webp";
  const collapsedLogo = "https://next.sonshineroofing.com/wp-content/uploads/SonShine-Website-Logo-Orange.webp";
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
        collapsed ? "shadow-sm" : "shadow-none"
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
          "mx-auto flex max-w-7xl items-center flex-row gap-4 px-4 transition-all duration-300 ease-in-out",
          collapsed ? "py-[0.125rem]" : "py-[0.4rem]"
        )}
      >
        <SmartLink
          href={logoHref}
          className={cn("flex items-center gap-2 transition-transform duration-200 ease-out",
            collapsed ? "scale-[0.8]" : "scale-100"
          )}


        >
          <Image
            src={logoSrc}
            alt="SonShine Roofing Logo"
            aria-label="SonShine Roofing Logo"
            width={106}
            height={40}
            sizes="(max-width: 120px) 20vw, 768px"
            loading="eager"
            priority
            fetchPriority="high"
            className="h-[40px]"
          />
        </SmartLink>
        <SmartLink className="align-baseline phone-affordance text-right" href="tel:+19418664320">
          <div className="bg-orange-500 hover:bg-orange-400 transition-colors text-white border shadow-sm md:hidden border-white text-xs font-medium rounded-lg px-3 py-1 phone">
            <Phone className="phone-affordance-icon inline h-3 w-3 mr-1" />
            (941) 866-4320
          </div>
        </SmartLink>
        <NavMenu transparent={isTransparent} />
      </div>
    </header>
  );
}
