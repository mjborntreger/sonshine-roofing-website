"use client";

import { useEffect } from "react";

import { pushToDataLayer } from "@/lib/telemetry/gtm";
import { trackMetaPixel } from "@/lib/telemetry/meta";

function findTelAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  if (!target || !(target instanceof Element)) return null;
  return target.closest<HTMLAnchorElement>('a[href^="tel:"]');
}

export default function PhoneClickListener() {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const anchor = findTelAnchor(event.target);
      if (!anchor) return;

      const telHref = anchor.getAttribute("href") || "";
      const normalized = telHref.trim();
      if (!normalized.toLowerCase().startsWith("tel:")) return;

      // Fire Meta Pixel standard events
      trackMetaPixel("Lead");
      trackMetaPixel("Contact");

      // Push to GTM for consistent analytics
      pushToDataLayer({
        event: "tel_click",
        tel_href: normalized,
      });
    };

    document.addEventListener("click", handler, { capture: true });
    return () => document.removeEventListener("click", handler, { capture: true });
  }, []);

  return null;
}
