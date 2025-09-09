import type { Metadata } from "next";
import Script from "next/script";
import * as React from "react";

export const metadata: Metadata = {
  title: "Share Complete • SonShine Roofing",
  robots: { index: false, follow: false },
};

export default function SharePage() {
  const fallback = "/"; // server-safe default; script refines it client-side
  return (
    <>
      <main className="min-h-[60vh] w-full grid place-items-center p-6">
        <div className="card max-w-md w-full p-6 text-center">
          <h1 className="text-2xl font-semibold">Thanks for sharing!</h1>
          <p className="mt-2 text-slate-600">
            You can safely close this window. <span id="autoCloseMsg">It should close automatically.</span>
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => { try { window.close(); } catch {} }}
              className="btn btn-brand-blue btn-md btn-press"
            >
              Close Window
            </button>

            <a id="fallbackLink" href={fallback} className="btn btn-secondary btn-md btn-press">
              Return to Site
            </a>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            If this window doesn’t close, use the button above or just close the tab.
          </p>
        </div>
      </main>

      <Script id="share-autoclose" strategy="afterInteractive">
        {`
          (function(){
            try {
              var openedByScript = !!window.opener;
              var link = document.getElementById('fallbackLink');
              var msg = document.getElementById('autoCloseMsg');
              var ref = document.referrer;
              var base = location.origin + '/';
              if (link) link.setAttribute('href', ref || base);

              if (openedByScript) {
                setTimeout(function(){ window.close(); }, 120);
              } else {
                if (msg) msg.textContent = "Your browser blocked auto‑close.";
              }
            } catch(e) {
              var msg = document.getElementById('autoCloseMsg');
              if (msg) msg.textContent = "Your browser blocked auto‑close.";
            }
          })();
        `}
      </Script>
    </>
  );
}