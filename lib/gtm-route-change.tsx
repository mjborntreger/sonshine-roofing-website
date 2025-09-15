

"use client";

/**
 * GTM route-change tracker for Next.js App Router (Hardened)
 * ---------------------------------------------------------
 * Goals:
 * - Emit EXACTLY one `page_view` per unique virtual URL (initial load + SPA navigations).
 * - Deduplicate under React Strict Mode double-mount and double `pushState` calls.
 * - Create a stable URL signature (sorted query params, ignores Tag Assistant params).
 * - Label pushes with `source: "react-client"` so GTM can safely whitelist them.
 *
 * GTM setup:
 * - GA4 Config: disable auto page view (send_page_view = false).
 * - GA4 Event tag: trigger on Custom Event `page_view` with condition `source == react-client`.
 */

import { useEffect } from "react";
import {
  usePathname,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";

// Keys to ignore when building the signature so Tag Assistant / GA linker noise
// doesn't create distinct signatures.
const IGNORE_QS = new Set([
  "gtm_debug",
  "gtm_preview",
  "gtm_auth",
  "_gl",
  "_ga",
]);

declare global {
  interface Window {
    dataLayer?: any[];
    __pvSigSent?: Set<string>; // global cache of signatures that already pushed
  }
}

const ENABLED =
  process.env.NEXT_PUBLIC_ENV === "production" ||
  process.env.NEXT_PUBLIC_ENABLE_GTM_PREVIEW === "true";

function buildSignature(
  pathname: string | null,
  search: ReadonlyURLSearchParams | null
) {
  const p = pathname || "/";
  if (!search) return p;
  const pairs = Array.from<[string, string]>(search.entries())
    .filter(([k]) => !IGNORE_QS.has(k.toLowerCase()))
    .sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
  if (!pairs.length) return p;
  const qs = pairs
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return `${p}?${qs}`;
}

export default function GtmRouteChange() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!ENABLED) return;

    const sig = buildSignature(pathname, searchParams);

    // Ensure global Set exists and check idempotency across remounts/effects.
    window.__pvSigSent ??= new Set<string>();
    if (window.__pvSigSent.has(sig)) return;
    window.__pvSigSent.add(sig);

    // Ensure dataLayer exists and push after paint so title is accurate.
    window.dataLayer = window.dataLayer || [];
    requestAnimationFrame(() => {
      window.dataLayer!.push({
        event: "page_view",
        source: "react-client", // use this to whitelist in GTM
        page_location: window.location.href,
        page_path: pathname || "/",
        page_title: document.title || undefined,
      });
    });
  }, [pathname, searchParams]);

  return null;
}
