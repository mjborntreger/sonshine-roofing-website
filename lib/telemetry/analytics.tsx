"use client";

import { useEffect } from "react";
import Script from "next/script";

import type { GtmWindow } from "@/lib/telemetry/gtm";

const META_PIXEL_ID = "2016926932216879";

function ensureGtmGlobals(win: GtmWindow) {
  win.dataLayer = win.dataLayer ?? [];
  win.__gtmQueue = win.__gtmQueue ?? [];
  if (typeof win.__gtmLoaded !== "boolean") {
    win.__gtmLoaded = false;
  }
}

export function flushQueuedEvents(win: GtmWindow) {
  if (!win.dataLayer) {
    win.dataLayer = [];
  }
  const queue = win.__gtmQueue;
  if (!queue || queue.length === 0) return;

  while (queue.length > 0) {
    const event = queue.shift();
    if (event) {
      win.dataLayer.push(event);
    }
  }
}

export default function AnalyticsScripts() {
  const GTM = process.env.NEXT_PUBLIC_GTM_ID;
  // Enable only in production by default; allow preview on staging if explicitly toggled
  const ENABLED =
    process.env.NEXT_PUBLIC_ENV === "production" ||
    process.env.NEXT_PUBLIC_ENABLE_GTM_PREVIEW === "true";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const win = window as GtmWindow;
    ensureGtmGlobals(win);
  }, []);

  if (!GTM || !ENABLED) return null;

  return (
    <>
      {/* Google Tag Manager – head snippet (lazyOnload) */}
      <Script
        id="gtm-init"
        strategy="lazyOnload"
        onLoad={() => {
          if (typeof window === "undefined") return;
          const win = window as GtmWindow;
          ensureGtmGlobals(win);
          win.__gtmLoaded = true;
          flushQueuedEvents(win);
        }}
        onReady={() => {
          if (typeof window === "undefined") return;
          const win = window as GtmWindow;
          ensureGtmGlobals(win);
          win.__gtmLoaded = true;
          flushQueuedEvents(win);
        }}
      >
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM}');
        `}
      </Script>
      {/* Meta Pixel */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
          fbq('track', 'Contact');
          fbq('track', 'Lead');
        `}
      </Script>
      {/* Google Tag Manager (noscript) – place near start of body */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
