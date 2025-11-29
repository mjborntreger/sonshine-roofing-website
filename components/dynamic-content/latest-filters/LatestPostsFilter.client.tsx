"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import FilterTabs from "@/components/dynamic-content/FilterTabs";
import SmartLink from "@/components/utils/SmartLink";
import { ArrowRight } from "lucide-react";
import {
  POST_TAB_CONFIG,
  type CategoryKey,
  type TabConfig,
} from "@/components/dynamic-content/latest-filters/latest-tab-config";
import { renderHighlight } from "@/components/utils/renderHighlight";

const lessFatCta = "btn btn-ghost btn-sm md:btn-md w-auto";
const pStyles = "my-4 mb-6 text-center text-slate-500 justify-center text-sm md:text-md";

type TabPayload = {
  key: CategoryKey;
  totalCount: number;
  slugs: string[];
};

type CardLookup = Record<string, ReactNode>;

type Props = {
  showHeader: boolean;
  description: string;
  ctaHref: string;
  ctaLabel: string;
  tabs: TabPayload[];
  initialKey: CategoryKey;
  cardLookup: CardLookup;
  emptyState: ReactNode;
};

const CONFIG_LOOKUP = POST_TAB_CONFIG.reduce(
  (acc, tab) => {
    acc[tab.key] = tab;
    return acc;
  },
  {} as Record<CategoryKey, TabConfig<CategoryKey>>,
);

export default function LatestPostsFilter({
  showHeader,
  description,
  ctaHref,
  ctaLabel,
  tabs,
  initialKey,
  cardLookup,
  emptyState,
}: Props) {
  const [selected, setSelected] = useState<CategoryKey>(initialKey);

  const computedTabs = useMemo(
    () =>
      tabs.map((tab) => {
        const config = CONFIG_LOOKUP[tab.key];
        return {
          key: tab.key,
          label: config?.label ?? tab.key,
          icon: config?.icon,
          terms: [],
          totalCount: tab.totalCount,
          selectedCount: 0,
        };
      }),
    [tabs],
  );

  const active = useMemo(() => {
    const found = tabs.find((tab) => tab.key === selected);
    if (found) return found;
    return tabs[0] ?? null;
  }, [selected, tabs]);

  const renderFilterTabs = () => (
    <div className={`flex justify-center ${showHeader ? "mt-6" : "mb-8"}`}>
      <FilterTabs
        tabs={computedTabs}
        activeKey={selected}
        onTabChange={(key) => setSelected(key as CategoryKey)}
        isLoading={false}
        ariaLabel="Latest blog filters"
      >
        {() => null}
      </FilterTabs>
    </div>
  );
  const heading = "Latest Roofing Insights";
  const renderedHeading = renderHighlight(heading, "Roofing Insights");

  return (
    <div className="px-4 max-w-[1600px] mx-auto">
      {showHeader ? (
        <div className="text-center">
          <h2 className="mb-3 text-3xl text-slate-700 md:text-5xl md:mb-4">{renderedHeading}</h2>
          <div className="max-w-3xl mx-auto text-center">
            <p className={pStyles}>{description}</p>
          </div>
          {renderFilterTabs()}
        </div>
      ) : (
        renderFilterTabs()
      )}

      {showHeader && (
        <div className="mt-6 text-right">
          <SmartLink
            href={ctaHref}
            className={lessFatCta}
            title={ctaLabel}
            data-icon-affordance="right"
            proseGuard
          >
            {ctaLabel}
            <ArrowRight className="inline w-4 h-4 ml-2 icon-affordance" />
          </SmartLink>
        </div>
      )}

      <div key={selected} className="grid gap-6 mt-8 sm:grid-cols-2 md:grid-cols-4">
        {active && active.slugs.length > 0
          ? active.slugs.map((slug, index) => {
              const card = cardLookup[slug];
              if (!card) return null;
              return (
                <div
                  key={slug}
                  className="motion-safe:animate-lp-fade-in"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  {card}
                </div>
              );
            })
          : emptyState}
      </div>

      <style jsx global>{`
        @keyframes lp-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: none; }
        }
        .animate-lp-fade-in { animation: lp-fade-in .28s ease-out both; }
        /* Tailwind variant friendly: use with motion-safe:animate-lp-fade-in */
      `}</style>
    </div>
  );
}
