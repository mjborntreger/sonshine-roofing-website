"use client";

import { useEffect } from "react";
import type { ResourceKind } from "./useResourceFilters";

type Ids = {
  query: string;
  grid: string;
  chips: string;
  skeleton: string;
  noResults: string;
  resultCount?: string;
};
type UrlKeys = Record<string, string>;
type Props = {
  kind: ResourceKind;
  ids: Ids;
  urlKeys: UrlKeys;
  minQueryLen?: number;
};

/**
 * Small controller that mounts resource filter logic after hydration.
 * Defers work to `requestIdleCallback` (with a timeout + setTimeout fallback)
 * so we don't block interactivity. Also returns the cleanup from the mounted
 * filters to remove listeners on unmount or route change.
 */
export default function ResourceSearchController({ kind, ids, urlKeys, minQueryLen = 2 }: Props) {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const run = () => {
      import("./useResourceFilters")
        .then((mod) => {
          if (cancelled) return;
          const mount = mod.mountResourceFilters;
          if (typeof mount === "function") {
            cleanup = mount(kind, { ids, urlKeys, minQueryLen });
          } else {
            console.warn("[ResourceSearchController] mountResourceFilters not found");
          }
        })
        .catch((e) => {
          console.error("[ResourceSearchController] failed to mount filters", e);
        });
    };

    // Prefer idle to avoid blocking hydration/paint
    let idleId: number | undefined;
    let timer: number | undefined;

    if (typeof window !== "undefined" && (window as any).requestIdleCallback) {
      idleId = (window as any).requestIdleCallback(run, { timeout: 1200 });
    } else {
      // Fallback: next tick
      timer = window.setTimeout(run, 0);
    }

    return () => {
      cancelled = true;
      try { cleanup?.(); } catch {}
      if (idleId != null && (window as any).cancelIdleCallback) {
        try { (window as any).cancelIdleCallback(idleId); } catch {}
      }
      if (timer != null) {
        clearTimeout(timer);
      }
    };
  }, [kind]);

  return null;
}