"use client";

import Script from "next/script";

export default function AnalyticsScripts() {
  const GA_ID = process.env.NEXT_PUBLIC_GA4_ID;
  const CLARITY = process.env.NEXT_PUBLIC_CLARITY_ID;
  const GTM = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <>
      {GA_ID && (
        <>
          <Script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
          <Script id="ga4-init">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { send_page_view: true });
            `}
          </Script>
        </>
      )}

      {CLARITY && (
        <Script id="clarity-init">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName('script')[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY}");
          `}
        </Script>
      )}

      {GTM && (
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
            <iframe src={`https://www.googletagmanager.com/ns.html?id=${GTM}`} height="0" width="0" style={{display:"none",visibility:"hidden"}}></iframe>
          </noscript>
        </>
      )}
    </>
  );
}
