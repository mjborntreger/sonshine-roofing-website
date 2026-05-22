"use client";

import { useEffect } from "react";

function isModifiedClick(event: MouseEvent) {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

function decodeHash(hash: string) {
  const value = hash.startsWith("#") ? hash.slice(1) : hash;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function findHashTarget(hash: string) {
  const id = decodeHash(hash);
  return document.getElementById(id) ?? document.getElementsByName(id)[0] ?? null;
}

function isTopHash(hash: string) {
  const id = decodeHash(hash).toLowerCase();
  return id === "" || id === "top" || id === "page-top";
}

function getSameDocumentHashUrl(anchor: HTMLAnchorElement) {
  const rawHref = anchor.getAttribute("href");
  if (!rawHref || !rawHref.includes("#")) return null;
  if (anchor.hasAttribute("download")) return null;

  const target = anchor.getAttribute("target");
  if (target && target.toLowerCase() !== "_self") return null;

  let url: URL;
  try {
    url = new URL(anchor.href);
  } catch {
    return null;
  }
  const current = window.location;

  if (url.origin !== current.origin) return null;
  if (url.pathname !== current.pathname) return null;
  if (url.search !== current.search) return null;

  return url;
}

export default function HashAnchorScroller() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || isModifiedClick(event)) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      const url = getSameDocumentHashUrl(anchor);
      if (!url) return;

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const behavior: ScrollBehavior = prefersReducedMotion ? "auto" : "smooth";
      const topHash = isTopHash(url.hash);
      const hashTarget = topHash ? null : findHashTarget(url.hash);
      if (!topHash && !hashTarget) return;

      event.preventDefault();

      if (topHash) {
        window.scrollTo({ top: 0, left: 0, behavior });
      } else if (hashTarget) {
        hashTarget.scrollIntoView({ behavior, block: "start" });
      }

      if (window.location.hash !== url.hash) {
        window.history.pushState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return null;
}
