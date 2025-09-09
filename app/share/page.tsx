

import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Share Complete • SonShine Roofing",
  robots: { index: false, follow: false },
};

function getFallbackUrl() {
  if (typeof document !== "undefined" && document.referrer) return document.referrer;
  if (typeof window !== "undefined") return `${window.location.origin}/`;
  return "/";
}

// Small client component that tries to close the popup and shows a friendly fallback
function Closer() {
  "use client";
  const [triedClose, setTriedClose] = React.useState(false);
  const [canClose, setCanClose] = React.useState(false);

  React.useEffect(() => {
    // If this window was opened via window.open, window.opener exists and most browsers allow closing it
    try {
      const openedByScript = typeof window !== "undefined" && !!window.opener;
      setCanClose(!!openedByScript);
      // Give the dialog a tick to render before attempting to close
      window.setTimeout(() => {
        if (openedByScript) {
          window.close();
        }
        setTriedClose(true);
      }, 120);
    } catch {
      setTriedClose(true);
    }
  }, []);

  const fallbackUrl = getFallbackUrl();

  return (
    <div className="min-h-[60vh] w-full grid place-items-center p-6">
      <div className="card max-w-md w-full p-6 text-center">
        <h1 className="text-2xl font-semibold">Thanks for sharing!</h1>
        <p className="mt-2 text-slate-600">
          You can safely close this window. {canClose ? "It should close automatically." : "Your browser blocked auto‑close."}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              try { window.close(); } catch {}
            }}
            className="btn btn-brand-blue btn-md btn-press"
          >
            Close Window
          </button>

          <a href={fallbackUrl} className="btn btn-secondary btn-md btn-press">
            Return to Site
          </a>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          If this window doesn’t close, use the button above or just close the tab.
        </p>
      </div>
    </div>
  );
}

export default function SharePage() {
  return <Closer />;
}