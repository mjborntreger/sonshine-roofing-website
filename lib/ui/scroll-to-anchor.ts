const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

/**
 * Reads the shared --sticky-offset CSS custom property and converts it to a pixel number.
 * Returns 0 on failure so callers always receive a numeric value.
 */
function readStickyOffset(): number {
  if (!isBrowser) return 0;
  const styles = getComputedStyle(document.documentElement);
  const raw = styles.getPropertyValue("--sticky-offset").trim();
  if (!raw) return 0;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveTarget(targetOrId: string | HTMLElement | null): HTMLElement | null {
  if (!isBrowser || !targetOrId) return null;
  if (targetOrId instanceof HTMLElement) return targetOrId;
  const trimmed = targetOrId.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("#")) {
    return document.querySelector(trimmed) as HTMLElement | null;
  }
  const byId = document.getElementById(trimmed.startsWith(".") ? trimmed.slice(1) : trimmed);
  if (byId) return byId;
  return document.querySelector(trimmed) as HTMLElement | null;
}

function prefersReducedMotion(): boolean {
  if (!isBrowser || !window.matchMedia) return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function scrollWindowTo(target: HTMLElement, offset: number, behavior: ScrollBehavior): void {
  const rect = target.getBoundingClientRect();
  const absoluteTop = rect.top + window.scrollY;
  const nextTop = absoluteTop - offset;
  window.scrollTo({ top: nextTop, behavior });
}

export type ScrollToAnchorOptions = {
  /** Override the scroll behavior. Defaults to smooth unless the user prefers reduced motion. */
  behavior?: ScrollBehavior;
  /** Skip observing the header for follow-up adjustments. */
  observeHeader?: boolean;
  /** Provide an explicit offset in pixels instead of reading --sticky-offset. */
  offset?: number;
  /** How long (ms) to keep the header observer alive for post-scroll alignment. */
  settleTimeout?: number;
};

/**
 * Smoothly scrolls the viewport so the given anchor is positioned just below the sticky header.
 * The helper re-reads --sticky-offset while the header animates to avoid ending up behind it.
 */
export function scrollToAnchor(target: string | HTMLElement | null, options?: ScrollToAnchorOptions): void {
  if (!isBrowser) return;
  const el = resolveTarget(target);
  if (!el) return;

  const reduceMotion = prefersReducedMotion();
  const behavior = options?.behavior ?? (reduceMotion ? "auto" : "smooth");
  const resolveOffset = () => (options?.offset ?? readStickyOffset());

  const header = options?.observeHeader === false
    ? null
    : (document.querySelector("header[data-collapsed]") as HTMLElement | null);

  const performScroll = (scrollBehavior: ScrollBehavior) => {
    scrollWindowTo(el, resolveOffset(), scrollBehavior);
  };

  performScroll(behavior);

  if (!header || !("ResizeObserver" in window)) {
    return;
  }

  const settleDelay = Math.max(0, options?.settleTimeout ?? 320);
  let raf = 0;

  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = window.requestAnimationFrame(() => performScroll("auto"));
  });

  ro.observe(header);

  window.setTimeout(() => {
    ro.disconnect();
    cancelAnimationFrame(raf);
    performScroll("auto");
  }, settleDelay);
}
