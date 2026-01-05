"use client";
import React, { useEffect, useRef, useState } from "react";
import { requireEnv } from "@/lib/seo/site";

type TurnstileCallback = (token: string) => void;

type TurnstileRenderOptions = {
  sitekey: string;
  theme?: "auto" | "light" | "dark";
  size?: "normal" | "compact";
  action?: string;
  cData?: string;
  callback?: TurnstileCallback;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

type TurnstileId = string | number | null | undefined;

interface TurnstileAPI {
  render?: (container: HTMLElement, options: TurnstileRenderOptions) => string | number;
  reset?: (id?: TurnstileId) => void;
  remove?: (id?: TurnstileId) => void;
  execute?: (id?: TurnstileId) => void;
}

type TurnstileWindow = Window & {
  turnstile?: TurnstileAPI;
  __turnstileScriptLoaded?: boolean;
} & Record<string, TurnstileCallback>;

const asTurnstileWindow = (): TurnstileWindow => window as unknown as TurnstileWindow;

/**
 * Cloudflare Turnstile wrapper (TS-safe with existing global types)
 * - Avoids redeclaring window.turnstile (conflicts with other components)
 * - Uses guarded access to render/reset/remove to satisfy varying typings
 */

type TurnstileProps = {
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

const PUBLIC_SITE_KEY = (requireEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", { prodOnly: true }) || "").trim();

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
      const win = asTurnstileWindow();
      win.__turnstileScriptLoaded = true;
      setScriptReady(true);
    };

    // If API already present, we're good
    if (asTurnstileWindow().turnstile) {
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

    const win = asTurnstileWindow();
    const ts = win.turnstile;
    if (!ts) return; // still not ready

    // Clear previous instance if any
    if (widgetIdRef.current != null) {
      try { ts.remove?.(widgetIdRef.current); } catch {}
      widgetIdRef.current = null;
    }

    const containerEl = containerRef.current;
    if (!containerEl) return;

    if (typeof ts.render === "function") {
      // Explicit render path
      widgetIdRef.current = ts.render(containerEl, {
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
      win[cbName] = (tok: string) => setToken(tok);
      el.setAttribute("data-callback", cbName);

      containerEl.innerHTML = "";
      containerEl.appendChild(el);

      // Some builds expose execute() to trigger auto render
      try { ts.execute?.(); } catch {}

      return () => {
        try { delete win[cbName]; } catch {}
        containerEl.innerHTML = "";
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
