"use client";

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
  const qq = (window as unknown as { QuickQuote?: { render?: (opts: unknown) => unknown } }).QuickQuote;
  if (qq?.render) {
    try {
      qq.render({ mode: "slideout" });
    } catch {
      // swallow; will fall through to false
    }
  }

  return clickTrigger();
}
