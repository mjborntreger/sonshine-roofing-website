"use client";

import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import type { TermLite } from "@/lib/wp";

type TabKey = "material" | "roof" | "area";

type FilterTabsProps = {
  tabs: Array<{
    key: TabKey;
    label: string;
    terms: TermLite[];
  }>;
  activeKey: TabKey;
  onTabChange: (key: TabKey) => void;
  isLoading: boolean;
  children: (tab: TabKey) => ReactNode;
};

export default function FilterTabs({ tabs, activeKey, onTabChange, isLoading, children }: FilterTabsProps) {
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
    const map = { material: 0, roof: 0, area: 0 } as Record<TabKey, number>;
    orderedTabs.forEach((tab, index) => {
      map[tab.key] = index;
    });
    return map;
  }, [orderedTabs]);
  const activeIndex = indexMap[activeKey];

  return (
    <div className="mt-6">
      <div
        role="tablist"
        aria-label="Project filters"
        className="flex flex-wrap items-center gap-2 border-b border-slate-300 pb-2"
      >
        {orderedTabs.map((tab) => {
          const selected = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={selected}
              aria-controls={`project-tab-panel-${tab.key}`}
              data-tab={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--brand-blue] ${
                selected
                  ? "bg-[--brand-blue] text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
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
