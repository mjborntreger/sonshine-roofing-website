"use client";

import SmartLink from "@/components/SmartLink";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { NavMenu } from "./NavMenu";

export default function Header() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const setVar = () =>
      document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-neutral-50 border-b border-slate-300">
      <div className="h-1.5 w-full bg-gradient-to-r from-[#0045d7] via-[#00e3fe] to-[#0045d7]" />
      <div ref={ref} className="w-full max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <SmartLink href="/" className="flex items-center gap-2">
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
