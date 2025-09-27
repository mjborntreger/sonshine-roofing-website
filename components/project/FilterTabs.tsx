"use client";

import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import type { TermLite } from "@/lib/wp";
import { Layers, MapPin, Palette } from "lucide-react";

type TabKey = string;

type TabTerm = TermLite & { count: number };

const numberFormatter = new Intl.NumberFormat("en-US");

type LucideIconComponent = typeof Layers;

const tabIcons: Record<string, LucideIconComponent> = {
  material: Layers,
  roof: Palette,
  area: MapPin,
};

type FilterTabsProps = {
  tabs: Array<{
    key: TabKey;
    label: string;
    terms: TabTerm[];
    totalCount: number;
    selectedCount: number;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  activeKey: TabKey;
  onTabChange: (key: TabKey) => void;
  isLoading: boolean;
  children: (tab: TabKey) => ReactNode;
  ariaLabel?: string;
};

export default function FilterTabs({
  tabs,
  activeKey,
  onTabChange,
  isLoading,
  children,
  ariaLabel = "Filters",
}: FilterTabsProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef<number>(0);

  useEffect(() => {
    if (!panelRef.current || typeof ResizeObserver === "undefined") return;

    const panelEl = panelRef.current;
    const computeHeight = () => {
      const childHeights = Array.from(panelEl.children).map((child) => (child as HTMLElement).scrollHeight);
      const max = Math.max(0, ...childHeights);
      if (max !== heightRef.current) {
        heightRef.current = max;
        panelEl.style.setProperty("min-height", `${max}px`);
      }
    };

    computeHeight();

    const observer = new ResizeObserver(() => computeHeight());
    Array.from(panelEl.children).forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [tabs]);

  const orderedTabs = useMemo(() => tabs, [tabs]);
  const indexMap = useMemo(() => {
    const map: Record<string, number> = {};
    orderedTabs.forEach((tab, index) => {
      map[tab.key] = index;
    });
    return map;
  }, [orderedTabs]);
  const activeIndex = indexMap[activeKey];

  return (
    <div className="mt-2">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex-wrap items-center justify-start gap-1 rounded-full border border-slate-300 bg-slate-100/70 p-1"
      >
        {orderedTabs.map((tab) => {
          const selected = tab.key === activeKey;
          const formattedTotal = numberFormatter.format(tab.totalCount);
          const formattedSelected = numberFormatter.format(tab.selectedCount);
          const selectionMessage =
            tab.selectedCount > 0
              ? `${formattedSelected} filter${tab.selectedCount === 1 ? "" : "s"} active`
              : "No filters active";
          const totalMessage =
            tab.totalCount > 0
              ? `${formattedTotal} result${tab.totalCount === 1 ? "" : "s"} available`
              : "No results available";
          const FallbackIcon = tabIcons[tab.key as keyof typeof tabIcons] ?? Layers;
          const Icon = (tab as any).icon ?? FallbackIcon;
          const iconClass = selected
            ? "h-4 w-4 text-white transition-colors flex-wrap mr-1"
            : "h-4 w-4 text-[--brand-orange] transition-colors flex-wrap mr-1";
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={selected}
              aria-controls={`project-tab-panel-${tab.key}`}
              data-tab={tab.key}
              onClick={() => onTabChange(tab.key)}
              aria-label={`${tab.label} tab. ${totalMessage}. ${selectionMessage}.`}
              className={`relative rounded-full px-2 py-1.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--brand-orange] px-3 ${
                selected
                  ? "border-[--brand-orange] bg-[--brand-orange] text-white shadow-sm"
                  : "border-[--brand-orange]/40 bg-[--brand-orange]/10 text-slate-500 hover:bg-[--brand-orange]/20"
              }`}
            >
              <span className="flex items-center gap-1 whitespace-normal text-pretty leading-tight tracking-tight flex-row items-center gap-1">
                <Icon aria-hidden="true" className={iconClass} />
                <span className="max-w-[140px] whitespace-normal">{tab.label}</span>
              </span>
              {tab.selectedCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1.5 -right-1.5 inline-flex h-2 w-2 items-center justify-center rounded-full bg-[--brand-blue] shadow ring-[3px] ring-white"
                />
              )}
            </button>
          );
        })}
      </div>

      <div ref={panelRef} className="relative mt-4 overflow-hidden">
        {orderedTabs.map((tab) => {
          const active = tab.key === activeKey;
          const tabIndex = indexMap[tab.key];
          const direction = tabIndex < activeIndex ? "-translate-x-3" : "translate-x-3";
          const transformClasses = active ? "translate-x-0 opacity-100" : `${direction} opacity-0`;
          return (
            <div
              key={tab.key}
              id={`project-tab-panel-${tab.key}`}
              role="tabpanel"
              aria-hidden={!active}
              className={`absolute inset-0 transition-all duration-200 ease-out ${transformClasses} ${
                active ? "pointer-events-auto" : "pointer-events-none"
              }`}
              tabIndex={active ? 0 : -1}
            >
              {children(tab.key)}
            </div>
          );
        })}
      </div>
      {isLoading && (
        <span className="sr-only">Filters updating…</span>
      )}
    </div>
  );
}
