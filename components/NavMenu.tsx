"use client";
import SmartLink from "@/components/SmartLink";
import { useRef, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Phone,
  Zap,
  UserSearch,
  HandCoins,
  Hammer,
  Wrench,
  Search,
  ShieldCheck,
  PlayCircle,
  Newspaper,
  BookOpen,
  HelpCircle,
  Home as HomeIcon,
  Image as ImageIcon,
  HardHat,
  Menu,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/routes";
import { NAV_MAIN, ROUTES } from "@/lib/routes";

type Item = NavItem;
const NAV: Item[] = NAV_MAIN as Item[];

const NAV_ICONS: Record<string, LucideIcon> = {
  About: UserSearch,
  Financing: HandCoins,
  "Roofing Services": HardHat,
  "Roof Replacement": Hammer,
  "Roof Repair": Wrench,
  "Roof Inspection": Search,
  "Roof Maintenance": ShieldCheck,
  Resources: Wrench,
  "Project Gallery": ImageIcon,
  "Video Library": PlayCircle,
  Blog: Newspaper,
  "Roofing Glossary": BookOpen,
  FAQ: HelpCircle,
  Home: HomeIcon,
};

const TARGET_CHILD_PARENTS = new Set(["Roofing Services", "Resources"]);
const CHILD_CHEVRON_CLASS = "icon-affordance h-4 w-4 text-slate-400";

function MenuToggleIcon({ open }: { open: boolean }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return open ? (
      <X className="h-4 w-4 text-white" aria-hidden="true" />
    ) : (
      <Menu className="h-4 w-4 text-white" aria-hidden="true" />
    );
  }

  const transition = { duration: 0.16, ease: [0.32, 0, 0.67, 1] } as const;

  return (
    <span className="relative flex h-4 w-4 items-center justify-center" aria-hidden="true">
      <motion.span
        className="absolute h-[1.5px] w-full origin-center rounded-full bg-white"
        initial={false}
        animate={open ? { y: 0, rotate: 45 } : { y: -4, rotate: 0 }}
        transition={transition}
      />
      <motion.span
        className="absolute h-[1.5px] w-full rounded-full bg-white"
        initial={false}
        animate={open ? { opacity: 0, scaleX: 0.4 } : { opacity: 1, scaleX: 1 }}
        transition={transition}
      />
      <motion.span
        className="absolute h-[1.5px] w-full origin-center rounded-full bg-white"
        initial={false}
        animate={open ? { y: 0, rotate: -45 } : { y: 4, rotate: 0 }}
        transition={transition}
      />
    </span>
  );
}

function LabelWithIcon({ label, iconClassName }: { label: string; iconClassName?: string }) {
  const Icon = NAV_ICONS[label];
  return (
    <span className="inline-flex items-center">
      {Icon && (
        <Icon
          className={cn("h-4 w-4 inline mr-2", iconClassName ?? "text-[--brand-blue]")}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  );
}

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
function DesktopMenu({ transparent }: { transparent: boolean }) {
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
    <>
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
                className={cn(
                  "px-2 py-2 whitespace-nowrap flex items-center gap-1 transition-colors duration-200",
                  transparent ? "text-white hover:text-white/80" : "text-slate-700 hover:text-[--brand-blue]"
                )}
              >
                <LabelWithIcon
                  label={item.label}
                  iconClassName={transparent ? "text-[--brand-orange]" : "text-[--brand-blue]"}
                />
                {item.children && (
                  <>
                    {/* ANIM: Caret rotation speed — edit CARET_DURATION_MS (and/or Tailwind duration class) */}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 opacity-70 transition-transform duration-200",
                        openIndex === i ? "rotate-180" : "rotate-0",
                        transparent ? "text-white" : "text-slate-400"
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
                className={cn(
                  "px-2 py-2 whitespace-nowrap flex items-center gap-1 cursor-default transition-colors duration-200",
                  transparent ? "text-white hover:text-white/80" : "text-slate-700 hover:text-[--brand-blue]"
                )}
                aria-haspopup={item.children ? "menu" : undefined}
                aria-expanded={openIndex === i || undefined}
              >
                <LabelWithIcon
                  label={item.label}
                  iconClassName={transparent ? "text-[--brand-orange]" : "text-[--brand-blue]"}
                />
                {item.children && (
                  <>
                    {/* ANIM: Caret rotation speed — edit CARET_DURATION_MS (and/or Tailwind duration class) */}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 opacity-70 transition-transform duration-200",
                        openIndex === i ? "rotate-180" : "rotate-0",
                        transparent ? "text-white" : "text-slate-400"
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
                    "absolute left-0 top-full mt-2 min-w-[240px] rounded-3xl border bg-white border-slate-300 shadow-lg origin-top",
                    "transition-all duration-150 ease-out",
                    enteredPanel ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-1 scale-[0.98]"
                  )}
                  style={{ transitionDuration: `${PANEL_DURATION_MS}ms` }}
                  onMouseEnter={() => holdOpen(i)}
                  onMouseLeave={scheduleClose}
                >
                  <MenuLevel items={item.children} level={1} parentLabel={item.label} />
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
            <SmartLink href={ROUTES.contact} className="phone-affordance flex items-center gap-2">
              <Phone className="phone-affordance-icon h-4 w-4 text-white" aria-hidden="true" />
              Contact Us
            </SmartLink>
          </Button>
        </li>
      </ul>
    </>
  );
}

/* ===== Nested menu list (scoped hover) ===== */
function MenuLevel({ items, level, parentLabel }: { items: Item[]; level: number; parentLabel?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
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
        const showChevron = !hasKids && TARGET_CHILD_PARENTS.has(parentLabel ?? "");

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
                className="flex items-center justify-between gap-2 px-3 py-2 text-md text-slate-700 hover:bg-[#0045d7]/5 hover:text-[--brand-blue]"
                data-icon-affordance={showChevron ? "right" : undefined}
              >
                <LabelWithIcon label={child.label} />
                {hasKids ? (
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
                ) : (
                  showChevron ? (
                    <ChevronRight className={CHILD_CHEVRON_CLASS} aria-hidden="true" />
                  ) : null
                )}
              </SmartLink>
            ) : (
              <button
                type="button"
                className="w-full text-left flex items-center justify-between gap-2 px-3 py-2 text-md text-slate-700 hover:bg-slate-50 hover:text-brand-blue rounded-xl"
                aria-haspopup={hasKids ? "menu" : undefined}
                aria-expanded={openIndex === i || undefined}
                onClick={() => holdOpen(i)}
              >
                <LabelWithIcon label={child.label} />
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
                    "min-w-[240px] rounded3xl border bg-white shadow-lg origin-top-left",
                    "transition-all duration-150 ease-out",
                    entered ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-1 scale-[0.98]"
                  )}
                  style={{ transitionDuration: `${PANEL_DURATION_MS}ms` }}
                >
                  {/* optional invisible bridge in case of super fast mouse moves */}
                  <div className="pointer-events-none absolute -left-2 top-0 h-full w-3" />
                  <div className="pointer-events-auto">
                    <MenuLevel
                      items={child.children!}
                      level={level + 1}
                      parentLabel={child.label}
                    />
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
      return () => cancelAnimationFrame(id);
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
          const { [key]: removedEntry, ...rest } = e;
          void removedEntry;
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
        className="rounded-full border px-4 py-2 text-white bg-[--brand-blue]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-haspopup="menu"
        data-open={open}
      >
        <span className="inline-flex items-center gap-2">
          <span className="font-medium">Menu</span>
          <MenuToggleIcon open={open} />
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
                       rounded-3xl border bg-neutral-100 shadow-xl p-2
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
                  href={ROUTES.home}
                  className="flex w-full px-3 py-2 rounded-2xl text-slate-800 hover:bg-neutral-200"
                  onClick={() => setOpen(false)}
                >
                  <LabelWithIcon label="Home" />
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
                        className="flex w-full items-center justify-between px-3 py-2 rounded-2xl text-slate-800 hover:bg-neutral-200"
                        onClick={() => setOpen(false)}
                      >
                        <LabelWithIcon label={item.label} />
                      </SmartLink>
                    ) : (
                      <div className="flex items-center justify-between">
                        {item.href ? (
                          <SmartLink
                            href={item.href}
                            className="block flex-1 min-w-0 text-left px-3 py-2 rounded-2xl text-slate-800 hover:bg-neutral-200"
                            onClick={() => setOpen(false)}
                          >
                            <LabelWithIcon label={item.label} />
                          </SmartLink>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggle(k)}
                            aria-expanded={!!expanded[k]}
                            aria-controls={`section-${k}`}
                            className="px-3 py-2 rounded-2xl text-slate-800 hover:bg-neutral-200 text-left flex-1"
                          >
                            <LabelWithIcon label={item.label} />
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
                          const childHasKids = !!c.children?.length;
                          const showChevron = !childHasKids && TARGET_CHILD_PARENTS.has(item.label);
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
                                  className="flex w-full items-center justify-between px-3 py-2 rounded-2xl text-slate-700 hover:bg-neutral-200"
                                  data-icon-affordance={showChevron ? "right" : undefined}
                                  onClick={() => setOpen(false)}
                                >
                                  <LabelWithIcon label={c.label} />
                                  {showChevron ? (
                                    <ChevronRight className={CHILD_CHEVRON_CLASS} aria-hidden="true" />
                                  ) : null}
                                </SmartLink>
                              ) : (
                                <span className="block px-3 py-2 text-slate-700">
                                  <LabelWithIcon label={c.label} />
                                </span>
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
                <Button asChild className="w-full h-8 mt-4" variant="brandOrange" size="lg">
                  <SmartLink
                    href={"https://www.myquickroofquote.com/contractors/sonshine-roofing" as Route}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-x-2"
                  >
                    <Zap className="w-4 h-4 text-white" aria-hidden="true" />
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
                    href={ROUTES.contact}
                    onClick={() => setOpen(false)}
                    className="phone-affordance flex items-center justify-center gap-x-2"
                  >
                    <Phone className="phone-affordance-icon w-4 h-4 shrink-0 text-white" aria-hidden="true" />
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

type NavMenuProps = {
  transparent: boolean;
};

export function NavMenu({ transparent }: NavMenuProps) {
  return (
    <nav className="ml-auto flex items-center gap-3">
      <DesktopMenu transparent={transparent} />
      <MobileMenu />
    </nav>
  );
}
