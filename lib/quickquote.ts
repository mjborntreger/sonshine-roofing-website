"use client";

import { useEffect } from "react";

type QuickQuoteWindow = Window & {
  __qqDesiredTriggerVisible?: boolean;
  QuickQuote?: { render?: (opts: unknown) => unknown };
};

const QQ_TOGGLE_EVENT = "qq:toggle-trigger";
const QQ_HIDDEN_CLASS = "qq-hide-quickquote";

let suppressCount = 0;

const dispatchTriggerVisibility = (shouldShow: boolean) => {
  if (typeof window === "undefined") return;
  try {
    const win = window as QuickQuoteWindow;
    win.__qqDesiredTriggerVisible = shouldShow;
    window.dispatchEvent(new CustomEvent(QQ_TOGGLE_EVENT, { detail: { show: shouldShow } }));
  } catch {
    // ignore environments where CustomEvent is blocked
  }
};

const applyVisibility = () => {
  const shouldHide = suppressCount > 0;

  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (shouldHide) root.classList.add(QQ_HIDDEN_CLASS);
    else root.classList.remove(QQ_HIDDEN_CLASS);

    const portal = document.getElementById("qq-slideout-portal-root");
    if (portal) portal.style.display = shouldHide ? "none" : "";
  }

  dispatchTriggerVisibility(!shouldHide);
};

/**
 * Temporarily hide the QuickQuote trigger/widget. Returns a cleanup function.
 * Supports nesting via an internal ref-count.
 */
export function suppressQuickQuote(): () => void {
  suppressCount += 1;
  applyVisibility();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    suppressCount = Math.max(0, suppressCount - 1);
    applyVisibility();
  };
}

/**
 * Hide QuickQuote whenever the flag is true; automatically restores on cleanup.
 */
export function useQuickQuoteHidden(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return undefined;
    const release = suppressQuickQuote();
    return release;
  }, [isActive]);
}

/**
 * Attempts to open the QuickQuote slide-out.
 * Returns true if the widget was opened (trigger found and clicked), false otherwise.
 */
export function openQuickQuoteSlideout(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  const clickTrigger = () => {
    const trigger = document.querySelector<HTMLButtonElement>(".qq-slideout-trigger");
    if (!trigger) return false;
    trigger.click();
    return true;
  };

  // First, try to click an already-mounted trigger.
  if (clickTrigger()) return true;

  // If not mounted yet, try to render the slideout once, then retry.
  const qq = (window as QuickQuoteWindow).QuickQuote;
  if (qq?.render) {
    try {
      qq.render({ mode: "slideout" });
    } catch {
      // swallow; will fall through to false
    }
  }

  return clickTrigger();
}
