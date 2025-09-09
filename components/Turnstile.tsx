"use client";
import React, { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile wrapper (TS-safe with existing global types)
 * - Avoids redeclaring window.turnstile (conflicts with other components)
 * - Uses guarded access to render/reset/remove to satisfy varying typings
 */

export type TurnstileProps = {
  siteKey?: string; // defaults to NEXT_PUBLIC_TURNSTILE_SITE_KEY
  theme?: "auto" | "light" | "dark";
  size?: "normal" | "compact";
  action?: string;
  cdata?: string;
  hiddenInputName?: string; // defaults to cfToken
  className?: string;
  autoRetryOnError?: boolean; // default true
  autoRefreshOnExpire?: boolean; // default true
};

const PUBLIC_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

export default function Turnstile({
  siteKey = PUBLIC_SITE_KEY,
  theme = "auto",
  size = "normal",
  action,
  cdata,
  hiddenInputName = "cfToken",
  className,
  autoRetryOnError = true,
  autoRefreshOnExpire = true,
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | number | null>(null);
  const [token, setToken] = useState("");
  const [scriptReady, setScriptReady] = useState<boolean>(false);

  // Inject Turnstile script once
  useEffect(() => {
    if (typeof window === "undefined") return;

    const markReady = () => {
      (window as any).__turnstileScriptLoaded = true;
      setScriptReady(true);
    };

    // If API already present, we're good
    if ((window as any).turnstile) {
      markReady();
      return;
    }

    // If a script tag already exists, wait for it to load instead of assuming readiness
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]'
    );
    if (existing) {
      existing.addEventListener("load", markReady, { once: true });
      return () => existing.removeEventListener("load", markReady);
    }

    // Otherwise, inject our own script
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.addEventListener("load", markReady, { once: true });
    document.head.appendChild(s);

    return () => {
      s.removeEventListener("load", markReady);
    };
  }, []);

  // Render widget when ready
  useEffect(() => {
    if (!scriptReady) return;
    if (!containerRef.current) return;
    if (!siteKey) {
      console.warn("Turnstile: missing NEXT_PUBLIC_TURNSTILE_SITE_KEY or siteKey prop");
      return;
    }

    const ts: any = (typeof window !== "undefined" ? (window as any).turnstile : undefined);
    if (!ts) return; // still not ready

    // Clear previous instance if any
    if (widgetIdRef.current != null) {
      try { ts.remove?.(widgetIdRef.current); } catch {}
      widgetIdRef.current = null;
    }

    if (typeof ts.render === "function") {
      // Explicit render path
      widgetIdRef.current = ts.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size,
        action,
        cData: cdata,
        callback: (tok: string) => {
          setToken(tok);
        },
        "expired-callback": () => {
          setToken("");
          if (autoRefreshOnExpire) {
            try { ts.reset?.(widgetIdRef.current ?? undefined); } catch {}
          }
        },
        "error-callback": () => {
          setToken("");
          if (autoRetryOnError) {
            setTimeout(() => {
              try { ts.reset?.(widgetIdRef.current ?? undefined); } catch {}
            }, 600);
          }
        },
      });

      return () => {
        try { ts.remove?.(widgetIdRef.current ?? undefined); } catch {}
        widgetIdRef.current = null;
      };
    } else {
      // Auto-mode fallback: create the cf-turnstile element
      const el = document.createElement("div");
      el.className = "cf-turnstile";
      el.setAttribute("data-sitekey", siteKey);
      if (theme) el.setAttribute("data-theme", theme);
      if (size) el.setAttribute("data-size", size);
      if (action) el.setAttribute("data-action", action);
      if (cdata) el.setAttribute("data-cdata", cdata);

      // Temporary global callback to capture token
      const cbName = `ts_cb_${Math.random().toString(36).slice(2)}`;
      (window as any)[cbName] = (tok: string) => setToken(tok);
      el.setAttribute("data-callback", cbName);

      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(el);

      // Some builds expose execute() to trigger auto render
      try { ts.execute?.(); } catch {}

      return () => {
        try { delete (window as any)[cbName]; } catch {}
        if (containerRef.current) containerRef.current.innerHTML = "";
      };
    }
  }, [scriptReady, siteKey, theme, size, action, cdata, autoRefreshOnExpire, autoRetryOnError]);

  return (
    <div className={className}>
      {/* Hidden input so normal form posts include the token */}
      <input type="hidden" name={hiddenInputName} value={token} readOnly />
      {/* The visible widget */}
      <div ref={containerRef} />
    </div>
  );
}
