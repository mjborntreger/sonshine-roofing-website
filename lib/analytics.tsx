"use client";

import Script from "next/script";

export default function AnalyticsScripts() {
  const GTM = process.env.NEXT_PUBLIC_GTM_ID;
  // Enable only in production by default; allow preview on staging if explicitly toggled
  const ENABLED =
    process.env.NEXT_PUBLIC_ENV === "production" ||
    process.env.NEXT_PUBLIC_ENABLE_GTM_PREVIEW === "true";

  if (!GTM || !ENABLED) return null;

  return (
    <>
      <Script id="gtm-init">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM}');
        `}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}
