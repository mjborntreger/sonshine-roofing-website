"use client";
import SmartLink from "@/components/SmartLink";
import { useRef, useState, useEffect } from "react";
import { ChevronDown, Phone, Zap, BadgeCheck, ArrowUpRight } from "lucide-react";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Item = { label: string; href?: Route; children?: Item[] };

const NAV = [
  { label: "About", href: "/about-sonshine-roofing" as Route },
  {
    label: "Roofing Services", children: [
      { label: "Roof Replacement", href: "/roof-replacement-sarasota-fl" as Route },
      { label: "Roof Repair", href: "/roof-repair" as Route },
      { label: "Roof Inspection", href: "/roof-inspection" as Route },
      { label: "Roof Maintenance", href: "/roof-maintenance" as Route },
    ]
  },
  {
    label: "Resources", children: [
      { label: "Project Gallery", href: "/project" as Route },
      { label: "Financing", href: "/financing" as Route },
      { label: "Video Library", href: "/video-library" as Route },
      { label: "Blog", href: "/blog" as Route },
      { label: "Roofing Glossary", href: "/roofing-glossary" as Route },
      { label: "FAQ", href: "/faq" as Route },
    ]
  },
] satisfies Item[];

/* ===== Animation tuning knobs (edit these values to adjust speeds/delays) ===== */
// Close-delay when the cursor leaves a menu (hover intent)
const HOVER_CLOSE_DELAY_MS = 120;
// Container fade+lift duration for dropdown/flyout panels
const PANEL_DURATION_MS = 150;
// Chevron/caret rotation duration
const CARET_DURATION_MS = 200;
// Stagger timings for list items
const ITEM_STAGGER_BASE_MS = 70; // first item delay
const ITEM_STAGGER_STEP_MS = 50; // per-item additional delay
const LEVEL_BONUS_MS = 20;       // extra delay per nested level (deeper = later)
// Mobile-only: top-level staggering and CTA offsets
const MOBILE_TOP_STAGGER_BASE_MS = 70;
const MOBILE_CTA1_DELAY_MS = 70;  // "Free 60-second Quote"
const MOBILE_CTA2_DELAY_MS = 100; // "Contact Us"

/* ===== Desktop (fixed) ===== */
function DesktopMenu() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [enteredPanel, setEnteredPanel] = useState(false);

  const holdOpen = (i: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenIndex(i);
    setEnteredPanel(false);
    // defer to next frame so transitions can see initial state
    requestAnimationFrame(() => setEnteredPanel(true));
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setEnteredPanel(false);
      setOpenIndex(null);
    }, HOVER_CLOSE_DELAY_MS);
  };

  return (
    <ul className="hidden lg:flex items-center gap-4">
      {NAV.map((item, i) => (
        <li
          key={item.label}
          className="relative"
          onMouseEnter={() => holdOpen(i)}
          onMouseLeave={scheduleClose}
        >
          {item.href ? (
            <SmartLink
              href={item.href}
              className="px-2 py-2 text-slate-700 hover:text-[--brand-blue] whitespace-nowrap flex items-center gap-1"
            >
              {item.label}
              {item.children && (
                <>
                  {/* ANIM: Caret rotation speed — edit CARET_DURATION_MS (and/or Tailwind duration class) */}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 opacity-70 transition-transform duration-200",
                      openIndex === i ? "rotate-180" : "rotate-0"
                    )}
                    style={{ transitionDuration: `${CARET_DURATION_MS}ms` }}
                    aria-hidden="true"
                  />
                </>
              )}
            </SmartLink>
          ) : (
            <button
              type="button"
              className="px-2 py-2 text-slate-700 hover:text-[--brand-blue] whitespace-nowrap flex items-center gap-1 cursor-default"
              aria-haspopup={item.children ? "menu" : undefined}
              aria-expanded={openIndex === i || undefined}
            >
              {item.label}
              {item.children && (
                <>
                  {/* ANIM: Caret rotation speed — edit CARET_DURATION_MS (and/or Tailwind duration class) */}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 opacity-70 transition-transform duration-200",
                      openIndex === i ? "rotate-180" : "rotate-0"
                    )}
                    style={{ transitionDuration: `${CARET_DURATION_MS}ms` }}
                    aria-hidden="true"
                  />
                </>
              )}
            </button>
          )}

          {item.children && openIndex === i && (
            <>
              {/* ANIM: Panel fade+lift speed — edit PANEL_DURATION_MS (and/or Tailwind 'duration-150') */}
              <div
                className={cn(
                  "absolute left-0 top-full mt-2 min-w-[240px] rounded-2xl border bg-white border-slate-300 shadow-lg origin-top",
                  "transition-all duration-150 ease-out",
                  enteredPanel ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-1 scale-[0.98]"
                )}
                style={{ transitionDuration: `${PANEL_DURATION_MS}ms` }}
                onMouseEnter={() => holdOpen(i)}
                onMouseLeave={scheduleClose}
              >
                <MenuLevel items={item.children} level={1} />
              </div>
            </>
          )}
        </li>
      ))}

      <li className="pl-2">
        <Button asChild size="sm" variant="brandOrange">
          <SmartLink
            href={"https://www.myquickroofquote.com/contractors/sonshine-roofing" as Route}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4 text-white" aria-hidden="true" />
            Free 60-second Quote
          </SmartLink>
        </Button>
      </li>

      <li className="pl-2">
        <Button asChild size="sm" variant="brandBlue">
          <SmartLink href={"/contact-us" as Route} className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-white" aria-hidden="true" />
            Contact Us
          </SmartLink>
        </Button>
      </li>
    </ul>
  );
}

/* ===== Nested menu list (scoped hover) ===== */
function MenuLevel({ items, level }: { items: Item[]; level: number }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id as any);
  }, []);

  const holdOpen = (i: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenIndex(i);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenIndex(null), 120);
  };

  return (
    <ul className={cn("py-2", level > 1 && "px-2")}>
      {items.map((child, i) => {
        const hasKids = !!child.children?.length;

        return (
          <li
            key={child.label}
            className={cn(
              "relative transition-all duration-150 ease-out",
              entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
            )}
            style={{ transitionDelay: `${Math.min(300, ITEM_STAGGER_BASE_MS + i * ITEM_STAGGER_STEP_MS + (level - 1) * LEVEL_BONUS_MS)}ms` }}
            onMouseEnter={() => holdOpen(i)}
            onMouseLeave={scheduleClose}
          >
            {child.href ? (
              <SmartLink
                href={child.href}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-[#0045d7]/5 hover:text-[--brand-blue]"
              >
                <span>{child.label}</span>
                {hasKids && (
                  <>
                    {/* ANIM: Nested caret rotation — edit CARET_DURATION_MS */}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 opacity-70 transition-transform duration-200",
                        openIndex === i ? "rotate-90" : "-rotate-90"
                      )}
                      style={{ transitionDuration: `${CARET_DURATION_MS}ms` }}
                      aria-hidden="true"
                    />
                  </>
                )}
              </SmartLink>
            ) : (
              <button
                type="button"
                className="w-full text-left flex items-center justify-between gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-blue rounded-xl"
                aria-haspopup={hasKids ? "menu" : undefined}
                aria-expanded={openIndex === i || undefined}
                onClick={() => holdOpen(i)}
              >
                <span>{child.label}</span>
                {hasKids && (
                  <>
                    {/* ANIM: Nested caret rotation — edit CARET_DURATION_MS */}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 opacity-70 transition-transform duration-200",
                        openIndex === i ? "rotate-90" : "-rotate-90"
                      )}
                      style={{ transitionDuration: `${CARET_DURATION_MS}ms` }}
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>
            )}

            {hasKids && openIndex === i && (
              <>
                {/* ANIM: Panel fade+lift speed — edit PANEL_DURATION_MS (and/or Tailwind 'duration-150') */}
                <div
                  // keep open while inside the flyout
                  onMouseEnter={() => holdOpen(i)}
                  onMouseLeave={scheduleClose}
                  className={cn(
                    "md:absolute md:left-full md:top-0",
                    "md:pl-2",
                    "min-w-[240px] rounded-2xl border bg-white shadow-lg origin-top-left",
                    "transition-all duration-150 ease-out",
                    entered ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-1 scale-[0.98]"
                  )}
                  style={{ transitionDuration: `${PANEL_DURATION_MS}ms` }}
                >
                  {/* optional invisible bridge in case of super fast mouse moves */}
                  <div className="pointer-events-none absolute -left-2 top-0 h-full w-3" />
                  <div className="pointer-events-auto">
                    <MenuLevel items={child.children!} level={level + 1} />
                  </div>
                </div>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ===== Mobile ===== */
function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [entered, setEntered] = useState<Record<string, boolean>>({});
  const [enteredTop, setEnteredTop] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // lock scroll when open
  const prevOverflow = useRef<string>("");
  useEffect(() => {
    if (open) {
      prevOverflow.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prevOverflow.current || "";
    }
    return () => { document.body.style.overflow = prevOverflow.current || ""; };
  }, [open]);

  // Close on click outside or ESC
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setEnteredTop(false);
      const id = requestAnimationFrame(() => setEnteredTop(true));
      return () => cancelAnimationFrame(id as any);
    }
    setEnteredTop(false);
  }, [open]);

  const toggle = (key: string) =>
    setExpanded((s) => {
      const next = { ...s, [key]: !s[key] };
      if (!s[key] && !entered[key]) {
        requestAnimationFrame(() =>
          setEntered((e) => ({ ...e, [key]: true }))
        );
      }
      if (s[key]) {
        // collapsing: remove entered to allow re-animate next time
        setEntered((e) => {
          const { [key]: _, ...rest } = e;
          return rest;
        });
      }
      return next;
    });

  return (
    <div className="lg:hidden ml-auto">
      <button
        type="button"
        ref={buttonRef}
        className="text-white border rounded-lg px-3 py-2 bg-[--brand-blue]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-haspopup="menu"
      >
        <span className="inline-flex items-center gap-1 transition-transform duration-200">
          Menu
          {/* ANIM: Mobile caret rotation — edit CARET_DURATION_MS */}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              open ? "rotate-180" : "rotate-0"
            )}
            style={{ transitionDuration: `${CARET_DURATION_MS}ms` }}
          />
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]">
          {/* backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0"
            onClick={() => setOpen(false)}
          />

          {/* floating panel */}
          <div
            id="mobile-nav"
            ref={panelRef}
            role="menu"
            aria-label="Main"
            className="fixed left-2 right-2 z-[61]
                       rounded-2xl border bg-white shadow-xl p-2
                       top-[calc(var(--header-h,56px)+8px)]
                       max-h-[calc(100vh-var(--header-h,56px)-24px)] overflow-auto"
          >
            <ul className="space-y-1">
              <li
                className={cn(
                  "transition-all duration-150 ease-out",
                  enteredTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                )}
                // ANIM: Mobile Home item stagger — base
                style={{ transitionDelay: `${MOBILE_TOP_STAGGER_BASE_MS}ms` }}
              >
                <SmartLink
                  href={"/" as Route}
                  className="flex w-full px-3 py-2 rounded-xl text-slate-800 hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  Home
                </SmartLink>
              </li>
              <hr className="my-1 border-slate-200" />
              {NAV.map((item, i) => {
                const k = `lv1-${i}`;
                const hasChildren = !!item.children?.length;
                return (
                  <li
                    key={k}
                    className={cn(
                      "transition-all duration-150 ease-out",
                      enteredTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                    )}
                    // ANIM: Mobile top-level stagger — base + per-item step
                    style={{ transitionDelay: `${Math.min(300, MOBILE_TOP_STAGGER_BASE_MS + i * ITEM_STAGGER_STEP_MS)}ms` }}
                  >
                    {!hasChildren && item.href ? (
                      <SmartLink
                        href={item.href}
                        className="flex w-full items-center justify-between px-3 py-2 rounded-xl text-slate-800 hover:bg-slate-50"
                        onClick={() => setOpen(false)}
                      >
                        <span>{item.label}</span>
                      </SmartLink>
                    ) : (
                      <div className="flex items-center justify-between">
                        {item.href ? (
                          <SmartLink
                            href={item.href}
                            className="block flex-1 min-w-0 text-left px-3 py-2 rounded-xl text-slate-800 hover:bg-slate-50"
                            onClick={() => setOpen(false)}
                          >
                            {item.label}
                          </SmartLink>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggle(k)}
                            aria-expanded={!!expanded[k]}
                            aria-controls={`section-${k}`}
                            className="px-3 py-2 rounded-xl text-slate-800 hover:bg-slate-50 text-left flex-1"
                          >
                            {item.label}
                          </button>
                        )}
                        {hasChildren && (
                          <button
                            type="button"
                            onClick={() => toggle(k)}
                            aria-expanded={!!expanded[k]}
                            aria-controls={`section-${k}`}
                            className="p-2"
                          >
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                expanded[k] ? "rotate-180" : "rotate-0"
                              )}
                              aria-hidden="true"
                            />
                          </button>
                        )}
                      </div>
                    )}

                    {hasChildren && expanded[k] && (
                      <ul id={`section-${k}`} className="ml-2 border-l pl-3 py-1 group" data-open={!!expanded[k]}>
                        {item.children!.map((c, j) => {
                          const ck = `lv2-${i}-${j}`;
                          return (
                            <li
                              key={ck}
                              className={cn(
                                "py-1 transition-all duration-150 ease-out",
                                entered[k] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                              )}
                              // ANIM: Mobile child stagger — base + per-item step
                              style={{ transitionDelay: `${Math.min(300, ITEM_STAGGER_BASE_MS + j * ITEM_STAGGER_STEP_MS)}ms` }}
                            >
                              {c.href ? (
                                <SmartLink
                                  href={c.href}
                                  className="flex w-full items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50"
                                  onClick={() => setOpen(false)}
                                >
                                  <span>{c.label}</span>
                                </SmartLink>
                              ) : (
                                <span className="block px-3 py-2 text-slate-700">{c.label}</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
              <li
                className={cn(
                  "transition-all duration-150 ease-out",
                  enteredTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                )}
                // ANIM: Mobile CTA1 stagger — base + NAV length step
                style={{ transitionDelay: `${Math.min(380, MOBILE_CTA1_DELAY_MS + NAV.length * ITEM_STAGGER_STEP_MS)}ms` }}
              >
                <Button asChild className="w-full h-8 mt-4" variant="brandOrange">
                  <SmartLink
                    href={"https://www.myquickroofquote.com/contractors/sonshine-roofing" as Route}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-x-2"
                  >
                    <Zap className="w-4 h-4 shrink-0 text-white" aria-hidden="true" />
                    Free 60-second Quote
                  </SmartLink>
                </Button>
              </li>
              <li
                className={cn(
                  "transition-all duration-150 ease-out",
                  enteredTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                )}
                // ANIM: Mobile CTA2 stagger — base + NAV length step
                style={{ transitionDelay: `${Math.min(420, MOBILE_CTA2_DELAY_MS + NAV.length * ITEM_STAGGER_STEP_MS)}ms` }}
              >
                <Button asChild className="w-full h-8 mt-1 mb-2" variant="brandBlue">
                  <SmartLink
                    href={"/contact-us" as Route}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-x-2"
                  >
                    <Phone className="w-4 h-4 shrink-0 text-white" aria-hidden="true" />
                    Contact Us
                  </SmartLink>
                </Button>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function PhoneLink() {
  return (
    <a
      href="tel:+19418664320"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Call SonShine Roofing"
      className="text-xs md:text-sm font-semibold text-[--brand-blue] items-center"
    >
      <Phone className="mr-1 inline h-3 w-3 md:h-4 md:w-4 text-[--brand-blue] font-semibold" aria-hidden="true" />
      <span>(941) 866-4320</span>
    </a>
  )
}

export function NavMenu() {
  return (
    <nav className="ml-auto flex items-center gap-3">
      <PhoneLink />
      <DesktopMenu />
      <MobileMenu />
    </nav>
  );
}
