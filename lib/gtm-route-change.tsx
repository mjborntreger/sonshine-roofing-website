

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

type DataLayerEvent = {
  event: string;
  [key: string]: unknown;
};

type GtmWindow = Window & {
  dataLayer?: DataLayerEvent[];
  __pvSigSent?: Set<string>;
};

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

    const win = window as GtmWindow;

    // Ensure global Set exists and check idempotency across remounts/effects.
    win.__pvSigSent ??= new Set<string>();
    if (win.__pvSigSent.has(sig)) return;
    win.__pvSigSent.add(sig);

    // Ensure dataLayer exists and push after paint so title is accurate.
    win.dataLayer = win.dataLayer ?? [];
    requestAnimationFrame(() => {
      const layer = win.dataLayer ?? [];
      layer.push({
        event: "page_view",
        source: "react-client", // use this to whitelist in GTM
        page_location: window.location.href,
        page_path: pathname || "/",
        page_title: document.title || undefined,
      });
      win.dataLayer = layer;
    });
  }, [pathname, searchParams]);

  return null;
}
