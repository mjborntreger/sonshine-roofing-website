

"use client";

/**
 * GTM route-change tracker for Next.js App Router
 * ------------------------------------------------
 * Fires a `page_view` event into dataLayer on initial load and on SPA route changes.
 * 
 * GTM setup:
 * - EITHER: Use a GA4 Event tag triggered on Custom Event `page_view` and map params.
 * - OR: Keep GA4 Config tag with page_view disabled, and trigger a GA4 Event on `page_view`.
 *   (Do not double-fire with a History Change trigger.)
 */

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    dataLayer?: any[];
  }
}

const ENABLED =
  process.env.NEXT_PUBLIC_ENV === "production" ||
  process.env.NEXT_PUBLIC_ENABLE_GTM_PREVIEW === "true";

function pushPageView() {
  if (typeof window === "undefined") return;
  // Ensure dataLayer exists
  window.dataLayer = window.dataLayer || [];

  const href = window.location.href;
  const path = window.location.pathname + window.location.search;
  const title = document.title || undefined;

  window.dataLayer.push({
    event: "page_view",
    page_location: href,
    page_path: path,
    page_title: title,
  });
}

export default function GtmRouteChange() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastSig = useRef<string>("");

  useEffect(() => {
    if (!ENABLED) return;
    // Build a signature from path + search to avoid firing on hash-only changes.
    const search = searchParams?.toString() ?? "";
    const sig = `${pathname ?? ""}${search ? `?${search}` : ""}`;

    if (sig === lastSig.current) return;
    lastSig.current = sig;

    // Slight delay helps when the title updates right after navigation
    const t = setTimeout(() => pushPageView(), 0);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  return null;
}