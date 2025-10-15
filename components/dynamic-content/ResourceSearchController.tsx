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
 * Dynamically loads the shared filtering module and delegates mount/cleanup.
 */
export default function ResourceSearchController({ kind, ids, urlKeys, minQueryLen = 2 }: Props) {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    import("./useResourceFilters")
      .then((mod) => {
        if (cancelled) return;
        const mount = mod.mountResourceFilters;
        if (typeof mount === "function") {
          cleanup = mount(kind, { ids, urlKeys, minQueryLen, defer: false });
        } else {
          console.warn("[ResourceSearchController] mountResourceFilters not found");
        }
      })
      .catch((e) => {
        console.error("[ResourceSearchController] failed to mount filters", e);
      });

    return () => {
      cancelled = true;
      try { cleanup?.(); } catch {}
    };
  }, [ids, kind, minQueryLen, urlKeys]);

  return null;
}
